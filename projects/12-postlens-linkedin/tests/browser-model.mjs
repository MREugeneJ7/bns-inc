import { chromium } from "@playwright/test";

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await context.newPage();
page.setDefaultTimeout(120000);
page.on("console", (m) => {
  if (m.text().includes("MODEL-")) console.log(m.text());
});
page.on("pageerror", (e) => console.error("PAGE ERROR:", e.message));
await page.goto(process.env.APP_URL || "http://localhost:5173", {
  waitUntil: "networkidle",
});
const started = Date.now();
try {
  const result = await page.evaluate(async () => {
    const legacy = await caches.open("transformers-cache");
    await legacy.put(
      "/models/Xenova/LaMini-Flan-T5-77M/config.json",
      new Response("<html>Old SPA fallback</html>", {
        headers: { "Content-Type": "text/html" },
      }),
    );
    const { generateThemeLabels, generatePostTitle } =
      await import("/src/lib/llm.ts");
    const result = await generateThemeLabels(
      [
        {
          key: "baking",
          keywords: ["harina", "masa", "fermentación"],
          size: 2,
          avgSim: 0.5,
          excerpts: [
            "La fermentación lenta mejora el pan casero. Mezclamos harina y agua antes de añadir levadura a la masa.",
            "Para un pan de masa madre conviene controlar la temperatura, la harina y las horas de fermentación.",
          ],
        },
        {
          key: "gardening",
          keywords: ["tomates", "riego", "huerto"],
          size: 2,
          avgSim: 0.5,
          excerpts: [
            "Cultivamos tomates en un huerto urbano. El riego por goteo mantiene las raíces húmedas y evita desperdiciar agua.",
            "Cuidar tomates requiere observar la humedad del suelo y aportar compost al huerto.",
          ],
        },
      ],
      {
        engine: "transformers",
        onProgress: (_p, message) => console.log("MODEL-PROGRESS", message),
      },
    );
    const title = await generatePostTitle(
      "La fermentación lenta mejora el pan casero. Controlamos la harina, la levadura y las horas de reposo para conseguir una masa más esponjosa y sabrosa.",
      { engine: "transformers" },
    ).catch((e) => ({ error: e.message }));
    return { result, title };
  });
  console.log(
    JSON.stringify(
      { elapsedSeconds: (Date.now() - started) / 1000, ...result },
      null,
      2,
    ),
  );
  if (
    result.result.labels.length !== 2 ||
    result.result.labels[0].name === result.result.labels[1].name
  )
    process.exitCode = 1;
  if (
    !/pan|ferment|masa/i.test(
      result.result.labels.find((l) => l.key === "baking")?.name ?? "",
    )
  )
    process.exitCode = 1;
  if (
    !/tomate|huerto|riego|cultiv/i.test(
      result.result.labels.find((l) => l.key === "gardening")?.name ?? "",
    )
  )
    process.exitCode = 1;
} finally {
  await browser.close();
}
