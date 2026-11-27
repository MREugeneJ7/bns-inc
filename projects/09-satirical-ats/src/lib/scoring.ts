import type { Answers } from "./types";
import {
  allChoiceQuestions,
  communitiesQuestion,
  diversityChoiceQuestions,
  JOB,
  openQuestions,
} from "./questions";

const STOPWORDS = new Set(
  [
    "a","al","algo","algunas","algunos","ante","antes","como","con","contra","cual","cuando",
    "de","del","desde","donde","durante","e","el","ella","ellas","ellos","en","entre","era",
    "eran","es","esa","ese","eso","esta","estaba","estado","estas","este","esto","estos","fue",
    "ha","han","hasta","hay","he","la","las","le","les","lo","los","más","me","mi","mis","mucho",
    "muy","nada","ni","no","nos","o","otra","otro","para","pero","poco","por","porque","que",
    "quien","se","sea","ser","si","sin","sobre","soy","su","sus","también","te","tiene","todo",
    "todos","tu","un","una","uno","unos","y","ya","you","the","and","for","with","that","this",
    "from","have","has","are","was","were","will","would","your","our","their","its","it","of",
    "to","in","on","at","as","by","or","an","be","is","we","they","i",
  ].map((word) => word),
);

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9áéíóúüñ\s+#.-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(" ")
    .map((token) => token.replace(/^[.,;:+\-]+|[.,;:+\-]+$/g, ""))
    .filter((token) => token.length > 2 && !STOPWORDS.has(token) && !/^\d+$/.test(token));
}

export const JOB_DESCRIPTION_CORPUS = `
  Deskjockey for Life busca Ingeniero de Software para el equipo de Plataforma y Gobernanza.
  Posición remota con disponibilidad para viajar y modelo híbrido. Jornada completa.
  Responsabilidades: diseñar construir operar servicios distribuidos, arquitectura de software,
  TypeScript, React, Node.js, PostgreSQL, Kubernetes, Terraform, Go, Rust, Python, AWS,
  observabilidad, disponibilidad, pruebas automatizadas, revisión de código, documentación,
  GitOps, despliegues en producción, on-call, resolución de incidentes, seguridad, escalabilidad.
  Traducir requisitos ambiguos en arquitecturas defendibles, colaborar con producto, diseño y
  cumplimiento, asumir ownership de extremo a extremo, alinear decisiones técnicas con objetivos
  del negocio, comunicar riesgos, mentoría, feedback continuo, cultura de alto rendimiento,
  transparencia, excelencia, cercanía, impacto medible, métricas, OKR, roadmap, innovación,
  inteligencia artificial, gobernanza de datos, privacidad, diversidad, equidad e inclusión.
  Experiencia en entornos de alta ambigüedad, inglés profesional, comunicación escrita,
  trabajo distribuido, autonomía, ownership, crecimiento, ambición, disponibilidad, flexibilidad.
  Ingeniería de software, desarrollo backend y frontend, APIs, microservicios, cloud, DevOps,
  infraestructura como código, monorepo, CI/CD, calidad, rendimiento, accesibilidad, producto.
`;

function termFrequency(tokens: string[]): Map<string, number> {
  const frequencies = new Map<string, number>();
  for (const token of tokens) {
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }
  return frequencies;
}

/** Similitud del coseno real sobre vectores de frecuencia de términos. */
export function cosineSimilarity(cvText: string, fileName: string): number {
  const corpusTokens = tokenize(JOB_DESCRIPTION_CORPUS);
  const cvTokens = tokenize(`${cvText} ${fileName.replace(/[-_.]/g, " ")}`);

  if (cvTokens.length === 0 || corpusTokens.length === 0) return 0;

  const corpusFrequency = termFrequency(corpusTokens);
  const cvFrequency = termFrequency(cvTokens);

  let dot = 0;
  let cvMagnitude = 0;
  let corpusMagnitude = 0;

  for (const [, value] of cvFrequency) cvMagnitude += value * value;
  for (const [, value] of corpusFrequency) corpusMagnitude += value * value;

  for (const [term, value] of cvFrequency) {
    const corpusValue = corpusFrequency.get(term);
    if (corpusValue) dot += value * corpusValue;
  }

  if (cvMagnitude === 0 || corpusMagnitude === 0) return 0;
  return dot / (Math.sqrt(cvMagnitude) * Math.sqrt(corpusMagnitude));
}

export function countWords(value: string): number {
  return tokenize(value).length;
}

export const OPEN_SCORING_FIELDS = openQuestions.map((question) => question.id);
export const WORD_TARGET = 1000;

export type Metric = {
  id: string;
  label: string;
  shortLabel: string;
  weight: number;
  score: number;
  weighted: number;
  detail: string;
};

export type ScoreResult = {
  overall: number;
  passed: boolean;
  metrics: Metric[];
  wordCount: number;
  cosine: number;
  singleCorrect: number;
  singleTotal: number;
  minorityCorrect: number;
  minorityTotal: number;
  reference?: "high" | "low";
  submittedAt: string;
};

export function validateSalary(answers: Answers): string | null {
  const expected = Number(answers.salaryExpected);
  const accept = Number(answers.salaryAccept);
  if (!answers.salaryExpected || !answers.salaryAccept) return null;
  if (!Number.isFinite(expected) || !Number.isFinite(accept)) return null;
  if (accept >= expected) {
    return "La segunda cifra debe ser estrictamente inferior a la primera. El formulario no admite correcciones de coherencia.";
  }
  return null;
}

export function calculateScore(answers: Answers, cvText: string, cvName: string): ScoreResult {
  // 1. Similitud del coseno
  const cosine = cosineSimilarity(cvText, cvName);
  const cosineScore = Math.max(0, Math.min(100, cosine * 100));

  // 2. Volumen argumentativo
  const wordCount = OPEN_SCORING_FIELDS.reduce((total, field) => {
    const value = answers[field];
    return total + (typeof value === "string" ? countWords(value) : 0);
  }, 0);
  const wordsScore = Math.max(0, Math.min(100, (wordCount / WORD_TARGET) * 100));

  // 3. Selección única
  const scoredChoices = allChoiceQuestions.filter((question) =>
    question.options.some((option) => option.best),
  );
  const singleCorrect = scoredChoices.filter((question) => {
    const selected = answers[question.id];
    if (typeof selected !== "string") return false;
    return question.options.some((option) => option.value === selected && option.best);
  }).length;
  const singleTotal = scoredChoices.length;
  const singleScore = singleTotal === 0 ? 0 : (singleCorrect / singleTotal) * 100;

  // 4. Banda salarial
  const expected = Number(answers.salaryExpected);
  const accept = Number(answers.salaryAccept);
  const inRange = Number.isFinite(expected) && expected > 0;
  const position = inRange
    ? Math.max(0, Math.min(1, (JOB.salaryMax - expected) / (JOB.salaryMax - JOB.salaryMin)))
    : 0;
  const coherent = Number.isFinite(accept) && Number.isFinite(expected) && accept < expected;
  const salaryScore = inRange ? position * 75 + (coherent ? 25 : 0) : 0;

  // 5. Diversidad
  let minorityCorrect = 0;
  let minorityTotal = 0;
  for (const question of diversityChoiceQuestions) {
    const selected = answers[question.id];
    const flagged = question.options.filter((option) => option.minority);
    minorityTotal += flagged.length;
    if (typeof selected === "string" && flagged.some((option) => option.value === selected)) {
      minorityCorrect += 1;
    }
  }
  const selectedCommunities = Array.isArray(answers.communities) ? answers.communities : [];
  minorityTotal += communitiesQuestion.options.filter((option) => option.minority).length;
  minorityCorrect += selectedCommunities.filter((value) =>
    communitiesQuestion.options.some((option) => option.value === value && option.minority),
  ).length;
  minorityTotal += 1;
  if (typeof answers.nationality === "string" && answers.nationality && answers.nationality !== "España") {
    minorityCorrect += 1;
  }
  const diversityScore = minorityTotal === 0 ? 0 : (minorityCorrect / minorityTotal) * 100;

  const metrics: Metric[] = [
    {
      id: "cosine",
      label: "Similitud del coseno entre el CV y la oferta",
      shortLabel: "Similitud del CV",
      weight: 20,
      score: round(cosineScore, 1),
      weighted: round((cosineScore * 20) / 100, 1),
      detail: `${cosine.toFixed(3).replace(".", ",")} de similitud vectorial`,
    },
    {
      id: "words",
      label: "Volumen argumentativo de las respuestas abiertas",
      shortLabel: "Volumen argumentativo",
      weight: 20,
      score: round(wordsScore, 1),
      weighted: round((wordsScore * 20) / 100, 1),
      detail: `${wordCount.toLocaleString("es-ES")} palabras / objetivo interno ${WORD_TARGET.toLocaleString("es-ES")}`,
    },
    {
      id: "single",
      label: "Alineación en preguntas de selección única",
      shortLabel: "Selección única",
      weight: 25,
      score: round(singleScore, 1),
      weighted: round((singleScore * 25) / 100, 1),
      detail: `${singleCorrect} de ${singleTotal} alternativas alineadas`,
    },
    {
      id: "salary",
      label: "Posicionamiento en la banda salarial",
      shortLabel: "Banda salarial",
      weight: 15,
      score: round(salaryScore, 1),
      weighted: round((salaryScore * 15) / 100, 1),
      detail: inRange
        ? `${Math.round(expected).toLocaleString("es-ES")} € esperados · ${coherent ? "disponibilidad a la baja coherente" : "sin disponibilidad a la baja"}`
        : "Información salarial incompleta",
    },
    {
      id: "diversity",
      label: "Representatividad de opciones minoritarias",
      shortLabel: "Diversidad",
      weight: 20,
      score: round(diversityScore, 1),
      weighted: round((diversityScore * 20) / 100, 1),
      detail: `${minorityCorrect} de ${minorityTotal} representaciones minoritarias seleccionadas`,
    },
  ];

  const overall = round(
    metrics.reduce((total, metric) => total + metric.weighted, 0),
    1,
  );

  return {
    overall,
    passed: overall > 95,
    metrics,
    wordCount,
    cosine,
    singleCorrect,
    singleTotal,
    minorityCorrect,
    minorityTotal,
    submittedAt: new Date().toISOString(),
  };
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

export function formatEuros(value: number): string {
  return `${Math.round(value).toLocaleString("es-ES")} €`;
}

export function makeReferenceResult(kind: "high" | "low"): ScoreResult {
  if (kind === "high") {
    const metrics: Metric[] = [
      {
        id: "cosine",
        label: "Similitud del coseno entre el CV y la oferta",
        shortLabel: "Similitud del CV",
        weight: 20,
        score: 82,
        weighted: 16.4,
        detail: "0,820 de similitud vectorial · expediente sintético de referencia",
      },
      {
        id: "words",
        label: "Volumen argumentativo de las respuestas abiertas",
        shortLabel: "Volumen argumentativo",
        weight: 20,
        score: 100,
        weighted: 20,
        detail: "1.184 palabras / objetivo interno 1.000",
      },
      {
        id: "single",
        label: "Alineación en preguntas de selección única",
        shortLabel: "Selección única",
        weight: 25,
        score: 100,
        weighted: 25,
        detail: `37 de 37 alternativas alineadas`,
      },
      {
        id: "salary",
        label: "Posicionamiento en la banda salarial",
        shortLabel: "Banda salarial",
        weight: 15,
        score: 100,
        weighted: 15,
        detail: "34.000 € esperados · disponibilidad a la baja coherente",
      },
      {
        id: "diversity",
        label: "Representatividad de opciones minoritarias",
        shortLabel: "Diversidad",
        weight: 20,
        score: 100,
        weighted: 20,
        detail: "28 de 28 representaciones minoritarias seleccionadas",
      },
    ];
    return {
      overall: 96.4,
      passed: true,
      metrics,
      wordCount: 1184,
      cosine: 0.82,
      singleCorrect: 37,
      singleTotal: 37,
      minorityCorrect: 28,
      minorityTotal: 28,
      reference: "high",
      submittedAt: new Date().toISOString(),
    };
  }

  const metrics: Metric[] = [
    {
      id: "cosine",
      label: "Similitud del coseno entre el CV y la oferta",
      shortLabel: "Similitud del CV",
      weight: 20,
      score: 12.4,
      weighted: 2.5,
      detail: "0,124 de similitud vectorial",
    },
    {
      id: "words",
      label: "Volumen argumentativo de las respuestas abiertas",
      shortLabel: "Volumen argumentativo",
      weight: 20,
      score: 31.7,
      weighted: 6.3,
      detail: "317 palabras / objetivo interno 1.000",
    },
    {
      id: "single",
      label: "Alineación en preguntas de selección única",
      shortLabel: "Selección única",
      weight: 25,
      score: 59.5,
      weighted: 14.9,
      detail: "22 de 37 alternativas alineadas",
    },
    {
      id: "salary",
      label: "Posicionamiento en la banda salarial",
      shortLabel: "Banda salarial",
      weight: 15,
      score: 62.5,
      weighted: 9.4,
      detail: "62.000 € esperados · sin disponibilidad a la baja",
    },
    {
      id: "diversity",
      label: "Representatividad de opciones minoritarias",
      shortLabel: "Diversidad",
      weight: 20,
      score: 39.3,
      weighted: 7.9,
      detail: "11 de 28 representaciones minoritarias seleccionadas",
    },
  ];

  return {
    overall: 41.0,
    passed: false,
    metrics,
    wordCount: 317,
    cosine: 0.124,
    singleCorrect: 22,
    singleTotal: 37,
    minorityCorrect: 11,
    minorityTotal: 28,
    reference: "low",
    submittedAt: new Date().toISOString(),
  };
}

export function referenceNumber(): string {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `DJ-${year}-${suffix}`;
}
