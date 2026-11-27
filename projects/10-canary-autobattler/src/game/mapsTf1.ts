import { STATION } from './nightRoute';
// ==================================================================
// LA "RUTA BICI" CANARIA: AUTOPISTA TF-1 SUR (160x24) EN TOYOTA LANDCRUISER
// + TERMINAL DEL AEROPUERTO TENERIFE SUR (REINA SOFIA) CON LA M.O. 2 BINTER
//
// Recorrido ESTE (x=159, Santa Cruz) -> OESTE (x=0, entrada a Adeje, en obras):
//   1. Km 0  · Incorporacion S/C - Anaza (x=142..159)
//   2. Km 17 · Candelaria: Basilica + Estatuas de los Menceyes (x=114..141)
//   3. Km 42 · Parque Eolico de Abades: mar de aerogeneradores + faro (x=82..113)
//   4. Km 56 · Montana Roja y Playa de El Medano + kitesurf (x=54..81)
//   5. Km 60 · Aeropuerto Tenerife Sur (TFS): parking, C.P. y Terminal con M.O. 2 Binter (x=22..53)
//   6. Km 78 · Llegada a Costa Adeje (corte iterativo en x=3) (x=0..21)
// MAR AL SUR (y=21..23) en toda la autopista, coherente con el resto del mapa.
// ==================================================================

import type { GameMap, MapId, Trigger } from './maps';
import type { TileId } from './sprites';
import { STORY } from './story';

export interface Tf1Vehicle {
  id: string;
  kind: 'guagua' | 'caddy';
  variant?: 'reparto' | 'escalera' | 'camper';
  x: number;
  y: number;
  w: number;
  h: number;
  trainer: string;
  /** Casilla en el carril contiguo donde te pitan al pasar si aun no les ganaste. */
  honkX: number;
  honkY: number;
}

/** Guaguas de TITSA (3x2) y furgonetas VW Caddy (2x1) repartidas por la TF-1. */
export const TF1_VEHICLES: readonly Tf1Vehicle[] = [
  { id: 'v_caddy_anaza', kind: 'caddy', variant: 'reparto', x: 145, y: 11, w: 2, h: 1, trainer: 'caddy_anaza', honkX: 145, honkY: 12 },
  { id: 'v_guagua_cand', kind: 'guagua', x: 126, y: 12, w: 3, h: 2, trainer: 'guagua_candelaria', honkX: 127, honkY: 11 },
  { id: 'v_caddy_abades', kind: 'caddy', variant: 'escalera', x: 104, y: 10, w: 2, h: 1, trainer: 'caddy_abades', honkX: 104, honkY: 11 },
  { id: 'v_guagua_abades', kind: 'guagua', x: 89, y: 12, w: 3, h: 2, trainer: 'guagua_abades', honkX: 90, honkY: 11 },
  { id: 'v_caddy_medano', kind: 'caddy', variant: 'camper', x: 71, y: 13, w: 2, h: 1, trainer: 'caddy_medano', honkX: 71, honkY: 12 },
  { id: 'v_guagua_medano', kind: 'guagua', x: 58, y: 10, w: 3, h: 2, trainer: 'guagua_medano', honkX: 59, honkY: 12 },
  { id: 'v_guagua_aero', kind: 'guagua', x: 43, y: 12, w: 3, h: 2, trainer: 'guagua_aeropuerto', honkX: 44, honkY: 11 },
  { id: 'v_caddy_adeje', kind: 'caddy', variant: 'escalera', x: 14, y: 11, w: 2, h: 1, trainer: 'caddy_adeje', honkX: 14, honkY: 12 },
];

/** Cono volcanico de Montana Roja (4x2 tiles) en la costa de El Medano. */
export const MONTANA_ROJA_POS = { x: 62, y: 17, w: 4, h: 2 };
/** Avion turbohelice ATR-72 de Binter (4x2 tiles) en la plataforma del Aeropuerto TFS. */
export const BINTER_PLANE_POS = { x: 44, y: 2, w: 4, h: 2 };
/** Carreta de Romeria con Yunta de Bueyes cortando la entrada a Adeje en la TF-1 (3x2 tiles). */
export const TF1_ROMERIA_CART_POS = { x: 1, y: 11, w: 3, h: 2 };
/** Carreta de Romeria y Guagua de TITSA aparcadas al final de la Romeria en la Estacion de Las Americas. */
export const AMER_CARRETA_POS = { x: 11, y: 12, w: 3, h: 2 };
export const AMER_GUAGUA_POS = { x: 6, y: 5, w: 3, h: 2 };

export function tf1VehicleAt(x: number, y: number): Tf1Vehicle | undefined {
  return TF1_VEHICLES.find((v) => x >= v.x && x < v.x + v.w && y >= v.y && y < v.y + v.h);
}

export const TF1_W = 160;
export const TF1_H = 24;
export const CANDELARIA_ORILLA = { x: 136, y: 18 } as const;
export const CALETILLAS_DESEMBARCO = { x: 142, y: 18 } as const;
export const CALETILLAS_RECORTE = { left: 137, right: 154, top: 16, bottom: 20 } as const;
const UNELCO_CARD = { x: 148, y: 17 } as const;

type Grid = string[][];
const mkGrid = (w: number, h: number, fill: string): Grid =>
  Array.from({ length: h }, () => Array<string>(w).fill(fill));
const put = (g: Grid, x0: number, y0: number, x1: number, y1: number, c: string) => {
  for (let y = Math.max(0, y0); y <= Math.min(g.length - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(g[0].length - 1, x1); x++) g[y][x] = c;
  }
};

const TF1_LEGEND: Record<string, TileId> = {
  a: 'arid', R: 'road', X: 'crosswalk', K: 'parking', C: 'car', G: 'guardrail',
  F: 'fence', s: 'sidewalk', Z: 'plaza', B: 'building', W: 'window', D: 'door',
  H: 'parranda', T: 'sign', O: 'monument', P: 'palm', E: 'tree', h: 'bench',
  L: 'rail', n: 'blacksand', u: 'surf', '~': 'sea', Y: 'turbine', M: 'redrock',
  '=': 'runway', Q: 'dish', V: 'ravine', S: 'stairs', A: 'machine', U: 'card', o: 'roque',
};

const AIRPORT_LEGEND: Record<string, TileId> = {
  '#': 'wall', i: 'tiles', '.': 'floor', D: 'door', W: 'window', P: 'plant',
  C: 'counter', h: 'bench', T: 'sign', A: 'machine', b: 'board', m: 'mat', X: 'box',
};

function buildTf1(): string[] {
  const g = mkGrid(TF1_W, TF1_H, 'a');

  // ---- CUMBRE Y BARRANCOS DEL SUR AL NORTE (y=0..1) ----
  put(g, 0, 0, TF1_W - 1, 1, 'V');
  // ---- OCEANO ATLANTICO AL SUR (y=21..23) ----
  put(g, 0, 20, TF1_W - 1, 20, 'n');
  put(g, 0, 21, TF1_W - 1, 21, 'u');
  put(g, 0, 22, TF1_W - 1, 23, '~');

  // ---- CALZADA DE LA AUTOPISTA TF-1 (5 carriles: y=10..14) + BIONDAS (y=9 y y=15) ----
  put(g, 3, 9, TF1_W - 1, 9, 'G');
  put(g, 3, 10, TF1_W - 1, 14, 'R');
  put(g, 3, 15, TF1_W - 1, 15, 'G');
  // Marcas viales de referencia kilometrica cada 12 tiles (transitables en 4x4)
  for (let x = 10; x < TF1_W - 4; x += 14) g[12][x] = 'X';

  // ==================================================================
  // TRAMO 1: KM 0 · SALIDA SANTA CRUZ / AÑAZA (x=142..159)
  // ==================================================================
  for (const x of [146, 151, 156]) { g[7][x] = 'P'; g[17][x] = 'P'; }
  put(g, 148, 3, 155, 5, 'B');
  g[4][150] = 'W'; g[4][153] = 'W';
  g[9][154] = 'T'; // cartel Km 0 TF-1

  // ==================================================================
  // TRAMO 2: KM 17 · CANDELARIA (BASILICA + MENCEYES GUANCHES) (x=114..141)
  // ==================================================================
  // Laderas del Valle de Güimar / Candelaria al norte
  for (const [x, y] of [[118, 4], [124, 6], [130, 4], [136, 6]]) g[y][x] = 'P';
  put(g, 125, 3, 133, 5, 'B');
  g[4][127] = 'W'; g[4][131] = 'W';
  // Apartadero sur (K) para parar a ver la Basilica y los Menceyes
  put(g, 131, 15, 134, 15, 'K');
  put(g, 118, 16, 136, 19, 'Z');
  put(g, 118, 20, 136, 20, 'L'); // paseo maritimo de Candelaria
  // Basilica blanca de Nuestra Señora de Candelaria + campanario
  put(g, 120, 16, 125, 18, 'B');
  g[17][121] = 'W'; g[17][123] = 'W'; g[18][124] = 'D';
  g[16][119] = 'O'; // torre campanario
  // Hilera iconica de Estatuas de los Menceyes Guanches frente al Atlantico
  for (const mx of [127, 129, 131, 133, 135]) g[19][mx] = 'O';
  g[16][127] = 'T'; // cartel Basilica
  g[16][132] = 'T'; // cartel Menceyes
  g[15][130] = 'T'; // cartel desde el coche
  // Salida norte desde el apartadero; respeta la ensenada de Caletillas al este.
  put(g, 133, 0, 134, 9, 'R');
  for (let y = 9; y <= 15; y++) g[y][133] = 'X';
  g[15][134] = 'T';

  // El barranco corta el paseo; la ensenada se cruza recto al este, sin salir a altamar.
  const { left, right, top, bottom } = CALETILLAS_RECORTE;
  const landX = CALETILLAS_DESEMBARCO.x;
  put(g, left, top, landX - 1, 17, 'V');
  put(g, left, 18, landX - 1, bottom, 'u');
  g[20][138] = 'o'; g[20][140] = 'o';
  g[17][136] = 'T';
  g[CANDELARIA_ORILLA.y][CANDELARIA_ORILLA.x] = 'S';

  put(g, landX, top, right, bottom, 'F');
  put(g, landX + 1, top + 1, right - 1, bottom - 1, 's');
  g[CALETILLAS_DESEMBARCO.y][landX] = 'S';
  put(g, 145, 16, 151, 17, 'B');
  for (const x of [146, 150]) g[17][x] = 'W';
  g[17][143] = 'T';
  for (const x of [145, 150, 152]) g[19][x] = 'A';
  g[UNELCO_CARD.y][UNELCO_CARD.x] = 'U';

  // ==================================================================
  // TRAMO 3: KM 42 · AEROGENERADORES DE ABADES / ARICO (x=82..113)
  // ==================================================================
  // Gran campo de aerogeneradores girando a ambos lados de la TF-1!
  for (let x = 84; x <= 112; x += 4) {
    g[3][x] = 'Y';
    g[6][x + 1] = 'Y';
    g[8][x] = 'Y';
  }
  for (let x = 85; x <= 111; x += 5) {
    g[17][x] = 'Y';
  }
  // Casitas blancas de Abades + viejo faro/sanatorio en la punta sur
  put(g, 92, 17, 97, 18, 'B');
  g[17][93] = 'W'; g[17][96] = 'W';
  g[19][84] = 'O'; // Faro de Punta de Abades
  g[9][100] = 'T'; // cartel Parque Eolico de Abades
  g[15][95] = 'T'; // cartel Abades y Faro

  // ==================================================================
  // TRAMO 4: KM 56 · MONTAÑA ROJA Y PLAYA DE EL MEDANO (x=54..81)
  // ==================================================================
  // Laderas aridas con algun molino suelto al norte
  for (const x of [58, 66, 74]) g[5][x] = 'Y';
  // Apartadero mirador de El Medano (sur)
  put(g, 74, 15, 76, 15, 'K');
  put(g, 56, 16, 79, 20, 'n'); // gran arenal ventoso de El Medano + La Tejita
  // Base rocosa junto al prop de Montana Roja (62..65, 17..18)
  put(g, 60, 18, 61, 19, 'M');
  put(g, 66, 18, 67, 19, 'M');
  g[16][70] = 'P'; g[16][77] = 'P';
  g[15][73] = 'T'; // cartel Montana Roja / El Medano (legible desde la TF-1)
  g[16][75] = 'T'; // cartel en la arena

  // ==================================================================
  // TRAMO 5: KM 60 · AEROPUERTO TENERIFE SUR — REINA SOFIA (x=22..53)
  // ==================================================================
  // Pista de aterrizaje 07/25 al norte + plataforma con el Binter ATR-72 + torre de control
  put(g, 22, 0, 52, 1, '=');
  put(g, 23, 2, 52, 3, 's');
  g[3][50] = 'Q'; g[3][51] = 'B'; // torre de control TFS
  put(g, 23, 4, 24, 8, 'F');
  put(g, 43, 4, 52, 4, 'F'); // valla de seguridad de pista (se ve el Binter detras!)
  // Edificio Terminal TFS + Centro Parrandero La Reina
  put(g, 25, 4, 42, 5, 'B');
  g[4][28] = 'H'; g[5][28] = 'D'; // C.P. Aeropuerto TFS
  for (const wx of [26, 30, 32, 38, 40, 41]) g[4][wx] = 'W';
  g[5][35] = 'D'; g[5][36] = 'D'; // Puertas correderas Terminal TFS (M.O. 2 Binter!)
  // Acera peatonal de llegadas/salidas (y=6)
  put(g, 25, 6, 42, 6, 's');
  g[6][26] = 'P'; g[6][41] = 'P';
  g[6][29] = 'T'; // cartel C.P.
  g[6][33] = 'T'; // cartel Terminal TFS / Binter
  // Parking asfaltado del Aeropuerto (y=7..8) + carril de salida desde la TF-1 (y=9)
  put(g, 25, 7, 42, 8, 'K');
  g[7][26] = 'C'; g[7][41] = 'C';
  put(g, 33, 9, 38, 9, 'K'); // rampa amplia de entrada/salida al parking desde la TF-1
  g[9][39] = 'T'; // cartel Salida 59 Aeropuerto TFS en la autopista
  // Costa de Los Abrigos / Golf del Sur al sur
  put(g, 30, 17, 35, 18, 'B');
  g[17][32] = 'W'; g[18][28] = 'P'; g[18][38] = 'P';

  // ==================================================================
  // TRAMO 6: KM 78 · LLEGADA A COSTA ADEJE (FRONTERA ITERATIVA) (x=0..21)
  // ==================================================================
  // Roque del Conde / Guaza al norte y palmeras de Los Cristianos - Adeje al sur
  put(g, 6, 3, 12, 5, 'M');
  for (const x of [5, 9, 13, 18]) { g[7][x] = 'P'; g[17][x] = 'P'; }
  // Valla de corte en obras de Adeje en x=0..2 (desarrollo iterativo!)
  put(g, 0, 8, 2, 16, 'F');
  g[9][5] = 'T';  // cartel Salida 78 Adeje
  g[12][2] = 'T'; // cartel de obras en el cierre

  return g.map((r) => r.join(''));
}

// ------------------------------------------------------------------
// TERMINAL AEROPUERTO TENERIFE SUR — REINA SOFIA (24x16)
// Mostrador de Binter Canarias + Dona Maruca regalando la M.O. 2!
// ------------------------------------------------------------------
function buildAeropuerto(): string[] {
  const AW = 24, AH = 16;
  const g = mkGrid(AW, AH, 'i');
  put(g, 0, 0, AW - 1, 1, '#');
  put(g, 0, AH - 1, AW - 1, AH - 1, '#');
  put(g, 0, 0, 0, AH - 1, '#');
  put(g, AW - 1, 0, AW - 1, AH - 1, '#');

  // Puertas automaticas sur (salida al parking de la TF-1)
  g[AH - 1][11] = 'D'; g[AH - 1][12] = 'D';
  g[AH - 2][11] = 'm'; g[AH - 2][12] = 'm';

  // Ventanales panoramicos a pista + Paneles de vuelos Binter
  for (const wx of [3, 5, 18, 20]) g[1][wx] = 'W';
  g[1][9] = 'b'; g[1][11] = 'b'; g[1][13] = 'b'; g[1][15] = 'b';

  // Mostrador central de facturacion BINTER CANARIAS
  put(g, 8, 4, 15, 4, 'C');
  g[4][7] = 'T'; g[4][16] = 'P';

  // Izquierda: Duty Free (torres de Ambrosias Tirma y ron miel)
  put(g, 2, 5, 5, 8, '.');
  g[5][2] = 'A'; g[5][3] = 'X'; g[5][4] = 'X'; g[5][5] = 'T';

  // Derecha: Cinta de recogida de maletas y puerta de embarque interinsular
  put(g, 18, 6, 21, 9, '.');
  g[6][19] = 'A'; g[6][20] = 'A'; g[6][18] = 'T';

  // Bancos de espera y palmeras de terminal
  g[9][9] = 'h'; g[9][14] = 'h';
  g[12][4] = 'P'; g[12][19] = 'P';
  g[12][7] = 'h'; g[12][16] = 'h';

  return g.map((r) => r.join(''));
}

function buildTf1Triggers(): Trigger[] {
  const out: Trigger[] = [
    // ---- Vuelta al ESTE hacia Santa Cruz Sur (Av. Anaga / Recinto Ferial) ----
    ...[10, 11, 12, 13, 14].map((ry) => ({
      x: TF1_W - 1, y: ry, kind: 'step' as const,
      action: { type: 'warp' as const, to: 'santacruz_sur' as const, x: 2, y: 9, dir: 'right' as const },
    })),

    // ---- Centro Parrandero y Puertas de la Terminal del Aeropuerto TFS ----
    { x: 28, y: 5, kind: 'step', action: { type: 'enterParrandero', id: 'aeropuerto' } },
    { x: 29, y: 6, kind: 'interact', action: { type: 'text', lines: ['CENTRO PARRANDERO LA REINA (TFS). Barraquito a precio normal (no de aeropuerto!) y PC de Ayoze.'] } },
    { x: 35, y: 5, kind: 'step', action: { type: 'enterAeropuerto' } },
    { x: 36, y: 5, kind: 'step', action: { type: 'enterAeropuerto' } },
    { x: 33, y: 6, kind: 'interact', action: { type: 'text', lines: ['✈️ TERMINAL AEROPUERTO TENERIFE SUR (REINA SOFIA). Mostrador de Binter Canarias en el hall central!'] } },

    // ---- Entrada a ADEJE al OESTE cortada por la ROMERIA (toca el Bucio para unirte!) ----
    ...[10, 11, 12, 13, 14].map((ry) => ({
      x: 4, y: ry, kind: 'step' as const,
      action: { type: 'romeriaBlockade' as const },
    })),
    { x: 3, y: 10, kind: 'interact', action: { type: 'romeriaBlockade' } },
    { x: 3, y: 13, kind: 'interact', action: { type: 'romeriaBlockade' } },
    { x: 5, y: 9, kind: 'interact', action: { type: 'romeriaBlockade' } },

    // ---- Carteles iconicos a lo largo de la TF-1 ----
    { x: 154, y: 9, kind: 'interact', action: { type: 'text', lines: STORY.tf1_sign_open } },
    { x: 130, y: 15, kind: 'interact', action: { type: 'text', lines: STORY.tf1_candelaria } },
    { x: 127, y: 16, kind: 'interact', action: { type: 'text', lines: STORY.tf1_candelaria } },
    { x: 132, y: 16, kind: 'interact', action: { type: 'text', lines: STORY.tf1_menceyes } },
    { x: 134, y: 15, kind: 'interact', action: { type: 'text', lines: ['↑ BARRANCO HONDO. Sigue al norte desde Candelaria. En el cruce, al este queda El Rosario.'] } },
    ...[133, 134].map(x => ({ x, y: 0, kind: 'step' as const, action: { type: 'warp' as const, to: 'barranco_hondo' as const, x: x - 129, y: 16, dir: 'up' as const } })),
    { x: 136, y: 17, kind: 'interact', action: { type: 'text', lines: STORY.caletillas_shore_sign } },
    { ...CALETILLAS_DESEMBARCO, kind: 'step', action: { type: 'zone', name: 'SUBESTACION DE CALETILLAS' } },
    { x: 143, y: 17, kind: 'interact', action: { type: 'text', lines: ['SUBESTACION DE CALETILLAS. Un zumbido sordo sale de los transformadores.'] } },
    { ...UNELCO_CARD, kind: 'interact', action: { type: 'pickupUnelco' } },
    { x: 100, y: 9, kind: 'interact', action: { type: 'text', lines: STORY.tf1_abades } },
    { x: 95, y: 15, kind: 'interact', action: { type: 'text', lines: STORY.tf1_faro_abades } },
    { x: 73, y: 15, kind: 'interact', action: { type: 'text', lines: STORY.tf1_medano } },
    { x: 75, y: 16, kind: 'interact', action: { type: 'text', lines: STORY.tf1_medano } },
    { x: 39, y: 9, kind: 'interact', action: { type: 'text', lines: STORY.tf1_airport_sign } },
  ];

  // ---- Banners de zona en todos los carriles al recorrer la TF-1 de ESTE a OESTE ----
  const milestones: [number, string][] = [
    [154, 'TF-1 · KM 0 SUR'],
    [136, 'KM 17 · CANDELARIA'],
    [110, 'KM 42 · EOLICO ABADES'],
    [78, 'KM 56 · MONTAÑA ROJA'],
    [66, 'PLAYA DE EL MEDANO'],
    [49, 'KM 60 · AEROPUERTO TFS'],
    [19, 'KM 78 · COSTA ADEJE'],
  ];
  for (const [mx, label] of milestones) {
    for (const ry of [10, 11, 12, 13, 14]) {
      out.push({ x: mx, y: ry, kind: 'step', action: { type: 'zone', name: label } });
    }
  }

  // ---- Pitidos de reto ("Ruta Bici") al pasar pegado a una Guagua TITSA o una VW Caddy ----
  for (const v of TF1_VEHICLES) {
    out.push({
      x: v.honkX,
      y: v.honkY,
      kind: 'step',
      action: { type: 'highwayChallenge', trainer: v.trainer },
    });
  }

  return out;
}

// ------------------------------------------------------------------
// ESTACION DE LAS AMERICAS · FINAL DE LA ROMERIA Y ENTRADA A CIUDAD FUCSIA (ADEJE) (28x18)
// ------------------------------------------------------------------
const SIAM_LEGEND: Record<string, TileId> = {
  '#': 'wall', '.': 'floor', s: 'sidewalk', Z: 'plaza', B: 'building', W: 'window', D: 'door',
  g: 'grass', P: 'palm', E: 'tree', h: 'bench', p: 'path', T: 'sign', O: 'monument',
  n: 'blacksand', '~': 'sea', u: 'tube', S: 'waterslide', w: 'wavepool', '!': 'temple',
  F: 'fence', L: 'rail',
};

function buildSiamPark(): string[] {
  const SW = 52, SH = 24;
  const g = mkGrid(SW, SH, 'g');

  // Muros perimetrales y vegetacion tropical
  put(g, 0, 0, SW - 1, 1, 'E');
  put(g, 0, SH - 2, SW - 1, SH - 1, 'E');
  put(g, 0, 0, 1, SH - 1, 'E');
  put(g, SW - 2, 0, SW - 1, SH - 1, 'E');

  // ---- ENTRADA ESTE (x=45..50, y=12..16) · Puerta hacia Las Americas / Adeje ----
  put(g, 46, 12, 50, 16, 'Z');
  g[11][48] = '!'; g[11][49] = '!'; // Puerta tailandesa ornamental
  g[17][48] = '!'; g[17][49] = '!';
  // The south gate leads back to the north foot of the Magma bridge.
  put(g, 47, 15, 49, 23, 'p');
  g[20][46] = '!'; g[20][50] = '!'; g[21][46] = 'T';
  g[13][47] = 'T'; // Cartel de bienvenida Siam Park
  g[12][45] = 'P'; g[16][45] = 'P';

  // Camino principal empedrado que cruza el parque de este a oeste
  put(g, 15, 13, 46, 15, 'p');

  // ---- ZONA NORTE-ESTE: PISCINA DE LEONES MARINOS (x=34..44, y=3..10) ----
  put(g, 35, 3, 43, 9, '~');
  put(g, 34, 3, 34, 9, 'F');
  put(g, 44, 3, 44, 9, 'F');
  put(g, 35, 10, 43, 10, 's'); // Mirador de leones marinos
  g[10][39] = 'T'; // Cartel Leones Marinos
  g[7][37] = 'P'; g[7][41] = 'P';

  // ---- ZONA NORTE-CENTRO: TORRE DEL PODER + TUNEL DE TIBURONES (x=16..32, y=2..11) ----
  // Tobogan casi vertical (waterslide) que cae en picado hacia el acuario
  put(g, 22, 2, 25, 4, 'S');
  put(g, 23, 5, 24, 7, 'S');
  // Tanque acrilico transparente sumergido con tiburones (tube)
  put(g, 18, 5, 21, 9, '~');
  put(g, 26, 5, 29, 9, '~');
  put(g, 22, 8, 25, 9, 'u'); // Tunel de metacrilato transparente
  put(g, 17, 4, 30, 4, 'F');
  put(g, 17, 10, 30, 10, 's'); // Pasarela de observacion
  g[10][24] = 'T'; // Cartel Torre del Poder & Tanque de Tiburones
  // Cola de la Torre del Poder (Aythami)
  put(g, 20, 11, 23, 12, 'p');

  // ---- ZONA TOBOGAN THE DRAGON (x=28..34, y=16..21) ----
  put(g, 29, 17, 33, 20, 'S');
  g[16][31] = 'T'; // Cartel The Dragon
  put(g, 28, 15, 30, 17, 'p'); // Cola The Dragon (Callum)

  // ---- ZONA OESTE: THE WAVE PALACE (PISCINA DE OLAS GIGANTE) (x=2..15, y=3..21) ----
  // Enorme piscina de olas con cresta de 3 metros
  put(g, 2, 3, 14, 8, 'w');
  put(g, 2, 9, 14, 11, 'w');
  // Gran playa de arena dorada / tumbonas
  put(g, 2, 12, 14, 19, 'n');
  // Tumbonas playeras donde toman el sol los turistas
  g[14][4] = 'h'; g[14][7] = 'h'; g[14][10] = 'h';
  g[16][3] = 'h'; g[16][6] = 'h'; g[16][9] = 'h'; g[16][12] = 'h';
  g[18][5] = 'h'; g[18][11] = 'h';
  // Palmeras tropicales en el arenal
  g[13][2] = 'P'; g[17][2] = 'P'; g[13][13] = 'P'; g[17][13] = 'P';
  g[12][8] = 'T'; // Cartel The Wave Palace & Sirena de Olas
  // Caseta de socorristas (Daura)
  put(g, 12, 18, 14, 20, 'B');
  g[19][13] = 'D';

  // Camino de union oeste
  put(g, 13, 13, 17, 15, 'p');

  return g.map((r) => r.join(''));
}

export const TF1_MAPS: Record<Extract<MapId, 'tf1' | 'aeropuerto' | 'las_americas' | 'siam_park'>, GameMap> = {
  tf1: {
    id: 'tf1',
    name: 'Autopista TF-1 Sur · Candelaria · Abades · Medano · TFS · Adeje',
    rows: buildTf1(),
    legend: TF1_LEGEND,
    npcs: [
      { id: 'operario_adeje', sprite: 'mago_romero', x: 4, y: 9 },
    ],
    triggers: buildTf1Triggers(),
    onEnter: [
      'AUTOPISTA TF-1 DEL SUR! El Toyota Landcruiser del 34 ruge a 95 km/h rumbo a ADEJE como en la Ruta Bici!',
      'Por el camino pasaras CANDELARIA, los AEROGENERADORES DE ABADES, MONTAÑA ROJA / EL MEDANO y el AEROPUERTO TFS.',
      'Ojo con las GUAGUAS DE TITSA y las VW CADDY en mitad de los carriles: ponte al lado y pulsa A (o pasa rozandolas) para retarlas!',
    ],
  },

  aeropuerto: {
    id: 'aeropuerto',
    name: 'Aeropuerto Tenerife Sur · Reina Sofia (TFS)',
    rows: buildAeropuerto(),
    legend: AIRPORT_LEGEND,
    npcs: [
      { id: 'azafata_binter', sprite: 'cathaysa', x: 11, y: 3 },
      { id: 'dona_binter', sprite: 'dona_binter', x: 12, y: 6 },
      { id: 'guiri_aeropuerto', sprite: 'runner', x: 6, y: 10 },
    ],
    triggers: [
      { x: 11, y: 15, kind: 'step', action: { type: 'warp', to: 'tf1', x: 35, y: 6, dir: 'down' } },
      { x: 12, y: 15, kind: 'step', action: { type: 'warp', to: 'tf1', x: 36, y: 6, dir: 'down' } },
      { x: 7, y: 4, kind: 'interact', action: { type: 'text', lines: ['MOSTRADOR BINTER CANARIAS — "Vuela entre islas con chocolatina Tirma reglamentaria".'] } },
      { x: 5, y: 5, kind: 'interact', action: { type: 'text', lines: STORY.airport_dutyfree } },
      { x: 18, y: 6, kind: 'interact', action: { type: 'text', lines: ['CINTA DE EQUIPAJE 3. Da vueltas una maleta solitaria y una caja de platanos atada con cinta de embalar.'] } },
      { x: 9, y: 1, kind: 'interact', action: { type: 'text', lines: STORY.airport_board } },
      { x: 11, y: 1, kind: 'interact', action: { type: 'text', lines: STORY.airport_board } },
      { x: 13, y: 1, kind: 'interact', action: { type: 'text', lines: STORY.airport_board } },
      { x: 15, y: 1, kind: 'interact', action: { type: 'text', lines: STORY.airport_board } },
    ],
    onEnter: [
      'TERMINAL AEROPUERTO TENERIFE SUR (REINA SOFIA)! Aire fresquito, olor a cafe caro y paneles de vuelos de BINTER.',
      'Frente al mostrador de Binter hay una DOÑA canaria haciendote señas con un billete verde en la mano!',
    ],
  },

  las_americas: STATION,

  siam_park: {
    id: 'siam_park',
    name: 'Zona Safari · Siam Park (Toboganes, Olas y Leones Marinos)',
    rows: buildSiamPark(),
    legend: SIAM_LEGEND,
    npcs: [
      { id: 'taquillero_siam', sprite: 'conserje', x: 48, y: 13 },
      { id: 'cola_torre_poder', sprite: 'runner', x: 21, y: 11, trainer: 'cola_torre_poder' },
      { id: 'cola_dragon', sprite: 'estudiante', x: 29, y: 16, trainer: 'cola_dragon' },
      { id: 'lifeguard_siam', sprite: 'cathaysa', x: 12, y: 17, trainer: 'lifeguard_siam' },
      { id: 'guiri_dave', sprite: 'guiri_crema', x: 6, y: 16 },
      { id: 'crema_fp50', sprite: 'crema_npc', x: 10, y: 18 },
      { id: 'surfero_borja', sprite: 'surfero_pukas', x: 9, y: 12 },
      { id: 'pukas_perdida', sprite: 'tabla_pukas', x: 6, y: 12 },
      { id: 'leon_siam_1', sprite: 'leon_npc', x: 38, y: 8 },
      { id: 'leon_siam_2', sprite: 'leon_npc', x: 41, y: 8 },
    ],
    triggers: [
      ...([47, 48, 49] as const).map(x => ({ x, y: 23, kind: 'step' as const, action: { type: 'warp' as const, to: 'puente_magma' as const, x: x - 37, y: 1, dir: 'down' as const } })),
      { x: 46, y: 21, kind: 'interact', action: { type: 'text', lines: ['SALIDA SUR ↓ Cruza la pasarela de la TF-1 para volver al Magma y a la estación.'] } },

      // Bote de Crema Solar FP50 perdido en las tumbonas de arena
      { x: 10, y: 18, kind: 'interact', action: { type: 'pickupCremaFP50' } },

      // Dave el guiri y su peticion de crema solar
      { x: 6, y: 16, kind: 'interact', action: { type: 'siamGuiriDave' } },

      // Carteles de Siam Park
      { x: 47, y: 13, kind: 'interact', action: { type: 'text', lines: STORY.siam_gate } },
      { x: 39, y: 10, kind: 'interact', action: { type: 'text', lines: STORY.siam_sealions_pool } },
      { x: 24, y: 10, kind: 'interact', action: { type: 'text', lines: STORY.siam_shark_tank } },
      { x: 31, y: 16, kind: 'interact', action: { type: 'text', lines: ['THE DRAGON — Caida vertical con flotador gigante de cuatro personas dentro de un embudo colosal.'] } },
      { x: 8, y: 12, kind: 'interact', action: { type: 'text', lines: ['THE WAVE PALACE — La mayor ola artificial del mundo: cuatro metros de altura y arena blanca de Tailandia.'] } },

      // Banners de zona
      { x: 46, y: 14, kind: 'step', action: { type: 'zone', name: 'SIAM PARK (ZONA SAFARI)' } },
      { x: 26, y: 14, kind: 'step', action: { type: 'zone', name: 'TORRE DEL PODER & TIBURONES' } },
      { x: 14, y: 14, kind: 'step', action: { type: 'zone', name: 'THE WAVE PALACE' } },
    ],
    onEnter: [
      '¡ZONA SAFARI: SIAM PARK! Musica tailandesa, vegetacion exotica, el rugido de la piscina de olas y el estruendo de los toboganes gigantes.',
      'Al fondo estan la Torre del Poder con su tunel de tiburones, los leones marinos y The Wave Palace, donde los guiris se tuestan al sol.',
    ],
  },
};
