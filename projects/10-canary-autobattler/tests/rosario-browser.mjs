import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const mobile = process.env.TEST_MOBILE === '1';
const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1366, height: 850 }, hasTouch: mobile });
const errors = []; page.on('pageerror', e => errors.push(e.message));
const canvas = page.locator('canvas[data-map]');
const snapshot = () => page.evaluate(() => JSON.parse(localStorage.getItem('magomon.local.v1')));
const waitState = (key, value) => page.waitForFunction(([k, v]) => document.querySelector('canvas[data-map]')?.dataset[k] === v, [key, value], { polling: 'raf', timeout: 8000 });
const pos = (x, y) => waitState('position', `${x},${y}`);
const tap = async key => { await page.keyboard.down(key); await page.waitForTimeout(38); await page.keyboard.up(key); await page.waitForTimeout(22); };
async function move(key, x, y) {
  await page.keyboard.down(key);
  try { await pos(x, y); } catch (error) {
    throw new Error(`Destino ${x},${y}: ${await canvas.getAttribute('data-map')} en ${await canvas.getAttribute('data-position')}`, { cause: error });
  } finally { await page.keyboard.up(key); }
}
async function cross(key, dest) {
  await page.keyboard.down(key); try { await waitState('map', dest); } finally { await page.keyboard.up(key); }
  await dismiss();
}
async function dismiss() {
  const text = [];
  for (let i = 0; i < 90; i++) {
    const [phase, line, choice] = await canvas.evaluate(c => [c.dataset.phase, c.dataset.dialogue, c.dataset.choice]);
    if (phase === 'exploración') return text.join(' ');
    if (choice) throw Error('Se esperaba diálogo sin menú: ' + choice);
    if (phase === 'diálogo') { text.push(line); await tap('z'); } else await page.waitForTimeout(30);
  }
  throw Error('No se cerró el diálogo');
}
async function choose(option) {
  for (let i = 0; i < 40 && !(await canvas.getAttribute('data-choice')); i++) await tap('z');
  for (let i = 0; i < 12; i++) {
    if ((await canvas.getAttribute('data-choice'))?.startsWith(option)) { await tap('z'); return; }
    await tap('ArrowDown');
  }
  throw Error(`Opción no encontrada: ${option}`);
}
async function jet(label) {
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: /MOCHILA/ }).click();
  await page.getByRole('button', { name: 'USAR (VOLAR CON BINTER)' }).click();
  await page.getByText(label, { exact: false }).locator('../..').getByRole('button', { name: 'VOLAR' }).click();
  await waitState('map', label.includes('SCZ') ? 'santacruz_sur' : 'calle');
  await dismiss();
}
async function lift(floor, map) {
  await tap('ArrowUp'); await tap('z'); await choose(floor); await waitState('map', map); await dismiss();
}
async function buy(label) {
  await tap('ArrowUp'); await tap('z'); await choose(label); await choose('COMPRAR'); await dismiss();
}

try {
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:4187', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: /PARTIDA/ }).click();
  await page.getByRole('button', { name: 'Saltos rápidos' }).click();
  const titles = await page.locator('.preset-list strong').allTextContents();
  assert.ok(titles.length >= 34);
  titles.forEach((t, i) => assert.match(t, new RegExp('^' + (i + 1) + '\\. ')));
  await page.getByRole('textbox', { name: 'Buscar capítulo' }).fill('Caletillas');
  await page.getByRole('button', { name: /Caletillas.*Desembarco/ }).click();
  await waitState('map', 'tf1');
  const atCaletillas = await snapshot(); assert.ok(atCaletillas.flags.hm_pukas && atCaletillas.flags.hm_salto_pastor);
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: /PARTIDA/ }).click();
  await page.getByRole('button', { name: 'Saltos rápidos' }).click();
  await page.getByRole('textbox', { name: 'Buscar capítulo' }).fill('Plaza de Candelaria');
  await page.getByRole('button', { name: /Plaza de Candelaria.*Tras Papagayos/ }).click();
  await pos(136, 18);
  await move('ArrowLeft', 133, 18); await cross('ArrowUp', 'barranco_hondo');
  await move('ArrowUp', 4, 8); await move('ArrowRight', 22, 8);
  await tap('ArrowRight'); await tap('z'); assert.match(await dismiss(), /azotea de El Corte Inglés/);
  assert.equal(!!(await snapshot()).flags.rosario_open, false);
  console.log('ok - Candelaria al norte, carretera al este, primera cuadrilla cerrada');

  await jet('[SCZ]'); await move('ArrowDown', 56, 8); await move('ArrowLeft', 44, 8); await cross('ArrowUp', 'eci_pb');
  await move('ArrowUp', 10, 3); await lift('3 ·', 'eci_3'); await lift('7 ·', 'eci_azotea');
  await move('ArrowDown', 10, 6); await move('ArrowLeft', 5, 6);
  const money = (await snapshot()).duros;
  await buy('GUINNESS'); await buy('TACOA');
  const purchase = await snapshot(); assert.deepEqual(purchase.beers, { guinness: 1, tacoa: 1 });
  assert.equal(purchase.duros, money - 14); assert.ok(!purchase.flags.rosario_open);
  await page.reload({ waitUntil: 'networkidle' }); await tap('z'); await waitState('phase', 'exploración');
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: /MOCHILA/ }).click();
  await page.getByText('COMPRA GOURMET', { exact: true }).waitFor();
  await page.getByText('Guinness', { exact: true }).waitFor(); await page.getByText('Tacoa', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'CERRAR', exact: true }).click();
  await move('ArrowRight', 10, 6); await move('ArrowUp', 10, 3); await lift('PB ·', 'eci_pb');
  await cross('ArrowDown', 'santacruz_sur');
  console.log('ok - puerta de El Corte Inglés, ascensor, compra, mochila, recarga y vuelta a la calle');

  await jet('[WEY]'); await move('ArrowDown', 66, 9); await move('ArrowLeft', 26, 9);
  await move('ArrowUp', 26, 6); await move('ArrowLeft', 10, 6); await move('ArrowDown', 10, 9);
  await cross('ArrowLeft', 'acceso_taco'); await move('ArrowLeft', 12, 8);
  await tap('ArrowLeft'); await tap('z'); await choose('GUINNESS'); assert.match(await dismiss(), /guárdatela/);
  assert.equal(!!(await snapshot()).flags.rosario_open, false); assert.equal((await snapshot()).beers.guinness, 1);
  await tap('z'); await choose('TACOA'); await dismiss();
  const unlocked = await snapshot(); assert.ok(unlocked.flags.rosario_open); assert.deepEqual(unlocked.beers, { guinness: 1 });
  await page.reload({ waitUntil: 'networkidle' }); await tap('z'); await waitState('phase', 'exploración');
  await cross('ArrowLeft', 'el_rosario'); await move('ArrowLeft', 32, 10);
  await move('ArrowUp', 32, 8); await cross('ArrowUp', 'colegio'); await cross('ArrowDown', 'el_rosario');
  await move('ArrowDown', 32, 9); await move('ArrowLeft', 5, 9); await move('ArrowUp', 5, 8); await cross('ArrowUp', 'parrandero');
  await move('ArrowUp', 4, 3); await move('ArrowLeft', 3, 3); await tap('ArrowUp'); await tap('z'); assert.match(await dismiss(), /LA ESPERANZA/);
  await move('ArrowRight', 4, 3); await move('ArrowDown', 4, 7); await cross('ArrowDown', 'el_rosario');
  await move('ArrowDown', 5, 9); await move('ArrowRight', 23, 9); await move('ArrowDown', 23, 13);
  await move('ArrowRight', 24, 13); await tap('ArrowDown'); await tap('z'); await choose('LUCHAR'); await page.getByRole('button', { name: 'BARAJAR Y ROBAR 7' }).waitFor();
  assert.match(await page.locator('body').innerText(), /TERRERO DE LUCHA/);
  assert.equal(await page.locator('body').getByText(/BOLICHE/).count(), 0, 'no se anuncia boliche');
  await page.getByRole('button', { name: 'BARAJAR Y ROBAR 7' }).click(); await page.getByRole('button', { name: 'x4', exact: true }).click();
  const end = page.getByRole('button', { name: /ABRIR SOBRE|IR AL CENTRO PARRANDERO/ }); await end.waitFor({ timeout: 90000 });
  const won = (await end.textContent())?.includes('ABRIR SOBRE'); await end.click();
  if (won) { await page.getByRole('dialog', { name: 'ELIGE 1 DE 5' }).waitFor(); await page.waitForTimeout(2000); await page.getByRole('button', { name: /carta 1 de 5/ }).click(); await page.getByRole('button', { name: 'GUARDAR EN PC' }).click(); await page.getByRole('button', { name: 'CERRAR SOBRE' }).click(); }
  else { await waitState('map', 'parrandero'); assert.equal((await snapshot()).lastCenter, 'rosario'); }
  const finished = await snapshot();
  assert.equal(Object.keys(finished.flags).filter(k => k.startsWith('boliche_')).length, 5, 'el terrero no suma boliche');
  assert.deepEqual(errors, []);
  console.log('ok - Taco al oeste, cuadrilla, colegio, centro y terrero sin boliche en El Rosario');
} finally { await browser.close(); }