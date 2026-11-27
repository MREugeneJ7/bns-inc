import { BORONDON_RETURN, GOMERA_BUOYS, GOMERA_TRAINERS } from './mapsGomera';
import { PAL, TILE } from './sprites';

function dab(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, shade: number) {
  ctx.fillStyle = PAL[shade];
  ctx.fillRect(x, y, w, h);
}

export function drawGomeraTown(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
  const labels: [string, number, number][] = [
    ['PARRANDERO', 2, 4], ['CERTIFICADOR', 12, 4], ['COLEGIO', 37, 4],
    ['MANSION', 4, 17], ['GUACHINCHE', 31, 17],
  ];
  ctx.save();
  ctx.font = '5px "Press Start 2P", monospace';
  ctx.textBaseline = 'top';
  for (const [text, tx, ty] of labels) {
    const x = tx * TILE - camX, y = ty * TILE - camY;
    const width = Math.ceil(ctx.measureText(text).width);
    dab(ctx, x - 2, y + 2, width + 4, 9, 3);
    ctx.fillStyle = PAL[0]; ctx.fillText(text, x, y + 4);
  }
  ctx.restore();
}

export function drawGomeraSea(ctx: CanvasRenderingContext2D, camX: number, camY: number, frame: number, islandVisible: boolean) {
  for (const [tx, ty] of GOMERA_BUOYS) {
    const x = tx * TILE + 8 - camX;
    const y = ty * TILE + 4 - camY + (Math.floor(frame / 18) % 2);
    if (x < -6 || x > 166 || y < -12 || y > 146) continue;
    dab(ctx, x - 5, y + 8, 10, 2, 0);
    dab(ctx, x - 4, y + 4, 8, 4, 3);
    dab(ctx, x - 2, y + 1, 4, 5, 3);
    dab(ctx, x - 1, y + 2, 2, 2, 0);
    dab(ctx, x - 3, y + 5, 6, 1, 2);
  }

  for (const boat of GOMERA_TRAINERS) {
    if (boat.sprite !== 'barco_delfines') continue;
    const x = (boat.x + 3) * TILE - camX;
    const y = (boat.y - 1) * TILE + 10 - camY;
    const leap = (frame + boat.y) % 154;
    if (x < -24 || x > 166 || y < -12 || y > 154 || leap >= 36) continue;
    const dx = x + Math.floor(leap / 2), dy = y - Math.round(8 * Math.sin(Math.PI * leap / 36));
    dab(ctx, x - 1, y + 2, 18, 1, 0);
    dab(ctx, dx, dy + 2, 8, 3, 3); dab(ctx, dx + 3, dy, 2, 3, 3);
    dab(ctx, dx + 8, dy + 4, 3, 1, 2); dab(ctx, dx - 2, dy + 4, 4, 1, 3);
    dab(ctx, dx + 3, dy + 4, 4, 1, 0);
  }

  const bx = BORONDON_RETURN.x * TILE - camX;
  const by = (BORONDON_RETURN.y - 4) * TILE - camY;
  if (bx < -64 || bx > 224 || by < -48 || by > 192) return;
  for (let i = 0; i < 6; i++) {
    const drift = (Math.floor(frame / 7) + i * 11) % 28;
    const x = bx - 35 + i * 12 + drift;
    const y = by - 26 + i * 11;
    dab(ctx, x + 4, y, 14, 1, 2);
    dab(ctx, x, y + 1, islandVisible ? 20 : 31, 2, 0);
    dab(ctx, x + 7, y + 3, 16, 1, 1);
  }
}

export function drawGomeraVessel(ctx: CanvasRenderingContext2D, sprite: string, x: number, y: number, frame: number): boolean {
  if (sprite !== 'barco_delfines' && sprite !== 'moto_acuatica') return false;
  const bob = Math.floor(frame / 16) % 2;
  const paint = (dx: number, dy: number, w: number, h: number, shade: number) => dab(ctx, x + dx, y + dy + bob, w, h, shade);

  if (sprite === 'barco_delfines') {
    paint(-15, 14, 42, 2, 0); paint(-13, 15, 21 - bob * 5, 1, 2);
    paint(-15, 6, 46, 4, 3); paint(-13, 10, 41, 3, 3); paint(-10, 13, 35, 1, 3);
    paint(-13, 7, 40, 2, 0); paint(-10, 11, 35, 1, 2);
    paint(-7, -5, 24, 11, 3); paint(-9, -6, 28, 2, 0);
    for (let i = 0; i < 3; i++) paint(-5 + i * 7, -3, 5, 4, 1);
    paint(6, -11, 1, 5, 3); paint(7, -11, 6, 2, 0);
    paint(20, 2, 11, 1, 0); paint(20, 3, 1, 3, 0); paint(29, 3, 1, 3, 0);
    paint(23, 1, 4, 4, 3); paint(24, 1, 2, 2, 1);
  } else {
    paint(-4 - bob * 2, 13, 16, 2, 0); paint(-2, 15, 10, 1, 2);
    paint(0, 9, 15, 4, 3); paint(2, 13, 11, 1, 3); paint(2, 10, 11, 2, 0); paint(12, 7, 3, 2, 3);
    paint(4, 0, 6, 5, 3); paint(7, 2, 3, 2, 0); paint(4, 5, 6, 4, 2);
    paint(8, 6, 5, 2, 3); paint(2, 8, 7, 2, 3);
  }
  return true;
}