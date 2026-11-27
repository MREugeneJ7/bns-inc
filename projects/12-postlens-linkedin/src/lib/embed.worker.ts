import type { FeatureExtractionPipeline } from "@huggingface/transformers";
import { loadTransformers } from "./transformersRuntime";

const MODEL = "Xenova/multilingual-e5-small";
type Device = "webgpu" | "wasm";

interface WorkerRequest {
  id: number;
  texts: string[];
}

interface ProgressEvent {
  status?: string;
  progress?: number;
  file?: string;
  loaded?: number;
  total?: number;
}

let wasmExtractor: FeatureExtractionPipeline | null = null;
let webgpuDisabled = false;
const cache = new Map<string, number[]>();

async function canUseWebGpu(): Promise<boolean> {
  if (webgpuDisabled) return false;
  try {
    const nav = self.navigator as unknown as {
      gpu?: { requestAdapter: () => Promise<unknown | null> };
    };
    if (!nav?.gpu?.requestAdapter) return false;
    const adapter = await Promise.race([
      nav.gpu.requestAdapter(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500)),
    ]);
    return Boolean(adapter);
  } catch {
    return false;
  }
}

async function createPipeline(
  device: Device,
  onProgress: (ratio: number, message: string) => void,
): Promise<FeatureExtractionPipeline> {
  if (device === "wasm" && wasmExtractor) return wasmExtractor;
  let mod: Awaited<ReturnType<typeof loadTransformers>>;
  try {
    mod = await loadTransformers();
  } catch (err) {
    const wrapped = new Error(
      err instanceof Error ? err.message : "No se pudo cargar @huggingface/transformers en el worker.",
    );
    (wrapped as Error & { workerLoadError?: boolean }).workerLoadError = true;
    throw wrapped;
  }
  const { env, pipeline } = mod;
  env.allowLocalModels = false;
  // Iframe-safe WASM flags (no SharedArrayBuffer / crossOriginIsolated needed).
  const onnxWasm = (
    env as unknown as {
      backends?: { onnx?: { wasm?: { numThreads?: number; proxy?: boolean } } };
    }
  ).backends?.onnx?.wasm;
  if (onnxWasm) {
    onnxWasm.numThreads = 1;
    onnxWasm.proxy = false;
  }
  const files = new Map<string, { loaded: number; total: number }>();
  const pipe = await pipeline<"feature-extraction">(
    "feature-extraction",
    MODEL,
    {
      device,
      dtype: device === "webgpu" ? "fp16" : "q8",
      progress_callback: (ev: ProgressEvent) => {
        if (ev?.status !== "progress") return;
        if (ev.file && typeof ev.total === "number" && ev.total > 0) {
          files.set(ev.file, { loaded: ev.loaded ?? 0, total: ev.total });
        }
        const entries = [...files.values()];
        const loaded = entries.reduce((s, f) => s + f.loaded, 0);
        const total = entries.reduce((s, f) => s + f.total, 0);
        const raw =
          total > 0
            ? loaded / total
            : typeof ev.progress === "number"
              ? ev.progress / 100
              : 0;
        const pct = Math.min(100, Math.max(0, Math.round(raw * 100)));
        onProgress(
          Math.min(0.75, Math.max(0.05, raw * 0.75)),
          `Descargando ${MODEL} (${device.toUpperCase()}): ${pct} %`,
        );
      },
    },
  );
  if (device === "wasm") wasmExtractor = pipe;
  return pipe;
}

function isValidVector(v: number[]): boolean {
  if (v.length < 32) return false;
  let normSq = 0;
  for (let i = 0; i < v.length; i++) {
    const x = v[i];
    if (!Number.isFinite(x)) return false;
    normSq += x * x;
  }
  // Normalized unit vector should have L2 norm near 1 (guards against collapsed zeros).
  return normSq > 0.5 && normSq < 1.5;
}

async function encodeBatch(
  texts: string[],
  device: Device,
  onProgress: (ratio: number, message: string) => void,
): Promise<number[][]> {
  const uncached: number[] = [];
  const results: number[][] = new Array(texts.length);
  for (let i = 0; i < texts.length; i++) {
    const clean = texts[i].trim();
    const hit = cache.get(`${device}\0${clean}`);
    if (hit) results[i] = hit;
    else uncached.push(i);
  }
  if (!uncached.length) return results;

  const pipe = await createPipeline(device, onProgress);
  try {
    for (let k = 0; k < uncached.length; k++) {
      const idx = uncached[k];
      const clean = texts[idx].trim();
      onProgress(
        0.75 + (k / uncached.length) * 0.24,
        `Embeddings semánticos ${k + 1}/${uncached.length} (${device.toUpperCase()})...`,
      );
      // E5 models require the "passage: " prefix for symmetric document similarity.
      const tensor = await pipe(`passage: ${clean}`, {
        pooling: "mean",
        normalize: true,
      });
      const vector = Array.from(tensor.data as Float32Array);
      if (!isValidVector(vector)) {
        throw new Error(
          `El backend ${device.toUpperCase()} devolvió un embedding inválido.`,
        );
      }
      cache.set(`${device}\0${clean}`, vector);
      results[idx] = vector;
    }
    return results;
  } finally {
    // Release WebGPU session right after batch so VRAM stays available for WebLLM;
    // model files stay cached in browser CacheStorage for quick reload if needed.
    if (device === "webgpu") {
      try {
        await (pipe as unknown as { dispose?: () => Promise<void> }).dispose?.();
      } catch {
        /* Safe to ignore disposal errors after GPU device reset. */
      }
    }
  }
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, texts } = event.data;
  const report = (progress: number, message: string) => {
    self.postMessage({ id, type: "progress", progress, message });
  };
  try {
    if (!texts.length) {
      self.postMessage({ id, type: "result", vectors: [], device: "wasm" });
      return;
    }
    const tryGpu = await canUseWebGpu();
    if (tryGpu) {
      try {
        report(0.03, "Cargando multilingual-e5-small en WebGPU (worker)...");
        const vectors = await encodeBatch(texts, "webgpu", report);
        self.postMessage({ id, type: "result", vectors, device: "webgpu" });
        return;
      } catch (err) {
        if (
          err &&
          typeof err === "object" &&
          "workerLoadError" in err &&
          (err as { workerLoadError?: boolean }).workerLoadError
        ) {
          throw err;
        }
        webgpuDisabled = true;
        const why = err instanceof Error ? err.message : "no disponible";
        report(
          0.04,
          `WebGPU no disponible (${why}). Cambiando automáticamente a WASM...`,
        );
      }
    } else {
      report(0.04, "WebGPU no detectado. Cargando multilingual-e5-small en WASM (worker)...");
    }

    const vectors = await encodeBatch(texts, "wasm", report);
    self.postMessage({ id, type: "result", vectors, device: "wasm" });
  } catch (err) {
    const isLoadErr = Boolean(
      err && typeof err === "object" && "workerLoadError" in err && (err as { workerLoadError?: boolean }).workerLoadError,
    );
    self.postMessage({
      id,
      type: isLoadErr ? "unsupported" : "error",
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
