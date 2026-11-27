// Prueba de extremo a extremo del CLUB DEL CABLE en navegador.
//
// Dos navegadores aislados (cada uno con su partida, como dos máquinas distintas) ejecutan el
// juego real. Lo único simulado es el cable: se sustituye navigator.serial por un puerto falso
// cuyos bytes se llevan de una página a la otra, tal cual, a través de Node.
//
//   node tests/cable-link-saves (ver cable-link-saves.ts) genera las partidas de prueba.
//   PLAYWRIGHT_MODULE=playwright-core CABLE_SAVES=/tmp/pw/saves node tests/cable-link-browser.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const SAVES = process.env.CABLE_SAVES || '/tmp/pw/saves';
const html = fs.readFileSync(process.env.DIST_HTML || 'dist/index.html');
const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
}).listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const url = `http://127.0.0.1:${server.address().port}/`;

/** Puerto serie falso: mismos streams y mismas reglas de cierre que el de Chrome. */
const FAKE_SERIAL = () => {
  let ctrl = null;
  const port = {
    readable: null,
    writable: null,
    getInfo: () => ({ usbVendorId: 0x0403, usbProductId: 0x6001 }),
    async open(options) {
      window.__cableOpen = options;
      this.readable = new ReadableStream({ start(c) { ctrl = c; } });
      this.writable = new WritableStream({ write(chunk) { window.__cableTx(Array.from(chunk)); } });
    },
    async close() {
      if (this.readable?.locked || this.writable?.locked) throw new DOMException('puerto con candado', 'InvalidStateError');
      this.readable = null;
      this.writable = null;
      ctrl = null;
      window.__cableClosed = (window.__cableClosed || 0) + 1;
    },
    async setSignals() {},
  };
  window.__cableRx = (bytes) => { if (ctrl) ctrl.enqueue(new Uint8Array(bytes)); };
  Object.defineProperty(navigator, 'serial', { configurable: true, value: { requestPort: async () => port, getPorts: async () => [] } });
};

const errors = [];
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

async function machine(saveName) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 820 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${saveName}: ${e.message}`));
  await page.addInitScript((json) => { if (!localStorage.getItem('magomon.local.v1')) localStorage.setItem('magomon.local.v1', json); }, fs.readFileSync(`${SAVES}/${saveName}.json`, 'utf8'));
  await page.addInitScript(FAKE_SERIAL);
  return page;
}

/** El cable: lo que una página escribe en su puerto llega, en orden, al puerto de la otra. */
async function wire(a, b) {
  let toA = Promise.resolve();
  let toB = Promise.resolve();
  let bytes = 0;
  await a.exposeFunction('__cableTx', (arr) => { bytes += arr.length; toB = toB.then(() => b.evaluate((x) => window.__cableRx(x), arr)).catch(() => {}); });
  await b.exposeFunction('__cableTx', (arr) => { bytes += arr.length; toA = toA.then(() => a.evaluate((x) => window.__cableRx(x), arr)).catch(() => {}); });
  return { bytes: () => bytes };
}

const data = (page, k) => page.evaluate((key) => document.querySelector('canvas[data-map]')?.dataset[key] ?? null, k);
const waitData = (page, k, v, timeout = 8000) =>
  page.waitForFunction(([key, val]) => document.querySelector('canvas[data-map]')?.dataset[key] === val, [k, v], { polling: 100, timeout });
const tap = async (page, key) => { await page.keyboard.down(key); await page.waitForTimeout(60); await page.keyboard.up(key); await page.waitForTimeout(70); };
const hold = async (page, key, ms) => { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); await page.waitForTimeout(120); };
const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('magomon.local.v1')));
const count = (s, id) => [...s.deck, ...s.pc].filter((c) => c === id).length;
const ok = (name) => console.log('ok - ' + name);

async function start(page, map) {
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('canvas[data-map]', { timeout: 15000 });
  for (let i = 0; i < 25 && (await data(page, 'phase')) !== 'exploración'; i++) { await tap(page, 'z'); await page.waitForTimeout(160); }
  assert.equal(await data(page, 'phase'), 'exploración');
  assert.equal(await data(page, 'map'), map);
}

try {
  // ------------------------------------------------------------------ 0. el combate de un jugador sigue como siempre
  {
    const solo = await machine('stairsChampion');
    await start(solo, 'parrandero');
    await solo.getByRole('button', { name: 'START' }).click(); await solo.getByRole('button', { name: /PARTIDA/ }).click();
    await solo.getByRole('button', { name: 'Saltos rápidos' }).click();
    await solo.getByRole('button', { name: /Duelo de prueba/ }).click();
    await solo.getByRole('button', { name: 'BARAJAR Y ROBAR 7' }).click({ timeout: 10000 });
    for (const name of ['x1', 'x2', 'x4', 'PAUSA', 'LOG']) await solo.getByRole('button', { name, exact: true }).waitFor({ timeout: 5000 });
    assert.equal(await solo.getByText('⇄ CABLE').count(), 0, 'fuera del Club no hay modo cable');
    await solo.getByRole('button', { name: 'x4', exact: true }).click();
    await solo.getByRole('button', { name: 'REVANCHA' }).waitFor({ timeout: 300000 });
    ok('combate normal de un jugador: intro, velocidad, pausa y final intactos');
    await solo.context().close();
  }

  // ------------------------------------------------------------------ 1. la escalera
  {
    const rookie = await machine('stairsRookie');
    await start(rookie, 'parrandero');
    const before = await data(rookie, 'position');
    await hold(rookie, 'ArrowUp', 350);
    await waitData(rookie, 'phase', 'diálogo');
    assert.equal(await data(rookie, 'map'), 'parrandero');
    assert.match(await data(rookie, 'dialogue'), /CLUB DEL CABLE/); // el cuadro pagina: «SOLO CAMPEONES» va en la página siguiente
    for (let i = 0; i < 6 && (await data(rookie, 'phase')) !== 'exploración'; i++) await tap(rookie, 'z');
    assert.equal(await data(rookie, 'position'), before, 'la cadena te devuelve a donde estabas');
    await rookie.context().close();

    const champ = await machine('stairsChampion');
    await start(champ, 'parrandero');
    await hold(champ, 'ArrowUp', 350);
    await waitData(champ, 'map', 'parrandero_2');
    await waitData(champ, 'phase', 'exploración');
    await hold(champ, 'ArrowDown', 350);
    await waitData(champ, 'map', 'parrandero');
    await champ.context().close();
    ok('escalera: cadena y aviso para quien no es campeón; el campeón sube al Club y vuelve a bajar');
  }

  // ------------------------------------------------------------------ 2. sala de intercambio
  {
    const A = await machine('tradeA');
    const B = await machine('tradeB');
    const cable = await wire(A, B);
    await Promise.all([start(A, 'parrandero_2'), start(B, 'parrandero_2')]);
    const [a0, b0] = [await stored(A), await stored(B)];
    for (const p of [A, B]) {
      await tap(p, 'z'); // de pie ante la mesa del cable
      await p.getByText('CLUB DEL CABLE · SALA DE INTERCAMBIO').waitFor({ timeout: 6000 });
    }
    const still = await data(A, 'position');
    await hold(A, 'ArrowDown', 300);
    assert.equal(await data(A, 'position'), still, 'con la ventana abierta el mundo está en pausa');
    await A.getByRole('button', { name: /QUE CABLE NECESITO/ }).click();
    await A.getByText(/NULL-MODEM/).first().waitFor();

    for (const p of [A, B]) await p.getByRole('button', { name: /PUERTO SERIE/ }).click();
    for (const p of [A, B]) await p.getByText('TUS MAGOMONES (MAZO + PC)').waitFor({ timeout: 10000 });
    assert.deepEqual(await A.evaluate(() => [window.__cableOpen.baudRate, window.__cableOpen.parity]), [115200, 'none']);
    const roles = await Promise.all([A, B].map((p) => p.getByText(/ANFITRION|INVITADO/).first().innerText()));
    assert.ok(/ANFITRION/.test(roles.join(' ')) && /INVITADO/.test(roles.join(' ')), 'un anfitrión y un invitado');

    await A.locator('button', { hasText: /^TITAN DEL TEIDEx\d+$/ }).click();
    await B.locator('button', { hasText: /^LEVIATAN DE BAJAMARx\d+$/ }).click();
    await A.getByText('LEVIATAN DE BAJAMAR').first().waitFor({ timeout: 6000 });
    await B.getByText('TITAN DEL TEIDE').first().waitFor({ timeout: 6000 });
    await A.getByRole('button', { name: 'CONFIRMAR INTERCAMBIO' }).click();
    await B.getByText('TE OFRECEN · ✔ CONFIRMADO').waitFor({ timeout: 6000 });
    assert.deepEqual([count(await stored(A), 'cabra_titan_teide'), count(await stored(B), 'leviatan_bajamar')],
      [count(a0, 'cabra_titan_teide'), count(b0, 'leviatan_bajamar')], 'con una sola confirmación no se mueve nada');
    await B.getByRole('button', { name: 'CONFIRMAR INTERCAMBIO' }).click();
    for (const p of [A, B]) await p.getByText(/INTERCAMBIO HECHO/).waitFor({ timeout: 10000 });

    const [a1, b1] = [await stored(A), await stored(B)];
    assert.deepEqual(
      [count(a1, 'cabra_titan_teide') - count(a0, 'cabra_titan_teide'), count(a1, 'leviatan_bajamar') - count(a0, 'leviatan_bajamar'),
        count(b1, 'cabra_titan_teide') - count(b0, 'cabra_titan_teide'), count(b1, 'leviatan_bajamar') - count(b0, 'leviatan_bajamar')],
      [-1, +1, +1, -1], 'las cartas cambian de máquina y quedan guardadas');
    assert.deepEqual([a1.linkStats.trades, b1.linkStats.trades], [1, 1]);
    assert.equal(a1.deck.length + a1.pc.length, a0.deck.length + a0.pc.length);

    await A.getByRole('button', { name: 'SALIR' }).click();
    await A.getByText('CLUB DEL CABLE · SALA DE INTERCAMBIO').waitFor({ state: 'detached', timeout: 4000 });
    await A.waitForFunction(() => window.__cableClosed === 1, null, { timeout: 4000 });
    await hold(A, 'ArrowDown', 350);
    assert.notEqual(await data(A, 'position'), still, 'al salir, el mundo vuelve a moverse');
    await B.getByText(/BUSCANDO LA OTRA CONSOLA/).waitFor({ timeout: 15000 });
    ok(`intercambio real entre dos navegadores por el puerto serie (${cable.bytes()} bytes por el cable), guardado en los dos y puerto cerrado limpio`);
    await A.context().close();
    await B.context().close();
  }

  // ------------------------------------------------------------------ 3. sala de combate
  {
    const C = await machine('battleA');
    const D = await machine('battleB');
    const cable = await wire(C, D);
    await Promise.all([start(C, 'parrandero_2'), start(D, 'parrandero_2')]);
    for (const p of [C, D]) {
      await tap(p, 'z');
      await p.getByText('CLUB DEL CABLE · SALA DE COMBATE').waitFor({ timeout: 6000 });
      await p.getByRole('button', { name: /PUERTO SERIE/ }).click();
    }
    for (const p of [C, D]) await p.getByRole('button', { name: /LISTO PARA COMBATIR/ }).waitFor({ timeout: 10000 });
    await C.getByRole('button', { name: /LISTO PARA COMBATIR/ }).click();
    await C.getByText(/ESPERANDO A QUE LA OTRA CONSOLA/).waitFor({ timeout: 6000 });
    await D.getByText(/LISTA, esperando por ti/).waitFor({ timeout: 6000 });
    await D.getByRole('button', { name: /LISTO PARA COMBATIR/ }).click();
    for (const p of [C, D]) await p.getByText('⇄ CABLE').waitFor({ timeout: 10000 });
    const t0 = Date.now();
    for (const p of [C, D]) await p.getByRole('button', { name: 'VOLVER AL CLUB DEL CABLE' }).waitFor({ timeout: 420000 });
    const texts = await Promise.all([C, D].map((p) => p.locator('body').innerText()));
    assert.deepEqual([texts.filter((t) => t.includes('¡VICTORIA!')).length, texts.filter((t) => t.includes('DERROTA')).length], [1, 1], 'una pantalla dice victoria y la otra derrota');
    for (const p of [C, D]) await p.getByRole('button', { name: 'VOLVER AL CLUB DEL CABLE' }).click();
    const marks = await Promise.all([C, D].map(async (p) => (await stored(p)).linkStats));
    assert.deepEqual(marks.map((m) => m.wins + m.losses), [1, 1]);
    assert.equal(marks[0].wins + marks[1].wins, 1, 'un solo ganador en el marcador guardado');
    for (const p of [C, D]) await p.getByText(/COMBATES [01]G-[01]P/).waitFor({ timeout: 4000 });
    for (const p of [C, D]) await p.getByRole('button', { name: /LISTO PARA COMBATIR/ }).waitFor({ timeout: 4000 });
    ok(`combate real entre dos navegadores: ${Math.round((Date.now() - t0) / 1000)} s sincronizados, ${cable.bytes()} bytes por el cable, victoria en uno y derrota en el otro`);
    await C.context().close();
    await D.context().close();
  }

  assert.deepEqual(errors, [], 'sin errores de página');
  console.log('CLUB DEL CABLE EN NAVEGADOR: todo pasa');
} finally {
  await browser.close();
  server.close();
}
