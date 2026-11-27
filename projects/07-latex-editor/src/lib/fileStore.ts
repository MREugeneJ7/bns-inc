import { mkdir, writeFile, readFile, readdir, stat, unlink, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

const DIR = path.join(process.cwd(), ".exports");
const BUILDS_DIR = path.join(DIR, "builds");
const TTL_MS = 1000 * 60 * 60 * 6; // 6 horas

export interface StoredFile {
  id: string;
  filename: string;
  mime: string;
  size: number;
  createdAt: string;
  expiresAt: string;
  downloadUrl: string;
  viewUrl: string;
  pageCount?: number;
  pageUrls?: string[];
  engine?: string;
}

export function toStored(
  id: string,
  filename: string,
  mime: string,
  size: number,
  createdAt = new Date(),
  extra?: { pageCount?: number; pageUrls?: string[]; engine?: string }
): StoredFile {
  const encoded = encodeURIComponent(filename);
  return {
    id,
    filename,
    mime,
    size,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + TTL_MS).toISOString(),
    downloadUrl: `/api/files/${id}/${encoded}?download=1`,
    viewUrl: `/api/files/${id}/${encoded}?inline=1`,
    ...extra,
  };
}

async function ensureDir() {
  await mkdir(DIR, { recursive: true });
  await mkdir(BUILDS_DIR, { recursive: true });
}

export function safeId(id: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(id);
}

export async function putFile(
  filename: string,
  mime: string,
  data: Buffer,
  extra?: { pageBuffers?: Buffer[]; engine?: string }
): Promise<StoredFile> {
  await ensureDir();
  const id = randomUUID();
  await writeFile(path.join(DIR, `${id}.bin`), data);

  let pageCount: number | undefined;
  let pageUrls: string[] | undefined;
  if (extra?.pageBuffers && extra.pageBuffers.length > 0) {
    const bdir = path.join(BUILDS_DIR, id);
    await mkdir(bdir, { recursive: true });
    await Promise.all(
      extra.pageBuffers.map((buf, idx) => writeFile(path.join(bdir, `page-${idx + 1}.png`), buf))
    );
    pageCount = extra.pageBuffers.length;
    pageUrls = extra.pageBuffers.map((_, idx) => `/api/compile/${id}/page/${idx + 1}`);
  }

  const createdAt = new Date();
  await writeFile(
    path.join(DIR, `${id}.json`),
    JSON.stringify({
      id,
      filename,
      mime,
      size: data.length,
      createdAt: createdAt.toISOString(),
      pageCount,
      pageUrls,
      engine: extra?.engine,
    }),
    "utf8"
  );
  void prune().catch(() => undefined);
  return toStored(id, filename, mime, data.length, createdAt, { pageCount, pageUrls, engine: extra?.engine });
}

export async function getFile(
  id: string
): Promise<{
  meta: Omit<StoredFile, "downloadUrl" | "viewUrl" | "expiresAt">;
  data: Buffer;
} | null> {
  if (!safeId(id)) return null;
  try {
    const [raw, data] = await Promise.all([
      readFile(path.join(DIR, `${id}.json`), "utf8"),
      readFile(path.join(DIR, `${id}.bin`)),
    ]);
    const meta = JSON.parse(raw) as {
      filename: string;
      mime: string;
      size: number;
      createdAt: string;
      pageCount?: number;
      pageUrls?: string[];
      engine?: string;
    };
    return { meta: { id, ...meta, size: data.length }, data };
  } catch {
    return null;
  }
}

export async function getBuildPage(id: string, pageNum: number): Promise<Buffer | null> {
  if (!safeId(id) || !Number.isInteger(pageNum) || pageNum < 1 || pageNum > 200) return null;
  try {
    return await readFile(path.join(BUILDS_DIR, id, `page-${pageNum}.png`));
  } catch {
    return null;
  }
}

export async function removeFile(id: string): Promise<boolean> {
  if (!safeId(id)) return false;
  await Promise.allSettled([
    unlink(path.join(DIR, `${id}.json`)),
    unlink(path.join(DIR, `${id}.bin`)),
    rm(path.join(BUILDS_DIR, id), { recursive: true, force: true }),
  ]);
  return true;
}

export async function listFiles(): Promise<StoredFile[]> {
  await ensureDir();
  const names = await readdir(DIR);
  const metas = await Promise.all(
    names
      .filter((n) => n.endsWith(".json"))
      .map(async (n) => {
        try {
          const raw = await readFile(path.join(DIR, n), "utf8");
          const m = JSON.parse(raw) as {
            id: string;
            filename: string;
            mime: string;
            size: number;
            createdAt: string;
            pageCount?: number;
            pageUrls?: string[];
            engine?: string;
          };
          return toStored(m.id, m.filename, m.mime, m.size, new Date(m.createdAt), {
            pageCount: m.pageCount,
            pageUrls: m.pageUrls,
            engine: m.engine,
          });
        } catch {
          return null;
        }
      })
  );
  return metas.filter((m): m is StoredFile => m !== null).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function prune(): Promise<number> {
  await ensureDir();
  const names = await readdir(DIR);
  const now = Date.now();
  let removed = 0;
  for (const n of names) {
    if (!n.endsWith(".json")) continue;
    const p = path.join(DIR, n);
    try {
      const s = await stat(p);
      if (now - s.mtimeMs > TTL_MS) {
        const id = n.replace(/\.json$/, "");
        await removeFile(id);
        removed++;
      }
    } catch {
      /* ignore */
    }
  }
  return removed;
}
