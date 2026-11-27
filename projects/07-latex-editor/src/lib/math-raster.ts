import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { cropPngWhitespace } from "./image-utils";
import { extractLatexMathPreamble } from "./latex-semantics";

const execFileAsync = promisify(execFile);

const UTF8_ENV = { ...process.env, LANG: "C.UTF-8", LC_ALL: "C.UTF-8" };
const RENDER_DPI = 300;

export interface MathEquationSpec {
  id: number;
  display: boolean;
  tex: string;
}

export interface RenderedEquation {
  id: number;
  display: boolean;
  png: Buffer;
  widthPx: number;
  heightPx: number;
  widthTwips: number;
  heightTwips: number;
  descentHalfPts: number;
}

const STANDALONE_MATH_ENV =
  /^\\begin\{(align\*?|gather\*?|multline\*?|eqnarray\*?|flalign\*?|alignat\*?)\}/;

function formatEquationBody(eq: MathEquationSpec): string {
  const tex = eq.tex.trim();
  if (!eq.display) {
    return `\\noindent$${tex}$`;
  }
  if (STANDALONE_MATH_ENV.test(tex)) {
    // Evitar numeración ficticia por página en el archivo auxiliar
    return tex
      .replace(/^\\begin\{(align|gather|multline|eqnarray|flalign|alignat)\}/, "\\begin{$1*}")
      .replace(/\\end\{(align|gather|multline|eqnarray|flalign|alignat)\}$/, "\\end{$1*}");
  }
  return `\\[\n${tex}\n\\]`;
}

function buildMathTexDocument(equations: MathEquationSpec[], sourceForPreamble: string): string {
  const { fontSizePt, lines } = extractLatexMathPreamble(sourceForPreamble);
  const seen = new Set<string>([
    "\\usepackage[utf8]{inputenc}",
    "\\usepackage[T1]{fontenc}",
    "\\usepackage{lmodern}",
    "\\usepackage{amsmath}",
    "\\usepackage{amssymb}",
  ]);
  const extraLines: string[] = [];
  for (const l of lines) {
    if (!seen.has(l) && !/\\usepackage\{?(amsmath|amssymb|lmodern)\}?/.test(l)) {
      seen.add(l);
      extraLines.push(l);
    }
  }

  const pages = equations.map((eq) => formatEquationBody(eq)).join("\n\\newpage\n");
  return [
    `\\documentclass[${fontSizePt}pt,a4paper]{article}`,
    "\\usepackage[utf8]{inputenc}",
    "\\usepackage[T1]{fontenc}",
    "\\usepackage{lmodern}",
    "\\usepackage{amsmath}",
    "\\usepackage{amssymb}",
    "\\usepackage[margin=1cm]{geometry}",
    ...extraLines,
    "\\pagestyle{empty}",
    "\\begin{document}",
    pages,
    "\\end{document}",
    "",
  ].join("\n");
}

function toRendered(
  eq: MathEquationSpec,
  rawPng: Buffer,
  maxWidthTwips: number,
  fontSizePt: number
): RenderedEquation {
  const cropped = cropPngWhitespace(rawPng, eq.display ? 14 : 4, eq.display ? 10 : 3);
  let widthTwips = Math.max(80, Math.round((cropped.width / RENDER_DPI) * 1440));
  let heightTwips = Math.max(80, Math.round((cropped.height / RENDER_DPI) * 1440));

  if (widthTwips > maxWidthTwips) {
    const scale = maxWidthTwips / widthTwips;
    widthTwips = maxWidthTwips;
    heightTwips = Math.max(80, Math.round(heightTwips * scale));
  }

  // En inline math (p.ej. \frac{a}{b}), bajar ligeramente la caja para centrarla con el cuerpo del texto
  const lineHeightTwips = fontSizePt * 20;
  const descentHalfPts =
    !eq.display && heightTwips > lineHeightTwips
      ? Math.max(2, Math.min(20, Math.round(((heightTwips - lineHeightTwips * 0.72) / 2) / 10)))
      : 0;

  return {
    id: eq.id,
    display: eq.display,
    png: cropped.png,
    widthPx: cropped.width,
    heightPx: cropped.height,
    widthTwips,
    heightTwips,
    descentHalfPts,
  };
}

/**
 * Compila todas las ecuaciones del documento en una única pasada de pdflatex + pdftoppm (300 DPI)
 * y recorta cada página a su bounding box exacto.
 */
export async function renderEquationsToPng(
  equations: MathEquationSpec[],
  sourceForPreamble: string,
  workDir: string,
  maxWidthTwips: number
): Promise<{ rendered: Map<number, RenderedEquation>; warnings: string[] }> {
  const rendered = new Map<number, RenderedEquation>();
  const warnings: string[] = [];
  if (equations.length === 0) return { rendered, warnings };

  const { fontSizePt } = extractLatexMathPreamble(sourceForPreamble);
  const texPath = path.join(workDir, "taller-math.tex");
  await writeFile(texPath, buildMathTexDocument(equations, sourceForPreamble), "utf8");

  let compiled = false;
  try {
    await execFileAsync(
      "pdflatex",
      ["-interaction=nonstopmode", "-no-shell-escape", "taller-math.tex"],
      { cwd: workDir, env: UTF8_ENV, timeout: 25000, maxBuffer: 8 * 1024 * 1024 }
    );
    compiled = true;
  } catch {
    // Incluso con warnings o errores menores, pdflatex suele generar taller-math.pdf
    compiled = true;
  }

  if (compiled) {
    try {
      await execFileAsync("pdftoppm", ["-png", "-r", String(RENDER_DPI), "taller-math.pdf", "taller-eq"], {
        cwd: workDir,
        env: UTF8_ENV,
        timeout: 25000,
        maxBuffer: 8 * 1024 * 1024,
      });

      const entries = (await readdir(workDir))
        .filter((n) => /^taller-eq-\d+\.png$/.test(n))
        .sort((a, b) => Number(a.match(/\d+/)?.[0] ?? 0) - Number(b.match(/\d+/)?.[0] ?? 0));

      if (entries.length === equations.length) {
        for (let i = 0; i < equations.length; i++) {
          const buf = await readFile(path.join(workDir, entries[i]));
          rendered.set(equations[i].id, toRendered(equations[i], buf, maxWidthTwips, fontSizePt));
        }
        return { rendered, warnings };
      }
      warnings.push(
        `RTF: se esperaban ${equations.length} ecuaciones renderizadas y se obtuvieron ${entries.length}; compilando individualmente.`
      );
    } catch (err) {
      warnings.push(`RTF: fallo al rasterizar ecuaciones en lote (${String(err)}).`);
    }
  }

  // Fallback individual por ecuación (por si una ecuación aislada tenía algún error de sintaxis)
  for (const eq of equations) {
    const singleBase = `taller-math-s${eq.id}`;
    await writeFile(path.join(workDir, `${singleBase}.tex`), buildMathTexDocument([eq], sourceForPreamble), "utf8");
    try {
      await execFileAsync(
        "pdflatex",
        ["-interaction=nonstopmode", "-no-shell-escape", `${singleBase}.tex`],
        { cwd: workDir, env: UTF8_ENV, timeout: 15000, maxBuffer: 4 * 1024 * 1024 }
      ).catch(() => undefined);
      await execFileAsync("pdftoppm", ["-png", "-r", String(RENDER_DPI), `${singleBase}.pdf`, `${singleBase}-p`], {
        cwd: workDir,
        env: UTF8_ENV,
        timeout: 15000,
        maxBuffer: 4 * 1024 * 1024,
      });
      const files = (await readdir(workDir)).filter((n) => n.startsWith(`${singleBase}-p`) && n.endsWith(".png"));
      if (files.length > 0) {
        const buf = await readFile(path.join(workDir, files[0]));
        rendered.set(eq.id, toRendered(eq, buf, maxWidthTwips, fontSizePt));
      }
    } catch {
      warnings.push(`RTF: no se pudo renderizar la ecuación #${eq.id + 1}.`);
    }
  }

  return { rendered, warnings };
}
