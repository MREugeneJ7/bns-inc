import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AddPost from "./components/AddPost";
import AnalysisSection from "./components/AnalysisSection";
import AudienceDashboard from "./components/AudienceDashboard";
import DetailSheet from "./components/DetailSheet";
import PostCard from "./components/PostCard";
import PostTextEditor from "./components/PostTextEditor";
import { Card, ProgressBar, Spinner, StarIcon } from "./components/ui";
import { fmtNum, fmtRate } from "./lib/aggregate";
import { buildLocalAnalysis, withGeneratedThemeLabels } from "./lib/analyst";
import { parseAnalyticsFile } from "./lib/analytics";
import { buildDemoPosts } from "./lib/demo";
import { embedTexts, EMBED_MODEL } from "./lib/embed";
import { importLinkedInPost } from "./lib/importPost";
import {
  AI_IDLE,
  DEFAULT_OLLAMA_URL,
  DEFAULT_WEBGPU_MODEL,
  generatePostTitle,
  generateThemeLabels,
  runAudienceAnalysis,
  type AiEngine,
  type AiOutcome,
  type AiState,
  type AiTask,
  type GeneratedTheme,
} from "./lib/llm";
import {
  contentTitle,
  isPostTextUsable,
  textFingerprint,
} from "./lib/provenance";
import {
  loadPosts,
  loadThemeLabels,
  savePosts,
  saveThemeLabels,
  uid,
} from "./lib/store";
import type { Post } from "./lib/types";
import {
  isJobActive,
  postDedupeKey,
  processUploadBatch,
  summarizeUploadJobs,
  type UploadJob,
} from "./lib/uploadQueue";
import { cn } from "./utils/cn";

type MainTab = "audiencia" | "ia" | "posts" | "add";
type LabelsStatus = "idle" | "loading" | "ready" | "partial" | "error";

interface LabelRunState {
  status: LabelsStatus;
  progress: number;
  message: string;
  errors: string[];
  errorsByKey: Record<string, string>;
}

const LABELS_IDLE: LabelRunState = {
  status: "idle",
  progress: 0,
  message: "",
  errors: [],
  errorsByKey: {},
};

export default function App() {
  const [posts, setPosts] = useState<Post[]>(loadPosts);
  const [tab, setTab] = useState<MainTab>("audiencia");
  const [threshold, setThreshold] = useState(0.8);
  const [embedRetry, setEmbedRetry] = useState(0);
  const [semantic, setSemantic] = useState<{
    key: string;
    status: "loading" | "ready" | "error";
    progress: number;
    message: string;
    vectors: number[][];
  }>({ key: "", status: "loading", progress: 0, message: "", vectors: [] });
  const [engine, setEngine] = useState<AiEngine>("auto");
  const [webgpuModel, setWebgpuModel] = useState(DEFAULT_WEBGPU_MODEL);
  const [ollamaModel, setOllamaModel] = useState("llama3.2");
  const [ollamaUrl, setOllamaUrl] = useState(DEFAULT_OLLAMA_URL);
  const [ai, setAi] = useState<AiState>(AI_IDLE);
  const [labels, setLabels] =
    useState<Record<string, GeneratedTheme>>(loadThemeLabels);
  const labelsRef = useRef(labels);
  const [labelState, setLabelState] = useState<LabelRunState>(LABELS_IDLE);
  const [filling, setFilling] = useState(false);
  const [titling, setTitling] = useState(false);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(() => new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const realPosts = useRef<Post[]>([]);

  // Asynchronous multi-upload queue state (persists across tabs).
  const [uploadJobs, setUploadJobs] = useState<UploadJob[]>([]);
  const [alertsDismissed, setAlertsDismissed] = useState(false);
  const [alertsExpanded, setAlertsExpanded] = useState(false);
  const uploadControllers = useRef<Set<AbortController>>(new Set());
  const uploadJobsRef = useRef(uploadJobs);
  uploadJobsRef.current = uploadJobs;

  const [toasts, setToasts] = useState<
    { id: number; msg: string; kind: "ok" | "err" | "info" }[]
  >([]);
  const aiController = useRef<AbortController | null>(null);
  const labelController = useRef<AbortController | null>(null);
  const aiRequest = useRef(0);
  const labelRequest = useRef(0);
  const currentPosts = useRef(posts);
  currentPosts.current = posts;
  const engineCfgRef = useRef({ engine, webgpuModel, ollamaModel, ollamaUrl });
  engineCfgRef.current = { engine, webgpuModel, ollamaModel, ollamaUrl };

  const toast = useCallback(
    (msg: string, kind: "ok" | "err" | "info" = "ok") => {
      const id = Date.now() + Math.random();
      setToasts((items) => [...items.slice(-4), { id, msg, kind }]);
      setTimeout(
        () => setToasts((items) => items.filter((t) => t.id !== id)),
        6500,
      );
    },
    [],
  );

  useEffect(() => {
    if (!demo) savePosts(posts);
  }, [posts, demo]);
  useEffect(() => {
    if (!demo) saveThemeLabels(labels);
  }, [labels, demo]);

  // Cancel any live upload controllers on unmount.
  useEffect(() => {
    const set = uploadControllers.current;
    return () => {
      for (const ctrl of set) ctrl.abort();
      set.clear();
    };
  }, []);

  const uploadSummary = useMemo(
    () => summarizeUploadJobs(uploadJobs),
    [uploadJobs],
  );
  const hasActiveUploads = uploadSummary.active > 0;

  // Semantic embeddings computed asynchronously via Web Worker (WebGPU → WASM fallback).
  const semanticTexts = useMemo(
    () => posts.filter(isPostTextUsable).map((p) => p.body),
    [posts],
  );
  const semanticKey = useMemo(
    () => JSON.stringify(semanticTexts),
    [semanticTexts],
  );
  const semanticReady =
    semantic.key === semanticKey && semantic.status === "ready";

  useEffect(() => {
    let active = true;
    const ctrl = new AbortController();
    if (!semanticTexts.length) {
      setSemantic({
        key: semanticKey,
        status: "ready",
        progress: 1,
        message: "",
        vectors: [],
      });
      return;
    }
    setSemantic({
      key: semanticKey,
      status: "loading",
      progress: 0.02,
      message: hasActiveUploads
        ? "Esperando a que finalice la cola de subida para calcular embeddings semánticos..."
        : "Preparando embeddings semánticos (WebGPU → WASM)...",
      vectors: [],
    });
    // Avoid overlapping E5 embedding downloads/VRAM with an active multi-upload batch + title queue.
    if (hasActiveUploads) {
      return () => {
        active = false;
        ctrl.abort();
      };
    }
    const delay = 0;
    const timer = setTimeout(() => {
      if (!active || ctrl.signal.aborted) return;
      void embedTexts(
        semanticTexts,
        ({ progress, message }) => {
          if (active && !ctrl.signal.aborted) {
            setSemantic((current) =>
              current.key === semanticKey
                ? { ...current, progress, message }
                : current,
            );
          }
        },
        ctrl.signal,
      )
        .then(({ vectors, device, viaWorker }) => {
          if (!active || ctrl.signal.aborted) return;
          setSemantic({
            key: semanticKey,
            status: "ready",
            progress: 1,
            message: `${EMBED_MODEL} listo en ${device.toUpperCase()}${viaWorker ? " (Web Worker)" : ""} · ${vectors.length} ${vectors.length === 1 ? "vector" : "vectores"}.`,
            vectors,
          });
        })
        .catch((error: unknown) => {
          if (!active || ctrl.signal.aborted) return;
          setSemantic({
            key: semanticKey,
            status: "error",
            progress: 0,
            message: `No se pudieron calcular embeddings: ${error instanceof Error ? error.message : String(error)}`,
            vectors: [],
          });
        });
    }, delay);

    return () => {
      active = false;
      clearTimeout(timer);
      ctrl.abort();
    };
    // Triggered strictly when admissible texts settle or user explicitly retries.
  }, [semanticKey, semanticTexts, embedRetry, hasActiveUploads]);

  const local = useMemo(
    () =>
      posts.length
        ? buildLocalAnalysis(
            posts,
            threshold,
            semanticReady ? semantic.vectors : undefined,
          )
        : null,
    [posts, threshold, semanticReady, semantic.vectors],
  );
  const analysis = useMemo(
    () => (local ? withGeneratedThemeLabels(local, labels) : null),
    [local, labels],
  );

  // Signature of the content feeding the analysis (posts + provenance + stats).
  // The umbral (threshold) is deliberately NOT part of it: moving it changes only
  // grouping, never the AI requests or the open sub-tab.
  const postsSignature = useMemo(
    () =>
      JSON.stringify(
        posts.map((p) => [
          p.id,
          textFingerprint(p.body),
          isPostTextUsable(p),
          p.metrics,
          p.rows,
        ]),
      ),
    [posts],
  );
  const latestPostsSignature = useRef(postsSignature);
  latestPostsSignature.current = postsSignature;
  labelsRef.current = labels;
  const localRef = useRef(local);
  localRef.current = local;

  const runThemeLabeling = useCallback(
    async (opts: { manual: boolean; onlyKey?: string }) => {
      const cur = localRef.current;
      const livePosts = currentPosts.current;
      if (!cur?.themes.length) return;
      const targets = opts.onlyKey
        ? cur.themes.filter((t) => t.key === opts.onlyKey)
        : (() => {
            const missing = cur.themes.filter((t) => !labelsRef.current[t.key]);
            if (missing.length) return missing;
            return opts.manual ? cur.themes : [];
          })();
      if (!targets.length) return;

      // Cancel any previous labeling batch cleanly before launching the new one.
      labelController.current?.abort();
      const ctrl = new AbortController();
      labelController.current = ctrl;
      const id = ++labelRequest.current;
      const captured = latestPostsSignature.current;

      setLabelState((prev) => ({
        status: "loading",
        progress: 0.02,
        message:
          targets.length === 1
            ? "Generando nombre del grupo con la LLM..."
            : `Generando ${targets.length} nombres de grupo con la LLM...`,
        errors: [],
        errorsByKey: opts.onlyKey
          ? Object.fromEntries(
              Object.entries(prev.errorsByKey).filter(
                ([k]) => k !== opts.onlyKey,
              ),
            )
          : {},
      }));

      try {
        // Always read live posts via ref so newly added posts never crash with stale closures.
        const inputs = targets.map((theme) => ({
          key: theme.key,
          keywords: theme.keywords,
          size: theme.members.length,
          avgSim: theme.avgSim,
          excerpts: theme.members
            .map((m) => livePosts[m]?.body ?? "")
            .filter((b) => b.trim().length > 0),
        }));

        const result = await generateThemeLabels(inputs, {
          engine,
          webgpuModel,
          ollamaModel,
          ollamaUrl,
          signal: ctrl.signal,
          onProgress: (progress, message) => {
            if (
              id === labelRequest.current &&
              captured === latestPostsSignature.current &&
              !ctrl.signal.aborted
            ) {
              setLabelState((s) => ({ ...s, progress, message }));
            }
          },
          onLabel: (label) => {
            if (
              id === labelRequest.current &&
              captured === latestPostsSignature.current &&
              !ctrl.signal.aborted
            ) {
              setLabels((old) => ({ ...old, [label.key]: label }));
              setLabelState((prev) => {
                if (!prev.errorsByKey[label.key]) return prev;
                const next = { ...prev.errorsByKey };
                delete next[label.key];
                return { ...prev, errorsByKey: next };
              });
            }
          },
        });
        if (
          id !== labelRequest.current ||
          captured !== latestPostsSignature.current ||
          ctrl.signal.aborted
        )
          return;

        const count = result.labels.length;
        const nextErrorsByKey: Record<string, string> = {};
        for (const err of result.errors) {
          nextErrorsByKey[err.key] = err.message;
        }
        setLabelState((prev) => {
          const mergedErrorsByKey = opts.onlyKey
            ? { ...prev.errorsByKey, ...nextErrorsByKey }
            : nextErrorsByKey;
          if (opts.onlyKey && count > 0) {
            delete mergedErrorsByKey[opts.onlyKey];
          }
          return {
            status:
              count === targets.length
                ? "ready"
                : count > 0
                  ? "partial"
                  : "error",
            progress: count === targets.length ? 1 : 0,
            message: `${count}/${targets.length} ${targets.length === 1 ? "nombre generado" : "nombres generados"} por la LLM.`,
            errors: result.errors.map((e) => e.message),
            errorsByKey: mergedErrorsByKey,
          };
        });
      } catch (err) {
        if (
          id !== labelRequest.current ||
          captured !== latestPostsSignature.current ||
          ctrl.signal.aborted
        )
          return;
        const msg = err instanceof Error ? err.message : String(err);
        setLabelState({
          status: "error",
          progress: 0,
          message: "No se pudieron generar los nombres de grupo.",
          errors: [msg],
          errorsByKey: Object.fromEntries(targets.map((t) => [t.key, msg])),
        });
      }
    },
    [engine, webgpuModel, ollamaModel, ollamaUrl],
  );

  // Reset pending AI tasks only when data/engine configuration truly changes —
  // NOT when semanticReady finishes computing vectors!
  useEffect(() => {
    ++aiRequest.current;
    ++labelRequest.current;
    aiController.current?.abort();
    labelController.current?.abort();
    setAi(AI_IDLE);
    setLabelState(LABELS_IDLE);
    return () => {
      aiController.current?.abort();
      labelController.current?.abort();
    };
  }, [postsSignature, engine, webgpuModel, ollamaModel, ollamaUrl]);

  // Auto-generate group names right once real E5 semantic embeddings finish
  // (and multi-upload background batch isn't actively saturating the queue).
  useEffect(() => {
    if (!semanticReady || hasActiveUploads) return;
    const cur = localRef.current;
    if (!cur?.themes.length) return;
    const missing = cur.themes.filter((t) => !labelsRef.current[t.key]);
    if (!missing.length) return;
    void runThemeLabeling({ manual: false });
  }, [
    postsSignature,
    semanticReady,
    hasActiveUploads,
    engine,
    webgpuModel,
    ollamaModel,
    ollamaUrl,
    runThemeLabeling,
  ]);

  const runAi = useCallback(
    async (question?: string, task?: AiTask): Promise<AiOutcome> => {
      if (!analysis)
        return {
          ok: false,
          source: "none",
          narrative: "",
          engine: "",
          input: "",
          task: task ?? "analysis",
          error: "No hay estadísticas.",
        };
      aiController.current?.abort();
      const ctrl = new AbortController();
      aiController.current = ctrl;
      const id = ++aiRequest.current;
      const captured = latestPostsSignature.current;
      const kind = task ?? (question ? "question" : "analysis");
      setAi({
        ...AI_IDLE,
        status: "loading",
        message: "Iniciando la LLM seleccionada...",
        task: kind,
        question,
      });
      const response = await runAudienceAnalysis(analysis, {
        engine,
        webgpuModel,
        ollamaModel,
        ollamaUrl,
        customQuestion: question,
        task: kind,
        signal: ctrl.signal,
        onProgress: (progress, message) => {
          if (
            id === aiRequest.current &&
            captured === latestPostsSignature.current
          )
            setAi((s) => ({ ...s, progress, message }));
        },
      });
      if (
        id === aiRequest.current &&
        captured === latestPostsSignature.current &&
        !ctrl.signal.aborted
      ) {
        setAi({
          status: response.ok ? "ready" : "error",
          source: response.source,
          progress: response.ok ? 1 : 0,
          message: response.ok
            ? "Respuesta recibida de la LLM."
            : "No se ha generado respuesta IA.",
          narrative: response.narrative,
          engine: response.engine,
          model: response.model,
          error: response.error,
          input: response.input,
          task: response.task,
          question,
        });
      }
      return response;
    },
    [analysis, engine, webgpuModel, ollamaModel, ollamaUrl],
  );

  const cancelGeneration = () => {
    ++aiRequest.current;
    ++labelRequest.current;
    aiController.current?.abort();
    labelController.current?.abort();
    setAi((s) =>
      s.status === "loading"
        ? { ...AI_IDLE, message: "Generación cancelada." }
        : s,
    );
    setLabelState((s) =>
      s.status === "loading"
        ? { ...LABELS_IDLE, message: "Generación cancelada." }
        : s,
    );
  };

  const generateTitleFor = useCallback(
    (body: string, signal?: AbortSignal) => {
      const cfg = engineCfgRef.current;
      return generatePostTitle(body, {
        engine: cfg.engine,
        webgpuModel: cfg.webgpuModel,
        ollamaModel: cfg.ollamaModel,
        ollamaUrl: cfg.ollamaUrl,
        signal,
      });
    },
    [],
  );

  const patchJob = useCallback((jobId: string, patch: Partial<UploadJob>) => {
    setUploadJobs((old) =>
      old.map((j) => (j.id === jobId ? { ...j, ...patch } : j)),
    );
  }, []);

  const patchPost = useCallback((postId: string, patch: Partial<Post>) => {
    setPosts((old) =>
      old.map((p) => (p.id === postId ? { ...p, ...patch } : p)),
    );
  }, []);

  // Multi-upload asynchronous batch processor (continues smoothly while browsing other tabs).
  const enqueueFiles = useCallback(
    (files: File[]) => {
      if (!files.length) return;
      if (demo) {
        setDemo(false);
        setPosts(realPosts.current);
        currentPosts.current = realPosts.current;
      }
      setAlertsDismissed(false);

      const ctrl = new AbortController();
      uploadControllers.current.add(ctrl);
      const now = Date.now();
      const seeded = files.map((file) => ({
        job: {
          id: uid(),
          fileName: file.name,
          status: "queued" as const,
          detail: "En cola para lectura...",
          createdAt: now,
        },
        file,
      }));

      setUploadJobs((old) => [...seeded.map((s) => s.job), ...old].slice(0, 80));
      toast(
        files.length === 1
          ? `Procesando «${files[0].name}» en segundo plano...`
          : `Cola iniciada con ${files.length} archivos en segundo plano.`,
        "info",
      );

      const existingKeys = new Set<string>();
      for (const p of currentPosts.current) {
        const k = postDedupeKey(p.url);
        if (k) existingKeys.add(k);
      }
      for (const j of uploadJobsRef.current) {
        if (isJobActive(j.status) && j.url) {
          const k = postDedupeKey(j.url);
          if (k) existingKeys.add(k);
        }
      }

      const batchWarnings = { missingText: 0, missingTitle: 0, errors: 0 };

      void processUploadBatch(
        seeded.map(({ job, file }) => ({
          jobId: job.id,
          fileName: file.name,
          parse: () => parseAnalyticsFile(file),
        })),
        {
          createId: uid,
          existingKeys,
          importConcurrency: 3,
          signal: ctrl.signal,
          importPost: (url, opts) => importLinkedInPost(url, opts),
          generateTitle: (body, sig) => generateTitleFor(body, sig),
          onJobUpdate: patchJob,
          onPostCreated: (post) => {
            setPosts((old) => [post, ...old]);
          },
          onPostPatch: patchPost,
          onNotice: (notice) => {
            setAlertsDismissed(false);
            if (notice.kind === "missing-text") {
              batchWarnings.missingText++;
              toast(
                `No se encontró el texto de «${notice.fileName}». Revísalo o pégalo en su ficha.`,
                "err",
              );
            } else if (notice.kind === "missing-title") {
              batchWarnings.missingTitle++;
              toast(
                `«${notice.fileName}» verificado, pero sin título LLM (se mantiene el provisional).`,
                "info",
              );
            } else {
              batchWarnings.errors++;
              toast(`Error en «${notice.fileName}»: ${notice.message}`, "err");
            }
          },
        },
      ).finally(() => {
        uploadControllers.current.delete(ctrl);
        if (ctrl.signal.aborted) return;
        const totalIssues =
          batchWarnings.missingText +
          batchWarnings.missingTitle +
          batchWarnings.errors;
        if (totalIssues === 0 && files.length > 1) {
          toast(
            `Lote completado: ${files.length} archivos procesados sin incidencias.`,
            "ok",
          );
        } else if (totalIssues > 0 && files.length > 1) {
          const parts: string[] = [];
          if (batchWarnings.missingText)
            parts.push(`${batchWarnings.missingText} sin texto`);
          if (batchWarnings.missingTitle)
            parts.push(`${batchWarnings.missingTitle} sin título LLM`);
          if (batchWarnings.errors)
            parts.push(`${batchWarnings.errors} con error`);
          toast(`Lote terminado con avisos: ${parts.join(", ")}.`, "err");
        }
      });
    },
    [demo, generateTitleFor, patchJob, patchPost, toast],
  );

  const cancelUploads = useCallback(() => {
    for (const ctrl of uploadControllers.current) ctrl.abort();
    uploadControllers.current.clear();
    setUploadJobs((old) =>
      old.map((j) =>
        isJobActive(j.status)
          ? {
              ...j,
              status: "cancelled",
              detail: "Cancelado por el usuario. Lo ya guardado se conserva.",
            }
          : j,
      ),
    );
    toast("Cola de subida cancelada.", "info");
  }, [toast]);

  const clearFinishedJobs = useCallback(() => {
    setUploadJobs((old) => old.filter((j) => isJobActive(j.status)));
    setAlertsExpanded(false);
    setAlertsDismissed(false);
  }, []);

  const markRetrying = (postId: string, active: boolean) => {
    setRetryingIds((old) => {
      const next = new Set(old);
      if (active) next.add(postId);
      else next.delete(postId);
      return next;
    });
  };

  const retryPostTitle = useCallback(
    async (postId: string, linkedJobId?: string) => {
      const target = currentPosts.current.find((p) => p.id === postId);
      if (!target || !isPostTextUsable(target)) return;
      const bodySnap = target.body;
      markRetrying(postId, true);
      if (linkedJobId) {
        patchJob(linkedJobId, {
          status: "titling",
          detail: "Reintentando título con la LLM...",
        });
      }
      try {
        const res = await generateTitleFor(bodySnap);
        if (!res) {
          throw new Error("La LLM no devolvió un título válido.");
        }
        setPosts((old) =>
          old.map((p) =>
            p.id === postId && p.body === bodySnap
              ? {
                  ...p,
                  title: res.title,
                  titleSource: "ai",
                  titleEngine: res.engine,
                  titleError: undefined,
                }
              : p,
          ),
        );
        setUploadJobs((old) =>
          old.map((j) =>
            j.postId === postId
              ? {
                  ...j,
                  status: "done",
                  postTitle: res.title,
                  detail: `Verificado y titulado (${res.engine}).`,
                }
              : j,
          ),
        );
        toast(`Título generado: «${res.title}»`, "ok");
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "La LLM no pudo generar el título.";
        patchPost(postId, { titleError: msg });
        setUploadJobs((old) =>
          old.map((j) =>
            j.postId === postId
              ? {
                  ...j,
                  status: "missing-title",
                  detail: `Sin título LLM: ${msg}`,
                }
              : j,
          ),
        );
        toast(`No se pudo generar título: ${msg}`, "err");
      } finally {
        markRetrying(postId, false);
      }
    },
    [generateTitleFor, patchJob, patchPost, toast],
  );

  const retryJobImport = useCallback(
    async (jobId: string) => {
      const job = uploadJobsRef.current.find((j) => j.id === jobId);
      if (!job?.postId || !job.url) return;
      const postId = job.postId;
      const targetUrl = job.url;
      markRetrying(postId, true);
      patchJob(jobId, {
        status: "importing",
        detail: "Reintentando con ruta alternativa (modo fuerte)...",
      });
      try {
        const res = await importLinkedInPost(targetUrl, {
          mode: "strong",
          onAttempt: (note) => patchJob(jobId, { detail: note }),
        });
        const log = res.attempts.map((a) => `${a.name}: ${a.info}`);
        if (res.ok && res.evidence) {
          const cur = currentPosts.current.find((p) => p.id === postId);
          const provisional = contentTitle(res.text, cur?.fecha ?? null);
          patchPost(postId, {
            body: res.text,
            textStatus: "ok",
            provenance: res.evidence,
            title: cur?.titleSource === "user" ? cur.title : provisional,
            titleSource: cur?.titleSource === "user" ? "user" : "auto",
            titleEngine: undefined,
            importError: undefined,
            importLog: log,
          });
          toast(`Post verificado: «${job.fileName}». Generando título...`, "ok");
          if (cur?.titleSource === "user") {
            patchJob(jobId, {
              status: "done",
              postTitle: cur.title,
              detail: "Texto verificado; se conserva tu título manual.",
            });
            return;
          }
          // Try titling right after successful retry.
          patchJob(jobId, {
            status: "titling",
            postTitle: provisional,
            detail: "Post verificado. Generando título con la LLM...",
          });
          try {
            const gen = await generateTitleFor(res.text);
            if (!gen) throw new Error("La LLM no devolvió un título válido.");
            patchPost(postId, {
              title: gen.title,
              titleSource: "ai",
              titleEngine: gen.engine,
              titleError: undefined,
            });
            patchJob(jobId, {
              status: "done",
              postTitle: gen.title,
              detail: `Verificado y titulado (${gen.engine}).`,
            });
          } catch (te) {
            const msg =
              te instanceof Error ? te.message : "La LLM no pudo titular.";
            patchPost(postId, { titleError: msg });
            patchJob(jobId, {
              status: "missing-title",
              postTitle: provisional,
              detail: `Sin título LLM: ${msg}`,
            });
            toast(`«${job.fileName}» verificado, pero falló el título: ${msg}`, "err");
          }
        } else {
          const errMsg =
            res.error || "Sigue sin poder verificarse. Pega el texto en su ficha.";
          patchPost(postId, { importError: errMsg, importLog: log });
          patchJob(jobId, { status: "missing-text", detail: errMsg });
          toast(`No se encontró «${job.fileName}»: ${errMsg}`, "err");
        }
      } finally {
        markRetrying(postId, false);
      }
    },
    [generateTitleFor, patchJob, patchPost, toast],
  );

  const retryJobTitle = useCallback(
    (jobId: string) => {
      const job = uploadJobsRef.current.find((j) => j.id === jobId);
      if (job?.postId) void retryPostTitle(job.postId, jobId);
    },
    [retryPostTitle],
  );

  const addPost = (post: Post) => {
    if (demo) {
      setDemo(false);
      setPosts([...realPosts.current, post]);
    } else setPosts((old) => [post, ...old]);
    setTab("posts");
    toast(
      post.body.trim()
        ? "Publicación guardada con su procedencia."
        : "Estadísticas guardadas sin texto; no participa en los grupos.",
      "ok",
    );
  };

  const updatePost = (post: Post) => {
    setPosts((old) => old.map((p) => (p.id === post.id ? post : p)));
    // Keep upload queue notices synchronized when the user fixes a flagged post manually.
    setUploadJobs((old) =>
      old.map((j) => {
        if (j.postId !== post.id) return j;
        if (!isPostTextUsable(post)) {
          return {
            ...j,
            status: "missing-text",
            url: post.url,
            detail:
              post.importError ||
              "El texto sigue pendiente o sin confirmar.",
          };
        }
        if (post.titleSource === "ai" || post.titleSource === "user") {
          return {
            ...j,
            status: "done",
            url: post.url,
            postTitle: post.title,
            detail:
              post.titleSource === "user"
                ? "Texto confirmado y título manual guardado."
                : `Verificado y titulado (${post.titleEngine ?? "LLM"}).`,
          };
        }
        return {
          ...j,
          status: post.titleError ? "missing-title" : "done",
          url: post.url,
          postTitle: post.title,
          detail: post.titleError
            ? `Texto verificado; sin título LLM: ${post.titleError}`
            : "Texto confirmado (título provisional).",
        };
      }),
    );
    setEditingId(null);
    toast(
      "Texto guardado y grupos actualizados con su contenido.",
      "ok",
    );
  };

  const loadDemo = () => {
    if (demo) {
      setPosts(realPosts.current);
      setDemo(false);
    } else {
      realPosts.current = posts;
      setPosts(buildDemoPosts());
      setDemo(true);
    }
    setTab("audiencia");
  };

  const verifyMissingTexts = async () => {
    if (filling) return;
    setFilling(true);
    let count = 0;
    const targets = posts.filter((p) => !isPostTextUsable(p) && p.url);
    try {
      for (const p of targets) {
        const res = await importLinkedInPost(p.url!, { mode: "strong" });
        const originalHash = textFingerprint(p.body);
        const current = currentPosts.current.find((item) => item.id === p.id);
        if (!current || textFingerprint(current.body) !== originalHash)
          continue;
        if (res.ok && res.evidence) ++count;
        const log = res.attempts.map((a) => `${a.name}: ${a.info}`);
        setPosts((old) =>
          old.map((cur) => {
            if (cur.id !== p.id || textFingerprint(cur.body) !== originalHash)
              return cur;
            if (res.ok && res.evidence) {
              return {
                ...cur,
                body: res.text,
                textStatus: "ok",
                provenance: res.evidence,
                importError: undefined,
                title:
                  cur.titleSource === "user"
                    ? cur.title
                    : contentTitle(res.text, cur.fecha),
                titleSource: cur.titleSource === "user" ? "user" : "auto",
                titleEngine: undefined,
                importLog: log,
              };
            }
            return {
              ...cur,
              textStatus: cur.body.trim() ? "unverified" : "missing",
              importError: res.error,
              importLog: log,
            };
          }),
        );
        if (res.ok && res.evidence) {
          setUploadJobs((old) =>
            old.map((j) =>
              j.postId === p.id
                ? {
                    ...j,
                    status: "missing-title",
                    detail: "Texto verificado. Pendiente de generar título con LLM.",
                  }
                : j,
            ),
          );
        }
      }
    } finally {
      setFilling(false);
      toast(
        `${count}/${targets.length} textos verificados. Los demás siguen pendientes; revísalos o pégalos en su ficha.`,
        count === targets.length ? "ok" : "info",
      );
    }
  };

  const regenerateTitles = async () => {
    if (titling) return;
    setTitling(true);
    let count = 0;
    let failed = 0;
    const targets = posts.filter(
      (p) =>
        isPostTextUsable(p) &&
        p.titleSource !== "user" &&
        p.titleSource !== "ai",
    );
    try {
      for (const p of targets) {
        try {
          const result = await generateTitleFor(p.body);
          if (result) {
            ++count;
            setPosts((old) =>
              old.map((current) =>
                current.id === p.id && current.body === p.body
                  ? {
                      ...current,
                      title: result.title,
                      titleSource: "ai",
                      titleEngine: result.engine,
                      titleError: undefined,
                    }
                  : current,
              ),
            );
            setUploadJobs((old) =>
              old.map((j) =>
                j.postId === p.id
                  ? {
                      ...j,
                      status: "done",
                      postTitle: result.title,
                      detail: `Verificado y titulado (${result.engine}).`,
                    }
                  : j,
              ),
            );
          } else {
            ++failed;
            const msg = "Texto demasiado breve o sin título válido.";
            patchPost(p.id, { titleError: msg });
          }
        } catch (e) {
          ++failed;
          const msg =
            e instanceof Error ? e.message : "La LLM no pudo titular.";
          patchPost(p.id, { titleError: msg });
          toast(`No se pudo titular «${p.title}»: ${msg}`, "err");
          if (/descarga|runtime|WASM|no disponible|Failed to fetch/i.test(msg)) {
            break;
          }
        }
      }
    } finally {
      setTitling(false);
      if (count) {
        toast(
          failed
            ? `${count} títulos generados · ${failed} sin generar.`
            : `${count} títulos generados por la LLM.`,
          failed ? "info" : "ok",
        );
      }
    }
  };

  const totals = local?.report.totals;
  const pending = posts.filter((p) => !isPostTextUsable(p));
  const missingTitlesCount = posts.filter(
    (p) => isPostTextUsable(p) && p.titleError && p.titleSource === "auto",
  ).length;
  const warningJobs = uploadJobs.filter(
    (j) =>
      j.status === "missing-text" ||
      j.status === "missing-title" ||
      j.status === "error",
  );
  const editing = posts.find((p) => p.id === editingId);

  return (
    <div className="min-h-screen bg-[#0b0e14] font-sans text-slate-200 antialiased">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0e14]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
              <StarIcon className="h-3.5 w-3.5" />
            </span>
            <h1 className="font-display text-sm font-bold">PostLens</h1>
          </div>
          <nav
            aria-label="Principal"
            className="grid w-full grid-cols-4 gap-1 rounded-xl border border-white/10 bg-black/30 p-1 sm:w-auto"
          >
            {(
              [
                ["audiencia", "Audiencia"],
                ["ia", "Análisis"],
                ["posts", `Posts (${posts.length})`],
                ["add", "+ Añadir"],
              ] as [MainTab, string][]
            ).map(([id, text]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                aria-current={tab === id ? "page" : undefined}
                className={cn(
                  "min-h-10 rounded-lg px-3 text-xs font-semibold",
                  tab === id
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-white/5",
                )}
              >
                {text}
              </button>
            ))}
          </nav>
          <button
            onClick={loadDemo}
            className="hidden min-h-9 text-xs text-slate-400 underline sm:block"
          >
            {demo ? "Salir de la demo" : "Probar demo"}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-3 px-3 pb-8 pt-3 sm:px-5">
        {demo && (
          <p className="flex items-center justify-between gap-3 rounded-lg border border-blue-500/25 p-2 text-xs text-blue-200">
            Datos de ejemplo, no tus publicaciones.
            <button onClick={loadDemo} className="min-h-9 underline">
              Volver a mis datos
            </button>
          </p>
        )}

        {/* Global background multi-upload progress strip across tabs */}
        {uploadSummary.active > 0 && (
          <div
            role="status"
            className="space-y-1.5 rounded-lg border border-blue-500/30 bg-blue-500/[0.06] px-3 py-2 text-xs text-blue-100"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-medium tabular-nums">
                <Spinner className="h-3.5 w-3.5" />
                Cola asíncrona: {uploadSummary.completed}/{uploadSummary.total}{" "}
                procesados ({uploadSummary.active} en curso
                {uploadSummary.warnings > 0
                  ? ` · ${uploadSummary.warnings} aviso(s)`
                  : ""}
                )
              </span>
              <div className="flex items-center gap-3">
                {tab !== "add" && (
                  <button
                    onClick={() => setTab("add")}
                    className="min-h-8 font-semibold text-blue-300 underline"
                  >
                    Ver cola
                  </button>
                )}
                <button
                  onClick={cancelUploads}
                  className="min-h-8 text-amber-200 underline"
                >
                  Cancelar
                </button>
              </div>
            </div>
            <ProgressBar value={Math.max(0.05, uploadSummary.progress)} />
          </div>
        )}

        {/* Global persistent warning center for unfound posts / failed titles */}
        {warningJobs.length > 0 && !alertsDismissed && tab !== "add" && (
          <div
            role="alert"
            className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-100"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>
                <strong>Avisos de la subida:</strong>{" "}
                {[
                  uploadSummary.missingText > 0
                    ? `${uploadSummary.missingText} post(s) sin encontrar o sin verificar`
                    : "",
                  uploadSummary.missingTitle > 0
                    ? `${uploadSummary.missingTitle} sin título LLM`
                    : "",
                  uploadSummary.errors > 0
                    ? `${uploadSummary.errors} archivo(s) con error`
                    : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
                .
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setAlertsExpanded((v) => !v)}
                  className="min-h-8 font-semibold underline"
                >
                  {alertsExpanded ? "Ocultar detalle" : "Ver detalle"}
                </button>
                <button
                  onClick={() => setTab("add")}
                  className="min-h-8 text-blue-300 underline"
                >
                  Abrir cola
                </button>
                <button
                  onClick={() => setAlertsDismissed(true)}
                  className="min-h-8 text-slate-400 underline"
                >
                  Cerrar aviso
                </button>
              </div>
            </div>
            {alertsExpanded && (
              <ul className="space-y-1.5 border-t border-amber-500/20 pt-2">
                {warningJobs.map((job) => {
                  const busy = job.postId ? retryingIds.has(job.postId) : false;
                  return (
                    <li
                      key={job.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-[11px]"
                    >
                      <span className="min-w-0 flex-1 text-amber-100/90">
                        <strong className="text-white">{job.fileName}:</strong>{" "}
                        {job.detail}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {job.status === "missing-text" && job.postId && (
                          <>
                            {job.url && (
                              <button
                                disabled={busy}
                                onClick={() => void retryJobImport(job.id)}
                                className="min-h-8 underline disabled:opacity-40"
                              >
                                {busy ? "Buscando..." : "Reintentar"}
                              </button>
                            )}
                            <button
                              onClick={() => setEditingId(job.postId!)}
                              className="min-h-8 text-blue-300 underline"
                            >
                              Pegar texto
                            </button>
                          </>
                        )}
                        {job.status === "missing-title" && job.postId && (
                          <button
                            disabled={busy}
                            onClick={() => retryJobTitle(job.id)}
                            className="min-h-8 underline disabled:opacity-40"
                          >
                            {busy ? "Titulando..." : "Reintentar título"}
                          </button>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {!!pending.length && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
            <p>
              {pending.length} texto(s) sin verificar o pendientes. No entran en
              los grupos ni en los prompts. Las estadísticas del Excel se
              conservan.
            </p>
            <button
              onClick={() => setTab("posts")}
              className="min-h-9 shrink-0 font-semibold underline"
            >
              Revisar textos
            </button>
          </div>
        )}

        {!pending.length &&
          missingTitlesCount > 0 &&
          warningJobs.length === 0 &&
          tab !== "posts" && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
              <p>
                {missingTitlesCount} publicación(es) con texto verificado pero
                sin título LLM (conservan título provisional).
              </p>
              <button
                disabled={titling}
                onClick={() => void regenerateTitles()}
                className="min-h-9 shrink-0 font-semibold underline disabled:opacity-40"
              >
                {titling ? "Titulando..." : "Reintentar títulos"}
              </button>
            </div>
          )}

        {totals && (
          <Card className="px-3 py-2">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {[
                [
                  "Alcance (suma)",
                  fmtNum(totals.alcance),
                  `${totals.posts} posts`,
                ],
                ["Impresiones", fmtNum(totals.impresiones), ""],
                [
                  "Interacciones",
                  fmtNum(totals.interacciones),
                  fmtRate(totals.engagementRate),
                ],
                [
                  "Comentarios / compartidos",
                  fmtNum(totals.comentarios + totals.compartidos),
                  `${fmtNum(totals.guardados)} guardados`,
                ],
                ["Visitas al perfil", fmtNum(totals.vistasPerfil), ""],
                ["Seguidores nuevos", `+${fmtNum(totals.seguidores)}`, ""],
              ].map(([label, value, sub]) => (
                <div
                  key={label}
                  className="min-w-0 border-r border-white/5 pr-2 last:border-r-0"
                >
                  <div className="text-[10px] text-slate-500">{label}</div>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <b className="font-display text-base tabular-nums">
                      {value}
                    </b>
                    <span className="text-[10px] text-blue-300">{sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
        {!posts.length && tab !== "add" && (
          <div className="py-10 text-center">
            <h2 className="text-base font-semibold">
              Tus datos, sin ejemplos mezclados
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              Sube uno o varios Excel a la vez. Se verificará el texto de cada
              post en segundo plano, se agruparán por embeddings semánticos y
              recibirás avisos si alguno no se encuentra o no obtiene título.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={() => setTab("add")}
                className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold"
              >
                Añadir Excel
              </button>
              <button
                onClick={loadDemo}
                className="min-h-11 text-sm text-slate-400 underline"
              >
                Probar demo
              </button>
            </div>
          </div>
        )}
        {tab === "audiencia" && local && (
          <>
            <AudienceDashboard
              report={local.report}
              crossInsights={local.crossInsights}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 py-2 text-xs">
              <p className="text-slate-400">
                Cálculos del Excel, no IA. La suma de alcance no deduplica
                personas entre posts.
              </p>
              <button
                onClick={() => setTab("ia")}
                className="min-h-10 text-blue-300 underline"
              >
                Ver grupos y generar con una LLM
              </button>
            </div>
          </>
        )}
        {tab === "ia" && analysis && (
          <AnalysisSection
            posts={posts}
            local={analysis}
            threshold={threshold}
            setThreshold={setThreshold}
            ai={ai}
            engine={engine}
            setEngine={setEngine}
            webgpuModel={webgpuModel}
            setWebgpuModel={setWebgpuModel}
            ollamaModel={ollamaModel}
            setOllamaModel={setOllamaModel}
            ollamaUrl={ollamaUrl}
            setOllamaUrl={setOllamaUrl}
            onRunAi={runAi}
            labelState={labelState}
            semanticStatus={
              semantic.key === semanticKey ? semantic.status : "loading"
            }
            semanticProgress={
              semantic.key === semanticKey ? semantic.progress : 0.02
            }
            semanticMessage={
              semantic.key === semanticKey
                ? semantic.message
                : "Preparando embeddings semánticos..."
            }
            onRetryEmbeddings={() => setEmbedRetry((n) => n + 1)}
            onRetryThemeLabels={() => void runThemeLabeling({ manual: true })}
            onRetrySingleTheme={(key) =>
              void runThemeLabeling({ manual: true, onlyKey: key })
            }
            dataSignature={postsSignature}
            onCancel={cancelGeneration}
          />
        )}
        {tab === "posts" && (
          <div className="space-y-2">
            <div className="flex flex-wrap justify-between gap-2 py-1 text-xs">
              <span>
                {posts.length} publicaciones · {posts.length - pending.length}{" "}
                textos admitidos
                {missingTitlesCount > 0 && (
                  <span className="text-amber-300">
                    {" "}
                    · {missingTitlesCount} sin título LLM
                  </span>
                )}
              </span>
              <div className="flex flex-wrap gap-2">
                {pending.some((p) => p.url) && (
                  <button
                    disabled={filling}
                    onClick={() => void verifyMissingTexts()}
                    className="min-h-10 rounded-lg border border-white/10 px-3 text-blue-300 disabled:opacity-40"
                  >
                    {filling ? "Verificando..." : "Reverificar pendientes"}
                  </button>
                )}
                {posts.some(
                  (p) =>
                    isPostTextUsable(p) &&
                    p.titleSource !== "ai" &&
                    p.titleSource !== "user",
                ) && (
                  <button
                    disabled={titling}
                    onClick={() => void regenerateTitles()}
                    className="min-h-10 rounded-lg border border-white/10 px-3 text-blue-300 disabled:opacity-40"
                  >
                    {titling ? "Titulando..." : "Generar títulos con LLM"}
                  </button>
                )}
              </div>
            </div>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                retryingTitle={retryingIds.has(post.id)}
                onRetryTitle={() => void retryPostTitle(post.id)}
                onEdit={() => setEditingId(post.id)}
                onDelete={() => {
                  setPosts((old) => old.filter((p) => p.id !== post.id));
                  setUploadJobs((old) => old.filter((j) => j.postId !== post.id));
                }}
              />
            ))}
          </div>
        )}
        {tab === "add" && (
          <AddPost
            onAdd={addPost}
            onNotify={toast}
            engine={engine}
            onGenerateTitle={generateTitleFor}
            uploadJobs={uploadJobs}
            onEnqueueFiles={enqueueFiles}
            onCancelUploads={cancelUploads}
            onClearFinishedJobs={clearFinishedJobs}
            onRetryJobImport={(jobId) => void retryJobImport(jobId)}
            onRetryJobTitle={retryJobTitle}
            onEditPost={(postId) => setEditingId(postId)}
            retryingIds={retryingIds}
          />
        )}
      </main>
      <DetailSheet
        open={!!editing}
        title="Revisar texto y procedencia"
        onClose={() => setEditingId(null)}
      >
        {editing && (
          <PostTextEditor
            key={editing.id}
            post={editing}
            onSave={updatePost}
            onGenerateTitle={generateTitleFor}
          />
        )}
      </DetailSheet>
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-3 right-3 z-[60] flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded-lg border bg-[#11151d] px-3 py-2 text-xs shadow-lg",
              t.kind === "err"
                ? "border-amber-500/40 text-amber-200"
                : t.kind === "info"
                  ? "border-blue-500/30 text-blue-100"
                  : "border-white/15 text-slate-200",
            )}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
