import {
  linkedinPostId,
  parseLinkedInIdentity,
  textFingerprint,
  type LinkedInIdentity,
} from "./provenance";
import type { TextProvenance } from "./types";

export interface ImportResult {
  ok: boolean;
  text: string;
  source: string;
  url: string;
  evidence?: TextProvenance;
  error?: string;
  attempts: { name: string; ok: boolean; info: string }[];
}

export interface VerifiedExtraction {
  ok: boolean;
  text: string;
  reason: string;
  postId?: string;
  activityId?: string;
  matchedUrl?: string;
  method?: "json-ld" | "post-container";
  bridge?: "exact-id" | "dom-urn-bridge" | "canonical-slug-bridge";
  author?: string;
}

export function normalizePostUrl(raw: string): string {
  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    /* Keep original input. */
  }
  const bareUrn = value.match(/^urn:li:(activity|share|ugcPost):(\d{10,25})$/i);
  if (bareUrn) {
    return `https://www.linkedin.com/feed/update/urn:li:${bareUrn[1]}:${bareUrn[2]}/`;
  }
  try {
    const u = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!/(^|\.)linkedin\.com$/i.test(u.hostname) || u.username || u.password) return "";
    u.protocol = "https:";
    u.hostname = "www.linkedin.com";
    u.port = "";
    u.search = "";
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

type Obj = Record<string, unknown>;
const asObj = (v: unknown): Obj | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : null;
const fail = (reason: string): VerifiedExtraction => ({ ok: false, text: "", reason });

function referencedIdentities(value: unknown): LinkedInIdentity[] {
  if (typeof value === "string") {
    const parsed = parseLinkedInIdentity(value);
    if (parsed) return [parsed];
    if (/^\d{10,25}$/.test(value)) return [{ id: value, kind: "activity" }];
    return [];
  }
  if (Array.isArray(value)) return value.flatMap(referencedIdentities);
  const obj = asObj(value);
  return obj ? ["@id", "url", "value", "identifier"].flatMap((k) => referencedIdentities(obj[k])) : [];
}

function referencedIds(value: unknown): string[] {
  return [...new Set(referencedIdentities(value).map((x) => x.id))];
}

const cleanText = (text: string): string =>
  text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

function usableBody(text: string): boolean {
  return (
    text.length >= 20 &&
    /[\p{L}]/u.test(text) &&
    !/sign in to (see|view|continue)|inicia sesi[oó]n para|join linkedin to|access denied|request blocked|captcha/i.test(
      text
    ) &&
    !/(?:\.\.\.|…)\s*(?:see more|ver m[aá]s)|(?:see more|ver m[aá]s)\s*$/i.test(text)
  );
}

function elementText(element: Element): string {
  const copy = element.cloneNode(true) as Element;
  copy
    .querySelectorAll(
      'script,style,nav,footer,.comments-comments-list,.feed-shared-comments,[data-test-id*="related"],.related-posts__crosslink,article'
    )
    .forEach((e) => e.remove());
  copy.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  copy.querySelectorAll("p,li").forEach((p) => p.append("\n"));
  return cleanText(copy.textContent ?? "");
}

const BODY_SELECTORS = [
  '[data-test-id="main-feed-activity-card__commentary"]',
  ".feed-shared-update-v2__description",
  ".update-components-text",
  ".attributed-text-segment-list__content",
].join(",");

const EXCLUDED_CONTAINER_SELECTOR =
  '.related-posts__crosslink,[data-test-id*="related"],[data-test-id*="comment-thread"],[class*="related"],[class*="recommend"],.comments-comment-item,.comments-comments-list,.feed-shared-comments';

const IDENTITY_ATTRS = [
  "data-urn",
  "data-id",
  "data-entity-urn",
  "data-activity-urn",
  "data-featured-activity-urn",
  "data-attributed-urn",
  "itemid",
] as const;

function isExcludedElement(el: Element): boolean {
  return el.matches(EXCLUDED_CONTAINER_SELECTOR) || !!el.closest(EXCLUDED_CONTAINER_SELECTOR);
}

function elementIdentities(el: Element): LinkedInIdentity[] {
  return IDENTITY_ATTRS.flatMap((attr) => referencedIdentities(el.getAttribute(attr)));
}

/**
 * Checks whether two different URNs on the same main DOM element form a valid LinkedIn bridge
 * (e.g., data-activity-urn="urn:li:activity:A" paired with data-attributed-urn="urn:li:share:S").
 * Never bridges two distinct IDs of the SAME kind (e.g. two different activity IDs).
 */
function hasConflictingSameKindIds(idents: LinkedInIdentity[]): boolean {
  const byKind = new Map<string, Set<string>>();
  for (const item of idents) {
    const set = byKind.get(item.kind) ?? new Set<string>();
    set.add(item.id);
    byKind.set(item.kind, set);
  }
  for (const set of byKind.values()) {
    if (set.size > 1) return true;
  }
  return false;
}

/**
 * Identity must belong to the object/container owning the body.
 * Supports LinkedIn's real public HTML where an Excel share/ugcPost URL
 * resolves to a canonical activity URL and the main <article> links both URNs
 * via data-attributed-urn + data-activity-urn.
 */
export function extractVerifiedPost(html: string, requestedUrl: string): VerifiedExtraction {
  const expected = parseLinkedInIdentity(requestedUrl);
  if (!expected) {
    return fail("La URL no contiene un identificador completo de publicación de LinkedIn.");
  }
  if (!/<(?:html|head|body|script|article|div|main|meta|link)\b/i.test(html)) {
    return fail("El lector no devolvió HTML verificable. No se acepta texto libre ni resultados relacionados.");
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const pageUrls = [
    ...Array.from(doc.querySelectorAll('link[rel="canonical"]')).map((e) => e.getAttribute("href") ?? ""),
    ...Array.from(doc.querySelectorAll('meta[property="og:url"]')).map((e) => e.getAttribute("content") ?? ""),
  ].filter(Boolean);
  const pageIdentities = pageUrls
    .map(parseLinkedInIdentity)
    .filter((id): id is LinkedInIdentity => !!id);

  const acceptedIds = new Set<string>([expected.id]);
  let bridgedActivityId: string | undefined;
  let bridge: VerifiedExtraction["bridge"] = "exact-id";

  // 1) Exact DOM bridge on the main (non-related) post element:
  //    LinkedIn renders <article data-activity-urn="urn:li:activity:A" data-attributed-urn="urn:li:share:S">
  const attrSelector = IDENTITY_ATTRS.map((a) => `[${a}]`).join(",");
  const candidateContainers = Array.from(doc.querySelectorAll(attrSelector)).filter((el) => !isExcludedElement(el));

  for (const el of candidateContainers) {
    const idents = elementIdentities(el);
    if (!idents.some((x) => x.id === expected.id)) continue;
    if (hasConflictingSameKindIds(idents)) continue;
    for (const item of idents) {
      acceptedIds.add(item.id);
      if (item.kind === "activity" && item.id !== expected.id) {
        bridgedActivityId = item.id;
        bridge = "dom-urn-bridge";
      }
    }
  }

  // 2) Canonical share/ugcPost -> activity bridge when HTML stripped data-attributed-urn:
  //    Only allowed when requested kind is share/ugcPost, canonical kind is activity,
  //    AND both share the EXACT same author handle + multi-char slug prefix.
  if (
    expected.kind !== "activity" &&
    expected.authorHandle &&
    expected.slugPrefix &&
    expected.slugPrefix.length >= 8
  ) {
    for (const pi of pageIdentities) {
      if (
        pi.kind === "activity" &&
        pi.authorHandle === expected.authorHandle &&
        pi.slugPrefix === expected.slugPrefix
      ) {
        acceptedIds.add(pi.id);
        if (!bridgedActivityId && pi.id !== expected.id) {
          bridgedActivityId = pi.id;
          bridge = "canonical-slug-bridge";
        }
      }
    }
  }

  const pageIds = pageIdentities.map((p) => p.id);
  if (pageIds.some((id) => !acceptedIds.has(id))) {
    return fail("La página recibida corresponde a otro post (ID distinto). Se ha descartado.");
  }

  const candidates: { text: string; method: "json-ld" | "post-container"; author?: string }[] = [];

  // 3) JSON-LD matching acceptedIds (exact ID or bridged activity ID)
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const visit = (node: unknown, depth = 0) => {
        if (depth > 12) return;
        if (Array.isArray(node)) {
          node.forEach((v) => visit(v, depth + 1));
          return;
        }
        const obj = asObj(node);
        if (!obj) return;
        const types = [obj["@type"]].flat().filter((v): v is string => typeof v === "string");
        if (
          types.some((t) =>
            /(?:^|[/#])(?:SocialMediaPosting|DiscussionForumPosting|Article|BlogPosting)$/.test(t)
          )
        ) {
          const ownIds = ["url", "@id", "mainEntityOfPage", "identifier"].flatMap((k) =>
            referencedIds(obj[k])
          );
          if (ownIds.some((id) => acceptedIds.has(id)) && ownIds.every((id) => acceptedIds.has(id))) {
            // No recursion into comments, descriptions, or related posts.
            const body =
              typeof obj.articleBody === "string"
                ? obj.articleBody
                : typeof obj.text === "string"
                  ? obj.text
                  : "";
            const text = cleanText(body);
            const author = asObj(obj.author);
            if (usableBody(text)) {
              candidates.push({
                text,
                method: "json-ld",
                author: typeof author?.name === "string" ? author.name : undefined,
              });
            }
          }
        }
        if (obj["@graph"]) visit(obj["@graph"], depth + 1);
        if (obj.mainEntity) visit(obj.mainEntity, depth + 1);
      };
      visit(JSON.parse(script.textContent ?? ""));
    } catch {
      /* Invalid JSON-LD supplies no evidence. */
    }
  }

  // 4) Non-related DOM containers matching acceptedIds
  const containers = new Set<Element>();
  for (const el of candidateContainers) {
    const idents = elementIdentities(el);
    const ids = idents.map((x) => x.id);
    if (
      ids.some((id) => acceptedIds.has(id)) &&
      ids.every((id) => acceptedIds.has(id)) &&
      !hasConflictingSameKindIds(idents)
    ) {
      containers.add(el);
    }
  }

  // Canonical URL identifies only the single non-related main card when explicitly marked.
  if (pageIds.some((id) => acceptedIds.has(id))) {
    const mainCards = Array.from(
      doc.querySelectorAll('[data-test-id="main-feed-activity-card"], .main-feed-activity-card-with-comments')
    ).filter((el) => !isExcludedElement(el));
    if (mainCards.length === 1) {
      const card = mainCards[0];
      const ids = elementIdentities(card).map((x) => x.id);
      if (!ids.some((id) => !acceptedIds.has(id))) containers.add(card);
    }
  }

  for (const container of containers) {
    const bodies = Array.from(container.querySelectorAll(BODY_SELECTORS)).filter((el) => {
      let parent: Element | null = el;
      while (parent && parent !== container) {
        if (parent.matches(EXCLUDED_CONTAINER_SELECTOR)) return false;
        const ids = elementIdentities(parent).map((x) => x.id);
        if (ids.some((id) => !acceptedIds.has(id))) return false;
        if (parent !== el && parent.tagName === "ARTICLE") return false;
        parent = parent.parentElement;
      }
      return parent === container;
    });
    for (const body of bodies) {
      const text = elementText(body);
      if (usableBody(text)) candidates.push({ text, method: "post-container" });
    }
  }

  if (!candidates.length) {
    return fail(
      `No hay cuerpo de publicación asociado al ID ${expected.id}. No se aceptan recomendaciones, comentarios ni metadescripciones.`
    );
  }

  const normForCompare = (s: string) =>
    s
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/[\s\u200b]+/g, "")
      .toLowerCase();
  // Prefer JSON-LD when length is equivalent since it preserves LinkedIn's exact line breaks.
  const longest = [...candidates].sort(
    (a, b) => b.text.length - a.text.length || (a.method === "json-ld" ? -1 : 1)
  )[0];
  const longestNorm = normForCompare(longest.text);
  if (candidates.some((c) => !longestNorm.includes(normForCompare(c.text)))) {
    return fail("Hay cuerpos incompatibles para el mismo ID. Requiere revisión manual.");
  }

  const matchedCanonical = pageUrls.find((u) => {
    const pid = linkedinPostId(u);
    return !!pid && acceptedIds.has(pid);
  });
  const canonicalUrl =
    matchedCanonical ??
    `https://www.linkedin.com/feed/update/urn:li:${bridgedActivityId ? "activity" : expected.kind}:${bridgedActivityId ?? expected.id}/`;

  const reason =
    bridge === "dom-urn-bridge"
      ? `ID ${expected.kind} ${expected.id} vinculado al activity ${bridgedActivityId} en el contenedor principal.`
      : bridge === "canonical-slug-bridge"
        ? `URL ${expected.kind} ${expected.id} resuelta al activity canónico ${bridgedActivityId} del mismo autor y slug.`
        : "ID exacto vinculado al contenedor del texto.";

  return {
    ok: true,
    text: longest.text,
    reason,
    method: longest.method,
    bridge,
    author: longest.author,
    postId: expected.id,
    activityId: bridgedActivityId,
    matchedUrl: canonicalUrl,
  };
}

interface ImportOptions {
  mode?: "normal" | "strong";
  onAttempt?: (msg: string) => void;
  signal?: AbortSignal;
}

/** No search or LLM. Providers receive only the public URL; cookies are never forwarded. */
export async function importLinkedInPost(
  rawUrl: string,
  opts: ImportOptions = {}
): Promise<ImportResult> {
  const url = normalizePostUrl(rawUrl);
  const identity = parseLinkedInIdentity(url);
  const attempts: ImportResult["attempts"] = [];
  if (!url || !identity) {
    return {
      ok: false,
      text: "",
      source: "",
      url,
      attempts,
      error: "URL inválida, incompleta o sin ID de post de LinkedIn. Revisa la URL o pega el texto.",
    };
  }
  const postId = identity.id;
  const controller = new AbortController();
  const abort = () => controller.abort();
  opts.signal?.addEventListener("abort", abort, { once: true });
  if (opts.signal?.aborted) abort();
  const totalTimer = setTimeout(abort, opts.mode === "strong" ? 45000 : 22000);
  const readers = [
    { name: "LinkedIn directo", build: (u: string) => u, headers: {} },
    {
      name: "Jina Reader (HTML)",
      build: (u: string) => `https://r.jina.ai/${u}`,
      headers: { "X-Respond-With": "html" },
    },
    {
      name: "AllOrigins (HTML)",
      build: (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      headers: {},
    },
  ];

  const round = async (target: string, retry: boolean): Promise<ImportResult | null> => {
    const tasks = readers.map(async (reader) => {
      const name = `${reader.name}${retry ? " (reintento)" : ""}`;
      opts.onAttempt?.(`Comprobando el ID ${postId} mediante ${name}...`);
      try {
        const res = await fetch(reader.build(target), {
          signal: controller.signal,
          headers: reader.headers as Record<string, string>,
          credentials: "omit",
          referrerPolicy: "no-referrer",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const parsed = extractVerifiedPost(await res.text(), url);
        attempts.push({ name, ok: parsed.ok, info: parsed.reason });
        if (!parsed.ok) throw new Error(parsed.reason);
        return {
          ok: true,
          text: parsed.text,
          source: reader.name,
          url,
          attempts,
          evidence: {
            version: 2,
            kind: "public-page",
            requestedUrl: url,
            matchedUrl: parsed.matchedUrl,
            postId,
            activityId: parsed.activityId,
            method: parsed.method,
            bridge: parsed.bridge,
            author: parsed.author,
            provider: reader.name,
            recordedAt: Date.now(),
            bodyHash: textFingerprint(parsed.text),
          },
        } as ImportResult;
      } catch (e) {
        if (!attempts.some((a) => a.name === name)) {
          attempts.push({
            name,
            ok: false,
            info: controller.signal.aborted
              ? "Tiempo agotado o cancelado."
              : e instanceof Error
                ? e.message
                : "Acceso bloqueado.",
          });
        }
        throw e;
      }
    });
    return new Promise((resolve) => {
      let pending = tasks.length;
      tasks.forEach((task) =>
        task.then(resolve, () => {
          if (--pending === 0) resolve(null);
        })
      );
    });
  };

  try {
    let result = await round(url, false);
    if (!result && opts.mode === "strong" && !controller.signal.aborted) {
      // Preserve the exact URN kind (share / ugcPost / activity) instead of rewriting share -> activity.
      result = await round(`https://www.linkedin.com/feed/update/urn:li:${identity.kind}:${postId}/`, true);
    }
    if (result) return { ...result, attempts: [...attempts] };
    return {
      ok: false,
      text: "",
      source: "",
      url,
      attempts: [...attempts],
      error:
        "No se pudo verificar el texto de este post exacto. No se ha importado ningún otro. Pégalo manualmente o reintenta.",
    };
  } finally {
    clearTimeout(totalTimer);
    opts.signal?.removeEventListener("abort", abort);
    controller.abort();
  }
}
