import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1366, height: 850 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const canvas = page.locator('canvas[data-map]');
const state = () => canvas.evaluate((c) => ({
  map: c.dataset.map,
  pos: (c.dataset.position || '0,0').split(',').map(Number),
  elev: c.dataset.elevation,
  phase: c.dataset.phase,
  dialogue: c.dataset.dialogue || '',
  choice: c.dataset.choice || '',
}));
const snapshot = () => page.evaluate(() => JSON.parse(localStorage.getItem('magomon.local.v1') || '{}'));

async function clearDialogue(declineDuels = true) {
  const seen = [];
  for (let i = 0; i < 90; i++) {
    const s = await state();
    if (s.phase === 'exploración') return seen.join(' ');
    if (s.phase === 'diálogo') {
      if (s.dialogue && seen.at(-1) !== s.dialogue) seen.push(s.dialogue);
      if (declineDuels && s.choice && s.choice !== 'AHORA NO' && (s.choice.startsWith('LUCHAR') || s.choice.startsWith('RETAR'))) {
        await page.keyboard.down('ArrowDown');
        await page.waitForTimeout(60);
        await page.keyboard.up('ArrowDown');
        await page.waitForTimeout(45);
        continue;
      }
      await page.keyboard.press('z');
    }
    await page.waitForTimeout(45);
  }
  throw new Error('Diálogo atascado');
}

// La cutscene de la carretera general: se avanza con Z hasta volver a la autopista.
async function finishCutscene() {
  const lines = [];
  for (let i = 0; i < 900; i++) {
    const d = await canvas.evaluate((c) => ({ phase: c.dataset.phase, text: c.dataset.dialogue }));
    if (d.phase === 'diálogo') {
      if (d.text && lines.at(-1) !== d.text) lines.push(d.text);
      await page.keyboard.press('z');
    } else if (d.phase === 'exploración') return lines.join(' ');
    await page.waitForTimeout(100);
  }
  throw new Error('La cutscene no terminó');
}

async function holdUntil(key, pred, timeout = 8000) {
  await page.keyboard.down(key);
  try {
    await page.waitForFunction(pred, null, { polling: 'raf', timeout });
  } finally {
    await page.keyboard.up(key);
  }
}

async function driveTf5To(tx, ty) {
  const path = await page.evaluate(async ({ tx, ty }) => {
    const c = document.querySelector('canvas[data-map]');
    const [sx, sy] = c.dataset.position.split(',').map(Number);
    const { MAPS } = await import('/src/game/maps.ts');
    const { DRIVABLE_TILES, SOLID } = await import('/src/game/sprites.ts');
    const { tf5VehicleAt } = await import('/src/game/mapsTf5.ts');
    const m = MAPS.tf5;
    const reloc = new Set(m.triggers.filter((t) => t.action.type === 'orotavaCutscene').map((t) => `${t.x},${t.y}`));
    const q = [[sx, sy]];
    const prev = new Map([[`${sx},${sy}`, null]]);
    for (const [x, y] of q) {
      if (x === tx && y === ty) break;
      for (const [key, dx, dy] of [['ArrowUp', 0, -1], ['ArrowDown', 0, 1], ['ArrowLeft', -1, 0], ['ArrowRight', 1, 0]]) {
        const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
        if (prev.has(k) || nx < 0 || ny < 0 || nx >= m.rows[0].length || ny >= m.rows.length) continue;
        if (ny === 95 && !(tx === nx && ty === ny)) continue;
        if (reloc.has(k) && !(tx === nx && ty === ny)) continue;
        const tile = m.legend[m.rows[ny][nx]];
        if (!DRIVABLE_TILES.has(tile) || SOLID[tile] || tf5VehicleAt(nx, ny)) continue;
        prev.set(k, { from: `${x},${y}`, key, end: k });
        q.push([nx, ny]);
      }
    }
    if (!prev.has(`${tx},${ty}`)) throw new Error(`Sin ruta TF-5 ${sx},${sy} -> ${tx},${ty}`);
    const steps = [];
    for (let cur = `${tx},${ty}`; prev.get(cur); cur = prev.get(cur).from) steps.push(prev.get(cur));
    steps.reverse();
    const groups = [];
    for (const st of steps) {
      if (groups.at(-1)?.key === st.key) groups.at(-1).end = st.end;
      else groups.push({ key: st.key, end: st.end });
    }
    return groups;
  }, { tx, ty });

  const texts = [];
  for (const seg of path) {
    while (true) {
      const cur = await state();
      if (cur.phase === 'diálogo') {
        texts.push(await clearDialogue(true));
        continue;
      }
      if (cur.pos.join(',') === seg.end || cur.map !== 'tf5') break;
      await page.keyboard.down(seg.key);
      try {
        await page.waitForFunction((end) => {
          const c = document.querySelector('canvas[data-map]');
          return c && (c.dataset.position === end || c.dataset.phase === 'diálogo' || c.dataset.map !== 'tf5');
        }, seg.end, { polling: 'raf', timeout: 8000 });
      } finally {
        await page.keyboard.up(seg.key);
      }
      const after = await state();
      if (after.phase === 'diálogo') {
        const msg = await clearDialogue(true);
        texts.push(msg);
        // Si nos recolocó en La Quinta, paramos
        if (msg.includes('escalofrío') && seg.end === `${tx},${ty}`) return texts.join(' | ');
      }
      if (after.pos.join(',') === seg.end) break;
    }
  }
  return texts.join(' | ');
}

try {
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:4177', { waitUntil: 'networkidle' });
  await page.locator('canvas[data-phase="título"]').waitFor();

  // Salto rápido a Autopista TF-5 Norte (Estación de Guaguas de S/C)
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: /PARTIDA/ }).click();
  await page.getByRole('button', { name: 'Saltos rápidos' }).click();
  await page.getByRole('textbox', { name: 'Buscar capítulo' }).fill('TF-5');
  await page.getByRole('button', { name: /Autopista TF-5 Norte/ }).click();
  await page.waitForFunction(() => document.querySelector('canvas')?.dataset.map === 'santacruz_sur');
  assert.deepEqual((await state()).pos, [49, 8]);

  // Sacar el 4x4 en la Estación de S/C y subir TODO TIESO AL NORTE hasta entrar en el paso inferior de Taco
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: /MOCHILA/ }).click();
  await page.getByRole('button', { name: /SPAWNEAR EN ASFALTO/ }).click();
  await clearDialogue();

  await holdUntil('ArrowUp', () => document.querySelector('canvas')?.dataset.map === 'calle');
  await page.waitForFunction(() => document.querySelector('canvas')?.dataset.phase === 'exploración');
  const inUnder = await state();
  assert.equal(inUnder.map, 'calle');
  assert.equal(inUnder.elev, 'under', 'entra a `calle` en cota inferior de la TF-5');

  // Avanzar hasta quedar JUSTO DEBAJO del puente de Taco (y=6) y comprobar que no se sale a E/O
  await holdUntil('ArrowUp', () => document.querySelector('canvas')?.dataset.position === '24,6');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(260);
  await page.keyboard.up('ArrowRight');
  assert.equal((await state()).pos[0], 25, 'el muro de contención impide salir a la calle superior');
  if (process.env.SHOT_DIR) await page.screenshot({ path: `${process.env.SHOT_DIR}/1-taco-underpass.png` });

  // Seguir recto al norte: Aday pita en (24,2) o salimos por y=0 hacia el mapa `tf5`
  await holdUntil('ArrowUp', () => {
    const c = document.querySelector('canvas');
    return c && (c.dataset.map === 'tf5' || c.dataset.phase === 'diálogo');
  });
  if ((await state()).phase === 'diálogo') {
    await clearDialogue(true);
    await holdUntil('ArrowUp', () => document.querySelector('canvas')?.dataset.map === 'tf5');
  }
  const enterMsg = await clearDialogue(true);
  assert.match(enterMsg, /PADRE ANCHIETA/);
  console.log('ok - desde la Estación de S/C todo tieso al norte, cruza `calle` bajo el Puente de Taco (2 alturas) y entra en la TF-5');

  // Culebrear por la ultra-cola de Padre Anchieta (recibiendo retos de los conductores atascados) hasta TFN
  const anchietaLog = await driveTf5To(116, 60);
  assert.match(anchietaLog, /PADRE ANCHIETA|KEVIN|FIDEL/);
  if (process.env.SHOT_DIR) await page.screenshot({ path: `${process.env.SHOT_DIR}/2-anchieta-jam.png` });

  const tfnLog = await driveTf5To(104, 14);
  assert.match(tfnLog, /PANADERO|CHOFERESA|RUPERTO|ARMANDO/);
  console.log('ok - culebrea por la ultra-cola de Padre Anchieta con entrenadores y llega al TFN donde se despeja');

  // Girar al SUROESTE por Tacoronte (lluvia permanente: el canvas cambia entre fotogramas por las gotas)
  await driveTf5To(86, 23);
  if (process.env.SHOT_DIR) await page.screenshot({ path: `${process.env.SHOT_DIR}/3-tacoronte-rain.png` });
  const rainDiff = await canvas.evaluate(async (c) => {
    const ctx = c.getContext('2d');
    const a = new Uint8Array(ctx.getImageData(0, 0, c.width, c.height).data);
    await new Promise((r) => setTimeout(r, 90));
    const b = new Uint8Array(ctx.getImageData(0, 0, c.width, c.height).data);
    let diff = 0;
    for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i]) diff++;
    return diff;
  });
  assert.ok(rainDiff > 120, `lluvia animada permanente en Tacoronte (pixeles=${rainDiff})`);

  // Seguir al suroeste por las curvas y radares de El Sauzal, La Matanza, La Victoria y Santa Úrsula
  await driveTf5To(64, 41);
  if (process.env.SHOT_DIR) await page.screenshot({ path: `${process.env.SHOT_DIR}/4-sauzal-radars.png` });
  await driveTf5To(44, 55); // La Matanza
  await driveTf5To(30, 66); // La Victoria
  await driveTf5To(21, 73); // Santa Úrsula
  console.log('ok - gira al suroeste desde TFN por Tacoronte (lluvia), El Sauzal (curvas y radares), Matanza, Victoria y Santa Úrsula');

  // Llegar a la altura de La Quinta (x=16): salta el escalofrío
  const quintaMsg = await driveTf5To(16, 77);
  assert.match(quintaMsg, /Siento un escalofrío, creo que debería salirme de la autopista aquí/i);

  // Intentar seguir dirección La Orotava (x=12): recolocación INMEDIATA en la salida de La Quinta (16,83)
  await driveTf5To(12, 80);
  await page.waitForFunction(() => document.querySelector('canvas')?.dataset.phase === 'cutscene', null, { timeout: 15000 });
  if (process.env.SHOT_DIR) await page.screenshot({ path: `${process.env.SHOT_DIR}/5-orotava-cutscene.png` });
  const arrival = await finishCutscene();
  assert.match(arrival, /MONTAÑA BLANCA/);
  assert.equal(await canvas.getAttribute('data-map'), 'montana_blanca');
  console.log('ok - en La Quinta dice el escalofrío y al seguir hacia La Orotava entra en la cutscene hasta Montaña Blanca');

  // Comprobar que la cota superior del Puente de Taco sigue intacta caminando de Este a Oeste
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: /MOCHILA/ }).click();
  await page.getByRole('button', { name: 'USAR (VOLAR CON BINTER)' }).click();
  await page.getByText('[WEY]').locator('../..').getByRole('button', { name: 'VOLAR' }).click();
  await page.waitForFunction(() => document.querySelector('canvas')?.dataset.map === 'calle');
  await clearDialogue();
  assert.equal((await state()).elev, 'upper');
  // Bajar a la calzada (y=9) hasta el pie del puente (26,9), subir a (26,6) y cruzar POR ENCIMA del Puente de Taco (x=25..22) hasta Taco (20,6)
  await holdUntil('ArrowDown', () => document.querySelector('canvas')?.dataset.position === '66,9');
  await holdUntil('ArrowLeft', () => document.querySelector('canvas')?.dataset.position === '26,9', 12000);
  await holdUntil('ArrowUp', () => document.querySelector('canvas')?.dataset.position === '26,6');
  await holdUntil('ArrowLeft', () => document.querySelector('canvas')?.dataset.position === '20,6');
  assert.equal((await state()).elev, 'upper', 'cruza el puente por arriba hacia Taco sin caer a la TF-5');
  assert.equal(!!(await snapshot()).flags.tf5_underpass, false);
  assert.deepEqual(errors, []);
  console.log('ok - el paso superior peatonal del Puente de Taco hacia Taco sigue funcionando sin solaparse');
} finally {
  await browser.close();
}
