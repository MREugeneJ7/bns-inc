import { TileId } from './sprites';
import { NEW_MAPS } from './mapsRuta';
import { TF1_MAPS } from './mapsTf1';
import { NIGHT_MAPS } from './nightRoute';
import { ROSARIO_MAPS, type RosarioMap } from './mapsRosario';
import { GOMERA_MAPS, SAN_BORONDON } from './mapsGomera';
import { TF5_MAP } from './mapsTf5';
import { SANTA_URSULA_MAPS, URSULA_DOORS } from './mapsSantaUrsula';
import { MONTANA_BLANCA_MAP, REFUGIO_DOORS } from './mapsMontanaBlanca';
import { SENDERO_TELESFORO_MAP } from './mapsSenderoTelesforo';
import { CUEVA_MAGEC_MAP } from './mapsCuevaMagec';
import { CABLE_CLUB_MAP, CABLE_STAIRS_1F } from './mapsCableClub';
import { STORY } from './story';
import type { Dir } from './input';

export type MapId =
  | RosarioMap
  | 'apartment' | 'rellano' | 'calle' | 'hospital'
  | 'subida' | 'anaga' | 'galdar' | 'ss_olsen' | 'cuevas_pintadas'
  | 'parrandero' | 'colegio'
  | 'carretera_noche' | 'san_andres' | 'santacruz_sur' | 'meridiano' | 'guarida_enriscada'
  | 'torre_teresitas_1' | 'torre_teresitas_2' | 'torre_teresitas_3' | 'torre_teresitas_4' | 'torre_teresitas_5'
  | 'tf1' | 'tf5' | 'aeropuerto' | 'las_americas' | 'siam_park' | 'puente_magma' | 'veronicas' | 'papagayos' | 'san_borondon'
  | 'san_sebastian' | 'certificador_gomera' | 'mansion_curbelo' | 'guachinche_curbelo'
  | 'santa_ursula' | 'el_diablito' | 'montana_blanca' | 'sendero_telesforo' | 'cueva_magec' | 'parrandero_2';
export type StarterId = 'cabra' | 'angelote' | 'pinzon';
export type StopId = 'weyler' | 'candelaria';
export type ParranderoId =
  | 'weyler' | 'candelaria' | 'cuesta' | 'ull' | 'sanbenito'
  | 'taganana' | 'galdar' | 'muelle' | 'aeropuerto' | 'troya' | 'rosario' | 'gomera' | 'santa_ursula' | 'refugio';
export type SchoolId = 'sc' | 'cuesta' | 'sanbenito' | 'taganana' | 'galdar' | 'rosario' | 'gomera' | 'santa_ursula' | 'refugio';

export interface ParranderoDef {
  id: ParranderoId;
  name: string;
  zona: string;
  outside: { mapId: MapId; x: number; y: number; dir: Dir };
}

export const PARRANDEROS: Record<ParranderoId, ParranderoDef> = {
  weyler: {
    id: 'weyler',
    name: 'CENTRO PARRANDERO EL CHICHARRO',
    zona: 'Santa Cruz · Weyler',
    outside: { mapId: 'calle', x: 66, y: 4, dir: 'down' },
  },
  candelaria: {
    id: 'candelaria',
    name: 'CENTRO PARRANDERO LOS MAJOS',
    zona: 'La Candelaria',
    outside: { mapId: 'calle', x: 30, y: 4, dir: 'down' },
  },
  cuesta: {
    id: 'cuesta',
    name: 'CENTRO PARRANDERO EL BARRANCO',
    zona: 'La Cuesta',
    outside: { mapId: 'subida', x: 14, y: 47, dir: 'down' },
  },
  ull: {
    id: 'ull',
    name: 'CENTRO PARRANDERO GUAJARA',
    zona: 'Cruz de Piedra · ULL',
    outside: { mapId: 'subida', x: 22, y: 15, dir: 'down' },
  },
  sanbenito: {
    id: 'sanbenito',
    name: 'CENTRO PARRANDERO SAN BENITO',
    zona: 'San Benito · La Laguna',
    outside: { mapId: 'anaga', x: 6, y: 57, dir: 'down' },
  },
  taganana: {
    id: 'taganana',
    name: 'CENTRO PARRANDERO EL ROQUE',
    zona: 'Taganana · Anaga',
    outside: { mapId: 'anaga', x: 38, y: 6, dir: 'down' },
  },
  galdar: {
    id: 'galdar',
    name: 'CENTRO PARRANDERO EL FARO',
    zona: 'Muelle de Galdar · G.C.',
    outside: { mapId: 'galdar', x: 7, y: 45, dir: 'down' },
  },
  muelle: {
    id: 'muelle',
    name: 'CENTRO PARRANDERO EL MUELLE',
    zona: 'Av. Anaga · Santa Cruz',
    outside: { mapId: 'santacruz_sur', x: 56, y: 7, dir: 'down' },
  },
  troya: { id: 'troya', name: 'CENTRO PARRANDERO DE TROYA', zona: 'Monkey Beach · Adeje', outside: { mapId: 'veronicas', x: 35, y: 17, dir: 'down' } },
  rosario: { id: 'rosario', name: 'CENTRO PARRANDERO LA ESPERANZA', zona: 'El Rosario', outside: { mapId: 'el_rosario', x: 5, y: 8, dir: 'down' } },
  gomera: { id: 'gomera', name: 'CENTRO PARRANDERO DE LA GOMERA', zona: 'San Sebastián de La Gomera', outside: { mapId: 'san_sebastian', x: 6, y: 11, dir: 'down' } },
  santa_ursula: { id: 'santa_ursula', name: 'CENTRO PARRANDERO DE SANTA ÚRSULA', zona: 'Santa Úrsula · Carretera General', outside: { mapId: 'santa_ursula', x: URSULA_DOORS.center.x, y: URSULA_DOORS.center.y + 1, dir: 'down' } },
  refugio: { id: 'refugio', name: 'CENTRO PARRANDERO DEL REFUGIO', zona: 'Montaña Blanca · cima', outside: { mapId: 'montana_blanca', x: REFUGIO_DOORS.center.x, y: REFUGIO_DOORS.center.y + 1, dir: 'down' } },
  aeropuerto: {
    id: 'aeropuerto',
    name: 'CENTRO PARRANDERO LA REINA',
    zona: 'Aeropuerto Tenerife Sur (TFS)',
    outside: { mapId: 'tf1', x: 28, y: 6, dir: 'down' },
  },
};

export interface SchoolDef {
  id: SchoolId;
  name: string;
  level: string;
  outside: { mapId: MapId; x: number; y: number; dir: Dir };
  kids: [string, string];
  conserje: string[];
}

export const SCHOOLS: Record<SchoolId, SchoolDef> = {
  sc: {
    id: 'sc',
    name: 'CEIP WEYLER · PATIO NV.1',
    level: 'NV.1',
    outside: { mapId: 'calle', x: 50, y: 4, dir: 'down' },
    kids: ['cole1_a', 'cole1_b'],
    conserje: [
      'CONSERJE: (bostezando) Eh? Tu eres el auxiliar de conversacion guiri? Pasa pal patio, anda.',
      'CONSERJE: Los chinijos del recreo juegan SIEMPRE que quieras. Nivel bajito, ideal si te quedas pelao.',
    ],
  },
  cuesta: {
    id: 'cuesta',
    name: 'CEIP LA CUESTA · PATIO NV.2',
    level: 'NV.2',
    outside: { mapId: 'subida', x: 8, y: 47, dir: 'down' },
    kids: ['cole2_a', 'cole2_b'],
    conserje: [
      'CONSERJE: (leyendo el periodico) Cierra la verja al salir, que se cuela corriente.',
      'CONSERJE: Aqui los de quinto y sexto echan partidas repetibles a 8 duros y sobre.',
    ],
  },
  sanbenito: {
    id: 'sanbenito',
    name: 'IES SAN BENITO · PATIO NV.3',
    level: 'NV.3',
    outside: { mapId: 'anaga', x: 12, y: 57, dir: 'down' },
    kids: ['cole3_a', 'cole3_b'],
    conserje: [
      'CONSERJE: (con termo de barraquito) Ños que pelete hace en San Benito! Pasa si vienes a echar cartas.',
      'CONSERJE: Los pibes de la ESO ya traen cartas evolucionadas. Repetibles a 12 duros y sobre.',
    ],
  },
  taganana: {
    id: 'taganana',
    name: 'ESC. TAGANANA · PATIO NV.4',
    level: 'NV.4',
    outside: { mapId: 'anaga', x: 49, y: 6, dir: 'down' },
    kids: ['cole4_a', 'cole4_b'],
    conserje: [
      'CONSERJE: (oyendo Radio Club) Te colaste por el murete? Tranquilo, aqui nos conocemos todos.',
      'CONSERJE: Los chinijos de Taganana son duros como el risco: 16 duros y sobres sin tope pa prepararte contra Cathaysa!',
    ],
  },
  galdar: {
    id: 'galdar',
    name: 'CEIP GALDAR · PATIO NV.5',
    level: 'NV.5',
    outside: { mapId: 'galdar', x: 33, y: 45, dir: 'down' },
    kids: ['cole5_a', 'cole5_b'],
    conserje: [
      'CONSERJE: Merameneño, pasa pal recreo sin pisar la raya! Aqui los chiquillos desayunan bocata de Teror.',
      'CONSERJE: Duelos repetibles a 20 duros y sobre completo pa armarte antes de entrar a las Cuevas Pintadas!',
    ],
  },
  rosario: {
    id: 'rosario',
    name: 'CEIP EL ROSARIO · PATIO NV.6',
    level: 'NV.6',
    outside: { mapId: 'el_rosario', x: 32, y: 8, dir: 'down' },
    kids: ['cole6_a', 'cole6_b'],
    conserje: [
      'CONSERJE: Pasa, pasa. Con este frío del Rosario los chinijos no sueltan las cartas ni en el recreo.',
      'CONSERJE: Repetibles a 24 duros y sobre. Y no te acerques al terrero con hambre, que allí no regalan nada.',
    ],
  },
  refugio: {
    id: 'refugio', name: 'COLEGIO DEL REFUGIO · PATIO NV.9', level: 'NV.9',
    outside: { mapId: 'montana_blanca', x: REFUGIO_DOORS.school.x, y: REFUGIO_DOORS.school.y + 1, dir: 'down' },
    kids: ['cole9_a', 'cole9_b'],
    conserje: [
      'CONSERJE: ¿En serio subiste hasta aquí? Pues pasa al recreo más alto de Tenerife. Dos duros por partida y sobre.',
      'CONSERJE: Los alemanes de la ladera bajan cuando oyen barajar. No les ganes demasiado rápido.',
    ],
  },
  gomera: {
    id: 'gomera', name: 'CEIP SAN SEBASTIÁN · PATIO NV.7', level: 'NV.7',
    outside: { mapId: 'san_sebastian', x: 40, y: 11, dir: 'down' },
    kids: ['cole7_a', 'cole7_b'],
    conserje: [
      'CASIMIRO CURBELO: Bienvenido al colegio. ¿Sabías que Colón estuvo en La Gomera?',
      'CASIMIRO CURBELO: Los niños juegan por 28 duros y sobre. Colón también habría disfrutado el recreo.',
    ],
  },
  santa_ursula: {
    id: 'santa_ursula', name: 'CEIP SANTA ÚRSULA · PATIO NV.8', level: 'NV.8',
    outside: { mapId: 'santa_ursula', x: URSULA_DOORS.school.x, y: URSULA_DOORS.school.y + 1, dir: 'down' },
    kids: ['cole8_a', 'cole8_b'],
    conserje: [
      'CONSERJE: Pasa al recreo, mi niño. Los chinijos de Santa Úrsula juegan por 32 duros y sobre todas las veces que quieras.',
      'CONSERJE: ¿El Diablito? Sigue la general al suroeste. Llevaba cerrado una eternidad, pero hoy se oye cantar desde la cocina.',
    ],
  },
};

/** Calcula el Centro Parrandero geograficamente mas cercano al punto donde te fundieron. */
export function nearestParrandero(
  mapId: MapId,
  x: number,
  y: number,
  fallback: ParranderoId = 'weyler',
  lastSchool: SchoolId = 'sc',
): ParranderoId {
  if (mapId === 'parrandero' || mapId === 'parrandero_2') return fallback;
  if (mapId === 'colegio') {
    const out = SCHOOLS[lastSchool]?.outside ?? SCHOOLS.sc.outside;
    return nearestParrandero(out.mapId, out.x, out.y, fallback, lastSchool);
  }
  if (mapId === 'galdar' || mapId === 'ss_olsen' || mapId === 'cuevas_pintadas') return 'galdar';
  if (mapId === 'san_sebastian' || mapId === 'certificador_gomera' || mapId === 'mansion_curbelo' || mapId === 'guachinche_curbelo') return 'gomera';
  if (mapId === 'veronicas' || mapId === 'papagayos' || mapId === 'san_borondon') return 'troya';
  if (mapId === 'puente_magma') return 'aeropuerto';
  if (mapId === 'aeropuerto' || mapId === 'las_americas' || mapId === 'siam_park') return 'aeropuerto';
  if (mapId === 'tf1') return x <= 85 ? 'aeropuerto' : 'muelle';
  if (mapId === 'montana_blanca' || mapId === 'sendero_telesforo') return 'refugio';
  if (mapId === 'cueva_magec') return 'sanbenito';
  if (mapId === 'santa_ursula' || mapId === 'el_diablito') return 'santa_ursula';
  if (mapId === 'tf5') return x <= 36 ? 'santa_ursula' : x >= 110 && y >= 82 ? 'candelaria' : 'ull';
  if (mapId.startsWith('eci_') || mapId === 'barranco_hondo') return 'muelle';
  if (mapId.startsWith('magos_') || mapId === 'guachinche_rosario') return 'rosario';
  if (mapId === 'acceso_taco') return 'candelaria';
  if (mapId === 'el_rosario') return 'rosario';
  if (
    mapId === 'santacruz_sur' || mapId === 'meridiano' || mapId === 'guarida_enriscada' ||
    mapId === 'san_andres' || mapId.startsWith('torre_teresitas_')
  ) return 'muelle';
  if (mapId === 'carretera_noche') return 'taganana';
  if (mapId === 'hospital') return 'candelaria';
  if (mapId === 'apartment' || mapId === 'rellano') return 'weyler';
  if (mapId === 'calle') return x < 48 ? 'candelaria' : 'weyler';
  if (mapId === 'anaga') return y <= 24 ? 'taganana' : 'sanbenito';
  const dWeyler = Math.abs(y - 97);
  const dCuesta = Math.abs(y - 46);
  const dUll = Math.abs(y - 14);
  if (dUll <= dCuesta && dUll <= dWeyler) return 'ull';
  if (dCuesta <= dWeyler) return 'cuesta';
  return 'weyler';
}

export const STOPS: Record<StopId, { x: number; name: string }> = {
  weyler: { x: 58, name: 'PLAZA WEYLER' },
  candelaria: { x: 40, name: 'HOSPITAL LA CANDELARIA' },
};

// Guachinche-Truck en "subida" (5x3 tiles: x=22..26, y=4..6)
export const TRUCK_POS = { x: 22, y: 4, w: 5, h: 3 };
// Cayuco de chapas en Benijo, mapa "anaga" (2x1 tiles: x=72..73, y=3)
export const CAYUCO_POS = { x: 72, y: 3, w: 2, h: 1 };
// Cayuco de Carmelo amarrado en el muelle de Galdar (2x1 tiles: x=12..13, y=52)
export const GALDAR_CAYUCO_POS = { x: 12, y: 52, w: 2, h: 1 };
// Fast-ferry S.S. Olsen en el muelle de Galdar (6x3 tiles: x=25..30, y=50..52; pasarela en x=27, y=50)
export const OLSEN_POS = { x: 25, y: 50, w: 6, h: 3, gangwayX: 27, gangwayY: 50 };

// Coordenadas de las 15 mesas (5x3) del minijuego electrico de carne fiesta en "cuevas_pintadas"
export const CUEVA_COLS = [4, 7, 10, 13, 16];
export const CUEVA_ROWS = [9, 12, 15];
export const CUEVA_DOOR = { x: 9, y: 6, w: 2 };

export function cuevaTableIndex(x: number, y: number): number {
  const c = CUEVA_COLS.indexOf(x);
  const r = CUEVA_ROWS.indexOf(y);
  return c === -1 || r === -1 ? -1 : r * CUEVA_COLS.length + c;
}

export function adjacentCuevaTables(idx: number): number[] {
  const cols = CUEVA_COLS.length;
  const rows = CUEVA_ROWS.length;
  const c = idx % cols;
  const r = Math.floor(idx / cols);
  const out: number[] = [];
  if (c > 0) out.push(r * cols + (c - 1));
  if (c < cols - 1) out.push(r * cols + (c + 1));
  if (r > 0) out.push((r - 1) * cols + c);
  if (r < rows - 1) out.push((r + 1) * cols + c);
  return out;
}

export interface NPC {
  id: string;
  sprite: string;
  x: number;
  y: number;
  hidden?: boolean;
  afterFlag?: { key: string; x: number; y: number };
  /** Si es un entrenador con exclamacion: id en TRAINERS. */
  trainer?: string;
  /** Niños del patio de colegio (0 o 1, resueltos segun SCHOOLS[save.lastSchool]). */
  schoolKid?: 0 | 1;
}

export type Action =
  | { type: 'text'; lines: string[] }
  | { type: 'once'; key: string; lines: string[] }
  | { type: 'zone'; name: string }
  | { type: 'warp'; to: MapId; x: number; y: number; dir: Dir }
  | { type: 'enterParrandero'; id: ParranderoId }
  | { type: 'exitParrandero' }
  | { type: 'enterSchool'; id: SchoolId }
  | { type: 'exitSchool' }
  | { type: 'openPC' }
  | { type: 'enterSubida' }
  | { type: 'enterAnaga' }
  | { type: 'gym2Door' }
  | { type: 'boardOlsen' }
  | { type: 'enterCuevas' }
  | { type: 'galdarBench' }
  | { type: 'tramBoard'; from: StopId; to: StopId }
  | { type: 'vehicleWarp'; to: MapId; x: number; y: number; dir: Dir; blocked: string[] }
  | { type: 'gate'; key: string; lines: string[]; back: { x: number; y: number; dir: Dir } }
  | { type: 'giveTodoTerreno' }
  | { type: 'exitOlsen' }
  | { type: 'cemeterySign' }
  | { type: 'enterMeridiano' }
  | { type: 'bershkaPoster' }
  | { type: 'bershkaEscalator' }
  | { type: 'fastFashionSlot'; brand: string; bet: number }
  | { type: 'meridianoPrizes' }
  | { type: 'enterTeresitasTower' }
  | { type: 'towerStairs'; requiredTrainer: string; to: MapId; x: number; y: number }
  | { type: 'towerReturn'; to: MapId; x: number; y: number }
  | { type: 'tf1Sign' }
  | { type: 'enterTf1' }
  | { type: 'enterTf5' }
  | { type: 'enterTf5Underpass'; from: 'south' | 'north' }
  | { type: 'laQuintaChill' }
  | { type: 'orotavaCutscene'; from: 'town' | 'motorway' }
  | { type: 'orotavaReturn' }
  | { type: 'pickupNarices' }
  | { type: 'sauzalFlash' }
  | { type: 'diablitoAroma' }
  | { type: 'enterDiablito' }
  | { type: 'enterAeropuerto' }
  | { type: 'highwayChallenge'; trainer: string }
  | { type: 'romeriaBlockade' }
  | { type: 'coastStop'; key: string; name: string }
  | { type: 'pickupCremaFP50' }
  | { type: 'pickupUnelco' }
  | { type: 'landBorondon' }
  | { type: 'sailFromBorondon' }
  | { type: 'pickupNevada' }
  | { type: 'pickupCurbeloKey' }
  | { type: 'enterCurbeloGym' }
  | { type: 'storeLift' }
  | { type: 'gourmetShop' }
  | { type: 'magosDoor' }
  | { type: 'pickupMagosKey'; key: 1 | 2 }
  | { type: 'claimGhostGear' }
  | { type: 'wavePoolPukas' }
  | { type: 'siamGuiriDave' }
  | { type: 'takeOutCar' }
  | { type: 'cableStairs' }
  | { type: 'cableClub'; room: 'trade' | 'battle' }
  | { type: 'starter'; id: StarterId };

export interface Trigger {
  x: number;
  y: number;
  kind: 'step' | 'interact';
  action: Action;
}

export interface GameMap {
  id: MapId;
  name: string;
  rows: string[];
  legend: Record<string, TileId>;
  npcs: NPC[];
  triggers: Trigger[];
  onEnter?: string[];
  /** Noche cerrada: oscuridad con un haz de faros alrededor del jugador. */
  night?: boolean;
}

const INTERIOR: Record<string, TileId> = { '#': 'wall', '.': 'floor', W: 'window', D: 'door', P: 'plant' };

// ------------------------------------------------------------------
// CALLE (84x12) ESPEJADA: ESTE (x=81..83) = DÁRSENA DEL PUERTO, OESTE = TACO
// ------------------------------------------------------------------
function buildCalle(): string[] {
  const CW = 84, CH = 12;
  const g: string[][] = Array.from({ length: CH }, () => Array<string>(CW).fill('s'));
  const put = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = c;
  };
  put(0, 0, CW - 1, 3, 'B');
  for (let x = 4; x < 79; x += 6) g[1][x] = 'W';
  put(0, 5, 79, 6, 't');
  put(0, 7, 79, 8, 's');
  put(0, 9, 79, 10, 'R');
  // Acera sur: manzanas de Santa Cruz. Weyler, Candelaria y Taco están tierra adentro;
  // el único mar de la calle es la dársena del puerto, al ESTE (x=81..83).
  put(0, 11, 80, 11, 'B');
  for (let x = 7; x < 79; x += 6) if (x < 22 || x > 25) g[11][x] = 'W';

  put(80, 0, 80, 10, 'L');
  put(79, 4, 79, 8, 's');
  put(81, 0, 83, 11, '~');
  put(0, 0, 1, 10, 'B');

  put(55, 0, 57, 4, 'Z');
  g[4][54] = 'T';

  put(22, 0, 25, 3, 'F');
  put(22, 9, 25, 11, 'F');
  put(22, 4, 25, 8, 'b');

  g[3][76] = 'D';
  g[2][66] = 'H'; g[3][66] = 'D'; g[4][67] = 'T';
  g[2][50] = 'J'; g[3][50] = 'D'; g[4][51] = 'T';
  g[3][36] = 'D';
  g[2][30] = 'H'; g[3][30] = 'D'; g[4][29] = 'T';
  g[3][9] = 'D';
  // La calzada sigue al OESTE, mas alla del bazar, hacia El Rosario.
  put(0, 9, 1, 10, 'R'); g[8][2] = 'T';
  g[8][61] = 'T';
  g[8][43] = 'T';

  for (const [x, y] of [[71, 8], [65, 4], [48, 7], [31, 8], [16, 4], [14, 7], [5, 8]]) g[y][x] = 'P';
  return g.map((r) => r.join(''));
}

// ------------------------------------------------------------------
// SUBIDA (34x96): Weyler -> Campus Central ULL -> salida norte a San Benito
// ------------------------------------------------------------------
function buildSubida(): string[] {
  const SW = 34, SH = 96;
  const g: string[][] = Array.from({ length: SH }, () => Array<string>(SW).fill('B'));
  const put = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    for (let y = Math.max(0, y0); y <= Math.min(SH - 1, y1); y++) {
      for (let x = Math.max(0, x0); x <= Math.min(SW - 1, x1); x++) g[y][x] = c;
    }
  };

  for (let y = 2; y < SH - 1; y += 4) {
    for (let x = 2; x < SW - 2; x += 5) g[y][x] = 'W';
  }

  put(16, 88, 20, 95, 's');
  put(17, 93, 19, 95, 'Z');
  put(17, 90, 19, 90, 'S');
  put(21, 89, 27, 92, 'Z');
  g[89][23] = 'P'; g[89][26] = 'P'; g[91][25] = 'h'; g[90][23] = 'M';
  put(9, 86, 20, 88, 's');
  put(9, 82, 13, 86, 's');
  put(10, 84, 12, 84, 'S');
  g[88][15] = 'P'; g[86][19] = 'h';
  g[92][16] = 'T';

  put(2, 81, 31, 81, 's');
  put(2, 79, 31, 80, 'R');
  put(10, 79, 12, 80, 'X');
  put(2, 74, 31, 78, 'Z');
  for (const x of [3, 6, 9, 14, 20, 26, 29]) { g[74][x] = 'E'; g[78][x] = 'E'; }
  for (const x of [7, 15, 21, 27]) g[76][x] = 'h';
  g[76][18] = 'O';
  g[77][13] = 'T';
  g[75][4] = 'P'; g[77][30] = 'P';
  put(2, 72, 31, 73, 'R');
  put(22, 72, 24, 73, 'X');
  put(2, 70, 31, 71, 's');

  put(2, 54, 31, 69, 'g');
  put(2, 69, 31, 69, 'f');
  put(22, 69, 24, 69, 'p');
  put(2, 54, 31, 54, 'f');
  put(7, 54, 9, 54, 'p');
  for (let y = 55; y <= 68; y++) { g[y][2] = 'E'; g[y][31] = 'E'; }
  put(6, 66, 25, 67, 'p');
  put(6, 55, 8, 67, 'p');
  put(23, 56, 25, 68, 'p');
  put(6, 56, 25, 57, 'p');
  put(13, 60, 20, 63, 'Z');
  put(8, 61, 13, 62, 'p');
  put(20, 61, 23, 62, 'p');
  g[61][15] = 'M'; g[61][18] = 'M'; g[63][14] = 'h'; g[63][19] = 'h';
  for (const [x, y] of [[10, 64], [12, 64], [15, 65], [21, 64], [10, 58], [13, 58], [18, 58], [21, 59], [28, 60], [28, 64], [4, 60], [4, 64]]) {
    g[y][x] = 'E';
  }
  for (const [x, y] of [[11, 59], [27, 57], [27, 66]]) g[y][x] = 'P';
  g[67][21] = 'T';

  put(6, 48, 11, 53, 's');
  put(7, 52, 9, 52, 'S');
  put(6, 47, 27, 49, 's');
  put(16, 37, 17, 50, 'v');
  g[50][16] = 'B'; g[50][17] = 'B';
  put(23, 40, 27, 49, 's');
  put(24, 44, 26, 44, 'S');
  g[45][28] = 'D';
  put(28, 47, 30, 49, 's'); put(28, 50, 30, 50, 'L');
  put(13, 40, 27, 42, 's');
  put(13, 37, 19, 42, 's');
  put(16, 37, 17, 42, 'v');
  g[51][10] = 'T';
  g[45][8] = 'J'; g[46][8] = 'D'; g[47][9] = 'T';
  g[45][14] = 'H'; g[46][14] = 'D'; g[47][15] = 'T';
  g[48][13] = 'h'; g[41][21] = 'P';

  put(13, 25, 19, 36, 's');
  put(16, 25, 17, 36, 'v');
  put(20, 28, 31, 35, 'Z');
  put(21, 26, 30, 27, 'B');
  for (const x of [22, 24, 28, 30]) g[27][x] = 'W';
  g[27][26] = 'D';
  g[31][28] = 'A'; g[31][29] = 'A';
  g[34][22] = 'h'; g[34][29] = 'P'; g[29][31] = 'E'; g[33][31] = 'E';
  g[33][20] = 'T';
  put(6, 30, 12, 34, 'g');
  put(9, 31, 12, 33, 'p');
  g[32][8] = 'h'; g[30][7] = 'E'; g[34][7] = 'P';

  put(7, 15, 25, 24, 's');
  put(11, 17, 21, 22, 'R');
  put(15, 22, 17, 22, 'X');
  put(15, 17, 17, 17, 'X');
  put(11, 19, 11, 20, 'X');
  put(21, 19, 21, 20, 'X');
  put(13, 18, 19, 21, 'g');
  g[18][13] = 'E'; g[18][19] = 'E'; g[21][13] = 'P'; g[21][19] = 'P';
  put(15, 19, 17, 20, 'Z');
  g[19][16] = 'O';
  g[23][12] = 'T';
  g[16][9] = 'h'; g[16][23] = 'h'; g[23][8] = 'E'; g[23][24] = 'E';
  put(14, 14, 18, 14, 'Z');

  put(2, 13, 31, 13, 'f');
  put(14, 13, 18, 13, 'Z');
  put(2, 1, 17, 12, 'g');
  put(4, 1, 15, 3, 'B');
  for (const x of [5, 7, 9, 11, 13, 15]) g[2][x] = 'W';
  g[3][10] = 'D';
  put(8, 4, 12, 4, 'S');
  put(7, 5, 13, 8, 'Z');
  put(9, 8, 18, 12, 'Z');
  for (const [x, y] of [[3, 5], [5, 7], [3, 10], [6, 11], [15, 5]]) g[y][x] = 'E';
  g[6][7] = 'h'; g[6][13] = 'h';
  g[11][13] = 'T';

  put(18, 2, 31, 12, 'R');
  put(20, 2, 30, 3, 'K');
  put(19, 11, 30, 12, 'K');
  for (const [x, y] of [[21, 2], [28, 2], [30, 2], [20, 11], [23, 11], [27, 11], [30, 11]]) g[y][x] = 'C';
  g[8][20] = 'M'; g[8][28] = 'M';
  g[7][21] = 'T';
  for (let y = 1; y <= 12; y++) { g[y][1] = 'E'; g[y][32] = 'E'; }
  put(20, 1, 31, 1, 'f');

  put(17, 0, 19, 7, 'Z');
  g[2][16] = 'T';

  g[13][21] = 'B'; g[13][22] = 'H'; g[13][23] = 'B';
  g[14][22] = 'D'; g[15][21] = 'T';

  return g.map((r) => r.join(''));
}

// ------------------------------------------------------------------
// ANAGA (78x66): San Benito -> Las Mercedes -> TF-12 -> Llano -> Vueltas ->
// Taganana (Pedro + Gym #2 Cathaysa + corte San Andres) -> Almaciga -> Benijo
// ------------------------------------------------------------------
function buildAnaga(): string[] {
  const AW = 78, AH = 66;
  const g: string[][] = Array.from({ length: AH }, () => Array<string>(AW).fill('E'));
  const put = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    for (let y = Math.max(0, y0); y <= Math.min(AH - 1, y1); y++) {
      for (let x = Math.max(0, x0); x <= Math.min(AW - 1, x1); x++) g[y][x] = c;
    }
  };

  put(0, 0, AW - 1, 1, '~');
  put(0, 2, AW - 1, 3, 'u');
  put(0, 3, 35, 5, 'V');
  put(36, 3, 53, 3, 'L');

  // 1. SAN BENITO
  put(3, 54, 16, 64, 'B');
  for (let x = 4; x <= 15; x += 3) { g[55][x] = 'W'; g[63][x] = 'W'; }
  put(8, 61, 10, 65, 'Z');
  put(5, 57, 14, 61, 'Z');
  g[59][6] = 'h'; g[59][13] = 'h'; g[61][6] = 'P'; g[61][13] = 'P';
  g[60][8] = 'O';
  g[55][6] = 'H'; g[56][6] = 'D'; g[57][5] = 'T';
  g[55][12] = 'J'; g[56][12] = 'D'; g[57][13] = 'T';
  put(8, 48, 11, 56, 's');
  put(9, 48, 10, 56, 'R');
  put(9, 55, 10, 55, 'X');
  g[63][8] = 'T';

  // 2. RECTA LAS MERCEDES
  put(8, 47, 38, 47, 'g');
  put(8, 48, 38, 48, 's');
  put(8, 49, 38, 50, 'R');
  put(8, 51, 38, 51, 's');
  put(8, 52, 38, 52, 'g');
  for (const x of [14, 24, 33]) put(x, 49, x, 50, 'X');
  for (let x = 13; x <= 31; x += 4) { g[47][x] = 'E'; g[52][x] = 'P'; }
  g[48][20] = 'h'; g[51][28] = 'h';
  g[48][12] = 'T';

  put(34, 44, 40, 45, 'B');
  g[44][35] = 'W'; g[44][38] = 'W'; g[45][37] = 'D';
  put(33, 46, 41, 52, 'Z');
  g[46][34] = 'P'; g[52][34] = 'h'; g[52][40] = 'P';

  // 3. CARRETERA GENERAL TF-12 (NORESTE)
  for (let i = 0; i <= 14; i++) {
    const cx = 39 + i, cy = 47 - i;
    put(cx - 2, cy - 2, cx + 2, cy + 2, 'g');
  }
  for (let i = 0; i <= 14; i++) {
    const cx = 39 + i, cy = 47 - i;
    put(cx - 1, cy - 1, cx + 2, cy + 1, 'R');
  }
  g[46][38] = 'Q'; // fogon lleno de cenizas donde escarba el Magomaniaco
  g[47][37] = 'T'; // cartel de Las Mercedes
  put(39, 38, 44, 41, 'Z');
  put(38, 38, 38, 41, 'L');
  g[39][40] = 'h'; g[41][41] = 'T';

  // 4. LLANO DE LOS VIEJOS
  put(49, 25, 63, 34, 'g');
  put(51, 32, 61, 33, 'p');
  put(51, 26, 61, 27, 'p');
  put(51, 26, 52, 33, 'p');
  put(60, 26, 61, 33, 'p');
  put(54, 24, 56, 33, 'p');
  g[28][53] = 'Q'; g[28][58] = 'Q';
  g[30][53] = 'M'; g[30][58] = 'M';
  g[33][58] = 'h'; g[26][53] = 'h';
  g[29][50] = 'E'; g[31][62] = 'E'; g[26][62] = 'E';
  g[32][53] = 'T';
  // 4b. BOCA DE LA CUEVA DEL LLANO (este del Llano): barranco + corredor + pared rocosa con puerta.
  // Se llega saltando el barranco con la vara del pastor. Un guardia bloquea la boca salvo al campeón.
  put(64, 27, 64, 31, 'V');       // barranco (vaultable en anaga)
  put(65, 29, 66, 29, 'p');       // corredor de acceso (1 baldosa de ancho)
  put(67, 27, 67, 31, 'B');       // pared rocosa
  g[29][67] = 'D';                // boca de la cueva
  g[28][62] = 'T';                // cartel de la cueva

  // 5. VUELTAS DE TAGANANA
  put(42, 13, 61, 24, 'V');
  for (const x of [44, 48, 52, 56, 60]) { g[21][x] = 'E'; g[18][x] = 'E'; g[15][x] = 'E'; }
  put(54, 23, 56, 24, 'p');
  put(44, 22, 56, 23, 'p');
  put(49, 22, 49, 23, 'S');
  put(44, 19, 45, 23, 'p');
  put(44, 21, 45, 21, 'S');
  put(44, 19, 59, 20, 'p');
  put(53, 19, 53, 20, 'S');
  put(58, 16, 59, 20, 'p');
  put(58, 18, 59, 18, 'S');
  put(45, 16, 59, 17, 'p');
  put(51, 16, 51, 17, 'S');
  put(45, 11, 47, 17, 'p');
  put(45, 14, 47, 14, 'S');
  g[23][53] = 'T';

  // 6. TAGANANA + CORTE SAN ANDRES
  g[1][41] = 'r'; g[1][42] = 'r';
  put(36, 4, 51, 5, 'B');
  for (const x of [37, 40, 42, 46, 48, 51]) g[4][x] = 'W';
  put(36, 6, 52, 11, 'Z');
  g[4][38] = 'H'; g[5][38] = 'D'; g[6][37] = 'T';
  g[4][44] = 'W'; g[5][44] = 'D'; g[6][42] = 'T';
  g[4][49] = 'J'; g[5][49] = 'D'; g[6][50] = 'T';
  g[8][39] = 'P'; g[8][48] = 'h'; g[10][42] = 'M'; g[11][37] = 'P';
  g[11][44] = 'T';
  // Carril de asfalto por el centro de la plaza: por aqui baja el todoterreno
  // desde la carretera de Almaciga/Benijo hasta la TF-134 de San Andres
  put(37, 9, 51, 9, 'R');

  put(31, 9, 36, 11, 'R');
  put(31, 9, 34, 21, 'R');
  g[11][35] = 'T';
  put(31, 18, 34, 21, 'k');
  g[16][31] = 'T';

  // 7. PLAYA DE ALMACIGA (Cathaysa haciendo surf)
  put(52, 8, 66, 10, 'R');
  put(54, 7, 64, 7, 's');
  put(57, 7, 59, 7, 'S');
  put(54, 4, 64, 6, 'n');
  g[1][62] = 'r';
  g[7][55] = 'T';
  g[6][63] = 'P';

  // 8. PLAYA DE BENIJO (Carmelo el cayuquero)
  put(66, 8, 73, 10, 'R');
  put(68, 7, 75, 7, 'L');
  put(70, 7, 71, 7, 'S');
  put(68, 4, 75, 6, 'n');
  g[1][68] = 'r'; g[1][69] = 'r'; g[2][75] = 'r';
  g[8][67] = 'T';

  return g.map((r) => r.join(''));
}

// ------------------------------------------------------------------
// GALDAR (42x54): Muelle + S.S. Olsen (abajo) -> Las Curvas del Demonio ->
// Plaza de Galdar + Puerta de las Cuevas Pintadas (arriba)
// ------------------------------------------------------------------
function buildGaldar(): string[] {
  const GW = 42, GH = 54;
  const g: string[][] = Array.from({ length: GH }, () => Array<string>(GW).fill('V'));
  const put = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    for (let y = Math.max(0, y0); y <= Math.min(GH - 1, y1); y++) {
      for (let x = Math.max(0, x0); x <= Math.min(GW - 1, x1); x++) g[y][x] = c;
    }
  };

  // ===== 1. MUELLE DE GALDAR + ATRAQUE DEL S.S. OLSEN (y = 43..53) =====
  put(0, 50, GW - 1, 51, 'u');
  put(0, 52, GW - 1, 53, '~');
  // Edificios portuarios detras del paseo (y = 42..44)
  put(2, 42, 39, 44, 'B');
  for (let x = 4; x <= 38; x += 5) g[43][x] = 'W';
  // Paseo maritimo del muelle (y = 45..49)
  put(3, 45, 38, 48, 's');
  put(3, 49, 38, 49, 'L'); // barandilla al mar
  // Pantalan OESTE (Cayuco de Carmelo en 12..13, 52)
  put(10, 48, 15, 51, 'Z');
  // Pantalan ESTE (Atraque del S.S. Olsen en 25..30, 50..52; pasarela caminable en 27, 50)
  put(23, 48, 32, 49, 'Z');
  g[50][27] = 'd';
  // C.P. El Faro (x=7, y=44) y CEIP Galdar Nv.5 (x=33, y=44)
  g[43][7] = 'H'; g[44][7] = 'D'; g[45][8] = 'T';
  g[43][33] = 'J'; g[44][33] = 'D'; g[45][32] = 'T';
  g[48][24] = 'T'; // cartel del S.S. Olsen
  g[46][17] = 'P'; g[46][36] = 'P';

  // Arranque norte desde el muelle hacia LAS CURVAS DEL DEMONIO (x=18..21, y=38..45)
  put(18, 38, 21, 45, 'R');
  put(19, 42, 20, 42, 'S');
  g[45][22] = 'T'; // cartel "↑ LAS CURVAS DEL DEMONIO -> CUEVAS PINTADAS"

  // ===== 2. LAS CURVAS DEL DEMONIO (zig-zag infernal por el risco: y = 15..40) =====
  // Vegetacion desertica / cardones en los riscos laterales
  for (const [x, y] of [[3, 38], [38, 36], [4, 28], [38, 22], [4, 18], [36, 17]]) g[y][x] = 'P';

  // Curva 1: tira al OESTE (x=6..21, y=37..39)
  put(6, 37, 21, 39, 'R');
  put(6, 40, 17, 40, 'L');
  // Horquilla Oeste 1: sube a y=31 (x=6..9, y=31..39)
  put(6, 31, 9, 39, 'R');
  put(7, 34, 8, 34, 'S');

  // Curva 2: tira al ESTE de lado a lado (x=6..35, y=31..33)
  put(6, 31, 35, 33, 'R');
  put(10, 34, 35, 34, 'L');
  g[31][16] = 'T'; // cartel "CURVA DEL DIABLO #7"
  // Horquilla Este 1: sube a y=25 (x=32..35, y=25..33) + balcon mirador al barco
  put(32, 25, 35, 33, 'R');
  put(33, 28, 34, 28, 'S');
  put(36, 27, 38, 29, 'Z'); put(36, 30, 38, 30, 'L'); g[28][37] = 'h';

  // Curva 3: vuelve al OESTE (x=7..35, y=25..27)
  put(7, 25, 35, 27, 'R');
  put(7, 28, 31, 28, 'L');
  // Horquilla Oeste 2: sube a y=19 (x=7..10, y=19..27)
  put(7, 19, 10, 27, 'R');
  put(8, 22, 9, 22, 'S');

  // Curva 4: tira al CENTRO (x=7..24, y=19..21) y remata recto arriba a Galdar (x=20..24, y=13..21)
  put(7, 19, 24, 21, 'R');
  put(11, 22, 24, 22, 'L');
  put(20, 13, 24, 21, 'R');
  put(21, 16, 23, 16, 'S');
  g[17][19] = 'T'; // cartel "FIN DE LAS CURVAS DEL DEMONIO"

  // ===== 3. CASCO DE GALDAR + PUERTA DE LAS CUEVAS PINTADAS (y = 1..14) =====
  put(4, 1, 37, 14, 'B');
  for (let x = 6; x <= 36; x += 4) g[2][x] = 'W';
  // Gran Plaza de Galdar / Santiago (x=7..34, y=5..13)
  put(7, 5, 34, 13, 'Z');
  put(20, 13, 24, 14, 'Z'); // entrada desde las curvas
  // Fachada rupestre del Parque Arqueologico / Guachinche Cuevas Pintadas (x=16..28, y=2..4)
  put(16, 2, 28, 4, 'Y');
  g[4][22] = 'D';           // PUERTA DE LAS CUEVAS PINTADAS (Gym #3)
  g[5][24] = 'T';           // cartel de horario ("HORARIO: A PARTIR DE LANDON")
  // Puesto de roscas y bancos para sentarse ("vete a buscarte unas roscah y sientate en un banco")
  g[10][12] = 'M';          // puesto de roscas calentitas
  g[8][15] = 'h'; g[8][29] = 'h';
  g[11][16] = 'h'; g[11][28] = 'h';
  for (const [x, y] of [[8, 6], [33, 6], [8, 12], [33, 12]]) g[y][x] = 'E';
  g[6][12] = 'P'; g[6][31] = 'P';

  return g.map((r) => r.join(''));
}

// ------------------------------------------------------------------
// S.S. OLSEN (26x16): Pasillo de pasaje, camarotes y Puente del Capitan mareado
// ------------------------------------------------------------------
function buildSSOlsen(): string[] {
  const OW = 26, OH = 16;
  const g: string[][] = Array.from({ length: OH }, () => Array<string>(OW).fill('#'));
  const put = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = c;
  };
  // Mamparos exteriores con ojos de buey
  for (let x = 2; x <= 23; x += 3) g[1][x] = 'o';
  // Pasillo principal de babor a estribor (x=2..23, y=10..13)
  put(2, 10, 23, 13, 'd');
  // Portalon de salida al muelle abajo-izquierda (x=4..5, y=14..15)
  put(4, 14, 5, 14, 'd');
  g[15][4] = 'D'; g[15][5] = 'D';

  // Camarote 1: Cafeteria / Butacas VIP congeladas (x=2..7, y=2..8)
  put(2, 2, 7, 8, 'd');
  g[9][4] = 'd'; g[9][5] = 'd'; // hueco puerta
  g[3][3] = 'M'; g[3][6] = 'M'; g[6][3] = 'h'; g[6][6] = 'h';

  // Camarote 2: Pasajero duelista (x=9..15, y=2..8)
  put(9, 2, 15, 8, 'd');
  g[9][12] = 'd';
  g[3][10] = 'B'; g[4][10] = 'B'; g[3][14] = 'M'; g[7][14] = 'P';

  // Puente de Mando / Camarote del Capitan Mareado (x=17..23, y=2..8)
  put(17, 2, 23, 8, 'd');
  g[9][20] = 'd';
  g[2][18] = 'A'; g[2][20] = 'W'; g[2][22] = 'A'; // radar y parabrisas del puente
  g[4][21] = 'u'; // cubo/papelera donde el Capitan esta mareado!
  g[4][18] = 'M'; g[7][23] = 'P';
  g[10][18] = 'T'; // placa "PUENTE DE MANDO - CAPITAN"

  return g.map((r) => r.join(''));
}

// ------------------------------------------------------------------
// CUEVAS PINTADAS (21x20): Guachinche real dentro de la cueva arqueologica +
// Minijuego del gimnasio electrico (15 mesas de carne fiesta, 2 con botones -> cocina)
// ------------------------------------------------------------------
function buildCuevasPintadas(): string[] {
  const CW = 21, CH = 20;
  const g: string[][] = Array.from({ length: CH }, () => Array<string>(CW).fill('Y'));
  const put = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = c;
  };
  // Salon principal de la cueva-guachinche (x=1..19, y=7..18)
  put(1, 7, 19, 18, '.');
  // Muro divisorio de la COCINA en y=6 con puerta doble de 2 cerrojos en x=9..10
  put(1, 6, 19, 6, 'Y');
  g[6][9] = 'K'; g[6][10] = 'K';
  g[7][8] = 'T'; // cartel junto a la puerta de la cocina

  // LA COCINA DEL GUACHINCHE (x=3..17, y=1..5)
  put(3, 1, 17, 5, '.');
  g[1][5] = 'Q'; g[1][8] = 'Q'; g[1][12] = 'Q'; g[1][15] = 'Q'; // calderos y planchas a tope
  g[2][4] = 'C'; g[2][16] = 'C';
  g[4][5] = 'M'; g[4][15] = 'M';

  // LAS 15 MESAS DE CARNE FIESTA (5 columnas x 3 filas)
  for (const ry of CUEVA_ROWS) {
    for (const cx of CUEVA_COLS) {
      g[ry][cx] = 'G';
    }
  }

  // Salida al sur (x=10, y=19)
  g[19][10] = 'D';
  g[18][2] = 'P'; g[18][18] = 'P';

  return g.map((r) => r.join(''));
}

export const MAPS: Record<MapId, GameMap> = {
  ...NEW_MAPS,
  ...TF1_MAPS,
  tf5: TF5_MAP,
  ...SANTA_URSULA_MAPS,
  montana_blanca: MONTANA_BLANCA_MAP,
  sendero_telesforo: SENDERO_TELESFORO_MAP,
  cueva_magec: CUEVA_MAGEC_MAP,
  parrandero_2: CABLE_CLUB_MAP,
  ...NIGHT_MAPS,
  ...ROSARIO_MAPS,
  san_borondon: SAN_BORONDON,
  ...GOMERA_MAPS,
  apartment: {
    id: 'apartment',
    name: 'Tu piso · Santa Cruz',
    rows: [
      '##WW##WW##',
      '#BB.....P#',
      '#BB....XX#',
      '#........#',
      '#X...T...#',
      '#X.......#',
      '#....X..P#',
      '#........#',
      '####D#####',
    ],
    legend: { ...INTERIOR, B: 'bed', X: 'box', T: 'table', M: 'mat' },
    npcs: [],
    onEnter: [
      'SANTA CRUZ DE TENERIFE. Tu nuevo piso.',
      'Acabas de desempacar la ultima caja. Huele a salitre y a cafe de la calle.',
      'Muevete con la CRUCETA o WASD/Flechas. A = hablar/mirar (Z, Enter o Espacio).',
    ],
    triggers: [
      { x: 7, y: 2, kind: 'interact', action: { type: 'text', lines: ['Cajas de la mudanza.', 'Trajiste abrigos de invierno. En Santa Cruz sobran; en La Laguna ya veras.'] } },
      { x: 8, y: 2, kind: 'interact', action: { type: 'text', lines: ['Tus cartas viejas de Magic.', 'Aqui se juega con Volcanes, Charcos, Laurisilva, Playas y Malpais.'] } },
      { x: 1, y: 4, kind: 'interact', action: { type: 'text', lines: ['Nevera de camping: CLIPPER DE FRESA y platanos.', 'Tu primer mandado en el HiperDino fue un exito.'] } },
      { x: 1, y: 5, kind: 'interact', action: { type: 'text', lines: ['Cholas con calcetines blancos. Tu armadura inicial.'] } },
      { x: 5, y: 6, kind: 'interact', action: { type: 'text', lines: ['Crema solar factor 50+. Te quemaras la nariz igual.'] } },
      { x: 5, y: 4, kind: 'interact', action: { type: 'text', lines: ['Un mapa de Tenerife. Al este de Santa Cruz: AGUA. Al oeste: La Candelaria, TF-5 y Taco. Al norte: La Laguna y Anaga.'] } },
      { x: 1, y: 1, kind: 'interact', action: { type: 'text', lines: ['Tu cama. Todavia sin sabanas.'] } },
      { x: 2, y: 0, kind: 'interact', action: { type: 'text', lines: ['Por la ventana ves la darsena al este y la cuesta hacia La Laguna al norte.'] } },
      { x: 4, y: 8, kind: 'step', action: { type: 'warp', to: 'rellano', x: 4, y: 2, dir: 'down' } },
    ],
  },

  rellano: {
    id: 'rellano',
    name: 'Rellano · 3a planta',
    rows: [
      '##########',
      '####D##D##',
      '##......##',
      '##......##',
      '###.######',
      '##SSS#####',
      '##SSS#####',
      '##########',
      '##########',
    ],
    legend: { ...INTERIOR, S: 'stairs' },
    npcs: [{ id: 'yeray', sprite: 'neighbor', x: 3, y: 4 }],
    onEnter: ['Sales al rellano. Un vecino del 3o B se planta en el hueco de la escalera y mira tus calcetines.'],
    triggers: [
      { x: 4, y: 1, kind: 'step', action: { type: 'warp', to: 'apartment', x: 4, y: 7, dir: 'up' } },
      { x: 7, y: 1, kind: 'interact', action: { type: 'text', lines: ['3o B. Suena la tele: "gooool del Tenerife!"'] } },
      { x: 2, y: 6, kind: 'step', action: { type: 'warp', to: 'calle', x: 76, y: 4, dir: 'down' } },
      { x: 3, y: 6, kind: 'step', action: { type: 'warp', to: 'calle', x: 76, y: 4, dir: 'down' } },
      { x: 4, y: 6, kind: 'step', action: { type: 'warp', to: 'calle', x: 76, y: 4, dir: 'down' } },
    ],
  },

  calle: {
    id: 'calle',
    name: 'Taco <- TF-5 <- Candelaria <- Weyler <- S/C',
    rows: buildCalle(),
    legend: {
      B: 'building', W: 'window', D: 'door', s: 'sidewalk', t: 'track', b: 'bridge',
      F: 'tf5', R: 'road', '~': 'sea', T: 'sign', P: 'palm', L: 'rail', Z: 'plaza',
      H: 'parranda', J: 'colegio',
    },
    npcs: [
      { id: 'chino', sprite: 'chino', x: 11, y: 4 },
      { id: 'chacho_portal', sprite: 'neighbor', x: 73, y: 4, trainer: 'chacho_portal' },
      { id: 'abuela_kiosco', sprite: 'professor', x: 63, y: 7, trainer: 'abuela_kiosco' },
      { id: 'elite_tf5', sprite: 'runner', x: 27, y: 7, trainer: 'elite_tf5' },
    ],
    onEnter: [
      'Sales a la calle en Santa Cruz. Al ESTE (derecha) esta el muelle y el Atlantico.',
      'Tira pal OESTE (izquierda) hacia PLAZA WEYLER para coger el tranvia a La Candelaria.',
    ],
    triggers: [
      { x: 76, y: 3, kind: 'interact', action: { type: 'text', lines: ['Tu portal en Santa Cruz.'] } },
      { x: 66, y: 3, kind: 'step', action: { type: 'enterParrandero', id: 'weyler' } },
      { x: 67, y: 4, kind: 'interact', action: { type: 'text', lines: ['CENTRO PARRANDERO EL CHICHARRO. Barraquitos pal bajon y PC de Ayoze.'] } },
      { x: 50, y: 3, kind: 'step', action: { type: 'enterSchool', id: 'sc' } },
      { x: 51, y: 4, kind: 'interact', action: { type: 'text', lines: ['CEIP WEYLER (Patio Nv.1). La verja del recreo esta entreabierta... duelos REPETIBLES contra los chinijos!'] } },
      { x: 30, y: 3, kind: 'step', action: { type: 'enterParrandero', id: 'candelaria' } },
      { x: 29, y: 4, kind: 'interact', action: { type: 'text', lines: ['CENTRO PARRANDERO LOS MAJOS. Recuperacion de pajaras post-TF5 y PC de Ayoze.'] } },
      { x: 80, y: 4, kind: 'interact', action: { type: 'text', lines: ['El muelle y el Atlantico. Al este solo hay agua, guirufo: la isla sigue pal OESTE.'] } },
      { x: 80, y: 7, kind: 'interact', action: { type: 'text', lines: ['El Atlantico. Salvo que seas un angelote, mejor tira pal oeste.'] } },
      { x: 61, y: 8, kind: 'interact', action: { type: 'text', lines: ['PARADA: PLAZA WEYLER (Linea 1). Pisa la via junto a la puerta para subir hacia LA CANDELARIA.'] } },
      { x: 54, y: 4, kind: 'interact', action: { type: 'text', lines: ['↑ SUBIDA RAMON Y CAJAL (norte): Ramblas · La Granja · La Cuesta · Museo · Cruz de Piedra · Campus ULL (Gym #1).'] } },
      { x: 55, y: 0, kind: 'step', action: { type: 'enterSubida' } },
      { x: 56, y: 0, kind: 'step', action: { type: 'enterSubida' } },
      { x: 57, y: 0, kind: 'step', action: { type: 'enterSubida' } },
      { x: 59, y: 6, kind: 'step', action: { type: 'tramBoard', from: 'weyler', to: 'candelaria' } },
      { x: 41, y: 6, kind: 'step', action: { type: 'tramBoard', from: 'candelaria', to: 'weyler' } },
      { x: 43, y: 8, kind: 'interact', action: { type: 'text', lines: ['PARADA: HOSPITAL LA CANDELARIA (Linea 1). Al oeste queda el puente de la TF-5 y Taco.'] } },
      { x: 36, y: 3, kind: 'step', action: { type: 'warp', to: 'hospital', x: 4, y: 7, dir: 'up' } },
      { x: 24, y: 4, kind: 'step', action: { type: 'once', key: 'tf5', lines: ['Cruzas el puente sobre la TF-5. Debajo hay una cola kilometrica: la gente se baja del coche a echar partidas.'] } },
      { x: 24, y: 5, kind: 'step', action: { type: 'once', key: 'tf5', lines: ['Cruzas el puente sobre la TF-5. Debajo hay una cola kilometrica: la gente se baja del coche a echar partidas.'] } },
      { x: 24, y: 7, kind: 'step', action: { type: 'once', key: 'tf5', lines: ['Cruzas el puente sobre la TF-5. Debajo hay una cola kilometrica: la gente se baja del coche a echar partidas.'] } },
      { x: 20, y: 4, kind: 'step', action: { type: 'once', key: 'taco', lines: ['TACO. Sigue al oeste hasta el Bazar Chino.'] } },
      { x: 9, y: 3, kind: 'interact', action: { type: 'text', lines: ['Bazar Chino de Taco. Tienen desde tornillos hasta disfraces de carnaval.'] } },
      { x: 2, y: 8, kind: 'interact', action: { type: 'text', lines: ['← EL ROSARIO. La carretera sigue al oeste de Taco.'] } },
      ...[9, 10].map((y) => ({ x: 0, y, kind: 'step' as const, action: { type: 'warp' as const, to: 'acceso_taco' as const, x: 22, y: 8, dir: 'left' as const } })),
      { x: 60, y: 4, kind: 'step', action: { type: 'zone', name: 'PLAZA WEYLER' } },
      { x: 42, y: 4, kind: 'step', action: { type: 'zone', name: 'LA CANDELARIA' } },
      { x: 21, y: 4, kind: 'step', action: { type: 'zone', name: 'TACO' } },
    ],
  },

  hospital: {
    id: 'hospital',
    name: 'H. La Candelaria · Lab de Acaymo',
    rows: [
      '#MWM##MWM#',
      '#........#',
      '#CC1C2C3C#',
      '#........#',
      '#........#',
      '#P......P#',
      '#........#',
      '#........#',
      '####D#####',
    ],
    legend: { ...INTERIOR, M: 'machine', C: 'counter', '1': 'card', '2': 'card', '3': 'card' },
    npcs: [
      { id: 'acaymo', sprite: 'professor', x: 7, y: 5 },
      { id: 'bencomo', sprite: 'bencomo', x: 2, y: 5, hidden: true },
      { id: 'ayoze', sprite: 'ayoze', x: 6, y: 5 },
    ],
    onEnter: [
      'Planta -1. Cartel: "ZOOLOGIA MAGICA. PROF. ACAYMO".',
      'ACAYMO: Epa, guirufo! Acercate al mostrador y elige tu mazo promocional inicial.',
    ],
    triggers: [
      { x: 4, y: 8, kind: 'step', action: { type: 'warp', to: 'calle', x: 36, y: 4, dir: 'down' } },
      { x: 3, y: 2, kind: 'interact', action: { type: 'starter', id: 'cabra' } },
      { x: 5, y: 2, kind: 'interact', action: { type: 'starter', id: 'angelote' } },
      { x: 7, y: 2, kind: 'interact', action: { type: 'starter', id: 'pinzon' } },
      { x: 1, y: 0, kind: 'interact', action: { type: 'text', lines: ['Un escaner de magomones. Pita como un microondas.'] } },
      { x: 2, y: 0, kind: 'interact', action: { type: 'text', lines: ['Por la ventana se ve el atasco eterno de la TF-5 hacia el oeste.'] } },
    ],
  },

  subida: {
    id: 'subida',
    name: 'Subida a La Laguna · Campus ULL',
    rows: buildSubida(),
    legend: {
      B: 'building', W: 'window', D: 'door', s: 'sidewalk', Z: 'plaza', S: 'stairs',
      R: 'road', X: 'crosswalk', g: 'grass', E: 'tree', P: 'palm', h: 'bench',
      p: 'path', f: 'fence', v: 'vtrack', L: 'rail', M: 'table', T: 'sign',
      O: 'monument', A: 'dish', K: 'parking', C: 'car', H: 'parranda', J: 'colegio',
    },
    npcs: [
      { id: 'vecino_rc', sprite: 'neighbor', x: 13, y: 86 },
      { id: 'runner_granja', sprite: 'runner', x: 9, y: 66, trainer: 'runner_granja' },
      { id: 'abuelo_granja', sprite: 'professor', x: 16, y: 62, trainer: 'abuelo_granja' },
      { id: 'pibe_cuesta', sprite: 'neighbor', x: 25, y: 46, trainer: 'pibe_cuesta' },
      { id: 'est_museo', sprite: 'estudiante', x: 24, y: 31, trainer: 'est_museo' },
      { id: 'tamara', sprite: 'estudiante', x: 9, y: 19, trainer: 'lagunera_cruz' },
      { id: 'est_ull', sprite: 'estudiante', x: 11, y: 7 },
      { id: 'borja', sprite: 'runner', x: 20, y: 9, trainer: 'est_parking' },
      { id: 'domingo', sprite: 'lider1', x: 24, y: 7, trainer: 'gym_ull' },
    ],
    onEnter: [
      'CALLE RAMON Y CAJAL. Empieza la liturgia: to tieso parriba hasta La Laguna.',
      'Si necesitas mas cartas o duros, cuelate en los COLEGIOS del camino pa jugar en el recreo!',
    ],
    triggers: [
      { x: 16, y: 95, kind: 'step', action: { type: 'warp', to: 'calle', x: 56, y: 1, dir: 'down' } },
      { x: 17, y: 95, kind: 'step', action: { type: 'warp', to: 'calle', x: 56, y: 1, dir: 'down' } },
      { x: 18, y: 95, kind: 'step', action: { type: 'warp', to: 'calle', x: 56, y: 1, dir: 'down' } },
      { x: 19, y: 95, kind: 'step', action: { type: 'warp', to: 'calle', x: 56, y: 1, dir: 'down' } },
      { x: 20, y: 95, kind: 'step', action: { type: 'warp', to: 'calle', x: 56, y: 1, dir: 'down' } },

      { x: 17, y: 0, kind: 'step', action: { type: 'enterAnaga' } },
      { x: 18, y: 0, kind: 'step', action: { type: 'enterAnaga' } },
      { x: 19, y: 0, kind: 'step', action: { type: 'enterAnaga' } },
      { x: 16, y: 2, kind: 'interact', action: { type: 'text', lines: ['↑ SALIDA NORTE: SAN BENITO -> LAS MERCEDES (este) -> ANAGA -> TAGANANA (Gym #2).'] } },

      { x: 16, y: 92, kind: 'interact', action: { type: 'text', lines: ['C/ RAMON Y CAJAL. Pendiente: 14%. Mas arriba: cruce de LAS RAMBLAS.'] } },
      { x: 13, y: 77, kind: 'interact', action: { type: 'text', lines: ['RAMBLA DE SANTA CRUZ. Pasea hacia la derecha para cruzar al PARQUE LA GRANJA.'] } },
      { x: 18, y: 76, kind: 'interact', action: { type: 'text', lines: ['Escultura callejera de Las Ramblas. Hierro retorcido con placa solemne.'] } },
      { x: 21, y: 67, kind: 'interact', action: { type: 'text', lines: ['PARQUE LA GRANJA. Salida hacia LA CUESTA por la esquina noroeste (arriba-izquierda).'] } },
      { x: 10, y: 51, kind: 'interact', action: { type: 'text', lines: ['CARRETERA GRAL. LA CUESTA. Colegio Nv.2 y Centro Parrandero aqui mismo; curva al este pa subir.'] } },
      { x: 28, y: 45, kind: 'interact', action: { type: 'text', lines: ['Arepera "El Barraquito". Huele a reina pepiada y cortado leche y leche.'] } },
      { x: 29, y: 50, kind: 'interact', action: { type: 'text', lines: ['Mirador de La Cuesta. Alla abajo brilla el puerto de Santa Cruz. Cuanto has subido, chacho!'] } },
      { x: 20, y: 33, kind: 'interact', action: { type: 'text', lines: ['MUSEO DE LA CIENCIA Y EL COSMOS. Patio de la antena a la derecha; CRUZ DE PIEDRA al norte.'] } },
      { x: 26, y: 27, kind: 'interact', action: { type: 'text', lines: ['Museo de la Ciencia. Hoy esta lleno de guaguas de colegio gritando en el laberinto de espejos.'] } },
      { x: 28, y: 31, kind: 'interact', action: { type: 'text', lines: ['Radiotelescopio. Apunta al cielo buscando vida inteligente fuera de la TF-5.'] } },
      { x: 29, y: 31, kind: 'interact', action: { type: 'text', lines: ['Radiotelescopio. Hace un zumbido cosmico muy relajante.'] } },
      { x: 12, y: 23, kind: 'interact', action: { type: 'text', lines: ['ROTONDA DE CRUZ DE PIEDRA. Al norte: CAMPUS CENTRAL DE LA ULL.'] } },
      { x: 16, y: 19, kind: 'interact', action: { type: 'text', lines: ['La mitica Cruz de Piedra. Aqui empieza oficialmente el frio lagunero.'] } },
      { x: 13, y: 11, kind: 'interact', action: { type: 'text', lines: ['CAMPUS CENTRAL - ULL. Derecha: GUACHINCHE-TRUCK (Gym #1). Norte: salida a SAN BENITO y ANAGA.'] } },
      { x: 10, y: 3, kind: 'interact', action: { type: 'text', lines: ['Edificio Central de la ULL. Huele a apuntes fotocopiados y cafe de maquina a 60 centimos.'] } },
      { x: 21, y: 7, kind: 'interact', action: { type: 'text', lines: ['GIMNASIO #1: GUACHINCHE-TRUCK ULL. Habla con DOMINGO delante de la ventanilla pa jugarte el Boliche!'] } },

      { x: 18, y: 92, kind: 'step', action: { type: 'zone', name: 'RAMON Y CAJAL' } },
      { x: 10, y: 78, kind: 'step', action: { type: 'zone', name: 'LAS RAMBLAS' } },
      { x: 11, y: 78, kind: 'step', action: { type: 'zone', name: 'LAS RAMBLAS' } },
      { x: 12, y: 78, kind: 'step', action: { type: 'zone', name: 'LAS RAMBLAS' } },
      { x: 22, y: 68, kind: 'step', action: { type: 'zone', name: 'PARQUE LA GRANJA' } },
      { x: 23, y: 68, kind: 'step', action: { type: 'zone', name: 'PARQUE LA GRANJA' } },
      { x: 24, y: 68, kind: 'step', action: { type: 'zone', name: 'PARQUE LA GRANJA' } },
      { x: 7, y: 53, kind: 'step', action: { type: 'zone', name: 'LA CUESTA' } },
      { x: 8, y: 53, kind: 'step', action: { type: 'zone', name: 'LA CUESTA' } },
      { x: 9, y: 53, kind: 'step', action: { type: 'zone', name: 'LA CUESTA' } },
      { x: 15, y: 35, kind: 'step', action: { type: 'zone', name: 'MUSEO DE LA CIENCIA' } },
      { x: 16, y: 35, kind: 'step', action: { type: 'zone', name: 'MUSEO DE LA CIENCIA' } },
      { x: 17, y: 35, kind: 'step', action: { type: 'zone', name: 'MUSEO DE LA CIENCIA' } },
      { x: 15, y: 24, kind: 'step', action: { type: 'zone', name: 'CRUZ DE PIEDRA' } },
      { x: 16, y: 24, kind: 'step', action: { type: 'zone', name: 'CRUZ DE PIEDRA' } },
      { x: 17, y: 24, kind: 'step', action: { type: 'zone', name: 'CRUZ DE PIEDRA' } },
      { x: 15, y: 12, kind: 'step', action: { type: 'zone', name: 'CAMPUS CENTRAL ULL' } },
      { x: 16, y: 12, kind: 'step', action: { type: 'zone', name: 'CAMPUS CENTRAL ULL' } },
      { x: 17, y: 12, kind: 'step', action: { type: 'zone', name: 'CAMPUS CENTRAL ULL' } },
      { x: 19, y: 9, kind: 'step', action: { type: 'zone', name: 'PARKING · GYM #1' } },
      { x: 19, y: 8, kind: 'step', action: { type: 'zone', name: 'PARKING · GYM #1' } },

      { x: 8, y: 46, kind: 'step', action: { type: 'enterSchool', id: 'cuesta' } },
      { x: 9, y: 47, kind: 'interact', action: { type: 'text', lines: ['CEIP LA CUESTA (Patio Nv.2). Cuelate por la verja pa echar partidas REPETIBLES con los chinijos!'] } },
      { x: 14, y: 46, kind: 'step', action: { type: 'enterParrandero', id: 'cuesta' } },
      { x: 15, y: 47, kind: 'interact', action: { type: 'text', lines: ['CENTRO PARRANDERO EL BARRANCO (La Cuesta). Descanso, barraquito y PC de Ayoze.'] } },
      { x: 22, y: 14, kind: 'step', action: { type: 'enterParrandero', id: 'ull' } },
      { x: 21, y: 15, kind: 'interact', action: { type: 'text', lines: ['CENTRO PARRANDERO GUAJARA (Cruz de Piedra · ULL). Caldito caliente, timple y PC de Ayoze.'] } },
    ],
  },

  anaga: {
    id: 'anaga',
    name: 'San Benito · Las Mercedes · Taganana · Benijo',
    rows: buildAnaga(),
    legend: {
      B: 'building', W: 'window', D: 'door', s: 'sidewalk', Z: 'plaza', S: 'stairs',
      R: 'road', X: 'crosswalk', g: 'grass', E: 'tree', P: 'palm', h: 'bench',
      p: 'path', L: 'rail', M: 'table', T: 'sign', O: 'monument', V: 'ravine',
      '~': 'sea', u: 'surf', n: 'blacksand', r: 'roque', k: 'pothole', Q: 'fogon',
      H: 'parranda', J: 'colegio',
    },
    npcs: [
      { id: 'pibe_sanbenito', sprite: 'estudiante', x: 11, y: 59, trainer: 'pibe_sanbenito' },
      { id: 'vecina_mercedes', sprite: 'professor', x: 35, y: 51 },
      { id: 'mago_mercedes', sprite: 'parrandero', x: 39, y: 49, trainer: 'mago_mercedes' },
      { id: 'senderista_tf12', sprite: 'runner', x: 47, y: 40, trainer: 'senderista_tf12' },
      { id: 'dominguero_llano', sprite: 'lider1', x: 56, y: 29, trainer: 'dominguero_llano' },
      { id: 'cabrero_vueltas', sprite: 'parrandero', x: 51, y: 19, trainer: 'cabrero_vueltas' },
      // Taganana: Pedro en la puerta del Gym #2 + Cathaysa tras el rescate + corte Team Enriscada
      { id: 'abuela_taganana', sprite: 'chaxiraxi', x: 40, y: 8 },
      { id: 'pedro', sprite: 'pedro', x: 43, y: 6 },
      { id: 'cathaysa_gym', sprite: 'cathaysa', x: 44, y: 6, hidden: true, trainer: 'gym_taganana' },
      { id: 'enriscada_1', sprite: 'enriscada', x: 32, y: 17 },
      { id: 'enriscada_2', sprite: 'enriscada', x: 34, y: 17 },
      // Almaciga (Cathaysa surfeando!) + Benijo (Carmelo el cayuquero)
      { id: 'surfer_almaciga', sprite: 'runner', x: 56, y: 5, trainer: 'surfer_almaciga' },
      { id: 'cathaysa_surf', sprite: 'cathaysa_surf', x: 60, y: 3 },
      { id: 'carmelo', sprite: 'cayuquero', x: 71, y: 4 },
      // MAGOMANIACO junto al fogon de Las Mercedes: bloquea la subida a Taganana (obligatorio antes de Gym #2)
      { id: 'magomaniaco', sprite: 'magomaniaco', x: 39, y: 46, trainer: 'magomaniaco' },
      // Guardia de la boca de la cueva del Llano: solo deja pasar al campeón del Alto Mando.
      { id: 'guardia_cueva', sprite: 'capitan', x: 66, y: 29 },
    ],
    onEnter: [
      'BARRIO DE SAN BENITO (La Laguna). Te tiemblan hasta las pestanas con la humedad.',
      'Sube al NORTE hasta el cruce y enfila TO RECTO AL ESTE direccion LAS MERCEDES!',
    ],
    triggers: [
      { x: 8, y: 65, kind: 'step', action: { type: 'warp', to: 'subida', x: 18, y: 1, dir: 'down' } },
      { x: 9, y: 65, kind: 'step', action: { type: 'warp', to: 'subida', x: 18, y: 1, dir: 'down' } },
      { x: 10, y: 65, kind: 'step', action: { type: 'warp', to: 'subida', x: 18, y: 1, dir: 'down' } },

      { x: 6, y: 56, kind: 'step', action: { type: 'enterParrandero', id: 'sanbenito' } },
      { x: 5, y: 57, kind: 'interact', action: { type: 'text', lines: ['CENTRO PARRANDERO SAN BENITO. Caldo de millo hirviendo y PC de Ayoze.'] } },
      { x: 12, y: 56, kind: 'step', action: { type: 'enterSchool', id: 'sanbenito' } },
      { x: 13, y: 57, kind: 'interact', action: { type: 'text', lines: ['IES SAN BENITO (Patio Nv.3). Duelos REPETIBLES en el recreo pa sacar sobres y duros!'] } },
      { x: 8, y: 63, kind: 'interact', action: { type: 'text', lines: ['SAN BENITO. Sube al NORTE hasta la avenida y tira TO RECTO AL ESTE pa LAS MERCEDES.'] } },
      { x: 8, y: 60, kind: 'interact', action: { type: 'text', lines: ['Ermita de San Benito Abad. Patron de las romerias y de los mazos de Laurisilva.'] } },

      { x: 12, y: 48, kind: 'interact', action: { type: 'text', lines: ['→ CAMINO DE LAS MERCEDES. Todo recto al ESTE sin torcerte ni un metro!'] } },
      { x: 37, y: 45, kind: 'interact', action: { type: 'text', lines: ['Venta de Las Mercedes. Huele a escaldon de gofio y vino tinto peleon.'] } },
      { x: 37, y: 47, kind: 'interact', action: { type: 'text', lines: ['LAS MERCEDES. ↗ Sube al NORESTE por la CARRETERA GENERAL hacia el LLANO DE LOS VIEJOS (tras vencer al MAGOMANIACO).'] } },

      { x: 41, y: 41, kind: 'interact', action: { type: 'text', lines: ['MIRADOR CRUZ DEL CARMEN (Carretera General). Se ve toda La Laguna y el Teide asomando sobre las nubes!'] } },
      { x: 53, y: 32, kind: 'interact', action: { type: 'text', lines: ['LLANO DE LOS VIEJOS (o de las Viejas). Merendero entre laurisilva. ↑ Al NORTE: VUELTAS DE TAGANANA.'] } },
      { x: 62, y: 28, kind: 'interact', action: { type: 'text', lines: ['BOCA DE LA CUEVA DEL LLANO. Al otro lado del barranco, al ESTE. Se salta con la vara del pastor, pero un guardia no deja pasar a nadie que no sea el campeón del Alto Mando.'] } },
      { x: 67, y: 29, kind: 'step', action: { type: 'warp', to: 'cueva_magec', x: 11, y: 33, dir: 'up' } },
      { x: 53, y: 23, kind: 'interact', action: { type: 'text', lines: ['SENDERO LAS VUELTAS DE TAGANANA. Zig-zag historico entre laurisilva hasta la costa norte!'] } },

      { x: 44, y: 11, kind: 'interact', action: { type: 'text', lines: ['TAGANANA. Centro: GYM #2 (Cathaysa). Izq: C.P. y ctra. San Andres. Dcha: Escuela Nv.4, ALMACIGA y BENIJO.'] } },
      { x: 38, y: 5, kind: 'step', action: { type: 'enterParrandero', id: 'taganana' } },
      { x: 37, y: 6, kind: 'interact', action: { type: 'text', lines: ['CENTRO PARRANDERO EL ROQUE (Taganana). Vino de Taganana, barraquito y PC de Ayoze.'] } },
      { x: 44, y: 5, kind: 'step', action: { type: 'gym2Door' } },
      { x: 44, y: 5, kind: 'interact', action: { type: 'gym2Door' } },
      { x: 42, y: 6, kind: 'interact', action: { type: 'gym2Door' } },
      { x: 49, y: 5, kind: 'step', action: { type: 'enterSchool', id: 'taganana' } },
      { x: 50, y: 6, kind: 'interact', action: { type: 'text', lines: ['ESCUELA UNITARIA DE TAGANANA (Patio Nv.4). Duelos REPETIBLES de nivel alto y sobres completos!'] } },
      { x: 35, y: 11, kind: 'interact', action: { type: 'text', lines: ['↙ CARRETERA TF-134 A SAN ANDRES. AVISO: CORTADA POR ZANJAS SOSPECHOSAS.'] } },
      { x: 31, y: 16, kind: 'interact', action: { type: 'text', lines: ['"OBRA OFICIAL DEL TEAM ENRISCADA. Prohibido el paso (y si preguntan del Cabildo, no estamos)."'] } },

      { x: 55, y: 7, kind: 'interact', action: { type: 'text', lines: ['PLAYA DE ALMACIGA. Baja las escaleras a la arena negra. Mas al este: BENIJO.'] } },
      { x: 67, y: 8, kind: 'interact', action: { type: 'text', lines: ['PLAYA DE BENIJO. Fin del mundo conocido y amarre del cayuco de Carmelo.'] } },
      // En cuanto pisas la arena de Benijo con el Gym #3 en el historial, te dan el M.O. 1 Todo Terreno
      { x: 70, y: 6, kind: 'step', action: { type: 'giveTodoTerreno' } },
      { x: 71, y: 6, kind: 'step', action: { type: 'giveTodoTerreno' } },

      { x: 31, y: 21, kind: 'step', action: { type: 'vehicleWarp', to: 'carretera_noche', x: 15, y: 1, dir: 'down', blocked: STORY.tf134_blocked } },
      { x: 32, y: 21, kind: 'step', action: { type: 'vehicleWarp', to: 'carretera_noche', x: 15, y: 1, dir: 'down', blocked: STORY.tf134_blocked } },
      { x: 33, y: 21, kind: 'step', action: { type: 'vehicleWarp', to: 'carretera_noche', x: 15, y: 1, dir: 'down', blocked: STORY.tf134_blocked } },
      { x: 34, y: 21, kind: 'step', action: { type: 'vehicleWarp', to: 'carretera_noche', x: 15, y: 1, dir: 'down', blocked: STORY.tf134_blocked } },

      // PORTAZO DEL MAGOMANIACO: la unica salida de Las Mercedes a Taganana (GYM #2).
      // Mientras no le ganes, toda la cuesta te devuelve al inicio de la recta.
      ...([36, 37, 38, 39, 40, 41, 42, 43, 44] as const).map((gx) => ({
        x: gx, y: 46, kind: 'step' as const,
        action: { type: 'gate' as const, key: 'magomaniaco_done', lines: STORY.magomaniaco_gate, back: { x: Math.min(gx, 41), y: 47, dir: 'up' as const } },
      })),
      { x: 9, y: 62, kind: 'step', action: { type: 'zone', name: 'SAN BENITO' } },
      { x: 14, y: 49, kind: 'step', action: { type: 'zone', name: 'RECTA LAS MERCEDES' } },
      { x: 14, y: 50, kind: 'step', action: { type: 'zone', name: 'RECTA LAS MERCEDES' } },
      { x: 34, y: 49, kind: 'step', action: { type: 'zone', name: 'LAS MERCEDES' } },
      { x: 34, y: 50, kind: 'step', action: { type: 'zone', name: 'LAS MERCEDES' } },
      { x: 43, y: 43, kind: 'step', action: { type: 'zone', name: 'CTRA. GENERAL ANAGA' } },
      { x: 44, y: 43, kind: 'step', action: { type: 'zone', name: 'CTRA. GENERAL ANAGA' } },
      { x: 52, y: 33, kind: 'step', action: { type: 'zone', name: 'LLANO DE LOS VIEJOS' } },
      { x: 53, y: 33, kind: 'step', action: { type: 'zone', name: 'LLANO DE LOS VIEJOS' } },
      { x: 54, y: 24, kind: 'step', action: { type: 'zone', name: 'VUELTAS DE TAGANANA' } },
      { x: 55, y: 24, kind: 'step', action: { type: 'zone', name: 'VUELTAS DE TAGANANA' } },
      { x: 46, y: 12, kind: 'step', action: { type: 'zone', name: 'TAGANANA' } },
      { x: 45, y: 12, kind: 'step', action: { type: 'zone', name: 'TAGANANA' } },
      { x: 32, y: 13, kind: 'step', action: { type: 'zone', name: 'CTRA. SAN ANDRES' } },
      { x: 33, y: 13, kind: 'step', action: { type: 'zone', name: 'CTRA. SAN ANDRES' } },
      { x: 58, y: 6, kind: 'step', action: { type: 'zone', name: 'PLAYA DE ALMACIGA' } },
      { x: 54, y: 9, kind: 'step', action: { type: 'zone', name: 'ALMACIGA' } },
      { x: 70, y: 6, kind: 'step', action: { type: 'zone', name: 'PLAYA DE BENIJO' } },
      { x: 71, y: 6, kind: 'step', action: { type: 'zone', name: 'PLAYA DE BENIJO' } },
    ],
  },

  galdar: {
    id: 'galdar',
    name: 'Muelle de Galdar · Curvas del Demonio · Cuevas Pintadas',
    rows: buildGaldar(),
    legend: {
      B: 'building', W: 'window', D: 'door', s: 'sidewalk', Z: 'plaza', S: 'stairs',
      R: 'road', E: 'tree', P: 'palm', h: 'bench', L: 'rail', M: 'table', T: 'sign',
      V: 'ravine', '~': 'sea', u: 'surf', H: 'parranda', J: 'colegio', Y: 'pintada', d: 'deck',
    },
    npcs: [
      { id: 'carmelo_galdar', sprite: 'cayuquero', x: 11, y: 50 },
      { id: 'oficial_olsen', sprite: 'marinero', x: 26, y: 49 },
      { id: 'motero_curvas', sprite: 'runner', x: 21, y: 32, trainer: 'motero_curvas' },
      { id: 'senora_roscas', sprite: 'chaxiraxi', x: 13, y: 10, trainer: 'senora_roscas' },
      { id: 'portero_cuevas', sprite: 'canarion', x: 22, y: 5 },
    ],
    onEnter: [
      'MUELLE DE SARDINA DE GALDAR (Gran Canaria). Todavia te pita el oido a 120dB, pero estas en tierra firme.',
      'Al NORTE suben LAS CURVAS DEL DEMONIO rumbo a las CUEVAS PINTADAS. A estribor esta atracado el S.S. OLSEN.',
    ],
    triggers: [
      // C.P. El Faro y Colegio Nv.5 en el muelle
      { x: 7, y: 44, kind: 'step', action: { type: 'enterParrandero', id: 'galdar' } },
      { x: 8, y: 45, kind: 'interact', action: { type: 'text', lines: ['CENTRO PARRANDERO EL FARO (Galdar). Clipper de fresa, bocata de Teror y PC de Ayoze.'] } },
      { x: 33, y: 44, kind: 'step', action: { type: 'enterSchool', id: 'galdar' } },
      { x: 32, y: 45, kind: 'interact', action: { type: 'text', lines: ['CEIP GALDAR (Patio Nv.5). Duelos REPETIBLES contra los chinijos canariones!'] } },
      // Pasarela del S.S. Olsen
      { x: 27, y: 50, kind: 'step', action: { type: 'boardOlsen' } },
      { x: 24, y: 48, kind: 'interact', action: { type: 'text', lines: ['MUELLE FAST-FERRY S.S. OLSEN. Pasarela de embarque justo a la derecha.'] } },
      // Carteles de las Curvas del Demonio
      { x: 22, y: 45, kind: 'interact', action: { type: 'text', lines: ['↑ LAS CURVAS DEL DEMONIO: subida en zig-zag hasta las CUEVAS PINTADAS DE GALDAR.'] } },
      { x: 16, y: 31, kind: 'interact', action: { type: 'text', lines: ['⚠ CURVAS DEL DEMONIO (Tramo medio). Si miras abajo se ve el S.S. Olsen chiquitito.'] } },
      { x: 19, y: 17, kind: 'interact', action: { type: 'text', lines: ['↑ ENTRADA A GALDAR. Al fondo de la plaza: GUACHINCHE DE LAS CUEVAS PINTADAS (Gym #3).'] } },
      // Plaza de las Cuevas Pintadas: bancos, puesto de roscas y puerta del Gym #3
      { x: 12, y: 10, kind: 'interact', action: { type: 'text', lines: ['Puesto de ROSCAS calentitas recién hechas. Prohibido llamarlas cotufas en un radio de 20 km.'] } },
      { x: 15, y: 8, kind: 'interact', action: { type: 'galdarBench' } },
      { x: 29, y: 8, kind: 'interact', action: { type: 'galdarBench' } },
      { x: 16, y: 11, kind: 'interact', action: { type: 'galdarBench' } },
      { x: 28, y: 11, kind: 'interact', action: { type: 'galdarBench' } },
      { x: 24, y: 5, kind: 'interact', action: { type: 'text', lines: ['Cartel en la pared rupestre: "CUEVAS PINTADAS DE GALDAR — HORARIO DE GUACHINCHE: A PARTIR DE LANDON".'] } },
      { x: 22, y: 4, kind: 'step', action: { type: 'enterCuevas' } },
      // Banners de zona
      { x: 13, y: 49, kind: 'step', action: { type: 'zone', name: 'MUELLE DE GALDAR' } },
      { x: 19, y: 40, kind: 'step', action: { type: 'zone', name: 'CURVAS DEL DEMONIO' } },
      { x: 20, y: 40, kind: 'step', action: { type: 'zone', name: 'CURVAS DEL DEMONIO' } },
      { x: 21, y: 14, kind: 'step', action: { type: 'zone', name: 'CUEVAS PINTADAS' } },
      { x: 22, y: 14, kind: 'step', action: { type: 'zone', name: 'CUEVAS PINTADAS' } },
      { x: 23, y: 14, kind: 'step', action: { type: 'zone', name: 'CUEVAS PINTADAS' } },
    ],
  },

  ss_olsen: {
    id: 'ss_olsen',
    name: 'S.S. Olsen · Cubierta y Puente del Capitan',
    rows: buildSSOlsen(),
    legend: {
      '#': 'wall', d: 'deck', o: 'porthole', D: 'door', M: 'table',
      h: 'bench', B: 'bed', P: 'plant', A: 'machine', W: 'window', u: 'bucket', T: 'sign',
    },
    npcs: [
      { id: 'viajero_frio', sprite: 'neighbor', x: 5, y: 5 },
      { id: 'pasajero_olsen', sprite: 'professor', x: 12, y: 5, trainer: 'pasajero_olsen' },
      { id: 'capitan_olsen', sprite: 'capitan', x: 21, y: 5 },
    ],
    onEnter: [
      'INTERIOR DEL S.S. OLSEN. El aire acondicionado polar te deja los pelos tiesos al instante.',
      'Camina a estribor (derecha) hasta el PUENTE DE MANDO para ver si el Capitan tiene un traductor.',
    ],
    triggers: [
      { x: 4, y: 15, kind: 'step', action: { type: 'exitOlsen' } },
      { x: 5, y: 15, kind: 'step', action: { type: 'exitOlsen' } },
      { x: 18, y: 10, kind: 'interact', action: { type: 'text', lines: ['PUENTE DE MANDO DEL S.S. OLSEN. Se oyen arcadas finas de lobo de mar detras de la puerta.'] } },
      { x: 21, y: 4, kind: 'interact', action: { type: 'text', lines: ['El cubo oficial de mareo del Capitan. Mejor no asomarse mucho, que ya tuviste bastante con el cayuco.'] } },
    ],
  },

  cuevas_pintadas: {
    id: 'cuevas_pintadas',
    name: 'Guachinche Cuevas Pintadas · Gym #3',
    rows: buildCuevasPintadas(),
    legend: {
      Y: 'pintada', '.': 'floor', K: 'kdoor', D: 'door', G: 'gtable',
      Q: 'fogon', C: 'counter', M: 'table', T: 'sign', P: 'plant',
    },
    npcs: [
      { id: 'arqueologo_cueva', sprite: 'professor', x: 2, y: 17 },
      { id: 'camarero_cueva', sprite: 'parrandero', x: 18, y: 17 },
      { id: 'bentejui', sprite: 'lider1', x: 10, y: 3, trainer: 'gym_galdar' },
    ],
    onEnter: [
      'GUACHINCHE DE LAS CUEVAS PINTADAS (Gimnasio #3). Pinturas rupestres milenarias... y quince mesas con mantel de papel y olor a carne fiesta!',
      'La puerta de LA COCINA al norte tiene DOS CERROJOS: toca mesas al azar pa encontrar los 2 botones ocultos (el resto tienen carne fiesta!).',
    ],
    triggers: [
      { x: 10, y: 19, kind: 'step', action: { type: 'warp', to: 'galdar', x: 22, y: 5, dir: 'down' } },
      { x: 8, y: 7, kind: 'interact', action: { type: 'text', lines: ['COCINA DEL GUACHINCHE (Lider Bentejui). Abre los 2 cerrojos pulsando los dos botones escondidos en mesas contiguas!'] } },
    ],
  },

  parrandero: {
    id: 'parrandero',
    name: 'Centro Parrandero',
    rows: [
      '#WHH#>WM##',
      '#.......P#',
      '#CCCCC...#',
      '#........#',
      '#......T.#',
      '#........#',
      '#P......P#',
      '#........#',
      '####D#####',
    ],
    legend: { ...INTERIOR, H: 'parranda', M: 'machine', C: 'counter', T: 'table', '>': 'stairs' },
    npcs: [
      { id: 'chaxiraxi', sprite: 'chaxiraxi', x: 3, y: 1 },
      { id: 'tio_suso', sprite: 'parrandero', x: 6, y: 4 },
    ],
    triggers: [
      { x: 4, y: 8, kind: 'step', action: { type: 'exitParrandero' } },
      // Escalera del fondo: sube al Club del Cable (2ª planta), solo para campeones.
      { x: CABLE_STAIRS_1F.x, y: CABLE_STAIRS_1F.y, kind: 'step', action: { type: 'cableStairs' } },
      { x: 7, y: 0, kind: 'interact', action: { type: 'openPC' } },
      { x: 7, y: 4, kind: 'interact', action: { type: 'text', lines: ['Mesa parrandera: hay gofio amasado, queso tierno y un porron de vino del pais.'] } },
    ],
  },

  colegio: {
    id: 'colegio',
    name: 'Patio del Colegio (Recreo)',
    rows: [
      '#WWJ##JWW#',
      '#...oo...#',
      '#..cccc..#',
      '#..cccc..#',
      '#..cccc..#',
      '#..cccc..#',
      '#h......M#',
      '#........#',
      'ffffDfffff',
    ],
    legend: {
      ...INTERIOR, J: 'colegio', c: 'court', o: 'hoop', h: 'bench', M: 'table', f: 'fence',
    },
    npcs: [
      { id: 'conserje', sprite: 'conserje', x: 1, y: 7 },
      { id: 'chinijo_a', sprite: 'chinijo', x: 3, y: 4, schoolKid: 0 },
      { id: 'chinijo_b', sprite: 'chinija', x: 6, y: 4, schoolKid: 1 },
    ],
    triggers: [
      { x: 4, y: 8, kind: 'step', action: { type: 'exitSchool' } },
      { x: 8, y: 6, kind: 'interact', action: { type: 'text', lines: ['Poyo del recreo: medio bocata de chorizo Teror en papel albal y un tazo roido.'] } },
      { x: 4, y: 1, kind: 'interact', action: { type: 'text', lines: ['Canasta del patio sin red. El aro esta doblado de colgarse los de sexto.'] } },
    ],
  },
};

export const DIALOGUE = {
  yeray_first: [
    'YERAY: Chacho loco! Yo que tu no salia a OFRA asi como vas...',
    'YERAY: Cruza para LA CANDELARIA (el hospital) y elige tu CARTA INICIAL.',
    'YERAY: Sal a la calle, tira pal OESTE hasta WEYLER y coge el tranvia Linea 1. Pregunta por el profesor ACAYMO.',
    'Yeray se mete en el 3o B. Libre el paso.',
  ],
  yeray_again: ['YERAY: Pal oeste, chacho! Al este solo esta el muelle y el agua.'],
  acaymo_intro: [
    'ACAYMO: Epa! Tu debes ser el guirufo nuevo.',
    'ACAYMO: Aqui jugamos con TIERRAS canarias (Volcan, Charco, Laurisilva, Playa y Malpais). Robas 7 y lo que muere, muerto se queda.',
    'ACAYMO: Mira las tres cartas del mostrador, elige una y probamos tu mazo promocional en la mesa.',
  ],
  acaymo_after_battle: [
    'ACAYMO: Ños, nada mal pa ser tu primer dia en Tenerife!',
    'ACAYMO: Ahora hazme un favor: el CHINO DE TACO me tiene un pedido guardado.',
    'ACAYMO: Sal del hospital, sigue pal OESTE, cruza el puente sobre la TF-5 y llegas a Taco. Ni se te ocurra abrir la caja.',
  ],
  acaymo_pending: ['ACAYMO: Sigue pal OESTE, cruza el puente de la TF-5 y pidele mi paquete al Chino de Taco.'],
  acaymo_delivery: [
    'Acaymo rasga la caja delante tuyo. Saca un tutu rosa, unas alitas con purpurina y una peluca rubia.',
    'ACAYMO: Ños, ahora si, el tutu, las alitas y la peluca ya estoy listo para la cabalgata anunciadora, hasta luego pibe!',
    'Acaymo sale pitando por la puerta de atras dandose aire con las alitas.',
  ],
  bencomo_arrival: [
    'BENCOMO: ...No me mires asi, soy Bencomo, el becario. Cada carnaval me hace la misma.',
    'BENCOMO: Toma la MAGODEX: una libreta de resorte pa ir apuntando los magomones que veas.',
    'BENCOMO: Y una fotocopia de la RUTA DEL BUEN YANTAR con 8 guachinches. Gana a sus LIDERES pa sacar los 8 BOLICHES e ir al ALTO MANDO.',
    'BENCOMO: Pal primero vuelve a WEYLER (al este) y sube TO TIESO PARRIBA por Ramon y Cajal hasta el GUACHINCHE-TRUCK en el parking de la ULL!',
    'BENCOMO: Truco de local: si te quedas corto de cartas, CUELATE EN LOS COLEGIOS a jugar con los chinijos del patio (son repetibles!).',
  ],
  bencomo_again: [
    'BENCOMO: Sube desde WEYLER hasta el Guachinche-Truck de la ULL (Gym #1), y si te faltan cartas cuelate en los colegios del camino!',
  ],
  chino_give: [
    'CHINO: Ah, el pedido de Acaymo! Toma, pesa poco pero brilla mucho.',
    'CHINO: Vuelve pal ESTE cruzando el puente de la TF-5 hasta La Candelaria.',
  ],
  chino_none: ['CHINO: Buenas, jefe. Si buscas un pedido especial, solo entrego con encargo del profe Acaymo.'],
  chino_have: ['CHINO: Llevaselo a Acaymo en La Candelaria, pal este cruzando la TF-5.'],
  counter_empty: ['Ya tienes tu mazo promocional. Mejor no mangar otro.'],
  ayoze_first: [
    'AYOZE: Buenas, soy Ayoze, el del PC. Lo que no quepa en el mazo (max 60, 4 copias por carta) te lo guardo yo.',
    'AYOZE: En cada sobre eliges UNA de cinco. Si es tu 5a copia de un magomon, puedes EVOLUCIONARLA al vuelo o guardarla en mi PC.',
    'AYOZE: Y si ya te ventilaste a los entrenadores de la calle, cuelate en los COLEGIOS: los ninos del patio juegan infinitas veces!',
  ],
  ayoze_again: [
    'AYOZE: Mi PC va contigo a todas partes: mazo, coleccion y combinador (5 copias = 1 evolucion).',
    '(El PC DE AYOZE está en el menú START.)',
  ],
  chaxiraxi_heal: [
    'CHAXIRAXI: Bienvenido al Centro Parrandero, mi nino! Dejame aca ese mazo.',
    'Tin-tin-tin-ta-TIIIIN! Chaxiraxi te plancha las fundas y te sirve un barraquito con limon y canela.',
    'CHAXIRAXI: Listo! Ya tienes este Centro Parrandero fichado y el azucar arriba.',
  ],
  tio_suso: [
    'TIO SUSO: (rasgueando el timple) Dos reglas sagradas del archipielago, mi nino:',
    'TIO SUSO: A cero duros peleas SIN RIESGO, y si te faltan sobres cuelate en el patio de un COLEGIO: los chinijos nunca se cansan!',
  ],
  subida_locked: [
    'Un operario con un cono te frena en seco.',
    'OPERARIO: Chacho, ande vas subiendo Ramon y Cajal sin libreta ni Ruta del Buen Yantar? Termina primero en LA CANDELARIA (al oeste).',
  ],
  anaga_locked: [
    'Una estudiante con paraguas te corta el paso.',
    'ESTUDIANTE: Vas pa San Benito y Anaga sin el primer Boliche?! Habla con DOMINGO ahi mismo en el Guachinche-Truck del parking!',
  ],
  domingo_post: [
    'DOMINGO: Ya tienes mi BOLICHE DEL CARNE FIESTA, titan! Ahora sal del campus por el NORTE hacia SAN BENITO.',
    'DOMINGO: De San Benito tira TO RECTO AL ESTE a LAS MERCEDES, sube por la CARRETERA GENERAL (noreste), cruza LLANO DE LOS VIEJOS, baja las VUELTAS DE TAGANANA y llegas al Gym #2 en TAGANANA!',
  ],
  pedro_closed: [
    'PEDRO: (rasgueando la guitarra con mirada intensa) Ay, muchacho... CATHAYSA no esta. El gimnasio esta cerrado.',
    'PEDRO: "Cathaysa, la nina guanche, no vera mas Taganana..." Se fue hacia el mar, alla abajo en la playa de ALMACIGA (al este).',
    'PEDRO: Baja a ALMACIGA a sacarla del agua antes de que me inspire otro disco doble en directo!',
  ],
  pedro_after: [
    'PEDRO: (afinando el mi menor) "...y volvio en cholas con olor a salitre..." No me mires asi, que a mi me sonaba poetico! Habla con Cathaysa ahi al lado.',
  ],
  gym2_open_door: [
    'LA OLA DE TAGANANA (Gimnasio #2). Cathaysa esta aqui mismo en la puerta esperandote con la tabla!',
  ],
  cathaysa_surf_prompt: [
    'CATHAYSA: (desde la rompiente) EPAAA! Una olita mas y salgo, lo juro!! ...Uy, chacho, que me trinco el invento en la baja y la corriente tira pa fuera!',
    'CATHAYSA: Eh, tu, el guirufo de las cholas! Echame una mano pa salir del agua como si yo fuera Bill el del PC!',
  ],
  cathaysa_rescue_rope: [
    'Agarras el cabo amarrado a la roca, tiras con alma de guirufo quemao y una ola te empapa hasta los calcetines...',
    'PLAF! Cathaysa sale disparada a la arena negra haciendo un aereo perfecto con la tabla bajo el brazo!',
    'CATHAYSA: Ñooos, que rescate, mi nino! Y seguro que arriba estaba Pedro dandole a la guitarra dramatico perdido!',
    'CATHAYSA: Que vienes a por el Boliche del Gimnasio #2?! Tira pa TAGANANA (al oeste), que subo corriendo a abrirte!',
  ],
  cathaysa_rescue_papas: [
    'Te pones las manos de bocina y gritas: "CATHAYSAAA, QUE PEDRO ESTA CANTANDO OTRA VEZ EN LA PUERTA DEL GYM!!"',
    'Cathaysa rema a 45 nudos, parte una ola en dos y clava la tabla en la arena negra en uno coma tres segundos.',
    'CATHAYSA: OTRA VEZ CON LA CANCIONCITA?! Menos mal que me avisaste, pibe! Tira pa TAGANANA (al oeste), que abro el Gimnasio #2 ahora mismo!',
  ],
  cathaysa_after_gym: [
    'CATHAYSA: Fuerte paliza me diste, pibe! Ya tienes dos Boliches: el siguiente gimnasio esta en las CUEVAS PINTADAS DE GALDAR.',
    'CATHAYSA: El problema es que la carretera a SAN ANDRES esta cortada porque el TEAM ENRISCADA abrio todo el piche buscando algo.',
    'CATHAYSA: Asi que baja a BENIJO (siguiendo la costa al ESTE, pasando Almaciga). Alli hay un CAYUQUERO, Carmelo: dile que vas de mi parte y te lleva!',
  ],
  enriscada_1: [
    'RECLUTA ENRISCADA: Alto ahi, guirufo! La carretera a SAN ANDRES esta cortadisima!',
    'RECLUTA ENRISCADA: El TEAM ENRISCADA levanto tres kilometros de piche buscando una reliquia guanche... y de momento solo hemos encontrado una tuberia del agua y tres cholas del 94.',
  ],
  enriscada_2: [
    'RECLUTA ENRISCADA: El jefe dijo "caven debajo del piche de San Andres". Llevo desde el martes dandole al pico y tengo las manos en carne viva!',
    'RECLUTA ENRISCADA: Si quieres salir de Taganana por mar, buscate la vida en BENIJO, al este!',
  ],
  carmelo_wait: [
    'CARMELO: Buenas, mi nino. Estoy aqui en BENIJO amarrando el fueraborda del cayuco con alambre dulce y dos rezos.',
    'CARMELO: Si buscas a Cathaysa la del gimnasio, seguro que esta metida en el agua en ALMACIGA. Cuando le ganes el Boliche hablamos.',
  ],
  carmelo_offer: [
    'CARMELO: Que vienes de parte de Cathaysa pa cruzar a GALDAR porque el Team Enriscada abrio el piche de San Andres?!',
    'CARMELO: Yo te llevo, mi nino! Mira que joya: cayuco de chapas remachadas y un fueraborda dos tiempos que ruge a 120 decibelios!',
    'CARMELO: El mar esta un fisco picao y el motor echa un humillo curioso, pero en un salto te planto en Galdar. Subes?',
  ],
  cayuco_arrival: [
    'Te limpias la boca temblando en el muelle de Galdar, con el pitido de 120dB aun taladrandote el oido y olor a gasolina mezcla en las cejas...',
    'TU: ...Chacho, hasta el Armas se mueve menos.',
    '...',
    'Te quedas congelado en mitad del muelle. De donde demonios acaba de salir esa frase?!',
    'Hace nada eras un guirufo desempacando cajas en Santa Cruz... te estas volviendo un poco canario?!',
  ],
  // --- GALDAR, S.S. OLSEN & GUACHINCHE CUEVAS PINTADAS ---
  canarion_closed: [
    'CANARION: Merameneño, aqui por mucho boliche que traigas no te dejamos pasar ni jartos grifa, ni aunque traigas fleje guita, ni nada, asi que vete a buscarte unas roscah y sientate en un banco que de pie te cansas, que aqui hasta landon no abremoh.',
    'TU: ...Ok, quizas no era tan canario. Voy a ver si abajo en el muelle alguien tiene un traductor.',
  ],
  canarion_open: [
    'CANARION: Pasa pa dentro, mi nino. Que conseguiste un traductor en el barco? Que va, chacho: esto esta abierto porque YA SON LAS DOS ("landon"), no porque tu hayas encontrado nada, no se te vayan a subir los humos!',
  ],
  oficial_olsen_closed: [
    'OFICIAL OLSEN: El fast-ferry S.S. OLSEN esta en escala tecnica. Solo dejamos subir a bordo por emergencia maritima o linguistica. Sube primero las curvas hacia GALDAR.',
  ],
  oficial_olsen_open: [
    'OFICIAL OLSEN: Que arriba en las Cuevas Pintadas te soltaron un "merameneño" cerrado y buscas un TRADUCTOR? Pasa al S.S. OLSEN, el Capitan habla hasta silbo!',
  ],
  viajero_frio: [
    'PASAJERO: Chacho, en el S.S. Olsen ponen el aire acondicionado tan fuerte que entras en bermudas en Agaete y sales hecho un calipo de lima en Santa Cruz!',
  ],
  capitan_mareado: [
    'CAPITAN: Ufff... bluurgh... Que fatiga mas mala, mi nino... Treinta anos cruzando el canal a 38 nudos en el S.S. Olsen y me vengo a marear atracado en el muelle...',
    'CAPITAN: Dame unas friegas en el lomo como al Capitan del S.S. Anne, hazme esa caridad...',
    'Le frotas la espalda al Capitan con brio. CRAC-CRAC! El Capitan recupera el color al instante!',
    'CAPITAN: Mano de santo, pibe! Buscabas un TRADUCTOR pa entender al portero de las Cuevas Pintadas? Toma mi glosario canarion de bolsillo!',
    'TRADUCTOR: "Merameneño" = Mira mi nino · "Fleje guita" = Mucho dinero · "Roscah" = Cotufas · "Hasta landon" = ...HASTA LAS DOS DE LA TARDE!!',
    'BOOOOM! Suena la bocina del S.S. Olsen marcando las 14:00 (LAS DOS). Ya habran abierto las Cuevas Pintadas arriba en Galdar!',
  ],
  capitan_curado: [
    'CAPITAN: Ya estoy como una rosa, mi nino! Sube otra vez las Curvas del Demonio: como ya son las dos ("landon"), las Cuevas Pintadas estaran abiertas!',
  ],
  arqueologo_cueva: [
    'ARQUEOLOGO: (llorando bajito) Diez anos excavando las CUEVAS PINTADAS con pincelito... y montan dentro un GUACHINCHE DE VERDAD con calderos de carne fiesta y cuarto de vino!',
  ],
  camarero_cueva: [
    'CAMARERO: Bienvenido al Guachinche de las Cuevas Pintadas! El jefe Bentejui se encerro en LA COCINA con dos cerrojos electricos.',
    'CAMARERO: Hay 15 mesas: DOS contiguas tienen botones escondidos bajo el mantel y EL RESTO TIENEN CARNE FIESTA. Si fallas el segundo boton, se resetean los cerrojos!',
  ],
  bentejui_post: [
    'BENTEJUI: Ya llevas TRES BOLICHES en la faja, merameneño! Como el S.S. Olsen ya zarpo, baja al muelle y vuelve a BENIJO en el CAYUCO de Carmelo!',
    'BENTEJUI: Un primo mio mecanico te espera en Benijo con el M.O. 1 TODO TERRENO pa que pases los baches a SAN ANDRES y bajes al PALMETUM!',
  ],
  vecino_rc: ['SEÑOR: Uf... puf... "tira to tieso parriba", decian. Ramon y Cajal convalida como dia de pierna.'],
  est_ull: ['UNIVERSITARIA: Campus Central de la ULL! A la derecha tienes a DOMINGO en el Guachinche-Truck (Gym #1), y al norte se sale pa SAN BENITO y ANAGA.'],
  vecina_mercedes: [
    'DOÑA SABINA: Las Mercedes... la puerta de Anaga. Lo vi en el poso del café antes de que me preguntaras, guirufo.',
    'DOÑA SABINA: Sigue la Carretera General al NORESTE: pasas el Llano de los Viejos, bajas las Vueltas y caes en Taganana. La montaña te está esperando.',
    'DOÑA SABINA: Y si en el guachinche del fondo ves brillar una bola de cristal, no te asustes: es mi voz la que te espera sentada en la mesa.',

  ],
  abuela_taganana: ['DOÑA NIEVES: Ay, Cathaysa dejo a Pedro cantando en la puerta del gimnasio pa irse a surfear a ALMACIGA! Y encima el Team Enriscada abrio el piche pa San Andres!'],
};
