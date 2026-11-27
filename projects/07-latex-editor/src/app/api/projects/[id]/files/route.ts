import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, projectFiles, projects } from "@/db/schema";
import { setCompatibility } from "@/lib/project-store";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(_req: Request, { params }: Context) {
  const { id } = await params;
  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  const [files, docs] = await Promise.all([
    db.select({ id: projectFiles.id, path: projectFiles.path, isText: projectFiles.isText, size: projectFiles.size, excluded: projectFiles.excluded }).from(projectFiles).where(eq(projectFiles.projectId, id)),
    db.select({ id: documents.id, path: documents.filePath, source: documents.source }).from(documents).where(eq(documents.projectId, id)),
  ]);
  const listing = files.map((f) => ({ ...f, documentId: docs.find((d) => d.path === f.path)?.id ?? null }));
  for (const d of docs) if (d.path && !listing.some((f) => f.path === d.path)) listing.push({ id: d.id, path: d.path, isText: true, size: Buffer.byteLength(d.source), excluded: false, documentId: d.id });
  return NextResponse.json({ project, files: listing });
}
export async function PATCH(req: Request, { params }: Context) {
  try {
    const { id } = await params;
    const body = await req.json() as { changeIds?: string[]; apply?: boolean; path?: string; excluded?: boolean };
    if (body.changeIds) return NextResponse.json({ project: await setCompatibility(id, body.changeIds, body.apply !== false) });
    if (body.path && typeof body.excluded === "boolean") {
      await db.update(projectFiles).set({ excluded: body.excluded }).where(and(eq(projectFiles.projectId, id), eq(projectFiles.path, body.path)));
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) { return NextResponse.json({ error: String(error) }, { status: 400 }); }
}
