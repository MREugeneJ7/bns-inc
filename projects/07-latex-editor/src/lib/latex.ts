/**
 * Parser y serializador de un subconjunto de LaTeX pensado para el taller.
 * Round-trip: parse(source).blocks -> serialize(blocks) -> source.
 */
import { inspectLatexImages, type ImageAlignment } from "./latex-semantics";

export type Inline =
  | { type: "text"; text: string }
  | { type: "bold"; content: Inline[] }
  | { type: "italic"; content: Inline[] }
  | { type: "mono"; content: Inline[] }
  | { type: "math"; math: string }
  | { type: "link"; href: string; content: Inline[] }
  | { type: "linebreak" }
  | { type: "raw"; text: string };

export type Block =
  | { type: "titleblock" }
  | { type: "include"; slug: string }
  | { type: "heading"; level: 1 | 2 | 3; text: string; starred?: boolean }
  | { type: "paragraph"; inlines: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "quote"; inlines: Inline[] }
  | { type: "equation"; math: string; numbered: boolean; align?: boolean }
  | { type: "code"; text: string }
  | { type: "image"; src: string; caption: string; width: string; alignment?: ImageAlignment; standalone?: boolean }
  | { type: "pagebreak" }
  | { type: "raw"; text: string };

export interface DocMeta {
  documentClass: string;
  classOptions: string;
  title: string;
  author: string;
  date: string;
  packages: string[];
  /** true cuando el documento es un subdocumento sin \begin{document} */
  isFragment?: boolean;
  /** preámbulo original íntegro (todo lo previo a \begin{document}) para conservar opciones y macros */
  preamble?: string;
}

export interface ParsedDoc {
  meta: DocMeta;
  blocks: Block[];
}

const EMPTY_META = (): DocMeta => ({
  documentClass: "article",
  classOptions: "11pt,a4paper",
  title: "Sin título",
  author: "",
  date: "",
  packages: ["inputenc", "fontenc", "lmodern", "geometry", "graphicx", "hyperref", "amsmath", "amssymb"],
});

/* ------------------------------------------------------------------ */
/* utilidades                                                          */
/* ------------------------------------------------------------------ */

function findGroupEnd(s: string, open: number): number {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    const ch = s[i];
    if (ch === "\\") {
      i++;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Lee el argumento entre llaves que sigue a `pos` (salta espacios). */
function readArg(s: string, pos: number): { content: string; end: number } | null {
  let i = pos;
  while (i < s.length && /\s/.test(s[i])) i++;
  if (s[i] !== "{") return null;
  const end = findGroupEnd(s, i);
  if (end === -1) return null;
  return { content: s.slice(i + 1, end), end: end + 1 };
}

function readOpt(s: string, pos: number): { content: string; end: number } {
  let i = pos;
  while (i < s.length && /\s/.test(s[i])) i++;
  if (s[i] !== "[") return { content: "", end: pos };
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === "[") depth++;
    else if (s[j] === "]") {
      depth--;
      if (depth === 0) return { content: s.slice(i + 1, j), end: j + 1 };
    }
  }
  return { content: "", end: pos };
}

function findEnvEnd(src: string, beginIdx: number, env: string): number {
  const re = new RegExp(`\\\\(begin|end)\\{${env.replace("*", "\\*")}\\}`, "g");
  re.lastIndex = beginIdx + env.length + 8;
  let depth = 1;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m[1] === "begin") depth++;
    else depth--;
    if (depth === 0) return m.index;
  }
  return -1;
}

function stripComments(src: string): string {
  return src
    .split("\n")
    .map((line) => {
      for (let i = 0; i < line.length; i++) {
        if (line[i] === "\\" ) {
          i++;
          continue;
        }
        if (line[i] === "%") return line.slice(0, i);
      }
      return line;
    })
    .join("\n");
}

function unescapeText(s: string): string {
  return s.replace(/\\([%$&#_{}])/g, "$1");
}

/* ------------------------------------------------------------------ */
/* inlines                                                             */
/* ------------------------------------------------------------------ */

const INLINE_COMMANDS: Record<string, Inline["type"] | "link" | "url" | "math"> = {
  textbf: "bold",
  textit: "italic",
  emph: "italic",
  texttt: "mono",
  textsc: "text",
  underline: "text",
  textrm: "text",
  textsf: "text",
  href: "link",
  url: "url",
};

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let buf = "";
  const flush = () => {
    if (buf) {
      out.push({ type: "text", text: buf });
      buf = "";
    }
  };

  let i = 0;
  while (i < src.length) {
    const ch = src[i];

    if (ch === "\\" && i + 1 < src.length) {
      const cmdMatch = /^\\([a-zA-Z@]+)\*?/.exec(src.slice(i));
      const next = src[i + 1];

      if (next === "\\" ) {
        flush();
        out.push({ type: "linebreak" });
        i += 2;
        continue;
      }
      if ("%$&#_{}".includes(next)) {
        buf += next;
        i += 2;
        continue;
      }
      if (cmdMatch) {
        const cmd = cmdMatch[1];
        let end = i + cmdMatch[0].length;
        if (cmd === "newline" || cmd === "linebreak" || cmd === "par") {
          flush();
          out.push({ type: "linebreak" });
          i = end;
          continue;
        }
        if (cmd === "noindent" || cmd === "smallskip" || cmd === "medskip" || cmd === "bigskip" || cmd === "label" || cmd === "index" || cmd === "nonumber") {
          const arg = readArg(src, end);
          i = arg ? arg.end : end;
          continue;
        }
        if (cmd === "cite") {
          const arg = readArg(src, end);
          buf += `[${arg ? arg.content : ""}]`;
          i = arg ? arg.end : end;
          continue;
        }
        if (cmd === "ref" || cmd === "pageref") {
          const arg = readArg(src, end);
          buf += `§${arg ? arg.content : "?"}`;
          i = arg ? arg.end : end;
          continue;
        }
        const kind = INLINE_COMMANDS[cmd];
        if (kind) {
          if (kind === "url") {
            const arg = readArg(src, end);
            const href = arg ? arg.content.trim() : "";
            flush();
            out.push({ type: "link", href, content: [{ type: "text", text: href }] });
            i = arg ? arg.end : end;
            continue;
          }
          if (kind === "link") {
            const href = readArg(src, end);
            const label = href ? readArg(src, href.end) : null;
            flush();
            out.push({
              type: "link",
              href: href ? href.content.trim() : "#",
              content: label ? parseInline(label.content) : [{ type: "text", text: href ? href.content : "" }],
            });
            i = label ? label.end : href ? href.end : end;
            continue;
          }
          const arg = readArg(src, end);
          flush();
          if (arg) {
            const inner = parseInline(arg.content);
            if (kind === "text") out.push(...inner);
            else out.push({ type: kind as "bold" | "italic" | "mono", content: inner } as Inline);
            i = arg.end;
          } else {
            i = end;
          }
          continue;
        }
        // comando desconocido: se conserva tal cual, con sus argumentos
        flush();
        let rawText = cmdMatch[0];
        for (let k = 0; k < 2; k++) {
          const opt = readOpt(src, end);
          if (opt.content) {
            rawText += `[${opt.content}]`;
            end = opt.end;
          }
          const arg = readArg(src, end);
          if (arg) {
            rawText += `{${arg.content}}`;
            end = arg.end;
          } else break;
        }
        out.push({ type: "raw", text: rawText });
        i = end;
        continue;
      }
      buf += ch;
      i++;
      continue;
    }

    if (ch === "$") {
      if (src[i + 1] === "$") {
        const close = src.indexOf("$$", i + 2);
        const math = close === -1 ? src.slice(i + 2) : src.slice(i + 2, close);
        flush();
        out.push({ type: "math", math: math.trim() });
        i = close === -1 ? src.length : close + 2;
        continue;
      }
      const close = src.indexOf("$", i + 1);
      const math = close === -1 ? src.slice(i + 1) : src.slice(i + 1, close);
      flush();
      out.push({ type: "math", math: math.trim() });
      i = close === -1 ? src.length : close + 1;
      continue;
    }

    if (ch === "\n") {
      buf += " ";
      i++;
      continue;
    }
    buf += ch;
    i++;
  }
  flush();

  // comillas tipográficas y rayas
  return out.map((node) => {
    if (node.type !== "text") return node;
    let t = node.text;
    t = t.replace(/``/g, "\u201c").replace(/''/g, "\u201d");
    t = t.replace(/---/g, "\u2014").replace(/--/g, "\u2013");
    t = t.replace(/~/g, "\u00a0");
    return { type: "text", text: unescapeText(t) };
  });
}

/* ------------------------------------------------------------------ */
/* bloques                                                             */
/* ------------------------------------------------------------------ */

const BLOCK_RE =
  /\\(begin\{([a-zA-Z*]+)\}|(section|subsection|subsubsection|chapter|paragraph)\*?|maketitle|tableofcontents|newpage|clearpage|includegraphics)/g;

export function parseBlocks(src: string): Block[] {
  const blocks: Block[] = [];
  let pending = "";
  const flush = () => {
    const chunks = pending.split(/\n\s*\n+/);
    for (const c of chunks) {
      const t = c.trim();
      if (!t) continue;
      // un \input{slug} que ocupa su propia línea es un bloque, no un párrafo
      const buf: string[] = [];
      const pushParagraph = () => {
        const s = buf.join("\n").trim();
        if (s) blocks.push({ type: "paragraph", inlines: parseInline(s) });
        buf.length = 0;
      };
      for (const line of t.split("\n")) {
        const m = /^[ \t]*\\input\{([^}]+)\}[ \t]*$/.exec(line);
        if (m) {
          pushParagraph();
          blocks.push({ type: "include", slug: m[1].trim() });
        } else {
          buf.push(line);
        }
      }
      pushParagraph();
    }
    pending = "";
  };

  let i = 0;
  while (i < src.length) {
    BLOCK_RE.lastIndex = i;
    const m = BLOCK_RE.exec(src);
    if (!m) {
      pending += src.slice(i);
      break;
    }
    pending += src.slice(i, m.index);
    const token = m[0];
    let cursor = m.index + token.length;

    if (m[1].startsWith("begin{")) {
      const env = m[2];
      const endIdx = findEnvEnd(src, m.index, env);
      const innerStart = cursor;
      const innerEnd = endIdx === -1 ? src.length : endIdx;
      const inner = src.slice(innerStart, innerEnd);
      flush();

      if (env === "itemize" || env === "enumerate") {
        const items: Inline[][] = [];
        const parts = inner.split(/\\item\b/).slice(1);
        for (const p of parts) items.push(parseInline(p.trim()));
        blocks.push({ type: "list", ordered: env === "enumerate", items });
      } else if (env === "quote" || env === "quotation" || env === "abstract" || env === "verse") {
        blocks.push({ type: "quote", inlines: parseInline(inner.trim()) });
      } else if (env === "verbatim" || env === "verbatim*" || env === "lstlisting" || env === "Verbatim" || env === "minted") {
        blocks.push({ type: "code", text: inner.replace(/^\n/, "").replace(/\n$/, "") });
      } else if (["equation", "equation*", "align", "align*", "gather", "gather*", "displaymath", "multline", "eqnarray"].includes(env)) {
        const math = inner.trim().replace(/\\label\{[^}]*\}/g, "").trim();
        blocks.push({
          type: "equation",
          math,
          numbered: !env.endsWith("*") && env !== "displaymath",
          align: env.startsWith("align") || env.startsWith("gather") || env.startsWith("multline") || env === "eqnarray",
        });
      } else if (env === "figure" || env === "figure*") {
        blocks.push(parseFigure(inner));
      } else if (env === "document") {
        blocks.push(...parseBlocks(inner));
      } else {
        blocks.push({ type: "raw", text: `\\begin{${env}}${inner}\\end{${env}}` });
      }
      i = endIdx === -1 ? src.length : endIdx + env.length + 6;
      continue;
    }

    if (m[3]) {
      flush();
      const arg = readArg(src, cursor);
      const text = arg ? arg.content.trim() : "";
      const level = m[3] === "chapter" || m[3] === "section" ? 1 : m[3] === "subsection" ? 2 : 3;
      const starred = token.endsWith("*");
      blocks.push({ type: "heading", level: level as 1 | 2 | 3, text: unescapeText(text), starred });
      i = arg ? arg.end : cursor;
      continue;
    }

    if (token === "\\maketitle") {
      flush();
      blocks.push({ type: "titleblock" });
      i = cursor;
      continue;
    }
    if (token === "\\newpage" || token === "\\clearpage") {
      flush();
      blocks.push({ type: "pagebreak" });
      i = cursor;
      continue;
    }
    if (token === "\\tableofcontents") {
      flush();
      blocks.push({ type: "raw", text: "\\tableofcontents" });
      i = cursor;
      continue;
    }
    if (token === "\\includegraphics") {
      const opt = readOpt(src, cursor);
      const arg = readArg(src, opt.end);
      flush();
      blocks.push({ type: "image", src: arg ? arg.content.trim() : "", caption: "", width: opt.content.includes("width=") ? opt.content.replace(/^.*width=([^,\]]*).*/, "$1") : "0.7\\textwidth", standalone: true });
      i = arg ? arg.end : opt.end;
      continue;
    }
    i = cursor;
  }
  flush();
  return blocks;
}

function parseFigure(inner: string): Block {
  const img = /\\includegraphics(\[[^\]]*\])?\{([^}]*)\}/.exec(inner);
  const cap = /\\caption\{([\s\S]*?)\}/.exec(inner);
  const width = img && img[1] ? img[1].replace(/^\[width=([^,\]]*).*$/, "$1") : "0.7\\textwidth";
  return {
    type: "image",
    src: img ? img[2].trim() : "",
    caption: cap ? unescapeText(cap[1].trim()) : "",
    width: img && img[1] && img[1].includes("width=") ? width : "0.7\\textwidth",
    alignment: inspectLatexImages(inner)[0]?.alignment,
  };
}

export function parse(source: string): ParsedDoc {
  const clean = stripComments(source);
  const meta = EMPTY_META();

  const cls = /\\documentclass(\[[^\]]*\])?\{([^}]*)\}/.exec(clean);
  if (cls) {
    meta.documentClass = cls[2].trim();
    meta.classOptions = cls[1] ? cls[1].slice(1, -1) : meta.classOptions;
  }

  const pkgs = [...clean.matchAll(/\\usepackage(\[[^\]]*\])?\{([^}]*)\}/g)];
  const names: string[] = [];
  for (const p of pkgs) {
    for (const n of p[2].split(",")) if (n.trim()) names.push(n.trim());
  }
  if (names.length) meta.packages = names;

  const grab = (cmd: string): string => {
    const re = new RegExp(`\\\\${cmd}\\s*\\{`);
    const m = re.exec(clean);
    if (!m) return "";
    const start = clean.indexOf("{", m.index);
    const end = findGroupEnd(clean, start);
    return end === -1 ? "" : clean.slice(start + 1, end).trim();
  };
  meta.title = grab("title") || meta.title;
  meta.author = grab("author");
  meta.date = grab("date");

  const docMatch = /\\begin\{document\}/.exec(clean);
  const rawDocMatch = /\\begin\{document\}/.exec(source);
  let body = clean;
  if (docMatch) {
    const bodyStart = docMatch.index + docMatch[0].length;
    const endDoc = /\\end\{document\}/.exec(clean);
    body = clean.slice(bodyStart, endDoc ? endDoc.index : undefined);
    meta.isFragment = false;
    meta.preamble = rawDocMatch ? source.slice(0, rawDocMatch.index).trimEnd() : undefined;
  } else {
    meta.isFragment = true;
    body = clean;
  }

  return { meta, blocks: parseBlocks(body) };
}

/* ------------------------------------------------------------------ */
/* serialización                                                       */
/* ------------------------------------------------------------------ */

function esc(text: string): string {
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([%$&#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}");
}

export function serializeInline(inlines: Inline[]): string {
  return inlines
    .map((n): string => {
      switch (n.type) {
        case "text":
          return esc(n.text);
        case "bold":
          return `\\textbf{${serializeInline(n.content)}}`;
        case "italic":
          return `\\emph{${serializeInline(n.content)}}`;
        case "mono":
          return `\\texttt{${serializeInline(n.content)}}`;
        case "math":
          return `$${n.math}$`;
        case "link":
          return `\\href{${n.href}}{${serializeInline(n.content)}}`;
        case "linebreak":
          return "\\\\";
        case "raw":
          return n.text;
      }
    })
    .join("");
}

export function serializeBlock(b: Block): string {
  switch (b.type) {
    case "titleblock":
      return "\\maketitle";
    case "include":
      return `\\input{${b.slug}}`;
    case "heading": {
      const cmd = b.level === 1 ? "\\section" : b.level === 2 ? "\\subsection" : "\\subsubsection";
      return `${cmd}${b.starred ? "*" : ""}{${esc(b.text)}}`;
    }
    case "paragraph":
      return serializeInline(b.inlines);
    case "list": {
      const env = b.ordered ? "enumerate" : "itemize";
      return `\\begin{${env}}\n${b.items.map((it) => `  \\item ${serializeInline(it)}`).join("\n")}\n\\end{${env}}`;
    }
    case "quote":
      return `\\begin{quote}\n${serializeInline(b.inlines)}\n\\end{quote}`;
    case "equation": {
      const multiline = b.align || b.math.includes("&") || b.math.includes("\\\\");
      const env = multiline ? (b.numbered ? "align" : "align*") : b.numbered ? "equation" : "equation*";
      return `\\begin{${env}}\n${b.math}\n\\end{${env}}`;
    }
    case "code":
      return `\\begin{verbatim}\n${b.text}\n\\end{verbatim}`;
    case "image": {
      const graphic = `\\includegraphics[width=${b.width || "0.7\\textwidth"}]{${b.src}}`;
      const declaration = b.alignment === "center" ? "\\centering" : b.alignment === "left" ? "\\raggedright" : b.alignment === "right" ? "\\raggedleft" : "";
      if (b.standalone) return declaration ? `{${declaration}\n${graphic}\\par}` : graphic;
      return [
        "\\begin{figure}[htbp]",
        ...(declaration ? [`  ${declaration}`] : []),
        `  ${graphic}`,
        ...(b.caption ? [`  \\caption{${esc(b.caption)}}`] : []),
        "\\end{figure}",
      ].join("\n");
    }
    case "pagebreak":
      return "\\newpage";
    case "raw":
      return b.text;
  }
}

function replacePreambleCmd(preamble: string, cmd: string, value: string): string {
  const re = new RegExp(`\\\\${cmd}\\s*\\{`);
  const m = re.exec(preamble);
  if (!m) return value ? `${preamble}\n\\${cmd}{${value}}` : preamble;
  const start = preamble.indexOf("{", m.index);
  const end = findGroupEnd(preamble, start);
  if (end === -1) return preamble;
  return preamble.slice(0, start + 1) + value + preamble.slice(end);
}

export function serialize(meta: DocMeta, blocks: Block[]): string {
  const body = blocks.map(serializeBlock).join("\n\n");
  if (meta.isFragment) {
    return `${body}\n`;
  }

  let preamble = meta.preamble;
  if (preamble) {
    preamble = preamble.replace(
      /\\documentclass(\[[^\]]*\])?\{[^}]*\}/,
      `\\documentclass${meta.classOptions ? `[${meta.classOptions}]` : ""}{${meta.documentClass}}`
    );
    preamble = replacePreambleCmd(preamble, "title", esc(meta.title));
    preamble = replacePreambleCmd(preamble, "author", esc(meta.author));
    preamble = replacePreambleCmd(preamble, "date", meta.date.includes("\\today") ? meta.date : esc(meta.date));
  } else {
    preamble = [
      `\\documentclass[${meta.classOptions}]{${meta.documentClass}}`,
      "\\usepackage[utf8]{inputenc}",
      "\\usepackage[T1]{fontenc}",
      "\\usepackage[spanish]{babel}",
      "\\usepackage{lmodern}",
      "\\usepackage{geometry}",
      "\\usepackage{graphicx}",
      "\\usepackage{amsmath}",
      "\\usepackage{amssymb}",
      "\\usepackage{hyperref}",
      "",
      `\\title{${esc(meta.title)}}`,
      `\\author{${esc(meta.author)}}`,
      `\\date{${meta.date.includes("\\today") ? meta.date : esc(meta.date)}}`,
    ].join("\n");
  }

  return `${preamble}\n\n\\begin{document}\n${body}\n\\end{document}\n`;
}

/* ------------------------------------------------------------------ */
/* métricas y texto plano                                              */
/* ------------------------------------------------------------------ */

export function inlineToPlain(inlines: Inline[]): string {
  return inlines
    .map((n): string => {
      switch (n.type) {
        case "text":
          return n.text;
        case "bold":
        case "italic":
        case "mono":
          return inlineToPlain(n.content);
        case "math":
          return n.math;
        case "link":
          return inlineToPlain(n.content);
        case "linebreak":
          return " ";
        case "raw":
          return "";
      }
    })
    .join("");
}

export function blocksToPlain(blocks: Block[]): string {
  const lines: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "titleblock":
      case "include":
        break;
      case "heading":
        lines.push(b.text, "");
        break;
      case "paragraph":
      case "quote":
        lines.push(inlineToPlain(b.inlines), "");
        break;
      case "list":
        b.items.forEach((it, idx) => lines.push(`${b.ordered ? idx + 1 + "." : "•"} ${inlineToPlain(it)}`));
        lines.push("");
        break;
      case "equation":
        lines.push(b.math, "");
        break;
      case "code":
        lines.push(b.text, "");
        break;
      case "image":
        if (b.caption) lines.push(b.caption, "");
        break;
      default:
        break;
    }
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Devuelve los slugs incluidos con \input{...} en la fuente, en orden. */
export function inputSlugs(source: string): string[] {
  const out: string[] = [];
  for (const m of source.matchAll(/\\input\{([^}]+)\}/g)) {
    const s = m[1].trim();
    if (s && !out.includes(s)) out.push(s);
  }
  return out;
}

export function wordCount(blocks: Block[]): number {
  const t = blocksToPlain(blocks);
  return t.split(/\s+/).filter(Boolean).length;
}
