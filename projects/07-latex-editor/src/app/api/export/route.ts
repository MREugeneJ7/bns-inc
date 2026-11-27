import { NextResponse } from "next/server";
import { exportDocument, FORMAT_LABEL, type ExportFormat } from "@/lib/exporters";
import { listFiles, putFile, removeFile } from "@/lib/fileStore";
import { getProjectBundle } from "@/lib/project-store";
import { parse } from "@/lib/latex";
import type { AuxFile } from "@/lib/compiler";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;
const FORMATS = Object.keys(FORMAT_LABEL) as ExportFormat[];
export async function GET() {
  return NextResponse.json({ formats: FORMATS.map((f) => ({ format: f, label: FORMAT_LABEL[f] })), files: await listFiles() });
}
export async function POST(req: Request) {
  try {
    const body = await req.json() as { source?: string; format?: string; title?: string; files?: AuxFile[]; direct?: boolean; projectId?: string; editingFile?: string };
    const format = (body.format ?? "pdf") as ExportFormat;
    if (!FORMATS.includes(format)) return NextResponse.json({ error: "Formato no soportado" }, { status: 400 });
    const project = body.projectId ? await getProjectBundle(body.projectId, body.editingFile && typeof body.source === "string" ? { path: body.editingFile, source: body.source } : undefined) : undefined;
    const source = project ? project.files.find((f) => f.path === project.mainFile)?.text ?? "" : body.source ?? "";
    if (!source.trim()) return NextResponse.json({ error: "Documento vacío" }, { status: 400 });
    const title = body.title?.trim() || parse(source).meta.title || "documento";
    const result = await exportDocument(format, title, source, Array.isArray(body.files) ? body.files : [], project);
    if (body.direct) return new Response(new Uint8Array(result.data), { headers: { "Content-Type": result.mime, "Content-Disposition": `attachment; filename="${result.filename}"`, "Cache-Control": "no-store" } });
    const stored = await putFile(result.filename, result.mime, result.data, { pageBuffers: result.pageBuffers, engine: result.engine });
    return NextResponse.json({ ok: true, file: stored, engine: result.engine, warnings: result.warnings ?? [] }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 }); }
}
export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  await removeFile(id); return NextResponse.json({ ok: true });
}
