import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

await mkdir("artifacts", { recursive: true });
const URL = "http://localhost:5173/?terms=speedrun";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const errors = [];
const nonGet = [];

async function fresh(init, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport });
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.method() !== "GET") nonGet.push(`${r.method()} ${r.url()}`);
  });
  await page.goto(URL, { waitUntil: "networkidle" });
  return { context, page };
}

const gateOpen = (page) => page.locator("dialog.terms-gate").evaluate((d) => d.open).catch(() => false);
const signed = (page) => page.evaluate(() => sessionStorage.getItem("flashback:terms-of-trip"));

async function passRead(page) {
  const next = page.getByRole("button", { name: /Scroll to the very bottom/ });
  assert.equal(await next.isDisabled(), true, "Continue is locked until scrolled");
  await page.getByTestId("terms-scroll").evaluate((el) => el.scrollTo(0, el.scrollHeight));
  const done = page.getByRole("button", { name: "I have read it (allegedly)" });
  await done.waitFor({ timeout: 6000 });
  await done.click();
}

async function passBoxes(page) {
  // A first wrong submit must be refused with a named box.
  await page.getByRole("button", { name: "Next" }).click();
  assert.match(await page.getByRole("alert").first().textContent(), /Box \d+ is not right/);
  for (let p = 0; p < 6; p++) {
    const items = page.locator(".gate-boxes li");
    assert.equal(await items.count(), 8);
    for (let i = 0; i < 8; i++) {
      const row = items.nth(i);
      const wantUnchecked = (await row.locator(".gate-tag").count()) > 0;
      const box = row.locator("input");
      if ((await box.isChecked()) === wantUnchecked) await box.click();
    }
    await page.getByRole("button", { name: p === 5 ? "Submit all of it" : "Next" }).click();
  }
}

async function passConfirm(page) {
  const order = [];
  const agreeLabels = ["I agree", "Yes, I am not unsure", "Confirm", "Stay", "Accept"];
  for (let r = 0; r < 5; r++) {
    const buttons = page.locator(".gate-confirm .gate-btn");
    const texts = await buttons.allTextContents();
    const xs = await Promise.all(texts.map((_, i) => buttons.nth(i).boundingBox().then((b) => b.x)));
    order.push(texts[xs.indexOf(Math.min(...xs))]);
    if (r === 1) {
      // Clicking the loud button regresses one round.
      await page.getByRole("button", { name: "No, I am unsure" }).click();
      assert.match(await page.getByTestId("confirm-question").textContent(), /agree to everything/);
      assert.match(await page.getByRole("alert").last().textContent(), /\S/);
      await page.getByRole("button", { name: "I agree" }).click();
    }
    await page.getByRole("button", { name: agreeLabels[r], exact: true }).click();
  }
  return order;
}

try {
  // ---------- 1. Gate blocks the app, cannot be escaped ----------
  let { context, page } = await fresh();
  assert.equal(await gateOpen(page), true, "Gate opens on first load");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  assert.equal(await gateOpen(page), true, "Escape cannot close the gate");
  assert.equal(
    await page.evaluate(() => document.querySelector("dialog.terms-gate").textContent.includes("photosensitive epilepsy")),
    true,
    "Real photosensitivity warning is present",
  );
  assert.equal(
    await page.evaluate(() => /substances/i.test(document.querySelector("dialog.terms-gate").textContent)),
    true,
    "Drug-use clauses are present",
  );
  await page.screenshot({ path: "artifacts/gate-read.png" });

  // ---------- 2. Full run, camera denied/unavailable path ----------
  await passRead(page);
  await page.screenshot({ path: "artifacts/gate-boxes.png" });
  // The "select all" trap must not help.
  await page.getByLabel(/Select all on this page/).click();
  await page.getByRole("button", { name: "Next" }).click();
  assert.match(await page.getByRole("alert").first().textContent(), /Box \d+ is not right/);
  await page.getByLabel(/Select all on this page/).evaluate((el) => (el.checked = false));
  await passBoxes(page);

  await page.getByRole("button", { name: "No thanks, I enjoy being suspected" }).waitFor();
  const denyBox = await page.getByRole("button", { name: "No thanks, I enjoy being suspected" }).boundingBox();
  const allowBox = await page.getByRole("button", { name: "Allow camera and microphone" }).boundingBox();
  assert.ok(denyBox.x < allowBox.x, "Deny sits first on screen");
  assert.ok(denyBox.height > allowBox.height, "Deny is the big one");
  await page.getByRole("button", { name: "Allow camera and microphone" }).click();
  await page.getByText(/Please stare at nothing/).waitFor({ timeout: 5000 });
  const stare = page.getByRole("button", { name: "I have stared" });
  await stare.waitFor({ timeout: 5000 });
  await page.waitForFunction(() => !document.querySelector(".gate-actions button[disabled]"), null, { timeout: 5000 });
  await stare.click();

  const order = await passConfirm(page);
  assert.deepEqual(order, ["I disagree", "Yes, I am not unsure", "Cancel", "Stay", "Deny"], "Inverted order each round");
  await page.getByText("You may proceed.").waitFor();
  assert.match(await page.locator(".gate-done-title + p").textContent(), /nothing was tracked/);
  await page.screenshot({ path: "artifacts/gate-done.png" });
  await page.getByRole("button", { name: "Enter, at my own risk" }).click();
  assert.equal(await gateOpen(page), false);
  assert.equal(await signed(page), "1");
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await gateOpen(page), false, "Signed state persists for the session");
  await context.close();

  // ---------- 3. Camera granted path: tracks are stopped instantly, dots work ----------
  ({ context, page } = await fresh(() => {
    window.__tracks = [];
    window.__gum = 0;
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      window.__gum++;
      const mk = (kind) => ({ kind, stopped: false, stop() { this.stopped = true; } });
      const tracks = [];
      if (constraints.video) tracks.push(mk("video"));
      if (constraints.audio) tracks.push(mk("audio"));
      window.__tracks.push(...tracks);
      return { getTracks: () => tracks };
    };
  }));
  await passRead(page);
  await passBoxes(page);
  await page.getByRole("button", { name: "Allow camera and microphone" }).click();
  await page.getByText(/Calibration: look at each dot/).waitFor();
  const stoppedAtOnce = await page.evaluate(() => window.__tracks.length === 2 && window.__tracks.every((t) => t.stopped));
  assert.equal(stoppedAtOnce, true, "Camera and mic tracks are stopped immediately");
  for (let i = 0; i < 5; i++) await page.locator(".gate-dot").click();
  await page.getByRole("button", { name: "Continue" }).waitFor({ timeout: 6000 });
  assert.equal(await page.evaluate(() => window.__gum), 1, "Media requested exactly once");
  await page.getByRole("button", { name: "Continue" }).click();
  await passConfirm(page);
  await page.getByRole("button", { name: "Enter, at my own risk" }).click();
  assert.equal(await gateOpen(page), false);
  await context.close();

  // ---------- 4. Veterans' lane: typed phrase ----------
  ({ context, page } = await fresh());
  await page.getByRole("button", { name: /Veterans' lane/ }).click();
  const field = page.getByPlaceholder("I take drugs, seriously");
  await field.fill("I don't take drugs seriously");
  await page.getByRole("button", { name: "Go", exact: true }).click();
  assert.equal(await gateOpen(page), true, "Negated phrase is rejected");
  await field.fill("I take drugs");
  await field.press("Enter");
  assert.equal(await gateOpen(page), true, "Half a phrase is rejected");
  await field.fill("I take drugs, seriously");
  await field.press("Enter");
  await page.getByText(/Welcome back, veteran/).waitFor();
  await page.waitForFunction(() => !document.querySelector("dialog.terms-gate"), null, { timeout: 4000 });
  assert.equal(await signed(page), "1");
  await context.close();

  // Spanish
  ({ context, page } = await fresh());
  await page.getByRole("button", { name: /Veterans' lane/ }).click();
  await page.getByPlaceholder("I take drugs, seriously").fill("Tomo drogas, en serio");
  await page.getByRole("button", { name: "Go", exact: true }).click();
  await page.waitForFunction(() => !document.querySelector("dialog.terms-gate"), null, { timeout: 4000 });
  await context.close();

  // ---------- 5. Veterans' lane: spoken phrase (stubbed recognizer) ----------
  const stub = (behavior) => () => {
    window.SpeechRecognition = window.webkitSpeechRecognition = class {
      start() {
        window.__srLang = this.lang;
        setTimeout(() => {
          if (window.__srBehavior === "error") {
            this.onerror?.({ error: "not-allowed" });
          } else {
            const said = window.__srBehavior === "wrong" ? "hello there" : "i take drugs seriously";
            this.onresult?.({ results: [[{ transcript: said }]] });
          }
          this.onend?.();
        }, 50);
      }
      abort() {}
    };
    window.__srBehavior = "";
  };
  ({ context, page } = await fresh(stub()));
  await page.getByRole("button", { name: /Veterans' lane/ }).click();
  await page.evaluate(() => (window.__srBehavior = "error"));
  await page.getByRole("button", { name: "Say it" }).click();
  await page.getByText(/Microphone blocked/).waitFor();
  await page.evaluate(() => (window.__srBehavior = "wrong"));
  await page.getByRole("button", { name: "Say it" }).click();
  await page.getByText(/That is not it/).waitFor();
  assert.equal(await gateOpen(page), true);
  await page.getByRole("button", { name: "Switch recognition language" }).click();
  await page.evaluate(() => (window.__srBehavior = "right"));
  await page.getByRole("button", { name: "Say it" }).click();
  assert.equal(await page.evaluate(() => window.__srLang), "es-ES", "Language toggle reaches the recognizer");
  await page.getByText(/Welcome back, veteran/).waitFor();
  await page.waitForFunction(() => !document.querySelector("dialog.terms-gate"), null, { timeout: 4000 });
  await context.close();

  // ---------- 6. Playback is locked while unsigned, and the old warning still follows ----------
  ({ context, page } = await fresh());
  await page.evaluate(() => document.querySelector("#message")?.blur());
  await page.keyboard.press("Space");
  await page.waitForTimeout(250);
  assert.equal(await page.locator(".rave-app").getAttribute("data-live"), "false", "Space cannot start playback behind the gate");
  await context.close();

  // ---------- 7. Mobile + reduced motion ----------
  ({ context, page } = await fresh(null, { width: 390, height: 844 }));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "No page overflow at 390px");
  const box = await page.locator("dialog.terms-gate").boundingBox();
  assert.ok(box.width <= 390 && box.height <= 844, "Gate fits a phone screen");
  await page.screenshot({ path: "artifacts/gate-mobile.png" });
  await passRead(page);
  await page.screenshot({ path: "artifacts/gate-mobile-boxes.png" });
  const dialogOverflow = await page.locator(".gate-body").evaluate((el) => el.scrollWidth <= el.clientWidth);
  assert.ok(dialogOverflow, "No horizontal overflow inside the gate on a phone");
  await context.close();

  assert.deepEqual(nonGet, [], "No data is ever POSTed anywhere");
  assert.deepEqual(errors, [], "No runtime errors");
  console.log("PASS: gate blocks app, unescapable, boxes+traps, inverted buttons, camera stop-at-once, deny path, veteran lane (typed/spoken/ES), persistence, mobile.");
} finally {
  await browser.close();
}
