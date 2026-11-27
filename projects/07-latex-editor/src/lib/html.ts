import katex from "katex";
import type { LatexImage } from "./latex-semantics";

export interface HtmlOptions {
  hasMakeTitle: boolean;
  language?: string;
}

const LATEX_FIDELITY_CSS = `
    header#title-block-header {
      text-align: center;
      margin-bottom: 2em;
    }
    figure {
      margin: 1.5em 0;
    }
    figure img {
      display: inline-block;
      max-width: 100%;
      height: auto;
    }
    figure figcaption {
      margin-top: 0.45em;
      font-size: 0.92em;
    }
    .center { text-align: center; }
    .flushleft { text-align: left; }
    .flushright { text-align: right; }
    .header-section-number { margin-right: 0.45em; }
    .latex-display-math {
      display: block;
      box-sizing: border-box;
      width: 100%;
      margin: 1em 0;
      overflow-x: auto;
      text-align: center;
    }
    .latex-display-math > math[display="block"] {
      display: inline-block !important;
      margin: 0 !important;
      vertical-align: middle;
      text-align: initial;
    }
    mtd[columnalign="right"] {
      text-align: right;
      text-align: -webkit-right;
    }
    mtd[columnalign="left"] {
      text-align: left;
      text-align: -webkit-left;
    }
    mtd[columnalign="center"] {
      text-align: center;
    }`;

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function addStyleToOpeningTag(tag: string, cssRule: string): string {
  if (/\bstyle\s*=\s*"([^"]*)"/i.test(tag)) {
    return tag.replace(/\bstyle\s*=\s*"([^"]*)"/i, (_m, existing: string) => {
      const trimmed = existing.trim();
      const sep = trimmed && !trimmed.endsWith(";") ? "; " : trimmed ? " " : "";
      return `style="${trimmed}${sep}${cssRule}"`;
    });
  }
  return tag.replace(/>$/, ` style="${cssRule}">`);
}

function normalizeMathForKatex(tex: string): string {
  const t = tex.trim();
  const hasBreak = t.includes("\\\\");
  const hasAlign = t.includes("&");
  if (!hasBreak && !hasAlign) return t;
  if (/\\begin\{(align|aligned|eqnarray|gather|split|cases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix)\*?\}/.test(t)) {
    return t;
  }
  const lines = t
    .split(/\\\\/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return t;
  return `\\begin{aligned}\n${lines.map((l) => (l.includes("&") ? l : `& ${l}`)).join("\\\\\n")}\n\\end{aligned}`;
}

/**
 * Post-procesado determinista del HTML5 de Pandoc:
 * - Garantiza UTF-8 y atributo lang.
 * - Respeta \maketitle (oculta header de título si no se usó \maketitle).
 * - Aplica la alineación exacta de cada figura/imagen declarada en LaTeX (\centering / \raggedleft / \raggedright / sin declarar -> izquierda).
 * - Añade CSS mínimo para MathML Core (columnalign en Chrome/Safari) y entornos .center/.flushright/.flushleft.
 * - Convierte a MathML vía KaTeX cualquier <span class="math"> que Pandoc no haya podido convertir.
 */
export function preserveHtmlSemantics(
  rawHtml: string,
  sourceImages: LatexImage[],
  options: HtmlOptions
): { html: string; warnings: string[] } {
  let html = rawHtml;
  const warnings: string[] = [];

  // 1. Asegurar <meta charset="utf-8" />
  if (!/<meta\s+charset=/i.test(html)) {
    html = html.replace(/<head[^>]*>/i, (m) => `${m}\n  <meta charset="utf-8" />`);
  }

  // 2. Asegurar atributo lang en <html> si se detectó idioma LaTeX
  if (options.language && !/<html[^>]*\blang=/i.test(html)) {
    html = html.replace(/<html\b/i, `<html lang="${options.language}"`);
  }

  // 3. Si el documento LaTeX NO contiene \maketitle, retirar el header generado automáticamente
  if (!options.hasMakeTitle) {
    html = html.replace(/<header\s+id="title-block-header"[^>]*>[\s\S]*?<\/header>\s*/i, "");
  }

  // 4. Inyectar CSS mínimo de fidelidad tipográfica y MathML Core
  if (/<\/style>/i.test(html)) {
    html = html.replace(/<\/style>/i, `${LATEX_FIDELITY_CSS}\n  </style>`);
  } else if (/<\/head>/i.test(html)) {
    html = html.replace(/<\/head>/i, `  <style>${LATEX_FIDELITY_CSS}\n  </style>\n</head>`);
  }

  // 5. Fallback MathML con KaTeX para cualquier fórmula que Pandoc haya dejado como texto crudo TeX
  html = html.replace(
    /<span\s+class="math\s+(display|inline)"[^>]*>([\s\S]*?)<\/span>/gi,
    (full, kind: string, inner: string) => {
      if (/<math\b/i.test(inner)) return full;
      let tex = decodeHtmlEntities(inner.trim());
      const displayMode = kind.toLowerCase() === "display";
      if (displayMode) {
        tex = tex.replace(/^\\\[/, "").replace(/\\\]$/, "").replace(/^\$\$/, "").replace(/\$\$$/, "").trim();
        tex = normalizeMathForKatex(tex);
      } else {
        tex = tex.replace(/^\\\(/, "").replace(/\\\)$/, "").replace(/^\$/, "").replace(/\$$/, "").trim();
      }
      if (!tex) return full;
      try {
        const rendered = katex.renderToString(tex, {
          output: "mathml",
          displayMode,
          throwOnError: false,
          strict: false,
        });
        return `<span class="math ${kind}">${rendered}</span>`;
      } catch {
        return full;
      }
    }
  );

  // 6. MathML display: sacar cada fórmula del <p> de Pandoc y centrar CADA ECUACIÓN
  //    por separado. Pandoc puede agrupar ecuaciones consecutivas en un mismo <p>.
  //    CSS text-align sobre <math display=block> no es suficiente para MathML Core en todos los navegadores.
  html = html.replace(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi, (paragraph, _attrs: string, inner: string) => {
    const displayMath = /<math\b[^>]*\bdisplay="block"[^>]*>[\s\S]*?<\/math>/gi;
    const formulas = [...inner.matchAll(displayMath)];
    if (formulas.length === 0) return paragraph;
    const rest = inner.replace(displayMath, "").trim();
    // Un display math es un bloque; lo quitamos del <p> incluso si Pandoc agrupó varios.
    // Si el párrafo también contiene texto inline, conservamos ese texto en un párrafo normal.
    if (!rest) {
      return formulas.map((m) => `<div class="latex-display-math">${m[0]}</div>`).join("\n");
    }
    let remaining = inner;
    const blocks: string[] = [];
    for (const m of formulas) {
      const index = remaining.indexOf(m[0]);
      if (index < 0) continue;
      const before = remaining.slice(0, index).trim();
      if (before) blocks.push(`<p${_attrs ? ` ${_attrs}` : ""}>${before}</p>`);
      blocks.push(`<div class="latex-display-math">${m[0]}</div>`);
      remaining = remaining.slice(index + m[0].length);
    }
    if (remaining.trim()) blocks.push(`<p${_attrs ? ` ${_attrs}` : ""}>${remaining.trim()}</p>`);
    return blocks.join("\n");
  });

  // 7. Alineación por imagen/figura exactamente según el LaTeX (nunca centrar globalmente)
  const imgMatches = [...html.matchAll(/<img\b[^>]*>/gi)];
  if (imgMatches.length !== sourceImages.length) {
    if (imgMatches.length > 0 || sourceImages.length > 0) {
      warnings.push(
        `HTML: hay ${imgMatches.length} imágenes convertidas y ${sourceImages.length} identificadas en la fuente; no se ha inferido su alineación.`
      );
    }
  } else if (sourceImages.length > 0) {
    // Recorremos <figure>...</figure> y <p>...<img...>...</p> en orden de aparición
    let imageCursor = 0;
    const blockRe = /(<figure\b[^>]*>[\s\S]*?<\/figure>)|(<p\b[^>]*>(?:(?!<\/p>)[\s\S])*?<img\b[^>]*>(?:(?!<\/p>)[\s\S])*?<\/p>)/gi;
    html = html.replace(blockRe, (blockMatch, figureBlock: string | undefined, paraBlock: string | undefined) => {
      const imgsInBlock = [...blockMatch.matchAll(/<img\b[^>]*>/gi)].length;
      if (imgsInBlock === 0 || imageCursor >= sourceImages.length) return blockMatch;

      const spec = sourceImages[imageCursor];
      imageCursor += imgsInBlock;

      if (figureBlock) {
        const align = spec.alignment ?? "left";
        return figureBlock.replace(/^<figure\b[^>]*>/i, (openTag) =>
          addStyleToOpeningTag(openTag, `text-align: ${align};`)
        );
      }
      if (paraBlock && spec.alignment) {
        return paraBlock.replace(/^<p\b[^>]*>/i, (openTag) =>
          addStyleToOpeningTag(openTag, `text-align: ${spec.alignment};`)
        );
      }
      return blockMatch;
    });
  }

  // Saltos de página \newpage: párrafo con el marcador → div de salto; restos → se limpian.
  html = html.replace(
    /<p\b[^>]*>(?:(?!<\/p>)[\s\S])*?TALLERPB\d{4}TALLER(?:(?!<\/p>)[\s\S])*?<\/p>/gi,
    '<div class="latex-pagebreak" style="page-break-before:always;"></div>'
  );
  html = html.replace(/TALLERPB\d{4}TALLER/g, "");

  return { html, warnings };
}
