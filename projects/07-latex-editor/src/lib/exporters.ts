import { compileLatexToPdf, convertLatexWithPandoc, type AuxFile, type PandocFormat } from "./compiler";
import { EXTENSION, FORMAT_LABEL, FORMATS, type ExportFormat } from "./formats";
import { zipProject, type ProjectBundle } from "./archive";
export { EXTENSION, FORMAT_LABEL, FORMATS };
export type { ExportFormat };
export interface ExportResult {
  filename: string; mime: string; data: Buffer; engine: string; pageBuffers?: Buffer[]; warnings?: string[];
}
const MIME: Record<ExportFormat, string> = {
  pdf: "application/pdf", tex: "application/x-tex", odt: "application/vnd.oasis.opendocument.text",
  md: "text/markdown; charset=utf-8", txt: "text/plain; charset=utf-8", rtf: "application/rtf", html: "text/html; charset=utf-8", epub: "application/epub+zip",
};
function safeName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase().slice(0, 60) || "documento";
}
export async function exportDocument(format: ExportFormat, title: string, source: string, auxFiles: AuxFile[] = [], project?: ProjectBundle): Promise<ExportResult> {
  const base = safeName(title);
  const filename = `${base}.${EXTENSION[format]}`;
  if (format === "tex") {
    if (project) {
      const instructions = `Proyecto LaTeX\nPrincipal: ${project.mainFile}\nMotor: ${project.engine}\nCompilar con: latexmk -cd -${project.engine === "xelatex" ? "xelatex" : project.engine === "lualatex" ? "lualatex" : "pdf"} -norc -interaction=nonstopmode -no-shell-escape ${project.mainFile}\nLos cambios de compatibilidad aprobados se describen en taller-build.json. El ZIP original se descarga por separado desde el panel del proyecto.\n`;
      const files = [...project.files, { path: "TALLER-LEEME.txt", data: Buffer.from(instructions) }, { path: "taller-build.json", data: Buffer.from(JSON.stringify({ mainFile: project.mainFile, engine: project.engine, compatibility: project.compatibility ?? [] }, null, 2)) }];
      return { filename: `${base}-latex.zip`, mime: "application/zip", data: await zipProject(files), engine: "LaTeX · proyecto completo" };
    }
    return { filename, mime: MIME.tex, data: Buffer.from(source, "utf8"), engine: "latex (fuente exacta)" };
  }
  if (format === "pdf") {
    const res = await compileLatexToPdf(source, auxFiles, true, project);
    if (!res.pdf || !res.ok) throw new Error(res.errors.slice(0, 3).join(" | ") || "Error al compilar con latexmk");
    return { filename, mime: MIME.pdf, data: res.pdf, engine: `${res.engine} (${res.pageCount} pág. · ${res.durationMs} ms)`, pageBuffers: res.pageBuffers, warnings: res.warnings };
  }
  const res = await convertLatexWithPandoc(source, format as PandocFormat, title, auxFiles, project);
  return { filename, mime: MIME[format], data: res.data, engine: format === "rtf" ? "pandoc + pdflatex" : "pandoc", warnings: res.warnings };
}
