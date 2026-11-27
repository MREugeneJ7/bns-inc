import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import { convertLatexWithPandoc } from "../src/lib/compiler";
import { readImageDimensions } from "../src/lib/image-utils";
import { SAMPLES } from "../src/lib/samples";
import { extractBody } from "../src/lib/compose";

const fixture = String.raw`\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[spanish]{babel}
\usepackage{lmodern}
\usepackage[margin=2.5cm]{geometry}
\usepackage{graphicx}
\usepackage{amsmath}
\usepackage{amssymb}
\usepackage{hyperref}

\title{Cuaderno de composición técnica y ñandú}
\author{Marina Cifuentes --- Taller de edición}
\date{14 de marzo de 2026}

\begin{document}
\maketitle

\section*{Notas de estilo}
Texto en español con tildes: áéíóúüñ ¿¡ «comillas» y fracción inline $\frac{a+b}{c}$ junto a variable $L$ y campo $\mathbf{D} = \varepsilon \mathbf{E}$.

\section{Ecuaciones de Maxwell}
\begin{equation}
  L = \frac{W}{0.5\,c_{m}}
\end{equation}

\begin{align}
  \nabla \cdot \mathbf{D} &= \rho_f \\
  \nabla \cdot \mathbf{B} &= 0 \\
  \nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
  \nabla \times \mathbf{H} &= \mathbf{J}_f + \frac{\partial \mathbf{D}}{\partial t}
\end{align}

\section{Figuras con distinta alineación}
\begin{figure}[htbp]
  \centering
  \includegraphics[width=0.62\textwidth]{images/plate.jpg}
  \caption{Figura centrada explícitamente.}
\end{figure}

\begin{figure}[htbp]
  \includegraphics[width=0.4\textwidth]{images/plate.jpg}
  \caption{Figura sin declaración de centrado.}
\end{figure}

\begin{figure}[htbp]
  \raggedleft
  \includegraphics[width=0.35\textwidth]{images/plate.jpg}
  \caption{Figura alineada a la derecha.}
\end{figure}

\end{document}
`;

function extractRtfPicts(rtf: string): {
  pardAlign: string;
  blip: string;
  picw: number;
  pich: number;
  picwgoal: number;
  pichgoal: number;
  bytes: Buffer;
}[] {
  const out = [];
  let pos = 0;
  while (true) {
    const start = rtf.indexOf("{\\pict", pos);
    if (start === -1) break;
    let depth = 0;
    let end = start;
    while (end < rtf.length) {
      if (rtf[end] === "\\") {
        end += 2;
        continue;
      }
      if (rtf[end] === "{") depth++;
      else if (rtf[end] === "}") {
        depth--;
        if (depth === 0) {
          end++;
          break;
        }
      }
      end++;
    }
    const group = rtf.slice(start, end);
    const pardStart = rtf.lastIndexOf("{\\pard", start);
    const pardHeader = pardStart >= 0 ? rtf.slice(pardStart, start) : "";
    const alignMatch = /\\q([lcrj])\b/.exec(pardHeader);
    const blip = /\\pngblip\b/.test(group.slice(0, 160)) ? "pngblip" : "jpegblip";
    const picw = Number(/\\picw(\d+)/.exec(group.slice(0, 160))?.[1] ?? 0);
    const pich = Number(/\\pich(\d+)/.exec(group.slice(0, 160))?.[1] ?? 0);
    const picwgoal = Number(/\\picwgoal(\d+)/.exec(group.slice(0, 160))?.[1] ?? 0);
    const pichgoal = Number(/\\pichgoal(\d+)/.exec(group.slice(0, 160))?.[1] ?? 0);
    const hexMatch = /^\{\\pict(?:\\[a-zA-Z]+-?\d*)*[\s]+([\s\S]*)\}$/.exec(group);
    const hex = (hexMatch?.[1] ?? "").replace(/\s+/g, "");
    out.push({
      pardAlign: alignMatch ? alignMatch[1] : "",
      blip,
      picw,
      pich,
      picwgoal,
      pichgoal,
      bytes: Buffer.from(hex, "hex"),
    });
    pos = end;
  }
  return out;
}

test("HTML: UTF-8 encoding intact in <title>, <h1>, headings, captions (zero U+FFFD)", async () => {
  const res = await convertLatexWithPandoc(fixture, "html", "Cuaderno de composición técnica y ñandú");
  const html = res.data.toString("utf8");

  assert.equal(html.includes("\uFFFD"), false, "HTML must not contain U+FFFD replacement characters");
  assert.equal(/Ã[\x80-\xBF]/.test(html), false, "HTML must not contain UTF-8 mojibake");
  assert.match(html, /<meta\s+charset="utf-8"\s*\/?>/i);
  assert.match(html, /<html[^>]*lang="es-ES"/i);
  assert.match(html, /<title>Cuaderno de composición técnica y ñandú<\/title>/);
  assert.match(html, /<h1 class="title">Cuaderno de composición técnica y ñandú<\/h1>/);
  assert.match(html, /áéíóúüñ/);
  assert.match(html, /Marina Cifuentes — Taller de edición/);
});

test("HTML: fragment without \\title uses UTF-8 fallback title without corruption and omits \\maketitle header", async () => {
  const fragment = String.raw`\section{Introducción rápida}
Párrafo con acentuación y ñ.`;
  const res = await convertLatexWithPandoc(fragment, "html", "Sección de cálculo y diseño");
  const html = res.data.toString("utf8");

  assert.equal(html.includes("\uFFFD"), false);
  assert.match(html, /<title>Sección de cálculo y diseño<\/title>/);
  assert.doesNotMatch(html, /<header\s+id="title-block-header"/i, "No \\maketitle means no title header block");
});

test("HTML: section numbering matches LaTeX (\\section numbered, \\section* unnumbered)", async () => {
  const res = await convertLatexWithPandoc(fixture, "html", "Prueba");
  const html = res.data.toString("utf8");

  assert.match(html, /<h1 class="unnumbered"[^>]*>Notas de estilo<\/h1>/);
  assert.match(html, /<span class="header-section-number">1<\/span>\s*Ecuaciones de Maxwell/);
  assert.match(html, /<span class="header-section-number">2<\/span>\s*Figuras con distinta\s+alineación/);
});

test("HTML: per-figure alignment matches LaTeX (center / left / right, never center-all)", async () => {
  const res = await convertLatexWithPandoc(fixture, "html", "Prueba");
  const html = res.data.toString("utf8");
  const figures = [...html.matchAll(/<figure\b([^>]*)>/gi)].map((m) => m[1]);

  assert.equal(figures.length, 3);
  assert.match(figures[0], /text-align:\s*center/i);
  assert.match(figures[1], /text-align:\s*left/i);
  assert.match(figures[2], /text-align:\s*right/i);
});

test("HTML: display equations have an explicit centered block wrapper without changing figures or inline math", async () => {
  const res = await convertLatexWithPandoc(fixture, "html", "Prueba");
  const html = res.data.toString("utf8");
  const wrappers = [...html.matchAll(/<div class="latex-display-math">\s*<math display="block"/gi)];

  // The fixture declares two display equations: one equation environment and one align environment.
  assert.equal(wrappers.length, 2);
  assert.equal((html.match(/<math display="block"/g) ?? []).length, wrappers.length);
  assert.match(html, /\.latex-display-math\s*\{[\s\S]*?text-align:\s*center/i);
  assert.match(html, /\.latex-display-math\s*>\s*math\[display="block"\]\s*\{[\s\S]*?display:\s*inline-block/i);
  assert.match(html, /<mtable>/);
  assert.match(html, /mtd\[columnalign="right"\]/);
  assert.doesNotMatch(html, /<p[^>]*>\s*<math display="block"/, "Display MathML should not stay in Pandoc's paragraph wrapper");
  assert.match(html, /<math display="inline"/, "Inline math should remain inline");
  const figures = [...html.matchAll(/<figure\b([^>]*)>/gi)].map((m) => m[1]);
  assert.deepEqual(figures.map((attrs) => /text-align:\s*(center|left|right)/i.exec(attrs)?.[1]?.toLowerCase()), ["center", "left", "right"]);
});

test("RTF: language, page geometry, section numbers, and zero raw LaTeX equations", async () => {
  const res = await convertLatexWithPandoc(fixture, "rtf", "Cuaderno de composición técnica y ñandú");
  const rtf = res.data.toString("latin1");

  // Idioma español (3082) y página A4 con márgenes 2.5cm (1417 twips)
  assert.match(rtf, /\\deflang3082\\deflangfe3082\\lang3082/);
  assert.match(rtf, /\\paperw11906\\paperh16838\\margl1417\\margr1417\\margt1417\\margb1417/);

  // Secciones numeradas vs no numeradas
  assert.match(rtf, /Notas de estilo\\par\}/);
  assert.match(rtf, /1 Ecuaciones de Maxwell\\par\}/);
  assert.match(rtf, /2 Figuras con distinta alineaci\\u243\?n\\par\}/);

  // CERO ecuaciones en texto plano LaTeX y cero espacios tofu de texmath
  const rtfNoHex = rtf.replace(/\{\\pict[\s\S]*?\}/g, "{\\pict}");
  assert.equal(rtfNoHex.includes("$$"), false, "RTF must not contain raw $$...$$ LaTeX equations");
  assert.equal(rtfNoHex.includes("\\frac"), false, "RTF must not contain raw \\frac text");
  assert.equal(rtfNoHex.includes("\\begin\\{aligned\\}"), false, "RTF must not contain raw align environment");
  assert.doesNotMatch(rtfNoHex, /\\u(8196|8197|8198)\?/, "No exotic unicode math spaces that render as tofu");

  // Los pies de figura NO se pierden en RTF
  assert.match(rtfNoHex, /Figura centrada expl\\u237\?citamente\./);
  assert.match(rtfNoHex, /Figura sin declaraci\\u243\?n de centrado\./);
  assert.match(rtfNoHex, /Figura alineada a la derecha\./);
});

test("RTF: images have proper scaled dimensions (not huge) and exact per-figure alignment, and equations are valid cropped PNGs", async () => {
  const res = await convertLatexWithPandoc(fixture, "rtf", "Cuaderno");
  const rtf = res.data.toString("latin1");
  const picts = extractRtfPicts(rtf);

  // 1 inline complex eq (\frac{a+b}{c}) + 2 display eqs (L=..., Maxwell align) + 3 JPEG figures = 6 picts
  assert.equal(picts.length, 6, `Expected 6 embedded picts (3 equations + 3 figures), got ${picts.length}`);

  const eqPicts = picts.filter((p) => p.blip === "pngblip");
  const figPicts = picts.filter((p) => p.blip === "jpegblip");
  assert.equal(eqPicts.length, 3, "Expected 3 PNG equation blips");
  assert.equal(figPicts.length, 3, "Expected 3 JPEG figure blips");

  // Verificar que los 3 PNG de ecuaciones son PNGs reales recortados (no páginas A4 completas) y display centradas
  const [inlineEq, eq1, maxwellEq] = eqPicts;
  for (const eq of eqPicts) {
    const dims = readImageDimensions(eq.bytes);
    assert.ok(dims && dims.type === "png", "Equation blip must be a valid PNG");
    assert.equal(eq.picw, dims.width);
    assert.equal(eq.pich, dims.height);
    assert.ok(eq.picwgoal > 100 && eq.picwgoal <= 9072, `Equation width ${eq.picwgoal} twips out of bounds`);
    assert.ok(eq.pichgoal > 100 && eq.pichgoal < 4000, `Equation height ${eq.pichgoal} twips looks uncropped`);
  }
  // Display equations centradas (\qc)
  assert.equal(eq1.pardAlign, "c");
  assert.equal(maxwellEq.pardAlign, "c");
  // Inline equation dentro del párrafo normal (\ql) y mucho más compacta que las display
  assert.equal(inlineEq.pardAlign, "l");
  assert.ok(inlineEq.pichgoal < maxwellEq.pichgoal);

  // Verificar las 3 figuras JPEG:
  // A4 (11906) - 2*2.5cm (2834) = textWidth 9072 twips
  // Figura 1: 0.62 * 9072 = 5625 twips, centrada (\qc)
  // Figura 2: 0.40 * 9072 = 3629 twips, izquierda (\ql)
  // Figura 3: 0.35 * 9072 = 3175 twips, derecha (\qr)
  assert.deepEqual(
    figPicts.map((f) => f.pardAlign),
    ["c", "l", "r"],
    "RTF figure alignments must strictly follow LaTeX (center / left / right)"
  );

  for (const fig of figPicts) {
    const dims = readImageDimensions(fig.bytes);
    assert.ok(dims && dims.type === "jpeg");
    assert.ok(fig.picwgoal > 0 && fig.picwgoal <= 9072, `Figure width ${fig.picwgoal} must fit inside textwidth`);
    assert.ok(fig.pichgoal > 0 && fig.pichgoal <= 12500, `Figure height ${fig.pichgoal} must fit inside page height`);
    // Aspect ratio preservado (832x1248 -> ratio 1.5)
    const ratio = fig.pichgoal / fig.picwgoal;
    const expectedRatio = dims.height / dims.width;
    assert.ok(Math.abs(ratio - expectedRatio) < 0.02, `Aspect ratio distorted: ${ratio} vs ${expectedRatio}`);
  }
  assert.ok(Math.abs(figPicts[0].picwgoal - Math.round(0.62 * 9072)) <= 30);
  assert.ok(Math.abs(figPicts[1].picwgoal - Math.round(0.4 * 9072)) <= 30);
  assert.ok(Math.abs(figPicts[2].picwgoal - Math.round(0.35 * 9072)) <= 30);
});

test("RTF + HTML + EPUB on composed multi-document project (with \\input): zero warnings and clean output", async () => {
  const baseSource = String.raw`\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[spanish]{babel}
\usepackage{lmodern}
\usepackage[margin=2.5cm]{geometry}
\usepackage{graphicx}
\usepackage{amsmath}
\usepackage{amssymb}
\usepackage{hyperref}
\title{Cuaderno de composición}
\author{Marina Cifuentes --- Taller de edición}
\date{14 de marzo de 2026}
\begin{document}
\maketitle
\input{capitulo-tipografia}
\newpage
\input{capitulo-maxwell}
\end{document}
`;
  const aux = [
    { slug: "capitulo-tipografia", source: extractBody(SAMPLES[0].source) },
    { slug: "capitulo-maxwell", source: `\\section{Ecuaciones de Maxwell}\n\n${extractBody(SAMPLES[1].source)}` },
  ];

  const html = await convertLatexWithPandoc(baseSource, "html", "Cuaderno de composición", aux);
  const htmlStr = html.data.toString("utf8");
  assert.equal(htmlStr.includes("\uFFFD"), false);
  assert.match(htmlStr, /<title>Cuaderno de composición<\/title>/);
  assert.match(htmlStr, /<figure[^>]*text-align:\s*center/i);

  const rtf = await convertLatexWithPandoc(baseSource, "rtf", "Cuaderno de composición", aux);
  const rtfStr = rtf.data.toString("latin1");
  const picts = extractRtfPicts(rtfStr);
  assert.equal(picts.filter((p) => p.blip === "pngblip").length, 3, "3 display equations (L, Maxwell, v)");
  assert.equal(picts.filter((p) => p.blip === "jpegblip").length, 1, "1 figure");
  assert.equal(picts.find((p) => p.blip === "jpegblip")!.pardAlign, "c");
  assert.ok(picts.find((p) => p.blip === "jpegblip")!.picwgoal < 6000);
  assert.equal(rtf.warnings.some((w) => w.includes("Could not determine image size")), false);

  const epub = await convertLatexWithPandoc(baseSource, "epub", "Cuaderno de composición", aux);
  const zip = await JSZip.loadAsync(epub.data);
  const opf = await zip.file("EPUB/content.opf")!.async("string");
  assert.equal(opf.includes("\uFFFD"), false, "EPUB metadata must not contain U+FFFD");
  assert.match(opf, /Cuaderno de composición/);
});
