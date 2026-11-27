import { useRef, useState } from "react";
import {
  groupRows,
  parseAnalyticsFile,
  parsePastedText,
  type ParsedSheet,
} from "../lib/analytics";
import type { AiEngine } from "../lib/llm";
import { uid } from "../lib/store";
import type { Post } from "../lib/types";
import {
  isJobActive,
  summarizeUploadJobs,
  type UploadJob,
  type UploadJobStatus,
} from "../lib/uploadQueue";
import { cn } from "../utils/cn";
import PostTextEditor from "./PostTextEditor";
import { Badge, Card, ProgressBar, Spinner } from "./ui";

interface Props {
  onAdd: (post: Post) => void;
  onNotify: (message: string, kind?: "ok" | "err" | "info") => void;
  engine: AiEngine;
  onGenerateTitle: (
    body: string,
    signal?: AbortSignal,
  ) => Promise<{ title: string; engine: string } | null>;
  uploadJobs: UploadJob[];
  onEnqueueFiles: (files: File[]) => void;
  onCancelUploads: () => void;
  onClearFinishedJobs: () => void;
  onRetryJobImport: (jobId: string) => void;
  onRetryJobTitle: (jobId: string) => void;
  onEditPost: (postId: string) => void;
  retryingIds: Set<string>;
}

const JOB_BADGE: Record<
  UploadJobStatus,
  { label: string; tone: "emerald" | "amber" | "sky" | "slate" }
> = {
  queued: { label: "En cola", tone: "slate" },
  parsing: { label: "Leyendo", tone: "sky" },
  importing: { label: "Buscando post", tone: "sky" },
  titling: { label: "Titulando LLM", tone: "sky" },
  done: { label: "Listo", tone: "emerald" },
  "missing-text": { label: "Post no encontrado", tone: "amber" },
  "missing-title": { label: "Sin título LLM", tone: "amber" },
  duplicate: { label: "Duplicado", tone: "slate" },
  error: { label: "Error archivo", tone: "amber" },
  cancelled: { label: "Cancelado", tone: "slate" },
};

export default function AddPost({
  onAdd,
  onNotify,
  onGenerateTitle,
  uploadJobs,
  onEnqueueFiles,
  onCancelUploads,
  onClearFinishedJobs,
  onRetryJobImport,
  onRetryJobTitle,
  onEditPost,
  retryingIds,
}: Props) {
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [draft, setDraft] = useState<Post | null>(null);
  const [paste, setPaste] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [alwaysBatch, setAlwaysBatch] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const batchRef = useRef<HTMLInputElement>(null);
  const sequence = useRef(0);

  const summary = summarizeUploadJobs(uploadJobs);

  const accept = (parsed: ParsedSheet, name: string) => {
    if (!parsed.rows.length && !parsed.metrics.length)
      throw new Error(
        "No se encontraron estadísticas reconocibles en la hoja.",
      );
    setSheet(parsed);
    setSource(name);
    setError("");
    setDraft({
      id: uid(),
      title: "",
      titleSource: "auto",
      textStatus: "missing",
      body: "",
      curl: "",
      url: parsed.url,
      urn: null,
      sourceFile: name,
      createdAt: Date.now(),
      rows: parsed.rows,
      metrics: parsed.metrics,
      fecha: parsed.fecha,
      hora: parsed.hora,
    });
    onNotify(
      `${name}: ${parsed.metrics.length} métricas y ${parsed.rows.length} segmentos.`,
      "ok",
    );
  };

  const loadSingleFile = async (file: File) => {
    const id = ++sequence.current;
    setBusy(true);
    setError("");
    try {
      const parsed = await parseAnalyticsFile(file);
      if (id === sequence.current) accept(parsed, file.name);
    } catch (e) {
      if (id === sequence.current)
        setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (id === sequence.current) setBusy(false);
    }
  };

  const handleFiles = (list: FileList | File[], forceBatch = false) => {
    const files = Array.from(list);
    if (!files.length) return;
    if (forceBatch || alwaysBatch || files.length > 1) {
      setError("");
      onEnqueueFiles(files);
    } else {
      void loadSingleFile(files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid items-start gap-3 lg:grid-cols-2">
        <Card className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">
              1. Subir Excel (uno o varios a la vez)
            </h2>
            <Badge tone="sky">Multiupload asíncrono</Badge>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files?.length) {
                handleFiles(e.dataTransfer.files);
              }
            }}
            className={cn(
              "min-h-28 w-full rounded-xl border border-dashed p-4 text-center text-xs transition",
              dragging
                ? "border-blue-400 bg-blue-500/10 text-blue-100"
                : "border-white/20 text-slate-300 hover:border-blue-400",
            )}
          >
            {busy ? (
              <span className="flex justify-center gap-2">
                <Spinner />
                Leyendo Excel...
              </span>
            ) : (
              <span className="block space-y-1">
                <span className="block font-medium text-white">
                  {source ||
                    "Seleccionar o soltar uno o varios .xls, .xlsx o .csv"}
                </span>
                <span className="block text-[11px] text-slate-400">
                  Con varios archivos se abre la cola en segundo plano: guarda
                  estadísticas, importa textos y genera títulos con aviso si
                  alguno falla.
                </span>
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            aria-label="Seleccionar archivos Excel o CSV"
            type="file"
            multiple
            accept=".xls,.xlsx,.csv,.tsv,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={batchRef}
            aria-label="Añadir archivos a la cola asíncrona"
            type="file"
            multiple
            accept=".xls,.xlsx,.csv,.tsv,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files, true);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={() => batchRef.current?.click()}
              className="min-h-10 rounded-lg border border-blue-500/30 bg-blue-600/15 px-3 font-semibold text-blue-200 hover:bg-blue-600/25"
            >
              Subir en cola (segundo plano)
            </button>
            <button
              type="button"
              className="min-h-10 text-blue-300 underline"
              onClick={() => setShowPaste(!showPaste)}
            >
              Pegar celdas de LibreOffice / Excel
            </button>
          </div>
          <label className="flex items-center gap-2 text-[11px] text-slate-400">
            <input
              type="checkbox"
              checked={alwaysBatch}
              onChange={(e) => setAlwaysBatch(e.target.checked)}
              className="accent-blue-500"
            />
            Enviar también archivos individuales directamente a la cola
            asíncrona
          </label>
          {showPaste && (
            <div className="space-y-2">
              <textarea
                aria-label="Celdas del Excel"
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-white/10 bg-black/30 p-3 text-xs"
                placeholder="Pega las celdas con URL, métricas y audiencia..."
              />
              <button
                disabled={!paste.trim()}
                className="min-h-10 rounded-lg bg-blue-600 px-3 text-xs font-semibold disabled:opacity-40"
                onClick={() => {
                  try {
                    ++sequence.current;
                    setBusy(false);
                    accept(parsePastedText(paste), "Celdas pegadas");
                    setShowPaste(false);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : String(e));
                  }
                }}
              >
                Leer celdas
              </button>
            </div>
          )}
          {error && (
            <p role="alert" className="text-xs text-amber-200">
              {error}
            </p>
          )}
          {sheet && (
            <div className="flex flex-wrap gap-1">
              {groupRows(sheet.rows).map((g) => (
                <Badge key={g.categoria} tone="sky">
                  {g.categoria}: {g.items.length}
                </Badge>
              ))}
            </div>
          )}
          <p className="text-[11px] leading-relaxed text-slate-500">
            Puedes cambiar de pestaña mientras la cola procesa archivos. Si un
            post no se encuentra o la LLM no genera su título, las estadísticas
            se conservan y verás el aviso directo en pantalla.
          </p>
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">
            2. Revisión individual (opcional)
          </h2>
          {draft ? (
            <PostTextEditor
              key={draft.id}
              post={draft}
              autoImport
              onGenerateTitle={onGenerateTitle}
              onSave={(saved) => {
                onAdd(saved);
                setDraft(null);
                setSheet(null);
                setSource("");
              }}
            />
          ) : (
            <p className="text-xs leading-relaxed text-slate-400">
              Si subes un solo archivo o pegas celdas, puedes revisar su texto y
              título aquí antes de guardar. Si seleccionas varios archivos (o
              pulsas «Subir en cola»), se procesarán automáticamente en segundo
              plano debajo y recibirás avisos por cada incidencia.
            </p>
          )}
        </Card>
      </div>

      {uploadJobs.length > 0 && (
        <Card className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-white">
                Cola asíncrona de subida ({summary.completed}/{summary.total})
              </h2>
              <p className="text-[11px] text-slate-400 tabular-nums">
                {summary.done} listos
                {summary.missingText > 0 && (
                  <span className="text-amber-300">
                    {" "}
                    · {summary.missingText} sin texto
                  </span>
                )}
                {summary.missingTitle > 0 && (
                  <span className="text-amber-300">
                    {" "}
                    · {summary.missingTitle} sin título LLM
                  </span>
                )}
                {summary.errors > 0 && (
                  <span className="text-amber-300">
                    {" "}
                    · {summary.errors} con error
                  </span>
                )}
                {summary.duplicates > 0 &&
                  ` · ${summary.duplicates} duplicados omitidos`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {summary.active > 0 && (
                <button
                  type="button"
                  onClick={onCancelUploads}
                  className="min-h-9 rounded-lg border border-amber-500/30 px-3 text-amber-200 hover:bg-amber-500/10"
                >
                  Cancelar pendientes
                </button>
              )}
              {summary.completed > 0 && (
                <button
                  type="button"
                  onClick={onClearFinishedJobs}
                  className="min-h-9 rounded-lg border border-white/10 px-3 text-slate-300 hover:bg-white/5"
                >
                  {summary.active > 0 ? "Ocultar terminados" : "Limpiar lista"}
                </button>
              )}
            </div>
          </div>
          {summary.active > 0 && (
            <ProgressBar value={Math.max(0.04, summary.progress)} />
          )}
          <ul className="max-h-96 space-y-2 overflow-auto pr-0.5">
            {uploadJobs.map((job) => {
              const meta = JOB_BADGE[job.status];
              const active = isJobActive(job.status);
              const isWarn =
                job.status === "missing-text" ||
                job.status === "missing-title" ||
                job.status === "error";
              const jobBusy = job.postId ? retryingIds.has(job.postId) : false;
              return (
                <li
                  key={job.id}
                  className={cn(
                    "flex flex-wrap items-start justify-between gap-2 rounded-lg border p-2.5 text-xs",
                    isWarn
                      ? "border-amber-500/30 bg-amber-500/[0.04]"
                      : "border-white/10 bg-white/[0.02]",
                  )}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {active && <Spinner className="h-3.5 w-3.5" />}
                      <span className="truncate font-medium text-white">
                        {job.fileName}
                      </span>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>
                    {job.postTitle && job.status === "done" && (
                      <p className="truncate text-[11px] text-emerald-200/90">
                        Título: {job.postTitle}
                      </p>
                    )}
                    <p
                      className={cn(
                        "text-[11px] leading-snug",
                        isWarn ? "text-amber-200/90" : "text-slate-400",
                      )}
                    >
                      {job.detail}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    {job.status === "missing-text" && job.postId && (
                      <>
                        {job.url && (
                          <button
                            type="button"
                            disabled={jobBusy}
                            onClick={() => onRetryJobImport(job.id)}
                            className="min-h-9 rounded-lg border border-amber-500/35 px-2.5 text-[11px] font-medium text-amber-200 hover:bg-amber-500/10 disabled:opacity-40"
                          >
                            {jobBusy ? "Buscando..." : "Reintentar"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEditPost(job.postId!)}
                          className="min-h-9 rounded-lg border border-blue-500/30 px-2.5 text-[11px] font-medium text-blue-300 hover:bg-blue-500/10"
                        >
                          Pegar texto
                        </button>
                      </>
                    )}
                    {job.status === "missing-title" && job.postId && (
                      <>
                        <button
                          type="button"
                          disabled={jobBusy}
                          onClick={() => onRetryJobTitle(job.id)}
                          className="min-h-9 rounded-lg border border-amber-500/35 px-2.5 text-[11px] font-medium text-amber-200 hover:bg-amber-500/10 disabled:opacity-40"
                        >
                          {jobBusy ? "Titulando..." : "Reintentar título"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditPost(job.postId!)}
                          className="min-h-9 rounded-lg border border-white/15 px-2.5 text-[11px] text-slate-300 hover:bg-white/5"
                        >
                          Editar
                        </button>
                      </>
                    )}
                    {job.status === "done" && job.postId && (
                      <button
                        type="button"
                        onClick={() => onEditPost(job.postId!)}
                        className="min-h-9 px-2 text-[11px] text-slate-400 underline hover:text-slate-200"
                      >
                        Ver ficha
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
