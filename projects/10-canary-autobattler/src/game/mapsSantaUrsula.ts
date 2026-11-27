import type { Dir } from './input';
import type { GameMap, Trigger } from './maps';
import { LA_QUINTA_EXIT } from './mapsTf5';
import { DIABLITO_SINGING, DIABLITO_TRAINER } from './santaUrsulaQuest';
import { PAL, TILE, type TileId } from './sprites';

// Santa Úrsula está dibujada en ESPEJO horizontal: la carretera general sale hacia el SUROESTE.
const W_MAP = 64;
const H_MAP = 48;
const mirror = (x: number) => W_MAP - 1 - x;

// Coordenadas de trabajo (antes del espejo). Lo que se exporta ya está reflejado.
const O_ENTRY = { x: 11, y: 1 } as const;
const O_DOORS = {
  center: { x: 7, y: 14 }, school: { x: 25, y: 14 }, diablito: { x: 54, y: 39 },
} as const;
const O_ASCENT: readonly (readonly [number, number])[] = [[11, 0], [11, 7], [17, 7], [17, 20]];
const O_ROUTE: readonly (readonly [number, number])[] = [[17, 20], [28, 20], [34, 26], [42, 34], [51, 43], [57, 43]];

export const SANTA_URSULA_ENTRY = { x: mirror(O_ENTRY.x), y: O_ENTRY.y } as const;
export const URSULA_DOORS = {
  center: { x: mirror(O_DOORS.center.x), y: O_DOORS.center.y },
  school: { x: mirror(O_DOORS.school.x), y: O_DOORS.school.y },
  diablito: { x: mirror(O_DOORS.diablito.x), y: O_DOORS.diablito.y },
} as const;
export const GENERAL_ROUTE: readonly (readonly [number, number])[] = O_ROUTE.map(([x, y]) => [mirror(x), y] as const);

type Grid = string[][];
const grid = (w: number, h: number, ch: string): Grid => Array.from({ length: h }, () => Array<string>(w).fill(ch));
const rect = (g: Grid, x: number, y: number, right: number, bottom: number, ch: string) => {
  for (let j = y; j <= bottom; j++) for (let i = x; i <= right; i++) g[j][i] = ch;
};
const warp = (x: number, y: number, to: GameMap['id'], tx: number, ty: number, dir: Dir): Trigger =>
  ({ x, y, kind: 'step', action: { type: 'warp', to, x: tx, y: ty, dir } });
const sign = (x: number, y: number, ...lines: string[]): Trigger =>
  ({ x, y, kind: 'interact', action: { type: 'text', lines } });

function paintRoad(g: Grid, points: readonly (readonly [number, number])[], radius: number, ch: string) {
  let x = points[0][0];
  let y = points[0][1];
  const stamp = () => rect(
    g,
    Math.max(1, x - radius), Math.max(0, y - radius),
    Math.min(W_MAP - 2, x + radius), Math.min(H_MAP - 1, y + radius),
    ch,
  );
  stamp();
  for (const [tx, ty] of points.slice(1)) {
    while (x !== tx || y !== ty) {
      x += Math.sign(tx - x);
      y += Math.sign(ty - y);
      stamp();
    }
  }
}

/** El pueblo tal y como se pintó originalmente (antes del espejo). */
function cells(): Grid {
  const g = grid(W_MAP, H_MAP, 'E');
  paintRoad(g, O_ASCENT, 2, 's');
  paintRoad(g, O_ROUTE, 2, 's');
  rect(g, 3, 9, 30, 24, 'Z');
  paintRoad(g, O_ASCENT, 1, 'R');
  paintRoad(g, O_ROUTE, 1, 'R');
  rect(g, 3, 19, 28, 21, 'R');
  rect(g, 4, 10, 11, 14, 'B'); rect(g, 22, 10, 29, 14, 'B');
  for (const x of [5, 9, 23, 27]) g[12][x] = 'W';
  g[13][7] = 'H'; g[13][25] = 'J';
  for (const door of [O_DOORS.center, O_DOORS.school]) g[door.y][door.x] = 'D';
  rect(g, 12, 15, 14, 17, 'g'); g[16][13] = 'o';
  for (const [x, y] of [[4, 16], [29, 17], [5, 23], [24, 23]]) g[y][x] = 'P';
  g[17][9] = 'h'; g[17][20] = 'h';
  // Muros de contención y terrazas que se leen sin necesidad de puentes.
  rect(g, 6, 2, 8, 4, 'g'); rect(g, 6, 5, 8, 5, 'v');
  rect(g, 20, 3, 25, 5, 'g'); rect(g, 20, 6, 25, 6, 'v');
  for (let n = 0; n < 5; n++) {
    const x = 26 + n * 5, y = 26 + n * 4;
    rect(g, x, y, x + 2, y + 1, 'g');
    rect(g, x, y + 2, x + 2, y + 2, 'v');
  }
  rect(g, 48, 34, 60, 39, 'B');
  for (const x of [49, 51, 57, 59]) g[37][x] = 'W';
  g[35][58] = 'Q';
  rect(g, 50, 40, 58, 44, 'K');
  g[O_DOORS.diablito.y][O_DOORS.diablito.x] = 'D';
  for (const [x, y] of [[13, 2], [8, 15], [26, 15], [29, 22], [57, 40]]) g[y][x] = 'T';
  return g;
}

const LEGEND: Record<string, TileId> = {
  E: 'tree', s: 'sidewalk', R: 'road', Z: 'plaza', B: 'building', W: 'window',
  H: 'parranda', J: 'colegio', D: 'door', g: 'grass', o: 'monument', P: 'palm',
  h: 'bench', v: 'ravine', K: 'parking', T: 'sign', Q: 'fogon',
};

function santaUrsula(): GameMap {
  // 1. Espejo horizontal completo del pueblo.
  const g: Grid = cells().map((row) => [...row].reverse());

  // 2. Carretera general SUROESTE: sigue más allá del Diablito hasta el borde sur del mapa.
  paintRoad(g, [[mirror(57), 43], [mirror(57) - 2, H_MAP - 1]], 1, 'R');

  const triggers: Trigger[] = [
    ...[10, 11, 12].map((x) => warp(mirror(x), 0, 'tf5', LA_QUINTA_EXIT.x, LA_QUINTA_EXIT.y + 2, 'up')),
    { ...URSULA_DOORS.center, kind: 'step', action: { type: 'enterParrandero', id: 'santa_ursula' } },
    { ...URSULA_DOORS.school, kind: 'step', action: { type: 'enterSchool', id: 'santa_ursula' } },
    { ...URSULA_DOORS.diablito, kind: 'step', action: { type: 'enterDiablito' } },
    // Aroma italiano a lo largo de la carretera hacia El Diablito
    ...g.flatMap((row, y): Trigger[] => ['R', 's', 'K', 'g', 'Z'].includes(row[mirror(47)])
      ? [{ x: mirror(47), y, kind: 'step', action: { type: 'diablitoAroma' } }]
      : []),
    ...[16, 17, 18].map((x): Trigger => ({ x: mirror(x), y: 18, kind: 'step', action: { type: 'zone', name: 'SANTA ÚRSULA · EL PUEBLO' } })),
    sign(mirror(13), 2, 'SUBIDA DE LA QUINTA. Sigue cuesta arriba hasta Santa Úrsula. La incorporación a la TF-5 queda a tu espalda.'),
    sign(mirror(8), 15, 'CENTRO PARRANDERO DE SANTA ÚRSULA. Chaxiraxi, barraquito y PC. Aparca antes de entrar.'),
    sign(mirror(26), 15, 'CEIP SANTA ÚRSULA · PATIO NV.8. Duelos repetibles durante el recreo.'),
    sign(mirror(29), 22, 'CARRETERA GENERAL · SUROESTE. Sigue la carretera de las medianías. El Diablito está más adelante.'),
    sign(mirror(57), 40, 'EL DIABLITO. El viejo cartel dice CERRADO, pero alguien ha encendido el horno. GUACHINCHE Nº 8 DE LA RUTA DEL BUEN YANTAR.'),
  ];

  // 3. Más allá del Diablito, la general se pierde por el borde suroeste: ahí empieza la cutscene.
  for (let x = 0; x < W_MAP; x++) {
    if (g[H_MAP - 1][x] === 'R') triggers.push({ x, y: H_MAP - 1, kind: 'step', action: { type: 'orotavaCutscene', from: 'town' } });
  }

  return {
    id: 'santa_ursula', name: 'Santa Úrsula · Carretera General · El Diablito',
    rows: g.map((row) => row.join('')), legend: LEGEND,
    npcs: [
      { id: 'ursula_vecina', sprite: 'chaxiraxi', x: mirror(19), y: 16 },
      { id: 'ursula_paseante', sprite: 'parrandero', x: mirror(28), y: 23 },
    ],
    triggers,
    onEnter: [
      'Dejas la salida de La Quinta atrás y subes por la ladera hacia SANTA ÚRSULA.',
      'En el pueblo tienes colegio y Centro Parrandero. La carretera general continúa hacia el SUROESTE.',
    ],
  };
}

function diablito(): GameMap {
  const g = grid(23, 18, '#');
  rect(g, 1, 1, 21, 16, '.');
  for (const x of [3, 7, 15, 19]) g[1][x] = 'W';
  rect(g, 15, 3, 20, 5, 'C'); g[3][18] = 'Q'; g[3][19] = 'Q';
  for (const x of [4, 5, 17, 18]) for (const y of [8, 12]) g[y][x] = 'M';
  for (const [x, y] of [[3, 8], [6, 8], [16, 12], [19, 12]]) g[y][x] = 'h';
  g[14][3] = 'T'; g[14][19] = 'T'; g[17][11] = 'D';
  return {
    id: 'el_diablito', name: 'El Diablito · Último Guachinche',
    rows: g.map((row) => row.join('')),
    legend: { '#': 'wall', '.': 'tiles', W: 'window', C: 'counter', Q: 'fogon', M: 'table', h: 'bench', T: 'sign', D: 'door' },
    npcs: [
      // Tercera aparición del Coco: su propio NPC, sin tocar el del Meridiano ni el de Magos.
      { id: 'coco_diablito', sprite: 'coco_ursula', x: 11, y: 4, trainer: DIABLITO_TRAINER },
      { id: 'michi_diablito', sprite: 'gato_npc', x: 14, y: 4 },
    ],
    triggers: [
      warp(11, 17, 'santa_ursula', URSULA_DOORS.diablito.x, URSULA_DOORS.diablito.y + 1, 'down'),
      sign(3, 14, 'CERRADO POR HARTAZGO DE ENTRENADORES. Debajo, recién escrito: «REABIERTO POR NECESIDAD».'),
      sign(19, 14, 'EL DIABLITO · GUACHINCHE Nº 8. Cocina italiana, mazo de Malpaís y un boliche detrás del mostrador.'),
    ],
    onEnter: DIABLITO_SINGING,
  };
}

export const SANTA_URSULA_MAPS: Record<'santa_ursula' | 'el_diablito', GameMap> = {
  santa_ursula: santaUrsula(), el_diablito: diablito(),
};

export const URSULA_TALKS: Record<string, string[]> = {
  ursula_vecina: ['VECINA: ¿Subiste desde La Quinta? Pues ya estás en Santa Úrsula, mi niño. El Centro Parrandero está ahí al lado.',
    'VECINA: La carretera general sigue al suroeste. El Diablito lleva tiempo cerrado, aunque hoy me pareció oler a pizza...'],
  ursula_paseante: ['PASEANTE: Sigue al suroeste por la general y verás el cartel de El Diablito. No me mires así: yo tampoco sé quién volvió a encender el horno.'],
  michi_diablito: ['Don Michi abre un ojo, bosteza y vuelve a dormirse sobre el saco de harina. Lleva una huella blanca en la nariz.'],
};

export function drawSantaUrsulaDetails(ctx: CanvasRenderingContext2D, id: GameMap['id'], camX: number, camY: number, frame: number) {
  const fill = (x: number, y: number, w: number, h: number, shade: number) => {
    ctx.fillStyle = PAL[shade]; ctx.fillRect(x, y, w, h);
  };
  const label = (text: string, tx: number, ty: number) => {
    const x = tx * TILE - camX, y = ty * TILE - camY;
    if (x < -90 || x > 170 || y < -12 || y > 148) return;
    ctx.save(); ctx.font = '5px "Press Start 2P", monospace'; ctx.textBaseline = 'top';
    fill(x - 2, y, Math.ceil(ctx.measureText(text).width) + 4, 9, 3);
    ctx.fillStyle = PAL[0]; ctx.fillText(text, x, y + 2); ctx.restore();
  };
  if (id === 'santa_ursula') {
    // Etiquetas en el pueblo reflejado
    label('PARRANDERO', 52, 10); label('COLEGIO', 34, 10);
    label('EL DIABLITO', 2, 37); label('CERRADO', 9, 37);
    // El humo de la cocina sale del Diablito (ahora en el lado izquierdo)
    const x = 5 * TILE - camX, y = 34 * TILE - camY;
    if (x > -24 && x < 184 && y > -24 && y < 168) for (let i = 0; i < 3; i++) {
      const t = (frame + i * 19) % 72;
      fill(x + Math.round(Math.sin(t / 11) * 4), y - Math.floor(t / 3), 5 + i, 2, i % 2 ? 0 : 2);
    }
  } else if (id === 'el_diablito') {
    const x = 11 * TILE - camX, y = 4 * TILE - camY;
    for (let i = 0; i < 2; i++) {
      const t = (frame + i * 35) % 100;
      const nx = x + 20 + i * 7, ny = y - Math.floor(t / 5);
      fill(nx, ny, 2, 6, 3); fill(nx - 2, ny + 5, 3, 2, 3); fill(nx + 1, ny, 3, 2, 3);
    }
  }
}
