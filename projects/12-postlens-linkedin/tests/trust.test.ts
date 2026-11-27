import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  extractVerifiedPost,
  importLinkedInPost,
  normalizePostUrl,
} from "../src/lib/importPost";
import {
  linkedinPostId,
  manualProvenance,
  isPostTextUsable,
  textFingerprint,
} from "../src/lib/provenance";
import {
  migratePost,
  loadPosts,
  savePosts,
  loadThemeLabels,
  saveThemeLabels,
} from "../src/lib/store";
import { buildLocalAnalysis } from "../src/lib/analyst";
import { simMatrix } from "../src/lib/cosine";
import {
  generateThemeLabelsUsing,
  buildGroupPrompt,
  parseGeneratedHeading,
  resolveWebGpuModelId,
} from "../src/lib/aiTasks";
import {
  processUploadBatch,
  summarizeUploadJobs,
  postDedupeKey,
  type UploadJob,
  type UploadNotice,
} from "../src/lib/uploadQueue";
import type { Post } from "../src/lib/types";

globalThis.DOMParser = new JSDOM().window.DOMParser;
const ID = "7506000000000000001";
const OTHER = "7506000000000000999";
const url = `https://www.linkedin.com/posts/alicia_cocina-activity-${ID}-abc`;
const otherUrl = `https://www.linkedin.com/posts/roberto_cocina-activity-${OTHER}-def`;
const body =
  "Mi publicación auténtica trata sobre fermentación, harinas y levadura. Preparé dos masas y comparé el tiempo de reposo.";
const unrelated =
  "Este post recomendado trata sobre harinas y levadura, pero es de otra persona. ".repeat(
    40,
  );
const ld = (obj: unknown) =>
  `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;
const canonical = (u: string) => `<link rel="canonical" href="${u}">`;
const correct = () =>
  `${canonical(url)}${ld({ "@type": "SocialMediaPosting", url, articleBody: body, author: { name: "Alicia" } })}`;

test("post identity uses exact numeric IDs, not subject or author slug", () => {
  assert.equal(linkedinPostId(url), ID);
  assert.equal(
    linkedinPostId(
      `https://www.linkedin.com/feed/update/urn:li:activity:${ID}/`,
    ),
    ID,
  );
  assert.equal(linkedinPostId(`urn:li:share:${ID}`), ID);
  assert.equal(
    linkedinPostId(
      `https://linkedin.com.evil.test/feed/update/urn:li:activity:${ID}`,
    ),
    null,
  );
  assert.equal(
    linkedinPostId("https://www.linkedin.com/posts/alicia_cocina-share-75060"),
    null,
  );
  assert.equal(
    normalizePostUrl("https://example.com/?url=" + encodeURIComponent(url)),
    "",
  );
});

test("a longer real related post and comments never beat the exact post body", () => {
  const html =
    correct() +
    ld({
      "@type": "SocialMediaPosting",
      url: otherUrl,
      articleBody: unrelated,
    }) +
    `<p>${unrelated}</p><div class="comments-comments-list">${unrelated}</div>`;
  const result = extractVerifiedPost(html, url);
  assert.equal(result.ok, true);
  assert.equal(result.text, body);
  assert.equal(result.postId, ID);
  assert.equal(result.author, "Alicia");
});

test("redirect to another canonical post is rejected even with the requested URL in recommendations", () => {
  const result = extractVerifiedPost(
    canonical(otherUrl) +
      ld({ "@type": "SocialMediaPosting", url, articleBody: body }),
    url,
  );
  assert.equal(result.ok, false);
  assert.match(result.reason, /ID distinto/);
  assert.equal(result.text, "");
});

test("JSON-LD descriptions and nested comments are not accepted as a post", () => {
  const html =
    canonical(url) +
    ld({
      "@type": "SocialMediaPosting",
      url,
      description: unrelated,
      comment: { "@type": "Comment", text: unrelated },
    });
  assert.equal(extractVerifiedPost(html, url).ok, false);
});

test("a correct canonical is not enough to accept an arbitrary article or metadata", () => {
  const html =
    canonical(url) +
    `<meta property="og:description" content="${unrelated}"><article><p>${unrelated}</p></article>`;
  assert.equal(extractVerifiedPost(html, url).ok, false);
});

test("an exact ID in an unrelated hyperlink is not evidence for that body", () => {
  const html = `<a href="${url}">Post buscado</a><article data-urn="urn:li:activity:${OTHER}"><div class="attributed-text-segment-list__content">${unrelated}</div></article>`;
  assert.equal(extractVerifiedPost(html, url).ok, false);
});

test("ID-scoped container extracts only its own body, not a nested recommended post", () => {
  const html = `<article data-urn="urn:li:activity:${ID}"><div class="attributed-text-segment-list__content">${body}<article data-urn="urn:li:activity:${OTHER}">${unrelated}</article></div>
    <article data-urn="urn:li:activity:${OTHER}"><div class="attributed-text-segment-list__content">${unrelated}</div></article></article>`;
  const result = extractVerifiedPost(html, url);
  assert.equal(result.ok, true);
  assert.equal(result.text, body);
});

test("a marked main card with a different ID is rejected despite a correct canonical", () => {
  const html = `${canonical(url)}<article data-test-id="main-feed-activity-card" data-urn="urn:li:activity:${OTHER}"><div class="attributed-text-segment-list__content">${unrelated}</div></article>`;
  assert.equal(extractVerifiedPost(html, url).ok, false);
});

test("a related body without its own ID cannot borrow the outer main post identity", () => {
  const html = `${canonical(url)}<article data-test-id="main-feed-activity-card" data-urn="urn:li:activity:${ID}"><div class="recommended-post"><div class="attributed-text-segment-list__content">${unrelated}</div></div></article>`;
  assert.equal(extractVerifiedPost(html, url).ok, false);
});

test("a comment body cannot borrow the parent post identity", () => {
  const html = `<article data-urn="urn:li:activity:${ID}"><div class="comments-comment-item"><div class="attributed-text-segment-list__content">${unrelated}</div></div></article>`;
  assert.equal(extractVerifiedPost(html, url).ok, false);
});

test("conflicting bodies for the same ID are held for manual review", () => {
  const html =
    correct() +
    ld({
      "@type": "SocialMediaPosting",
      url,
      articleBody:
        "Un cuerpo incompatible sobre otro tema completamente distinto de la publicación esperada.",
    });
  assert.equal(extractVerifiedPost(html, url).ok, false);
});

test("unscoped markdown from a reader is never accepted as verified content", () => {
  assert.equal(
    extractVerifiedPost(
      `URL Source: ${url}\nMarkdown content:\n${unrelated}`,
      url,
    ).ok,
    false,
  );
});

test("truncated content is not silently labelled as a complete post", () => {
  assert.equal(
    extractVerifiedPost(
      ld({
        "@type": "SocialMediaPosting",
        url,
        articleBody: body + " ...see more",
      }),
      url,
    ).ok,
    false,
  );
});

test("import failure returns empty text; strong retry uses the same ID and no search endpoint", async () => {
  const original = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = async (input, options) => {
    const request = String(input);
    requests.push(request);
    assert.equal(options?.credentials, "omit");
    assert.ok(!request.includes("s.jina.ai"));
    assert.ok(!request.includes("/search"));
    return new Response(
      canonical(otherUrl) +
        ld({
          "@type": "SocialMediaPosting",
          url: otherUrl,
          articleBody: unrelated,
        }),
      { status: 200 },
    );
  };
  try {
    const result = await importLinkedInPost(url, { mode: "strong" });
    assert.equal(result.ok, false);
    assert.equal(result.text, "");
    assert.equal(result.evidence, undefined);
    assert.equal(requests.length, 6);
    assert.ok(requests.every((r) => decodeURIComponent(r).includes(ID)));
  } finally {
    globalThis.fetch = original;
  }
});

test("successful import records provider, exact evidence and fingerprint", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(correct(), { status: 200 });
  try {
    const result = await importLinkedInPost(url);
    assert.equal(result.ok, true);
    assert.equal(result.evidence?.postId, ID);
    assert.equal(result.evidence?.bodyHash, textFingerprint(body));
    assert.equal(result.evidence?.method, "json-ld");
  } finally {
    globalThis.fetch = original;
  }
});

const post = (id: string, text: string): Post => ({
  id,
  title: text.slice(0, 40),
  body: text,
  url,
  urn: ID,
  createdAt: 0,
  curl: "",
  rows: [],
  metrics: [],
  fecha: null,
  hora: null,
  textStatus: "ok",
  provenance: manualProvenance(text, url),
});

test("legacy imported content is preserved but quarantined from cosine and prompts", () => {
  const old = post("old", unrelated);
  delete old.provenance;
  const migrated = migratePost(old);
  assert.equal(migrated.body, unrelated);
  assert.equal(migrated.textStatus, "unverified");
  assert.equal(isPostTextUsable(migrated), false);
  const local = buildLocalAnalysis([migrated, post("real", body)], 0.80, [[1, 0]]);
  assert.deepEqual(local.includedIndices, [1]);
  assert.deepEqual(
    local.themes.flatMap((t) => t.members),
    [1],
  );
  assert.deepEqual(local.excludedPostIds, ["old"]);
});

test("editing body or changing URL invalidates public-page provenance", () => {
  const p = post("x", body);
  p.provenance = {
    version: 2,
    kind: "public-page",
    recordedAt: 0,
    bodyHash: textFingerprint(body),
    postId: ID,
    requestedUrl: url,
    matchedUrl: url,
    method: "json-ld",
  };
  assert.equal(isPostTextUsable(p), true);
  assert.equal(isPostTextUsable({ ...p, body: unrelated }), false);
  assert.equal(isPostTextUsable({ ...p, url: otherUrl }), false);
});

test("group cache keys follow IDs and body content, not array positions or titles", () => {
  const a = post("a", body);
  const b = post(
    "b",
    "Jardinería urbana y cultivo de tomates: preparo bancales y riego por goteo.",
  );
  const first = buildLocalAnalysis([a, b], 0.85, [[1, 0], [0, 1]]);
  const reordered = buildLocalAnalysis([b, a], 0.85, [[0, 1], [1, 0]]);
  assert.equal(
    first.themes.find((t) => t.members.includes(0))?.key,
    reordered.themes.find((t) => t.members.includes(1))?.key,
  );
  const changed = post(
    "a",
    "Fotografía y objetivos: fotografía de naturaleza, iluminación y lentes.",
  );
  assert.notEqual(
    first.themes.find((t) => t.members.includes(0))?.key,
    buildLocalAnalysis([changed, b], 0.85, [[1, 0], [0, 1]]).themes.find((t) =>
      t.members.includes(0),
    )?.key,
  );
});

test("each group gets a separate plain-text LLM prompt with its own content, including the last group", async () => {
  const input = Array.from({ length: 5 }, (_, i) => ({
    key: `key-${i}`,
    keywords: [],
    excerpts: [
      `Texto exclusivo del grupo ${i}. ` + "Detalle real. ".repeat(100),
    ],
    size: 1,
    avgSim: 1,
  }));
  const prompts: string[] = [];
  const result = await generateThemeLabelsUsing(input, async (prompt) => {
    prompts.push(prompt);
    return {
      text: `Nombre específico ${prompts.length}`,
      engine: "Test adapter",
      model: "fixture",
    };
  });
  assert.equal(prompts.length, 5);
  assert.ok(prompts[4].includes("Texto exclusivo del grupo 4"));
  assert.ok(prompts.every((p) => p.endsWith("Title:")));
  assert.ok(prompts.every((p) => !p.includes("JSON array")));
  assert.deepEqual(
    result.labels.map((l) => l.key),
    input.map((i) => i.key),
  );
  assert.equal(result.labels[4].name, "Nombre específico 5");
  assert.ok(
    buildGroupPrompt(input[0]).length > 700,
    "prompt content is not silently sliced to 700 characters",
  );
});

test("one invalid group answer does not erase successful names or shift group assignments", async () => {
  let call = 0;
  const input = ["A", "B", "C"].map((key) => ({
    key,
    keywords: [],
    excerpts: [body],
    size: 1,
    avgSim: 1,
  }));
  const result = await generateThemeLabelsUsing(input, async () => {
    call++;
    return {
      text: call === 2 ? "[malformed JSON array]" : `Tema real ${call}`,
      engine: "test",
      model: "test",
    };
  });
  assert.deepEqual(
    result.labels.map((l) => l.key),
    ["A", "C"],
  );
  assert.deepEqual(
    result.errors.map((e) => e.key),
    ["B"],
  );
});

test("model failure produces an explicit error, never a fabricated LLM label", async () => {
  const result = await generateThemeLabelsUsing(
    [{ key: "A", keywords: [], excerpts: [body], size: 1, avgSim: 1 }],
    async () => {
      throw new Error("LLM no disponible");
    },
  );
  assert.equal(result.labels.length, 0);
  assert.match(result.errors[0].message, /LLM no disponible/);
  assert.equal(parseGeneratedHeading("Write ONE short title in Spanish"), null);
  assert.equal(parseGeneratedHeading("Explicación larga\nOtro título"), null);
  assert.equal(
    parseGeneratedHeading("Fermentación y masas caseras"),
    "Fermentación y masas caseras",
  );
});

test("persisted group labels require a matching content key and real model metadata", () => {
  const values = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  } as Storage;
  const p = post("actual-id", body);
  const key = buildLocalAnalysis([p], 0.80, [[1, 0]]).themes[0].key;
  saveThemeLabels({
    [key]: {
      key,
      name: "Fermentación artesanal",
      engine: "Test adapter",
      model: "fixture",
      emoji: "",
      hashtags: [],
      reason: "",
    },
  });
  assert.equal(loadThemeLabels()[key].name, "Fermentación artesanal");
  values.set(
    "postlens.theme-labels.v2",
    JSON.stringify({
      position0: { key: "different-content", name: "Nombre antiguo" },
    }),
  );
  assert.deepEqual(loadThemeLabels(), {});
});

test("old auto-loaded demos are not mixed into a real dashboard on startup", () => {
  const stored = JSON.stringify([
    post("real-post", body),
    post("demo-a", unrelated),
  ]);
  globalThis.localStorage = {
    getItem: (key: string) => (key === "postlens.posts.v1" ? stored : null),
  } as Storage;
  assert.deepEqual(
    loadPosts().map((p) => p.id),
    ["real-post"],
  );
});

test("a failed backup due to quota does not silently block saving repaired posts", () => {
  let saved = "";
  globalThis.localStorage = {
    getItem: (key: string) =>
      key === "postlens.posts.v1" ? JSON.stringify([post("old", body)]) : null,
    setItem: (key: string, value: string) => {
      if (key.includes("backup")) throw new Error("QuotaExceeded");
      if (key === "postlens.posts.v1") saved = value;
    },
  } as Storage;
  savePosts([post("repaired", body)]);
  assert.equal(JSON.parse(saved)[0].id, "repaired");
});

test("real LinkedIn share URL bridges to its canonical activity via data-attributed-urn without accepting related posts", () => {
  const shareId = "7512284342400761856";
  const activityId = "7512829189314682880";
  const relatedShareId = "7510793515698712576";
  const relatedActivityId = "7510835926588157952";
  const shareUrl = `https://www.linkedin.com/posts/eugeneglez_vendehumos-ingenieriadesoftware-mercadolaboral-share-${shareId}-9sAf`;
  const canonicalActivityUrl = `https://es.linkedin.com/posts/eugeneglez_vendehumos-ingenieriadesoftware-mercadolaboral-activity-${activityId}-a216`;
  const html = `
    <link rel="canonical" href="${canonicalActivityUrl}">
    <meta property="og:url" content="${canonicalActivityUrl}">
    <script type="application/ld+json">${JSON.stringify({
      "@type": "SocialMediaPosting",
      "@id": canonicalActivityUrl,
      articleBody: body,
      author: { name: "Eugenio" },
    })}</script>
    <article class="main-feed-activity-card main-feed-activity-card-with-comments"
      data-activity-urn="urn:li:activity:${activityId}"
      data-featured-activity-urn="urn:li:activity:${activityId}"
      data-attributed-urn="urn:li:share:${shareId}">
      <p data-test-id="main-feed-activity-card__commentary">${body}</p>
    </article>
    <article class="main-feed-activity-card related-posts__crosslink"
      data-activity-urn="urn:li:activity:${relatedActivityId}"
      data-attributed-urn="urn:li:share:${relatedShareId}">
      <p data-test-id="main-feed-activity-card__commentary">${unrelated}</p>
    </article>
  `;

  const ok = extractVerifiedPost(html, shareUrl);
  assert.equal(ok.ok, true);
  assert.equal(ok.text, body);
  assert.equal(ok.postId, shareId);
  assert.equal(ok.activityId, activityId);
  assert.equal(ok.bridge, "dom-urn-bridge");
  assert.equal(ok.matchedUrl, canonicalActivityUrl);

  // Requesting the related post ID against the main post HTML must STILL fail.
  const wrongTarget = extractVerifiedPost(
    html,
    `https://www.linkedin.com/posts/eugeneglez_other-share-${relatedShareId}-xyz`,
  );
  assert.equal(wrongTarget.ok, false);

  // Bridged provenance passes isPostTextUsable, while tampering or changing URL fails.
  const bridgedPost: Post = {
    ...post("bridged", body),
    url: shareUrl,
    urn: shareId,
    provenance: {
      version: 2,
      kind: "public-page",
      bodyHash: textFingerprint(body),
      recordedAt: Date.now(),
      postId: shareId,
      activityId,
      matchedUrl: canonicalActivityUrl,
      method: "json-ld",
      bridge: "dom-urn-bridge",
    },
  };
  assert.equal(isPostTextUsable(bridgedPost), true);
  assert.equal(isPostTextUsable({ ...bridgedPost, body: unrelated }), false);
  assert.equal(
    isPostTextUsable({
      ...bridgedPost,
      url: `https://www.linkedin.com/posts/eugeneglez_other-share-${relatedShareId}-xyz`,
    }),
    false,
  );
});

test("canonical share->activity bridge requires exact author and slug and never bridges activity->different activity", () => {
  const shareUrl =
    "https://www.linkedin.com/posts/eugeneglez_vendehumos-ingenieriadesoftware-mercadolaboral-share-7512284342400761856-9sAf";
  const sameSlugCanonical =
    "https://es.linkedin.com/posts/eugeneglez_vendehumos-ingenieriadesoftware-mercadolaboral-activity-7512829189314682880-a216";
  const diffSlugCanonical =
    "https://es.linkedin.com/posts/eugeneglez_otro-tema-distinto-activity-7512829189314682880-a216";
  const diffAuthorCanonical =
    "https://es.linkedin.com/posts/otra_vendehumos-ingenieriadesoftware-mercadolaboral-activity-7512829189314682880-a216";

  const makeHtml = (can: string) =>
    `<link rel="canonical" href="${can}"><script type="application/ld+json">${JSON.stringify({
      "@type": "SocialMediaPosting",
      "@id": can,
      articleBody: body,
    })}</script>`;

  const ok = extractVerifiedPost(makeHtml(sameSlugCanonical), shareUrl);
  assert.equal(ok.ok, true);
  assert.equal(ok.bridge, "canonical-slug-bridge");

  assert.equal(extractVerifiedPost(makeHtml(diffSlugCanonical), shareUrl).ok, false);
  assert.equal(extractVerifiedPost(makeHtml(diffAuthorCanonical), shareUrl).ok, false);

  // Two different activity IDs are NEVER bridged even with the exact same author + slug.
  const otherActivityUrl =
    "https://www.linkedin.com/posts/eugeneglez_vendehumos-ingenieriadesoftware-mercadolaboral-activity-7512284342400761856-9sAf";
  assert.equal(extractVerifiedPost(makeHtml(sameSlugCanonical), otherActivityUrl).ok, false);
});

test("strong retry preserves share URN kind instead of rewriting it to activity", async () => {
  const shareId = "7512284342400761856";
  const shareUrl = `https://www.linkedin.com/posts/eugeneglez_vendehumos-share-${shareId}-9sAf`;
  const original = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = async (input) => {
    requests.push(String(input));
    return new Response("<html><body>blocked</body></html>", { status: 403 });
  };
  try {
    await importLinkedInPost(shareUrl, { mode: "strong" });
    assert.ok(requests.some((r) => decodeURIComponent(r).includes(`urn:li:share:${shareId}`)));
    assert.ok(!requests.some((r) => decodeURIComponent(r).includes(`urn:li:activity:${shareId}`)));
  } finally {
    globalThis.fetch = original;
  }
});

test("underscore-delimited LinkedIn post URLs without slug words still parse ID", () => {
  assert.equal(
    linkedinPostId("https://www.linkedin.com/posts/eugeneglez_share-7512284342400761856-9sAf"),
    "7512284342400761856",
  );
});

test("semantic cosine uses model vectors and never invents lexical groups", () => {
  const a = post("a", "Automóvil rápido y silencioso");
  const b = post("b", "Coche veloz sin ruido");
  const c = post("c", "Cultivo de tomates");
  const pair = simMatrix([[1, 0], [0.9, 0.1]])[0][1];
  const withOthers = simMatrix([[1, 0], [0.9, 0.1], [0, 1]])[0][1];
  assert.ok(
    Math.abs(pair - withOthers) < 1e-9,
    `A<->B must not change when other posts are added: ${pair} vs ${withOthers}`,
  );
  assert.equal(buildLocalAnalysis([a, b, c], 0.8).themes.length, 0);
  assert.deepEqual(buildLocalAnalysis([a, b, c], 0.8, [[1, 0], [0.9, 0.1], [0, 1]]).themes.map((t) => t.members), [[0, 1], [2]]);
});

test("WebGPU model resolver selects q4f16_1 when shader-f16 is supported and q4f32_1 otherwise", () => {
  assert.equal(
    resolveWebGpuModelId("qwen2.5-0.5b", true),
    "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
  );
  assert.equal(
    resolveWebGpuModelId("qwen2.5-0.5b", false),
    "Qwen2.5-0.5B-Instruct-q4f32_1-MLC",
  );
  assert.equal(
    resolveWebGpuModelId("smollm2-360m", false),
    "SmolLM2-360M-Instruct-q4f32_1-MLC",
  );
});

test("parseGeneratedHeading normalizes common LLM formatting while rejecting prose and echoes", () => {
  assert.equal(
    parseGeneratedHeading("**Estrategia de ingeniería con IA**"),
    "Estrategia de ingeniería con IA",
  );
  assert.equal(
    parseGeneratedHeading("Título: Liderazgo técnico en startups."),
    "Liderazgo técnico en startups",
  );
  assert.equal(
    parseGeneratedHeading("- Carrera en desarrollo backend"),
    "Carrera en desarrollo backend",
  );
  assert.equal(
    parseGeneratedHeading("<think>pensando el tema...</think>\nCultivo urbano de tomates"),
    "Cultivo urbano de tomates",
  );
  assert.equal(
    parseGeneratedHeading('{"tema":"Analítica de producto B2B"}'),
    "Analítica de producto B2B",
  );
  assert.equal(parseGeneratedHeading("Tema 1"), null);
  assert.equal(parseGeneratedHeading("Grupo 3"), null);
  assert.equal(parseGeneratedHeading("Título\nSegunda línea explicativa"), null);
});

test("async batch upload notifies missing posts, title failures, duplicates, and file errors without losing stats", async () => {
  const created: Post[] = [];
  const jobs = new Map<string, UploadJob>();
  const notices: UploadNotice[] = [];
  let seq = 0;

  const urlOk = "https://www.linkedin.com/posts/ana_ia-activity-7506000000000001001-aa";
  const urlNoTitle = "https://www.linkedin.com/posts/ana_team-activity-7506000000000001002-bb";
  const urlMissing = "https://www.linkedin.com/posts/ana_404-activity-7506000000000001003-cc";
  const baseMetrics = [{ key: "impresiones", label: "Impresiones", value: "500", num: 500 }];
  const baseRows = [{ categoria: "Cargo", valor: "Ingeniero", pct: 25 }];

  const files = [
    {
      jobId: "j-ok",
      fileName: "post-ok.xlsx",
      parse: async () => ({ rows: baseRows, metrics: baseMetrics, url: urlOk, fecha: "01/10/2026", hora: "10:00" }),
    },
    {
      jobId: "j-dup",
      fileName: "post-ok-copy.xlsx",
      parse: async () => ({ rows: baseRows, metrics: baseMetrics, url: urlOk, fecha: "01/10/2026", hora: "10:00" }),
    },
    {
      jobId: "j-notitle",
      fileName: "post-sin-titulo.xlsx",
      parse: async () => ({ rows: baseRows, metrics: baseMetrics, url: urlNoTitle, fecha: "02/10/2026", hora: "11:00" }),
    },
    {
      jobId: "j-missing",
      fileName: "post-bloqueado.xlsx",
      parse: async () => ({ rows: baseRows, metrics: baseMetrics, url: urlMissing, fecha: "03/10/2026", hora: "12:00" }),
    },
    {
      jobId: "j-nourl",
      fileName: "post-sin-url.xlsx",
      parse: async () => ({ rows: baseRows, metrics: baseMetrics, url: null, fecha: "04/10/2026", hora: null }),
    },
    {
      jobId: "j-bad",
      fileName: "vacio.xlsx",
      parse: async () => ({ rows: [], metrics: [], url: null, fecha: null, hora: null }),
    },
  ];
  for (const f of files) {
    jobs.set(f.jobId, { id: f.jobId, fileName: f.fileName, status: "queued", detail: "", createdAt: 0 });
  }

  const updatePost = (postId: string, patch: Partial<Post>) => {
    const idx = created.findIndex((p) => p.id === postId);
    if (idx >= 0) created[idx] = { ...created[idx], ...patch };
  };

  await processUploadBatch(files, {
    createId: () => `p-${++seq}`,
    existingKeys: new Set<string>(),
    importConcurrency: 2,
    yieldFrame: async () => {},
    importPost: async (target) => {
      if (target === urlOk) {
        const text = "Publicación verificada sobre embeddings semánticos y búsqueda vectorial en español.";
        return {
          ok: true,
          text,
          attempts: [{ name: "directo", info: "ok" }],
          evidence: {
            version: 2,
            kind: "public-page",
            bodyHash: textFingerprint(text),
            recordedAt: 1,
            postId: "7506000000000001001",
            requestedUrl: urlOk,
            matchedUrl: urlOk,
            method: "json-ld",
          },
        };
      }
      if (target === urlNoTitle) {
        const text = "Publicación verificada cuyo título fallará en la LLM para comprobar el aviso.";
        return {
          ok: true,
          text,
          attempts: [{ name: "directo", info: "ok" }],
          evidence: {
            version: 2,
            kind: "public-page",
            bodyHash: textFingerprint(text),
            recordedAt: 1,
            postId: "7506000000000001002",
            requestedUrl: urlNoTitle,
            matchedUrl: urlNoTitle,
            method: "json-ld",
          },
        };
      }
      return {
        ok: false,
        text: "",
        error: "HTTP 403 en LinkedIn: no se pudo verificar este post.",
        attempts: [{ name: "directo", info: "HTTP 403" }],
      };
    },
    generateTitle: async (text) => {
      if (text.includes("fallará")) throw new Error("El modelo no devolvió un título válido.");
      return { title: "Búsqueda vectorial con embeddings", engine: "WebLLM · Qwen" };
    },
    onJobUpdate: (id, patch) => {
      const prev = jobs.get(id)!;
      jobs.set(id, { ...prev, ...patch });
    },
    onPostCreated: (p) => created.push(p),
    onPostPatch: updatePost,
    onNotice: (n) => notices.push(n),
  });

  // 4 unique valid spreadsheets saved (ok, noTitle, missing, noUrl); dup and empty skipped.
  assert.equal(created.length, 4);
  assert.equal(jobs.get("j-ok")?.status, "done");
  assert.equal(jobs.get("j-dup")?.status, "duplicate");
  assert.equal(jobs.get("j-notitle")?.status, "missing-title");
  assert.equal(jobs.get("j-missing")?.status, "missing-text");
  assert.equal(jobs.get("j-nourl")?.status, "missing-text");
  assert.equal(jobs.get("j-bad")?.status, "error");

  const okPost = created.find((p) => p.url === urlOk)!;
  assert.equal(okPost.titleSource, "ai");
  assert.equal(okPost.title, "Búsqueda vectorial con embeddings");
  assert.equal(okPost.titleError, undefined);

  const noTitlePost = created.find((p) => p.url === urlNoTitle)!;
  assert.equal(isPostTextUsable(noTitlePost), true);
  assert.equal(noTitlePost.titleSource, "auto");
  assert.match(noTitlePost.titleError ?? "", /título válido/);

  const missingPost = created.find((p) => p.url === urlMissing)!;
  assert.equal(missingPost.textStatus, "missing");
  assert.equal(missingPost.metrics.length, 1);
  assert.match(missingPost.importError ?? "", /HTTP 403/);

  const summary = summarizeUploadJobs([...jobs.values()]);
  assert.equal(summary.done, 1);
  assert.equal(summary.missingText, 2);
  assert.equal(summary.missingTitle, 1);
  assert.equal(summary.duplicates, 1);
  assert.equal(summary.errors, 1);
  assert.equal(summary.active, 0);
  assert.equal(summary.warnings, 4);
  assert.equal(notices.filter((n) => n.kind === "missing-text").length, 2);
  assert.equal(notices.filter((n) => n.kind === "missing-title").length, 1);
  assert.equal(notices.filter((n) => n.kind === "error").length, 1);
  assert.equal(postDedupeKey(urlOk), "li:7506000000000001001");
});

test("cancelling async batch marks unfinished jobs cancelled without fabricating titles", async () => {
  const ctrl = new AbortController();
  const statuses = new Map<string, string>();
  const urlA = "https://www.linkedin.com/posts/ana_x-activity-7506000000000002001-aa";
  const urlB = "https://www.linkedin.com/posts/ana_y-activity-7506000000000002002-bb";
  const created: Post[] = [];
  let seq = 0;
  await processUploadBatch(
    [
      {
        jobId: "a",
        fileName: "a.xlsx",
        parse: async () => ({
          rows: [{ categoria: "Cargo", valor: "Dev", pct: 10 }],
          metrics: [{ key: "impresiones", label: "Impresiones", value: "100", num: 100 }],
          url: urlA,
          fecha: null,
          hora: null,
        }),
      },
      {
        jobId: "b",
        fileName: "b.xlsx",
        parse: async () => ({
          rows: [{ categoria: "Cargo", valor: "Dev", pct: 10 }],
          metrics: [{ key: "impresiones", label: "Impresiones", value: "200", num: 200 }],
          url: urlB,
          fecha: null,
          hora: null,
        }),
      },
    ],
    {
      createId: () => `c-${++seq}`,
      existingKeys: new Set(),
      importConcurrency: 1,
      signal: ctrl.signal,
      yieldFrame: async () => {},
      importPost: async (u) => {
        ctrl.abort();
        return { ok: false, text: "", error: `aborted ${u}`, attempts: [] };
      },
      generateTitle: async () => ({ title: "No debería ejecutarse", engine: "x" }),
      onJobUpdate: (id, patch) => {
        if (patch.status) statuses.set(id, patch.status);
      },
      onPostCreated: (p) => created.push(p),
      onPostPatch: () => {},
    },
  );
  assert.equal(created.length, 2);
  assert.equal(statuses.get("a"), "cancelled");
  assert.equal(statuses.get("b"), "cancelled");
  assert.ok(created.every((p) => p.titleSource === "auto"));
});
