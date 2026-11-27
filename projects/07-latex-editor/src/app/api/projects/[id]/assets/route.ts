import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { projectFiles } from "@/db/schema";
export const dynamic = "force-dynamic";
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const name = new URL(req.url).searchParams.get("path");
  if (!name) return NextResponse.json({ error: "Falta ruta" }, { status: 400 });
  const [file] = await db.select().from(projectFiles).where(and(eq(projectFiles.projectId, id), eq(projectFiles.path, name)));
  if (!file) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  const data = Buffer.from(file.original, "base64");
  const mime = /\.png$/i.test(name) ? "image/png" : /\.jpe?g$/i.test(name) ? "image/jpeg" : /\.pdf$/i.test(name) ? "application/pdf" : "application/octet-stream";
  return new Response(new Uint8Array(data), { headers: { "Content-Type": mime, "Content-Disposition": `attachment; filename="${encodeURIComponent(name.split("/").pop()!)}"`, "X-Content-Type-Options": "nosniff" } });
}
