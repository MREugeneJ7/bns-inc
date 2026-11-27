import type { GameMap, NPC, Trigger } from './maps';
import { PAL, TILE, type TileId } from './sprites';

// Sendero Telesforo Bravo: subida a pie desde el Refugio de Montaña Blanca hasta el borde del cráter del Teide.
// Es el Alto Mando de los menceyes. Van en orden, y cada uno corta el camino con un paso de una baldosa
// que solo se abre cuando cae (los menceyes desaparecen al perder). Bencomo es el campeón del final.
//   1. ACAIMO   (hielo)          a la altura de la Cueva del Hielo
//   2. TEGUESTE (roca y lucha)   un poco más arriba, en el mirador
//   3. ROMEN    (fantasma)       hacia el OESTE, de camino al teleférico
//   4. PELICAR  (dragón)         donde empieza la subida al cráter, junto al teleférico
//   5. BENCOMO  (campeón)        arriba de los escalones, al lado del cráter
// Sin atajos: no hay ruta alternativa, ni siquiera saltando barrancos (aquí las grietas son pared).

/** Llegada desde el refugio (el pasillo central del refugio sube hasta aquí). */
export const SENDERO_ENTRY = { x: 11, y: 34 } as const;
/** Nudo de vuelta al refugio: pisarlo te devuelve a la plaza del refugio. */
const SENDERO_RETURN = { x: 11, y: 35 } as const;

const W = 22;
const H = 36;

function buildGrid(): string[][] {
  const g: string[][] = Array.from({ length: H }, () => Array<string>(W).fill('#'));
  const rect = (x0: number, y0: number, x1: number, y1: number, ch: string) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch;
  };
  const put = (x: number, y: number, ch: string) => { g[y][x] = ch; };

  // 1) Cráter (arriba del todo): el pozo de lava no se cruza y la arena negra del borde sí.
  rect(1, 0, 4, 2, 'K'); rect(5, 0, 15, 2, 'v'); rect(16, 0, 20, 2, 'K');
  rect(1, 3, 20, 4, 'K');
  put(6, 3, 'T'); // cartel del cráter
  // 2) Escalones que bajan desde el borde del cráter hasta la base (10,10).
  rect(10, 5, 10, 9, 'S');
  // 3) Teleférico: estación con puerta al andén de la fila 10.
  rect(13, 6, 19, 8, 'b'); rect(13, 9, 19, 9, 'b'); put(16, 9, 'D');
  rect(12, 10, 20, 10, 's');
  // 4) Base de los escalones: solo se entra por (11,10), donde está PELICAR.
  put(10, 10, '.'); put(11, 10, '.');
  // 5) Corredor del este hacia el andén del teleférico: ROMEN lo bloquea en (20,12).
  rect(20, 11, 20, 13, '.');
  // 6) Explanada intermedia y puerta de una baldosa hacia el mirador: TEGUESTE en (10,18).
  rect(4, 14, 20, 14, 's'); rect(2, 15, 20, 17, 's');
  put(16, 16, 'T'); // cartel del camino del teleférico
  put(10, 18, 's');
  // 7) Mirador con barandillas. Hueco central (9..11, 19) por donde se llega a la puerta.
  rect(2, 19, 8, 19, 'G'); rect(12, 19, 18, 19, 'G'); rect(9, 19, 11, 19, 's');
  rect(1, 20, 20, 21, 's');
  put(14, 20, 'T'); // cartel del mirador
  // 8) Franja de paso bajo el mirador.
  rect(2, 22, 19, 22, 's');
  // 9) Cueva del hielo (pared oeste) con boca hacia la llanura. ACAIMO guarda el paso en (10,23).
  rect(2, 23, 6, 23, 'b'); put(10, 23, 's'); put(4, 24, 'D');
  // 10) Llanura de entrada desde el refugio.
  rect(1, 24, 20, 34, 's');
  put(7, 27, 'T'); // cartel de entrada
  // 11) Nudo de vuelta al refugio (coordenada final; aquí se coloca su simétrica pre-espejo).
  put(W - 1 - SENDERO_RETURN.x, SENDERO_RETURN.y, '.');
  // Espejo este->oeste: la salida al teleférico y el paso de Romen quedan al OESTE
  // (así se pidió). La geometría se construye al este y se voltea entera aquí.
  for (let y = 0; y < H; y++) g[y].reverse();
  return g;
}

const LEGEND: Record<string, TileId> = {
  '#': 'wall', s: 'arid', '.': 'path', v: 'ravine', K: 'blacksand', S: 'stairs',
  b: 'building', D: 'door', G: 'guardrail', T: 'sign',
};

const sign = (x: number, y: number, ...lines: string[]): Trigger =>
  ({ x, y, kind: 'interact', action: { type: 'text', lines } });

function buildSendero(): GameMap {
  const g = buildGrid();

  const npcs: NPC[] = [
    // Coordenadas ya espejadas (oeste = izquierda).
    { id: 'alto_mando_acaimo', sprite: 'cayuquero', x: 11, y: 23, trainer: 'alto_mando_acaimo' },
    { id: 'alto_mando_tegueste', sprite: 'lider1', x: 11, y: 18, trainer: 'alto_mando_tegueste' },
    { id: 'alto_mando_romen', sprite: 'bruja_canaria', x: 1, y: 12, trainer: 'alto_mando_romen' },
    { id: 'alto_mando_pelicar', sprite: 'capitan', x: 10, y: 10, trainer: 'alto_mando_pelicar' },
    { id: 'alto_mando_bencomo', sprite: 'chino', x: 4, y: 2, trainer: 'alto_mando_bencomo' },
  ];

  const triggers: Trigger[] = [
    { x: SENDERO_RETURN.x, y: SENDERO_RETURN.y, kind: 'step', action: { type: 'warp', to: 'montana_blanca', x: 10, y: 1, dir: 'down' } },
    { x: 11, y: 33, kind: 'step', action: { type: 'zone', name: 'SENDERO TELESFORO BRAVO' } },
    sign(14, 27, 'SENDERO TELESFORO BRAVO. Subida al cráter por la arena negra. El refugio queda a tu espalda.',
      'Cinco menceyes guardan el camino. No hay atajo: cada uno abre su paso cuando cae.'),
    sign(7, 20, 'MIRADOR TELESFORO. Desde aquí se ve el mar de nubes y la sombra del Teide sobre la isla.'),
    sign(5, 16, 'CAMINO DEL TELEFÉRICO. El corredor del OESTE sube hasta la estación. Por ahí se va al andén.'),
    sign(15, 3, 'CRÁTER DEL TEIDE. Pozo de lava y humo. Al pie de los escalones aún espera el último dragón.'),
  ];

  return {
    id: 'sendero_telesforo',
    name: 'Sendero Telesforo Bravo · Alto Mando',
    rows: g.map((row) => row.join('')),
    legend: LEGEND,
    npcs,
    triggers,
    onEnter: [
      'Subes por el pasillo que deja el refugio entre sus dos alas y pisas el Sendero Telesforo Bravo.',
      'Arena negra, viento frío y cinco menceyes en fila hasta el cráter. Ganarles es la única forma de llegar arriba.',
    ],
  };
}

export const SENDERO_TELESFORO_MAP = buildSendero();

export function drawSenderoDetails(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
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
  label('CRATER', 14, 0);
  label('TELEFERICO', 1, 5);
  label('CUEVA DEL HIELO', 14, 22);
  label('MIRADOR', 2, 20);
}
