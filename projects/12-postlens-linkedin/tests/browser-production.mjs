import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const posts = [
    {
      id: "test-baking",
      body: "La fermentación lenta mejora el pan casero. Mezclamos harina y agua antes de añadir levadura a la masa. Para un pan de masa madre conviene controlar la temperatura y las horas de fermentación.",
    },
    {
      id: "test-gardening",
      body: "Cultivamos tomates en un huerto urbano. El riego por goteo mantiene las raíces húmedas. Cuidar tomates requiere observar la humedad del suelo y aportar compost al huerto.",
    },
  ].map((p) => {
    let hash = 2166136261;
    for (let i = 0; i < p.body.length; i++) {
      hash ^= p.body.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return {
      ...p,
      title: p.body.split(".")[0],
      titleSource: "user",
      textStatus: "ok",
      provenance: {
        version: 2,
        kind: "manual",
        bodyHash: `${p.body.length}-${(hash >>> 0).toString(16)}`,
        recordedAt: Date.now(),
        method: "user-confirmed",
      },
      createdAt: Date.now(),
      url: null,
      urn: null,
      curl: "",
      rows: [],
      metrics: [],
      fecha: null,
      hora: null,
    };
  });
  await page.addInitScript(
    (posts) => localStorage.setItem("postlens.posts.v1", JSON.stringify(posts)),
    posts,
  );
  await page.goto(process.env.PRODUCTION_URL || "http://localhost:4173", {
    waitUntil: "networkidle",
  });
  await page.evaluate(async () => {
    const cache = await caches.open("transformers-cache");
    await cache.put(
      "/models/Xenova/LaMini-Flan-T5-77M/config.json",
      new Response("<html>Old invalid cache</html>", {
        headers: { "Content-Type": "text/html" },
      }),
    );
  });
  await page.getByRole("button", { name: "Análisis", exact: true }).click();
  await page.getByLabel("Motor LLM").selectOption("transformers");
  await page.getByRole("tab", { name: /^Grupos/ }).click();
  await page.getByRole("button", { name: "Generar nombres con LLM" }).click();
  await page
    .getByText("2/2 nombres generados por la LLM.", { exact: true })
    .waitFor({ timeout: 180000 });
  const names = await page.locator("section h3").allTextContents();
  console.log("Production UI / genuine CPU LLM:", names);
  assert.equal(names.length, 2);
  assert.notEqual(names[0], names[1]);
  assert.ok(names.some((n) => /pan|masa|ferment/i.test(n)));
  assert.ok(names.some((n) => /tomate|huerto|cultiv/i.test(n)));
  assert.equal(
    await page.getByText("Nombre de LLM", { exact: true }).count(),
    2,
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  assert.deepEqual(errors, []);
  await page.screenshot({
    path: "/tmp/postlens-production-mobile.png",
    fullPage: true,
  });
  await page.waitForFunction(
    () =>
      Object.keys(
        JSON.parse(localStorage.getItem("postlens.theme-labels.v2") || "{}"),
      ).length === 2,
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Análisis", exact: true }).click();
  await page.getByRole("tab", { name: /^Grupos/ }).click();
  assert.deepEqual(await page.locator("section h3").allTextContents(), names);
  console.log(
    "PASS: built application runs its inline CPU worker, names two unrelated groups, and fits mobile width",
  );
  console.log(
    "PASS: names persist after reload and are matched by post IDs plus content hashes",
  );
} finally {
  await browser.close();
}
