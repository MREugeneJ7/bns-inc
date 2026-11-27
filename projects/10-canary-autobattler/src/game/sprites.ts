// Game Boy palette: 0 lightest -> 3 darkest
export const PAL = ['#9bbc0f', '#8bac0f', '#306230', '#0f380f'];
export const TILE = 16;
export const SCREEN_W = 160;
export const SCREEN_H = 144;
export const MAP_W = 10;
export const MAP_H = 9;

// Sprite chars: '.' transparent, 'a' lightest, 'b' light, 'c' dark, 'd' darkest
const CH: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };

export type Sprite = string[];

export const SPRITES: Record<string, Sprite> = {
  // Guirufo: gorra, gafas de sol, camisa hawaiana, cholas
  player_down: [
    '................',
    '.....dddddd.....',
    '....dbbbbbbd....',
    '...dbbbbbbbbd...',
    '...dddddddddd...',
    '...daaaaaaaad...',
    '...dadddaddda...',
    '...daaaaaaaad...',
    '....daacaaad....',
    '.....dddddd.....',
    '...dcbcbcbcbcd..',
    '..dadbcbcbcbda..',
    '..dadcbcbcbcda..',
    '...ddaaaaaadd...',
    '....daa.daa.....',
    '....ddd.ddd.....',
  ],
  player_up: [
    '................',
    '.....dddddd.....',
    '....dbbbbbbd....',
    '...dbbbbbbbbd...',
    '...dbbbbbbbbd...',
    '...dbbbbbbbbd...',
    '...dbbbbbbbbd...',
    '...dcbbbbbbcd...',
    '....daaaaaad....',
    '.....dddddd.....',
    '...dcbcbcbcbcd..',
    '..dadbcbcbcbda..',
    '..dadcbcbcbcda..',
    '...ddaaaaaadd...',
    '....daa.daa.....',
    '....ddd.ddd.....',
  ],
  player_right: [
    '................',
    '.....dddddd.....',
    '....dbbbbbbd....',
    '...dbbbbbbbbdd..',
    '...ddddddddddd..',
    '...dbaaaaaaad...',
    '...dbaaddaddd...',
    '...dbaaaaaaad...',
    '....daaaacad....',
    '.....dddddd.....',
    '....dcbcbcbcd...',
    '....dbcbcbcbda..',
    '....dcbcbcbcda..',
    '....ddaaaaadd...',
    '.....daadaa.....',
    '.....ddd.ddd....',
  ],
  // Yeray: vecino canario con pelo rizado y camiseta
  neighbor: [
    '................',
    '....dddddddd....',
    '...dcdcdcdcdcd..',
    '..dcdcdcdcdcdcd.',
    '..dcdaaaaaadcd..',
    '..dcaaaaaaaacd..',
    '...daadaadaad...',
    '...daaaaaaaad...',
    '....daaddaad....',
    '.....daaaad.....',
    '....dccccccd....',
    '...daccddccad...',
    '...dadccccdad...',
    '....dcccccc.....',
    '....dcc.dcc.....',
    '....ddd.ddd.....',
  ],
  // Profesor Acaymo: bata blanca, barba
  professor: [
    '................',
    '.....dddddd.....',
    '....dccccccd....',
    '...dcaaaaaacd...',
    '...dcaaaaaacd...',
    '...daaaaaaaad...',
    '...dadaaaadad...',
    '...daaaaaaaad...',
    '...dcaccccacd...',
    '....dcccccd.....',
    '...daaaddaaad...',
    '..dcaaaddaaacd..',
    '..dcaaaddaaacd..',
    '...daaaddaaad...',
    '....daa.daa.....',
    '....ddd.ddd.....',
  ],
};

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  flipX = false
) {
  for (let r = 0; r < sprite.length; r++) {
    const row = sprite[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      ctx.fillStyle = PAL[CH[ch]];
      const px = flipX ? x + (row.length - 1 - c) : x + c;
      ctx.fillRect(px, y + r, 1, 1);
    }
  }
}

// ---------- Procedural tiles ----------
export type TileId =
  | 'floor' | 'wall' | 'box' | 'bed' | 'door' | 'window' | 'plant' | 'table'
  | 'stairs' | 'mat' | 'road' | 'sidewalk' | 'tram' | 'sign' | 'building'
  | 'counter' | 'machine' | 'card' | 'palm' | 'sea' | 'tiles'
  | 'rail' | 'landing' | 'track' | 'vtrack' | 'bridge' | 'ravine' | 'tf5'
  | 'grass' | 'tree' | 'bench' | 'crosswalk' | 'path' | 'plaza'
  | 'fence' | 'parking' | 'car' | 'monument' | 'dish' | 'parranda'
  | 'colegio' | 'court' | 'hoop' | 'blacksand' | 'surf' | 'roque' | 'pothole' | 'fogon'
  | 'pintada' | 'gtable' | 'kdoor' | 'deck' | 'porthole' | 'bucket'
  | 'slot' | 'poster' | 'escalator' | 'copier'
  | 'turbine' | 'guardrail' | 'arid' | 'redrock' | 'runway' | 'board'
  | 'waterslide' | 'tube' | 'wavepool' | 'temple' | 'lift' | 'teleport' | 'roomplatform' | 'keycard' | 'oldkey' | 'radar'
  | 'dirt';

export const SOLID: Record<TileId, boolean> = {
  floor: false, wall: true, box: true, bed: true, door: false, window: true,
  plant: true, table: true, stairs: false, mat: false, road: false,
  sidewalk: false, tram: true, sign: true, building: true, counter: true,
  machine: true, card: true, palm: true, sea: true, tiles: false,
  rail: true, landing: false, track: false, vtrack: false, bridge: false, ravine: true, tf5: true,
  grass: false, tree: true, bench: true, crosswalk: false, path: false, plaza: false,
  fence: true, parking: false, car: true, monument: true, dish: true, parranda: true,
  colegio: true, court: false, hoop: true, blacksand: false, surf: true, roque: true, pothole: true, fogon: true,
  pintada: true, gtable: true, kdoor: false, deck: false, porthole: true, bucket: true,
  slot: true, poster: true, escalator: false, copier: true,
  turbine: true, guardrail: true, arid: false, redrock: true, runway: true, board: true,
  waterslide: true, tube: true, wavepool: true, temple: true, lift: true, teleport: false, roomplatform: false, keycard: false, oldkey: true, radar: true,
  dirt: false,
};

/** Unicas superficies legales para el Toyota Landcruiser: asfalto, pasos de cebra, puentes, parking y baches. */
export const DRIVABLE_TILES: ReadonlySet<TileId> = new Set<TileId>([
  'road', 'crosswalk', 'parking', 'pothole', 'bridge', 'dirt',
]);

const F = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: number) => {
  ctx.fillStyle = PAL[c];
  ctx.fillRect(x, y, w, h);
};

export function drawTile(ctx: CanvasRenderingContext2D, id: TileId, x: number, y: number, frame: number) {
  switch (id) {
    case 'lift':
      F(ctx, x, y, 16, 16, 2);
      F(ctx, x + 1, y + 3, 12, 13, 3); F(ctx, x + 2, y + 4, 4, 11, 1); F(ctx, x + 7, y + 4, 4, 11, 1);
      F(ctx, x + 3, y + 5, 1, 9, 0); F(ctx, x + 8, y + 5, 1, 9, 0);
      F(ctx, x + 5, y, 5, 2, 3); F(ctx, x + 7, y, 1, 1, 0);
      F(ctx, x + 13, y + 7, 3, 5, 3); F(ctx, x + 14, y + 8, 1, 1, 0); F(ctx, x + 14, y + 10, 1, 1, 1);
      break;
    case 'teleport': {
      F(ctx, x, y, 16, 16, 2);
      F(ctx, x + 2, y + 2, 12, 12, 1); F(ctx, x + 4, y + 4, 8, 8, 0);
      F(ctx, x + 1, y + 7, 2, 2, 0); F(ctx, x + 13, y + 7, 2, 2, 0); F(ctx, x + 7, y + 1, 2, 2, 3); F(ctx, x + 7, y + 13, 2, 2, 3);
      if (frame % 16 < 8) F(ctx, x + 7, y + 4, 2, 8, 3);
      break;
    }
    case 'roomplatform':
      F(ctx, x, y, 16, 16, 2); F(ctx, x, y + 2, 16, 12, 3); F(ctx, x + 1, y + 3, 14, 2, 1); F(ctx, x + 1, y + 11, 14, 2, 1);
      break;
    case 'keycard':
      F(ctx, x, y, 16, 16, 0); F(ctx, x + 2, y + 4, 12, 8, 3); F(ctx, x + 3, y + 5, 10, 6, 0);
      F(ctx, x + 4, y + 6, 5, 2, 2); F(ctx, x + 4, y + 9, 3, 1, 2); F(ctx, x + 12, y + 9, 1, 1, 2);
      break;
    case 'oldkey':
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x + 2, y + 2, 7, 7, 3); F(ctx, x + 4, y + 4, 3, 3, 0);
      F(ctx, x + 7, y + 7, 3, 3, 3); F(ctx, x + 9, y + 9, 3, 3, 3);
      F(ctx, x + 11, y + 11, 3, 3, 3); F(ctx, x + 12, y + 8, 2, 3, 3);
      F(ctx, x + 8, y + 11, 2, 3, 3); F(ctx, x + 7, y + 8, 2, 1, 1);
      if (frame % 2 === 0) { F(ctx, x + 12, y + 2, 1, 3, 2); F(ctx, x + 11, y + 3, 3, 1, 2); }
      break;
    case 'floor':
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x + 3, y + 3, 1, 1, 1); F(ctx, x + 11, y + 9, 1, 1, 1);
      break;
    case 'tiles':
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x, y + 7, 16, 1, 1); F(ctx, x + 7, y, 1, 16, 1);
      break;
    case 'wall':
      F(ctx, x, y, 16, 16, 1);
      F(ctx, x, y + 4, 16, 1, 2); F(ctx, x, y + 10, 16, 1, 2);
      F(ctx, x + 5, y, 1, 4, 2); F(ctx, x + 11, y + 5, 1, 5, 2); F(ctx, x + 3, y + 11, 1, 3, 2);
      F(ctx, x, y + 14, 16, 2, 3);
      break;
    case 'building':
      F(ctx, x, y, 16, 16, 2);
      F(ctx, x + 2, y + 2, 4, 4, 0); F(ctx, x + 10, y + 2, 4, 4, 0);
      F(ctx, x + 2, y + 10, 4, 4, 0); F(ctx, x + 10, y + 10, 4, 4, 0);
      break;
    case 'box':
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x + 1, y + 2, 14, 13, 3); F(ctx, x + 2, y + 3, 12, 11, 1);
      F(ctx, x + 7, y + 3, 2, 11, 3); F(ctx, x + 2, y + 8, 12, 1, 3);
      break;
    case 'bed':
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x + 1, y, 14, 16, 3); F(ctx, x + 2, y + 1, 12, 14, 0);
      F(ctx, x + 2, y + 1, 12, 5, 1); F(ctx, x + 4, y + 2, 8, 3, 0);
      break;
    case 'door':
      F(ctx, x, y, 16, 16, 2);
      F(ctx, x + 1, y, 14, 16, 3);
      F(ctx, x + 3, y + 3, 10, 13, 1);
      F(ctx, x + 4, y + 4, 8, 5, 0); F(ctx, x + 4, y + 11, 8, 4, 0);
      F(ctx, x + 10, y + 10, 2, 1, 3);
      F(ctx, x + 5, y, 6, 2, 0); F(ctx, x + 7, y, 2, 2, 3);
      break;
    case 'window':
      F(ctx, x, y, 16, 16, 2);
      F(ctx, x + 2, y + 2, 12, 10, 3); F(ctx, x + 3, y + 3, 10, 8, 0);
      F(ctx, x + 3, y + 7, 10, 4, 1); F(ctx, x + 8, y + 3, 1, 8, 3);
      break;
    case 'plant':
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x + 5, y + 11, 6, 5, 3); F(ctx, x + 6, y + 12, 4, 3, 1);
      F(ctx, x + 3, y + 3, 10, 8, 2); F(ctx, x + 5, y + 1, 6, 4, 2); F(ctx, x + 7, y + 4, 2, 7, 3);
      break;
    case 'palm':
      F(ctx, x, y, 16, 16, 1);
      F(ctx, x + 7, y + 6, 2, 10, 3);
      F(ctx, x + 2, y + 3, 12, 3, 2); F(ctx, x + 4, y + 1, 8, 2, 2); F(ctx, x + 1, y + 6, 4, 2, 2); F(ctx, x + 11, y + 6, 4, 2, 2);
      break;
    case 'sea':
      F(ctx, x, y, 16, 16, 1);
      { const o = frame % 2 === 0 ? 0 : 2; F(ctx, x + 1 + o, y + 4, 5, 1, 0); F(ctx, x + 9 - o, y + 11, 5, 1, 0); }
      break;
    case 'table':
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x + 1, y + 4, 14, 8, 3); F(ctx, x + 2, y + 5, 12, 6, 1);
      F(ctx, x + 2, y + 12, 2, 4, 3); F(ctx, x + 12, y + 12, 2, 4, 3);
      break;
    case 'counter':
      F(ctx, x, y, 16, 16, 1);
      F(ctx, x, y, 16, 3, 0); F(ctx, x, y + 3, 16, 1, 3); F(ctx, x, y + 13, 16, 3, 3);
      break;
    case 'card':
      F(ctx, x, y, 16, 16, 1);
      F(ctx, x, y, 16, 3, 0); F(ctx, x, y + 3, 16, 1, 3);
      F(ctx, x + 3, y + 4, 10, 12, 3); F(ctx, x + 4, y + 5, 8, 10, 0);
      F(ctx, x + 5, y + 6, 6, 4, 2);
      if (frame % 2 === 0) F(ctx, x + 1, y + 1, 1, 1, 3), F(ctx, x + 14, y + 14, 1, 1, 0);
      break;
    case 'machine':
      F(ctx, x, y, 16, 16, 2);
      F(ctx, x + 2, y + 1, 12, 14, 3); F(ctx, x + 3, y + 2, 10, 6, 0);
      F(ctx, x + 4, y + 3, frame % 4 + 2, 1, 2); F(ctx, x + 4, y + 5, 7 - (frame % 3), 1, 2);
      F(ctx, x + 4, y + 10, 2, 2, 1); F(ctx, x + 8, y + 10, 2, 2, frame % 2 ? 0 : 1);
      break;
    case 'stairs':
      // escaleras en U de un rellano: peldaños bajando y barandilla
      F(ctx, x, y, 16, 16, 0);
      for (let i = 0; i < 5; i++) { F(ctx, x + 1, y + i * 3, 14, 1, 3); F(ctx, x + 1, y + i * 3 + 1, 14, 2, i % 2 ? 1 : 0); }
      F(ctx, x, y, 1, 16, 3); F(ctx, x + 15, y, 1, 16, 3);
      break;
    case 'track':
      // vias del tranvia horizontales
      F(ctx, x, y, 16, 16, 1);
      F(ctx, x, y + 5, 16, 1, 3); F(ctx, x, y + 10, 16, 1, 3);
      for (let i = 0; i < 16; i += 4) F(ctx, x + i, y + 6, 2, 4, 2);
      break;
    case 'vtrack':
      // vias del tranvia subiendo La Cuesta / Cruz de Piedra
      F(ctx, x, y, 16, 16, 1);
      F(ctx, x + 5, y, 1, 16, 3); F(ctx, x + 10, y, 1, 16, 3);
      for (let i = 0; i < 16; i += 4) F(ctx, x + 6, y + i, 4, 2, 2);
      break;
    case 'grass':
      F(ctx, x, y, 16, 16, 1);
      F(ctx, x + 2, y + 4, 1, 2, 2); F(ctx, x + 4, y + 5, 1, 1, 2);
      F(ctx, x + 11, y + 10, 1, 2, 2); F(ctx, x + 13, y + 11, 1, 1, 2);
      F(ctx, x + 7, y + 2, 1, 1, 0);
      break;
    case 'tree':
      // laurel de indias / arbol de La Granja
      F(ctx, x, y, 16, 16, 1);
      F(ctx, x + 6, y + 11, 4, 5, 3); F(ctx, x + 7, y + 11, 2, 4, 2);
      F(ctx, x + 2, y + 3, 12, 9, 3); F(ctx, x + 4, y + 1, 8, 10, 3);
      F(ctx, x + 3, y + 4, 10, 7, 2); F(ctx, x + 5, y + 2, 6, 8, 2);
      F(ctx, x + 5, y + 3, 3, 2, 1); F(ctx, x + 4, y + 6, 2, 2, 1);
      break;
    case 'bench':
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x + 1, y + 4, 14, 4, 3); F(ctx, x + 2, y + 5, 12, 2, 1);
      F(ctx, x + 1, y + 9, 14, 3, 3); F(ctx, x + 2, y + 10, 12, 1, 1);
      F(ctx, x + 2, y + 12, 2, 3, 3); F(ctx, x + 12, y + 12, 2, 3, 3);
      break;
    case 'crosswalk':
      F(ctx, x, y, 16, 16, 2);
      for (let i = 1; i < 15; i += 4) F(ctx, x + 2, y + i, 12, 2, 0);
      break;
    case 'path':
      // sendero de tierra / pista de correr de La Granja
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x + 2, y + 2, 2, 1, 1); F(ctx, x + 10, y + 6, 2, 1, 1);
      F(ctx, x + 5, y + 12, 2, 1, 1); F(ctx, x + 13, y + 14, 1, 1, 2);
      break;
    case 'plaza':
      // damero de plaza (Weyler, Museo de la Ciencia, Campus ULL)
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x, y, 8, 8, 1); F(ctx, x + 8, y + 8, 8, 8, 1);
      F(ctx, x + 1, y + 1, 6, 6, 0); F(ctx, x + 9, y + 9, 6, 6, 0);
      break;
    case 'fence':
      F(ctx, x, y, 16, 16, 1);
      F(ctx, x, y + 4, 16, 2, 3); F(ctx, x, y + 12, 16, 2, 3);
      for (let i = 1; i < 16; i += 4) { F(ctx, x + i, y + 2, 2, 13, 3); F(ctx, x + i, y + 1, 2, 1, 0); }
      break;
    case 'parking':
      // plaza de aparcamiento del Campus Central ULL
      F(ctx, x, y, 16, 16, 2);
      F(ctx, x, y, 1, 14, 0); F(ctx, x + 15, y, 1, 14, 0); F(ctx, x, y, 16, 1, 0);
      break;
    case 'car':
      // coche aparcado (milagro que encontro sitio en la ULL)
      F(ctx, x, y, 16, 16, 2);
      F(ctx, x + 2, y + 1, 12, 14, 3);
      F(ctx, x + 3, y + 2, 10, 12, 1);
      F(ctx, x + 4, y + 4, 8, 3, 0); // parabrisas
      F(ctx, x + 4, y + 10, 8, 2, 0); // luneta
      F(ctx, x + 3, y + 13, 2, 1, 0); F(ctx, x + 11, y + 13, 2, 1, 0);
      break;
    case 'monument':
      // Cruz de Piedra / escultura de Las Ramblas
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x + 3, y + 12, 10, 4, 3); F(ctx, x + 4, y + 13, 8, 2, 1);
      F(ctx, x + 6, y + 1, 4, 12, 3); F(ctx, x + 3, y + 4, 10, 4, 3);
      F(ctx, x + 7, y + 2, 2, 10, 0); F(ctx, x + 4, y + 5, 8, 2, 0);
      break;
    case 'dish':
      // radiotelescopio del Museo de la Ciencia y el Cosmos
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x + 5, y + 11, 6, 5, 3); F(ctx, x + 7, y + 8, 2, 4, 3);
      F(ctx, x + 2, y + 2, 12, 7, 3); F(ctx, x + 3, y + 3, 10, 5, 0);
      F(ctx, x + 4, y + 5, 8, 2, 1);
      F(ctx, x + 7 + (frame % 2), y + 1, 2, 4, 3);
      break;
    case 'parranda':
      // rotulo luminoso del Centro Parrandero
      F(ctx, x, y, 16, 16, 2);
      F(ctx, x + 1, y + 2, 14, 12, 3);
      F(ctx, x + 2, y + 3, 12, 10, 0);
      F(ctx, x + 7, y + 4, 2, 8, 3);
      F(ctx, x + 5, y + 7, 6, 4, 3);
      F(ctx, x + 6, y + 8, 4, 2, 1);
      if (frame % 2 === 0) { F(ctx, x + 3, y + 4, 1, 1, 2); F(ctx, x + 12, y + 4, 1, 1, 2); }
      break;
    case 'colegio':
      // rotulo de CEIP / Colegio (pizarra con campana de recreo)
      F(ctx, x, y, 16, 16, 2);
      F(ctx, x + 1, y + 2, 14, 12, 3);
      F(ctx, x + 2, y + 3, 12, 10, 1);
      // campana + tiza
      F(ctx, x + 6, y + 4, 4, 2, 3);
      F(ctx, x + 5, y + 6, 6, 4, 3);
      F(ctx, x + 6, y + 6, 4, 3, 0);
      F(ctx, x + 7, y + 10, 2, 2, 3);
      break;
    case 'court':
      // cancha de patio de colegio con lineas pintadas
      F(ctx, x, y, 16, 16, 1);
      F(ctx, x, y + 15, 16, 1, 0);
      F(ctx, x + 15, y, 1, 16, 0);
      break;
    case 'hoop':
      // canasta de baloncesto del patio
      F(ctx, x, y, 16, 16, 1);
      F(ctx, x + 7, y + 7, 2, 9, 3);
      F(ctx, x + 2, y + 1, 12, 7, 3);
      F(ctx, x + 3, y + 2, 10, 5, 0);
      F(ctx, x + 5, y + 4, 6, 3, 3);
      F(ctx, x + 6, y + 5, 4, 2, 0);
      F(ctx, x + 6, y + 8, 4, 2, 2);
      break;
    case 'blacksand':
      // arena negra volcanica de Almaciga y Benijo
      F(ctx, x, y, 16, 16, 2);
      F(ctx, x + 2, y + 3, 2, 1, 1);
      F(ctx, x + 11, y + 6, 2, 1, 3);
      F(ctx, x + 6, y + 11, 2, 1, 1);
      F(ctx, x + 13, y + 13, 1, 1, 0);
      break;
    case 'surf':
      // mar picao de Almaciga / Benijo con espuma blanca
      F(ctx, x, y, 16, 16, 1);
      {
        const o = (frame % 2) * 2;
        F(ctx, x, y + 12 + (frame % 2), 16, 2, 0);
        F(ctx, x + 1 + o, y + 4, 6, 2, 0);
        F(ctx, x + 8 - o, y + 8, 6, 1, 2);
      }
      break;
    case 'roque':
      // Roque de Anaga / Roque de Benijo saliendo del mar
      F(ctx, x, y, 16, 16, 1);
      F(ctx, x + 1, y + 13, 14, 2, 0); // espuma en la base
      F(ctx, x + 2, y + 8, 12, 6, 3);
      F(ctx, x + 4, y + 4, 9, 5, 3);
      F(ctx, x + 6, y + 1, 5, 4, 3);
      F(ctx, x + 5, y + 5, 4, 7, 2);
      F(ctx, x + 7, y + 2, 2, 4, 2);
      break;
    case 'pothole':
      // piche reventado y valla de obra del Team Enriscada
      F(ctx, x, y, 16, 16, 2);
      F(ctx, x + 2, y + 8, 12, 6, 3);
      F(ctx, x + 4, y + 9, 8, 4, 1);
      F(ctx, x + 1, y + 2, 14, 4, 3);
      for (let i = 2; i < 14; i += 4) F(ctx, x + i, y + 3, 2, 2, 0);
      F(ctx, x + 2, y + 6, 2, 3, 3); F(ctx, x + 12, y + 6, 2, 3, 3);
      break;
    case 'fogon':
      // fogon de piedra del Llano de los Viejos con chuletas al fuego
      F(ctx, x, y, 16, 16, 1);
      F(ctx, x + 2, y + 6, 12, 9, 3);
      F(ctx, x + 3, y + 7, 10, 7, 2);
      F(ctx, x + 4, y + 7, 8, 3, 3);
      F(ctx, x + 5 + (frame % 2), y + 4, 4, 3, 0);
      F(ctx, x + 7, y + 1 + (frame % 2), 3, 2, 0);
      break;
    case 'pintada':
      // pared rupestre de las Cuevas Pintadas de Galdar (triangulos y dameros aborigenes)
      F(ctx, x, y, 16, 16, 3);
      F(ctx, x + 1, y + 1, 14, 12, 2);
      // Triangulos geometricos pintados en almagre y cal
      F(ctx, x + 2, y + 9, 5, 3, 0); F(ctx, x + 3, y + 6, 3, 3, 0); F(ctx, x + 4, y + 4, 1, 2, 0);
      F(ctx, x + 9, y + 4, 5, 3, 0); F(ctx, x + 10, y + 7, 3, 3, 0); F(ctx, x + 11, y + 10, 1, 2, 0);
      F(ctx, x, y + 13, 16, 1, 1);
      break;
    case 'gtable':
      // mesa de guachinche con mantel de papel y fuente humeante de carne fiesta!
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x + 1, y + 3, 14, 9, 3);
      F(ctx, x + 2, y + 4, 12, 7, 0); // mantel de papel blanco
      // fuente de carne fiesta + cuarta de vino
      F(ctx, x + 3, y + 5, 6, 4, 3); F(ctx, x + 4, y + 6, 4, 2, 2);
      F(ctx, x + 11, y + 5, 2, 4, 3); F(ctx, x + 11, y + 6, 2, 2, 1);
      // patas de la mesa
      F(ctx, x + 2, y + 12, 2, 4, 3); F(ctx, x + 12, y + 12, 2, 4, 3);
      break;
    case 'kdoor':
      // umbral de la cocina (el porton con 2 cerrojos se dibuja encima si sigue cerrado)
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x, y + 7, 16, 2, 1);
      break;
    case 'deck':
      // cubierta entarimada del S.S. Olsen
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x, y + 3, 16, 1, 1); F(ctx, x, y + 7, 16, 1, 1);
      F(ctx, x, y + 11, 16, 1, 1); F(ctx, x, y + 15, 16, 1, 1);
      F(ctx, x + 6, y, 1, 4, 1); F(ctx, x + 13, y + 8, 1, 4, 1);
      break;
    case 'porthole':
      // mamparo metalico del S.S. Olsen con ojo de buey redondo
      F(ctx, x, y, 16, 16, 2);
      F(ctx, x, y + 14, 16, 2, 3);
      F(ctx, x + 4, y + 3, 8, 8, 3);
      F(ctx, x + 5, y + 4, 6, 6, 0);
      F(ctx, x + 5, y + 7, 6, 3, 1);
      break;
    case 'bucket':
      // papelera / cubo de mareo del Capitan del S.S. Olsen
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x + 4, y + 5, 8, 9, 3);
      F(ctx, x + 5, y + 6, 6, 7, 1);
      F(ctx, x + 5, y + 6, 6, 2, 2);
      break;
    case 'bridge':
      // puente de hormigon con barandillas arriba y abajo
      F(ctx, x, y, 16, 16, 1);
      for (let i = 0; i < 16; i += 4) F(ctx, x + i, y + 2, 1, 12, 2);
      F(ctx, x, y, 16, 2, 3); F(ctx, x, y + 14, 16, 2, 3);
      break;
    case 'tf5':
      // autovia TF-5: asfalto, linea discontinua y coche atascado
      F(ctx, x, y, 16, 16, 2);
      F(ctx, x, y + 2, 16, 1, 3); F(ctx, x, y + 12, 16, 1, 3);
      F(ctx, x + 3, y + 7, 5, 1, 0); F(ctx, x + 11, y + 7, 5, 1, 0);
      F(ctx, x + 4, y + 4, 8, 5, 3); F(ctx, x + 5, y + 5, 6, 3, 1);
      F(ctx, x + 5, y + 9, 2, 2, 3); F(ctx, x + 9, y + 9, 2, 2, 3);
      break;
    case 'ravine':
      // barranco: fondo oscuro con ondas de roca
      F(ctx, x, y, 16, 16, 3);
      F(ctx, x + 2 + (frame % 2) * 2, y + 4, 8, 1, 2);
      F(ctx, x + 4, y + 10, 8, 1, 2);
      break;
    case 'rail':
      // forja del descansillo
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x, y + 2, 16, 2, 3); F(ctx, x, y + 13, 16, 2, 3);
      F(ctx, x + 3, y, 2, 16, 3); F(ctx, x + 8, y, 2, 16, 3); F(ctx, x + 13, y, 2, 16, 3);
      break;
    case 'landing':
      // suelo del descansillo con alfombrilla
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x, y + 9, 16, 1, 1); F(ctx, x + 2, y + 10, 12, 6, 2); F(ctx, x + 3, y + 11, 10, 4, 1);
      break;
    case 'mat':
      F(ctx, x, y, 16, 16, 0); F(ctx, x + 2, y + 3, 12, 10, 2); F(ctx, x + 3, y + 4, 10, 8, 1);
      break;
    case 'road':
      F(ctx, x, y, 16, 16, 2); F(ctx, x + 4, y + 7, 8, 2, 1);
      break;
    case 'dirt':
      // pista de tierra batida con roderas (Cueva del Llano): anda y circula el 4x4
      F(ctx, x, y, 16, 16, 1);
      F(ctx, x + 2, y, 2, 16, 2); F(ctx, x + 12, y, 2, 16, 2);
      F(ctx, x + 5, y + 3, 2, 2, 0); F(ctx, x + 9, y + 9, 2, 2, 0); F(ctx, x + 6, y + 13, 1, 1, 0);
      break;
    case 'sidewalk':
      F(ctx, x, y, 16, 16, 0); F(ctx, x, y + 15, 16, 1, 1); F(ctx, x + 15, y, 1, 16, 1);
      break;
    case 'tram':
      F(ctx, x, y, 16, 16, 2);
      F(ctx, x, y + 2, 16, 12, 3); F(ctx, x + 1, y + 3, 14, 10, 0);
      F(ctx, x + 2, y + 4, 4, 4, 1); F(ctx, x + 10, y + 4, 4, 4, 1); F(ctx, x + 1, y + 9, 14, 1, 3);
      F(ctx, x + 2, y + 14, 3, 2, 3); F(ctx, x + 11, y + 14, 3, 2, 3);
      break;
    case 'sign':
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x + 7, y + 7, 2, 9, 3); F(ctx, x + 2, y + 2, 12, 6, 3); F(ctx, x + 3, y + 3, 10, 4, 1);
      F(ctx, x + 4, y + 4, 2, 2, 3); F(ctx, x + 7, y + 4, 2, 2, 3); F(ctx, x + 10, y + 4, 2, 2, 3);
      break;
    case 'slot':
      // Tragaperras / caja fast-fashion del C.C. Meridiano con 3 rodillos y luces parpadeantes
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x + 1, y + 1, 14, 14, 3);
      F(ctx, x + 2, y + 2, 12, 3, frame % 2 === 0 ? 0 : 1); // letrero REBAJAS -70%
      F(ctx, x + 2, y + 6, 3, 4, 0); F(ctx, x + 6, y + 6, 4, 4, 0); F(ctx, x + 11, y + 6, 3, 4, 0);
      F(ctx, x + 3, y + 7, 1, 2, 3); F(ctx, x + 7, y + 7, 2, 2, 2); F(ctx, x + 12, y + 7, 1, 2, 3);
      F(ctx, x + 3, y + 11, 10, 3, 2); F(ctx, x + 6, y + 12, 4, 1, 0);
      break;
    case 'poster':
      // Pared de Bershka con cartel de descuento ligeramente torcido
      F(ctx, x, y, 16, 16, 2);
      F(ctx, x, y + 14, 16, 2, 3);
      F(ctx, x + 2, y + 2, 12, 11, 3);
      F(ctx, x + 3, y + 3, 10, 9, 0);
      F(ctx, x + 4, y + 4, 8, 2, 3); // banda BERSHKA
      F(ctx, x + 5, y + 7, 6, 2, 2); // -70%
      F(ctx, x + 11, y + 10, 2, 2, 3); // esquina levantada sospechosa!
      break;
    case 'escalator': {
      // Escaleras mecanicas metalicas con peldanos en movimiento
      F(ctx, x, y, 16, 16, 3);
      F(ctx, x + 2, y, 12, 16, 1);
      const shift = frame % 4;
      for (let sy = shift; sy < 16; sy += 4) {
        F(ctx, x + 2, y + sy, 12, 1, 3);
        F(ctx, x + 3, y + Math.min(15, sy + 1), 10, 1, 0);
      }
      F(ctx, x + 1, y, 1, 16, 0); F(ctx, x + 14, y, 1, 16, 0); // pasamanos
      break;
    }
    case 'copier':
      // Maquina fotocopiadora industrial del despacho del Coco
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x + 1, y + 3, 14, 12, 3);
      F(ctx, x + 2, y + 4, 12, 10, 1);
      F(ctx, x + 2, y + 2, 12, 2, 3); // tapa del escaner
      F(ctx, x + 3, y + 5, 10, 2, frame % 2 === 0 ? 0 : 2); // haz verde de fotocopia
      F(ctx, x + 4, y + 9, 8, 2, 3); F(ctx, x + 4, y + 12, 8, 1, 3);
      break;
    case 'arid':
      // Malpais y jable seco del sur (Arico, Abades, El Medano): tierra clara con tosca y tabaibilla
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x + 2, y + 3, 3, 1, 1); F(ctx, x + 10, y + 6, 4, 1, 1);
      F(ctx, x + 5, y + 12, 4, 1, 1); F(ctx, x + 12, y + 13, 2, 2, 2);
      F(ctx, x + 3, y + 8, 2, 2, 2);
      break;
    case 'guardrail':
      // Bionda metalica quitamiedos de la autopista TF-1 con catadioptrico
      F(ctx, x, y, 16, 16, 1);
      F(ctx, x, y + 5, 16, 6, 3);
      F(ctx, x, y + 6, 16, 2, 0);
      F(ctx, x, y + 9, 16, 1, 0);
      F(ctx, x + 3, y + 11, 2, 4, 3); F(ctx, x + 11, y + 11, 2, 4, 3);
      F(ctx, x + 7, y + 7, 2, 2, 2); // reflectante
      break;
    case 'radar': {
      // Senal y cabina de radar DGT (El Sauzal): disco de limite, camara y flash
      F(ctx, x, y, 16, 16, 1);
      F(ctx, x + 7, y + 11, 2, 5, 3); // poste metalico
      F(ctx, x + 2, y + 1, 12, 10, 3); // marco de la senal/cabina
      F(ctx, x + 3, y + 2, 10, 8, 0);  // fondo reflectante blanco
      F(ctx, x + 3, y + 2, 10, 2, 2);  // banda superior CONTROL VELOCIDAD
      F(ctx, x + 5, y + 5, 6, 4, 3);   // objetivo de la camara de radar
      F(ctx, x + 7, y + 6, 2, 2, 0);   // lente central
      // Destello del flash infrarrojo alternando
      const flash = (frame + ((x + y) >> 4)) % 4 === 0;
      F(ctx, x + 11, y + 5, 2, 2, flash ? 0 : 3);
      if (flash) { F(ctx, x + 11, y + 4, 2, 1, 0); F(ctx, x + 4, y + 5, 1, 2, 2); }
      break;
    }
    case 'turbine': {
      // Aerogenerador eolico de Abades / Arico girando con el alisio del sur
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x + 4, y + 14, 8, 2, 3); // base de hormigon
      F(ctx, x + 7, y + 6, 2, 8, 3);  // torre
      F(ctx, x + 7, y + 7, 1, 7, 0);
      F(ctx, x + 6, y + 5, 4, 3, 3);  // gondola
      F(ctx, x + 7, y + 6, 2, 1, 0);
      // 3 aspas animadas en 2 fases (+ y x)
      if (frame % 2 === 0) {
        F(ctx, x + 7, y, 2, 5, 3); F(ctx, x + 7, y + 1, 1, 4, 0);
        F(ctx, x + 2, y + 8, 4, 2, 3); F(ctx, x + 10, y + 8, 4, 2, 3);
      } else {
        F(ctx, x + 3, y + 1, 3, 3, 3); F(ctx, x + 5, y + 3, 2, 2, 3);
        F(ctx, x + 10, y + 1, 3, 3, 3); F(ctx, x + 9, y + 3, 2, 2, 3);
        F(ctx, x + 7, y + 8, 2, 4, 3);
      }
      break;
    }
    case 'redrock':
      // Risco volcanico rojizo-oscuro de Montana Roja (El Medano)
      F(ctx, x, y, 16, 16, 2);
      F(ctx, x, y + 12, 16, 4, 3);
      F(ctx, x + 2, y + 3, 5, 2, 3); F(ctx, x + 9, y + 7, 5, 2, 3);
      F(ctx, x + 4, y + 1, 4, 1, 1); F(ctx, x + 10, y + 4, 3, 1, 1);
      break;
    case 'runway':
      // Pista de aterrizaje del Aeropuerto Tenerife Sur con linea central y balizas
      F(ctx, x, y, 16, 16, 3);
      F(ctx, x, y + 2, 16, 12, 2);
      F(ctx, x + 3, y + 7, 10, 2, 0);
      F(ctx, x + 7, y + 1, 2, 1, frame % 2 === 0 ? 0 : 2);
      F(ctx, x + 7, y + 14, 2, 1, frame % 2 === 1 ? 0 : 2);
      break;
    case 'board':
      // Panel electronico de vuelos Binter (NT) en la terminal TFS
      F(ctx, x, y, 16, 16, 1);
      F(ctx, x + 1, y + 2, 14, 11, 3);
      F(ctx, x + 2, y + 4, 8, 1, 0); F(ctx, x + 12, y + 4, 2, 1, frame % 2 === 0 ? 0 : 1);
      F(ctx, x + 2, y + 7, 7, 1, 0); F(ctx, x + 12, y + 7, 2, 1, 0);
      F(ctx, x + 2, y + 10, 9, 1, 1); F(ctx, x + 12, y + 10, 2, 1, 0);
      F(ctx, x, y + 14, 16, 2, 3);
      break;
    case 'waterslide':
      // Tobogan gigante de Siam Park (Torre del Poder / Dragon): canalon curvo amarillo y azul con agua
      F(ctx, x, y, 16, 16, 0);
      F(ctx, x + 1, y, 14, 16, 3);
      F(ctx, x + 2, y + 1, 12, 14, 1);
      F(ctx, x + 4, y + 2, 8, 12, 0); // agua corriendo
      F(ctx, x + 6, y + (frame % 4) * 3, 4, 3, 2); // espuma
      break;
    case 'tube':
      // Tunel acrilico transparente sumergido entre tiburones
      F(ctx, x, y, 16, 16, 2);
      F(ctx, x + 2, y + 2, 12, 12, 0);
      F(ctx, x + 4, y + 4, 8, 8, 1);
      F(ctx, x + 1, y + 7, 14, 2, 3);
      break;
    case 'wavepool':
      // Piscina de olas gigantes de Siam Park (The Wave Palace)
      F(ctx, x, y, 16, 16, 2);
      F(ctx, x, y + (frame % 2) * 2, 16, 4, 0); // cresta de ola de 3 metros
      F(ctx, x, y + 6, 16, 2, 1);
      F(ctx, x, y + 12, 16, 3, 3);
      break;
    case 'temple':
      // Fachada thai ornamental dorada de Siam Park con tejados en punta
      F(ctx, x, y, 16, 16, 3);
      F(ctx, x + 7, y, 2, 4, 0); // punta de pagoda
      F(ctx, x + 3, y + 4, 10, 3, 0); // alero curvado
      F(ctx, x + 1, y + 7, 14, 2, 1);
      F(ctx, x + 3, y + 9, 10, 7, 2);
      F(ctx, x + 6, y + 11, 4, 5, 0); // entrada
      break;
  }
}
