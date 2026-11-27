import type { GameMap } from './maps';
import { PAL } from './sprites';

// Adeje uses the same four-colour rule as the rest of the Game Boy world.
export const FUCSIA_PALETTE = ['#f2d9ee', '#c69ac8', '#82568d', '#382342'] as const;

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.save();
  ctx.font = '5px "Press Start 2P", monospace';
  ctx.textBaseline = 'top';
  const width = Math.ceil(ctx.measureText(text).width);
  ctx.fillStyle = PAL[3]; ctx.fillRect(x - 3, y - 3, width + 6, 11);
  ctx.fillStyle = PAL[0]; ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawCoastDetails(ctx: CanvasRenderingContext2D, map: GameMap, camX: number, camY: number, frame: number) {
  const mark = (text: string, x: number, y: number) => label(ctx, text, x * 16 - camX, y * 16 - camY);
  if (map.id === 'veronicas') {
    mark('SAN EUGENIO', 29, 6);
    mark('HOTEL H10', 14, 6);
    mark('MONKEY BEACH', 22, 16);
    mark('PLAYA DE TROYA', 40, 22);
    mark('LAS VERONICAS', 56, 16);
    mark('PAPAGAYOS', 71, 15);
    mark('C.P. TROYA', 33, 15);
    for (const [tx,ty] of [[12,7],[24,7],[38,7],[24,17],[34,17],[43,17],[52,17],[62,17],[71,17],[79,17]]) {
      const x = tx * 16 - camX + 4;
      const y = ty * 16 - camY;
      if (x < -16 || x > 176) continue;
      ctx.fillStyle = PAL[3]; ctx.fillRect(x, y, 2, 18);
      ctx.fillStyle = frame % 120 < 8 ? PAL[1] : PAL[0]; ctx.fillRect(x - 2, y - 3, 6, 4);
    }
  } else if (map.id === 'papagayos') {
    mark('PAPAGAYOS', 8, 1);
    mark('SALIDA', 8, 20);
    ctx.fillStyle = PAL[3]; ctx.fillRect(7 * 16 - camX, 2 * 16 - camY + 12, 80, 3);
    ctx.fillStyle = PAL[0]; ctx.fillRect(7 * 16 - camX, 2 * 16 - camY + 15, 80, 1);
  } else if (map.id === 'puente_magma') {
    mark('MAGMA', 1, 16);
    mark('TF-1', 1, 8);
    mark('SIAM PARK', 9, 2);
  } else if (map.id === 'las_americas') {
    mark('MAGMA', 20, 4);
    mark('ADEJE <', 1, 7);
  }
}