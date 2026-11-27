import type { EffectInput } from "./data";

/* ============================================================
   MÉTRICA OCULTA · "el registro"
   Nadie la ve. Nada en la interfaz la muestra. Sube con cada
   atajo turbio (cenas, retiros, NDAs, fondos sin preguntas,
   ocultar brechas) y baja con cada decisión limpia y cara.
   En ENE 2026 se abren los archivos y se tira un dado contra ella.
   ============================================================ */

export const START_SHADOW = 8;

export const clampShadow = (n: number) => Math.max(0, Math.min(100, n));

/** [izquierda, derecha] */
const SHADOW: Record<string, [number, number]> = {
  // — personajes clásicos —
  "vc-tiburon": [3, 0],
  "periodista": [4, -2],
  "hacker": [-2, 4],
  "influencer-crypto": [10, -2],
  "angel": [5, 0],
  "abogado": [-2, 3],
  "guru-linkedin": [2, 0],
  "consultor": [2, 0],
  // — era IA / mundo —
  "apt-weights": [-8, 18],
  "defense-contractor": [14, -5],
  "sanctions-compliance": [-8, 16],
  "sovereign-fund": [22, -4],
  "unfiltered-model": [12, -3],
  "user-psychosis": [-3, 6],
  "ai-consultant-plague": [5, -1],
  "deepfake-ceo": [-1, 0],
  "roe-jogan": [4, 0],
  "mark-zukaritas": [8, 0],
  "elon-tusk": [8, -2],
  "dario-amodeo": [-4, 6],
  // — anomalías —
  "anomaly-neuralink": [10, -2],
  "anomaly-prophecy": [3, 0],
  "anomaly-agi-whistleblower": [-6, 6],
  "anomaly-cult": [10, -3],
  "anomaly-dream-ads": [16, -4],
  "anomaly-implant-hack": [-3, 8],
  "anomaly-quiet-hour": [-4, 10],
  "anomaly-buyer-weights": [30, -8],
  // — era del poder (2024-2026) —
  "palm-beach-dinner": [14, -3],
  "k-street-lobbyist": [16, -3],
  "island-retreat": [20, -4],
  "fixer-nda": [14, -5],
  "doge-engineer": [12, -6],
  "elon-doge": [14, -4],
  "lp-in-files": [12, -10],
  // — eventos mundiales —
  "event:wrapper": [4, 0],
  "event:svb": [-1, 3],
  "event:drones": [16, -6],
  "event:iran": [20, -3],
  "event:grok-christmas": [-6, 14],
  "event:trump-2024": [14, -4],
  "event:doge": [16, -6],
  "event:epstein-files": [-22, 0],
  "event:google-final": [-1, 4],
};

/** escala global: ajustada por simulación para que jugar al azar dé ~35-40% de aparecer */
const SHADOW_SCALE = 0.5;

export function shadowDelta(id: string, side: "left" | "right"): number {
  const row = SHADOW[id];
  if (!row) return 0;
  return (side === "left" ? row[0] : row[1]) * SHADOW_SCALE;
}

/** Probabilidad de aparecer en los archivos, a partir del registro */
export function filesChance(shadow: number): number {
  return Math.max(0.03, Math.min(0.9, shadow / 100));
}

export type FilesVerdict = "clear" | "named";

export const FILES_NAMED_EFFECT: EffectInput = { vcs: -26, ventas: -16, cultura: -18, soul: -12, cash: -30 };
export const FILES_CLEAR_EFFECT: EffectInput = { vcs: 4, cultura: 3, soul: 4 };

export const FILES_VERDICT: Record<FilesVerdict, { title: string; text: string }> = {
  clear: {
    title: "CTRL+F: 0 RESULTADOS",
    text: "Tu nombre no aparece. Ni en los correos, ni en las agendas, ni en una nota al pie. Tu abogado exhala por primera vez en tres días. Dos de tus LPs y un ex-mentor sí salen, y te llaman llorando. Decides no contestar.",
  },
  named: {
    title: "TU NOMBRE APARECE",
    text: "Documento 4.317, página 212: un correo de 2019 de un intermediario con la frase «el founder de Lumio podría ser útil». No hay delito, ni detalle, ni contexto… y no hace falta. Es una captura. Tus clientes, tus VCs y tu equipo ya la han hecho.",
  },
};
