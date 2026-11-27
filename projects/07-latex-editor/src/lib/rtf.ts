import { readImageDimensions } from "./image-utils";
import {
  languageToRtfLcid,
  resolveLatexLengthToTwips,
  type LatexImage,
  type LatexPageGeometry,
} from "./latex-semantics";
import type { MathEquationSpec, RenderedEquation } from "./math-raster";

/**
 * Filtro Lua ejecutado por Pandoc al exportar a RTF:
 * 1) Numera encabezados (omitiendo .unnumbered como \section*) igual que LaTeX.
 * 2) Extrae todas las DisplayMath (en párrafo propio) y las InlineMath no lineales
 *    para renderizarlas con pdflatex a PNG 300 DPI.
 * 3) Conserva los pies de figura (\caption{...}), que el writer RTF de Pandoc 2.17 descarta.
 */
export const RTF_LUA_FILTER = `
local eqs = {}
local fig_idx = 0
local counters = {0, 0, 0, 0, 0, 0}

local COMPLEX_PATTERNS = {
  "\\\\frac", "\\\\dfrac", "\\\\tfrac", "\\\\cfrac",
  "\\\\sqrt", "\\\\sum", "\\\\prod", "\\\\coprod",
  "\\\\int", "\\\\oint", "\\\\iint", "\\\\iiint",
  "\\\\lim", "\\\\limsup", "\\\\liminf",
  "\\\\begin%s*{", "\\\\binom", "\\\\dbinom", "\\\\tbinom",
  "\\\\overline", "\\\\underline", "\\\\overbrace", "\\\\underbrace",
  "\\\\widehat", "\\\\widetilde", "\\\\overrightarrow", "\\\\overleftarrow",
  "\\\\vec%s*{", "\\\\hat%s*{", "\\\\tilde%s*{", "\\\\bar%s*{",
  "\\\\dot%s*{", "\\\\ddot%s*{", "\\\\stackrel", "\\\\overset", "\\\\underset",
  "\\\\matrix", "\\\\pmatrix", "\\\\bmatrix", "\\\\cases",
  "\\\\left", "\\\\right", "\\\\not%s", "\\\\cancel", "\\\\substack",
  "\\\\choose", "\\\\over%A"
}

local function is_complex_inline(tex)
  for _, pat in ipairs(COMPLEX_PATTERNS) do
    if string.find(tex, pat) then
      return true
    end
  end
  return false
end

local function register_eq(is_display, tex)
  local id = #eqs
  eqs[id + 1] = { id = id, display = is_display, tex = tex }
  return id
end

local function has_class(el, cls)
  if not el.classes then return false end
  for _, c in ipairs(el.classes) do
    if c == cls then return true end
  end
  return false
end

local function trim_edge_spaces(inlines)
  while #inlines > 0 and (inlines[1].t == "Space" or inlines[1].t == "SoftBreak") do
    table.remove(inlines, 1)
  end
  while #inlines > 0 and (inlines[#inlines].t == "Space" or inlines[#inlines].t == "SoftBreak") do
    table.remove(inlines, #inlines)
  end
  return inlines
end

local function process_inlines_for_inline_math(inlines)
  local out = {}
  for _, item in ipairs(inlines) do
    if item.t == "Math" and item.mathtype == "InlineMath" and is_complex_inline(item.text) then
      local id = register_eq(false, item.text)
      table.insert(out, pandoc.Str("TALLERINLINEEQ" .. id .. "END"))
    elseif item.content and type(item.content) == "table" and item.t ~= "Code" and item.t ~= "Math" then
      item.content = process_inlines_for_inline_math(item.content)
      table.insert(out, item)
    else
      table.insert(out, item)
    end
  end
  return out
end

local function process_blocks(blocks)
  local out = {}
  for _, blk in ipairs(blocks) do
    if blk.t == "Header" then
      if not has_class(blk, "unnumbered") and blk.level >= 1 and blk.level <= 3 then
        counters[blk.level] = counters[blk.level] + 1
        for k = blk.level + 1, 6 do counters[k] = 0 end
        local parts = {}
        for k = 1, blk.level do table.insert(parts, tostring(counters[k])) end
        local num = table.concat(parts, ".")
        table.insert(blk.content, 1, pandoc.Space())
        table.insert(blk.content, 1, pandoc.Str(num))
      end
      blk.content = process_inlines_for_inline_math(blk.content)
      table.insert(out, blk)

    elseif blk.t == "Para" or blk.t == "Plain" then
      -- Caso figura de Pandoc: Para [ Image (attr, caption, (src, "fig:")) ]
      if #blk.content == 1 and blk.content[1].t == "Image" then
        local img = blk.content[1]
        local idx = fig_idx
        fig_idx = fig_idx + 1
        table.insert(out, blk)
        if img.title == "fig:" and img.caption and #img.caption > 0 then
          local cap_inlines = { pandoc.Str("TALLERFIGCAP" .. idx .. "START"), pandoc.Space() }
          for _, c in ipairs(process_inlines_for_inline_math(img.caption)) do
            table.insert(cap_inlines, c)
          end
          table.insert(out, pandoc.Para(cap_inlines))
        end
      else
        -- Contar imágenes sueltas en el párrafo y separar DisplayMath en párrafos propios
        local cur = {}
        local function flush_cur()
          trim_edge_spaces(cur)
          if #cur > 0 then
            table.insert(out, pandoc.Para(process_inlines_for_inline_math(cur)))
            cur = {}
          end
        end
        for _, inl in ipairs(blk.content) do
          if inl.t == "Image" then
            fig_idx = fig_idx + 1
            table.insert(cur, inl)
          elseif inl.t == "Math" and inl.mathtype == "DisplayMath" then
            flush_cur()
            local id = register_eq(true, inl.text)
            table.insert(out, pandoc.Para({ pandoc.Str("TALLERDISPLAYEQ" .. id .. "END") }))
          else
            table.insert(cur, inl)
          end
        end
        flush_cur()
      end

    elseif blk.t == "BlockQuote" or blk.t == "Div" then
      blk.content = process_blocks(blk.content)
      table.insert(out, blk)

    elseif blk.t == "BulletList" or blk.t == "OrderedList" then
      for i, item in ipairs(blk.content) do
        blk.content[i] = process_blocks(item)
      end
      table.insert(out, blk)

    else
      table.insert(out, blk)
    end
  end
  return out
end

function Pandoc(doc)
  doc.blocks = process_blocks(doc.blocks)
  local f = io.open("taller-rtf-eqs.tsv", "w")
  if f then
    for _, e in ipairs(eqs) do
      local safe = e.tex:gsub("\\\\", "\\\\\\\\"):gsub("\\r", ""):gsub("\\n", "\\\\n"):gsub("\\t", "\\\\t")
      f:write(tostring(e.id) .. "\\t" .. (e.display and "1" or "0") .. "\\t" .. safe .. "\\n")
    end
    f:close()
  end
  return doc
end
`;

export function parseRtfEquationsTsv(raw: string): MathEquationSpec[] {
  const out: MathEquationSpec[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    const t1 = line.indexOf("\t");
    const t2 = t1 >= 0 ? line.indexOf("\t", t1 + 1) : -1;
    if (t1 < 0 || t2 < 0) continue;
    const id = Number(line.slice(0, t1));
    const display = line.slice(t1 + 1, t2) === "1";
    const escaped = line.slice(t2 + 1);
    let tex = "";
    for (let i = 0; i < escaped.length; i++) {
      if (escaped[i] === "\\" && i + 1 < escaped.length) {
        const next = escaped[i + 1];
        if (next === "n") {
          tex += "\n";
          i++;
          continue;
        }
        if (next === "t") {
          tex += "\t";
          i++;
          continue;
        }
        if (next === "\\") {
          tex += "\\";
          i++;
          continue;
        }
      }
      tex += escaped[i];
    }
    if (Number.isFinite(id)) out.push({ id, display, tex });
  }
  return out;
}

function rtfAlignCmd(alignment?: "left" | "center" | "right"): string {
  if (alignment === "center") return "\\qc";
  if (alignment === "right") return "\\qr";
  return "\\ql";
}

function escapeRtfPlainText(s: string): string {
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0;
    if (ch === "\\" || ch === "{" || ch === "}") out += `\\${ch}`;
    else if (code < 128) out += ch;
    else {
      const signed = code > 32767 ? code - 65536 : code;
      out += `\\u${signed}?`;
    }
  }
  return out;
}

function hexFromBuffer(buf: Buffer): string {
  const hex = buf.toString("hex");
  // Partir en líneas de 128 chars para compatibilidad con lectores RTF antiguos
  const chunks: string[] = [];
  for (let i = 0; i < hex.length; i += 128) {
    chunks.push(hex.slice(i, i + 128));
  }
  return chunks.join("\n");
}

function buildPngPictGroup(eq: RenderedEquation): string {
  return `{\\pict\\pngblip\\picw${eq.widthPx}\\pich${eq.heightPx}\\picwgoal${eq.widthTwips}\\pichgoal${eq.heightTwips}\\picscalex100\\picscaley100\n${hexFromBuffer(eq.png)}\n}`;
}

interface PictSpan {
  start: number;
  end: number;
  pardStart: number;
}

/** Localiza cada grupo {\pict...} en O(N) lineal sin regex sobre blobs hexadecimales. */
function findPictSpans(rtf: string): PictSpan[] {
  const spans: PictSpan[] = [];
  let pos = 0;
  while (true) {
    const start = rtf.indexOf("{\\pict", pos);
    if (start === -1) break;
    let depth = 0;
    let end = start;
    while (end < rtf.length) {
      const ch = rtf[end];
      if (ch === "\\") {
        end += 2;
        continue;
      }
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          end++;
          break;
        }
      }
      end++;
    }
    const pardStart = rtf.lastIndexOf("{\\pard", start);
    spans.push({ start, end, pardStart });
    pos = end;
  }
  return spans;
}

function parsePictBlob(pictGroup: string): { blip: "jpegblip" | "pngblip"; hex: string } | null {
  const isPng = /\\pngblip\b/.test(pictGroup.slice(0, 160));
  const isJpeg = /\\jpegblip\b/.test(pictGroup.slice(0, 160));
  if (!isPng && !isJpeg) return null;

  // El hex comienza tras el primer espacio o salto de línea después de las palabras de control de \pict
  const m = /^\{\\pict(?:\\[a-zA-Z]+-?\d*)*[\s]+([\s\S]*)\}$/.exec(pictGroup);
  if (!m) return null;
  const hex = m[1].replace(/\s+/g, "");
  if (hex.length < 16) return null;
  return { blip: isPng ? "pngblip" : "jpegblip", hex };
}

function setPardAlignment(rtf: string, pardStart: number, pictStart: number, alignCmd: string): string {
  if (pardStart < 0 || pardStart >= pictStart) return rtf;
  const header = rtf.slice(pardStart, pictStart);
  const replaced = /\\q[lcrj]\b/.test(header)
    ? header.replace(/\\q[lcrj]\b/, alignCmd)
    : header.replace(/^\{\\pard\b/, `{\\pard ${alignCmd}`);
  return rtf.slice(0, pardStart) + replaced + rtf.slice(pictStart);
}

/**
 * Post-procesado determinista del RTF generado por Pandoc:
 * 1) Inyecta idioma (\deflang / \lang) y geometría real de página/márgenes de LaTeX.
 * 2) Reescala y alinea cada imagen exactamente según width/height y \centering/\raggedleft/\raggedright del LaTeX.
 * 3) Preserva y alinea los pies de figura (\caption).
 * 4) Inserta las ecuaciones renderizadas por pdflatex (PNG 300 DPI) en lugar de texto plano LaTeX.
 * 5) Limpia espacios Unicode exóticos que pueden aparecer como tofu en fuentes RTF básicas.
 */
export function preserveRtfSemantics(
  rawRtf: string,
  sourceImages: LatexImage[],
  geometry: LatexPageGeometry,
  equations: MathEquationSpec[],
  renderedEquations: Map<number, RenderedEquation>,
  language?: string
): { rtf: string; warnings: string[] } {
  let rtf = rawRtf;
  const warnings: string[] = [];

  // 1. Inyectar \uc1, idioma RTF y geometría de página (A4/Letter + márgenes de geometry)
  const lcid = languageToRtfLcid(language);
  const pageProps = [
    "\\uc1",
    ...(lcid ? [`\\deflang${lcid}\\deflangfe${lcid}\\lang${lcid}`] : []),
    `\\paperw${geometry.paperWidthTwips}`,
    `\\paperh${geometry.paperHeightTwips}`,
    `\\margl${geometry.marginLeftTwips}`,
    `\\margr${geometry.marginRightTwips}`,
    `\\margt${geometry.marginTopTwips}`,
    `\\margb${geometry.marginBottomTwips}`,
  ].join("");

  if (rtf.includes("\\widowctrl")) {
    rtf = rtf.replace("\\widowctrl", `${pageProps}\\widowctrl`);
  } else {
    rtf = rtf.replace(/\{\\rtf1\\ansi/, `{\\rtf1\\ansi${pageProps}`);
  }

  // Cambiar la fuente predeterminada de Helvetica a Times New Roman (serif clásica más fiel a Computer Modern)
  rtf = rtf.replace(/\{\\f0 \\fswiss Helvetica;\}/, "{\\f0 \\froman Times New Roman;}");

  // 2. Corregir tamaño y alineación de las imágenes del documento (antes de insertar ecuaciones PNG)
  const picts = findPictSpans(rtf);
  const alignmentMatches = picts.length === sourceImages.length;
  if (!alignmentMatches && (picts.length > 0 || sourceImages.length > 0)) {
    warnings.push(
      `RTF: hay ${picts.length} imágenes convertidas y ${sourceImages.length} identificadas en la fuente; se ajustará el tamaño sin inferir alineación.`
    );
  }

  // Reemplazar de atrás hacia delante para no invalidar offsets
  for (let i = picts.length - 1; i >= 0; i--) {
    const span = picts[i];
    const spec = alignmentMatches ? sourceImages[i] : undefined;
    const pictText = rtf.slice(span.start, span.end);
    const parsedPict = parsePictBlob(pictText);

    if (parsedPict) {
      const bin = Buffer.from(parsedPict.hex, "hex");
      const dims = readImageDimensions(bin);
      if (dims) {
        const aspect = dims.height / dims.width;
        const maxW = geometry.textWidthTwips;
        const maxH = Math.round(geometry.textHeightTwips * 0.85);

        let targetW = resolveLatexLengthToTwips(spec?.width, geometry.textWidthTwips, geometry.paperWidthTwips);
        let targetH: number | undefined;

        if (targetW !== undefined) {
          targetH = Math.round(targetW * aspect);
        } else {
          targetH = resolveLatexLengthToTwips(spec?.height, geometry.textHeightTwips, geometry.paperHeightTwips);
          if (targetH !== undefined) {
            targetW = Math.round(targetH / aspect);
          } else {
            // Sin width/height explícitos: tamaño natural a 96 DPI limitado al ancho útil de la página
            targetW = Math.min(dims.width * 15, maxW);
            targetH = Math.round(targetW * aspect);
          }
        }

        if (targetW > maxW) {
          const s = maxW / targetW;
          targetW = maxW;
          targetH = Math.round(targetH * s);
        }
        if (targetH > maxH) {
          const s = maxH / targetH;
          targetH = maxH;
          targetW = Math.round(targetW * s);
        }

        targetW = Math.max(120, targetW);
        targetH = Math.max(120, targetH);

        const newPict = `{\\pict\\${parsedPict.blip}\\picw${dims.width}\\pich${dims.height}\\picwgoal${targetW}\\pichgoal${targetH}\\picscalex100\\picscaley100\n${hexFromBuffer(bin)}\n}`;
        rtf = rtf.slice(0, span.start) + newPict + rtf.slice(span.end);
      }
    }

    if (spec) {
      const alignCmd = rtfAlignCmd(spec.alignment);
      rtf = setPardAlignment(rtf, span.pardStart, span.start, alignCmd);
    }
  }

  // 3. Dar formato y alineación coherente a los pies de figura conservados por el filtro Lua
  rtf = rtf.replace(
    /\{\\pard\s+\\q[lcrj]([^}]*?)TALLERFIGCAP(\d+)START\s*([\s\S]*?)\\par\}/g,
    (_m, attrs: string, idxStr: string, body: string) => {
      const idx = Number(idxStr);
      const spec = alignmentMatches ? sourceImages[idx] : undefined;
      const alignCmd = rtfAlignCmd(spec?.alignment);
      return `{\\pard ${alignCmd}${attrs}{\\i\\fs20 ${body.trim()}}\\par}`;
    }
  );

  // 4. Reemplazar los marcadores de ecuaciones por sus PNG de 300 DPI renderizados con pdflatex
  const eqById = new Map(equations.map((e) => [e.id, e]));

  // Display equations: párrafo centrado \qc
  rtf = rtf.replace(
    /\{\\pard\s+\\q[lcrj]([^}]*?)TALLERDISPLAYEQ(\d+)END\s*\\par\}/g,
    (_m, attrs: string, idStr: string) => {
      const id = Number(idStr);
      const rendered = renderedEquations.get(id);
      if (rendered) {
        return `{\\pard \\qc${attrs}\\sb120 ${buildPngPictGroup(rendered)}\\par}`;
      }
      const fallback = eqById.get(id)?.tex ?? "";
      return `{\\pard \\qc${attrs}{\\i ${escapeRtfPlainText(fallback)}}\\par}`;
    }
  );

  // Por si algún TALLERDISPLAYEQ quedó dentro de un párrafo compuesto (p.ej. dentro de lista o cita)
  rtf = rtf.replace(/TALLERDISPLAYEQ(\d+)END/g, (_m, idStr: string) => {
    const id = Number(idStr);
    const rendered = renderedEquations.get(id);
    if (rendered) return buildPngPictGroup(rendered);
    return escapeRtfPlainText(eqById.get(id)?.tex ?? "");
  });

  // Inline equations complejas
  rtf = rtf.replace(/TALLERINLINEEQ(\d+)END/g, (_m, idStr: string) => {
    const id = Number(idStr);
    const rendered = renderedEquations.get(id);
    if (rendered) {
      const pict = buildPngPictGroup(rendered);
      return rendered.descentHalfPts > 0 ? `{\\dn${rendered.descentHalfPts} ${pict}}` : pict;
    }
    return `{\\i ${escapeRtfPlainText(eqById.get(id)?.tex ?? "")}}`;
  });

  // 5. Normalizar espacios Unicode exóticos de texmath (U+2004..U+2009, U+205F) que algunas fuentes RTF muestran como tofu
  rtf = rtf.replace(/\\u(8196|8197|8198|8201|8287)\?/g, " ");

  return { rtf, warnings };
}
