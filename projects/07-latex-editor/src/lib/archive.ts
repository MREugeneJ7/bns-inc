import JSZip from "jszip";
import path from "node:path";
import { withoutLatexComments } from "./latex-semantics";
import type { CompatibilityChange } from "@/db/schema";

export interface ArchiveEntry { path: string; data: Buffer; text?: string }
export interface ProjectBundle {
  mainFile: string;
  engine: "pdflatex" | "xelatex" | "lualatex";
  files: ArchiveEntry[];
  compatibility?: CompatibilityChange[];
}
export const TEXT_EXTENSIONS = /\.(tex|bib|sty|cls|ldf|bst|cfg|def|ist|txt|md|csv|dat|tikz|pgf|svg|csl|bbl)$/i;
export function safeProjectPath(input: string): string {
  const name = input.replace(/\\/g, "/");
  if (!name || name.startsWith("/") || /^[a-z]:/i.test(name) || /[\x00-\x1f]/.test(name) || name.split("/").some((p) => p === ".." || p === ".")) {
    throw new Error(`Ruta de archivo no permitida: ${input}`);
  }
  return name;
}
export function isZip(data: Uint8Array): boolean {
  return data.length >= 4 && data[0] === 0x50 && data[1] === 0x4b && data[2] === 3 && data[3] === 4;
}
export async function readProjectZip(data: Buffer): Promise<{ files: ArchiveEntry[]; mainFile: string; candidates: string[]; warnings: string[] }> {
  if (data.length > 30 * 1024 * 1024) throw new Error("El ZIP supera el límite de 30 MB.");
  if (!isZip(data)) throw new Error("El archivo no contiene una firma ZIP válida.");
  const zip = await JSZip.loadAsync(data, { checkCRC32: false });
  const entries = Object.values(zip.files).filter((e) => !e.dir);
  if (entries.length > 1500) throw new Error("Máximo 1500 archivos por proyecto.");
  let total = 0;
  const files: ArchiveEntry[] = [];
  const warnings: string[] = [];
  const names = new Set<string>();
  for (const entry of entries) {
    const permissions = typeof entry.unixPermissions === "string" ? parseInt(entry.unixPermissions, 8) : entry.unixPermissions;
    if (permissions && (permissions & 0xf000) === 0xa000) throw new Error(`Enlace simbólico no permitido: ${entry.name}`);
    const rawName = (entry as typeof entry & { unsafeOriginalName?: string }).unsafeOriginalName ?? entry.name;
    const name = safeProjectPath(rawName);
    if (name.startsWith("__MACOSX/") || name.endsWith(".DS_Store") || name.split("/").includes(".git")) continue;
    if (names.has(name)) throw new Error(`Ruta duplicada en ZIP: ${name}`);
    names.add(name);
    const size = (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;
    if (size > 15 * 1024 * 1024 || total + size > 80 * 1024 * 1024) throw new Error("ZIP demasiado grande al descomprimir (80 MB total / 15 MB por archivo).");
    const bytes = await entry.async("nodebuffer");
    total += bytes.length;
    if (bytes.length > 15 * 1024 * 1024 || total > 80 * 1024 * 1024) throw new Error("El ZIP excede el límite descomprimido.");
    let text: string | undefined;
    if (TEXT_EXTENSIONS.test(name)) {
      try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
      catch { text = new TextDecoder("windows-1252").decode(bytes); warnings.push(`${name}: texto Windows-1252, convertido a UTF-8 en la copia editable; original conservado.`); }
    }
    files.push({ path: name, data: bytes, ...(text !== undefined ? { text } : {}) });
  }
  const candidates = files.filter((f) => /\.tex$/i.test(f.path) && /\\documentclass\b/.test(withoutLatexComments(f.text ?? "")))
    .map((f) => f.path).sort((a, b) => {
      const score = (s: string) => /(^|\/)main\.tex$/i.test(s) ? 0 : /(^|\/)(master|principal|tfm)\.tex$/i.test(s) ? 1 : 2;
      return score(a) - score(b) || a.length - b.length || a.localeCompare(b);
    });
  if (!candidates.length) throw new Error("No se encontró ningún .tex con \\documentclass en el ZIP.");
  return { files, candidates, mainFile: candidates[0], warnings };
}

/** Narrow, auditable fixes. These are proposals, never applied by the archive reader. */
export function proposeCompatibility(files: ArchiveEntry[]): CompatibilityChange[] {
  const result: CompatibilityChange[] = [];
  for (const file of files) {
    if (file.text === undefined) continue;
    if (/\.ldf$/i.test(file.path) && /(?:199\d|200[0-9])/.test(file.text.slice(0, 3000)) && !/(?:201\d|202\d)/.test(file.text.slice(0, 3000))) {
      result.push({ id: `exclude:${file.path}`, path: file.path, action: "exclude", description: "Archivo de idioma antiguo que sustituye al Babel instalado. Usar el del sistema sin borrar el original.", applied: false });
    }
    if (/\.tex$/i.test(file.path)) {
      const re = /\\(subsubsection|subsection|section|chapter)(\*?)\{\\hypertarget\{([^}]+)\}\{([^}]+)\}\}/g;
      for (const match of file.text.matchAll(re)) {
        result.push({ id: `anchor:${file.path}:${match.index}`, path: file.path, action: "replace", description: "Proteger un ancla hyperref dentro de un título y sus marcadores PDF.", before: match[0], after: `\\${match[1]}${match[2]}{\\texorpdfstring{\\protect\\hypertarget{${match[3]}}{${match[4]}}}{${match[4]}}}`, applied: false });
      }
    }
    if (/\.bib$/i.test(file.path)) {
      for (const match of file.text.matchAll(/^\s*(publisher|journal|title|organization|institution)\s*=\s*[^\n]*$/gmi)) {
        if (!/(?<!\\)&/.test(match[0])) continue;
        result.push({ id: `bib:${file.path}:${match.index}`, path: file.path, action: "replace", description: "Escapar & en un campo bibliográfico para evitar un error de alineación en el .bbl.", before: match[0], after: match[0].replace(/(?<!\\)&/g, "\\&"), applied: false });
      }
    }
  }
  return result;
}

export function expandProjectSource(bundle: ProjectBundle): string {
  const sources = new Map(bundle.files.filter((f) => f.text !== undefined).map((f) => [f.path, f.text!]));
  const mainDir = path.posix.dirname(bundle.mainFile);
  const expand = (name: string, parents: Set<string>): string => {
    if (parents.has(name)) throw new Error(`Inclusión circular: ${[...parents, name].join(" → ")}`);
    const text = sources.get(name);
    if (text === undefined) throw new Error(`Archivo de entrada no encontrado: ${name}`);
    return withoutLatexComments(text).replace(/\\(?:input|include)\s*\{([^}]+)\}/g, (original, target: string) => {
      const rel = /\.tex$/i.test(target.trim()) ? target.trim() : `${target.trim()}.tex`;
      const resolved = [path.posix.normalize(path.posix.join(mainDir, rel)), path.posix.normalize(path.posix.join(path.posix.dirname(name), rel))].find((p) => sources.has(p));
      return resolved ? expand(resolved, new Set([...parents, name])) : original;
    });
  };
  return expand(bundle.mainFile, new Set());
}

export async function zipProject(files: ArchiveEntry[]): Promise<Buffer> {
  const zip = new JSZip();
  for (const f of files) zip.file(safeProjectPath(f.path), f.data);
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
