import { NextResponse } from "next/server";
import { compileLatexToPdf, type AuxFile } from "@/lib/compiler";
import { getProjectBundle } from "@/lib/project-store";
import { putFile } from "@/lib/fileStore";
import { parse } from "@/lib/latex";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;
function safeName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase().slice(0, 60) || "documento";
}
export async function POST(req: Request) {
  try {
    const body = await req.json() as { source?: string; title?: string; files?: AuxFile[]; projectId?: string; editingFile?: string };
    const project = body.projectId ? await getProjectBundle(body.projectId, body.editingFile && typeof body.source === "string" ? { path: body.editingFile, source: body.source } : undefined) : undefined;
    const source = project ? project.files.find((f) => f.path === project.mainFile)?.text ?? "" : body.source ?? "";
    if (!source.trim()) return NextResponse.json({ error: "Documento vacío" }, { status: 400 });
    const title = body.title?.trim() || parse(source).meta.title || "documento";
    const result = await compileLatexToPdf(source, Array.isArray(body.files) ? body.files : [], true, project);
    const file = result.pdf ? await putFile(`${safeName(title)}.pdf`, "application/pdf", result.pdf, { pageBuffers: result.pageBuffers, engine: `${result.engine} (${result.pageCount} pág. · ${result.durationMs} ms)` }) : null;
    return NextResponse.json({ ok: result.ok, hasPdf: !!result.pdf, file, pageCount: result.pageCount, pageUrls: file?.pageUrls ?? [], errors: result.errors, warnings: result.warnings, log: result.log, durationMs: result.durationMs, wrappedFragment: result.wrappedFragment, engine: result.engine, mainFile: project?.mainFile });
  } catch (error) { return NextResponse.json({ error: String(error) }, { status: 500 }); }
}
