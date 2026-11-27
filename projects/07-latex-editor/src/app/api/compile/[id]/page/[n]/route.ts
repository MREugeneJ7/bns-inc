import { NextResponse } from "next/server";
import { getBuildPage } from "@/lib/fileStore";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; n: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id, n } = await params;
  const pageNum = Number(n);
  const buf = await getBuildPage(id, pageNum);
  if (!buf) {
    return NextResponse.json({ error: "Página no encontrada" }, { status: 404 });
  }
  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(buf.length),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
