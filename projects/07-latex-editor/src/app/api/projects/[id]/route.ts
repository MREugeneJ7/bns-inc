import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, projectFiles, projects } from "@/db/schema";
export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string }> };
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json() as { name?: string; mainFile?: string; engine?: string };
    const patch: Partial<typeof projects.$inferInsert> = { updatedAt: new Date() };
    if (body.name?.trim()) patch.name = body.name.trim();
    if (body.engine) {
      if (!["pdflatex", "xelatex", "lualatex"].includes(body.engine)) throw new Error("Motor no válido.");
      patch.engine = body.engine;
    }
    if (body.mainFile) {
      const [file] = await db.select({ id: documents.id }).from(documents).where(and(eq(documents.projectId, id), eq(documents.filePath, body.mainFile)));
      if (!file || !/\.tex$/i.test(body.mainFile)) throw new Error("El principal debe ser un .tex del proyecto.");
      patch.mainFile = body.mainFile;
    }
    const [row] = await db.update(projects).set(patch).where(eq(projects.id, id)).returning();
    if (!row) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    return NextResponse.json(row);
  } catch (error) { return NextResponse.json({ error: String(error) }, { status: 400 }); }
}
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  await db.transaction(async (tx) => {
    await tx.delete(documents).where(eq(documents.projectId, id));
    await tx.delete(projectFiles).where(eq(projectFiles.projectId, id));
    await tx.delete(projects).where(eq(projects.id, id));
  });
  return NextResponse.json({ ok: true });
}
