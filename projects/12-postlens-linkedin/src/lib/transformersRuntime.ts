// The app is distributed as a single HTML file. Load the browser runtime on
// demand so Vite does not inline the large ONNX binaries into that HTML.
const RUNTIME_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";

export async function loadTransformers(): Promise<typeof import("@huggingface/transformers")> {
  return import(/* @vite-ignore */ RUNTIME_URL) as Promise<typeof import("@huggingface/transformers")>;
}