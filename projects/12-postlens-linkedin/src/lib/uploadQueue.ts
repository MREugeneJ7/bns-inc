import type { ParsedSheet } from "./analytics";
import type { ImportResult } from "./importPost";
import { normalizePostUrl } from "./importPost";
import { contentTitle, linkedinPostId } from "./provenance";
import type { Post } from "./types";

export type UploadJobStatus =
  | "queued"
  | "parsing"
  | "importing"
  | "titling"
  | "done"
  | "missing-text"
  | "missing-title"
  | "duplicate"
  | "error"
  | "cancelled";

export interface UploadJob {
  id: string;
  fileName: string;
  status: UploadJobStatus;
  detail: string;
  postId?: string;
  url?: string | null;
  postTitle?: string;
  createdAt: number;
}

export interface UploadNotice {
  kind: "missing-text" | "missing-title" | "error";
  jobId: string;
  postId?: string;
  fileName: string;
  message: string;
}

export interface UploadFileInput {
  jobId: string;
  fileName: string;
  parse: () => Promise<ParsedSheet>;
}

export interface UploadBatchAdapters {
  createId: () => string;
  existingKeys: Set<string>;
  importPost: (
    url: string,
    opts: {
      mode: "normal" | "strong";
      signal?: AbortSignal;
      onAttempt?: (note: string) => void;
    },
  ) => Promise<ImportResult>;
  generateTitle: (
    body: string,
    signal?: AbortSignal,
  ) => Promise<{ title: string; engine: string } | null>;
  onJobUpdate: (jobId: string, patch: Partial<UploadJob>) => void;
  onPostCreated: (post: Post) => void;
  onPostPatch: (postId: string, patch: Partial<Post>) => void;
  onNotice?: (notice: UploadNotice) => void;
  importConcurrency?: number;
  signal?: AbortSignal;
  /** Permite ceder el hilo principal entre archivos grandes. */
  yieldFrame?: () => Promise<void>;
}

export interface UploadSummary {
  total: number;
  active: number;
  completed: number;
  done: number;
  missingText: number;
  missingTitle: number;
  duplicates: number;
  errors: number;
  cancelled: number;
  warnings: number;
  progress: number;
}

const ACTIVE_STATUSES = new Set<UploadJobStatus>([
  "queued",
  "parsing",
  "importing",
  "titling",
]);

export function isJobActive(status: UploadJobStatus): boolean {
  return ACTIVE_STATUSES.has(status);
}

export function postDedupeKey(url: string | null | undefined): string | null {
  const clean = normalizePostUrl(url ?? "");
  if (!clean) return null;
  const id = linkedinPostId(clean);
  if (id) return `li:${id}`;
  return `url:${clean.replace(/\/+$/, "").toLowerCase()}`;
}

export function baseFileTitle(fileName: string, fecha: string | null): string {
  const clean = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (clean && clean.length >= 3) return clean.slice(0, 72);
  return fecha ? `Post del ${fecha}` : "Publicación pendiente de texto";
}

export function summarizeUploadJobs(jobs: UploadJob[]): UploadSummary {
  let active = 0;
  let done = 0;
  let missingText = 0;
  let missingTitle = 0;
  let duplicates = 0;
  let errors = 0;
  let cancelled = 0;

  for (const job of jobs) {
    if (isJobActive(job.status)) active++;
    else if (job.status === "done") done++;
    else if (job.status === "missing-text") missingText++;
    else if (job.status === "missing-title") missingTitle++;
    else if (job.status === "duplicate") duplicates++;
    else if (job.status === "error") errors++;
    else if (job.status === "cancelled") cancelled++;
  }
  const total = jobs.length;
  const completed = total - active;
  return {
    total,
    active,
    completed,
    done,
    missingText,
    missingTitle,
    duplicates,
    errors,
    cancelled,
    warnings: missingText + missingTitle + errors,
    progress: total > 0 ? completed / total : 0,
  };
}

const defaultYield = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

/**
 * Ejecuta un lote de archivos de forma asíncrona:
 * 1) Lee cada Excel/CSV cediendo el hilo entre archivos y guarda sus estadísticas.
 * 2) Importa en paralelo (concurrencia acotada) el texto exacto de cada URL de LinkedIn.
 * 3) Encola de forma asíncrona la generación de títulos LLM para los posts verificados.
 * 4) Notifica de forma explícita cualquier post no encontrado o fallo de titulación.
 */
export async function processUploadBatch(
  inputs: UploadFileInput[],
  adapters: UploadBatchAdapters,
): Promise<void> {
  const {
    createId,
    existingKeys,
    importPost,
    generateTitle,
    onJobUpdate,
    onPostCreated,
    onPostPatch,
    onNotice,
    signal,
  } = adapters;
  const yieldFrame = adapters.yieldFrame ?? defaultYield;
  const concurrency = Math.max(1, Math.min(5, adapters.importConcurrency ?? 3));

  interface PendingImport {
    jobId: string;
    fileName: string;
    post: Post;
  }

  const seenKeys = new Set<string>(existingKeys);
  const toImport: PendingImport[] = [];

  // Phase 1: parse each spreadsheet cleanly and persist stats right away.
  for (const input of inputs) {
    if (signal?.aborted) {
      onJobUpdate(input.jobId, {
        status: "cancelled",
        detail: "Cancelado antes de leer el archivo.",
      });
      continue;
    }
    onJobUpdate(input.jobId, {
      status: "parsing",
      detail: "Leyendo estadísticas del archivo...",
    });
    try {
      const sheet = await input.parse();
      if (signal?.aborted) {
        onJobUpdate(input.jobId, {
          status: "cancelled",
          detail: "Cancelado.",
        });
        continue;
      }
      if (!sheet.rows.length && !sheet.metrics.length) {
        const message = "No se encontraron estadísticas reconocibles en el archivo.";
        onJobUpdate(input.jobId, { status: "error", detail: message });
        onNotice?.({
          kind: "error",
          jobId: input.jobId,
          fileName: input.fileName,
          message,
        });
        continue;
      }
      const cleanUrl = normalizePostUrl(sheet.url ?? "") || null;
      const key = postDedupeKey(cleanUrl);
      if (key && seenKeys.has(key)) {
        onJobUpdate(input.jobId, {
          status: "duplicate",
          url: cleanUrl,
          detail: "Ya existe un post con esta URL/ID; omitido para evitar duplicados.",
        });
        continue;
      }
      if (key) seenKeys.add(key);

      const postId = createId();
      const post: Post = {
        id: postId,
        title: baseFileTitle(input.fileName, sheet.fecha),
        titleSource: "auto",
        textStatus: "missing",
        body: "",
        curl: "",
        url: cleanUrl,
        urn: cleanUrl ? linkedinPostId(cleanUrl) : null,
        sourceFile: input.fileName,
        createdAt: Date.now(),
        rows: sheet.rows,
        metrics: sheet.metrics,
        fecha: sheet.fecha,
        hora: sheet.hora,
      };
      onPostCreated(post);

      if (!cleanUrl) {
        const message =
          "Estadísticas guardadas, pero el archivo no trae URL del post. Pega el texto en su ficha.";
        onPostPatch(postId, { importError: message });
        onJobUpdate(input.jobId, {
          status: "missing-text",
          postId,
          url: null,
          postTitle: post.title,
          detail: message,
        });
        onNotice?.({
          kind: "missing-text",
          jobId: input.jobId,
          postId,
          fileName: input.fileName,
          message,
        });
      } else {
        onJobUpdate(input.jobId, {
          status: "importing",
          postId,
          url: cleanUrl,
          postTitle: post.title,
          detail: "En cola para buscar el post exacto...",
        });
        toImport.push({ jobId: input.jobId, fileName: input.fileName, post });
      }
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "No se pudo leer el archivo.";
      onJobUpdate(input.jobId, { status: "error", detail: message });
      onNotice?.({
        kind: "error",
        jobId: input.jobId,
        fileName: input.fileName,
        message,
      });
    }
    await yieldFrame();
  }

  // Serial async promise chain for LLM titling so verified posts start getting titled
  // immediately in the background without overwhelming WebGPU/WASM workers.
  let titleChain = Promise.resolve();
  const titleTasks: Promise<void>[] = [];

  const enqueueTitle = (item: PendingImport, body: string, provisionalTitle: string) => {
    const run = titleChain.then(async () => {
      if (signal?.aborted) {
        onJobUpdate(item.jobId, {
          status: "cancelled",
          detail: "Texto verificado; titulación cancelada.",
        });
        return;
      }
      onJobUpdate(item.jobId, {
        status: "titling",
        postTitle: provisionalTitle,
        detail: "Generando título con la LLM...",
      });
      try {
        const generated = await generateTitle(body, signal);
        if (signal?.aborted) {
          onJobUpdate(item.jobId, {
            status: "cancelled",
            detail: "Texto verificado; titulación cancelada.",
          });
          return;
        }
        if (!generated || !generated.title.trim()) {
          throw new Error(
            "La LLM no devolvió un título válido. Se conserva el provisional.",
          );
        }
        onPostPatch(item.post.id, {
          title: generated.title,
          titleSource: "ai",
          titleEngine: generated.engine,
          titleError: undefined,
        });
        onJobUpdate(item.jobId, {
          status: "done",
          postTitle: generated.title,
          detail: `Verificado y titulado (${generated.engine}).`,
        });
      } catch (err) {
        if (signal?.aborted) {
          onJobUpdate(item.jobId, {
            status: "cancelled",
            detail: "Texto verificado; titulación cancelada.",
          });
          return;
        }
        const reason =
          err instanceof Error && err.message
            ? err.message
            : "La LLM no pudo generar el título.";
        onPostPatch(item.post.id, {
          titleError: reason,
        });
        onJobUpdate(item.jobId, {
          status: "missing-title",
          postTitle: provisionalTitle,
          detail: `Sin título LLM: ${reason}`,
        });
        onNotice?.({
          kind: "missing-title",
          jobId: item.jobId,
          postId: item.post.id,
          fileName: item.fileName,
          message: reason,
        });
      }
    });
    titleChain = run.then(
      () => undefined,
      () => undefined,
    );
    titleTasks.push(run);
  };

  // Phase 2: bounded parallel worker pool to fetch & verify each LinkedIn post.
  let cursor = 0;
  const runWorker = async () => {
    while (cursor < toImport.length) {
      const idx = cursor++;
      const item = toImport[idx];
      if (signal?.aborted) {
        onJobUpdate(item.jobId, {
          status: "cancelled",
          detail: "Estadísticas guardadas; búsqueda cancelada.",
        });
        continue;
      }
      onJobUpdate(item.jobId, {
        status: "importing",
        detail: "Consultando post exacto en LinkedIn...",
      });
      try {
        const res = await importPost(item.post.url!, {
          mode: "normal",
          signal,
          onAttempt: (note) => {
            if (!signal?.aborted) {
              onJobUpdate(item.jobId, { detail: note });
            }
          },
        });
        if (signal?.aborted) {
          onJobUpdate(item.jobId, {
            status: "cancelled",
            detail: "Estadísticas guardadas; búsqueda cancelada.",
          });
          continue;
        }
        const log = res.attempts.map((a) => `${a.name}: ${a.info}`);
        if (res.ok && res.evidence) {
          const provisional = contentTitle(res.text, item.post.fecha);
          onPostPatch(item.post.id, {
            body: res.text,
            textStatus: "ok",
            provenance: res.evidence,
            title: provisional,
            titleSource: "auto",
            titleEngine: undefined,
            importError: undefined,
            importLog: log,
          });
          onJobUpdate(item.jobId, {
            status: "titling",
            postTitle: provisional,
            detail: "Post verificado. En cola para generar título con LLM...",
          });
          enqueueTitle(item, res.text, provisional);
        } else {
          const reason =
            res.error ||
            "No se encontró el post o no se pudo verificar su ID exacto.";
          onPostPatch(item.post.id, {
            textStatus: "missing",
            importError: reason,
            importLog: log,
          });
          onJobUpdate(item.jobId, {
            status: "missing-text",
            detail: reason,
          });
          onNotice?.({
            kind: "missing-text",
            jobId: item.jobId,
            postId: item.post.id,
            fileName: item.fileName,
            message: reason,
          });
        }
      } catch (err) {
        if (signal?.aborted) {
          onJobUpdate(item.jobId, {
            status: "cancelled",
            detail: "Estadísticas guardadas; búsqueda cancelada.",
          });
          continue;
        }
        const reason =
          err instanceof Error && err.message
            ? err.message
            : "Error consultando la URL del post.";
        onPostPatch(item.post.id, {
          textStatus: "missing",
          importError: reason,
        });
        onJobUpdate(item.jobId, {
          status: "missing-text",
          detail: reason,
        });
        onNotice?.({
          kind: "missing-text",
          jobId: item.jobId,
          postId: item.post.id,
          fileName: item.fileName,
          message: reason,
        });
      }
    }
  };

  if (toImport.length > 0) {
    const workers = Array.from(
      { length: Math.min(concurrency, toImport.length) },
      () => runWorker(),
    );
    await Promise.all(workers);
  }
  await Promise.all(titleTasks);
}
