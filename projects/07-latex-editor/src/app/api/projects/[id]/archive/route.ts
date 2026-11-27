import { NextResponse } from "next/server";
import { projectArchive } from "@/lib/project-store";
export const dynamic = "force-dynamic";
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const original = new URL(req.url).searchParams.get("original") === "1";
    const data = await projectArchive(id, original);
    return new Response(new Uint8Array(data), { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="proyecto-${original ? "original" : "editable"}.zip"`, "Content-Length": String(data.length), "Cache-Control": "no-store" } });
  } catch (error) { return NextResponse.json({ error: String(error) }, { status: 400 }); }
}
