import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { parse, wordCount } from "@/lib/latex";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

/** Recolecta el documento y todos sus descendientes (BFS). */
async function subtreeIds(rootId: string): Promise<string[]> {
  const ids = [rootId];
  let frontier = [rootId];
  while (frontier.length) {
    const rows = await db.select({ id: documents.id, parentId: documents.parentId }).from(documents).where(inArray(documents.parentId, frontier));
    if (!rows.length) break;
    for (const r of rows) ids.push(r.id);
    frontier = rows.map((r) => r.id);
  }
  return ids;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Identificador no válido" }, { status: 400 });
  const [row] = await db.select().from(documents).where(eq(documents.id, id));
  if (!row) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Identificador no válido" }, { status: 400 });
    const body = (await req.json()) as { title?: string; source?: string };
    const patch: Partial<typeof documents.$inferInsert> = { updatedAt: new Date() };
    if (typeof body.title === "string") patch.title = body.title.trim() || "Sin título";
    if (typeof body.source === "string") {
      const parsed = parse(body.source);
      patch.source = body.source;
      patch.words = wordCount(parsed.blocks);
      patch.blocks = parsed.blocks.length;
    }
    const [row] = await db.update(documents).set(patch).where(eq(documents.id, id)).returning();
    if (!row) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    return NextResponse.json(row);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Identificador no válido" }, { status: 400 });
    const ids = await subtreeIds(id);
    await db.delete(documents).where(inArray(documents.id, ids));
    return NextResponse.json({ ok: true, deleted: ids.length });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
