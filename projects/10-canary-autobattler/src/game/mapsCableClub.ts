import type { GameMap, Trigger } from './maps';
import { PAL, TILE, type TileId } from './sprites';

// CLUB DEL CABLE: la segunda planta de los Centros Parranderos. Es UNA sola sala compartida
// por todos los centros (igual que la planta baja): subas desde donde subas, llegas aquí, y al
// bajar vuelves al centro por el que entraste.
//
// Solo se abre a quien es campeón del Alto Mando. Tiene dos salas:
//   - SALA DE INTERCAMBIO (izquierda): cambiar magomones con otra persona.
//   - SALA DE COMBATE (derecha): mazo contra mazo.
// Las dos funcionan únicamente con un cable físico entre las dos máquinas.

/** Escalera del Centro Parrandero (planta baja), en la pared del fondo tras el mostrador. */
export const CABLE_STAIRS_1F = { x: 5, y: 0 } as const;
/** Donde apareces al subir a la 2ª planta. */
export const CABLE_ARRIVAL = { x: 7, y: 8 } as const;

const ROWS = [
  '###############', // 0
  '#M..W.M#M.W..M#', // 1  consolas de enlace y ventanas
  '#......#......#', // 2
  '#.hTTh.#.hTTh.#', // 3  mesa del cable con una silla a cada lado
  '#......#......#', // 4
  '#P.....#.....P#', // 5
  '###D#######D###', // 6  puertas de las dos salas
  '#....X...X....#', // 7  vestíbulo: carteles de cada sala
  '#.............#', // 8
  '#P.....S.....P#', // 9  escalera de bajada
  '###############', // 10
];

const LEGEND: Record<string, TileId> = {
  '#': 'wall', '.': 'floor', W: 'window', P: 'plant', M: 'machine', T: 'table', h: 'bench', D: 'door', S: 'stairs', X: 'sign',
};

const link = (x: number, y: number, room: 'trade' | 'battle'): Trigger => ({ x, y, kind: 'interact', action: { type: 'cableClub', room } });
const sign = (x: number, y: number, ...lines: string[]): Trigger => ({ x, y, kind: 'interact', action: { type: 'text', lines } });

export const CABLE_CLUB_MAP: GameMap = {
  id: 'parrandero_2',
  name: 'Club del Cable · 2ª planta',
  rows: ROWS,
  legend: LEGEND,
  npcs: [{ id: 'tecnico_cable', sprite: 'estudiante', x: 7, y: 7 }],
  triggers: [
    { x: 7, y: 9, kind: 'step', action: { type: 'warp', to: 'parrandero', x: CABLE_STAIRS_1F.x, y: CABLE_STAIRS_1F.y + 1, dir: 'down' } },
    { x: 3, y: 6, kind: 'step', action: { type: 'zone', name: 'SALA DE INTERCAMBIO' } },
    { x: 11, y: 6, kind: 'step', action: { type: 'zone', name: 'SALA DE COMBATE' } },
    // Sala de intercambio: la mesa del cable y las dos consolas.
    link(3, 3, 'trade'), link(4, 3, 'trade'), link(1, 1, 'trade'), link(6, 1, 'trade'),
    // Sala de combate.
    link(10, 3, 'battle'), link(11, 3, 'battle'), link(8, 1, 'battle'), link(13, 1, 'battle'),
    sign(5, 7, '← SALA DE INTERCAMBIO. Cada uno ofrece un magomón, los dos confirman y las cartas cambian de mano.',
      'El certificado de 1ª edición viaja con la carta. El brillo no: es entrenamiento de cada colección.'),
    sign(9, 7, 'SALA DE COMBATE →. Mazo contra mazo, de consola a consola.',
      'Sin duros, sin sobres y sin fotocopias: solo el marcador del Club.'),
  ],
};

/** La cadena de la escalera para quien todavía no es campeón. */
export const CABLE_LOCKED = [
  'Una cadena cruza la escalera con un cartel: «2ª PLANTA · CLUB DEL CABLE · SOLO CAMPEONES».',
  'CHAXIRAXI: Ahí arriba se intercambian magomones y se combate de tú a tú, mi niño. Pero solo sube quien ha tumbado a los cinco menceyes del Alto Mando.',
];

export const CABLE_INTRO = [
  'CLUB DEL CABLE. Huele a plástico caliente y a regleta vieja.',
  'A la izquierda, la SALA DE INTERCAMBIO. A la derecha, la SALA DE COMBATE. En las dos hace falta lo mismo: otra persona y un cable de verdad entre las dos máquinas.',
];

export const CABLE_TALKS: Record<string, string[]> = {
  tecnico_cable: [
    'TECNICO: Aquí no hay wifi, ni nube, ni servidor. Hay un cable. Si no hay cable, no hay club.',
    'TECNICO: Te vale un cable USB null-módem, o dos adaptadores USB-serie de tres euros con TX y RX cruzados y las masas unidas. En el móvil, con un adaptador OTG.',
    'TECNICO: Siéntate a una mesa, enchufa tu extremo y que la otra persona haga lo mismo en su máquina, en la misma sala. Lo demás lo negocian las consolas.',
    'TECNICO: Y no arranques el cable en mitad de un intercambio. Ya sabes lo que pasaba con los cartuchos.',
  ],
};

export function drawCableClubDetails(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
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
  // El cable tendido sobre cada mesa, con sus dos clavijas.
  const cable = (tx: number, ty: number) => {
    const x = tx * TILE - camX, y = ty * TILE - camY + 7;
    if (x < -40 || x > 170 || y < -8 || y > 150) return;
    ctx.fillStyle = PAL[3];
    ctx.fillRect(x + 3, y, 26, 2);
    ctx.fillRect(x, y - 1, 4, 4);
    ctx.fillRect(x + 28, y - 1, 4, 4);
    ctx.fillStyle = PAL[0];
    ctx.fillRect(x + 1, y, 2, 2);
    ctx.fillRect(x + 29, y, 2, 2);
  };
  cable(3, 3);
  cable(10, 3);
  label('INTERCAMBIO', 4, 6);
  label('COMBATE', 8.4, 6);
}

/** La 2ª planta solo se abre al campeón del Alto Mando (también en partidas de antes de que existiera la bandera). */
export function isChampion(s: { flags: Record<string, boolean>; beaten: Record<string, number> }): boolean {
  return !!s.flags.campeon_teide || (s.beaten.alto_mando_bencomo ?? 0) > 0;
}
