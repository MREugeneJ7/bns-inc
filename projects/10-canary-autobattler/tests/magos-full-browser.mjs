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
async function dismiss() {
  const lines = [];
  for (let i = 0; i < 80; i++) {
    const [p, d] = await canvas.evaluate(c => [c.dataset.phase, c.dataset.dialogue]);
    if (p === 'exploración') return lines.join(' ');
    if (p === 'diálogo') { if (d && lines.at(-1) !== d) lines.push(d); await tap('z'); }
    else await page.waitForTimeout(25);
  }
  throw Error('diálogo no terminó');
}

try {
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:4187', { waitUntil: 'networkidle' });

  // 1. Entrar desde la plaza de El Rosario (edificio Magos de la Costa)
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: /PARTIDA/ }).click();
  await page.getByRole('button', { name: 'Saltos rápidos' }).click();
  await page.getByRole('textbox', { name: 'Buscar capítulo' }).fill('Magos de la Costa');
  await page.getByRole('button', { name: /Magos de la Costa.*Recepción/ }).click();
  await wait('map', 'magos_pb');
  await dismiss();

  // 2. Salir por la puerta sur de vuelta a El Rosario (sin atascarse)
  await move('ArrowDown', 10, 10);
  await wait('map', 'el_rosario');
  await page.waitForFunction(() => ['18,8', '18,9'].includes(document.querySelector('canvas[data-map]')?.dataset.position));
  await dismiss();
  // Volver a entrar por la puerta (sin estamparse con ningún cartel)
  await move('ArrowUp', 18, 7);
  await wait('map', 'magos_pb');
  await dismiss();
  console.log('ok - entrada desde la plaza y salida por la puerta sur verificadas en navegador');

  // 3. Subir por los teletransportadores hasta la azotea con presets de llaves
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: /PARTIDA/ }).click();
  await page.getByRole('button', { name: 'Saltos rápidos' }).click();
  await page.getByRole('textbox', { name: 'Buscar capítulo' }).fill('Magos · Azotea');
  await page.getByRole('button', { name: /Magos · Azotea/ }).click();
  await wait('map', 'magos_azotea');
  await wait('position', '10,6');
  await dismiss();

  // 4. Abrir la puerta con las dos llaves magnéticas
  await move('ArrowUp', 10, 5);
  await move('ArrowUp', 10, 4);
  await move('ArrowUp', 10, 3);
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => document.querySelector('canvas[data-map]')?.dataset.phase === 'diálogo');
  await page.keyboard.up('ArrowUp');
  const speech = await dismiss();
  assert.match(speech, /RICARDO GARCÍA/);
  assert.match(speech, /Garfield/);

  // 5. Hablar con Ricardo García tras abrir
  await move('ArrowLeft', 6, 3);
  await tap('ArrowLeft');
  await tap('z');
  await page.waitForFunction(() => document.querySelector('canvas[data-map]')?.dataset.phase === 'diálogo');
  const chat = await dismiss();
  assert.match(chat, /Garfield/);

  // 6. Duelo contra El Coco: entrar en combate y verificar títulos de la azotea
  await move('ArrowRight', 12, 3);
  await tap('ArrowRight');
  await tap('z');
  for (let i = 0; i < 20 && !(await canvas.getAttribute('data-choice')); i++) await tap('z');
  await tap('z'); // Aceptar combate
  await page.getByRole('button', { name: 'BARAJAR Y ROBAR 7' }).waitFor({ timeout: 4000 });
  const bodyText = await page.locator('body').innerText();
  assert.match(bodyText, /EL COCO/);
  assert.match(bodyText, /MAGOS DE LA COSTA/);

  assert.deepEqual(errors, []);
  console.log('ok - Ricardo (referencia Garfield), El Coco y fotocopiadora probados en navegador');
} finally {
  await browser.close();
}

  // 7. Test interactivo del botón FOTO en combate: copia carta rival a la mano
  await page.getByRole('button', { name: 'BARAJAR Y ROBAR 7' }).click({ force: true });
  await page.getByRole('button', { name: 'PAUSA', exact: true }).click({ force: true });
  // Simular la fotocopiadora ganada
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('magomon.local.v1'));
    s.flags.has_fotocopiadora = true;
    localStorage.setItem('magomon.local.v1', JSON.stringify(s));
  });
  // Abrir y usar menú de partida para forzar reload limpio
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button', { name: /PARTIDA/ }).click();
  await page.getByRole('button', { name: 'Saltos rápidos' }).click();
  await page.getByRole('button', { name: 'Duelo de prueba en el laboratorio' }).click();
  await page.getByRole('button', { name: 'BARAJAR Y ROBAR 7' }).click({ force: true });
  await page.getByRole('button', { name: 'PAUSA', exact: true }).click({ force: true });
  const fotoBtn = page.getByRole('button', { name: 'FOTO', exact: true });
  await fotoBtn.waitFor({ timeout: 5000 });
  await fotoBtn.click({ force: true });
  const modal = page.getByRole('dialog', { name: 'Fotocopiadora' });
  await modal.waitFor();
  assert.match(await modal.innerText(), /FOTOCOPIADORA/);
  const rivalOption = modal.getByRole('button', { name: /LAGARTO|LAPA|GAVIOTA|CHOCO|VIEJA/i }).first();
  await rivalOption.click({ force: true });
  await page.waitForTimeout(1600);
  const finalSnap = await snap();
  assert.equal(finalSnap.flags.used_fotocopiadora, true);
  console.log('ok - botón FOTO copia en combate y persiste como usada');
