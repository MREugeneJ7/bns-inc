import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1366, height: 850 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const canvas = page.locator('canvas[data-map]');
const snapshot = () => page.evaluate(() => JSON.parse(localStorage.getItem('magomon.local.v1')));
const position = (x, y, map = 'veronicas') => page.waitForFunction(({ key, map }) => {
  const c = document.querySelector('canvas[data-map]');
  return c?.dataset.map === map && c.dataset.position === key;
}, { key: `${x},${y}`, map }, { timeout: 6000 });

async function move(dir, x, y, map = 'veronicas') {
  await page.keyboard.down(`Arrow${dir}`);
  try {
    await position(x, y, map);
  } finally {
    await page.keyboard.up(`Arrow${dir}`);
  }
}

async function face(dir) {
  await page.keyboard.down(`Arrow${dir}`);
  await page.waitForTimeout(65);
  await page.keyboard.up(`Arrow${dir}`);
}

async function useItem(name) {
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: /MOCHILA/ }).click();
  await page.getByRole('button', { name, exact: true }).click();
}

const surf = () => useItem('USAR TABLA PUKAS (SURF)');
async function vault(x, y) {
  await useItem('USAR VARA DEL PASTOR (SALTAR)');
  await position(x, y, 'san_borondon');
}

async function dialogue(untilChoice = false) {
  await page.locator('canvas[data-phase="diálogo"]').waitFor();
  const lines = new Set();
  for (let i = 0; i < 75; i++) {
    const state = await canvas.evaluate(c => ({ ...c.dataset }));
    if (state.phase !== 'diálogo' || (untilChoice && state.choice)) return [...lines].join(' ');
    lines.add(state.dialogue);
    await page.keyboard.press('z');
    await page.waitForTimeout(55);
  }
  throw new Error('El diálogo no avanzó');
}

async function declineTrainer(name) {
  await face('Down');
  await page.keyboard.press('z');
  assert.match(await dialogue(true), name);
  await face('Down');
  assert.equal(await canvas.getAttribute('data-choice'), 'AHORA NO');
  await page.keyboard.press('z');
  await dialogue();
}

async function tide(ms, rgb) {
  await page.evaluate(value => { window.__tideTime = value; }, ms);
  // From (42,61), this is the centre of the sand tile at (42,59).
  await page.waitForFunction(expected => {
    const c = document.querySelector('canvas[data-map="veronicas"]');
    return c && [...c.getContext('2d').getImageData(160, 80, 1, 1).data].slice(0, 3).join(',') === expected;
  }, rgb, { timeout: 3000 });
}

try {
  await page.addInitScript(() => {
    localStorage.setItem('magomon.local.v1', JSON.stringify({
      version: 12, mapId: 'veronicas', playerPos: { x: 40, y: 25, dir: 'down' }, starter: 'angelote', duros: 70,
      flags: { starterChosen: true, hm_pukas: true, hm_salto_pastor: true, visited_veronicas: true, errand: true },
      deck: ['angelote', 'choco', 'chola', ...Array(8).fill('tierra_charco'), ...Array(5).fill('tierra_playa')],
    }));
    localStorage.setItem('magomon.mute', '1');
    // Control the tide timestamps without changing the walking or dialogue frame rate.
    window.__tideTime = 0;
    const raf = requestAnimationFrame.bind(window);
    window.requestAnimationFrame = cb => raf(() => cb(window.__tideTime));
  });
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:4177', { waitUntil: 'networkidle' });
  await page.locator('canvas[data-phase="título"]').waitFor();
  await page.keyboard.press('z');
  await page.locator('canvas[data-phase="exploración"]').waitFor();
  await face('Down');
  assert.equal(await canvas.getAttribute('data-position'), '40,25');
  await surf();
  await position(40, 26);
  await move('Down', 40, 35);
  assert.equal(await canvas.getAttribute('data-map'), 'veronicas');
  assert.equal((await snapshot()).flags.pukas_out, true);
  await move('Right', 42, 35);
  await declineTrainer(/LUCÍA/);
  await move('Left', 41, 35);
  await move('Down', 41, 44);
  await move('Right', 47, 44);
  await declineTrainer(/YERAY/);
  console.log('ok - desde Troya, surf en el mismo mapa y retos desde barco y moto');

  await move('Right', 48, 44);
  await move('Down', 48, 61);
  await move('Left', 42, 61);
  await tide(0, '198,154,200');
  await move('Up', 42, 59);
  await move('Down', 42, 61);
  assert.equal((await snapshot()).flags.pukas_out, true);
  await tide(6001, '130,86,141');
  await tide(15001, '198,154,200');
  await tide(21001, '130,86,141');
  await move('Up', 42, 59);
  await position(12, 20, 'san_borondon');
  assert.match(await dialogue(), /SAN BORONDÓN/);
  assert.equal((await snapshot()).flags.pukas_out, false);
  console.log('ok - la cala cambia entre mar y tierra; solo emerge la entrada en la fase visible');

  const island = 'san_borondon';
  await move('Left', 10, 20, island);
  await move('Up', 10, 17, island);
  await move('Left', 9, 17, island);
  await face('Left');
  assert.equal(await canvas.getAttribute('data-position'), '9,17');
  await vault(7, 17);
  await move('Left', 6, 17, island);
  await move('Up', 6, 14, island);
  await vault(6, 12);
  await move('Up', 6, 10, island);
  await move('Right', 8, 10, island);
  await vault(10, 10);
  await move('Right', 13, 10, island);
  await move('Up', 13, 8, island);
  await vault(13, 6);
  await move('Up', 13, 4, island);
  await page.keyboard.press('z');
  assert.match(await dialogue(), /NEVADA DEL TEIDE/);
  assert.equal((await snapshot()).deck.filter(id => id === 'nevada_teide').length, 1);
  console.log('ok - cuatro saltos en navegador y recogida única de Nevada del Teide');

  await move('Down', 13, 6, island);
  await vault(13, 8);
  await move('Down', 13, 10, island);
  await move('Left', 10, 10, island);
  await vault(8, 10);
  await move('Left', 6, 10, island);
  await move('Down', 6, 12, island);
  await vault(6, 14);
  await move('Down', 6, 17, island);
  await move('Right', 7, 17, island);
  await vault(9, 17);
  await move('Right', 11, 17, island);
  await page.evaluate(() => { window.__tideTime = 15001; });
  await move('Down', 11, 22, island);
  await position(42, 60);
  await page.locator('canvas[data-phase="exploración"]').waitFor();
  assert.equal((await snapshot()).flags.pukas_out, true);

  await move('Down', 42, 82);
  await move('Right', 48, 82);
  await move('Down', 48, 86);
  assert.equal((await snapshot()).flags.pukas_out, false);
  await page.keyboard.press('z');
  assert.match(await dialogue(), /SAN SEBASTIÁN DE LA GOMERA/);
  await move('Up', 48, 84);
  await surf();
  await position(48, 83);
  await move('Up', 48, 77);
  assert.equal((await snapshot()).flags.pukas_out, true);
  console.log('ok - regreso a mar abierto con la isla hundida y llegada al pantalán');

  // Put the recovered card at the top for a deterministic autobattle test.
  await page.evaluate(async () => {
    const { save, touchSave } = await import('/src/game/save.ts');
    const index = save.deck.indexOf('nevada_teide');
    if (index < 0) throw new Error('Falta la carta recuperada');
    save.deck.unshift(...save.deck.splice(index, 1));
    touchSave();
    Math.random = () => 0.999;
  });
  await move('Right', 49, 77);
  await face('Up');
  await page.keyboard.press('z');
  assert.match(await dialogue(true), /INÉS/);
  await page.keyboard.press('z');
  await page.getByRole('button', { name: 'BARAJAR Y ROBAR 7' }).click();
  await page.getByRole('button', { name: 'x4' }).click();
  await page.getByText('NEVADA 3', { exact: true }).waitFor({ timeout: 15000 });
  const result = page.getByRole('button', { name: /ABRIR SOBRE|IR AL CENTRO PARRANDERO/ });
  await result.waitFor({ timeout: 30000 });
  const won = (await result.textContent())?.includes('ABRIR SOBRE');
  await result.click();
  if (won) {
    await position(49, 77);
    assert.equal((await snapshot()).flags.pukas_out, true);
  } else {
    await position(3, 3, 'parrandero');
    assert.equal((await snapshot()).lastCenter, 'troya');
  }
  assert.deepEqual(errors, []);
  console.log('ok - Nevada se activa en el duelo de la moto de agua y el final devuelve al mapa correctamente');
} finally {
  await browser.close();
}