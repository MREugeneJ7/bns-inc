export interface AnalyticsRow {
  categoria: string;
  valor: string;
  pct: number;
}

export interface Metric {
  key: string;
  label: string;
  value: string;
  num: number | null;
}

export interface CategoryGroup {
  categoria: string;
  items: AnalyticsRow[];
  total: number;
}

export interface TextProvenance {
  version: 2;
  kind: "public-page" | "manual" | "demo";
  bodyHash: string;
  recordedAt: number;
  provider?: string;
  requestedUrl?: string;
  matchedUrl?: string;
  postId?: string;
  /** Si el Excel traía share/ugcPost y la página pública vincula su activity equivalente. */
  activityId?: string;
  method?: "json-ld" | "post-container" | "user-confirmed";
  bridge?: "exact-id" | "dom-urn-bridge" | "canonical-slug-bridge";
  author?: string;
}

export interface Post {
  id: string;
  title: string;
  /** user = escrito por ti · ai = generado por la IA del navegador · auto = primera línea/slug provisional */
  titleSource?: "user" | "ai" | "auto";
  titleEngine?: string;
  /** Último error real si la LLM no pudo generar el título (se borra al titular o editar). */
  titleError?: string;
  /** Un texto antiguo sin procedencia no participa en el coseno hasta revisarlo. */
  textStatus?: "ok" | "missing" | "unverified";
  /** Último error real si no se encontró o no se pudo verificar el post. */
  importError?: string;
  /** Nombre del archivo Excel/CSV desde el que se cargó este post. */
  sourceFile?: string;
  provenance?: TextProvenance;
  importLog?: string[];
  createdAt: number;
  urn: string | null;
  url: string | null;
  body: string;
  curl: string;
  rows: AnalyticsRow[];
  metrics: Metric[];
  fecha: string | null;
  hora: string | null;
}

/** Métricas que se muestran como chips en las tarjetas. */
export const POST_CHIP_KEYS: { key: string; icon: string; label: string }[] = [
  { key: "impresiones", icon: "👁", label: "impresiones" },
  { key: "alcance", icon: "🎯", label: "alcance" },
  { key: "reacciones", icon: "❤️", label: "reacciones" },
  { key: "comentarios", icon: "💬", label: "comentarios" },
  { key: "compartidos", icon: "🔄", label: "compartidos" },
  { key: "guardados", icon: "🔖", label: "guardados" },
];

export function metricOf(post: Post, key: string): Metric | undefined {
  return post.metrics?.find((m) => m.key === key);
}

/** Suma de una métrica numérica (impresiones, reacciones…) en una lista de métricas. */
export function sumMetric(
  metrics: Metric[] | undefined,
  keys: string[],
): number {
  if (!metrics) return 0;
  let s = 0;
  for (const m of metrics) {
    if (m.num !== null && keys.includes(m.key)) s += m.num;
  }
  return s;
}

export function clusterMetricTotal(
  posts: Post[],
  members: number[],
  keys: string[],
): number {
  return members.reduce((s, m) => s + sumMetric(posts[m]?.metrics, keys), 0);
}

export type LlmEngineKind = "webllm" | "transformers" | "ollama" | "heuristic";

export interface LlmLabel {
  tema: string;
  emoji: string;
  por_que: string[];
  hashtags: string[];
  engine: string;
}

export interface ClusterResult {
  members: number[];
  centroidSims: number[];
  avgSim: number;
  label: LlmLabel;
}

export interface Analysis {
  model: string;
  embeddings: number[][];
  sims: number[][];
  clusters: ClusterResult[];
}

export type Phase =
  | "idle"
  | "embed-model"
  | "embedding"
  | "clustering"
  | "llm-model"
  | "labeling"
  | "done"
  | "error";

export interface AnalysisState {
  phase: Phase;
  progress: number;
  message: string;
  analysis: Analysis | null;
  error: string | null;
}
