import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const SIGN = () => window.sessionStorage.setItem("flashback:terms-of-trip", "1");
const context = await browser.newContext({
  viewport: { width: 1440, height: 1020 },
  permissions: ["clipboard-read", "clipboard-write"],
});
await context.addInitScript(SIGN);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.addInitScript(() => {
  window.__audioContexts = [];
  window.__analysers = [];
  window.__oscillators = [];
  const NativeContext = window.AudioContext;
  window.AudioContext = class extends NativeContext {
    constructor(...args) {
      super(...args);
      window.__audioContexts.push(this);
    }
    createAnalyser() {
      const node = super.createAnalyser();
      window.__analysers.push(node);
      return node;
    }
    createOscillator() {
      const node = super.createOscillator();
      window.__oscillators.push(node);
      return node;
    }
  };
});
const isPlaying = () => page.locator(".rave-app").getAttribute("data-live");
const primary = () =>
  page
    .locator(".rave-app")
    .evaluate((node) => node.style.getPropertyValue("--primary"));
const position = () =>
  page
    .locator(".tape-playhead")
    .evaluate((node) =>
      Number.parseFloat(node.style.transform.match(/[\d.]+/)[0]),
    );
const audioLevel = () =>
  page.evaluate(() => {
    const analyser = window.__analysers.at(-1);
    if (!analyser) return 0;
    const values = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(values);
    return Math.sqrt(
      values.reduce((sum, value) => sum + value * value, 0) / values.length,
    );
  });

try {
  await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  assert.match(await page.title(), /After Hours/);
  assert.equal(await page.locator("#message").inputValue(), "hello world");
  assert.equal(
    await page.locator(".morse-readout").textContent(),
    ".... . .-.. .-.. --- / .-- --- .-. .-.. -..",
  );
  assert.equal(
    await page.evaluate(() => window.__audioContexts.length),
    0,
    "No autoplay audio context",
  );
  await page.screenshot({ path: "artifacts/rave-desktop.png", fullPage: true });

  await page.getByRole("button", { name: "Acid laser" }).click();
  assert.equal(await primary(), "#ccff47");
  await page.getByRole("button", { name: "Ultraviolet" }).click();
  assert.equal(await primary(), "#b480ff");
  await page.getByRole("button", { name: "Neon rush" }).click();
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    ".... . .-.. .-.. --- / .-- --- .-. .-.. -..",
  );

  await page.getByRole("button", { name: "Drop the message" }).click();
  assert.equal(
    await page.locator("dialog").evaluate((dialog) => dialog.open),
    true,
  );
  assert.equal(await isPlaying(), "false", "Warning precedes flashing");
  await page.keyboard.press("Escape");
  assert.equal(
    await page.locator("dialog").evaluate((dialog) => dialog.open),
    false,
    "Escape dismisses the safety dialog without starting playback",
  );
  await page.getByRole("button", { name: "Drop the message" }).click();
  await page.getByRole("button", { name: "Use flashing lights" }).click();
  await page.waitForTimeout(450);
  assert.equal(await isPlaying(), "true");
  assert.ok(
    (await audioLevel()) > 0.001,
    "Synthesized sound reaches the analyser",
  );
  assert.ok(
    await page.evaluate(() =>
      window.__oscillators.some((node) => node.type === "square"),
    ),
  );
  const colors = await page.evaluate(async () => {
    const seen = new Set();
    for (let i = 0; i < 30; i++) {
      seen.add(
        document.querySelector(".rave-app").style.getPropertyValue("--signal"),
      );
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    return [...seen];
  });
  assert.ok(
    colors.length >= 2,
    "Morse pulses alternate the selected neon colors",
  );
  await page.screenshot({ path: "artifacts/rave-live.png", fullPage: true });

  await page.getByRole("button", { name: /Acid 303/ }).click();
  await page.waitForTimeout(220);
  assert.equal(
    await isPlaying(),
    "true",
    "Sound changes do not reset transport",
  );
  assert.ok(
    await page.evaluate(() =>
      window.__oscillators.some((node) => node.type === "sawtooth"),
    ),
  );
  await page.getByRole("button", { name: /Afterglow/ }).click();
  await page.waitForTimeout(450);
  assert.ok(
    await page.evaluate(() =>
      window.__oscillators.some((node) => node.detune.value === 12),
    ),
    "Trance has detuned supersaws",
  );

  await page.getByRole("button", { name: "Mute sound" }).click();
  await page.waitForTimeout(280);
  assert.ok(
    (await audioLevel()) < 0.000001,
    "Mute silences the full mix including echo",
  );
  await page.getByRole("button", { name: "Enable sound" }).click();
  await page.waitForTimeout(200);
  assert.ok((await audioLevel()) > 0);

  await page.getByRole("switch", { name: "Lights", exact: true }).click();
  assert.equal(
    await page.locator(".rave-app").getAttribute("data-lights"),
    "false",
  );
  await page.getByRole("switch", { name: "Lights", exact: true }).click();
  await page.getByRole("button", { name: "Soft glow", exact: true }).click();
  assert.equal(
    await page.locator(".rave-app").getAttribute("data-soft"),
    "true",
  );
  assert.equal(
    await page
      .locator(".stage-beams")
      .evaluate((node) => getComputedStyle(node).display),
    "none",
  );

  await page.getByRole("button", { name: "Pause the rave" }).click();
  const pausedPosition = await position();
  await page.waitForTimeout(250);
  assert.equal(await position(), pausedPosition);
  assert.equal(await isPlaying(), "false");
  await page.getByRole("button", { name: "Keep it going" }).click();
  await page.waitForTimeout(500);
  const resumedPosition = await position();
  assert.ok(
    resumedPosition > pausedPosition && resumedPosition - pausedPosition < 12,
    "Resume keeps visual and audio offsets aligned",
  );

  await page.getByRole("button", { name: "Expand light room" }).click();
  const bounds = await page.locator(".light-panel").boundingBox();
  assert.equal(Math.round(bounds.x), 16);
  assert.equal(Math.round(bounds.y), 16);
  assert.equal(Math.round(bounds.width), 1408);
  await page.screenshot({ path: "artifacts/rave-immersive.png" });
  await page.keyboard.press("Escape");
  assert.equal(await isPlaying(), "false");
  assert.equal(
    await page.locator(".light-panel").getAttribute("aria-modal"),
    null,
  );

  await page.locator("#message").fill("E");
  await page.getByRole("button", { name: "Repeat message" }).click();
  await page.getByRole("button", { name: "Drop the message" }).click();
  await page.waitForTimeout(270);
  await page.getByRole("button", { name: "Stop transmission" }).click();
  const countAtStop = await page.evaluate(() => window.__oscillators.length);
  await page.waitForTimeout(800);
  assert.equal(
    await page.evaluate(() => window.__oscillators.length),
    countAtStop,
    "Stopping cancels pending loop restarts",
  );
  assert.equal(await isPlaying(), "false");
  await page.getByRole("button", { name: "Repeat message" }).click();

  await page.locator("#message").fill("");
  assert.equal(
    await page.getByRole("button", { name: "Drop the message" }).isDisabled(),
    true,
  );
  await page.locator("#message").fill("\u2603");
  assert.equal(
    await page.getByRole("button", { name: "Drop the message" }).isDisabled(),
    true,
  );
  await page.locator("#message").fill("HELLO");
  await page.locator("#message").press("Space");
  assert.equal(
    await isPlaying(),
    "false",
    "Typing spaces never starts playback",
  );
  await page.getByRole("button", { name: "Fine-tune" }).click();
  await page.getByRole("switch", { name: /Beat-locked Morse/ }).click();
  assert.equal(
    await page.getByRole("slider", { name: /^MORSE SPEED/ }).isDisabled(),
    false,
  );
  await page.getByRole("button", { name: "MORSE TOOLS" }).click();
  const key = page.getByRole("button", { name: "Hold to key a Morse signal" });
  await key.focus();
  await page.keyboard.down("Enter");
  await page.waitForTimeout(70);
  await page.keyboard.up("Enter");
  await page.waitForTimeout(360);
  assert.equal((await page.locator(".key-output").textContent()).trim(), "E");
  await page.getByRole("button", { name: "Add to message" }).click();
  assert.match(await page.locator("#message").inputValue(), / E$/);
  await page.getByRole("button", { name: "MORSE TOOLS" }).click();
  await page.getByRole("button", { name: "Fine-tune" }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/rave-mobile.png", fullPage: true });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "No mobile horizontal overflow",
  );
  for (const width of [320, 560, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `No overflow at ${width}px`,
    );
  }

  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  await reduced.addInitScript(SIGN);
  const reducedPage = await reduced.newPage();
  await reducedPage.goto("http://localhost:5173");
  assert.equal(
    await reducedPage.locator(".rave-app").getAttribute("data-soft"),
    "true",
  );
  await reducedPage.getByRole("button", { name: "Drop the message" }).click();
  assert.equal(
    await reducedPage.locator("dialog").evaluate((dialog) => dialog.open),
    false,
  );
  await reducedPage.keyboard.press("Escape");
  await reduced.close();

  // --- The rabbit hole -------------------------------------------------
  await page.setViewportSize({ width: 1440, height: 1020 });
  const tripValue = () =>
    page.locator(".rave-app").evaluate((node) => Number(node.style.getPropertyValue("--trip") || 0));
  await page.locator("#message").fill("RAVE ON");
  await page.getByRole("button", { name: "Soft glow", exact: true }).click(); // back to full lights
  await page.getByRole("radio", { name: /Instant Dal/ }).click();
  await page.getByRole("button", { name: "Loop it" }).click();
  await page.getByRole("button", { name: "Drop the message" }).click();
  await page.waitForTimeout(2000);
  const risen = await tripValue();
  assert.ok(risen > 0.04, `Trip rises while looping (got ${risen})`);
  await page.getByRole("switch", { name: "Escalate" }).click();
  await page.waitForTimeout(1200);
  assert.ok((await tripValue()) < risen, "Turning escalation off brings it down");
  await page.getByRole("switch", { name: "Escalate" }).click();
  await page.getByRole("button", { name: "Stop transmission" }).click();
  await page.waitForTimeout(1500);
  assert.equal(await tripValue(), 0, "Stopping comes all the way down");

  const deep = await context.newPage();
  deep.on("pageerror", (error) => errors.push(error.message));
  await deep.goto("http://localhost:5173/?trip=0.95", { waitUntil: "networkidle" });
  await deep.getByRole("button", { name: "Repeat message" }).click();
  await deep.getByRole("button", { name: "Drop the message" }).click();
  await deep.getByRole("button", { name: "Use flashing lights" }).click();
  await deep.waitForTimeout(1500);
  assert.equal(await deep.locator(".rave-app").getAttribute("data-trip-level"), "5");
  assert.match(await deep.locator(".trip-level-name").textContent(), /Full Dal/);
  assert.ok(await deep.locator(".rave-lamp.has-mustache").count(), "Mustache appears");
  assert.ok(Number(await deep.locator("#melt feDisplacementMap").getAttribute("scale")) > 20, "Melt filter is active");
  assert.ok(await deep.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "No overflow while tripping");
  await deep.screenshot({ path: "artifacts/rave-full-dali.png", fullPage: true });
  await deep.getByRole("button", { name: "Come down" }).click();
  await deep.waitForTimeout(2800);
  assert.equal(await deep.locator(".rave-app").getAttribute("data-trip-level"), "0", "Come down works mid-loop");
  await deep.close();

  // --- Bad trip: bad words, 1% roll, forced loop, tetric audio, phobia projections ---
  const badPage = await context.newPage();
  badPage.on("pageerror", (error) => errors.push(error.message));
  await badPage.goto("http://localhost:5173", { waitUntil: "networkidle" });
  const repeatBtn = badPage.getByRole("button", { name: "Repeat message" });
  assert.equal(await repeatBtn.getAttribute("aria-pressed"), "false");

  // 1. Typing a bad word forces bad trip + locks loop always on
  await badPage.locator("#message").fill("fuck this");
  assert.equal(
    await badPage.locator(".rave-app").getAttribute("data-bad-trip"),
    "true",
    "Bad word triggers bad trip",
  );
  assert.equal(
    await repeatBtn.getAttribute("aria-pressed"),
    "true",
    "Loop button is forced ON during bad trip",
  );
  assert.equal(
    await repeatBtn.isDisabled(),
    true,
    "Loop button cannot be turned off while bad trip is active",
  );
  assert.equal(
    await badPage
      .locator(".rave-app")
      .evaluate((node) => node.style.getPropertyValue("--primary")),
    "#ff1736",
    "Colors shift to dark crimson",
  );

  // Drop the message and verify distorted light cycles through spider, clown, blood
  await badPage.getByRole("button", { name: "Drop the message" }).click();
  await badPage.getByRole("button", { name: "Use flashing lights" }).click();
  const seenPhobias = await badPage.evaluate(async () => {
    const found = new Set();
    for (let i = 0; i < 45; i++) {
      const el = document.querySelector(".phobia-projection");
      if (el) found.add(el.getAttribute("data-phobia"));
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    return [...found];
  });
  assert.ok(seenPhobias.includes("spider"), "Spider silhouette appears in distorted light");
  assert.ok(seenPhobias.includes("clown"), "Clown silhouette appears in distorted light");
  assert.ok(seenPhobias.includes("blood"), "Blood silhouette appears in distorted light");
  await badPage.screenshot({ path: "artifacts/rave-bad-trip.png", fullPage: true });

  // Clearing the bad word exits bad trip and unlocks loop
  await badPage.getByRole("button", { name: "Stop transmission" }).click();
  await badPage.locator("#message").fill("hello world");
  assert.equal(
    await badPage.locator(".rave-app").getAttribute("data-bad-trip"),
    "false",
  );
  assert.equal(await repeatBtn.isDisabled(), false, "Loop unlocks when bad words are removed");
  assert.equal(await repeatBtn.getAttribute("aria-pressed"), "false");

  // 2. Random 1% chance path (?badtrip=1) triggers on play and exits cleanly on Stop
  await badPage.goto("http://localhost:5173/?badtrip=1", { waitUntil: "networkidle" });
  assert.equal(
    await badPage.locator(".rave-app").getAttribute("data-bad-trip"),
    "true",
  );
  assert.equal(
    await badPage.getByRole("button", { name: "Repeat message" }).getAttribute("aria-pressed"),
    "true",
  );
  await badPage.getByRole("button", { name: "Drop the message" }).click();
  await badPage.getByRole("button", { name: "Use flashing lights" }).click();
  await badPage.waitForTimeout(350);
  await badPage.getByRole("button", { name: "Stop transmission" }).click();
  assert.equal(
    await badPage.locator(".rave-app").getAttribute("data-bad-trip"),
    "false",
    "Stopping exits random bad trip",
  );
  await badPage.close();

  assert.deepEqual(errors, [], "No runtime errors");
  console.log(
    "PASS: neon palettes, all synth profiles, live audio, mute, light switches, softer mode, pause/resume, immersive mode, loop cancellation, clipboard, straight key, reduced motion, and responsive widths.",
  );
} finally {
  await browser.close();
}
