import type { FeatureExtractionPipeline } from "@huggingface/transformers";
import EmbedWorker from "./embed.worker?worker&inline";
import { loadTransformers } from "./transformersRuntime";

export const EMBED_MODEL = "Xenova/multilingual-e5-small";
export type EmbedDevice = "webgpu" | "wasm";

export interface EmbedProgress {
  progress: number;
  message: string;
}

export interface EmbedResult {
  vectors: number[][];
  device: EmbedDevice;
  viaWorker: boolean;
}

// Per-session cache of computed L2-normalized vectors keyed by active device and text.
const mainCache = new Map<string, number[]>();
let lastDevice: EmbedDevice | null = null;
let workerInstance: Worker | null = null;
let workerFailed = false;
let workerSeq = 0;
let workerSerial = Promise.resolve();

function isValidVector(v: number[]): boolean {
  if (v.length < 32) return false;
  let normSq = 0;
  for (let i = 0; i < v.length; i++) {
    const x = v[i];
    if (!Number.isFinite(x)) return false;
    normSq += x * x;
  }
  return normSq > 0.5 && normSq < 1.5;
}

function runInWorker(
  texts: string[],
  onProgress?: (info: EmbedProgress) => void,
  signal?: AbortSignal,
): Promise<{ vectors: number[][]; device: EmbedDevice }> {
  const run = workerSerial.then(
    () =>
      new Promise<{ vectors: number[][]; device: EmbedDevice }>(
        (resolve, reject) => {
          if (signal?.aborted) {
            reject(new Error("Cancelado."));
            return;
          }
          let w: Worker;
          try {
            workerInstance ??= new EmbedWorker();
            w = workerInstance;
          } catch (err) {
            workerFailed = true;
            reject(err);
            return;
          }
          const id = ++workerSeq;
          let timer: ReturnType<typeof setTimeout>;
          const resetTimeout = (ms: number) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
              cleanup();
              w.terminate();
              if (workerInstance === w) workerInstance = null;
              reject(
                new Error(
                  "Tiempo de espera agotado al calcular embeddings semánticos.",
                ),
              );
            }, ms);
          };
          const cleanup = () => {
            clearTimeout(timer);
            w.removeEventListener("message", onMsg);
            w.removeEventListener("error", onErr);
            signal?.removeEventListener("abort", onAbort);
          };
          const onAbort = () => {
            cleanup();
            // Do not permanently break subsequent requests; only abort the active worker if busy.
            w.terminate();
            if (workerInstance === w) workerInstance = null;
            reject(new Error("Cancelado."));
          };
          const onErr = (ev: ErrorEvent) => {
            cleanup();
            w.terminate();
            if (workerInstance === w) workerInstance = null;
            workerFailed = true;
            reject(
              new Error(
                ev?.message || "No se pudo ejecutar el Web Worker de embeddings.",
              ),
            );
          };
          const onMsg = (ev: MessageEvent) => {
            const d = ev.data;
            if (!d || d.id !== id) return;
            resetTimeout(180000);
            if (d.type === "progress") {
              onProgress?.({
                progress: typeof d.progress === "number" ? d.progress : 0.1,
                message: String(d.message ?? ""),
              });
            } else if (d.type === "result") {
              cleanup();
              resolve({ vectors: d.vectors, device: d.device });
            } else if (d.type === "unsupported") {
              cleanup();
              w.terminate();
              if (workerInstance === w) workerInstance = null;
              workerFailed = true;
              reject(new Error(String(d.message ?? "Worker no admitido en este iframe.")));
            } else if (d.type === "error") {
              cleanup();
              reject(new Error(String(d.message ?? "Error en embeddings.")));
            }
          };
          w.addEventListener("message", onMsg);
          w.addEventListener("error", onErr);
          signal?.addEventListener("abort", onAbort, { once: true });
          resetTimeout(240000);
          w.postMessage({ id, texts });
        },
      ),
  );
  workerSerial = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/* Fallback in main thread if Worker startup is restricted by iframe/CSP. */
let fallbackWasmPipe: FeatureExtractionPipeline | null = null;

async function encodeInMainThread(
  texts: string[],
  device: EmbedDevice,
  onProgress?: (info: EmbedProgress) => void,
  signal?: AbortSignal,
): Promise<number[][]> {
  if (signal?.aborted) throw new Error("Cancelado.");
  const { env, pipeline } = await loadTransformers();
  env.allowLocalModels = false;
  const onnxWasm = (
    env as unknown as {
      backends?: { onnx?: { wasm?: { numThreads?: number; proxy?: boolean } } };
    }
  ).backends?.onnx?.wasm;
  if (onnxWasm) {
    onnxWasm.numThreads = 1;
    onnxWasm.proxy = false;
  }
  const pipe: FeatureExtractionPipeline =
    device === "wasm" && fallbackWasmPipe
      ? fallbackWasmPipe
      : await pipeline<"feature-extraction">("feature-extraction", EMBED_MODEL, {
          device,
          dtype: device === "webgpu" ? "fp16" : "q8",
          progress_callback: (ev: { status?: string; progress?: number }) => {
            if (ev?.status === "progress" && typeof ev.progress === "number") {
              const p = Math.max(0, Math.min(100, Math.round(ev.progress)));
              onProgress?.({
                progress: Math.min(0.75, (p / 100) * 0.75),
                message: `Descargando ${EMBED_MODEL} (${device.toUpperCase()}): ${p} %`,
              });
            }
          },
        });
  if (device === "wasm") fallbackWasmPipe = pipe;

  const out: number[][] = [];
  try {
    for (let i = 0; i < texts.length; i++) {
      if (signal?.aborted) throw new Error("Cancelado.");
      onProgress?.({
        progress: 0.75 + (i / Math.max(1, texts.length)) * 0.24,
        message: `Embeddings semánticos ${i + 1}/${texts.length} (${device.toUpperCase()})...`,
      });
      const tensor = await pipe(`passage: ${texts[i].trim()}`, {
        pooling: "mean",
        normalize: true,
      });
      const vector = Array.from(tensor.data as Float32Array);
      if (!isValidVector(vector)) {
        throw new Error(`Embedding inválido en ${device.toUpperCase()}.`);
      }
      out.push(vector);
    }
    return out;
  } finally {
    if (device === "webgpu") {
      try {
        await (pipe as unknown as { dispose?: () => Promise<void> }).dispose?.();
      } catch {
        /* ignore GPU release issue */
      }
    }
  }
}

async function runFallback(
  texts: string[],
  onProgress?: (info: EmbedProgress) => void,
  signal?: AbortSignal,
): Promise<{ vectors: number[][]; device: EmbedDevice }> {
  const nav = typeof navigator !== "undefined" ? (navigator as unknown as { gpu?: { requestAdapter: () => Promise<unknown | null> } }) : undefined;
  let tryGpu = false;
  try {
    tryGpu = Boolean(nav?.gpu && (await nav.gpu.requestAdapter()));
  } catch {
    tryGpu = false;
  }
  if (tryGpu) {
    try {
      onProgress?.({ progress: 0.04, message: "Iniciando multilingual-e5-small en WebGPU..." });
      const vectors = await encodeInMainThread(texts, "webgpu", onProgress, signal);
      return { vectors, device: "webgpu" };
    } catch (err) {
      if (signal?.aborted) throw err;
      onProgress?.({
        progress: 0.05,
        message: `WebGPU no disponible (${err instanceof Error ? err.message : "error"}). Reintentando en WASM...`,
      });
    }
  }
  const vectors = await encodeInMainThread(texts, "wasm", onProgress, signal);
  return { vectors, device: "wasm" };
}

/**
 * Codifica cada texto con Xenova/multilingual-e5-small (prefijo "passage: ",
 * pooling: 'mean', normalize: true). Usa un Web Worker dedicado con WebGPU
 * y cae automáticamente a WASM (q8) si falla o está restringido en el iframe.
 */
export async function embedTexts(
  texts: string[],
  onProgress?: (info: EmbedProgress) => void,
  signal?: AbortSignal,
): Promise<EmbedResult> {
  if (!texts.length) {
    return { vectors: [], device: lastDevice ?? "wasm", viaWorker: !workerFailed };
  }
  const normalized = texts.map((t) => t.trim());

  // Re-use vectors already computed for the same device so uploading one extra post
  // never re-encodes the entire archive.
  if (lastDevice) {
    const dev = lastDevice;
    const missingIdx: number[] = [];
    const merged: number[][] = new Array(normalized.length);
    for (let i = 0; i < normalized.length; i++) {
      const hit = mainCache.get(`${dev}\0${normalized[i]}`);
      if (hit) merged[i] = hit;
      else missingIdx.push(i);
    }
    if (missingIdx.length === 0) {
      return { vectors: merged, device: dev, viaWorker: !workerFailed };
    }
    const subset = missingIdx.map((i) => normalized[i]);
    const res = await dispatchBatch(subset, onProgress, signal);
    if (res.device === dev) {
      missingIdx.forEach((origIdx, k) => {
        mainCache.set(`${dev}\0${normalized[origIdx]}`, res.vectors[k]);
        merged[origIdx] = res.vectors[k];
      });
      return { vectors: merged, device: res.device, viaWorker: res.viaWorker };
    }
    // Active backend switched (e.g. WebGPU fell back to WASM): recompute full batch
    // so every vector lives in the exact same embedding space.
    lastDevice = res.device;
    missingIdx.forEach((origIdx, k) => {
      mainCache.set(`${res.device}\0${normalized[origIdx]}`, res.vectors[k]);
    });
  }

  const full = await dispatchBatch(normalized, onProgress, signal);
  lastDevice = full.device;
  normalized.forEach((txt, i) => {
    mainCache.set(`${full.device}\0${txt}`, full.vectors[i]);
  });
  return full;
}

async function dispatchBatch(
  texts: string[],
  onProgress?: (info: EmbedProgress) => void,
  signal?: AbortSignal,
): Promise<EmbedResult> {
  const canWorker = typeof Worker !== "undefined" && !workerFailed;
  if (canWorker) {
    try {
      const res = await runInWorker(texts, onProgress, signal);
      return { ...res, viaWorker: true };
    } catch (err) {
      if (signal?.aborted) throw err;
      if (!workerFailed) {
        // Real model/network error inside worker: only try main-thread fallback if worker itself died.
        throw err;
      }
      onProgress?.({
        progress: 0.03,
        message: "Worker restringido en este entorno; reintentando en hilo local...",
      });
    }
  }
  const res = await runFallback(texts, onProgress, signal);
  return { ...res, viaWorker: false };
}

export { cosine, simMatrix, clusterByCosine, centroidSim } from "./cosine";
