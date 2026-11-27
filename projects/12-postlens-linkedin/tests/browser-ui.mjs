import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const base = process.env.APP_URL || "http://localhost:5173";
const id = "7506000000000000001";
const wrongId = "7506000000000000999";
const url = `https://www.linkedin.com/posts/alicia_masa-activity-${id}-abc`;
const wrongUrl = `https://www.linkedin.com/posts/roberto_masa-activity-${wrongId}-def`;
const text =
  "Mi texto original de cocina describe la fermentación lenta del pan, la harina y el tiempo de reposo de una masa madre casera.";
const wrongText =
  "Otra publicación real sobre pan que no es la del usuario y no debe importarse. ".repeat(
    10,
  );
const makePost = (key = "legacy") => ({
  id: key,
  body: wrongText,
  title: "Antiguo texto importado",
  titleSource: "auto",
  textStatus: "ok",
  url,
  urn: id,
  curl: "",
  createdAt: Date.now(),
  fecha: "16/9/2026",
  hora: "16:02",
  rows: [
    { categoria: "Cargo", valor: "Panadero artesanal", pct: 30 },
    { categoria: "Ubicación", valor: "Valladolid y alrededores", pct: 12 },
  ],
  metrics: [
    { key: "impresiones", label: "Impresiones", value: "2000", num: 2000 },
    { key: "alcance", label: "Miembros alcanzados", value: "1000", num: 1000 },
  ],
});

async function mockChrome(page, broken = false) {
  await page.addInitScript(
    ({ broken }) => {
      window.LanguageModel = {
        availability: async () => "available",
        create: async () => ({
          prompt: async (prompt) => {
            if (broken)
              throw new Error("Failed to execute mapAsync on GPUBuffer");
            if (prompt.includes("short, specific title"))
              return "Pan artesanal y fermentación";
            if (prompt.includes("short title"))
              return "Cómo mejorar la fermentación del pan";
            return "RESPUESTA LLM DE PRUEBA: el segmento observado es Panadero artesanal; esto es una inferencia del modelo.";
          },
          destroy() {},
        }),
      };
    },
    { broken },
  );
}

async function newPage(options = {}) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  if (options.chrome !== false) await mockChrome(page, options.broken);
  await page.addInitScript((p) => {
    localStorage.setItem("postlens.posts.v1", JSON.stringify(p));
  }, options.posts ?? []);
  await page.goto(base, { waitUntil: "networkidle" });
  return { page, context, errors };
}

try {
  // Legacy texts are never silently re-used by the LLM or the cosine algorithm.
  const { page, context, errors } = await newPage({ posts: [makePost()] });
  await page
    .getByRole("button", { name: "Revisar textos", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Revisar texto", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("textbox", { name: "Texto original del post" })
      .inputValue(),
    wrongText,
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Guardar publicación", exact: true })
      .isDisabled(),
    true,
  );
  await page
    .getByRole("checkbox", { name: /He comparado el original/ })
    .click();
  await page
    .getByRole("button", { name: "Guardar publicación", exact: true })
    .click();
  await page.getByRole("button", { name: "Análisis", exact: true }).click();
  await page.getByLabel("Motor LLM").selectOption("chrome");
  assert.ok(
    await page
      .getByText("Cálculos deterministas · sin IA", { exact: true })
      .isVisible(),
  );
  assert.equal(
    await page.getByText("RESPUESTA LLM DE PRUEBA", { exact: false }).count(),
    0,
  );
  await page.getByRole("button", { name: "Analizar con LLM real" }).click();
  await page.getByText(/RESPUESTA LLM DE PRUEBA:/).waitFor();
  await page.getByRole("tab", { name: /^Grupos/ }).click();
  await page.getByRole("button", { name: "Generar nombres con LLM" }).click();
  await page
    .getByRole("heading", { name: "Pan artesanal y fermentación" })
    .waitFor();
  assert.ok(await page.getByText("Nombre de LLM", { exact: true }).isVisible());
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  // Slider de umbral: NO debe recargar la vista ni desmontar la pestaña (regresión del bug).
  // Un mismo botón "Grupos" debe seguir seleccionado tras mover el slider.
  await page.getByLabel("Umbral coseno").fill("0.45");
  await page.waitForTimeout(120);
  assert.equal(
    await page.getByRole("tab", { name: /^Grupos/ }).getAttribute("aria-selected"),
    "true",
  );
  assert.ok(
    await page.getByRole("heading", { name: "Pan artesanal y fermentación" }).isVisible(),
  );
  assert.deepEqual(errors, []);
  await page.screenshot({
    path: "/tmp/postlens-mobile-groups.png",
    fullPage: true,
  });
  await context.close();
  console.log(
    "PASS: migration, manual review, truthful labels, LLM group wiring, mobile width",
  );

  // A failing actual API adapter is an error, not a template masquerading as a response.
  const confirmed = makePost("confirmed-fixture");
  let fingerprint = 2166136261;
  for (let i = 0; i < confirmed.body.length; i++) {
    fingerprint ^= confirmed.body.charCodeAt(i);
    fingerprint = Math.imul(fingerprint, 16777619);
  }
  confirmed.provenance = {
    version: 2,
    kind: "manual",
    bodyHash: `${confirmed.body.length}-${(fingerprint >>> 0).toString(16)}`,
    recordedAt: Date.now(),
  };
  const failure = await newPage({ posts: [confirmed], broken: true });
  await failure.page
    .getByRole("button", { name: "Análisis", exact: true })
    .click();
  await failure.page.getByLabel("Motor LLM").selectOption("chrome");
  await failure.page
    .getByRole("button", { name: "Analizar con LLM real" })
    .click();
  await failure.page
    .getByText("No se ha generado ninguna respuesta IA.", { exact: true })
    .waitFor();
  assert.ok(await failure.page.getByText(/Chrome perdió acceso/).isVisible());
  await failure.page.getByRole("tab", { name: "Ideas con LLM" }).click();
  assert.ok(
    await failure.page
      .getByText(/únicamente una propuesta recibida de la LLM/)
      .isVisible(),
  );
  assert.equal(
    await failure.page
      .getByText(/Lo que aprendí publicando/, { exact: false })
      .isVisible()
      .catch(() => false),
    false,
  );
  await failure.context.close();
  console.log(
    "PASS: genuine model error never falls back to a fake IA report or ideas",
  );

  // Public readers returning a different real post are rejected in the visible workflow.
  const imported = await newPage();
  const { page: p } = imported;
  await p.route(
    /linkedin\.com|r\.jina\.ai|api\.allorigins\.win/,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: `<link rel="canonical" href="${wrongUrl}"><script type="application/ld+json">${JSON.stringify({ "@type": "SocialMediaPosting", url: wrongUrl, articleBody: wrongText })}</script>`,
      });
    },
  );
  await p.getByRole("button", { name: "+ Añadir", exact: true }).click();
  await p.getByRole("button", { name: /Pegar celdas/ }).click();
  await p
    .getByLabel("Celdas del Excel")
    .fill(
      `URL de la publicación\t${url}\nImpresiones\t2000\nInformación detallada de las visualizaciones de la publicación\nCategoría\tValor\t%\nCargo\tPanadero artesanal\t30 %`,
    );
  await p.getByRole("button", { name: "Leer celdas", exact: true }).click();
  await p
    .getByText(/No se pudo verificar el texto de este post exacto/)
    .waitFor();
  assert.equal(await p.getByLabel("Texto original del post").inputValue(), "");
  assert.equal(
    await p
      .getByRole("button", { name: "Guardar publicación", exact: true })
      .isDisabled(),
    true,
  );
  await p.getByLabel("Texto original del post").fill(text);
  await p.getByLabel("Título del post").fill("Mi título manual");
  await p
    .getByRole("button", { name: "Guardar publicación", exact: true })
    .click();
  await p.getByRole("heading", { name: "Mi título manual" }).waitFor();
  const stored = await p.evaluate(() =>
    JSON.parse(localStorage.getItem("postlens.posts.v1")),
  );
  assert.equal(stored.length, 1);
  assert.equal(stored[0].body, text);
  assert.equal(stored[0].provenance.kind, "manual");
  assert.notEqual(stored[0].body, wrongText);
  await imported.context.close();
  console.log(
    "PASS: wrong-post import rejected, no random text, paste-and-save repair works",
  );
} finally {
  await browser.close();
}
