import { sumMetric, type Post } from './types';

export interface AudienceValue {
  valor: string;
  pct: number;
  estPeople: number;
  posts: number;
  peakPostTitle?: string;
  peakPct?: number;
}

export interface MacroBucket {
  label: string;
  pct: number;
  estPeople: number;
  hint: string;
}

export interface AudienceCategory {
  categoria: string;
  shortLabel: string;
  icon: string;
  values: AudienceValue[];
  buckets: MacroBucket[];
  postCount: number;
  coveragePct: number;
}

export interface AudienceTotals {
  posts: number;
  weight: number;
  impresiones: number;
  alcance: number;
  reacciones: number;
  comentarios: number;
  compartidos: number;
  guardados: number;
  seguidores: number;
  vistasPerfil: number;
  interacciones: number;
  engagementRate: number | null;
  reactionRate: number | null;
  commentShareRate: number | null;
  saveRate: number | null;
  followerRate: number | null;
  profileRate: number | null;
  profileToFollowRate: number | null;
  impressionsPerReach: number | null;
}

export type WeightSource = 'alcance' | 'impresiones' | 'uniforme';

export interface AudienceReport {
  totals: AudienceTotals;
  categories: AudienceCategory[];
  weightUsed: WeightSource;
}

const CATEGORY_META: Record<string, { shortLabel: string; icon: string }> = {
  Cargo: { shortLabel: 'Empleo / Cargo', icon: '💼' },
  Ubicación: { shortLabel: 'Zona / Ciudad', icon: '📍' },
  'Nivel de responsabilidad': { shortLabel: 'Seniority', icon: '🎚' },
  Sector: { shortLabel: 'Sector', icon: '🏭' },
  'Tamaño de la empresa': { shortLabel: 'Tamaño emp.', icon: '🏢' },
  Empresa: { shortLabel: 'Empresas', icon: '🏛' },
};

const CATEGORY_ORDER = [
  'Cargo',
  'Ubicación',
  'Nivel de responsabilidad',
  'Sector',
  'Tamaño de la empresa',
  'Empresa',
];

export const fmtNum = (n: number): string => Math.round(n).toLocaleString('es-ES');

export const fmtRate = (r: number | null): string =>
  r === null
    ? '—'
    : `${(r * 100).toLocaleString('es-ES', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} %`;

export const fmtPct = (p: number): string =>
  p < 1 ? '< 1 %' : `${p.toLocaleString('es-ES', { maximumFractionDigits: 1 })} %`;

function weightOf(p: Post): { w: number; src: WeightSource } {
  const alcance = sumMetric(p.metrics, ['alcance']);
  if (alcance > 0) return { w: alcance, src: 'alcance' };
  const impresiones = sumMetric(p.metrics, ['impresiones']);
  if (impresiones > 0) return { w: impresiones, src: 'impresiones' };
  return { w: 1, src: 'uniforme' };
}

const rate = (n: number, d: number): number | null => (d > 0 ? n / d : null);

function buildMacroBuckets(categoria: string, values: AudienceValue[], basePeople: number): MacroBucket[] {
  const match = (re: RegExp) => values.filter((v) => re.test(v.valor));
  const sumWhere = (re: RegExp) => match(re).reduce((s, v) => s + v.pct, 0);
  // El hint enumera los valores REALES que componen el macro-segmento, no ejemplos fijos.
  const hintOf = (re: RegExp) =>
    match(re)
      .slice(0, 3)
      .map((v) => v.valor)
      .join(', ') || '—';

  const mk = (label: string, pct: number, hint: string): MacroBucket => ({
    label,
    pct,
    estPeople: Math.round((pct / 100) * basePeople),
    hint,
  });

  if (categoria === 'Cargo') {
    const RE_DEV = /ingeniero de software|programador|desarrollador|full\s*stack|back-?end|front-?end|web|java|junior|tech lead/i;
    const RE_DATA = /datos|data|analista|cient[ií]fico/i;
    const RE_LEAD = /fundador|tech lead|director|cto|gerente|manager| arquitect/i;
    return [
      mk('Ingeniería & Desarrollo', sumWhere(RE_DEV), hintOf(RE_DEV)),
      mk('Datos & Analítica', sumWhere(RE_DATA), hintOf(RE_DATA)),
      mk('Liderazgo técnico / Founder', sumWhere(RE_LEAD), hintOf(RE_LEAD)),
    ].filter((b) => b.pct > 0);
  }

  if (categoria === 'Nivel de responsabilidad') {
    const RE_JR = /sin experiencia|formaci[oó]n|becario|pr[aá]cticas/i;
    const RE_MID = /con experiencia/i;
    const RE_DEC = /gerente|propietario|directivo|director|vicepresidente|socio|cxo/i;
    return [
      mk('Entrada / Sin exp.', sumWhere(RE_JR), hintOf(RE_JR)),
      mk('Profesionales con exp.', sumWhere(RE_MID), hintOf(RE_MID)),
      mk('Decisores & Mando', sumWhere(RE_DEC), hintOf(RE_DEC)),
    ].filter((b) => b.pct > 0);
  }

  if (categoria === 'Ubicación') {
    // Regiones derivadas de TUS valores: solo aparecen las que existen en tus datos.
    const RE_SUR = /buenos aires|santiago|c[oó]rdoba|montevideo|rosario|argentina|chile|uruguay/i;
    const RE_AND = /bogot[aá]|medell[ií]n|lima|m[eé]xico|monterrey|guadalajara|quito|colombia|per[uú]/i;
    const RE_ESP = /madrid|barcelona|valencia|sevilla|bilbao|m[aá]laga|espa[nñ]a/i;
    const rest = values.filter((v) => !RE_SUR.test(v.valor) && !RE_AND.test(v.valor) && !RE_ESP.test(v.valor));
    const restPct = rest.reduce((s, v) => s + v.pct, 0);
    const out = [
      mk('Cono Sur (AR · CL · UY)', sumWhere(RE_SUR), hintOf(RE_SUR)),
      mk('Andina & México (CO · MX · PE)', sumWhere(RE_AND), hintOf(RE_AND)),
      mk('España', sumWhere(RE_ESP), hintOf(RE_ESP)),
    ].filter((b) => b.pct > 0);
    if (restPct > 0) {
      out.push(mk('Otras zonas', restPct, rest.slice(0, 3).map((v) => v.valor).join(', ')));
    }
    return out;
  }

  if (categoria === 'Tamaño de la empresa') {
    const RE_S = /\b(2 - 10|11 - 50|1 - 10)\b/i;
    const RE_M = /\b(51 - 200|201 - 500|501 - 1\.000)\b/i;
    const RE_L = /\b(1\.001|5\.001|10\.001|m[aá]s de 10)/i;
    return [
      mk('Equipos pequeños (2–50)', sumWhere(RE_S), hintOf(RE_S)),
      mk('Empresas medias (51–1.000)', sumWhere(RE_M), hintOf(RE_M)),
      mk('Gran empresa (> 1.000)', sumWhere(RE_L), hintOf(RE_L)),
    ].filter((b) => b.pct > 0);
  }

  if (categoria === 'Sector') {
    const RE_PROD = /desarrollo de software$|tecnolog[ií]a, informaci[oó]n e internet/i;
    const RE_CONS = /consultor[ií]a|servicios.*ti|sistemas de ti|gesti[oó]n estrat[eé]gica/i;
    const RE_FIN = /banca|financiero|educaci[oó]n/i;
    const rest = values.filter((v) => !RE_PROD.test(v.valor) && !RE_CONS.test(v.valor) && !RE_FIN.test(v.valor));
    const restPct = rest.reduce((s, v) => s + v.pct, 0);
    const out = [
      mk('Producto & Software', sumWhere(RE_PROD), hintOf(RE_PROD)),
      mk('Consultoría & Servicios TI', sumWhere(RE_CONS), hintOf(RE_CONS)),
      mk('Banca, Finanzas & Educación', sumWhere(RE_FIN), hintOf(RE_FIN)),
    ].filter((b) => b.pct > 0);
    if (restPct > 0) {
      out.push(mk('Otros sectores', restPct, rest.slice(0, 3).map((v) => v.valor).join(', ')));
    }
    return out;
  }

  // Categorías desconocidas (otros idiomas/mercados): top 3 como macro-lectura genérica.
  if (values.length > 3) {
    const top3 = values.slice(0, 3);
    return [
      {
        label: `Top 3 de ${categoria}`,
        pct: top3.reduce((s, v) => s + v.pct, 0),
        estPeople: Math.round((top3.reduce((s, v) => s + v.pct, 0) / 100) * basePeople),
        hint: top3.map((v) => v.valor).join(', '),
      },
    ];
  }

  return [];
}

/**
 * Agrega la audiencia de varias publicaciones ponderando por alcance (o impresiones).
 * Calcula además personas estimadas alcanzadas por segmento, post pico y macro-agrupaciones.
 */
export function aggregateAudience(posts: Post[]): AudienceReport {
  const weights = posts.map(weightOf);
  const srcCount: Record<WeightSource, number> = { alcance: 0, impresiones: 0, uniforme: 0 };

  const totals: AudienceTotals = {
    posts: posts.length,
    weight: 0,
    impresiones: 0,
    alcance: 0,
    reacciones: 0,
    comentarios: 0,
    compartidos: 0,
    guardados: 0,
    seguidores: 0,
    vistasPerfil: 0,
    interacciones: 0,
    engagementRate: null,
    reactionRate: null,
    commentShareRate: null,
    saveRate: null,
    followerRate: null,
    profileRate: null,
    profileToFollowRate: null,
    impressionsPerReach: null,
  };

  posts.forEach((p, i) => {
    totals.weight += weights[i].w;
    srcCount[weights[i].src] += 1;
    totals.impresiones += sumMetric(p.metrics, ['impresiones']);
    totals.alcance += sumMetric(p.metrics, ['alcance']);
    totals.reacciones += sumMetric(p.metrics, ['reacciones']);
    totals.comentarios += sumMetric(p.metrics, ['comentarios']);
    totals.compartidos += sumMetric(p.metrics, ['compartidos']);
    totals.guardados += sumMetric(p.metrics, ['guardados']);
    totals.seguidores += sumMetric(p.metrics, ['seguidores']);
    totals.vistasPerfil += sumMetric(p.metrics, ['vistas_perfil']);
    const directas = sumMetric(p.metrics, ['interacciones']);
    totals.interacciones +=
      directas > 0
        ? directas
        : sumMetric(p.metrics, ['reacciones']) +
          sumMetric(p.metrics, ['comentarios']) +
          sumMetric(p.metrics, ['compartidos']);
  });

  totals.engagementRate = rate(totals.interacciones, totals.impresiones);
  totals.reactionRate = rate(totals.reacciones, totals.impresiones);
  totals.commentShareRate = rate(totals.comentarios + totals.compartidos, totals.impresiones);
  totals.saveRate = rate(totals.guardados, totals.impresiones);
  totals.followerRate = rate(totals.seguidores, totals.alcance || totals.impresiones);
  totals.profileRate = rate(totals.vistasPerfil, totals.impresiones);
  totals.profileToFollowRate = rate(totals.seguidores, totals.vistasPerfil);
  totals.impressionsPerReach = rate(totals.impresiones, totals.alcance);

  const weightUsed: WeightSource =
    srcCount.alcance > 0 ? 'alcance' : srcCount.impresiones > 0 ? 'impresiones' : 'uniforme';

  const basePeople = totals.alcance || totals.impresiones || 0;

  const present = new Set<string>();
  for (const p of posts) for (const r of p.rows) present.add(r.categoria);
  const ordered = [
    ...CATEGORY_ORDER.filter((c) => present.has(c)),
    ...[...present].filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  const categories: AudienceCategory[] = ordered.map((cat) => {
    const idx = posts
      .map((p, i) => (p.rows.some((r) => r.categoria === cat) ? i : -1))
      .filter((i) => i >= 0);
    const wsum = idx.reduce((s, i) => s + weights[i].w, 0) || 1;
    const acc = new Map<
      string,
      { valor: string; wnum: number; posts: number; peakPostTitle?: string; peakPct: number }
    >();
    for (const i of idx) {
      const seen = new Set<string>();
      for (const r of posts[i].rows) {
        if (r.categoria !== cat) continue;
        const k = r.valor.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        const cur = acc.get(k) ?? {
          valor: r.valor,
          wnum: 0,
          posts: 0,
          peakPostTitle: posts[i].title,
          peakPct: r.pct,
        };
        cur.wnum += r.pct * weights[i].w;
        cur.posts += 1;
        if (r.pct > cur.peakPct) {
          cur.peakPct = r.pct;
          cur.peakPostTitle = posts[i].title;
        }
        acc.set(k, cur);
      }
    }
    const values: AudienceValue[] = [...acc.values()]
      .map((v) => {
        const pct = v.wnum / wsum;
        return {
          valor: v.valor,
          pct,
          estPeople: Math.round((pct / 100) * basePeople),
          posts: v.posts,
          peakPostTitle: v.peakPostTitle,
          peakPct: v.peakPct,
        };
      })
      .sort((a, b) => b.pct - a.pct);

    const meta = CATEGORY_META[cat] ?? { shortLabel: cat, icon: '📊' };
    const coveragePct = Math.min(100, values.reduce((s, v) => s + v.pct, 0));
    const buckets = buildMacroBuckets(cat, values, basePeople);

    return {
      categoria: cat,
      shortLabel: meta.shortLabel,
      icon: meta.icon,
      values,
      buckets,
      postCount: idx.length,
      coveragePct,
    };
  });

  return { totals, categories, weightUsed };
}

export function topValue(report: AudienceReport, categoria: string): AudienceValue | null {
  return report.categories.find((c) => c.categoria === categoria)?.values[0] ?? null;
}

const WEIGHT_LABEL: Record<WeightSource, string> = {
  alcance: 'alcance de cada post',
  impresiones: 'impresiones',
  uniforme: 'peso uniforme',
};

export const weightLabel = (w: WeightSource): string => WEIGHT_LABEL[w];
