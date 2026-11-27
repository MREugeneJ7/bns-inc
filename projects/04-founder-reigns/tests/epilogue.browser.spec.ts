import { expect, test, type Page } from "@playwright/test";

type Snapshot = Record<string, string>;

const finalVerdict: Snapshot = {
  screen: '"playing"',
  soul: "50",
  meters: "({ vcs: 70, ventas: 70, producto: 70, cultura: 70 })",
  eraIndex: "ERAS.length - 1",
  day: "ERAS[ERAS.length - 1].startDay",
  pendingEvent: 'WORLD_EVENTS.find(event => event.special === "rea-verdict")',
  muted: "true",
};

// Seed late-game snapshots only in the intercepted development module.
// Production has no scenario switch or debug API; all actions use the real handlers.
async function openSnapshot(page: Page, initializers: Snapshot) {
  await page.addInitScript(() => { Math.random = () => 0.99; });
  await page.route("**/src/App.tsx*", async route => {
    const response = await route.fetch();
    let body = await response.text();
    for (const [state, expression] of Object.entries(initializers)) {
      const pattern = new RegExp(`(const \\[${state},[^\\]]+\\] = useState\\()[^\\n]*(\\);)`);
      if (!pattern.test(body)) throw new Error(`Snapshot hook not found: ${state}`);
      body = body.replace(pattern, (_match, prefix, suffix) => `${prefix}${expression}${suffix}`);
    }
    await route.fulfill({ response, body });
  });
  await page.goto("/");
}

async function resolveRea(page: Page) {
  await page.getByRole("button", { name: /Presentar el producto y la cadena de procedencia/ }).click();
  await page.getByRole("button", { name: "Cerrar el informe" }).click();
}

const chipBeforeRea: Snapshot = {
  ...finalVerdict,
  soul: "70",
  eraIndex: "ERAS.length - 2",
  day: "ERAS[ERAS.length - 2].startDay + 2 * DAYS_PER_TURN",
  turnsInEra: "ERAS[ERAS.length - 2].visits - 1",
  current: 'ANOMALIES.find(character => character.id === "anomaly-neuralink")',
  pendingEvent: "null",
};

test("accepting the chip leads to the agent epilogue", async ({ page }) => {
  await openSnapshot(page, chipBeforeRea);
  await page.getByRole("button", { name: /Dejarte instalar el implante/ }).click();
  await page.getByRole("button", { name: "Siguiente visita" }).click();
  await resolveRea(page);
  await expect(page.locator('[data-ending="deprecated"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "@Deprecated", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Ahora t\u00fa tambi\u00e9n eres un agente/ })).toBeVisible();
  await expect(page.locator('[data-ending="win"]')).toHaveCount(0);
});

test("rejecting the chip leads to the regret epilogue", async ({ page }) => {
  await openSnapshot(page, chipBeforeRea);
  await page.getByRole("button", { name: /Echarlo y llamar a legal/ }).click();
  await page.getByRole("button", { name: "Siguiente visita" }).click();
  await resolveRea(page);
  await expect(page.getByRole("heading", { name: /Deber\u00edas haber aceptado el chip/ })).toBeVisible();
  await expect(page.getByText(/Rechazaste el chip/)).toBeVisible();
});

test("an unseen implant leads to Bering, and the ending is terminal", async ({ page }) => {
  await openSnapshot(page, finalVerdict);
  await resolveRea(page);
  await expect(page.getByText(/cangrejo rey en el mar de Bering/)).toBeVisible();
  await expect(page.getByText(/El zero-click ha ganado/)).toBeVisible();
  await page.clock.install();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await page.clock.fastForward(8_000);
  await expect(page.locator('[data-ending="deprecated"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Siguiente visita" })).toHaveCount(0);
});

test("restarting leaves the epilogue and resets to September 2022", async ({ page }) => {
  await openSnapshot(page, { ...finalVerdict, implantDecision: '"accepted"' });
  await resolveRea(page);
  await page.getByRole("button", { name: "Fundar otra vez" }).click();
  await expect(page.locator("header")).toContainText("SEP 2022");
  await expect(page.locator("header")).toContainText("92");
  await expect(page.locator("[data-ending]")).toHaveCount(0);
  await expect(page.locator("main button.choice-btn")).toHaveCount(2);
});

test("the menu remains available after deprecation", async ({ page }) => {
  await openSnapshot(page, finalVerdict);
  await resolveRea(page);
  await page.getByRole("button", { name: "Men\u00fa", exact: true }).click();
  await expect(page.getByRole("button", { name: /Fundar en SEP 2022/ })).toBeVisible();
});

for (const [soul, title] of [[95, "TE COPIARON CON REA"], [10, "ACUSACI\u00d3N DE COPIA"]] as const) {
  test(`REA death takes priority at soul=${soul}`, async ({ page }) => {
    await openSnapshot(page, { ...finalVerdict, soul: String(soul) });
    await page.getByRole("button", { name: /Presentar el producto y la cadena de procedencia/ }).click();
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(page.locator('[data-ending="deprecated"]')).toHaveCount(0);
  });
}

test("Google remains a victory, not a deprecation", async ({ page }) => {
  await openSnapshot(page, { ...finalVerdict, reaResolved: "true", pendingEvent: "null", current: "GOOGLE_CHARACTER" });
  await page.getByRole("button", { name: /VENDER A GOOGLE/ }).click();
  await expect(page.locator('[data-ending="win"]')).toBeVisible();
  await expect(page.locator('[data-ending="deprecated"]')).toHaveCount(0);
});

test("motivation cannot convert a pending death into a safe epilogue", async ({ page }) => {
  await openSnapshot(page, {
    ...finalVerdict,
    meters: "({ vcs: 70, ventas: 70, producto: 70, cultura: 0 })",
    motivationTurns: "2",
  });
  await resolveRea(page);
  await expect(page.locator("[data-ending]")).toHaveCount(0);
  await expect(page.getByText(/MOTIVACI\u00d3N.*1 VISITAS/)).toBeVisible();
  await page.locator("main button.choice-btn").nth(1).click();
  await page.getByRole("button", { name: "Siguiente visita" }).click();
  await expect(page.locator('[data-ending="dead"]')).toBeVisible();
  await expect(page.locator('[data-ending="deprecated"]')).toHaveCount(0);
});

test("recovering from deferred REA reaches the epilogue on automatic advance", async ({ page }) => {
  await openSnapshot(page, {
    ...finalVerdict,
    pendingEvent: "null",
    current: 'ALL_CHARACTERS.find(character => character.id === "co-founder")',
    soul: "80",
    reaResolved: "true",
    motivationTurns: "1",
    deferredDeath: '"rea-copied"',
    implantDecision: '"rejected"',
  });
  await page.locator("main button.choice-btn").nth(1).click();
  await expect(page.locator('[data-ending="deprecated"]')).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText(/Deber\u00edas haberlo aceptado/)).toBeVisible();
});

for (const [width, height] of [[320, 568], [390, 844], [1280, 800]]) {
  test(`the final message fits horizontally at ${width}x${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await openSnapshot(page, finalVerdict);
    await resolveRea(page);
    await expect(page.getByRole("heading", { name: "@Deprecated", exact: true })).toBeVisible();
    const layout = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: innerWidth,
      title: document.getElementById("ending-title")!.getBoundingClientRect().toJSON(),
    }));
    expect(layout.content).toBeLessThanOrEqual(layout.viewport);
    expect(layout.title.left).toBeGreaterThanOrEqual(0);
    expect(layout.title.right).toBeLessThanOrEqual(layout.viewport);
    await page.screenshot({ path: testInfo.outputPath("deprecated.png"), fullPage: true, animations: "disabled" });
    await page.getByRole("button", { name: "Fundar otra vez" }).click();
    await expect(page.locator("[data-ending]")).toHaveCount(0);
  });
}