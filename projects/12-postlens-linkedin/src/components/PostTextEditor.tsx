import { useCallback, useEffect, useRef, useState } from "react";
import {
  importLinkedInPost,
  normalizePostUrl,
  type ImportResult,
} from "../lib/importPost";
import {
  contentTitle,
  isPostTextUsable,
  linkedinPostId,
  manualProvenance,
  textFingerprint,
} from "../lib/provenance";
import type { Post, TextProvenance } from "../lib/types";
import { Badge, Spinner } from "./ui";

interface Props {
  post: Post;
  autoImport?: boolean;
  onSave: (post: Post) => void;
  onGenerateTitle: (
    body: string,
    signal?: AbortSignal,
  ) => Promise<{ title: string; engine: string } | null>;
}

export default function PostTextEditor({
  post,
  autoImport = false,
  onSave,
  onGenerateTitle,
}: Props) {
  const [urlInput, setUrlInput] = useState(post.url ?? "");
  const [body, setBody] = useState(post.body);
  const [title, setTitle] = useState(post.title);
  const [titleSource, setTitleSource] = useState(post.titleSource ?? "auto");
  const [titleEngine, setTitleEngine] = useState(post.titleEngine);
  const [provenance, setProvenance] = useState<TextProvenance | undefined>(
    post.provenance,
  );
  const [manuallyChanged, setManuallyChanged] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [saveMissing, setSaveMissing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importNote, setImportNote] = useState("");
  const [titleLoading, setTitleLoading] = useState(false);
  const [titleError, setTitleError] = useState("");
  const importController = useRef<AbortController | null>(null);
  const importSeq = useRef(0);
  const titleController = useRef<AbortController | null>(null);
  const titleSeq = useRef(0);
  const titleTouched = useRef(post.titleSource === "user");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const url = normalizePostUrl(urlInput);
  const draft: Post = {
    ...post,
    url,
    body,
    provenance,
    textStatus: body.trim() ? "ok" : "missing",
  };
  const verifiedOrConfirmed =
    isPostTextUsable(draft) ||
    (body.trim().length > 0 && (manuallyChanged || confirmed));
  const hasText = body.trim().length > 0;

  const importText = useCallback(
    async (strong: boolean, target: string) => {
      importController.current?.abort();
      const ctrl = new AbortController();
      importController.current = ctrl;
      const seq = ++importSeq.current;
      setImporting(true);
      setResult(null);
      setImportNote("Verificando la identidad del post...");
      const res = await importLinkedInPost(target, {
        mode: strong ? "strong" : "normal",
        signal: ctrl.signal,
        onAttempt: (note) => {
          if (seq === importSeq.current) setImportNote(note);
        },
      });
      if (seq !== importSeq.current || ctrl.signal.aborted) return;
      setImporting(false);
      setResult(res);
      if (res.ok && res.evidence) {
        setBody(res.text);
        setProvenance(res.evidence);
        setConfirmed(false);
        setManuallyChanged(false);
        if (!titleTouched.current) {
          setTitle(contentTitle(res.text, post.fecha));
          setTitleSource("auto");
        }
      }
    },
    [post.fecha],
  );

  useEffect(() => {
    if (!autoImport || !url || post.body.trim()) return;
    const timer = setTimeout(() => void importText(false, url), 400);
    return () => {
      clearTimeout(timer);
      ++importSeq.current;
      importController.current?.abort();
      setImporting(false);
    };
  }, [autoImport, url, post.body, importText]);

  useEffect(
    () => () => {
      ++importSeq.current;
      ++titleSeq.current;
      importController.current?.abort();
      titleController.current?.abort();
    },
    [],
  );

  const generateTitle = useCallback(
    async (text: string, force = false) => {
      if (titleTouched.current && !force) return;
      titleController.current?.abort();
      const ctrl = new AbortController();
      titleController.current = ctrl;
      const seq = ++titleSeq.current;
      setTitleLoading(true);
      setTitleError("");
      try {
        const generated = await onGenerateTitle(text, ctrl.signal);
        if (
          ctrl.signal.aborted ||
          seq !== titleSeq.current ||
          (titleTouched.current && !force)
        )
          return;
        if (!generated) throw new Error("No se obtuvo un título de la LLM.");
        setTitle(generated.title);
        setTitleSource("ai");
        setTitleEngine(generated.engine);
        titleTouched.current = false;
      } catch (e) {
        if (!ctrl.signal.aborted && seq === titleSeq.current) {
          setTitleError(e instanceof Error ? e.message : String(e));
          if (!titleTouched.current) {
            setTitle(contentTitle(text, post.fecha));
            setTitleSource("auto");
          }
        }
      } finally {
        if (seq === titleSeq.current) setTitleLoading(false);
      }
    },
    [onGenerateTitle, post.fecha],
  );

  useEffect(() => {
    if (
      !verifiedOrConfirmed ||
      titleTouched.current ||
      (body === post.body && post.titleSource === "ai")
    )
      return;
    const timer = setTimeout(() => void generateTitle(body), 800);
    return () => {
      clearTimeout(timer);
      ++titleSeq.current;
      titleController.current?.abort();
      setTitleLoading(false);
    };
  }, [body, verifiedOrConfirmed, generateTitle, post.body, post.titleSource]);

  const save = () => {
    if ((!hasText && !saveMissing) || (hasText && !verifiedOrConfirmed)) return;
    const proof =
      provenance?.bodyHash === textFingerprint(body) && isPostTextUsable(draft)
        ? provenance
        : hasText
          ? manualProvenance(body, url || null)
          : undefined;
    onSave({
      ...post,
      url: url || null,
      urn: linkedinPostId(url) ?? post.urn,
      body,
      title: title.trim() || contentTitle(body, post.fecha),
      titleSource,
      titleEngine: titleSource === "ai" ? titleEngine : undefined,
      titleError: titleSource === "auto" ? titleError || post.titleError : undefined,
      textStatus: hasText ? "ok" : "missing",
      importError: hasText ? undefined : result && !result.ok ? result.error : post.importError,
      provenance: proof,
      importLog: result
        ? result.attempts.map((a) => `${a.name}: ${a.info}`)
        : post.importLog,
    });
  };

  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={`url-${post.id}`} className="font-semibold text-white">
          URL del post del Excel
        </label>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-300 underline"
          >
            Abrir original
          </a>
        )}
      </div>
      <input
        id={`url-${post.id}`}
        aria-label="URL de la publicación"
        value={urlInput}
        onChange={(e) => {
          ++importSeq.current;
          importController.current?.abort();
          setImporting(false);
          ++titleSeq.current;
          titleController.current?.abort();
          setTitleLoading(false);
          setUrlInput(e.target.value);
          setConfirmed(false);
          setManuallyChanged(false);
          setProvenance(undefined);
          setResult(null);
          // A response for another URL must never remain attached to this draft.
          setBody("");
          if (!titleTouched.current) {
            setTitle("");
            setTitleSource("auto");
          }
        }}
        placeholder="https://www.linkedin.com/posts/..."
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-slate-200"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={!url || importing}
          onClick={() => void importText(!!result && !result.ok, url)}
          className="min-h-9 rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white disabled:opacity-40"
        >
          {importing
            ? "Verificando..."
            : result && !result.ok
              ? "Reintentar con otra ruta"
              : "Importar este post exacto"}
        </button>
        {importing && (
          <button
            className="min-h-9 text-slate-300 underline"
            onClick={() => {
              ++importSeq.current;
              importController.current?.abort();
              setImporting(false);
            }}
          >
            Cancelar
          </button>
        )}
        {linkedinPostId(url) && (
          <span className="break-all text-[10px] text-slate-500">
            ID esperado: {linkedinPostId(url)}
          </span>
        )}
      </div>
      <p className="text-[11px] leading-relaxed text-slate-500">
        La importación consulta esa URL en LinkedIn y lectores públicos
        (Jina/AllOrigins). Reciben la URL, no tu Excel ni cookies. No hay
        búsqueda web ni LLM extrayendo el texto.
      </p>
      {importing && (
        <p role="status" className="flex items-center gap-2 text-blue-300">
          <Spinner />
          {importNote}
        </p>
      )}
      {result && !result.ok && (
        <div
          role="alert"
          className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-amber-200"
        >
          <p>{result.error}</p>
          <button
            className="mt-2 min-h-9 font-semibold underline"
            onClick={() => bodyRef.current?.focus()}
          >
            Pegar o corregir el texto
          </button>
          {hasText && (
            <p className="mt-1 text-[11px]">
              Se conserva el texto anterior para que lo revises; el fallo no lo
              verifica.
            </p>
          )}
        </div>
      )}
      {result?.ok && provenance && (
        <p className="rounded-lg border border-emerald-500/20 p-2 text-emerald-300">
          ID verificado: {provenance.postId}
          {provenance.activityId ? ` ↔ activity ${provenance.activityId}` : ""}.
          Texto del contenedor {provenance.method} recibido por{" "}
          {provenance.provider}.
        </p>
      )}
      {hasText && !verifiedOrConfirmed && (
        <p
          role="alert"
          className="rounded-lg border border-amber-500/25 p-2 text-amber-200"
        >
          Este texto se guardó sin verificación de origen. Se conserva, pero
          está excluido del coseno y de los prompts hasta revisarlo.
        </p>
      )}
      <label
        className="block font-semibold text-slate-300"
        htmlFor={`body-${post.id}`}
      >
        Texto original (nunca generado por la LLM)
      </label>
      <textarea
        ref={bodyRef}
        id={`body-${post.id}`}
        aria-label="Texto original del post"
        rows={6}
        value={body}
        onChange={(e) => {
          ++importSeq.current;
          importController.current?.abort();
          setImporting(false);
          setBody(e.target.value);
          setProvenance(undefined);
          setManuallyChanged(true);
          setConfirmed(false);
          if (!titleTouched.current) {
            setTitle(contentTitle(e.target.value, post.fecha));
            setTitleSource("auto");
          }
        }}
        placeholder="Si no se pudo verificar, pega aquí el texto de tu publicación."
        className="w-full resize-y rounded-lg border border-white/10 bg-black/30 p-3 leading-relaxed text-slate-200"
      />
      {hasText && !verifiedOrConfirmed && (
        <label className="flex min-h-11 items-center gap-2 text-amber-200">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          He comparado el original y confirmo que este texto es de ese post.
        </label>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={`title-${post.id}`}
          className="font-semibold text-slate-300"
        >
          Título
        </label>
        <Badge tone={titleSource === "ai" ? "emerald" : "slate"}>
          {titleSource === "ai"
            ? `LLM: ${titleEngine}`
            : titleSource === "user"
              ? "Escrito por ti"
              : "Primera línea, no IA"}
        </Badge>
      </div>
      <div className="flex gap-2">
        <input
          id={`title-${post.id}`}
          value={title}
          aria-label="Título del post"
          onChange={(e) => {
            titleTouched.current = true;
            ++titleSeq.current;
            titleController.current?.abort();
            setTitleLoading(false);
            setTitle(e.target.value);
            setTitleSource("user");
            setTitleError("");
          }}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          placeholder="Título breve"
        />
        <button
          disabled={!verifiedOrConfirmed || titleLoading}
          onClick={() => void generateTitle(body, true)}
          className="min-h-10 shrink-0 rounded-lg border border-blue-500/30 px-3 text-blue-300 disabled:opacity-40"
        >
          {titleLoading ? "Generando..." : "Titular con LLM"}
        </button>
      </div>
      {titleError && (
        <p role="status" className="text-[11px] text-amber-200">
          {titleError} No se ha sustituido por una respuesta IA ficticia.
        </p>
      )}
      {!hasText && (
        <label className="flex min-h-11 items-center gap-2 text-amber-200">
          <input
            type="checkbox"
            checked={saveMissing}
            onChange={(e) => setSaveMissing(e.target.checked)}
          />
          Guardar solo estadísticas, sin incluir este post en el coseno.
        </label>
      )}
      <button
        disabled={
          importing ||
          (!hasText && !saveMissing) ||
          (hasText && !verifiedOrConfirmed)
        }
        onClick={save}
        className="min-h-11 w-full rounded-lg bg-blue-600 px-4 py-2 font-bold text-white disabled:opacity-40"
      >
        {post.provenance ? "Guardar cambios" : "Guardar publicación"}
      </button>
      {post.importLog?.length || result?.attempts.length ? (
        <details className="text-[11px] text-slate-500">
          <summary className="min-h-9 cursor-pointer py-2">
            Procedencia e intentos de importación
          </summary>
          {provenance && (
            <p className="mb-2 break-all">
              Origen: {provenance.kind}; ID:{" "}
              {provenance.postId ?? "confirmado manualmente"}; fecha:{" "}
              {new Date(provenance.recordedAt).toLocaleString("es-ES")}.
            </p>
          )}
          <ul className="space-y-1 break-words">
            {(
              result?.attempts.map((a) => `${a.name}: ${a.info}`) ??
              post.importLog ??
              []
            ).map((log, i) => (
              <li key={i}>{log}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
