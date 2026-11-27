import { NextResponse } from "next/server";
import { importArchive } from "@/lib/project-store";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function downloadDrive(raw: string): Promise<Buffer> {
  const url = new URL(raw);
  if (url.hostname !== "drive.google.com" || url.protocol !== "https:") throw new Error("Solo se admiten enlaces públicos HTTPS de drive.google.com; también puedes subir el ZIP local.");
  const id = url.searchParams.get("id") ?? /\/d\/([\w-]+)/.exec(url.pathname)?.[1];
  if (!id || !/^[\w-]{10,120}$/.test(id)) throw new Error("Enlace de Drive no válido.");
  const res = await fetch(`https://drive.google.com/uc?export=download&id=${id}`, { signal: AbortSignal.timeout(90000) });
  if (!res.ok || !res.body) throw new Error("No se pudo descargar el archivo público de Drive.");
  const chunks: Uint8Array[] = []; let size = 0;
  const reader = res.body.getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 30 * 1024 * 1024) { await reader.cancel(); throw new Error("El ZIP supera 30 MB."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}
export async function POST(req: Request) {
  try {
    let data: Buffer; let name: string;
    if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await req.formData(); const file = form.get("file");
      if (!(file instanceof File) || file.size > 30 * 1024 * 1024) throw new Error("Selecciona un ZIP de hasta 30 MB.");
      data = Buffer.from(await file.arrayBuffer());
      name = String(form.get("name") || file.name.replace(/\.[^.]+$/, ""));
    } else {
      const body = await req.json() as { url?: string; name?: string };
      if (!body.url) throw new Error("Falta la URL o el archivo ZIP.");
      data = await downloadDrive(body.url); name = body.name || "Proyecto de Drive";
    }
    return NextResponse.json(await importArchive(data, name), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
