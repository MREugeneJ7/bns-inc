import { NextResponse } from "next/server";
import { getFile } from "@/lib/fileStore";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; filename: string }> };

const TEXTY = /^(text\/|application\/(x-tex|rtf|json))/i;

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const file = await getFile(id);
  if (!file) return NextResponse.json({ error: "Archivo no encontrado o caducado" }, { status: 404 });

  const url = new URL(req.url);
  const inline = url.searchParams.get("inline") === "1";
  const asText = url.searchParams.get("text") === "1" && TEXTY.test(file.meta.mime);

  const safeFilename = file.meta.filename.replace(/"/g, "");
  const headers: Record<string, string> = {
    "Content-Type": asText ? "text/plain; charset=utf-8" : file.meta.mime,
    "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
    "Content-Length": String(file.data.length),
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  };

  return new Response(new Uint8Array(file.data), { status: 200, headers });
}
