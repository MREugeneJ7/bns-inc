import type { Dir } from './input';
import type { GameMap, MapId, NPC, Trigger } from './maps';
import type { TileId } from './sprites';

export const STORE_FLOORS = [
  ['eci_pb', 'PB · ENTRADA'], ['eci_1', '1 · MODA'], ['eci_2', '2 · CALZADO'],
  ['eci_3', '3 · DEPORTES'], ['eci_4', '4 · HOGAR'], ['eci_5', '5 · LIBRERÍA'],
  ['eci_6', '6 · ELECTRÓNICA'], ['eci_azotea', '7 · AZOTEA GOURMET'],
] as const;
export type StoreFloor = typeof STORE_FLOORS[number][0];
export const MAGOS_FLOORS = [
  ['magos_1', 'PLANTA 1 · RECEPCIÓN'], ['magos_2', 'PLANTA 2 · ARCHIVO'],
  ['magos_3', 'PLANTA 3 · COPIAS'], ['magos_4', 'PLANTA 4 · DIRECCIÓN'],
  ['magos_azotea', 'AZOTEA · DESPACHO DEL COCO'],
] as const;
export type MagosFloor = typeof MAGOS_FLOORS[number][0];
export type RosarioMap = 'barranco_hondo' | 'acceso_taco' | 'el_rosario' | 'magos_pb' | 'guachinche_rosario' | StoreFloor | MagosFloor;
export const GUACHINCHE_DOOR = { x: 15, y: 16 } as const;
export const MAGOS_ENTRY = { x: 18, y: 8 } as const;
export const MAGOS_TOWER = { left: 12, right: 25, top: 1, bottom: 7 } as const;
export const LIFT = { x: 10, y: 2 } as const;
export const GOURMET_COUNTER = { x: 5, y: 5 } as const;
export const ROSARIO_ROADS = {
  barranco_hondo: { gateX: 24, entryY: 14, fromTaco: false },
  acceso_taco: { gateX: 10, entryY: 10, fromTaco: true },
} as const;

const legend: Record<string, TileId> = {
  '#': 'wall', '.': 'tiles', r: 'road', s: 'sidewalk', g: 'grass', E: 'tree',
  F: 'fence', V: 'ravine', B: 'building', W: 'window', D: 'door', p: 'path',
  P: 'palm', h: 'bench', T: 'sign', M: 'table', C: 'counter', L: 'lift',
  Z: 'plaza', S: 'stairs', o: 'monument', f: 'floor', l: 'rail', a: 'plant', d: 'deck',
  H: 'parranda', J: 'colegio', n: 'blacksand', w: 'wall',
};
const magosLegend: Record<string, TileId> = {
  '#': 'wall', w: 'window', '.': 'floor', L: 'lift', a: 'plant', h: 'bench', T: 'sign',
  M: 'table', C: 'counter', m: 'machine', X: 'box', 1: 'roomplatform', 2: 'teleport',
  A: 'keycard', S: 'stairs', D: 'door', d: 'deck', l: 'rail', B: 'building',
};
export const MAGOS_KEY_1 = { x: 3, y: 3 } as const;
export const MAGOS_KEY_2 = { x: 16, y: 9 } as const;
export const MAGOS_DOOR = { x: 10, y: 2 } as const;
function magosFloor(id: MagosFloor | 'magos_pb'): GameMap {
  const w = 20, h = 12;
  const g = grid(w, h, '#');
  fill(g, 1, 1, w - 2, h - 2, '.');
  // Plataformas de seguridad: el ascensor de servicio solo existe en la entrada y en la azotea.
  fill(g, 1, 1, w - 2, 1, 'B');
  if (id === 'magos_pb') {
    g[3][1] = 'T'; g[3][17] = 'T'; g[9][3] = 'h'; g[8][15] = 'X'; g[5][6] = 'M';
    g[10][10] = 'S'; g[9][10] = '.'; g[2][13] = '2';
    return { id, name: 'Magos de la Costa · Recepción', rows: rows(g), legend: magosLegend, npcs: [],
      triggers: [warp(10, 10, 'el_rosario', MAGOS_ENTRY.x, MAGOS_ENTRY.y + 1, 'down'),
        { x: 13, y: 2, kind: 'step', action: { type: 'warp', to: 'magos_1', x: 17, y: 3, dir: 'up' } },
        sign(5, 6, 'MAGOS DE LA COSTA. Dirección: azotea. El ascensor de servicio está averiado.'), sign(9, 10, 'TELETRANSPORTADOR A LA PLANTA 1. Pisa la plataforma.')],
      ...(() => { const m: Pick<GameMap, 'onEnter'> = { onEnter: ['MAGOS DE LA COSTA · RECEPCIÓN. Busca el teletransportador al fondo de la sala.'] }; return m; })(),
    };
  }
  // Layout de laberinto Silph Co: paredes internas (#), pasillos y teletransportadores bidireccionales.
  if (id === 'magos_1') {
    fill(g, 9, 1, 9, 9, '#');
    g[10][10] = 'S';
    g[3][3] = '2'; g[8][16] = '2';
    g[5][4] = 'X'; g[7][13] = 'M'; g[8][5] = 'h';
    return { id, name: 'Magos de la Costa · 1 · Recepción', rows: rows(g), legend: magosLegend,
      npcs: [{ id: 'enriscada_magos_1', sprite: 'enriscada', x: 6, y: 6, trainer: 'enriscada_magos_1' }],
      onEnter: ['PLANTA 1. Tabiques de obra y teletransportadores cruzados estilo Silph Co. Abajo a la derecha está la escalera a PB.'],
      triggers: [
        warp(10, 10, 'magos_pb', 10, 9, 'down'),
        warp(3, 3, 'magos_2', 16, 4, 'down'),
        warp(16, 8, 'magos_3', 14, 7, 'up'),
        sign(3, 2, 'TELEPAD 1A ↔ PLANTA 2.'),
        sign(16, 9, 'TELEPAD 1B ↔ PLANTA 3.'),
      ],
    };
  }
  if (id === 'magos_2') {
    fill(g, 9, 1, 9, 10, '#');
    g[3][16] = '2'; g[8][4] = '2'; g[8][16] = '2'; g[4][3] = '2';
    g[MAGOS_KEY_1.y][MAGOS_KEY_1.x] = 'A';
    g[6][13] = 'M'; g[8][12] = 'X'; g[6][5] = 'h';
    return { id, name: 'Magos de la Costa · 2 · Archivo', rows: rows(g), legend: magosLegend,
      npcs: [{ id: 'enriscada_magos_2', sprite: 'enriscada', x: 13, y: 5, trainer: 'enriscada_magos_2' }],
      onEnter: ['PLANTA 2 · ARCHIVO. Las estanterías dividen la planta. Una secretaria del Team Enriscada custodia los contratos.'],
      triggers: [
        warp(16, 3, 'magos_1', 3, 4, 'down'),
        warp(4, 8, 'magos_3', 4, 5, 'down'),
        warp(16, 8, 'magos_2', 3, 5, 'down'),
        warp(3, 4, 'magos_2', 16, 7, 'up'),
        { ...MAGOS_KEY_1, kind: 'interact', action: { type: 'pickupMagosKey', key: 1 } },
        sign(16, 2, 'TELEPAD 2A ↔ PLANTA 1.'),
        sign(4, 9, 'TELEPAD 2C ↔ PLANTA 3.'),
        sign(16, 9, 'TELEPAD 2D → ZONA ARCHIVO OCULTO.'),
      ],
    };
  }
  if (id === 'magos_3') {
    fill(g, 1, 6, 12, 6, '#');
    g[8][14] = '2'; g[4][4] = '2'; g[3][15] = '2';
    g[3][8] = 'M'; g[8][6] = 'X'; g[9][10] = 'X';
    return { id, name: 'Magos de la Costa · 3 · Copias', rows: rows(g), legend: magosLegend,
      npcs: [{ id: 'enriscada_magos_3', sprite: 'enriscada', x: 8, y: 3, trainer: 'enriscada_magos_3' }],
      onEnter: ['PLANTA 3 · COPIAS. Máquinas de reprografía vacías y olor a plástico quemado. El impresor Nauzet te corta el paso.'],
      triggers: [
        warp(14, 8, 'magos_1', 16, 7, 'up'),
        warp(4, 4, 'magos_2', 4, 7, 'up'),
        warp(15, 3, 'magos_4', 16, 5, 'down'),
        sign(14, 9, 'TELEPAD 3B ↔ PLANTA 1.'),
        sign(4, 3, 'TELEPAD 3C ↔ PLANTA 2.'),
        sign(15, 2, 'TELEPAD 3E ↔ PLANTA 4.'),
      ],
    };
  }
  if (id === 'magos_4') {
    fill(g, 10, 1, 10, 10, '#');
    g[4][16] = '2'; g[8][16] = '2'; g[4][4] = '2'; g[8][4] = '2';
    g[MAGOS_KEY_2.y][MAGOS_KEY_2.x] = 'A';
    g[2][7] = 'X'; g[6][14] = 'M';
    return { id, name: 'Magos de la Costa · 4 · Dirección', rows: rows(g), legend: magosLegend,
      npcs: [{ id: 'enriscada_magos_4', sprite: 'enriscada', x: 14, y: 6, trainer: 'enriscada_magos_4' }],
      onEnter: ['PLANTA 4 · DIRECCIÓN. Un escolta del Team Enriscada vigila la zona. El despacho del fondo da acceso a la azotea.'],
      triggers: [
        warp(16, 4, 'magos_3', 15, 4, 'up'),
        warp(16, 8, 'magos_4', 4, 5, 'down'),
        warp(4, 4, 'magos_4', 16, 7, 'up'),
        warp(4, 8, 'magos_azotea', 10, 5, 'up'),
        { ...MAGOS_KEY_2, kind: 'interact', action: { type: 'pickupMagosKey', key: 2 } },
        sign(16, 3, 'TELEPAD 4E ↔ PLANTA 3.'),
        sign(16, 7, 'TELEPAD 4F → DESPACHO OESTE.'),
        sign(4, 3, 'TELEPAD 4F RETORNO.'),
        sign(4, 9, 'TELEPAD AZOTEA → TECHO.'),
      ],
    };
  }
  // Azotea: puerta con dos cerraduras magnéticas y el despacho de Ricardo.
  fill(g, 4, 1, 15, 4, 'B'); fill(g, 5, 2, 14, 3, '.'); fill(g, 10, 2, 10, 4, '.');
  g[MAGOS_DOOR.y][MAGOS_DOOR.x] = 'D'; g[2][7] = 'm'; g[2][13] = 'm'; g[2][7] = 'X';
  fill(g, 1, 6, 18, 9, 'd'); g[8][5] = 'M'; g[6][15] = 'h'; g[5][2] = '2'; g[9][2] = 'S';
  return { id, name: 'Magos de la Costa · Azotea', rows: rows(g), legend: magosLegend,
    npcs: [{ id: 'ricardo_garcia', sprite: 'repartidor', x: 5, y: 3 }, { id: 'coco_ursula', sprite: 'coco_ursula', x: 13, y: 3, trainer: 'coco_santa_ursula' }],
    onEnter: ['AZOTEA DE MAGOS DE LA COSTA. La puerta del despacho tiene DOS cerraduras magnéticas.'],
    triggers: [
      { x: 2, y: 5, kind: 'step', action: { type: 'warp', to: 'magos_4', x: 3, y: 3, dir: 'down' } },
      { x: 2, y: 9, kind: 'step', action: { type: 'warp', to: 'magos_pb', x: 10, y: 9, dir: 'down' } },
      { ...MAGOS_DOOR, kind: 'step', action: { type: 'magosDoor' } },
      sign(6, 5, 'PUERTA DEL DESPACHO: dos cerraduras magnéticas.'),
    ],
  };
}

type Grid = string[][];
const grid = (w: number, h: number, ch: string): Grid => Array.from({ length: h }, () => Array<string>(w).fill(ch));
function fill(g: Grid, x0: number, y0: number, x1: number, y1: number, ch: string) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch;
}
const rows = (g: Grid) => g.map((r) => r.join(''));
const warp = (x: number, y: number, to: MapId, tx: number, ty: number, dir: Dir): Trigger =>
  ({ x, y, kind: 'step', action: { type: 'warp', to, x: tx, y: ty, dir } });
const sign = (x: number, y: number, text: string): Trigger => ({ x, y, kind: 'interact', action: { type: 'text', lines: [text] } });

export function worksTile(map: MapId, x: number, y: number, open: boolean): TileId | undefined {
  if ((map !== 'barranco_hondo' && map !== 'acceso_taco') || x !== ROSARIO_ROADS[map].gateX || y < 7 || y > 9) return;
  return open ? 'road' : 'fence';
}

function roadMap(id: keyof typeof ROSARIO_ROADS): GameMap {
  const { gateX, fromTaco, entryY } = ROSARIO_ROADS[id];
  const w = fromTaco ? 24 : 32, h = 18;
  const g = grid(w, h, fromTaco ? 'E' : 'V');
  const start = fromTaco ? 0 : 3;
  fill(g, start, 5, w - 1, 11, 'g');
  fill(g, start, 6, w - 1, 6, 's');
  fill(g, start, 7, w - 1, 9, 'r');
  fill(g, start, 10, w - 1, 10, 's');
  if (!fromTaco) {
    fill(g, 3, 8, 5, h - 1, 'r');
    fill(g, 6, 11, 6, h - 1, 's');
    g[14][6] = 'T';
  }
  // La valla cruza toda la calzada y ambas aceras. El desmonte no tiene paso lateral.
  fill(g, gateX, 5, gateX, 11, 'F');
  g[6][fromTaco ? gateX + 1 : gateX - 1] = 'T'; g[10][fromTaco ? gateX + 4 : gateX - 4] = 'h';
  for (let x = start + 3; x < w - 2; x += 5) { g[5][x] = 'E'; g[11][x + 1] = 'E'; }
  const crewX = fromTaco ? gateX + 1 : gateX - 1;
  const workers: NPC[] = [0, 1, 2].map((n) => ({
    id: `cuadrilla_${id}_${n}`, sprite: 'obrero', x: crewX, y: 7 + n,
    afterFlag: { key: 'rosario_open', x: crewX + (fromTaco ? 1 : -1) * (n + 1), y: 10 },
  }));
  // Desde Taco se viene por el OESTE: la carretera entra por la derecha y el pueblo queda al fondo, a la izquierda.
  const townSide = fromTaco ? 0 : w - 1;
  const homeSide = fromTaco ? w - 1 : 0;
  const returns = fromTaco
    ? [7, 8, 9].map(y => warp(homeSide, y, 'calle', 1, 9, 'right'))
    : [3, 4, 5, 6].map(x => warp(x, h - 1, 'tf1', 133, 1, 'down'));
  const townEntry: Trigger[] = [7, 8, 9].map(y => warp(townSide, y, 'el_rosario', fromTaco ? 34 : 1, entryY, fromTaco ? 'left' : 'right'));
  return {
    id, name: fromTaco ? 'Carretera de Taco a El Rosario' : 'Carretera de Barranco Hondo',
    rows: rows(g), legend, npcs: workers,
    triggers: [
      ...returns, ...townEntry,
      sign(fromTaco ? gateX + 1 : gateX - 1, 6, fromTaco ? '← EL ROSARIO. Obras en la calzada. Consulta a la cuadrilla.' : 'EL ROSARIO →. Obras en la calzada. Consulta a la cuadrilla.'),
      ...(!fromTaco ? [sign(6, 14, 'CANDELARIA ↓. EL ROSARIO → por la carretera de Barranco Hondo.')] : []),
    ],
  };
}

export const TERRERO = { x: 20, y: 11, w: 8, h: 6 } as const;
function town(): GameMap {
  const g = grid(36, 22, 'E');
  fill(g, 1, 1, 34, 20, 'g');
  // Dos entradas: la del oeste (Barranco Hondo) y la del este (Taco) acaban en la misma calle.
  fill(g, 0, 9, 35, 10, 'r'); fill(g, 0, 11, 35, 11, 's');
  fill(g, 1, 8, 34, 8, 's');
  // Centro Parrandero La Esperanza y CEIP El Rosario dan a la calle.
  fill(g, 2, 3, 9, 7, 'B'); g[6][5] = 'H'; g[7][5] = 'D'; g[5][3] = 'W'; g[5][8] = 'W'; g[8][4] = 'T';
  fill(g, 28, 3, 34, 7, 'B'); g[6][32] = 'J'; g[7][32] = 'D'; g[5][29] = 'W'; g[5][33] = 'W'; g[8][31] = 'T';
  // El edificio tocho ocupa la manzana central, pegado a la plaza.
  fill(g, 12, 1, 25, 7, 'B'); fill(g, 12, 1, 25, 1, 'w');
  for (const y of [3, 5]) for (let x = 13; x < 25; x += 3) g[y][x] = 'W';
  g[7][MAGOS_ENTRY.x] = 'D'; g[8][18] = 's'; g[8][19] = 'T'; g[2][17] = 'T';
  // Plaza con el guachinche al oeste y el terrero de lucha al este.
  fill(g, 3, 12, 32, 19, 'Z');
  fill(g, 12, 13, 18, 16, 'B');
  g[14][13] = 'W'; g[14][17] = 'W';
  g[GUACHINCHE_DOOR.y][GUACHINCHE_DOOR.x] = 'D';
  fill(g, TERRERO.x, TERRERO.y + 1, TERRERO.x + TERRERO.w - 1, TERRERO.y + TERRERO.h - 1, 'n');
  fill(g, TERRERO.x - 1, TERRERO.y, TERRERO.x + TERRERO.w, TERRERO.y, 'F');
  fill(g, TERRERO.x - 1, TERRERO.y + TERRERO.h, TERRERO.x + TERRERO.w, TERRERO.y + TERRERO.h, 'F');
  fill(g, TERRERO.x - 1, TERRERO.y, TERRERO.x - 1, TERRERO.y + TERRERO.h, 'F');
  fill(g, TERRERO.x + TERRERO.w, TERRERO.y, TERRERO.x + TERRERO.w, TERRERO.y + TERRERO.h, 'F');
  g[TERRERO.y][TERRERO.x + 3] = 's'; g[TERRERO.y][TERRERO.x + 4] = 's'; g[TERRERO.y + 2][TERRERO.x + 1] = 'h';
  g[TERRERO.y][TERRERO.x + 6] = 'T';
  g[14][7] = 'o'; g[16][5] = 'h'; g[16][10] = 'h'; g[13][11] = 'P'; g[18][14] = 'P'; g[18][30] = 'P';
  return { id: 'el_rosario', name: 'El Rosario', rows: rows(g), legend,
    npcs: [
      { id: 'luchador_rosario', sprite: 'luchador', x: TERRERO.x + 4, y: TERRERO.y + 3, trainer: 'terrero_rosario' },
      { id: 'vecina_rosario', sprite: 'neighbor', x: 14, y: 12 },
    ],
    onEnter: ['EL ROSARIO. La calle cruza el pueblo de lado a lado: Centro Parrandero y colegio a la calle, y un terrero de lucha en la plaza.'],
    triggers: [
      ...[9, 10].map((y) => warp(0, y, 'barranco_hondo', 30, 8, 'left')),
      ...[9, 10].map((y) => warp(35, y, 'acceso_taco', 1, 8, 'right')),
      { x: 5, y: 7, kind: 'step', action: { type: 'enterParrandero', id: 'rosario' } },
      { x: 32, y: 7, kind: 'step', action: { type: 'enterSchool', id: 'rosario' } },
      sign(4, 8, 'CENTRO PARRANDERO LA ESPERANZA. Barraquito, cartas planchadas y PC de Ayoze.'),
      sign(31, 8, 'CEIP EL ROSARIO (Patio Nv.6). La verja del recreo está entreabierta.'),
      sign(19, 8, 'MAGOS DE LA COSTA. Sede del Coco de Santa Úrsula. Entrada abierta.'),
      { x: MAGOS_ENTRY.x, y: 7, kind: 'step', action: { type: 'warp', to: 'magos_pb', x: 10, y: 9, dir: 'up' } },
      { x: GUACHINCHE_DOOR.x, y: GUACHINCHE_DOOR.y, kind: 'step', action: { type: 'warp', to: 'guachinche_rosario', x: gx(1, 9), y: gy(2, 10), dir: 'up' } },
      sign(17, 17, 'GUACHINCHE DE EL ROSARIO. Nueve salas en una planta y teletransportes que saltan de una a otra. La mesa buena está al fondo.'),
      sign(TERRERO.x + 6, TERRERO.y, 'TERRERO DE LUCHA DE EL ROSARIO. Cartel pintado a mano: "GUACHINCHE · GIMNASIO". No figura en la Ruta del Buen Yantar.'),
      sign(1, 8, '← BARRANCO HONDO / CANDELARIA'), sign(34, 8, 'TACO →'),
    ],
  };
}

// GUACHINCHE DE EL ROSARIO: 9 salas en la misma planta.
// No es una escalera: cada placa salta a una sala concreta, a veces a otra fila o columna.
const GW = 18, GH = 13;
const gx = (c: number, x: number) => c * GW + x;
const gy = (r: number, y: number) => r * GH + y;
const GUACH_PADS: { from: [number, number]; at: [number, number]; to: [number, number] }[] = [
  { from: [1, 2], at: [5, 5], to: [2, 0] }, // ruta correcta desde la entrada
  { from: [1, 2], at: [13, 5], to: [0, 0] },
  { from: [2, 0], at: [5, 5], to: [0, 1] },
  { from: [2, 0], at: [13, 5], to: [1, 2] },
  { from: [0, 1], at: [5, 5], to: [2, 1] },
  { from: [0, 1], at: [13, 5], to: [1, 1] },
  { from: [2, 1], at: [5, 5], to: [1, 0] }, // salta a la sala central superior
  { from: [2, 1], at: [13, 5], to: [0, 2] },
  { from: [1, 1], at: [5, 5], to: [0, 0] },
  { from: [1, 1], at: [13, 5], to: [2, 2] },
  { from: [0, 0], at: [5, 5], to: [1, 2] },
  { from: [0, 2], at: [5, 5], to: [0, 1] },
  { from: [0, 2], at: [13, 5], to: [1, 2] },
  { from: [2, 2], at: [5, 5], to: [1, 1] },
  { from: [2, 2], at: [13, 5], to: [0, 1] },
  { from: [1, 0], at: [13, 9], to: [1, 2] }, // salida de la sala del lider a la entrada
];
function guachinche(): GameMap {
  const w = GW * 3, h = GH * 3;
  const g = grid(w, h, '.');
  fill(g, 0, 0, w - 1, 0, '#'); fill(g, 0, h - 1, w - 1, h - 1, '#');
  fill(g, 0, 0, 0, h - 1, '#'); fill(g, w - 1, 0, w - 1, h - 1, '#');
  fill(g, 0, GH - 1, w - 1, GH - 1, '#'); fill(g, 0, GH * 2 - 1, w - 1, GH * 2 - 1, '#');
  fill(g, GW - 1, 0, GW - 1, h - 1, '#'); fill(g, GW * 2 - 1, 0, GW * 2 - 1, h - 1, '#');
  // Muebles por sala, libres de placas y de aterrizajes.
  for (const [c, r] of [[0, 1], [2, 1]] as [number, number][]) { g[gy(r, 9)][gx(c, 4)] = 'M'; g[gy(r, 9)][gx(c, 14)] = 'h'; }
  for (const [c, r] of [[0, 0], [2, 0], [0, 2], [2, 2], [1, 1], [1, 2]] as [number, number][]) { g[gy(r, 9)][gx(c, 4)] = 'M'; }
  g[gy(0, 5)][gx(1, 14)] = 'M'; // mesa del líder en la sala central superior
  // Placas teletransportadoras.
  for (const pad of GUACH_PADS) {
    const x = gx(pad.from[0], pad.at[0]), y = gy(pad.from[1], pad.at[1]);
    g[y][x] = '2';
  }
  // Puerta de vuelta al pueblo desde la sala de entrada.
  g[gy(2, 11)][gx(1, 9)] = 'D';
  const triggers: Trigger[] = GUACH_PADS.map((pad) => warp(
    gx(pad.from[0], pad.at[0]), gy(pad.from[1], pad.at[1]),
    'guachinche_rosario', gx(pad.to[0], 9), gy(pad.to[1], 7), 'up',
  ));
  triggers.push({ x: gx(1, 9), y: gy(2, 11), kind: 'step', action: { type: 'warp', to: 'el_rosario', x: GUACHINCHE_DOOR.x, y: GUACHINCHE_DOOR.y + 1, dir: 'down' } });
  triggers.push(sign(gx(1, 12), gy(2, 10), 'PLACAS TELETRANSPORTE: cada una salta a otra sala de este mismo piso. Aquí empiezas.'));
  triggers.push(sign(gx(1, 14), gy(0, 10), 'PLACA DE SALIDA: písala para volver a la sala de entrada sin perderte por las nueve mesas.'));
  triggers.push({ x: gx(1, 9), y: gy(0, 7), kind: 'step', action: { type: 'zone', name: 'LA MESA DEL FONDO' } });
  return {
    id: 'guachinche_rosario', name: 'Guachinche de El Rosario · Nueve salas', rows: rows(g), legend: magosLegend,
    npcs: [{ id: 'guachinche_lider', sprite: 'lider1', x: gx(1, 9), y: gy(0, 6), trainer: 'guachinche_rosario' }],
    onEnter: ['NUEVE SALAS EN LA MISMA PLANTA. Cada placa salta a otra sala; ninguna sube de planta. La mesa del líder está en la sala central superior.'],
    triggers,
  };
}

function storeFloor(id: StoreFloor, label: string, index: number): GameMap {
  const roof = id === 'eci_azotea';
  const g = grid(20, 14, roof ? 'l' : '#');
  fill(g, 1, 1, 18, 12, roof ? 'd' : '.');
  fill(g, 1, 1, 18, 2, roof ? 'l' : '#');
  g[LIFT.y][LIFT.x] = 'L';
  const triggers: Trigger[] = [{ ...LIFT, kind: 'interact', action: { type: 'storeLift' } }];
  if (roof) {
    fill(g, 2, 4, 7, 4, 'B'); fill(g, 2, 5, 7, 5, 'C');
    g[4][3] = 'W'; g[4][6] = 'W';
    g[10][4] = 'a'; g[10][16] = 'a'; g[7][14] = 'M'; g[9][14] = 'h';
    for (let x = 2; x <= 7; x++) triggers.push({ x, y: GOURMET_COUNTER.y, kind: 'interact', action: { type: 'gourmetShop' } });
  } else {
    for (const x of [3, 14]) for (const y of [5, 9]) fill(g, x, y, x + 2, y, index % 2 ? 'C' : 'M');
    g[3][2] = 'a'; g[3][17] = 'a';
    if (id === 'eci_pb') {
      g[13][10] = 'D'; g[12][10] = 'f';
      triggers.push(warp(10, 13, 'santacruz_sur', 44, 7, 'down'));
    }
  }
  return { id, name: `El Corte Inglés · ${label}`, rows: rows(g), legend, npcs: [], triggers,
    ...(id === 'eci_pb' ? { onEnter: ['EL CORTE INGLÉS. Al fondo está el ascensor. La Zona Gourmet está en la azotea.'] } : {}),
  };
}

const floors = Object.fromEntries(STORE_FLOORS.map(([id, label], i) => [id, storeFloor(id, label, i)])) as Record<StoreFloor, GameMap>;
const magos = Object.fromEntries([...MAGOS_FLOORS.map(([id]) => id), 'magos_pb' as const].map(id => [id, magosFloor(id)])) as Record<MagosFloor | 'magos_pb', GameMap>;
export const ROSARIO_MAPS: Record<RosarioMap, GameMap> = {
  barranco_hondo: roadMap('barranco_hondo'), acceso_taco: roadMap('acceso_taco'), el_rosario: town(), guachinche_rosario: guachinche(), ...floors, ...magos,
};