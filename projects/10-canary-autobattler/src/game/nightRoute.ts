// Las dos salidas de la estación son independientes: al norte se cruza la TF-1;
// al oeste, la ruta peatonal baja desde el hotel hasta el paseo de Troya.
import type { GameMap, MapId, Trigger } from './maps';
import type { Dir } from './input';
import { COAST } from './coastGeometry';
import { appendGomeraChannel, GOMERA_COAST_TRIGGERS, GOMERA_TRAINERS } from './mapsGomera';
import type { TileId } from './sprites';

type Grid = string[][];
const grid = (w: number, h: number, ch: string): Grid => Array.from({ length: h }, () => Array(w).fill(ch));
const rect = (g: Grid, x: number, y: number, endX: number, endY: number, ch: string) => {
  for (let j = y; j <= endY; j++) for (let i = x; i <= endX; i++) g[j][i] = ch;
};
const rows = (g: Grid) => g.map(r => r.join(''));
const warp = (x: number, y: number, to: MapId, tx: number, ty: number, dir: Dir): Trigger =>
  ({ x, y, kind: 'step', action: { type: 'warp', to, x: tx, y: ty, dir } });
const sign = (x: number, y: number, ...lines: string[]): Trigger => ({ x, y, kind: 'interact', action: { type: 'text', lines } });
const zone = (x: number, y: number, name: string): Trigger => ({ x, y, kind: 'step', action: { type: 'zone', name } });
const landmark = (x: number, y: number, n: string, name: string): Trigger => ({ x, y, kind: 'step', action: { type: 'coastStop', key: n, name } });
const L: Record<string, TileId> = {
  '#': 'wall', B: 'building', W: 'window', D: 'door', Z: 'plaza', '.': 'sidewalk', p: 'path',
  g: 'grass', E: 'tree', P: 'palm', h: 'bench', F: 'fence', L: 'rail', T: 'sign',
  R: 'road', K: 'parking', n: 'blacksand', '~': 'sea', u: 'surf', t: 'tiles',
  b: 'bridge', a: 'tf5', s: 'stairs', o: 'monument', M: 'table', C: 'counter',
  m: 'mat', H: 'parranda', A: 'machine', X: 'box', r: 'roque', '^': 'redrock', d: 'deck',
};

// Draw the station directly in its final orientation. No world-wide reversal.
const st = grid(28, 18, '.');
rect(st, 0, 0, 27, 3, 'B'); rect(st, 1, 7, 26, 13, 'Z');
rect(st, 15, 0, 17, 6, 'p');
rect(st, 19, 1, 24, 4, 'B'); st[4][22]='W'; st[5][20]='T'; st[4][18]='T';
for (const x of [12, 9, 6]) st[2][x] = 'W';
st[3][11]='D'; st[4][12]='T'; rect(st, 4, 5, 13, 6, 'K');
st[7][14]='P'; st[7][8]='h'; st[11][23]='P'; st[12][6]='h';
rect(st, 0, 14, 27, 14, 'L'); rect(st, 0, 15, 27, 15, 'n');
rect(st, 0, 16, 27, 16, 'u'); rect(st, 0, 17, 27, 17, '~');
rect(st, 24, 8, 27, 10, 'R'); st[7][25]='T';
rect(st, 0, 0, 3, 7, 'B'); rect(st, 0, 11, 3, 14, 'F');
rect(st, 0, 8, 4, 10, 'p'); st[7][4]='T';
export const STATION: GameMap = {
  id: 'las_americas', name: 'Estación de Las Américas', rows: rows(st), legend: L,
  npcs: [
    { id: 'mago_americas', sprite: 'mago_romero', x: 3, y: 9, trainer: 'mago_americas' },
    { id: 'romera_americas', sprite: 'chaxiraxi', x: 14, y: 10 },
    { id: 'timplista_americas', sprite: 'parrandero', x: 9, y: 11 },
  ], triggers: [
    ...[8, 9, 10].map(y => warp(27, y, 'tf1', 6, 12, 'right')),
    ...[15, 16, 17].map(x => warp(x, 0, 'puente_magma', x - 5, 18, 'up')),
    ...[8, 9, 10].map(y => ({ x: 3, y, kind: 'step' as const, action: { type: 'gate' as const, key: 'mago_americas_done',
      lines: ['DON SERVANDO: ¡Quieto ahí! Para seguir al oeste, primero me ganas a las cartas. El puente del Magma te queda al norte.'], back: { x: 4, y, dir: 'left' as const } } })),
    ...[8, 9, 10].map(y => warp(0, y, 'veronicas', COAST.entry, 8, 'left')),
    sign(20, 5, 'MAGMA · Palacio de congresos. La rampa peatonal de la izquierda sube al puente sobre la TF-1.'),
    sign(18, 4, '↑ SIAM PARK / SIAM MALL. Cruza la TF-1 por el puente, no por los carriles.'),
    sign(12, 4, 'ESTACIÓN DE LAS AMÉRICAS. Norte: Magma y Siam Park. Oeste: San Eugenio y hotel H10. Este: regreso a la TF-1.'),
    sign(4, 7, '← SAN EUGENIO · HOTEL H10. Desde el hotel, baja al sureste por la callejuela al Monkey. Después, al este por Troya.'),
    sign(25, 7, '→ Regreso a la TF-1 y al aeropuerto.'), zone(16, 3, 'MAGMA · PUENTE NORTE'),
  ],
  onEnter: ['ESTACIÓN DE LAS AMÉRICAS. Se acaba la isa. Al norte del Magma, el puente cruza la TF-1 hacia Siam Park.', 'Por el arco del oeste se va a San Eugenio y al H10. Don Servando ya está barajando.'],
};

const br = grid(24, 20, 'g');
rect(br, 0, 0, 23, 1, 'E'); rect(br, 0, 18, 23, 19, 'B');
rect(br, 0, 7, 23, 7, 'F'); rect(br, 0, 8, 23, 11, 'a'); rect(br, 0, 12, 23, 12, 'F');
rect(br, 8, 2, 14, 5, 'Z'); rect(br, 7, 15, 16, 17, 'Z');
rect(br, 10, 0, 12, 19, 'p'); rect(br, 10, 7, 12, 12, 'b');
rect(br, 9, 6, 9, 13, 'L'); rect(br, 13, 6, 13, 13, 'L');
rect(br, 10, 13, 12, 14, 's'); rect(br, 10, 5, 12, 6, 's');
rect(br, 1, 14, 5, 17, 'B'); br[15][2] = 'W'; br[15][4] = 'W';
br[4][7] = 'P'; br[14][15] = 'P'; br[15][8] = 'T'; br[3][14] = 'T';
const bridge: GameMap = {
  id: 'puente_magma', name: 'Magma · Pasarela de la TF-1', legend: L, rows: rows(br), npcs: [],
  triggers: [
    ...[10, 11, 12].map(x => warp(x, 0, 'siam_park', 47 + (x - 10), 22, 'up')),
    ...[10, 11, 12].map(x => warp(x, 19, 'las_americas', x + 5, 1, 'down')),
    sign(8, 15, 'MAGMA. ↑ Pasarela peatonal hacia Siam Park. ↓ Estación de Las Américas.'),
    sign(14, 3, 'SIAM PARK ↑ · SIAM MALL →. La entrada del parque está justo delante.'),
    ...[10, 11, 12].map(x => zone(x, 10, 'SOBRE LA TF-1')),
  ], onEnter: ['Pasarela del Magma. Los coches pasan por debajo. Sigue hacia el norte: al otro lado están Siam Park y Siam Mall.'],
};

const coast = grid(83, 29, 'B');
// Start at the east entrance. Walk west through San Eugenio to the H10.
rect(coast, 10, 7, COAST.stationGate, 10, '.');
rect(coast, 10, 8, COAST.stationGate, 9, 'Z');
for (const x of [12, 15, 18, 21, 24, 28, 31, 34, 37]) { coast[3][x]='W'; coast[5][x]='W'; }
coast[7][25]='P'; coast[7][16]='T'; coast[7][34]='T'; coast[10][13]='T';
// A three-tile-wide stepped alley: every step south also shifts it east.
// Adjacent rows overlap so a four-direction D-pad can walk the entire descent.
for (let y=10; y<=17; y++) {
  const left=10+(y-10);
  rect(coast, left, y, left+2, y, y===12||y===15?'s':'p');
}
// From the Monkey terrace, the promenade runs EAST alongside the beach.
rect(coast, 17, 17, 81, 22, 'Z'); rect(coast, 17, 23, 82, 23, 'L');
rect(coast, 0, 24, 82, 25, 'n'); rect(coast, 0, 26, 82, 26, 'u'); rect(coast, 0, 27, 82, 28, '~');
rect(coast, 39, 22, 40, 23, 's'); rect(coast, 64, 22, 65, 23, 's');
for (const x of [20, 28, 35, 43, 50, 61, 70, 79]) coast[22][x] = 'P';
for (const x of [24, 38, 54, 75]) coast[22][x] = 'h';
coast[18][25] = 'M'; coast[18][28] = 'M'; coast[17][29] = 'T'; coast[22][42] = 'T';
rect(coast, 32, 10, 38, 16, 'B'); coast[15][35] = 'H'; coast[16][35] = 'D';
coast[17][36] = 'T'; coast[18][49] = 'h'; coast[18][55] = 'T';
coast[18][60] = 'M'; coast[18][65] = 'M';
coast[16][73] = 'D'; coast[16][74] = 'D'; coast[17][71] = 'T';
appendGomeraChannel(coast);
const promenade: GameMap = {
  id: 'veronicas', name: 'Las Verónicas · Paseo nocturno', night: true, rows: rows(coast), legend: L,
  npcs: [
    { id: 'recepcion_h10', sprite: 'conserje', x: 17, y: 7 },
    { id: 'monkeys_camarera', sprite: 'cathaysa', x: 26, y: 18 },
    { id: 'tourist_map', sprite: 'guiri_crema', x: 36, y: 19 },
    { id: 'troyalocal', sprite: 'parrandero', x: 45, y: 21 },
    { id: 'malick', sprite: 'malick', x: 53, y: 20 },
    { id: 'barry_troya', sprite: 'runner', x: 58, y: 19, trainer: 'barry_troya' },
    { id: 'tourist_song', sprite: 'estudiante', x: 62, y: 20 },
    { id: 'ibrahima', sprite: 'ibrahima', x: 67, y: 19 },
    { id: 'tourist_shoe', sprite: 'guiri_crema', x: 68, y: 21 },
    { id: 'sarah_karaoke', sprite: 'cathaysa', x: 76, y: 19, trainer: 'sarah_karaoke' },
    { id: 'taxi_noche', sprite: 'conserje', x: 80, y: 21 },
    ...GOMERA_TRAINERS,
  ], triggers: [
    ...[7, 8, 9, 10].map(y => warp(COAST.stationGate, y, 'las_americas', 1, 9, 'right')),
    ...[7, 8, 9, 10].map(y => landmark(COAST.sanEugenio, y, 'san_eugenio', 'SAN EUGENIO')),
    ...[7, 8, 9, 10].map(y => landmark(COAST.hotel, y, 'h10', 'HOTEL H10')),
    ...[13, 14, 15].map(x => landmark(x, 13, 'callejuela', 'CALLEJUELA · SURESTE')),
    ...[17, 18, 19, 20, 21, 22].map(y => landmark(COAST.monkey, y, 'monkeys', 'MONKEY BEACH')),
    ...[17, 18, 19, 20, 21, 22].map(y => landmark(41, y, 'troya', 'PLAYA DE TROYA')),
    ...[17, 18, 19, 20, 21, 22].map(y => landmark(57, y, 'veronicas', 'LAS VERÓNICAS')),
    ...[73, 74].map(x => warp(x, 16, 'papagayos', 9, 18, 'up')),
    { x: 35, y: 16, kind: 'step', action: { type: 'enterParrandero', id: 'troya' } },
    sign(16, 7, 'HOTEL H10. En la esquina, baja por la callejuela hacia el sureste. Las luces de abajo son del Monkey.'),
    sign(34, 7, 'SAN EUGENIO. ← Hotel H10. → Estación de Las Américas.'),
    sign(13, 10, 'MONKEY BEACH · SURESTE. Baja la escalera siguiendo la callejuela a la derecha.'),
    sign(29, 17, 'MONKEY BEACH. Terraza abierta. Para Las Verónicas y Papagayos, sigue al este por el paseo junto al mar.'),
    sign(36, 17, 'CENTRO PARRANDERO DE TROYA. Último barraquito antes de la discoteca.'),
    sign(42, 22, 'PLAYA DE TROYA. Hoy la luna se ha quedado con todas las tumbonas.',
      'Para ir a La Gomera, saca la Pukas en la orilla y rema al SUR entre las boyas.'),
    sign(55, 18, '→ LAS VERÓNICAS. Sigue el bajo hasta el letrero de Papagayos.'),
    sign(71, 17, 'PAPAGAYOS · GUACHINCHE Nº 5. TIPO VENENO. El garrafón se pide en la barra; lo demás te lo ofrecen por fuera.'),
    ...GOMERA_COAST_TRIGGERS,
  ], onEnter: ['SAN EUGENIO. Al oeste luce el letrero del H10. Al llegar al hotel, baja al sureste por la callejuela.', 'Desde el Monkey, sigue al este por el paseo de Troya hasta Las Verónicas y Papagayos.'],
};

// Intentionally independent of tile artwork: every square of the dancefloor looks identical.
// A continuous dry path with several false turns, not a random layout on each visit.
const dry = new Set<string>();
function trail(points: [number, number][]) {
  let [x, y] = points[0]; dry.add(`${x},${y}`);
  for (const [tx, ty] of points.slice(1)) {
    while (x !== tx || y !== ty) { x += Math.sign(tx - x); y += Math.sign(ty - y); dry.add(`${x},${y}`); }
  }
}
trail([[9,18],[9,16],[15,16],[15,12],[5,12],[5,8],[13,8],[13,5],[9,5],[9,3]]);
trail([[11,16],[11,14],[13,14]]); trail([[9,12],[9,10],[11,10]]);
trail([[5,10],[2,10]]); trail([[7,8],[7,6],[3,6]]); trail([[13,6],[16,6]]);
export function stickyAt(x: number, y: number, cleaned = false) {
  return !cleaned && x > 0 && x < 18 && y >= 4 && y <= 17 && !dry.has(`${x},${y}`);
}
const club = grid(19, 21, '#');
rect(club, 1, 3, 17, 19, 't'); rect(club, 7, 2, 11, 3, 'm'); club[20][9] = 'D';
// Stage furnishings are beyond the puzzle, never part of the invisible mask.
rect(club, 1, 2, 5, 2, 'C'); rect(club, 13, 2, 17, 2, 'C');
club[2][6] = 'A'; club[2][12] = 'A'; club[18][3] = 'h'; club[18][15] = 'T';
const papagayos: GameMap = {
  id: 'papagayos', name: 'Papagayos · Guachinche Nº 5', rows: rows(club), legend: L,
  npcs: [
    { id: 'dj_yessica', sprite: 'dj_yessica', x: 9, y: 2, trainer: 'gym_papagayos' },
    { id: 'fregona', sprite: 'conserje', x: 5, y: 18 },
  ],
  triggers: [warp(9, 20, 'veronicas', COAST.club, 17, 'down'),
    sign(15, 18, 'GUACHINCHE Nº 5 · TIPO VENENO. YÉSSICA, LA DEL CIERRE, está en la cabina. Si oyes CHOF, prueba en otra dirección.')],
  onEnter: ['PAPAGAYOS. Ves la cabina al fondo. Ni una pared delante. Fácil.', 'Das medio paso. Tu pie viene contigo. Tu chola, no. El garrafón lleva varias generaciones secándose aquí. Busca las baldosas que aún sueltan la suela.'],
};
export const NIGHT_MAPS: Record<'puente_magma' | 'veronicas' | 'papagayos', GameMap> = { puente_magma: bridge, veronicas: promenade, papagayos };
export const NIGHT_TALKS: Record<string, string[]> = {
  recepcion_h10: ['RECEPCIÓN: ¿El Monkey? Hasta la esquina del H10 y por la callejuela pa abajo, al sureste. Si llegas con la maleta, te has saltado la habitación.'],
  monkeys_camarera: ['CAMARERA: Una mesa para dos y una silla para el mazo. ¿O sigues a Papagayos? Al este por Troya, mi niño.'],
  tourist_map: ['Un turista bastante contento intenta ampliar su plano de papel con dos dedos.', '—No hay cobertura, mate. —Claro, es que estás en la página de atrás.'],
  troyalocal: ['Un pescador recoge el sedal. —A esta hora ya no pican las viejas. Solo los guiris que me preguntan si la luna es de pago.'],
  malick: ['Malick se baja las gafas de sol a medianoche y se acerca para que lo oigas entre el bajo de Papagayos.', 'MALICK: ¿Quieres algo, hermano? Hierba, chocolate... Si buscas algo más fuerte, también hablamos.', 'TU: (Ah. No me estaba ofreciendo una pulsera. Ahora entiendo lo de gimnasio VENENO.)'],
  tourist_song: ['Tres guiris abrazados cantan tres canciones distintas. Ninguno parece haber reparado en el detalle.'],
  ibrahima: ['IBRAHIMA: ¿Quieres algo, jefe? Algo para aguantar hasta que amanezca. Puro, puro.', 'TU: (Seguro que es tan puro como el ron de la barra. Mejor sigo caminando.)'],
  tourist_shoe: ['—Mate, have you seen my other flip-flop? Le señalas la mano. Lleva media hora hablando por una chola.'],
  taxi_noche: ['TAXISTA: A la gente de Papagayos la reconozco sin mirar. Hacen CHOF, CHOF hasta la parada.'],
  fregona: ['ENCARGADO: Dejé la fregona en casa. No me daba la gana venir a trabajar el día libre. Y aquí me tienes rodeado de garrafón seco.', 'Entra por el centro, sube dos baldosas y gira a la derecha. Luego escucha la suela. A la líder se le habla con A desde la cabina.'],
};
export const CLUB_POST = ['YÉSSICA: ¡El BOLICHE DE LA CHOLA es tuyo! Ni el de la limpieza había llegado hasta aquí.', 'Por fin aparece la fregona. Ya puedes volver a la puerta en línea recta.'];
