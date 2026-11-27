import type { Text2TextGenerationPipeline } from "@huggingface/transformers";
import { loadTransformers } from "./transformersRuntime";

const MODEL = "Xenova/LaMini-Flan-T5-77M";

let generator: Text2TextGenerationPipeline | null = null;

async function removeLegacySpaCache(): Promise<void> {
  try {
    const cache = await caches.open("transformers-cache");
    for (const request of await cache.keys()) {
      // Older versions could cache the SPA's index.html as a /models/... JSON file.
      if (new URL(request.url).pathname.startsWith("/models/"))
        await cache.delete(request);
    }
  } catch {
    /* CacheStorage may be unavailable in private/embedded contexts. */
  }
}

self.onmessage = async (
  event: MessageEvent<{ id: number; prompt: string; maxNewTokens: number }>,
) => {
  const { id, prompt, maxNewTokens } = event.data;
  try {
    if (!generator) {
      self.postMessage({ id, type: "phase", phase: "loading" });
      await removeLegacySpaCache();
      const { env, pipeline } = await loadTransformers();
      env.allowLocalModels = false;
      // Avoid SharedArrayBuffer threads inside restricted iframes.
      const onnxWasm = (
        env as unknown as {
          backends?: { onnx?: { wasm?: { numThreads?: number; proxy?: boolean } } };
        }
      ).backends?.onnx?.wasm;
      if (onnxWasm) {
        onnxWasm.numThreads = 1;
        onnxWasm.proxy = false;
      }
      generator = await pipeline<"text2text-generation">("text2text-generation", MODEL, {
        device: "wasm",
        dtype: "q8",
        progress_callback: (p: {
          status: string;
          progress?: number;
          file?: string;
          loaded?: number;
          total?: number;
        }) => {
          self.postMessage({ id, type: "download", ...p });
        },
      });
    }
    const encoded = generator.tokenizer(prompt, { truncation: false });
    const seqLen = encoded.input_ids?.dims?.at(-1) ?? 0;
    if (seqLen > 1024)
      throw new Error(
        "El contexto supera los 1024 tokens del modelo CPU. No se ha recortado en silencio. Usa Chrome u Ollama.",
      );
    self.postMessage({ id, type: "phase", phase: "generating" });
    const output = await generator(prompt, {
      max_new_tokens: maxNewTokens,
      do_sample: false,
      repetition_penalty: 1.15,
    });
    const item = output[0];
    const text =
      "generated_text" in item ? String(item.generated_text ?? "").trim() : "";
    if (!text) throw new Error("La LLM no devolvió texto.");
    self.postMessage({ id, type: "result", text });
  } catch (error) {
    self.postMessage({
      id,
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
