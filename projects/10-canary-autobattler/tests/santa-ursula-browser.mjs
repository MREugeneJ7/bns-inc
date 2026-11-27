import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1366, height: 850 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const canvas = page.locator('canvas[data-map]');
const snap = () => page.evaluate(() => JSON.parse(localStorage.getItem('magomon.local.v1')));
const state = () => canvas.evaluate(c => ({ map: c.dataset.map, pos: c.dataset.position, phase: c.dataset.phase, choice: c.dataset.choice }));

async function readDialog(choice = false) {
  const texts = [];
  for (let i = 0; i < 150; i++) {
    const d = await canvas.evaluate(c => ({ phase: c.dataset.phase, text: c.dataset.dialogue, choice: c.dataset.choice }));
    if (d.phase === 'exploración' || (choice && d.choice)) return texts.join(' ');
    if (d.phase === 'diálogo') {
      if (d.text && texts.at(-1) !== d.text) texts.push(d.text);
      if (d.choice && !choice) throw Error(`Menú inesperado: ${d.choice}`);
      await page.keyboard.press('z');
    }
    await page.waitForTimeout(50);
  }
  throw Error('Diálogo atascado');
}

// Cutscene: la carretera general pasa por La Orotava y llega a Montaña Blanca; se avanza con Z.
async function finishCutscene() {
  const lines = [];
  for (let i = 0; i < 900; i++) {
    const d = await canvas.evaluate(c => ({ phase: c.dataset.phase, text: c.dataset.dialogue }));
    if (d.phase === 'diálogo') {
      if (d.text && lines.at(-1) !== d.text) lines.push(d.text);
      await page.keyboard.press('z');
    } else if (d.phase === 'exploración') return lines.join(' ');
    await page.waitForTimeout(100);
  }
  throw Error('La cutscene no terminó');
}

async function moveTo(x, y, nextMap) {
  await page.waitForFunction(() => document.querySelector('canvas')?.dataset.phase === 'exploración');
  const initial = await state();
  const groups = await page.evaluate(async ({ initial, x, y }) => {
    const { MAPS } = await import('/src/game/maps.ts');
    const { save, npcState } = await import('/src/game/save.ts');
    const { SOLID, DRIVABLE_TILES } = await import('/src/game/sprites.ts');
    const map = MAPS[initial.map];
    const blocked = new Set(map.npcs.map(npcState).filter(n => !n.hidden).map(n => `${n.x},${n.y}`));
    for (const t of map.triggers) if (t.kind === 'step' && ['warp', 'enterSchool', 'enterParrandero', 'enterDiablito'].includes(t.action.type) && `${t.x},${t.y}` !== `${x},${y}`) blocked.add(`${t.x},${t.y}`);
    const start = initial.pos.split(',').map(Number);
    const queue = [[...start, []]], visited = new Set([initial.pos]);
    let path;
    for (const [cx, cy, history] of queue) {
      if (cx === x && cy === y) { path = history; break; }
      for (const [dir, dx, dy] of [['Up', 0, -1], ['Right', 1, 0], ['Down', 0, 1], ['Left', -1, 0]]) {
        const nx = cx + dx, ny = cy + dy, key = `${nx},${ny}`, ch = map.rows[ny]?.[nx];
        if (!ch || visited.has(key) || blocked.has(key) || SOLID[map.legend[ch]] || (save.flags.car_out && !DRIVABLE_TILES.has(map.legend[ch]))) continue;
        visited.add(key); queue.push([nx, ny, [...history, [dir, key]]]);
      }
    }
    if (!path) throw Error(`No hay ruta ${initial.map}: ${initial.pos} -> ${x},${y}`);
    const out = [];
    for (const [dir, end] of path) {
      if (out.at(-1)?.dir === dir) out.at(-1).end = end;
      else out.push({ dir, end });
    }
    return out;
  }, { initial, x, y });
  const dialogs = [];
  for (const { dir, end } of groups) {
    for (let tries = 0; tries < 5; tries++) {
      let current = await state();
      // La cutscene de la carretera general la lleva el test que la ha disparado.
      if (current.phase === 'cutscene') return dialogs.join(' ');
      if (current.phase !== 'exploración') { dialogs.push(await readDialog()); current = await state(); }
      if (current.map !== initial.map || current.pos === end) break;
      await page.keyboard.down(`Arrow${dir}`);
      try {
        await page.waitForFunction(({ id, end }) => {
          const c = document.querySelector('canvas[data-map]');
          return c && (c.dataset.position === end || c.dataset.map !== id || c.dataset.phase === 'diálogo');
        }, { id: initial.map, end }, { timeout: 10000, polling: 'raf' });
      } finally {
        await page.keyboard.up(`Arrow${dir}`);
      }
      const after = await state();
      if (nextMap && (after.map !== initial.map || after.pos === `${x},${y}`)) {
        await page.waitForFunction(id => document.querySelector('canvas[data-map]')?.dataset.map === id, nextMap);
        return dialogs.join(' ');
      }
      if (after.map !== initial.map) break;
      if (after.phase === 'diálogo') dialogs.push(await readDialog());
    }
    if ((await state()).map !== initial.map) break;
  }
  if (nextMap) await page.waitForFunction(id => document.querySelector('canvas[data-map]')?.dataset.map === id, nextMap);
  return dialogs.join(' ');
}

async function face(dir) {
  await page.keyboard.down(`Arrow${dir}`); await page.waitForTimeout(60); await page.keyboard.up(`Arrow${dir}`);
}
async function talk(dir, choice = false) {
  await face(dir); await page.keyboard.press('z');
  await page.locator('canvas[data-phase="diálogo"]').waitFor();
  return readDialog(choice);
}
async function decline() {
  await face('Down');
  assert.equal((await state()).choice, 'AHORA NO');
  await page.keyboard.press('z');
  await page.waitForFunction(() => !document.querySelector('canvas')?.dataset.choice);
  await readDialog();
}
async function toggleCar() {
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: /MOCHILA/ }).click();
  await page.getByRole('button', { name: /APARCAR Y BAJAR A PIE|SPAWNEAR EN ASFALTO/ }).click();
  await page.locator('canvas[data-phase="diálogo"]').waitFor(); await readDialog();
}

try {
  await page.addInitScript(() => {
    if (!localStorage.getItem('magomon.local.v1')) {
      const flags = {
        starterChosen: true, errand: true, ruta: true, magodex: true, hm_todo_terreno: true, car_out: true,
        magomaniaco_done: true, first_ed_claimed: true,
        visited_tf5: true, tf5_quinta_chill: true, coco_meridiano_beaten: true, coco_beaten: true,
        has_cazafantasmas: true, has_fotocopiadora: true, coco_ricardo_rescued: true,
      };
      for (let i = 1; i <= 7; i++) flags[`boliche_${i}`] = true;
      localStorage.setItem('magomon.local.v1', JSON.stringify({
        version: 12, mapId: 'tf5', playerPos: { x: 16, y: 83, dir: 'down' }, starter: 'angelote', flags,
        beaten: { coco_santa_ursula: 1 }, duros: 400,
        deck: [...Array(4).fill('tierra_malpais'), ...Array(3).fill('lagarto'), ...Array(7).fill('tierra_malpais'),
          ...Array(5).fill('tierra_volcan'), ...Array(3).fill('lagarto_magma'), ...Array(4).fill('lagarto_gigante'),
          ...Array(3).fill('lapa_acorazada'), ...Array(3).fill('cortar_el_aire')],
      }));
    }
    localStorage.setItem('magomon.mute', '1');
    Math.random = () => 0.999;
  });
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:4177', { waitUntil: 'networkidle' });
  await page.locator('canvas[data-phase="título"]').waitFor();
  await page.keyboard.press('z');

  // Las coordenadas son las del pueblo reflejado: la carretera general sale hacia el SUROESTE.
  await moveTo(16, 86, 'santa_ursula');
  assert.match(await readDialog(), /subes.*SANTA ÚRSULA/i);
  await moveTo(46, 20);
  await toggleCar();
  await moveTo(56, 14, 'parrandero'); await readDialog();
  await moveTo(3, 3);
  assert.match(await talk('Up'), /CHAXIRAXI/);
  assert.equal((await snap()).lastCenter, 'santa_ursula');
  await moveTo(4, 8, 'santa_ursula'); await readDialog();
  await moveTo(38, 14, 'colegio'); await readDialog();
  await moveTo(3, 5);
  assert.match(await talk('Up', true), /GARA/); await decline();
  assert.equal((await snap()).lastSchool, 'santa_ursula');
  await moveTo(4, 8, 'santa_ursula'); await readDialog();
  console.log('ok - La Quinta sube al pueblo; Centro Parrandero con Chaxiraxi y colegio con duelos');

  await moveTo(46, 20); await toggleCar();
  const aroma = await moveTo(9, 40);
  assert.match(aroma, /aroma.*italiana/);
  assert.match(aroma, /CERRADO.*RUTA DEL BUEN YANTAR.*último gimnasio/);
  assert.ok((await snap()).flags.diablito_discovered);
  await page.getByRole('button', { name: /RUTA 7\/8/ }).click();
  await page.getByText('EL DIABLITO', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'CERRAR', exact: true }).click();
  await toggleCar();
  if (process.env.QA_DIR) await page.screenshot({ path: `${process.env.QA_DIR}/diablito-exterior.png` });
  await moveTo(9, 39, 'el_diablito');
  assert.match(await readDialog(), /EL COCO.*O sole mio/);
  await moveTo(11, 5);
  const challenge = await talk('Up', true);
  assert.match(challenge, /Meridiano.*Magos de la Costa/);
  assert.match(challenge, /cerrado.*niñatos.*boliches/);
  assert.match(challenge, /negocios criminales.*reabrir.*ÚLTIMO BOLICHE/);
  assert.match((await state()).choice, /RETAR GYM #8/);
  await decline();
  const retry = await talk('Up', true);
  assert.match(retry, /volviste.*último boliche/i);
  await decline();
  assert.ok((await snap()).flags.coco_diablito_seen);
  if (process.env.QA_DIR) await page.screenshot({ path: `${process.env.QA_DIR}/coco-cantando.png` });
  console.log('ok - general al suroeste, aroma, cartel, recuerdo de la Ruta y tercer Coco cantando en El Diablito');

  await talk('Up', true); await page.keyboard.press('z');
  await page.getByRole('button', { name: 'BARAJAR Y ROBAR 7' }).click();
  await page.getByRole('button', { name: 'x4' }).click();
  await page.getByRole('button', { name: 'ABRIR SOBRE' }).waitFor({ timeout: 45000 });
  await page.getByRole('button', { name: 'ABRIR SOBRE' }).click();
  const booster = page.getByRole('dialog', { name: 'ELIGE 1 DE 5' });
  await booster.waitFor();
  await booster.getByRole('button', { name: /Elegir .*carta 1 de 5/ }).click();
  await booster.getByRole('button', { name: 'GUARDAR EN PC' }).click();
  await booster.getByRole('button', { name: 'CERRAR SOBRE' }).click();
  await page.locator('canvas[data-phase="diálogo"]').waitFor();
  assert.match(await readDialog(), /OCHO DE OCHO/);
  const won = await snap();
  assert.ok(won.flags.boliche_8 && won.flags.coco_diablito_beaten);
  assert.ok(won.flags.coco_meridiano_beaten && won.flags.coco_beaten && won.flags.has_cazafantasmas && won.flags.has_fotocopiadora);
  await page.getByRole('button', { name: /RUTA 8\/8/ }).click();
  await page.getByText('ALTO MANDO DESBLOQUEADO', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'CERRAR', exact: true }).click();
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('canvas[data-phase="título"]').waitFor(); await page.keyboard.press('z');
  await page.locator('canvas[data-phase="exploración"]').waitFor();
  assert.match(await talk('Up'), /El Boliche del Diablito ya es tuyo/);
  assert.equal((await snap()).pendingBooster, null);
  console.log('ok - victoria del octavo boliche, Ruta 8/8 y guardado con el Coco visible después de ganar');

  // Más allá del Diablito, la carretera general sale del mapa por el suroeste: cutscene de La Orotava.
  await moveTo(11, 17, 'santa_ursula'); await readDialog();
  const cutsceneTrigger = await page.evaluate(async () => {
    const { MAPS } = await import('/src/game/maps.ts');
    const t = MAPS.santa_ursula.triggers.find(tr => tr.action.type === 'orotavaCutscene');
    return { x: t.x, y: t.y };
  });
  await moveTo(cutsceneTrigger.x, cutsceneTrigger.y);
  await page.waitForFunction(() => document.querySelector('canvas')?.dataset.phase === 'cutscene', null, { timeout: 15000 });
  if (process.env.QA_DIR) await page.screenshot({ path: `${process.env.QA_DIR}/cutscene-orotava.png` });
  const arrival = await finishCutscene();
  assert.match(arrival, /MONTAÑA BLANCA/);
  assert.match(arrival, /oídos me pitan/);
  assert.equal((await state()).map, 'montana_blanca');
  assert.equal((await state()).pos, '10,27');
  assert.ok((await snap()).flags.montana_blanca_seen);
  assert.deepEqual(errors, []);
  console.log('ok - cutscene: La Orotava a toda velocidad, subida en zigzag, llegada a Montaña Blanca y mareo');
} finally {
  await browser.close();
}
