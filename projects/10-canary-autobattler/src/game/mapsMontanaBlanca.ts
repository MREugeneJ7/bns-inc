import type { GameMap, Trigger } from './maps';
import { SENDERO_ENTRY } from './mapsSenderoTelesforo';
import { PAL, TILE, type TileId } from './sprites';

// Montaña Blanca: arena blanca y cuatro terrazas separadas por barrancos de una baldosa.
// Cada barranco se salta con la VARA DEL SALTO DEL PASTOR. El camino principal alterna
// saltos hacia arriba y hacia los lados; la carta legendaria está en un callejón sin salida.
export const MONTANA_ENTRY = { x: 10, y: 27 } as const;
export const MONTANA_EXIT = { x: 10, y: 28 } as const;
export const NARICES_CARD = { x: 13, y: 10 } as const;
export const REFUGIO_DOORS = { center: { x: 6, y: 3 }, school: { x: 14, y: 3 } } as const;

const W = 22;
const H = 30;

function buildGrid(): string[][] {
  const g: string[][] = Array.from({ length: H }, () => Array<string>(W).fill('#'));
  const rect = (x0: number, y0: number, x1: number, y1: number, ch: string) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch;
  };
  // Refugio: un edificio con Centro Parrandero (izquierda) y colegio (derecha), dos puertas al sur.
  rect(2, 0, 19, 3, 'b');
  // Pasillo central entre las dos alas: sube al Sendero Telesforo Bravo (Alto Mando).
  rect(10, 0, 10, 3, '.');
  g[3][REFUGIO_DOORS.center.x] = 'D';
  g[3][REFUGIO_DOORS.school.x] = 'D';
  g[1][4] = 'H';
  g[1][17] = 'J';
  // Plaza del refugio.
  rect(1, 4, 20, 6, 's');
  g[4][1] = 'P'; g[4][20] = 'P'; g[5][8] = 'h'; g[5][12] = 'h'; g[6][10] = 'T';
  // Barranco de la plaza (se salta desde el pasillo de arriba) y pasillo final.
  rect(1, 7, 20, 7, 'v');
  rect(1, 8, 20, 8, '.');
  // Único punto para subir desde la cámara oeste.
  g[9][2] = 'v';
  // Cámara oeste y cámara este.
  rect(1, 10, 6, 13, 's');
  rect(15, 10, 20, 13, 's');
  // Pasillo central con cuatro barrancos de una baldosa: hay que cruzarlos de lado.
  rect(8, 12, 13, 12, '.');
  g[12][7] = 'v'; g[12][10] = 'v'; g[12][14] = 'v';
  // Callejón sin salida de la carta: solo se entra saltando (12,11) desde el pasillo.
  g[10][11] = '.'; g[10][12] = '.'; g[11][12] = 'v';
  g[NARICES_CARD.y][NARICES_CARD.x] = '*';
  // Barranco entre la cámara este y la cámara media.
  g[14][16] = 'v';
  // Cámara media (senderistas) partida por un barranco vertical: se cruza de oeste a este.
  rect(1, 15, 20, 19, 's');
  for (let y = 15; y <= 19; y++) g[y][10] = 'v';
  g[17][9] = 'T';
  // Único acceso desde la base: el barranco del oeste.
  g[20][5] = 'v';
  // Base: arena y llegada desde la carretera general.
  rect(1, 21, 20, 28, 's');
  g[21][1] = 'P'; g[27][19] = 'P'; g[24][17] = 'h'; g[25][3] = 'T';
  return g;
}

const LEGEND: Record<string, TileId> = {
  '#': 'wall', s: 'arid', '.': 'path', v: 'ravine', b: 'building', D: 'door',
  H: 'parranda', J: 'colegio', '*': 'card', T: 'sign', P: 'palm', h: 'bench',
};

const sign = (x: number, y: number, ...lines: string[]): Trigger =>
  ({ x, y, kind: 'interact', action: { type: 'text', lines } });

function buildMontana(): GameMap {
  const g = buildGrid();
  return {
    id: 'montana_blanca', name: 'Montaña Blanca · Subida al Refugio',
    rows: g.map((row) => row.join('')), legend: LEGEND,
    npcs: [
      { id: 'senderista_hans', sprite: 'parrandero', x: 4, y: 23, trainer: 'senderista_hans' },
      { id: 'senderista_greta', sprite: 'runner', x: 7, y: 17, trainer: 'senderista_greta' },
      { id: 'senderista_klaus', sprite: 'guiri_crema', x: 18, y: 11, trainer: 'senderista_klaus' },
    ],
    triggers: [
      { x: MONTANA_EXIT.x, y: MONTANA_EXIT.y, kind: 'step', action: { type: 'orotavaReturn' } },
      { ...NARICES_CARD, kind: 'interact', action: { type: 'pickupNarices' } },
      { x: REFUGIO_DOORS.center.x, y: REFUGIO_DOORS.center.y, kind: 'step', action: { type: 'enterParrandero', id: 'refugio' } },
      { x: REFUGIO_DOORS.school.x, y: REFUGIO_DOORS.school.y, kind: 'step', action: { type: 'enterSchool', id: 'refugio' } },
      sign(3, 25, 'MONTAÑA BLANCA. Las cornisas de lava no se cruzan andando: usa la VARA DEL SALTO DEL PASTOR desde la mochila.'),
      sign(9, 17, 'Sendero de los senderistas alemanes. Los barrancos se cruzan hacia arriba y de lado. Un callejón guarda algo que brilla.'),
      { x: 10, y: 0, kind: 'step', action: { type: 'warp', to: 'sendero_telesforo', x: SENDERO_ENTRY.x, y: SENDERO_ENTRY.y, dir: 'up' } },
      sign(10, 6, 'REFUGIO MONTAÑA BLANCA. Centro Parrandero a la izquierda, colegio a la derecha. Los dos están abiertos.', 'Entre los dos sale un pasillo hacia arriba: el Sendero Telesforo Bravo, donde espera el Alto Mando.'),
    ],
    onEnter: [
      'Dejas la carretera general atrás y empiezas a subir por la arena blanca de Montaña Blanca.',
      'Hay barrancos en medio del camino. Mira al otro borde y usa la VARA DEL SALTO DEL PASTOR desde la mochila.',
    ],
  };
}

export const MONTANA_BLANCA_MAP = buildMontana();

export function drawRefugioDetails(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
  const label = (text: string, tx: number, ty: number) => {
    const x = tx * TILE - camX, y = ty * TILE - camY;
    if (x < -90 || x > 170 || y < -12 || y > 148) return;
    ctx.save();
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.textBaseline = 'top';
    ctx.fillStyle = PAL[3];
    ctx.fillRect(x - 2, y, Math.ceil(ctx.measureText(text).width) + 4, 9);
    ctx.fillStyle = PAL[0];
    ctx.fillText(text, x, y + 2);
    ctx.restore();
  };
  label('PARRANDERO', 1, 0);
  label('COLEGIO', 13, 0);
}

export const REFUGIO_TALKS: Record<string, string[]> = {
  senderista_hans: [
    'SENDERISTA HANS: Guten Tag! Llevo tres horas subiendo y mi mochila pesa más que tu mazo.',
    'SENDERISTA HANS: ¿Una partida? Si ganas, te dejo pasar a la cornisa. Si gano yo, me pagas el agua.',
  ],
  senderista_greta: [
    'SENDERISTA GRETA: Achtung! El viento cambia cada tres cartas, como mis calcetines.',
  ],
  senderista_klaus: [
    'SENDERISTA KLAUS: Ich habe eine Karte verloren... dicen que estaba enterrada en la arena cerca del callejón. ¿La viste?',
  ],
};
