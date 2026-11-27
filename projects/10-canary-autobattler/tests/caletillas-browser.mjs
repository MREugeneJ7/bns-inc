import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const mobile = process.env.TEST_MOBILE === '1';
const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1366, height: 850 }, hasTouch: mobile });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const buttons = (name) => page.getByRole('button', { name, exact: typeof name === 'string' });
const position = (x, y) => page.waitForFunction((point) =>
  document.querySelector('canvas[data-map="tf1"]')?.getAttribute('data-position') === point,
`${x},${y}`, { polling: 'raf', timeout: 6000 });
const snapshot = () => page.evaluate(() => JSON.parse(localStorage.getItem('magomon.local.v1')));

async function move(key, x, y) {
  await page.keyboard.down(key);
  try {
    await position(x, y);
  } catch (error) {
    const at = await page.locator('canvas').getAttribute('data-position');
    throw new Error(`No se llegó a ${x},${y} con ${key}; posición: ${at}`, { cause: error });
  } finally {
    await page.keyboard.up(key);
  }
}

async function face(key) {
  await page.keyboard.down(key);
  await page.waitForTimeout(80);
  await page.keyboard.up(key);
}

async function surf() {
  await page.getByRole('button', { name: 'START' }).click(); await buttons(/MOCHILA/).click();
  await buttons('USAR TABLA PUKAS (SURF)').click();
}

try {
  const state = {
    version: 11, mapId: 'tf1', playerPos: { x: 133, y: 15, dir: 'down' }, starter: 'angelote',
    flags: { starterChosen: true, hm_pukas: true, visited_tf1: true, errand: true },
    deck: ['chola', 'lagarto', 'tierra_volcan', 'tierra_volcan', 'tierra_charco', 'tierra_charco'],
  };
  await page.addInitScript((value) => localStorage.setItem('magomon.local.v1', JSON.stringify(value)), state);
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:4177', { waitUntil: 'networkidle' });
  await page.locator('canvas[data-phase="título"]').waitFor();
  await page.keyboard.press('z');
  await page.locator('canvas[data-phase="exploración"]').waitFor();
  await move('ArrowDown', 133, 18);
  await move('ArrowRight', 136, 18);
  await face('ArrowRight');
  await position(136, 18);
  assert.ok(!(await snapshot()).flags.pukas_out, 'tener Pukas no permite cruzar a pie');
  await surf();
  await position(137, 18);
  await move('ArrowRight', 142, 18);
  assert.equal((await snapshot()).flags.pukas_out, false, 'desembarca al este sin cambiar de mapa');
  await move('ArrowRight', 148, 18);
  await face('ArrowUp');
  await page.keyboard.press('z');
  await page.locator('canvas[data-phase="diálogo"]').waitFor();
  assert.equal((await snapshot()).deck.filter((id) => id === 'unelco').length, 1);
  for (let i = 0; i < 40 && await page.locator('canvas[data-phase="diálogo"]').count(); i++) {
    await page.keyboard.press('z');
    await page.waitForTimeout(70);
  }
  await move('ArrowLeft', 142, 18);
  await face('ArrowLeft');
  await surf();
  await position(141, 18);
  await move('ArrowLeft', 136, 18);
  assert.equal((await snapshot()).flags.pukas_out, false);
  console.log('ok - la Pukas cruza de la plaza a Caletillas y de vuelta en el mismo mapa, en línea recta');

  await page.getByRole('button', { name: 'START' }).click(); await buttons(/PARTIDA/).click();
  await buttons('Saltos rápidos').click();
  await buttons('Duelo de prueba en el laboratorio').click();
  await buttons('BARAJAR Y ROBAR 7').click();
  await buttons('Unelco (libre)').click();
  const unelco = page.getByRole('dialog', { name: 'Unelco', exact: true });
  assert.equal(await unelco.getByRole('button', { name: /Girar Unelco por maná/ }).count(), 5);
  await unelco.getByRole('button', { name: 'Girar Unelco por maná blanco' }).click();
  await buttons('Unelco (girada)').waitFor();
  await page.getByTitle('1 maná blanco disponible').waitFor();
  assert.equal(await page.getByText('APAGÓN', { exact: true }).count(), 0);
  await page.getByText(/paga.*Chola Voladora/).waitFor();
  assert.equal(await page.getByTitle('1 maná blanco disponible').count(), 0);

  await buttons(/^Unelco \(/).click();
  await unelco.getByRole('button', { name: 'SACRIFICAR: APAGÓN' }).click();
  const confirm = page.getByRole('dialog', { name: 'Confirmar Apagón' });
  await confirm.getByRole('button', { name: 'VOLVER' }).click();
  assert.equal(await buttons(/^Unelco \(/).count(), 1, 'cancelar no sacrifica la tierra');
  await unelco.getByRole('button', { name: 'SACRIFICAR: APAGÓN' }).click();
  await confirm.getByRole('button', { name: 'CONFIRMAR SACRIFICIO' }).click();
  assert.equal(await buttons(/^Unelco \(/).count(), 0);
  await page.getByText('APAGÓN', { exact: true }).first().waitFor();
  await buttons(/CEM$/).click();
  assert.match(await page.getByText(/TUS CAIDOS/).locator('..').innerText(), /Unelco/);
  assert.deepEqual(errors, []);
  console.log('ok - Unelco se gira por el color elegido, paga la carta y solo se sacrifica con confirmación');
} finally {
  await browser.close();
}