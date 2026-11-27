import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, symlink, access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import JSZip from "jszip";
import { extractBody } from "./compose";
import type { ProjectBundle } from "./archive";
import { materializeProject, runLatexmk, pandocProjectSource, simplifyPandocPreamble } from "./project-build";
import { NUMERIC_CSL } from "./numeric-csl";
import { preserveHtmlSemantics } from "./html";
import { ensureJpegJfifHeader } from "./image-utils";
import {
  detectLatexLanguage,
  expandLatexInputs,
  hasLatexMakeTitle,
  hasLatexTitleCommand,
  inspectLatexImages,
  inspectLatexPageGeometry,
} from "./latex-semantics";
import { renderEquationsToPng } from "./math-raster";
import { preserveOdtSemantics } from "./odt";
import { parseRtfEquationsTsv, preserveRtfSemantics, RTF_LUA_FILTER } from "./rtf";

const execFileAsync = promisify(execFile);

/**
 * En contenedores con LC_CTYPE=POSIX, GHC (Pandoc) decodifica argumentos CLI como ASCII
 * y corrompe los caracteres UTF-8 a U+FFFD (). Forzamos C.UTF-8 en todos los subprocesos.
 */
const UTF8_ENV = { ...process.env, LANG: "C.UTF-8", LC_ALL: "C.UTF-8" };

export interface AuxFile {
  slug: string;
  source: string;
}

export interface CompileResult {
  ok: boolean;
  pdf: Buffer | null;
  pageBuffers: Buffer[];
  pageCount: number;
  errors: string[];
  warnings: string[];
  log: string;
  durationMs: number;
  wrappedFragment: boolean;
  engine?: string;
}

export interface PandocResult {
  data: Buffer;
  warnings: string[];
}

function sanitizeSlug(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9._-]/g, "").replace(/^\.+/, "");
}

/**
 * Prepara la fuente para pdflatex SIN alterar estilos del documento.
 * - Solo corrige \usepackage{inputenc} / \usepackage{fontenc} sin opción (que hacen fallar a pdflatex).
 * - Si es un fragmento (subdocumento abierto aparte sin \documentclass), lo envuelve en article estándar.
 */
export function prepareLatexSource(rawSource: string): { tex: string; wrappedFragment: boolean } {
  let tex = rawSource;

  // Normalizar rutas absolutas /images/... a relativas images/... dentro del workdir
  tex = tex.replace(/(\\includegraphics(?:\[[^\]]*\])?\{)\/(images\/[^}]+)\}/g, "$1$2}");

  const hasDocClass = /\\documentclass\b/.test(tex);
  const hasBeginDoc = /\\begin\{document\}/.test(tex);

  if (!hasDocClass && !hasBeginDoc) {
    const wrapped = [
      "\\documentclass[11pt,a4paper]{article}",
      "\\usepackage[utf8]{inputenc}",
      "\\usepackage[T1]{fontenc}",
      "\\usepackage[spanish]{babel}",
      "\\usepackage{lmodern}",
      "\\usepackage{graphicx}",
      "\\usepackage{amsmath}",
      "\\usepackage{amssymb}",
      "\\usepackage{hyperref}",
      "\\begin{document}",
      tex.trim(),
      "\\end{document}",
      "",
    ].join("\n");
    return { tex: wrapped, wrappedFragment: true };
  }

  // Solo añadir opciones obligatorias si el usuario puso el paquete desnudo
  tex = tex.replace(/\\usepackage\{inputenc\}/g, "\\usepackage[utf8]{inputenc}");
  tex = tex.replace(/\\usepackage\{fontenc\}/g, "\\usepackage[T1]{fontenc}");

  return { tex, wrappedFragment: false };
}

function parseLatexLog(log: string): { errors: string[]; warnings: string[] } {
  const lines = log.split("\n");
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("! ")) {
      const ctx: string[] = [line.trim()];
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        if (/^l\.\d+/.test(lines[j])) {
          ctx.push(lines[j].trim());
          break;
        }
      }
      const msg = ctx.join(" — ");
      if (!errors.includes(msg)) errors.push(msg);
    } else if (/^(LaTeX|Package \S+|Class \S+) Warning:/.test(line)) {
      const w = line.trim();
      if (!warnings.includes(w)) warnings.push(w);
    }
  }
  return { errors, warnings };
}

async function mountWorkdirImages(dir: string, normalizeJpegForPandoc: boolean) {
  const publicImages = path.join(process.cwd(), "public", "images");
  try {
    await access(publicImages);
  } catch {
    return;
  }

  if (!normalizeJpegForPandoc) {
    await symlink(publicImages, path.join(dir, "images"), "dir");
    return;
  }

  const targetDir = path.join(dir, "images");
  await mkdir(targetDir, { recursive: true });
  const entries = await readdir(publicImages, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(publicImages, entry.name);
    const dstPath = path.join(targetDir, entry.name);
    if (entry.isFile() && /\.jpe?g$/i.test(entry.name)) {
      const raw = await readFile(srcPath);
      const normalized = ensureJpegJfifHeader(raw);
      if (normalized !== raw) {
        await writeFile(dstPath, normalized);
      } else {
        await symlink(srcPath, dstPath);
      }
    } else {
      await symlink(srcPath, dstPath);
    }
  }
}

async function setupWorkdir(
  source: string,
  auxFiles: AuxFile[] = [],
  normalizeJpegForPandoc = false,
  project?: ProjectBundle
): Promise<{ dir: string; cwd: string; main: string; wrappedFragment: boolean }> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "taller-tex-"));
  if (project) {
    const materialized = await materializeProject(dir, project, normalizeJpegForPandoc);
    return { dir, cwd: materialized.cwd, main: materialized.main, wrappedFragment: false };
  }

  await mountWorkdirImages(dir, normalizeJpegForPandoc);

  // Escribir subdocumentos del proyecto para que \input{slug} se resuelva nativamente
  for (const f of auxFiles) {
    const clean = sanitizeSlug(f.slug);
    if (!clean) continue;
    const body = extractBody(f.source).replace(/(\\includegraphics(?:\[[^\]]*\])?\{)\/(images\/[^}]+)\}/g, "$1$2}");
    await writeFile(path.join(dir, `${clean}.tex`), body + "\n", "utf8");
  }

  const { tex, wrappedFragment } = prepareLatexSource(source);
  await writeFile(path.join(dir, "main.tex"), tex, "utf8");

  return { dir, cwd: dir, main: "main.tex", wrappedFragment };
}

async function compileLatexToPdfUncached(
  source: string,
  auxFiles: AuxFile[] = [],
  renderPages = true,
  project?: ProjectBundle
): Promise<CompileResult> {
  const t0 = Date.now();
  const { dir, cwd, main, wrappedFragment } = await setupWorkdir(source, auxFiles, false, project);
  const job = path.basename(main, path.extname(main));
  const engine = project?.engine ?? "pdflatex";
  try {
    const run = await runLatexmk(cwd, main, engine);
    let log = "";
    try { log = await readFile(path.join(cwd, `${job}.log`), "utf8"); }
    catch { log = `${run.stdout}\n${run.stderr}`.trim(); }

    // Extraer errores y avisos (también formato -file-line-error: ./main.tex:12: ...)
    const parsedLog = parseLatexLog(log);
    const flErrors = [...log.matchAll(/^\.\/([^:\n]+):(\d+):\s*(.+)$/gm)].map(
      (m) => `${m[1]}:${m[2]}: ${m[3].trim()}`
    );
    for (const fe of flErrors) {
      if (!parsedLog.errors.includes(fe)) parsedLog.errors.push(fe);
    }

    if (run.failed && parsedLog.errors.length === 0) parsedLog.errors.push(`latexmk no pudo completar ${main}. ${run.stderr.slice(-800) || run.stdout.slice(-1200)}`);
    let pdf: Buffer | null = null;
    try {
      pdf = await readFile(path.join(cwd, `${job}.pdf`));
    } catch {
      pdf = null;
    }

    const pageBuffers: Buffer[] = [];
    if (pdf && renderPages) {
      try {
        // Large theses are previewed at 110 DPI; the downloaded PDF stays vector and full quality.
        const { stdout: info } = await execFileAsync("pdfinfo", [`${job}.pdf`], { cwd, env: UTF8_ENV, timeout: 10000 });
        const pages = Number(/^Pages:\s+(\d+)/m.exec(info)?.[1] ?? 1);
        await execFileAsync("pdftoppm", ["-png", "-r", pages > 20 ? "110" : "150", `${job}.pdf`, "taller-page"], {
          cwd,
          env: UTF8_ENV,
          timeout: 120000,
          maxBuffer: 4 * 1024 * 1024,
        });
        const entries = (await readdir(cwd))
          .filter((n) => /^taller-page-\d+\.png$/.test(n))
          .sort((a, b) => {
            const na = Number(a.match(/\d+/)?.[0] ?? 0);
            const nb = Number(b.match(/\d+/)?.[0] ?? 0);
            return na - nb;
          });
        for (const name of entries) {
          pageBuffers.push(await readFile(path.join(cwd, name)));
        }
      } catch {
        /* si pdftoppm falla, al menos devolvemos el PDF */
      }
    }

    let pageCount = pageBuffers.length;
    if (pdf && pageCount === 0) {
      try {
        const { stdout } = await execFileAsync("pdfinfo", [`${job}.pdf`], {
          cwd,
          env: UTF8_ENV,
          timeout: 10000,
        });
        const m = /^Pages:\s+(\d+)/m.exec(stdout);
        if (m) pageCount = Number(m[1]);
      } catch {
        pageCount = 1;
      }
    }

    const ok = pdf !== null && pdf.length > 0 && parsedLog.errors.length === 0;
    return {
      ok,
      pdf,
      pageBuffers,
      pageCount,
      errors: parsedLog.errors,
      warnings: parsedLog.warnings,
      log: log.slice(-12000),
      durationMs: Date.now() - t0,
      wrappedFragment,
      engine: `latexmk + ${engine}`,
    };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

// Deduplicate native-project builds when switching between chapters. Maximum two cached results.
const nativeBuildCache = new Map<string, { at: number; result: Promise<CompileResult> }>();
export function compileLatexToPdf(source: string, auxFiles: AuxFile[] = [], renderPages = true, project?: ProjectBundle): Promise<CompileResult> {
  if (!project) return compileLatexToPdfUncached(source, auxFiles, renderPages);
  const hash = createHash("sha256").update(project.mainFile).update(project.engine).update(String(renderPages));
  for (const file of [...project.files].sort((a, b) => a.path.localeCompare(b.path))) {
    hash.update(`${Buffer.byteLength(file.path)}:${file.path}:${file.data.length}:`).update(file.data);
  }
  const key = hash.digest("hex");
  const existing = nativeBuildCache.get(key);
  if (existing && Date.now() - existing.at < 4 * 60 * 1000) return existing.result;
  if (nativeBuildCache.size >= 2) nativeBuildCache.delete(nativeBuildCache.keys().next().value!);
  const result = compileLatexToPdfUncached(source, auxFiles, renderPages, project);
  nativeBuildCache.set(key, { at: Date.now(), result });
  void result.then((r) => { if (!r.ok) nativeBuildCache.delete(key); }).catch(() => nativeBuildCache.delete(key));
  return result;
}

export type PandocFormat = "odt" | "epub" | "rtf" | "html" | "md" | "txt";

export async function convertLatexWithPandoc(
  source: string,
  format: PandocFormat,
  title: string,
  auxFiles: AuxFile[] = [],
  project?: ProjectBundle
): Promise<PandocResult> {
  const { dir, cwd, main } = await setupWorkdir(source, auxFiles, true, project);

  try {
    const outFile = `out.${format === "txt" ? "txt" : format}`;
    const conversion = project ? pandocProjectSource(project) : null;
    const preparedSource = conversion?.source ?? prepareLatexSource(source).tex;
    const inputName = project ? "taller-convert.tex" : main;
    if (project) await writeFile(path.join(cwd, inputName), preparedSource, "utf8");
    const args: string[] = [inputName, "-f", "latex"];
    const conversionWarnings = conversion?.warnings ?? [];
    if (project) conversionWarnings.push("Conversión editable: Pandoc conserva el contenido, pero portadas personalizadas, flotantes, paginación, estilos .sty y tablas complejas pueden diferir del PDF de TeX.");
    if (conversion?.bibliography.length) {
      args.push("--citeproc");
      for (const bib of conversion.bibliography) args.push(`--bibliography=${bib}`);
      await writeFile(path.join(cwd, "taller-numeric.csl"), NUMERIC_CSL, "utf8");
      args.push("--csl=taller-numeric.csl");
    }
    const language = detectLatexLanguage(preparedSource);
    const hasTitle = hasLatexTitleCommand(preparedSource);
    const hasMakeTitle = hasLatexMakeTitle(preparedSource);
    const analysisSource = expandLatexInputs(preparedSource, auxFiles);
    const sourceImages = inspectLatexImages(analysisSource);

    // Pandoc ignores Babel's main-language declaration unless supplied as metadata.
    if (language) args.push("--metadata", `lang=${language}`);

    switch (format) {
      case "odt":
        args.push("-t", "odt", "-o", outFile);
        break;
      case "epub":
        args.push("-t", "epub3", "--mathml");
        if (!hasTitle) args.push("--metadata", `title=${title || "Documento"}`);
        args.push("-o", outFile);
        break;
      case "rtf": {
        await writeFile(path.join(cwd, "taller-rtf-filter.lua"), RTF_LUA_FILTER, "utf8");
        args.push("--lua-filter=taller-rtf-filter.lua", "-t", "rtf", "-s", "-o", outFile);
        break;
      }
      case "html":
        args.push("-t", "html5", "-s", "--mathml", "--self-contained", "--number-sections");
        if (!hasTitle) args.push("--metadata", `title=${title || "Documento"}`);
        args.push("-o", outFile);
        break;
      case "md":
        args.push("-t", conversion?.bibliography.length ? "markdown-citations" : "markdown", "--wrap=none", "-o", outFile);
        break;
      case "txt":
        args.push("-t", "plain", "-o", outFile);
        break;
    }

    const executePandoc = () => execFileAsync("pandoc", args, { cwd, env: UTF8_ENV, timeout: 90000, maxBuffer: 12 * 1024 * 1024 });
    let stderr: string;
    try { ({ stderr } = await executePandoc()); }
    catch (error) {
      const details = error as { stderr?: string };
      if (!project || !/unexpected Tok|Error at/.test(details.stderr ?? "")) throw error;
      await writeFile(path.join(cwd, inputName), simplifyPandocPreamble(preparedSource), "utf8");
      conversionWarnings.push("Pandoc no pudo interpretar el preámbulo personalizado. Se usó un preámbulo de lectura simplificado SOLO para esta conversión; el original y el PDF no se han modificado.");
      ({ stderr } = await executePandoc());
    }

    let data: Buffer = await readFile(path.join(cwd, outFile));
    const warnings = [...conversionWarnings, ...stderr
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)];

    // Marcadores de salto de página (provenientes de \newpage en la copia de conversión):
    // ODT y HTML los restauran dentro de sus preserve*; aquí los formatos restantes.
    if (format === "rtf") {
      data = Buffer.from(data.toString("latin1").replace(/TALLERPB\d{4}TALLER/g, " \\page "), "latin1");
    } else if (format === "md" || format === "txt") {
      data = Buffer.from(
        data.toString("utf8").split("\n").filter((l) => !/^TALLERPB\d{4}TALLER$/.test(l.trim())).join("\n"),
        "utf8"
      );
    } else if (format === "epub") {
      const zip = await JSZip.loadAsync(data);
      for (const name of Object.keys(zip.files)) {
        const entry = zip.files[name];
        if (entry.dir || !/\.xhtml$/i.test(name)) continue;
        const s = (await entry.async("string"))
          .replace(/<p\b[^>]*>(?:(?!<\/p>)[\s\S])*?TALLERPB\d{4}TALLER(?:(?!<\/p>)[\s\S])*?<\/p>/gi, '<p style="page-break-before: always;"></p>')
          .replace(/TALLERPB\d{4}TALLER/g, "");
        zip.file(name, s);
      }
      data = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    }

    if (format === "odt") {
      const geometry = inspectLatexPageGeometry(preparedSource);
      const repaired = await preserveOdtSemantics(data, sourceImages, language, geometry);
      data = repaired.data;
      warnings.push(...repaired.warnings);
    } else if (format === "html") {
      const repaired = preserveHtmlSemantics(data.toString("utf8"), sourceImages, {
        hasMakeTitle,
        language,
      });
      data = Buffer.from(repaired.html, "utf8");
      warnings.push(...repaired.warnings);
    } else if (format === "rtf") {
      const geometry = inspectLatexPageGeometry(preparedSource);
      let eqTsv = "";
      try {
        eqTsv = await readFile(path.join(cwd, "taller-rtf-eqs.tsv"), "utf8");
      } catch {
        eqTsv = "";
      }
      const equations = parseRtfEquationsTsv(eqTsv);
      const { rendered, warnings: mathWarnings } = await renderEquationsToPng(
        equations,
        preparedSource,
        cwd,
        geometry.textWidthTwips
      );
      warnings.push(...mathWarnings);

      const repaired = preserveRtfSemantics(
        data.toString("latin1"),
        sourceImages,
        geometry,
        equations,
        rendered,
        language
      );
      data = Buffer.from(repaired.rtf, "latin1");
      warnings.push(...repaired.warnings);
    }

    return { data, warnings };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
