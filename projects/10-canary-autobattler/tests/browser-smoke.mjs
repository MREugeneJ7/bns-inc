import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4177';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

await page.addInitScript(() => {
  window.__gameText = new Set();
  const original = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
    if (String(text).includes('RAYCO: Ya me ganaste')) window.__gameText.add(String(text));
    return original.call(this, text, ...args);
  };
});

async function openSave() {
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: /PARTIDA/ }).click();
  await page.getByText('GUARDAR SAVE-FILE').waitFor();
}

async function exportSave() {
  await openSave();
  const text = await page.locator('a[download="magomon_save.json"]').evaluate((link) => fetch(link.href).then((response) => response.text()));
  return JSON.parse(text);
}

async function importSave(state, alreadyOpen = false) {
  if (!alreadyOpen) await openSave();
  await page.getByRole('textbox', { name: 'Partida en JSON' }).fill(JSON.stringify(state));
  await page.getByRole('button', { name: 'Cargar', exact: true }).click();
  await page.waitForTimeout(250);
}

async function reachTrainerBattle() {
  for (let i = 0; i < 36; i++) {
    if (await page.getByRole('button', { name: 'BARAJAR Y ROBAR 7' }).isVisible().catch(() => false)) return;
    await page.keyboard.press('z');
    await page.waitForTimeout(120);
  }
  throw new Error('El entrenador no ha abierto el combate');
}

try {
  await page.goto(baseURL, { waitUntil: 'networkidle' });

  await openSave();
  await page.getByRole('button', { name: 'Saltos rápidos' }).click();
  await page.locator('select').selectOption('angelote');
  await page.getByRole('button', { name: /Campus ULL.*Gimnasio 01/ }).click();
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: 'PC DE AYOZE', exact: true }).click();
  await page.getByText('KRAKEN DE ANAGA', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'CERRAR', exact: true }).click();
  let state = await exportSave();
  assert.equal(state.mapId, 'subida');
  assert.equal(state.starter, 'angelote');
  assert.equal(state.deck.length, 26);
  assert.ok(state.deck.includes('kraken_anaga'));
  const gymDeck = [...state.deck];
  console.log('ok - salto al gimnasio con mazo mejorado del starter elegido');

  const pack = {
    trainerId: 'chacho_portal', trainerName: 'RAYCO', purse: 5,
    cards: ['baifo', 'lagarto', 'chola', 'tierra_playa', 'pinzon'],
  };
  state.deck = [...Array(56).fill('tierra_volcan'), ...Array(4).fill('baifo')];
  state.pc = [];
  state.pendingBooster = pack;
  state.beaten.chacho_portal = 1;
  await importSave(state, true);
  await page.getByRole('dialog', { name: 'ELIGE 1 DE 5' }).waitFor();
  await page.getByRole('button', { name: 'Elegir Baifo, carta 1 de 5' }).waitFor({ state: 'visible' });
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: 'Elegir Baifo, carta 1 de 5' }).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.getByRole('button', { name: 'ANADIR AL MAZO' }).count(), 0);
  await page.getByText(/60 -> 57\/60/).waitFor();
  if (process.env.SCREENSHOT_PATH) {
    await page.waitForTimeout(200);
    await page.screenshot({ path: process.env.SCREENSHOT_PATH });
  }
  await page.getByRole('button', { name: 'EVOLUCIONAR' }).click();
  await page.getByText('EVOLUCION COMPLETADA', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'CERRAR SOBRE' }).click();
  state = await exportSave();
  assert.equal(state.deck.length, 57);
  assert.equal(state.deck.filter((id) => id === 'baifo').length, 0);
  assert.equal(state.deck.filter((id) => id === 'cabra').length, 1);
  assert.equal(state.pc.length, 0);
  assert.equal(state.pendingBooster, null);
  console.log('ok - sobre 1 de 5: evolucion directa con mazo lleno, sin obtener otras cartas');

  state.deck = [...Array(10).fill('tierra_volcan'), ...Array(4).fill('baifo')];
  state.pc = [];
  state.pendingBooster = pack;
  await importSave(state, true);
  await page.getByRole('dialog', { name: 'ELIGE 1 DE 5' }).waitFor();
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: 'Elegir Baifo, carta 1 de 5' }).click();
  await page.getByRole('button', { name: 'GUARDAR EN PC' }).click();
  await page.getByText('CARTA ELEGIDA', { exact: true }).waitFor();
  assert.equal(await page.getByText(/Tienes 5 copias de esto/).count(), 0);
  await page.getByRole('button', { name: 'CERRAR SOBRE' }).click();
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: 'PC DE AYOZE', exact: true }).click();
  await page.getByRole('button', { name: 'COMBINAR (1)' }).click();
  await page.getByRole('button', { name: 'COMBINAR', exact: true }).click();
  await page.getByText('¡EVOLUCION!', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'CERRAR', exact: true }).click();
  state = await exportSave();
  assert.equal(state.deck.filter((id) => id === 'cabra').length, 1);
  assert.equal(state.deck.filter((id) => id === 'baifo').length, 0);
  assert.equal(state.pc.length, 0);
  console.log('ok - guardar la quinta copia en PC es opcional; combinacion posterior funcional');

  state.mapId = 'calle';
  state.playerPos = { x: 72, y: 4, dir: 'right' };
  state.beaten = { chacho_portal: 1 };
  state.duros = 0;
  state.pendingBooster = null;
  await importSave(state, true);
  await page.keyboard.press('z');
  await page.waitForFunction(() => [...window.__gameText].some((line) => line.includes('Ya me ganaste')), undefined, { timeout: 5000 });
  assert.equal(await page.getByRole('button', { name: 'BARAJAR Y ROBAR 7' }).count(), 0);
  console.log('ok - entrenador ya ganado responde sin ofrecer combate');

  state.beaten = {};
  state.deck = Array(24).fill('tierra_volcan');
  state.duros = 0;
  await importSave(state);
  await reachTrainerBattle();
  await page.getByText(/SIN RIESGO \(0D\)/).waitFor();
  await page.getByRole('button', { name: 'BARAJAR Y ROBAR 7' }).click();
  await page.getByRole('button', { name: 'x4', exact: true }).click();
  await page.getByRole('button', { name: 'IR AL CENTRO PARRANDERO' }).waitFor({ timeout: 90000 });
  await page.getByRole('button', { name: 'IR AL CENTRO PARRANDERO' }).click();
  await page.waitForTimeout(300);
  state = await exportSave();
  assert.equal(state.mapId, 'parrandero');
  assert.equal(state.duros, 0);
  assert.equal(state.beaten.chacho_portal, undefined);
  state.mapId = 'calle';
  state.playerPos = { x: 72, y: 4, dir: 'right' };
  await importSave(state, true);
  await reachTrainerBattle();
  await page.getByText(/SIN RIESGO \(0D\)/).waitFor();
  console.log('ok - perder con cero duros lleva al centro y permite retar al mismo entrenador');

  let won = false;
  for (let attempt = 0; attempt < 3 && !won; attempt++) {
    state.mapId = 'calle';
    state.playerPos = { x: 72, y: 4, dir: 'right' };
    state.deck = [...gymDeck];
    state.pc = [];
    state.beaten = {};
    state.duros = 0;
    state.pendingBooster = null;
    await importSave(state);
    await reachTrainerBattle();
    await page.getByText(/SIN RIESGO \(0D\)/).waitFor();
    await page.getByRole('button', { name: 'BARAJAR Y ROBAR 7' }).click();
    await page.getByRole('button', { name: 'x4', exact: true }).click();
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some((button) =>
      button.textContent?.includes('ABRIR SOBRE') || button.textContent?.includes('IR AL CENTRO PARRANDERO')
    ), undefined, { timeout: 90000 });
    won = await page.getByRole('button', { name: 'ABRIR SOBRE' }).isVisible().catch(() => false);
  }
  assert.equal(won, true, 'El mazo mejorado debe poder ganar al entrenador inicial');
  await page.waitForTimeout(250);
  const unclaimed = await exportSave();
  assert.equal(unclaimed.pendingBooster.cards.length, 5);
  assert.equal(unclaimed.beaten.chacho_portal, 1);
  await page.getByRole('button', { name: 'Cerrar partida', exact: true }).click();
  await page.getByRole('button', { name: 'ABRIR SOBRE' }).click();
  await page.getByRole('dialog', { name: 'ELIGE 1 DE 5' }).waitFor();
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: /carta 1 de 5/ }).click();
  await page.getByRole('button', { name: 'GUARDAR EN PC' }).click();
  await page.getByText('CARTA ELEGIDA', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'CERRAR SOBRE' }).click();
  await page.evaluate(() => window.__gameText.clear());
  await page.keyboard.press('z');
  await page.waitForFunction(() => [...window.__gameText].some((line) => line.includes('Ya me ganaste')), undefined, { timeout: 5000 });
  assert.equal(await page.getByRole('button', { name: 'BARAJAR Y ROBAR 7' }).count(), 0);
  state = await exportSave();
  assert.equal(state.duros, 5);
  assert.equal(state.beaten.chacho_portal, 1);
  assert.equal(state.deck.length, gymDeck.length);
  assert.equal(state.pc.length, 1);
  assert.equal(state.pendingBooster, null);
  console.log('ok - ganar con cero duros paga 5 y permite conservar solo una carta');

  assert.deepEqual(errors, []);
  console.log('ok - interfaz movil sin errores de JavaScript');
} finally {
  await browser.close();
}