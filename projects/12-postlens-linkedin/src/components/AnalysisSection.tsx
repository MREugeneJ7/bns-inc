import { useEffect, useState } from "react";
import { fmtNum, fmtRate } from "../lib/aggregate";
import type { LocalAnalysis } from "../lib/analyst";
import {
  detectOnDeviceAI,
  detectWebGpu,
  isRunningInIframe,
  LOCAL_LLM_MODEL,
  LOCAL_LLM_SIZE,
  WEBGPU_MODELS,
  type AiEngine,
  type AiOutcome,
  type AiState,
  type AiTask,
  type WebGpuSupport,
} from "../lib/llm";
import type { Post } from "../lib/types";
import { cn } from "../utils/cn";
import Heatmap from "./Heatmap";
import { Badge, ProgressBar } from "./ui";

interface Props {
  posts: Post[];
  local: LocalAnalysis;
  threshold: number;
  setThreshold: (n: number) => void;
  ai: AiState;
  engine: AiEngine;
  setEngine: (e: AiEngine) => void;
  webgpuModel: string;
  setWebgpuModel: (model: string) => void;
  ollamaModel: string;
  setOllamaModel: (model: string) => void;
  ollamaUrl: string;
  setOllamaUrl: (url: string) => void;
  onRunAi: (question?: string, task?: AiTask) => Promise<AiOutcome>;
  labelState: {
    status: "idle" | "loading" | "ready" | "partial" | "error";
    progress: number;
    message: string;
    errors: string[];
    errorsByKey: Record<string, string>;
  };
  semanticStatus: "loading" | "ready" | "error";
  semanticProgress: number;
  semanticMessage: string;
  onRetryEmbeddings: () => void;
  onRetryThemeLabels: () => void;
  onRetrySingleTheme: (key: string) => void;
  onCancel: () => void;
  /** Cambia solo cuando cambia el contenido de los posts (nunca con el umbral). */
  dataSignature: string;
}

type Tab = "resumen" | "grupos" | "ideas" | "pregunta";

export default function AnalysisSection(p: Props) {
  const [tab, setTab] = useState<Tab>("resumen");
  const [question, setQuestion] = useState("");
  const [showMatrix, setShowMatrix] = useState(false);
  const [chrome, setChrome] = useState("Comprobando disponibilidad...");
  const [gpu, setGpu] = useState<WebGpuSupport | null>(null);
  const [chat, setChat] = useState<{ question: string; result: AiOutcome }[]>(
    [],
  );
  const { ai, local } = p;
  const busy = ai.status === "loading" || p.labelState.status === "loading";

  useEffect(() => {
    let active = true;
    const inIframe = isRunningInIframe();
    void detectOnDeviceAI().then((state) => {
      if (!active) return;
      setChrome(
        state === "available"
          ? "Gemini Nano (Chrome) está listo en este navegador."
          : state === "downloadable"
            ? "Chrome informa de un modelo pendiente de descarga."
            : inIframe
              ? "Chrome Prompt API está bloqueada dentro de un iframe (funciona en localhost o pestaña directa)."
              : "La LLM integrada de Chrome no está disponible en este dispositivo.",
      );
    });
    void detectWebGpu().then((info) => {
      if (active) setGpu(info);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setChat([]);
    setQuestion("");
  }, [p.dataSignature]);

  const ask = async () => {
    if (!question.trim() || busy) return;
    const value = question.trim();
    setQuestion("");
    const result = await p.onRunAi(value, "question");
    setChat((old) => [{ question: value, result }, ...old].slice(0, 8));
  };
  const output = (task: AiTask) =>
    ai.task === task &&
    (ai.status === "ready" && ai.source === "llm" ? (
      <div className="space-y-2 border-t border-blue-500/25 pt-3">
        <p className="text-[11px] font-semibold text-blue-300">
          Respuesta de LLM: {ai.engine} · {ai.model}
        </p>
        <p className="max-h-[55vh] overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
          {ai.narrative}
        </p>
        <p className="text-[11px] text-slate-500">
          El modelo puede equivocarse. Sus conclusiones no son hechos
          verificados.
        </p>
        <details className="text-xs text-slate-400">
          <summary className="min-h-10 cursor-pointer py-2">
            Ver exactamente qué recibió el modelo
          </summary>
          <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-[11px]">
            {ai.input}
          </pre>
        </details>
      </div>
    ) : ai.status === "error" ? (
      <div
        role="alert"
        className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-200"
      >
        <p className="font-semibold">No se ha generado ninguna respuesta IA.</p>
        <p className="mt-1">{ai.error}</p>
        <p className="mt-1 text-slate-400">
          No se ha sustituido por una plantilla. Cambia el motor o reintenta.
        </p>
      </div>
    ) : null);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <h2 className="text-sm font-semibold">
            Cálculos y LLM, por separado
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-400">
            El resumen y las plantillas son código. Solo una respuesta recibida
            de un modelo se etiqueta como LLM.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="sr-only" htmlFor="ai-engine">
            Motor LLM
          </label>
          <select
            id="ai-engine"
            value={p.engine}
            onChange={(e) => p.setEngine(e.target.value as AiEngine)}
            className="min-h-10 max-w-full rounded-lg border border-white/10 bg-[#11151d] px-2"
          >
            <option value="auto">Automático: Chrome → WebGPU → CPU</option>
            <option value="webgpu">WebGPU · GPU en navegador (WebLLM)</option>
            <option value="transformers">CPU WASM · ligero (calidad básica)</option>
            <option value="chrome">LLM integrada de Chrome</option>
            <option value="ollama">Ollama local</option>
          </select>
          {(p.engine === "webgpu" || p.engine === "auto") && (
            <select
              aria-label="Modelo WebGPU"
              value={p.webgpuModel}
              onChange={(e) => p.setWebgpuModel(e.target.value)}
              className="min-h-10 max-w-full rounded-lg border border-white/10 bg-[#11151d] px-2"
            >
              {WEBGPU_MODELS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          )}
          {p.engine === "ollama" && (
            <>
              <input
                aria-label="Modelo Ollama"
                value={p.ollamaModel}
                onChange={(e) => p.setOllamaModel(e.target.value)}
                placeholder="llama3.2"
                className="min-h-10 w-28 rounded-lg border border-white/10 bg-black/30 px-2"
              />
              <input
                aria-label="URL de Ollama"
                value={p.ollamaUrl}
                onChange={(e) => p.setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="min-h-10 w-44 rounded-lg border border-white/10 bg-black/30 px-2 text-slate-300"
              />
            </>
          )}
          {busy && (
            <button
              onClick={p.onCancel}
              className="min-h-10 rounded-lg border border-white/10 px-3 text-amber-200"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
      <details className="text-[11px] text-slate-400">
        <summary className="min-h-9 cursor-pointer py-1.5">
          Estado del modelo y privacidad
        </summary>
        <p className="max-w-3xl leading-relaxed">
          {chrome}{" "}
          {gpu === null
            ? "Comprobando WebGPU..."
            : gpu.available
              ? `WebGPU detectado (${gpu.f16 ? "con shader-f16" : "modo f32 compatible"}): funciona incluso dentro de un iframe con ventana acotada (2048 tokens) y reintento ante reinicio de GPU.`
              : "WebGPU no detectado en este navegador."}{" "}
          Respaldo CPU: {LOCAL_LLM_MODEL} ({LOCAL_LLM_SIZE}, calidad básica en español) en Web Worker dedicado. Los embeddings semánticos (Xenova/multilingual-e5-small) también corren en un Web Worker propio (intenta WebGPU y cae a WASM si no está disponible). La app es 100 % estática en navegador (sin servidor propio); si dispones de un servidor Ollama local o en red, puedes seleccionarlo arriba e indicar su URL (con OLLAMA_ORIGINS=*).
        </p>
      </details>
      <div
        role="tablist"
        aria-label="Vistas de análisis"
        className="grid grid-cols-2 gap-1 sm:grid-cols-4"
      >
        {(
          [
            ["resumen", "Resumen numérico"],
            ["grupos", `Grupos (${local.themes.length})`],
            ["ideas", "Ideas con LLM"],
            ["pregunta", "Preguntar a la LLM"],
          ] as [Tab, string][]
        ).map(([id, text]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "min-h-11 rounded-lg px-3 text-xs font-semibold",
              tab === id
                ? "bg-blue-600 text-white"
                : "bg-white/5 text-slate-300 hover:bg-white/10",
            )}
          >
            {text}
          </button>
        ))}
      </div>
      {ai.status === "loading" && (
        <div role="status">
          <p className="text-xs text-blue-300">{ai.message}</p>
          <ProgressBar value={ai.progress} className="mt-2" />
        </div>
      )}

      {tab === "resumen" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Badge tone="slate">Cálculos deterministas · sin IA</Badge>
            <button
              disabled={busy}
              onClick={() => void p.onRunAi(undefined, "analysis")}
              className="min-h-11 rounded-lg border border-blue-500/30 px-3 text-xs font-semibold text-blue-300 disabled:opacity-40"
            >
              Analizar con LLM real
            </button>
          </div>
          <div className="max-h-80 space-y-2 overflow-auto text-sm leading-relaxed text-slate-300">
            {local.narrative.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          {local.funnelNotes.length > 0 && (
            <details className="border-t border-white/10 text-xs text-slate-400">
              <summary className="min-h-11 cursor-pointer py-3">
                Ver fórmulas y ratios del embudo (sin IA)
              </summary>
              <ul className="space-y-2">
                {local.funnelNotes.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </details>
          )}
          {output("analysis")}
        </div>
      )}

      {tab === "grupos" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-400">
              Afinidad semántica por embeddings multilingual-e5-small (coseno),
              no por Bag of Words. La LLM solo pone nombres y puede equivocarse.
            </p>
            <button
              disabled={busy || p.semanticStatus !== "ready" || !local.themes.length}
              onClick={p.onRetryThemeLabels}
              className="min-h-11 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white disabled:opacity-40"
            >
              {p.labelState.status === "loading"
                ? "Generando nombres..."
                : (() => {
                    const missingCount = local.themes.filter(
                      (t) => t.labelSource !== "ai",
                    ).length;
                    return missingCount > 0 && missingCount < local.themes.length
                      ? `Generar nombres con LLM (${missingCount} pend.)`
                      : "Generar nombres con LLM";
                  })()}
            </button>
          </div>
          {p.semanticStatus === "loading" && local.includedIndices.length > 0 && (
            <div
              role="status"
              className="space-y-1.5 rounded-lg border border-blue-500/20 bg-blue-500/[0.04] p-2.5 text-xs text-blue-200"
            >
              <p>{p.semanticMessage}</p>
              <ProgressBar value={Math.max(0.03, p.semanticProgress)} />
            </div>
          )}
          {p.semanticStatus === "error" && local.includedIndices.length > 0 && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs text-amber-200"
            >
              <span>{p.semanticMessage}</span>
              <button
                className="min-h-9 shrink-0 font-semibold underline"
                onClick={p.onRetryEmbeddings}
              >
                Reintentar embeddings
              </button>
            </div>
          )}
          {p.semanticStatus === "ready" && p.semanticMessage && (
            <p className="text-xs text-emerald-300">{p.semanticMessage}</p>
          )}
          {!!local.excludedPostIds.length && (
            <p className="rounded-lg border border-amber-500/25 p-2 text-xs text-amber-200">
              {local.excludedPostIds.length} posts excluidos porque falta texto
              admitido. Revísalos en Posts antes de nombrar grupos.
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <label className="flex min-h-10 items-center gap-2">
              Umbral{" "}
              <input
                aria-label="Umbral coseno"
                type="range"
                min={0.5}
                max={0.95}
                step={0.02}
                value={p.threshold}
                onChange={(e) => p.setThreshold(Number(e.target.value))}
                className="w-28 accent-blue-500"
              />
              <span className="tabular-nums text-blue-300">
                {p.threshold.toFixed(2)}
              </span>
            </label>
            <button
              disabled={p.semanticStatus !== "ready"}
              onClick={() => setShowMatrix(!showMatrix)}
              className="min-h-10 underline disabled:opacity-40"
            >
              {showMatrix ? "Ocultar matriz" : "Ver matriz"}
            </button>
          </div>
          {p.labelState.message && (
            <div role="status">
              <p className="text-xs text-blue-300">{p.labelState.message}</p>
              {p.labelState.status === "loading" && (
                <ProgressBar value={p.labelState.progress} className="mt-1.5" />
              )}
            </div>
          )}
          {p.labelState.errors.length > 0 && (
            <div
              role="alert"
              className="rounded-lg border border-amber-500/25 p-3 text-xs text-amber-200"
            >
              <p>
                Los nombres pendientes siguen siendo provisionales; no son IA.
              </p>
              <ul className="mt-1 space-y-1">
                {[...new Set(p.labelState.errors)].map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          {showMatrix && (
            <Heatmap
              posts={local.includedIndices.map((i) => p.posts[i])}
              sims={local.includedIndices.map((i) =>
                local.includedIndices.map((j) => local.sims[i][j]),
              )}
            />
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {local.themes.map((theme) => (
              <div
                key={theme.key}
                className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-white">
                    {theme.name}
                  </h3>
                  <Badge
                    tone={theme.labelSource === "ai" ? "emerald" : "slate"}
                  >
                    {theme.labelSource === "ai"
                      ? "Nombre de LLM"
                      : "Palabras clave · sin IA"}
                  </Badge>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  {theme.whyClustered}
                </p>
                {theme.labelEngine && (
                  <p className="break-words text-[10px] text-blue-300">
                    {theme.labelEngine}
                  </p>
                )}
                <dl className="grid grid-cols-3 gap-2 border-y border-white/5 py-2 text-xs">
                  <div>
                    <dt className="text-slate-500">Alcance (suma)</dt>
                    <dd>{fmtNum(theme.audience.totals.alcance)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Interacción</dt>
                    <dd>{fmtRate(theme.audience.totals.engagementRate)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Seguidores</dt>
                    <dd>{fmtNum(theme.audience.totals.seguidores)}</dd>
                  </div>
                </dl>
                <ul className="space-y-1 text-xs text-slate-400">
                  {theme.members.map((m) => (
                    <li key={p.posts[m].id} className="break-words">
                      {p.posts[m].title}
                    </li>
                  ))}
                </ul>
                {p.labelState.errorsByKey[theme.key] && (
                  <p role="status" className="text-[11px] text-amber-200">
                    No se generó nombre: {p.labelState.errorsByKey[theme.key]}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <p className="text-[10px] text-slate-500">
                    {theme.members.length > 1
                      ? `Coseno medio ${theme.avgSim.toFixed(2)}`
                      : "Grupo de un solo post; no hay par que comparar."}
                  </p>
                  <button
                    type="button"
                    disabled={busy || p.semanticStatus !== "ready"}
                    onClick={() => p.onRetrySingleTheme(theme.key)}
                    className="min-h-8 text-[11px] text-blue-300 underline disabled:opacity-40"
                  >
                    {theme.labelSource === "ai" ? "Regenerar" : "Nombrar con LLM"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "ideas" && (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Las sugerencias automáticas anteriores eran plantillas. Aquí se
            mostrará únicamente una propuesta recibida de la LLM, indicando su
            modelo.
          </p>
          <button
            disabled={busy}
            onClick={() => void p.onRunAi(undefined, "ideas")}
            className="min-h-11 rounded-lg bg-blue-600 px-4 text-xs font-semibold disabled:opacity-40"
          >
            Generar propuestas con la LLM
          </button>
          {output("ideas")}
          <details className="border-t border-white/10 text-xs text-slate-400">
            <summary className="min-h-11 cursor-pointer py-3">
              Ver plantillas orientativas del programa (sin IA)
            </summary>
            <ul className="space-y-3">
              {local.postIdeas.map((idea, i) => (
                <li key={i}>
                  <p>{idea.hook}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {idea.porQueFunciona}
                  </p>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {tab === "pregunta" && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            La pregunta se envía a la LLM elegida junto con tus estadísticas y
            grupos admitidos. Sin modelo no se responde con una plantilla.
          </p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void ask();
            }}
          >
            <input
              aria-label="Pregunta a la LLM"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="¿Qué segmento destaca y qué dato lo demuestra?"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            />
            <button
              disabled={busy || !question.trim()}
              className="min-h-11 rounded-lg bg-blue-600 px-3 text-xs font-semibold disabled:opacity-40"
            >
              Preguntar
            </button>
          </form>
          {chat.length === 0 && ai.task === "question" && output("question")}
          <div className="max-h-[55vh] space-y-3 overflow-auto">
            {chat.map((item, i) => (
              <div
                key={i}
                className="rounded-lg border border-white/10 p-3 text-sm"
              >
                <p className="font-semibold text-blue-300">{item.question}</p>
                {item.result.ok && item.result.source === "llm" ? (
                  <>
                    <p className="mt-2 whitespace-pre-wrap leading-relaxed">
                      {item.result.narrative}
                    </p>
                    <p className="mt-2 text-[10px] text-slate-500">
                      LLM: {item.result.engine} · {item.result.model}
                    </p>
                  </>
                ) : (
                  <p role="alert" className="mt-2 text-xs text-amber-200">
                    No se generó respuesta IA: {item.result.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
