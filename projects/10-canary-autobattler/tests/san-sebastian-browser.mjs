import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1366, height: 850 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const canvas = page.locator('canvas[data-map]');
const snapshot = () => page.evaluate(() => JSON.parse(localStorage.getItem('magomon.local.v1')));
const state = () => canvas.evaluate(c => ({ map: c.dataset.map, pos: c.dataset.position.split(',').map(Number), phase: c.dataset.phase }));

async function dialogue(untilChoice = false) {
  await page.locator('canvas[data-phase="diálogo"]').waitFor({ timeout: 6000 });
  const lines = new Set();
  for (let i = 0; i < 100; i++) {
    const d = await canvas.evaluate(c => ({ phase: c.dataset.phase, text: c.dataset.dialogue, choice: c.dataset.choice }));
    if (d.phase !== 'diálogo' || (untilChoice && d.choice)) return [...lines].join(' ');
    lines.add(d.text);
    await page.keyboard.press('z');
    await page.waitForTimeout(60);
  }
  throw new Error('El diálogo no avanzó');
}

async function walk(x, y, targetMap) {
  await page.waitForFunction(() => document.querySelector('canvas')?.dataset.phase === 'exploración', null, { timeout: 6000 });
  const start = await state();
  const groups = await page.evaluate(async ({ start, x, y }) => {
    const { MAPS } = await import('/src/game/maps.ts');
    const { SOLID } = await import('/src/game/sprites.ts');
    const { npcState } = await import('/src/game/save.ts');
    const map = MAPS[start.map];
    const blocked = new Set(map.npcs.map(npcState).filter(n => !n.hidden).map(n => `${n.x},${n.y}`));
    for (const t of map.triggers) {
      if (t.kind === 'step' && `${t.x},${t.y}` !== `${x},${y}` &&
          ['warp', 'enterSchool', 'enterParrandero', 'enterCurbeloGym'].includes(t.action.type)) blocked.add(`${t.x},${t.y}`);
    }
    const queue = [[...start.pos, []]], seen = new Set([start.pos.join(',')]);
    let path;
    for (let i = 0; i < queue.length; i++) {
      const [cx, cy, history] = queue[i];
      if (cx === x && cy === y) { path = history; break; }
      for (const [dir, dx, dy] of [['Up', 0, -1], ['Right', 1, 0], ['Down', 0, 1], ['Left', -1, 0]]) {
        const nx = cx + dx, ny = cy + dy, key = `${nx},${ny}`, ch = map.rows[ny]?.[nx];
        if (!ch || seen.has(key) || blocked.has(key) || SOLID[map.legend[ch]]) continue;
        seen.add(key); queue.push([nx, ny, [...history, [dir, key]]]);
      }
    }
    if (!path) throw new Error(`Sin ruta: ${start.map} ${start.pos} -> ${x},${y}`);
    const result = [];
    for (const [dir, end] of path) {
      if (result.at(-1)?.dir === dir) result.at(-1).end = end;
      else result.push({ dir, end });
    }
    return result;
  }, { start, x, y });
  for (const { dir, end } of groups) {
    await page.keyboard.down(`Arrow${dir}`);
    try {
      await page.waitForFunction(({ id, end }) => {
        const c = document.querySelector('canvas[data-map]');
        return c && (c.dataset.position === end || c.dataset.map !== id);
      }, { id: start.map, end }, { polling: 'raf', timeout: 9000 });
    } finally {
      await page.keyboard.up(`Arrow${dir}`);
    }
    if ((await state()).map !== start.map) break;
  }
  if (targetMap) await page.waitForFunction(id => document.querySelector('canvas')?.dataset.map === id, targetMap, { timeout: 6000 });
}

async function face(dir) {
  await page.keyboard.down(`Arrow${dir}`);
  await page.waitForTimeout(60);
  await page.keyboard.up(`Arrow${dir}`);
}

async function talk(dir, untilChoice = false) {
  await face(dir);
  await page.keyboard.press('z');
  return dialogue(untilChoice);
}

try {
  await page.addInitScript(() => {
    const flags = {
      starterChosen: true, hm_pukas: true, hm_salto_pastor: true, visited_veronicas: true,
      errand: true, magomaniaco_done: true, first_ed_claimed: true, ruta: true,
    };
    for (let i = 1; i <= 6; i++) flags[`boliche_${i}`] = true;
    localStorage.setItem('magomon.local.v1', JSON.stringify({
      version: 12, mapId: 'veronicas', playerPos: { x: 48, y: 86, dir: 'down' }, starter: 'angelote', duros: 400, flags,
      deck: [...Array(4).fill('tierra_malpais'), ...Array(3).fill('lagarto'), ...Array(7).fill('tierra_malpais'),
        ...Array(5).fill('tierra_volcan'), ...Array(3).fill('lagarto_magma'), ...Array(4).fill('lagarto_gigante'),
        ...Array(3).fill('lapa_acorazada'), ...Array(3).fill('cortar_el_aire')],
      pc: ['burgado_1ed', 'cangrejo_1ed'],
    }));
    localStorage.setItem('magomon.mute', '1');
    Math.random = () => 0.999;
  });
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:4177', { waitUntil: 'networkidle' });
  await page.locator('canvas[data-phase="título"]').waitFor();
  await page.keyboard.press('z');
  await page.locator('canvas[data-phase="exploración"]').waitFor();
  await walk(49, 86);
  await walk(49, 88, 'san_sebastian');
  assert.match(await dialogue(), /COLÓN/i);
  assert.equal((await snapshot()).flags.pukas_out, false);
  await walk(27, 6);
  assert.match(await talk('Up'), /CASIMIRO CURBELO.*Colón/i);
  if (process.env.QA_SCREENSHOT) await page.screenshot({ path: process.env.QA_SCREENSHOT });
  console.log('ok - se llega caminando desde el pantalán a San Sebastián y habla Casimiro');

  await walk(36, 24);
  assert.match(await dialogue(), /puerta.*cerrada/i);
  await page.waitForFunction(() => document.querySelector('canvas')?.dataset.position === '36,25');
  assert.equal((await state()).map, 'san_sebastian');
  assert.ok(!(await snapshot()).flags.has_curbelo_key);
  console.log('ok - el guachinche no deja entrar sin la llave');

  await walk(15, 10, 'certificador_gomera');
  assert.match(await dialogue(), /CERTIFICADAS.*Burgado/i);
  let saved = await snapshot();
  assert.ok(saved.flags.cert_burgado_1ed && saved.flags.cert_cangrejo_1ed);
  assert.equal(saved.pc.filter(id => id === 'burgado_1ed').length, 1);
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: 'PC DE AYOZE' }).click();
  for (const name of ['BURGADO 1ª ED.', 'CANGREJO 1ª ED.']) {
    await page.getByText(name, { exact: true }).locator('..').getByRole('button', { name: '→ MAZO' }).click();
  }
  await page.getByRole('button', { name: 'CERRAR', exact: true }).click();
  saved = await snapshot();
  assert.ok(saved.deck.includes('burgado_1ed') && saved.deck.includes('cangrejo_1ed'));
  await walk(7, 4);
  assert.match(await talk('Up'), /ya he certificado/i);
  await walk(7, 10, 'san_sebastian');
  console.log('ok - Casimiro certifica las cartas existentes y el PC permite añadirlas al mazo');

  await walk(6, 10, 'parrandero');
  await walk(3, 3);
  assert.match(await talk('Up'), /CHAXIRAXI.*Colón/i);
  await walk(6, 5);
  assert.match(await talk('Up'), /CASIMIRO CURBELO.*Colón/i);
  assert.equal((await snapshot()).lastCenter, 'gomera');
  await walk(4, 8, 'san_sebastian');
  await walk(40, 10, 'colegio');
  await walk(2, 7);
  assert.match(await talk('Left'), /CASIMIRO CURBELO.*Colón/i);
  await walk(3, 5);
  assert.match(await talk('Up', true), /NAIRA.*Colón/i);
  await face('Down');
  assert.equal(await canvas.getAttribute('data-choice'), 'AHORA NO');
  await page.keyboard.press('z');
  assert.match(await dialogue(), /Colón/i);
  assert.equal((await snapshot()).lastSchool, 'gomera');
  await walk(4, 8, 'san_sebastian');
  console.log('ok - centro con Chaxiraxi y Casimiro, colegio con niños y conserje Casimiro');

  await walk(9, 24, 'mansion_curbelo');
  assert.match(await dialogue(), /COLÓN/i);
  const key = await page.evaluate(async () => {
    const { CURBELO_KEY, GOMERA_MAPS } = await import('/src/game/mapsGomera.ts');
    const { SOLID } = await import('/src/game/sprites.ts');
    const map = GOMERA_MAPS.mansion_curbelo;
    for (const [dir, dx, dy] of [['Down', 0, -1], ['Left', 1, 0], ['Up', 0, 1], ['Right', -1, 0]]) {
      const x = CURBELO_KEY.x + dx, y = CURBELO_KEY.y + dy, tile = map.legend[map.rows[y]?.[x]];
      if (tile && !SOLID[tile]) return { x, y, dir };
    }
    throw new Error('La llave no tiene casilla adyacente');
  });
  await walk(key.x, key.y);
  assert.match(await talk(key.dir), /LLAVE DEL GUACHINCHE/i);
  assert.equal((await snapshot()).flags.has_curbelo_key, true);
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: /MOCHILA/ }).click();
  await page.getByText('LLAVE DEL GUACHINCHE DE CASIMIRO', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'CERRAR', exact: true }).click();
  await walk(11, 22, 'san_sebastian');
  console.log('ok - se recorre el laberinto, se recoge la llave y se regresa a la plaza');

  await walk(36, 24, 'guachinche_curbelo');
  assert.match(await dialogue(), /Colón/i);
  await walk(10, 4);
  assert.match(await talk('Up', true), /CASIMIRO CURBELO.*Colón/i);
  assert.match(await canvas.getAttribute('data-choice'), /RETAR GYM #7/);
  await page.keyboard.press('z');
  await page.getByRole('button', { name: 'BARAJAR Y ROBAR 7' }).click();
  await page.getByRole('button', { name: 'x4' }).click();
  const win = page.getByRole('button', { name: 'ABRIR SOBRE' });
  await win.waitFor({ timeout: 35000 });
  await win.click();
  const booster = page.getByRole('dialog', { name: 'ELIGE 1 DE 5' });
  await booster.waitFor();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('magomon.local.v1') || '{}').flags?.boliche_7, null, { timeout: 5000 });
  await booster.getByRole('button', { name: /Elegir .*carta 1 de 5/ }).click({ timeout: 6000 });
  await booster.getByRole('button', { name: 'GUARDAR EN PC' }).click();
  await booster.getByRole('button', { name: 'CERRAR SOBRE' }).click();
  await page.getByRole('button', { name: /RUTA 7\/8/ }).click();
  await page.getByText('GUACHINCHE DE CASIMIRO', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'CERRAR', exact: true }).click();
  await walk(10, 15, 'san_sebastian');
  await walk(23, 0, 'veronicas');
  assert.deepEqual((await state()).pos, [48, 86]);
  await walk(48, 84);
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: /MOCHILA/ }).click();
  await page.getByRole('button', { name: 'USAR TABLA PUKAS (SURF)' }).click();
  await page.waitForFunction(() => document.querySelector('canvas')?.dataset.position === '48,83');
  assert.equal((await snapshot()).flags.pukas_out, true);
  assert.deepEqual(errors, []);
  console.log('ok - victoria por el séptimo boliche y salida navegable de vuelta a Troya');
} finally {
  await browser.close();
}