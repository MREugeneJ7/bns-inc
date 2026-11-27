import type { GameMap, NPC, Trigger } from './maps';
import { PAL, TILE, type TileId } from './sprites';

// Cueva del Llano: laberinto subterráneo al este del Llano de los Viejos (Anaga).
// Solo el campeón del Alto Mando puede entrar (hay un guardia en la boca).
// No es un pasillo: hay que orientarse entre tres zonas entrelazadas que exigen las tres M.O.:
//   - PISTA DE TIERRA + SOCAVONES -> M.O. 1 TODO TERRENO (se saca desde la mochila en la pista;
//     los socavones no se cruzan a pie y en ellos no se puede aparcar)
//   - BARRANCOS EN ZIG-ZAG      -> VARA DEL SALTO DEL PASTOR (aterriza solo donde hay repisa)
//   - LAGO SUBTERRÁNEO          -> M.O. 3 PUKAS (isletas para orientarse y descansar)
// Hay ramas con señuelo (bolsillo oeste, isleta oeste, túnel hundido) con carteles de lore.
// Al fondo espera MAGEC, el magomón libre original.

/** Llegada desde la boca de la cueva (Anaga). */
export const CUEVA_ENTRY = { x: 10, y: 33 } as const;
/** Puerta de salida de la cueva (vuelve a la boca, en Anaga). */
const CUEVA_EXIT = { x: 10, y: 34 } as const;
/** Posición de Magec en la cámara final. */
export const MAGEC_POS = { x: 10, y: 4 } as const;

const ROWS: string[] = [
  '######################', // 0
  '######################', // 1
  '#######......#########', // 2  cámara de Magec
  '#######......#########', // 3
  '#######......#########', // 4
  '#######......#########', // 5
  '#########..###########', // 6  repisa de aterrizaje (solo x9..10)
  '#######vvvvvv#########', // 7  sima final (se salta)
  '#######......dd#######', // 8  cornisa + aparcamiento Cumbre
  '#############dddd#####', // 9  bolsillo norte de la pista
  '##############dd######', // 10 pista alta este
  '##############kk######', // 11 parche de socavones
  '############Tdddd#####', // 12 pista + ramal oeste (señuelo del túnel hundido)
  '##############dd######', // 13 pista alta este
  '#############T.dd.####', // 14 orilla norte del lago
  '######~~~~~~~~~~######', // 15 lago
  '######~~~~~~~~~~######', // 16
  '######T.~~..~~~~######', // 17 isleta oeste (señuelo) + isleta central
  '######..~~..~~~~######', // 18
  '######~~~~~~~~~~######', // 19
  '######~~~~~~~~~~######', // 20
  '######~~~~~~~~~~######', // 21
  '######T.........######', // 22 orilla sur del lago
  '############..########', // 23 conector
  '############..########', // 24 conector
  '##########.....#######', // 25 repisa norte del barranco
  '#####vvvvvvvvvv#######', // 26 barranco norte
  '####T..#####..########', // 27 repisas (oeste = bolsillo con señuelo; este = paso)
  '#####vvvvvvvvvv#######', // 28 barranco sur
  '#####Tddddddddd#######', // 29 carril de tierra (se aparca aquí)
  '########kkkkk#########', // 30 vado de socavones (solo en coche)
  '########dddddd########', // 31 vestíbulo (pista)
  '########dddddd########', // 32
  '########dddddd########', // 33 entrada
  '########ddDddd########', // 34 puerta de vuelta a la boca
  '######################', // 35
];

const LEGEND: Record<string, TileId> = {
  '#': 'wall', '.': 'path', d: 'dirt', k: 'pothole', v: 'ravine', '~': 'sea',
  D: 'door', T: 'sign',
};

const sign = (x: number, y: number, ...lines: string[]): Trigger =>
  ({ x, y, kind: 'interact', action: { type: 'text', lines } });

function buildCueva(): GameMap {
  const npcs: NPC[] = [
    { id: 'magec', sprite: 'bruja_canaria', x: MAGEC_POS.x, y: MAGEC_POS.y, trainer: 'magec' },
  ];

  const triggers: Trigger[] = [
    { x: CUEVA_EXIT.x, y: CUEVA_EXIT.y, kind: 'step', action: { type: 'warp', to: 'anaga', x: 65, y: 29, dir: 'left' } },
    { x: 10, y: 32, kind: 'step', action: { type: 'zone', name: 'CUEVA DEL LLANO' } },
    { x: 10, y: 25, kind: 'step', action: { type: 'zone', name: 'BARRANCOS DEL LLANO' } },
    { x: 10, y: 22, kind: 'step', action: { type: 'zone', name: 'LAGO SUBTERRÁNEO' } },
    { x: 15, y: 14, kind: 'step', action: { type: 'zone', name: 'PISTA ALTA' } },
    sign(8, 31,
      'CUEVA DEL LLANO. Solo el campeón del Alto Mando llega hasta aquí.',
      'El 4x4 se SACA Y SE APARCA DESDE LA MOCHILA sobre la PISTA DE TIERRA. Los socavones solo se cruzan en coche, y en ellos no se puede aparcar.'),
    sign(5, 29,
      'BARRANCOS. Se saltan con la VARA DEL SALTO DEL PASTOR desde la mochila, pero solo se aterriza donde hay repisa de piedra. Ojo al zig-zag: el oeste no lleva a ninguna parte.'),
    sign(4, 27,
      'BOLSILLO SIN SALIDA. Aquí solo hay guano y un eco que devuelve tu propia voz. El paso bueno está en la repisa del este.'),
    sign(6, 22,
      'LAGO SUBTERRÁNEO. Mira al agua y saca la M.O. 3 PUKAS desde la mochila. Las isletas sirven para orientarse: la del oeste no lleva a la orilla norte.'),
    sign(6, 17,
      'ISLETA OESTE. Bonitas vistas y nada más. La orilla norte con la pista está al NORESTE: vuelve a la isleta central y rema hacia allí.'),
    sign(13, 14,
      'PISTA ALTA. Vuelve a sacar el todoterreno desde la mochila y sube entre socavones hasta el aparcamiento Cumbre. El ramal del oeste está hundido: no pierdas el tiempo.'),
    sign(12, 12,
      'TÚNEL HUNDIDO. La galería se vino abajo hace años. Media vuelta y sigue subiendo por la pista del este.'),
  ];

  return {
    id: 'cueva_magec',
    name: 'Cueva del Llano · Magec',
    rows: ROWS,
    legend: LEGEND,
    npcs,
    triggers,
    onEnter: [
      'Cruzas la boca de la cueva y el aire se vuelve frío y húmedo.',
      'No es un pasillo: orienta entre la pista, los barrancos y el lago. Las tres M.O. te harán falta.',
    ],
  };
}

export const CUEVA_MAGEC_MAP = buildCueva();

export function drawCuevaDetails(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
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
  label('MAGEC', 8, 1);
  label('LAGO', 6, 14);
  label('BARRANCOS', 2, 25);
  label('PISTA', 4, 31);
}
