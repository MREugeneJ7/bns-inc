import path from "node:path";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { safeProjectPath, expandProjectSource, type ProjectBundle } from "./archive";
import { ensureJpegJfifHeader } from "./image-utils";
import { detectLatexLanguage, extractLatexMathPreamble, withoutLatexComments } from "./latex-semantics";
import JSZip from "jszip";

export const PAGE_BREAK_MARKER = (n: number) => `TALLERPB${String(n).padStart(4, "0")}TALLER`;
const PAGE_BREAK_RE = /TALLERPB\d{4}TALLER/g;

function readBalancedGroup(s: string, start: number): { value: string; end: number } | null {
  if (s[start] !== "{") return null;
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (ch === "\\") {
      i++;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return { value: s.slice(start + 1, i), end: i + 1 };
    }
  }
  return null;
}

/**
 * Todas las apariciones balanceadas de \begin{env}...\end{env} (anidado).
 * Rango del contenido: [contentStart, endStart) — excluye ambos comandos.
 */
function findEnvBlocks(source: string, env: string): Array<{ begin: number; end: number; contentStart: number; endStart: number }> {
  const re = new RegExp(`\\\\(begin|end)\\{${env}\\}`, "g");
  const out: Array<{ begin: number; end: number; contentStart: number; endStart: number }> = [];
  const stack: Array<{ begin: number; contentStart: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    if (m[1] === "begin") stack.push({ begin: m.index, contentStart: m.index + m[0].length });
    else if (stack.length) {
      const open = stack.pop()!;
      out.push({ begin: open.begin, end: m.index + m[0].length, endStart: m.index, contentStart: open.contentStart });
    }
  }
  return out;
}

/** \newenvironment{name}{beg}{end} definidos en el propio documento. */
function collectNewEnvironments(source: string): Map<string, { beg: string; end: string }> {
  const map = new Map<string, { beg: string; end: string }>();
  const re = /\\newenvironment\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    const nameG = readBalancedGroup(source, m.index + m[0].length - 1);
    if (!nameG) continue;
    const name = nameG.value.trim();
    if (!/^[a-zA-Z@]+$/.test(name)) continue;
    let p = nameG.end;
    while (p < source.length && /\s/.test(source[p])) p++;
    const beg = readBalancedGroup(source, p);
    if (!beg) continue;
    p = beg.end;
    while (p < source.length && /\s/.test(source[p])) p++;
    const end = readBalancedGroup(source, p);
    if (!end) continue;
    map.set(name, { beg: beg.value, end: end.value });
  }
  return map;
}

/**
 * \begin{list}...\item[rotulo] pierde el rótulo en el lector de Pandoc (los convierte a
 * list/Para y descartan el item label). Se degrada a "rótulo + contenido" en línea para
 * que sobreviva a la conversión (p. ej. "Palabras clave: Física, ...").
 */
function demoteListLabel(beg: string, end: string): { beg: string; end: string } | null {
  if (!beg.startsWith("\\begin{list}")) return null;
  let i = "\\begin{list}".length;
  for (let k = 0; k < 2; k++) {
    while (i < beg.length && /\s/.test(beg[i])) i++;
    if (beg[i] === "{") {
      const g = readBalancedGroup(beg, i);
      if (!g) return null;
      i = g.end;
    } else break;
  }
  const m = /^\s*\\item\[([^\]]*)\]([\s\S]*)$/.exec(beg.slice(i));
  if (!m) return null;
  return { beg: `${m[1].trim()} ${m[2].trim()}`.trim() + "\n", end: end.replace(/\\end\{list\}\s*$/, "").trim() };
}

function expandEnvironments(source: string, defs: Map<string, { beg: string; end: string }>): { text: string; used: string[] } {
  let text = source;
  const used: string[] = [];
  for (let pass = 0; pass < 8; pass++) {
    let changed = false;
    for (const [name, def] of defs) {
      const demoted = demoteListLabel(def.beg, def.end);
      const d = demoted ?? def;
      const beginRe = new RegExp(`\\\\begin\\{${name}\\}`, "g");
      const endRe = new RegExp(`\\\\end\\{${name}\\}`, "g");
      if (beginRe.test(text) || endRe.test(text)) {
        text = text.replace(beginRe, () => d.beg).replace(endRe, () => d.end);
        if (!used.includes(name)) used.push(name);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return { text, used };
}

const ABSTRACT_HEADING: Record<string, string> = {
  es: "Resumen",
  de: "Zusammenfassung",
  fr: "Résumé",
  pt: "Resumo",
  it: "Sintesi",
};

const exec = promisify(execFile);
export const TEX_ENV = { ...process.env, LANG: "C.UTF-8", LC_ALL: "C.UTF-8", openin_any: "p", openout_any: "p" };

export async function materializeProject(root: string, bundle: ProjectBundle, normalizeImages: boolean) {
  safeProjectPath(bundle.mainFile);
  for (const f of bundle.files) {
    const name = safeProjectPath(f.path);
    // Never run uploaded build configuration or reuse generated dependency state.
    // Originals remain in PostgreSQL; only the disposable build directory omits these entries.
    if (/(^|\/)(\.?latexmkrc|\.latexmkrc|texmf\.cnf)$/i.test(name)) continue;
    if (/\.(aux|log|fls|fdb_latexmk|toc|lof|lot|synctex(?:\.gz)?|blg|bcf|run\.xml)$/i.test(name)) continue;
    if (name === bundle.mainFile.replace(/\.tex$/i, ".pdf")) continue;
    const destination = path.join(root, name);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, normalizeImages && /\.jpe?g$/i.test(name) ? ensureJpegJfifHeader(f.data) : f.data);
  }
  const mainPath = path.join(root, bundle.mainFile);
  const source = await readFile(mainPath, "utf8");
  return { cwd: path.dirname(mainPath), main: path.basename(mainPath), source };
}

export async function runLatexmk(cwd: string, main: string, engine = "pdflatex") {
  const selected = ["pdflatex", "xelatex", "lualatex"].includes(engine) ? engine : "pdflatex";
  const mode = selected === "xelatex" ? "-xelatex" : selected === "lualatex" ? "-lualatex" : "-pdf";
  const engineOption = selected === "xelatex" ? "-xelatex=" : selected === "lualatex" ? "-lualatex=" : "-pdflatex=";
  try {
    const result = await exec("latexmk", ["-norc", mode, `${engineOption}${selected} -no-shell-escape %O %S`, "-interaction=nonstopmode", "-halt-on-error", "-file-line-error", "-e", "$max_repeat=6;", main], { cwd, env: TEX_ENV, timeout: 120000, maxBuffer: 12 * 1024 * 1024 });
    return { stdout: result.stdout, stderr: result.stderr, failed: false };
  } catch (error) {
    const e = error as { stdout?: string; stderr?: string; message?: string };
    return { stdout: e.stdout ?? "", stderr: e.stderr ?? e.message ?? "latexmk no disponible", failed: true };
  }
}

export interface PandocProjectProjection {
  source: string;
  warnings: string[];
  bibliography: string[];
  pageBreaks: number;
}

/**
 * Conversion-only projection. Original project sources and PDF compilation stay untouched.
 *
 * Ajustes de fidelidad aplicados SOLO a la copia de conversión:
 * 1. \today → fecha actual (es exactamente lo que TeX imprime al compilar).
 * 2. \begin{abstract}…\end{abstract}: el lector LaTeX de Pandoc lo promueve a metadatos del
 *    documento y lo imprime en la primera página, cargando el prefacio. Se convierte en el
 *    título no numerado que la clase de documento imprime (Resumen/Abstract).
 * 3. \newenvironment{name}{…}{…}: se expanden las definiciones propias del documento para que
 *    sus rótulos y encabezados (Palabras clave:, Abstract, …) sobrevivan a la conversión.
 * 4. \newpage/\clearpage/\pagebreak: el lector de Pandoc los descarta. Se sustituyen por
 *    marcadores que cada escritor restaura como salto de página real.
 */
export function pandocProjectSource(bundle: ProjectBundle): PandocProjectProjection {
  let expanded = expandProjectSource(bundle);
  const warnings: string[] = [];
  const transformations: string[] = [];
  const mainDir = path.posix.dirname(bundle.mainFile);
  const files = new Set(bundle.files.map((f) => f.path));
  const bibliography: string[] = [];
  for (const m of expanded.matchAll(/\\(?:bibliography|addbibresource)(?:\[[^\]]*\])?\{([^}]+)\}/g)) {
    for (const item of m[1].split(",")) {
      const rel = /\.bib$/i.test(item.trim()) ? item.trim() : `${item.trim()}.bib`;
      const full = path.posix.normalize(path.posix.join(mainDir, rel));
      if (files.has(full) && !bibliography.includes(rel)) bibliography.push(rel);
      else if (!files.has(full)) warnings.push(`Bibliografía no encontrada: ${rel}`);
    }
  }
  expanded = expanded.replace(/(\\includegraphics(?:\[[^\]]*\])?\{)([^}]+)\}/g, (all, prefix: string, raw: string) => {
    let name = raw.trim().replace(/^\//, "");
    if (!/\.(png|jpe?g|pdf|eps|svg)$/i.test(name)) {
      const suffix = [".png", ".jpg", ".jpeg", ".pdf", ".eps", ".svg"].find((ext) => files.has(path.posix.normalize(path.posix.join(mainDir, name + ext))));
      if (suffix) name += suffix;
    }
    return `${prefix}${name}}`;
  });

  const lang = detectLatexLanguage(expanded);
  const primaryLang = lang?.split("-")[0]?.toLowerCase() ?? "es";

  if (/\\today\b/.test(expanded)) {
    const dateStr = new Intl.DateTimeFormat(primaryLang, { day: "numeric", month: "long", year: "numeric" }).format(new Date());
    expanded = expanded.replace(/\\today\b/g, dateStr);
    transformations.push(`\\today resuelto a ${dateStr}`);
  }

  const abstractBlocks = findEnvBlocks(expanded, "abstract");
  if (abstractBlocks.length) {
    const headingText = ABSTRACT_HEADING[primaryLang] ?? "Abstract";
    const cls = /\\documentclass(?:\[[^\]]*\])?\{([^}]+)\}/.exec(expanded)?.[1] ?? "";
    const heading = /report|book/.test(cls) ? `\\chapter*{${headingText}}` : `\\section*{${headingText}}`;
    for (let i = abstractBlocks.length - 1; i >= 0; i--) {
      const b = abstractBlocks[i];
      expanded = expanded.slice(0, b.begin) + `${heading}\n` + expanded.slice(b.contentStart, b.endStart) + expanded.slice(b.end);
    }
    transformations.push(`el entorno abstract se convierte en un título no numerado «${headingText}» (el lector de Pandoc lo movía a la primera página)`);
  }

  const envDefs = collectNewEnvironments(expanded);
  if (envDefs.size) {
    const { text, used } = expandEnvironments(expanded, envDefs);
    if (used.length) {
      expanded = text;
      transformations.push(`entornos propios expandidos: ${used.join(", ")}`);
    }
  }

  let pageBreaks = 0;
  expanded = expanded.replace(/\\(?:newpage|clearpage|pagebreak)(?:\s*\[[^\]]*\])?/g, () => PAGE_BREAK_MARKER(++pageBreaks));
  if (pageBreaks) transformations.push(`${pageBreaks} saltos de página restaurados`);

  const clean = withoutLatexComments(expanded);
  for (const name of ["algorithm", "algorithm2e", "tikzpicture", "lstlisting", "sourcecode", "littlesourcecode"]) {
    if (clean.includes(`\\begin{${name}}`)) warnings.push(`Conversión: el entorno ${name} no garantiza la maquetación de TeX; consulta el PDF para fidelidad exacta.`);
  }
  if (transformations.length) {
    warnings.push(
      "Ajustes de la conversión (solo en la copia de conversión; el proyecto no se modifica): " +
        transformations.join("; ") +
        ". El índice de \\tableofcontents no se reproduce porque sus números de página corresponderían al PDF."
    );
  }
  return { source: expanded, warnings, bibliography, pageBreaks };
}

export function simplifyPandocPreamble(source: string): string {
  const begin = /\\begin\{document\}/.exec(source);
  if (!begin) return source;
  const preamble = source.slice(0, begin.index);
  const cls = /\\documentclass(?:\[[^\]]*\])?\{([^}]+)\}/.exec(preamble)?.[1] ?? "article";
  const macros = extractLatexMathPreamble(source).lines.filter((l) => !l.startsWith("\\usepackage"));
  // Metadata commands may contain balanced nested groups: retain their complete source lines.
  const metadata = preamble.split("\n").filter((l) => /^\s*\\(title|author|date)\s*\{/.test(l));
  return [`\\documentclass{${cls}}`, "\\usepackage{amsmath,amssymb,graphicx}", ...macros, ...metadata, source.slice(begin.index)].join("\n");
}
