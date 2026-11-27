/**
 * Utilidades léxicas para sugerir palabras visibles en nombres provisionales.
 * Solo se usan para mostrar términos en etiquetas provisionales.
 * La similitud se calcula aparte con embeddings neuronales en embed.ts.
 */

const STOP = new Set(
  (
    "de la el los las un una unos unas y o u e a en con por para sin sobre entre desde hasta hacia como que se su sus " +
    "mi mis tu tus te le les lo al del es son ser fue fueron era eran soy eres somos está estan están esta este esto " +
    "estos estas ese esa eso esos esas aquí allí ahí muy mas más ya no si sí pero porque cuando donde dónde quien " +
    "quién cual cuál tan poco mucho bien mal todo toda todos todas cada otro otra otros otras mismo misma también " +
    "tampoco hay hace ante bajo tras me nos os ha han he hemos han sido serme estar tener tiene tienen tuve " +
    "qué cómo cuál cuáles dónde quién cuyo cuya tal vez quizás quizá algo nada nadie alguien uno " +
    "the and for with you your this that from are was were been have has had not but can will just about into " +
    "contra mediante versus vía via etc " +
    "llevando llevar usar usando viene venir saber hacer puede pueden decir poner pusimos puse " +
    "después despues ahora hoy solo sólo mejor peor forma manera parte caso veces gente personas cosa cosas tipo " +
    "ejemplo paso punto año años día días vez tiempo real nunca siempre menos luego entonces " +
    "quiere quieren debería debemos ver visto dar dando dice dicen dijo pensar pensando creo crees " +
    "antes aunque además ademas mientras sino recién recien"
  )
    .split(/\s+/)
    .filter(Boolean),
);
const SHORT_OK = new Set([
  "ia",
  "ux",
  "ui",
  "cv",
  "ml",
  "bi",
  "pr",
  "qa",
  "ti",
  "it",
]);

/** Lematización ligera en español para agrupar singular/plural y conjugaciones. */
export function stemEs(word: string): string {
  let w = word
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (w.length <= 3) return w;
  const suffixes = [
    "amientos",
    "imiento",
    "aciones",
    "uciones",
    "adores",
    "adoras",
    "amente",
    "idades",
    "acion",
    "ucion",
    "adora",
    "ador",
    "ando",
    "iendo",
    "aron",
    "ieron",
    "aban",
    "ian",
    "idad",
    "ivas",
    "ivos",
    "iva",
    "ivo",
    "ales",
    "ores",
    "oras",
    "es",
    "s",
  ];
  for (const suf of suffixes) {
    if (w.length - suf.length >= 4 && w.endsWith(suf)) {
      w = w.slice(0, -suf.length);
      break;
    }
  }
  return w;
}

export function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[a-záéíóúüñ]{2,}/gi) ?? []).filter(
    (t) => (t.length >= 3 || SHORT_OK.has(t)) && !STOP.has(t),
  );
}

/** Términos más representativos de un texto, agrupados por raíz. Sin etiquetas fijas. */
export function topTerms(text: string, k = 3): string[] {
  const byStem = new Map<string, { count: number; surface: string }>();
  for (const raw of tokens(text)) {
    const st = stemEs(raw);
    const cur = byStem.get(st);
    if (cur) {
      cur.count += 1;
      if (raw.length < cur.surface.length) cur.surface = raw;
    } else {
      byStem.set(st, { count: 1, surface: raw });
    }
  }
  return [...byStem.entries()]
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
    .slice(0, k)
    .map(([, v]) => v.surface);
}

