import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

/** Descendientes completos del documento (con fuente), para componer \input{...}. */
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Identificador no válido" }, { status: 400 });
    const [root] = await db.select().from(documents).where(eq(documents.id, id));
    if (!root) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });

    const descendants: { id: string; parentId: string; slug: string; source: string; depth: number }[] = [];
    let frontier = [root.id];
    let depth = 1;
    while (frontier.length) {
      const rows = await db
        .select({ id: documents.id, parentId: documents.parentId, slug: documents.slug, source: documents.source })
        .from(documents)
        .where(inArray(documents.parentId, frontier));
      if (!rows.length) break;
      for (const r of rows) {
        if (r.parentId) descendants.push({ id: r.id, parentId: r.parentId, slug: r.slug, source: r.source, depth });
      }
      frontier = rows.map((r) => r.id);
      depth++;
    }
    return NextResponse.json({ root: { id: root.id, slug: root.slug }, descendants });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
