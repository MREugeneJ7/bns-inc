import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1366, height: 850 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const canvas = page.locator('canvas[data-map]');
const wait = (k, v) => page.waitForFunction(([k, v]) => document.querySelector('canvas[data-map]')?.dataset[k] === v, [k, v], { polling: 'raf', timeout: 8000 });
const tap = async key => { await page.keyboard.down(key); await page.waitForTimeout(42); await page.keyboard.up(key); await page.waitForTimeout(22); };

async function jump(label, regex) {
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: /PARTIDA/ }).click();
  await page.getByRole('button', { name: 'Saltos rápidos' }).click();
  await page.getByRole('textbox', { name: 'Buscar capítulo' }).fill(label);
  await page.getByRole('button', { name: regex }).click();
  await wait('phase', 'exploración');
}
async function dismiss() {
  for (let i = 0; i < 140; i++) {
    const s = await canvas.evaluate(c => ({ p: c.dataset.phase, ch: c.dataset.choice }));
    if (s.p === 'exploración') return;
    if (s.p === 'diálogo') {
      if (s.ch) throw Error('menú inesperado durante un diálogo normal');
      await tap('z');
    } else await page.waitForTimeout(25);
  }
  throw Error('no cerró el diálogo');
}
/** Lee un diálogo; si termina en menú, lo deja abierto. */
async function readDialog() {
  const lines = [];
  for (let i = 0; i < 140; i++) {
    const s = await canvas.evaluate(c => ({ p: c.dataset.phase, t: c.dataset.dialogue, ch: c.dataset.choice }));
    if (s.p === 'exploración') return { lines, choice: null };
    if (s.ch) return { lines, choice: s.ch };
    if (s.t && lines.at(-1) !== s.t) lines.push(s.t);
    await tap('z');
  }
  return { lines, choice: null };
}
async function decline() {
  for (let i = 0; i < 8 && !(await canvas.getAttribute('data-choice'))?.startsWith('AHORA NO'); i++) await tap('ArrowDown');
  assert.match(await canvas.getAttribute('data-choice') || '', /AHORA NO/);
  await tap('z');
  await dismiss();
}
async function plan(to) {
  await dismiss();
  const s = await canvas.evaluate(c => ({ id: c.dataset.map, pos: c.dataset.position.split(',').map(Number) }));
  const groups = await page.evaluate(async ({ to, mapId, start }) => {
    const { MAPS } = await import('/src/game/maps.ts');
    const { SOLID } = await import('/src/game/sprites.ts');
    const { npcState } = await import('/src/game/save.ts');
    const m = MAPS[mapId];
    const blocked = new Set(m.npcs.map(npcState).filter(n => !n.hidden).map(n => `${n.x},${n.y}`));
    for (const t of m.triggers) if (t.kind === 'step' && t.action.type === 'warp' && t.x + ',' + t.y !== to.join(',')) blocked.add(t.x + ',' + t.y);
    const q = [[...start, []]], seen = new Set([start.join(',')]);
    let path = null;
    for (let i = 0; i < q.length; i++) {
      const [x, y, history] = q[i];
      if (x === to[0] && y === to[1]) { path = history; break; }
      for (const [key, dx, dy] of [['ArrowUp', 0, -1], ['ArrowDown', 0, 1], ['ArrowLeft', -1, 0], ['ArrowRight', 1, 0]]) {
        const a = x + dx, b = y + dy, k = a + ',' + b;
        if (seen.has(k) || blocked.has(k) || a < 0 || b < 0 || a >= m.rows[0].length || b >= m.rows.length) continue;
        if (SOLID[m.legend[m.rows[b][a]]]) continue;
        seen.add(k); q.push([a, b, [...history, [key, k]]]);
      }
    }
    if (!path) throw new Error('sin ruta: ' + mapId + ' ' + start + ' -> ' + to);
    const out = [];
    for (const [key, end] of path) {
      if (out.at(-1)?.key === key) out.at(-1).end = end;
      else out.push({ key, end });
    }
    return out;
  }, { to, mapId: s.id, start: s.pos });
  for (const { key, end } of groups) {
    await page.keyboard.down(key);
    try { await wait('position', end); } finally { await page.keyboard.up(key); }
  }
}
async function setFlags(extra) {
  await page.evaluate(value => {
    const s = JSON.parse(localStorage.getItem('magomon.local.v1'));
    Object.assign(s.flags, value);
    localStorage.setItem('magomon.local.v1', JSON.stringify(s));
  }, extra);
}
async function reloadWorld() {
  await page.reload({ waitUntil: 'networkidle' });
  await page.keyboard.press('z');
  await wait('phase', 'exploración');
}
async function talkToNpc(npcId) {
  const t = await page.evaluate(async npcId => {
    const { MAPS } = await import('/src/game/maps.ts');
    const { npcState } = await import('/src/game/save.ts');
    const mapId = document.querySelector('canvas[data-map]').dataset.map;
    const n = MAPS[mapId].npcs.find(n => n.id === npcId);
    const s = npcState(n);
    return { x: s.x, y: s.y };
  }, npcId);
  const here = await canvas.evaluate(c => c.dataset.position.split(',').map(Number));
  const dist = Math.abs(here[0] - t.x) + Math.abs(here[1] - t.y);
  const candidates = [[t.x + 1, t.y], [t.x - 1, t.y], [t.x, t.y + 1], [t.x, t.y - 1]]
    .filter(([x, y]) => !(x === here[0] && y === here[1]));
  let stood = dist === 1; // ya estamos al lado tras la visita anterior
  for (const c of candidates) {
    if (stood) break;
    try { await plan(c); stood = true; break; } catch { /* casilla bloqueada: probamos la siguiente */ }
  }
  if (!stood) throw Error('no se puede acercar a ' + npcId);
  const pos = await canvas.evaluate(c => c.dataset.position.split(',').map(Number));
  if (pos[0] < t.x) await tap('ArrowRight');
  else if (pos[0] > t.x) await tap('ArrowLeft');
  else if (pos[1] < t.y) await tap('ArrowDown');
  else await tap('ArrowUp');
  await page.keyboard.press('z');
  await wait('phase', 'diálogo');
  const { lines, choice } = await readDialog();
  assert.ok(lines.length > 0, 'al menos una línea de diálogo');
  if (choice) await decline(); else await dismiss();
  return lines.join(' ');
}

try {
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:4187', { waitUntil: 'networkidle' });

  // ---------- 1. Coco en Meridiano: primera visita y repetición distintas ----------
  await jump('Guarida', /Guarida Enriscada/);
  const meridianoFirst = await talkToNpc('coco_ursula');
  assert.match(meridianoFirst, /Buonasera/);
  assert.ok(!meridianoFirst.includes('azotea'), 'el primer texto es el del sótano del Meridiano');
  await setFlags({ coco_meridiano_seen: true });
  await reloadWorld();
  const meridianoRetry = await talkToNpc('coco_ursula');
  assert.match(meridianoRetry, /Otra vez/);
  assert.notEqual(meridianoRetry, meridianoFirst, 'la repetición no repite la primera intervención');
  console.log('ok - Coco (Meridiano): primera visita y repetición con textos distintos');

  // ---------- 2. Coco en Magos: contexto de azotea, distinto de Meridiano ----------
  await jump('Magos · Azotea', /Magos · Azotea/);
  const magosFirst = await talkToNpc('coco_ursula');
  assert.match(magosFirst, /azotea de Magos de la Costa/);
  assert.notEqual(magosFirst, meridianoFirst);
  assert.notEqual(magosFirst, meridianoRetry, 'la azotea no repite ningún texto del sótano');
  await setFlags({ coco_magos_seen: true });
  await reloadWorld();
  const magosRetry = await talkToNpc('coco_ursula');
  assert.match(magosRetry, /Otra vez aquí arriba/);
  assert.notEqual(magosRetry, magosFirst, 'la segunda visita a la azotea tampoco repite texto');
  console.log('ok - Coco (Magos): contexto de azotea y repetición propias');

  // ---------- 3. Ricardo: intervención inicial, espera y estado liberado ----------
  const ricardoA = await talkToNpc('ricardo_garcia');
  assert.match(ricardoA, /firmando pagarés/);
  const ricardoB = await talkToNpc('ricardo_garcia');
  assert.match(ricardoB, /reglamentos/);
  assert.notEqual(ricardoB, ricardoA, 'Ricardo no repite su primera intervención');
  await setFlags({ coco_beaten: true, ricardo_spoken: true });
  await reloadWorld();
  const ricardoC = await talkToNpc('ricardo_garcia');
  assert.match(ricardoC, /posavasos/);
  assert.notEqual(ricardoC, ricardoB);
  assert.notEqual(ricardoC, ricardoA);
  console.log('ok - Ricardo: tres momentos con tres textos distintos');

  // ---------- 4. Guachinche: nueve salas en la misma planta con telepads ----------
  await jump('Guachinche de El Rosario', /Guachinche de El Rosario/);
  await wait('position', '27,36');
  async function pad([px, py], [lx, ly]) {
    await plan([px, py]);
    await wait('position', `${lx},${ly}`);
    if (await canvas.getAttribute('data-phase') === 'diálogo') await dismiss();
    await wait('phase', 'exploración'); // termina el fundido del teletransporte
    assert.equal(await canvas.getAttribute('data-map'), 'guachinche_rosario', 'el salto no cambia de planta');
  }
  await pad([23, 31], [45, 7]);  // sala de entrada → superior derecha
  await pad([41, 5], [9, 20]);   // superior derecha → media izquierda
  await pad([5, 18], [45, 20]);  // media izquierda → media derecha
  await pad([41, 18], [27, 7]);  // media derecha → central superior
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(260);
  await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(80);
  await page.keyboard.press('z');
  await wait('phase', 'diálogo');
  const leader = await readDialog();
  assert.match(leader.lines.join(' '), /GUACHINCHE DE EL ROSARIO/);
  assert.ok(leader.choice, 'el líder plantea el duelo');
  await decline();
  console.log('ok - guachinche: cuatro saltos entre salas distintas hasta la mesa del líder, todo en la misma planta');
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
