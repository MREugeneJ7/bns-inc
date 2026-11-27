import {
  aggregateAudience,
  fmtNum,
  fmtPct,
  fmtRate,
  type AudienceReport,
} from "./aggregate";
import { centroidSim, clusterByCosine, simMatrix } from "./cosine";
import { topTerms } from "./tfidf";
import { groupContentKey, isPostTextUsable } from "./provenance";
import type { GeneratedTheme } from "./aiTasks";
import type { Post } from "./types";

export type ThemeLabelSource = "provisional" | "ai";

export interface ThemeLocal {
  members: number[];
  /** Clave estable por IDs y contenido, nunca por posiciones del array. */
  key: string;
  name: string;
  emoji: string;
  keywords: string[];
  hashtags: string[];
  whyClustered: string;
  avgSim: number;
  centroidSims: number[];
  audience: AudienceReport;
  labelSource: ThemeLabelSource;
  labelEngine?: string;
}

export interface CrossInsight {
  tag: string;
  title: string;
  detail: string;
  categoria?: string;
}

export interface PostIdea {
  tema: string;
  hook: string;
  porQueFunciona: string;
}

export interface LocalAnalysis {
  method: "e5";
  includedIndices: number[];
  excludedPostIds: string[];
  sims: number[][];
  themes: ThemeLocal[];
  report: AudienceReport;
  crossInsights: CrossInsight[];
  narrative: string[];
  funnelNotes: string[];
  recommendations: string[];
  postIdeas: PostIdea[];
}

const cap = (s: string) =>
  s.length <= 3 ? s.toUpperCase() : s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Etiqueta provisional 100 % derivada de TUS textos: "Tema N" + palabras reales
 * más frecuentes del grupo. Solo se sustituye si una LLM devuelve un nombre válido.
 */
function buildProvisionalTheme(
  memberTexts: string[],
  members: number[],
  avgSim: number,
  index: number,
): Pick<
  ThemeLocal,
  "name" | "emoji" | "keywords" | "hashtags" | "whyClustered"
> {
  const joined = memberTexts.join(" ");
  const keywords = topTerms(joined, 4);
  const name = `Tema ${index + 1}${keywords.length ? ` · ${keywords.slice(0, 2).map(cap).join(" · ")}` : ""}`;
  const hashtags = keywords
    .slice(0, 3)
    .map(
      (k) => "#" + k.replace(/\s+/g, "").replace(/^./, (c) => c.toUpperCase()),
    );
  const whyClustered =
    members.length > 1
      ? `${members.length} posts con similitud semántica media del coseno ${avgSim.toFixed(2)}. Palabras destacadas: ${keywords.slice(0, 3).join(", ") || "ninguna"}. Nombre provisional, sin LLM.`
      : `Post diferenciado por embeddings semánticos. Palabras destacadas: ${keywords.slice(0, 3).join(", ") || "ninguna"}. Nombre provisional, sin LLM.`;
  return { name, emoji: "◍", keywords, hashtags, whyClustered };
}

function engagementOf(report: AudienceReport): number {
  return report.totals.engagementRate ?? 0;
}

function listTop(values: { valor: string; pct: number }[], n: number): string {
  return values
    .slice(0, n)
    .map((v) => `${v.valor} (${fmtPct(v.pct)})`)
    .join(", ");
}

function buildCrossInsights(report: AudienceReport): CrossInsight[] {
  const out: CrossInsight[] = [];
  for (const cat of report.categories) {
    if (!cat.values.length) continue;
    const top = cat.values[0];
    const second = cat.values[1];
    out.push({
      tag: `${cat.icon} ${cat.shortLabel}`,
      title: `${top.valor} (${fmtPct(top.pct)})${second ? ` · ${second.valor} (${fmtPct(second.pct)})` : ""}`,
      detail:
        `Top de ${cat.shortLabel.toLowerCase()} ponderado por alcance: ${listTop(cat.values, 3)}.` +
        (top.estPeople > 0
          ? ` Alcance estimado del segmento: ~${fmtNum(top.estPeople)} (puede repetir personas entre posts).`
          : ""),
      categoria: cat.categoria,
    });
    if (out.length >= 4) break;
  }
  return out;
}

function buildNarrative(
  report: AudienceReport,
  themes: ThemeLocal[],
): string[] {
  const { totals } = report;
  if (totals.posts === 0) return ["Aún no hay publicaciones para analizar."];
  const out: string[] = [];

  const base =
    totals.alcance > 0
      ? `${fmtNum(totals.alcance)} de alcance sumado, no deduplicado entre posts`
      : totals.impresiones > 0
        ? `${fmtNum(totals.impresiones)} impresiones`
        : `${totals.posts} ${totals.posts > 1 ? "publicaciones" : "publicación"}`;
  const perCat = report.categories
    .filter((c) => c.values.length)
    .map((c) => `${c.shortLabel}: ${listTop(c.values, 2)}`)
    .join(" · ");
  out.push(
    `Tu audiencia agregada (${totals.posts} ${totals.posts > 1 ? "publicaciones" : "publicación"}, ${base}, ponderada por alcance): ${perCat || "sin desglose demográfico en los XLS"}.`,
  );

  if (totals.impresiones > 0) {
    out.push(
      `Totales: ${fmtNum(totals.impresiones)} impresiones, ${fmtNum(totals.reacciones)} reacciones, ` +
        `${fmtNum(totals.comentarios)} comentarios, ${fmtNum(totals.compartidos)} compartidos, ${fmtNum(totals.guardados)} guardados, ` +
        `${fmtNum(totals.vistasPerfil)} vistas de perfil y ${fmtNum(totals.seguidores)} seguidores nuevos. ` +
        `Tasa de interacción: ${fmtRate(totals.engagementRate)} · conversión perfil→seguidor: ${fmtRate(totals.profileToFollowRate)}.`,
    );
  }

  if (themes.length > 0 && totals.impresiones > 0) {
    const byEng = [...themes].sort(
      (a, b) => engagementOf(b.audience) - engagementOf(a.audience),
    );
    const byReach = [...themes].sort(
      (a, b) => b.audience.totals.alcance - a.audience.totals.alcance,
    );
    const bestEng = byEng[0];
    const bestReach = byReach[0];
    out.push(
      `Cruce temas × audiencia: «${bestReach.name}» concentra el mayor alcance (${fmtNum(bestReach.audience.totals.alcance)})` +
        (bestEng && bestEng !== bestReach
          ? `, mientras que «${bestEng.name}» logra la mayor tasa de interacción (${fmtRate(engagementOf(bestEng.audience))}).`
          : "."),
    );
  }
  return out;
}

function buildFunnelNotes(report: AudienceReport): string[] {
  const t = report.totals;
  if (t.impresiones === 0 && t.alcance === 0) return [];
  const notes: string[] = [];
  if (t.alcance > 0 && t.impresiones > 0) {
    notes.push(
      `Suma de alcance: ${fmtNum(t.alcance)}; impresiones: ${fmtNum(t.impresiones)}.` +
        " Una persona puede aparecer en varios posts: no es audiencia única global.",
    );
  }
  if (t.impresiones > 0) {
    notes.push(
      `Interacción: ${fmtNum(t.interacciones)} interacciones (${fmtRate(t.engagementRate)} sobre impresiones) · ` +
        `${fmtNum(t.comentarios)} comentarios, ${fmtNum(t.compartidos)} compartidos y ${fmtNum(t.guardados)} guardados.`,
    );
  }
  if (t.vistasPerfil > 0 || t.seguidores > 0) {
    notes.push(
      `Perfil: ${fmtNum(t.vistasPerfil)} visitas y ${fmtNum(t.seguidores)} seguidores nuevos (ratio agregado ${fmtRate(t.profileToFollowRate)}; no demuestra conversión individual).`,
    );
  }
  return notes;
}

function buildRecommendations(
  report: AudienceReport,
  themes: ThemeLocal[],
): string[] {
  const rec: string[] = [];
  const cats = new Map(report.categories.map((c) => [c.categoria, c]));

  const topOf = (cat: string) => cats.get(cat)?.values[0];
  const cTop = topOf("Cargo") ?? topOf("Sector") ?? null;
  if (cTop && cTop.pct >= 5) {
    rec.push(
      `Escribe para tu segmento líder (${cTop.valor}, ${fmtPct(cTop.pct)} del alcance): usa sus términos, ejemplos y casos reales en el gancho y en la primera línea.`,
    );
  }

  const geo = cats.get("Ubicación");
  if (geo && geo.values.length >= 2) {
    rec.push(
      `Tu alcance se reparte entre ${listTop(geo.values, 3)}: publica en la franja que solape esas zonas y menciona referencias locales para subir guardados y comentarios.`,
    );
  }

  if (themes.length > 1) {
    const best = [...themes].sort(
      (a, b) => engagementOf(b.audience) - engagementOf(a.audience),
    )[0];
    rec.push(
      `Duplica el formato de «${best.name}» (${best.members.length} ${best.members.length > 1 ? "posts" : "post"}, interacción ${fmtRate(engagementOf(best.audience))}): reutiliza su estructura en el resto de temas y mide si la tasa sube.`,
    );
  }

  const t = report.totals;
  if (t.guardados === 0 && t.impresiones > 0) {
    rec.push(
      "Ningún post registra guardados: añade un recurso reutilizable (checklist, plantilla, lista de pasos) para convertir alcance en guardados.",
    );
  } else if (
    t.comentarios + t.compartidos < t.reacciones * 0.1 &&
    t.reacciones > 0
  ) {
    rec.push(
      "Muchas reacciones pero poco comentario/compartido: cierra cada post con una pregunta concreta que se responda en una línea.",
    );
  }

  if (
    t.vistasPerfil > 0 &&
    (t.profileToFollowRate ?? 0) < 0.05 &&
    t.seguidores >= 0
  ) {
    rec.push(
      `Tienes ${fmtNum(t.vistasPerfil)} vistas de perfil pero solo ${fmtNum(t.seguidores)} seguidores nuevos (${fmtRate(t.profileToFollowRate)}): refuerza tu titular y la primera línea de la bio para convertir esas visitas.`,
    );
  }

  return rec.slice(0, 4);
}

function buildPostIdeas(
  report: AudienceReport,
  themes: ThemeLocal[],
): PostIdea[] {
  const ideas: PostIdea[] = [];
  const sorted = [...themes].sort(
    (a, b) => engagementOf(b.audience) - engagementOf(a.audience),
  );
  for (const th of sorted.slice(0, 2)) {
    const kw = th.keywords.slice(0, 3).join(", ") || "tu tema";
    ideas.push({
      tema: th.name,
      hook: `«Lo que aprendí publicando sobre ${kw} (con datos de alcance e interacción)»`,
      porQueFunciona: `Parte de tu tema con mejor tracción (${th.members.length} ${th.members.length > 1 ? "posts" : "post"}, interacción ${fmtRate(engagementOf(th.audience))}) y lo convierte en aprendizaje reutilizable.`,
    });
  }
  const weakestCat = [...report.categories].sort(
    (a, b) => (a.values[0]?.pct ?? 0) - (b.values[0]?.pct ?? 0),
  )[0];
  if (weakestCat && ideas.length < 3) {
    ideas.push({
      tema: `Puente hacia ${weakestCat.shortLabel}`,
      hook: `«Lo que tu ${weakestCat.shortLabel.toLowerCase()} dice de tu contenido (y cómo usarlo en tu próximo post)»`,
      porQueFunciona: `Ataca tu dimensión menos concentrada (${weakestCat.values[0] ? `${weakestCat.values[0].valor} ${fmtPct(weakestCat.values[0].pct)}` : "sin datos"}) para diversificar audiencia.`,
    });
  }
  return ideas.slice(0, 3);
}

/** Responde con TUS datos agregados, sin historias prefijadas: solo describe lo que hay. */
export function answerAudienceQuestion(
  q: string,
  analysis: LocalAnalysis,
): string {
  const s = q.toLowerCase();
  const { report, themes } = analysis;
  const t = report.totals;

  const catHit = report.categories.find((c) => {
    const n = c.categoria.toLowerCase();
    const short = c.shortLabel.toLowerCase();
    return (
      s.includes(n) ||
      s.includes(short) ||
      s
        .split(/\s+/)
        .some((w) => w.length > 4 && (n.includes(w) || short.includes(w)))
    );
  });
  if (catHit) {
    return (
      `${catHit.shortLabel} ponderado por alcance: ` +
      catHit.values
        .slice(0, 6)
        .map(
          (v) =>
            `${v.valor}: ${fmtPct(v.pct)} (~${fmtNum(v.estPeople)} pers., en ${v.posts} ${v.posts > 1 ? "posts" : "post"})`,
        )
        .join(" · ") +
      "."
    );
  }

  if (
    /tema|coseno|cluster|grupo|funciona|mejor|rinde|seguidor|engagement|interacci/.test(
      s,
    )
  ) {
    const list = themes
      .map(
        (th) =>
          `• ${th.emoji} ${th.name} (${th.members.length} ${th.members.length > 1 ? "posts" : "post"}, coseno ${th.avgSim.toFixed(2)}): ` +
          `${fmtNum(th.audience.totals.alcance)} de alcance, ${fmtRate(th.audience.totals.engagementRate)} de interacción, ${fmtNum(th.audience.totals.seguidores)} seguidores`,
      )
      .join("\n");
    return `Rendimiento por grupo semántico (similitud del coseno sobre tus textos):\n${list}`;
  }

  if (/publicar|idea|gancho|post|contenido|qu[eé] escribo|pr[oó]ximo/.test(s)) {
    return analysis.postIdeas
      .map((p, i) => `${i + 1}. [${p.tema}] ${p.hook} — ${p.porQueFunciona}`)
      .join("\n");
  }

  if (/empresa|compa/.test(s)) {
    const emp = report.categories.find((c) => c.categoria === "Empresa");
    if (emp?.values.length) {
      return `Empresas que aparecen en tus XLS: ${emp.values.map((v) => `${v.valor} (${fmtPct(v.pct)})`).join(", ")}.`;
    }
  }

  return (
    `Resumen (${t.posts} ${t.posts > 1 ? "posts" : "post"} · ${fmtNum(t.alcance || t.impresiones)} de alcance/impresiones · ${fmtRate(t.engagementRate)} de interacción): ` +
    `${analysis.narrative.join(" ")}`
  );
}

/** El coseno usa exclusivamente embeddings E5; sin vectores no se inventan grupos. */
export function buildLocalAnalysis(
  posts: Post[],
  threshold: number,
  embeddings?: number[][],
): LocalAnalysis {
  const report = aggregateAudience(posts);
  const includedIndices = posts.flatMap((p, i) =>
    isPostTextUsable(p) ? [i] : [],
  );
  const excludedPostIds = posts
    .filter((p) => !isPostTextUsable(p))
    .map((p) => p.id);
  const embs = embeddings?.length === includedIndices.length &&
    embeddings.every((v) => v.length > 0 && v.every(Number.isFinite))
    ? embeddings : [];
  const subsetSims = simMatrix(embs);
  const sims = posts.map(() => posts.map(() => 0));
  if (embs.length) includedIndices.forEach((a, i) =>
    includedIndices.forEach((b, j) => {
      sims[a][b] = subsetSims[i][j];
    }),
  );
  const groups = clusterByCosine(embs, threshold).map((group) =>
    group.map((i) => includedIndices[i]),
  );

  const themes: ThemeLocal[] = groups.map((members, i) => {
    const memberTexts = members.map((m) => posts[m].body);
    const cs = centroidSim(sims, members);
    const meta = buildProvisionalTheme(memberTexts, members, cs.avg, i);
    return {
      members,
      key: groupContentKey(posts, members),
      name: meta.name,
      emoji: meta.emoji,
      keywords: meta.keywords,
      hashtags: meta.hashtags,
      whyClustered: meta.whyClustered,
      avgSim: cs.avg,
      centroidSims: cs.per,
      audience: aggregateAudience(members.map((m) => posts[m])),
      labelSource: "provisional" as const,
    };
  });

  const crossInsights = buildCrossInsights(report);
  const narrative = buildNarrative(report, themes);
  const funnelNotes = buildFunnelNotes(report);
  const recommendations = buildRecommendations(report, themes);
  const postIdeas = buildPostIdeas(report, themes);

  return {
    method: "e5",
    includedIndices,
    excludedPostIds,
    sims,
    themes,
    report,
    crossInsights,
    narrative,
    funnelNotes,
    recommendations,
    postIdeas,
  };
}

export function withGeneratedThemeLabels(
  local: LocalAnalysis,
  labels: Record<string, GeneratedTheme>,
): LocalAnalysis {
  const themes = local.themes.map((theme) => {
    const label = labels[theme.key];
    if (!label) return theme;
    return {
      ...theme,
      name: label.name,
      labelSource: "ai" as const,
      labelEngine: `${label.engine} · ${label.model}`,
      whyClustered: `${theme.members.length} posts. Similitud semántica media ${theme.avgSim.toFixed(2)}; nombre generado por la LLM a partir de sus textos.`,
    };
  });
  return {
    ...local,
    themes,
    narrative: buildNarrative(local.report, themes),
    recommendations: buildRecommendations(local.report, themes),
    postIdeas: buildPostIdeas(local.report, themes),
  };
}
