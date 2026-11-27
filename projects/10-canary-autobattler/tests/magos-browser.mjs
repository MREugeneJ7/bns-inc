import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1366, height: 850 } });
const errors = []; page.on('pageerror', e => errors.push(e.message));
const canvas = page.locator('canvas[data-map]');
const wait = (k, v) => page.waitForFunction(([k, v]) => document.querySelector('canvas[data-map]')?.dataset[k] === v, [k, v], { polling: 'raf', timeout: 8000 });
const snap = () => page.evaluate(() => JSON.parse(localStorage.getItem('magomon.local.v1')));
const tap = async k => { await page.keyboard.down(k); await page.waitForTimeout(42); await page.keyboard.up(k); await page.waitForTimeout(20); };
async function move(k, x, y) { await page.keyboard.down(k); try { await wait('position', `${x},${y}`); } finally { await page.keyboard.up(k); } }
async function dismiss() { const lines = []; for (let i = 0; i < 80; i++) { const [p, d] = await canvas.evaluate(c => [c.dataset.phase, c.dataset.dialogue]); if (p === 'exploración') return lines.join(' '); if (p === 'diálogo') { if (d && lines.at(-1) !== d) lines.push(d); await tap('z'); } else await page.waitForTimeout(25); } throw Error('diálogo'); }
async function choose(label) { for (let i = 0; i < 30 && !(await canvas.getAttribute('data-choice')); i++) await tap('z'); for (let i = 0; i < 12; i++) { if ((await canvas.getAttribute('data-choice'))?.startsWith(label)) { await tap('z'); return; } await tap('ArrowDown'); } throw Error('opción ' + label); }
try {
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:4187', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: /PARTIDA/ }).click();
  await page.getByRole('button', { name: 'Saltos rápidos' }).click();
  await page.getByRole('textbox', { name: 'Buscar capítulo' }).fill('Magos · Azotea');
  await page.getByRole('button', { name: /Magos · Azotea/ }).click();
  await wait('map', 'magos_azotea'); await wait('position', '10,6'); await dismiss();
  const before = await snap();
  assert.deepEqual(before.magosKeys, [1, 2]);
  assert.equal(before.flags.has_cazafantasmas, true);
  assert.equal(before.flags.has_fotocopiadora, undefined);
  await move('ArrowUp', 10, 5); await move('ArrowUp', 10, 4); await move('ArrowUp', 10, 3);
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => document.querySelector('canvas[data-map]')?.dataset.phase === 'diálogo');
  await page.keyboard.up('ArrowUp');
  const speech = await dismiss();
  assert.match(speech, /RICARDO GARCÍA/);
  assert.deepEqual((await canvas.evaluate(c => c.dataset.position.split(',').map(Number))), [10, 3]);
  await move('ArrowRight', 12, 3); await tap('ArrowRight'); await tap('z');
  await page.waitForFunction(() => (document.querySelector('canvas[data-map]')?.dataset.dialogue || '').includes('EL COCO'));
  console.log('ok - dos llaves abren la puerta de la azotea y Ricardo y el Coco están dentro');

  // La máquina se prueba en un duelo: no desde la mochila.
  const state = await snap();
  state.flags.has_fotocopiadora = true; delete state.flags.used_fotocopiadora;
  state.mapId = 'tf1'; state.playerPos = { x: 133, y: 15, dir: 'down' }; state.duros = 300;
  state.deck = [...Array(12).fill('tierra_volcan'), 'chola', 'golpe', 'clipper', 'mojo', 'cabra', 'vieja', 'gaviota', 'lapa', 'baifo', 'lagarto', 'chupito_garrafon'];
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: /PARTIDA/ }).click();
  await page.getByRole('textbox', { name: 'Partida en JSON' }).fill(JSON.stringify(state));
  await page.getByRole('button', { name: 'Cargar', exact: true }).click();
  await wait('map', 'tf1'); await dismiss();
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: /PARTIDA/ }).click();
  await page.getByRole('button', { name: 'Saltos rápidos' }).click();
  await page.getByRole('button', { name: 'Duelo de prueba en el laboratorio' }).click();
  await page.getByRole('button', { name: 'BARAJAR Y ROBAR 7' }).click();
  await page.getByRole('button', { name: 'PAUSA', exact: true }).click();
  const foto = page.getByRole('button', { name: 'FOTO', exact: true }); await foto.waitFor({ timeout: 3000 });
  await foto.click();
  const dialog = page.getByRole('dialog', { name: 'Fotocopiadora' });
  await dialog.waitFor();
  const picks = dialog.getByRole('button'); assert.ok(await picks.count() > 1);
  await picks.nth(1).click();
  await page.waitForTimeout(1700);
  const after = await snap();
  assert.equal(after.flags.used_fotocopiadora, true);
  await assert.doesNotReject(async () => assert.equal(await foto.isDisabled(), true));
  assert.deepEqual(errors, []);
  console.log('ok - la fotocopiadora interrumpe el duelo, deja elegir una carta rival y se gasta');
} finally { await browser.close(); }
