// ==================================================================
// AUTOPISTA DEL NORTE TF-5 (132x96) + PASO INFERIOR 2 ALTURAS EN TACO
//
// Recorrido completo en Toyota Landcruiser (M.O. 1 Todo Terreno):
//   0. Estacion de Guaguas S/C (santacruz_sur) -> todo tieso al NORTE
//   1. Paso inferior de Taco (mapa `calle`, x=22..25, cota inferior bajo el puente y el tranvia)
//   2. Km 6  · Subida La Cuesta / Campus Guajara (todo tieso al NORTE, arranca la cola)
//   3. Km 9  · Padre Anchieta (pasarela circular elevada + ULTRA COLA intensificada)
//   4. Km 11 · Aeropuerto Tenerife Norte - Los Rodeos (TFN): fin de la ultra cola
//              y GIRO RUMBO SUROESTE (-x, +y) por la vertiente norte!
//   5. Km 19 · Tacoronte: lluvia permanente y asfalto encharcado
//   6. Km 21 · El Sauzal: curvas por la cara y pared infinita de senales de radar
//   7. Km 25 · La Matanza de Acentejo
//   8. Km 27 · La Victoria de Acentejo
//   9. Km 31 · Santa Ursula -> Salida La Quinta ("Siento un escalofrio, creo que deberia
//              salirme de la autopista aqui") + recolocacion inmediata si sigues a La Orotava.
// ==================================================================

import type { GameMap, Trigger } from './maps';
import { PAL, TILE, drawTile, type TileId } from './sprites';
import { drawGuaguaTitsa, drawVWCaddy } from './props';

export const TF5_W = 132;
export const TF5_H = 96;

/** Coordenadas del corredor de la TF-5 en el mapa `calle` (cota inferior bajo el puente). */
export const TACO_TF5 = {
  left: 22,
  right: 25,
  bridgeTop: 4,
  bridgeBottom: 8,
} as const;

/** Punto exacto del ramal de Salida 31 · La Quinta, desde donde se sube a Santa Ursula. */
export const LA_QUINTA_EXIT = { x: 16, y: 83, dir: 'down' as const };

/** Sector de Tacoronte donde esta permanentemente lloviendo. */
export const TACORONTE_RAIN = { x0: 75, x1: 94, y0: 12, y1: 39 } as const;

export function inTacoronteRain(x: number, y: number): boolean {
  return x >= TACORONTE_RAIN.x0 && x <= TACORONTE_RAIN.x1 && y >= TACORONTE_RAIN.y0 && y <= TACORONTE_RAIN.y1;
}

/** Avion turbohelice ATR-72 de Binter en la plataforma del Aeropuerto TFN Los Rodeos (4x2). */
export const TF5_BINTER_POS = { x: 103, y: 4, w: 4, h: 2 } as const;

/** Pasarela peatonal circular elevada de Padre Anchieta (se dibuja SOBRE los coches). */
export const ANCHIETA_RING = { x: 113, y: 57, w: 7, h: 5 } as const;

export interface Tf5Vehicle {
  id: string;
  kind: 'guagua_n' | 'caddy_n' | 'sedan_n' | 'guagua_w' | 'caddy_w';
  variant?: 'reparto' | 'escalera' | 'camper';
  x: number;
  y: number;
  w: number;
  h: number;
  trainer?: string;
  honkX?: number;
  honkY?: number;
  flavor?: string;
}

/** Vehiculos en la cota inferior de la TF-5 bajo el Puente de Taco (`calle`). */
export const TACO_UNDERPASS_VEHICLES: readonly Tf5Vehicle[] = [
  {
    id: 'u_taco_caddy', kind: 'caddy_n', variant: 'escalera',
    x: 22, y: 2, w: 1, h: 2,
    trainer: 'tf5_taco_puente', honkX: 24, honkY: 2,
  },
  {
    id: 'u_taco_sedan', kind: 'sedan_n',
    x: 25, y: 9, w: 1, h: 2,
    flavor: 'Un Seat Ibiza del 99 clavado en la cola de Taco. El conductor lleva medio bocata de pata y un crucigrama entero.',
  },
];

export function tacoUnderpassVehicleAt(x: number, y: number): Tf5Vehicle | undefined {
  return TACO_UNDERPASS_VEHICLES.find((v) => x >= v.x && x < v.x + v.w && y >= v.y && y < v.y + v.h);
}

/** Eje base (sin eses de El Sauzal) del tramo suroeste desde TFN (x=96) hasta La Orotava (x=5). */
export function tf5SwBaseY(x: number): number {
  return 15 + ((96 - x) * 67) / 86;
}

/** Eje real de la calzada suroeste, incluyendo las curvas por la cara de El Sauzal (x=50..76). */
export function tf5SwCenterY(x: number): number {
  const base = tf5SwBaseY(x);
  if (x >= 50 && x <= 76) {
    const t = (76 - x) / 26;
    const sauzalSwing = 6.5 * Math.sin(Math.PI * t) * Math.sin(t * 4 * Math.PI);
    return Math.round(base + sauzalSwing);
  }
  return Math.round(base);
}

/** Entrenadores en vehiculo: 6 concentrados en la ultra-cola hasta TFN y solo 3 repartidos despues. */
export const TF5_VEHICLES: readonly Tf5Vehicle[] = [
  // ---- ULTRA COLA (GUAJARA -> PADRE ANCHIETA -> TFN) ----
  {
    id: 'v_tf5_guajara', kind: 'caddy_n', variant: 'reparto',
    x: 117, y: 85, w: 1, h: 2, trainer: 'tf5_guajara', honkX: 116, honkY: 85,
  },
  {
    id: 'v_tf5_anchieta_1', kind: 'guagua_n',
    x: 116, y: 69, w: 2, h: 3, trainer: 'tf5_anchieta_1', honkX: 115, honkY: 70,
  },
  {
    id: 'v_tf5_anchieta_2', kind: 'caddy_n', variant: 'escalera',
    x: 117, y: 60, w: 1, h: 2, trainer: 'tf5_anchieta_2', honkX: 116, honkY: 60,
  },
  {
    id: 'v_tf5_anchieta_3', kind: 'guagua_n',
    x: 114, y: 50, w: 2, h: 3, trainer: 'tf5_anchieta_3', honkX: 116, honkY: 51,
  },
  {
    id: 'v_tf5_anchieta_4', kind: 'caddy_n', variant: 'reparto',
    x: 114, y: 41, w: 1, h: 2, trainer: 'tf5_anchieta_4', honkX: 115, honkY: 41,
  },
  {
    id: 'v_tf5_tfn', kind: 'caddy_n', variant: 'camper',
    x: 117, y: 33, w: 1, h: 2, trainer: 'tf5_tfn', honkX: 116, honkY: 33,
  },
  // ---- TRAS TFN (SIN ULTRA COLA, PERO ALGUN ENTRENADOR SUELTO) ----
  {
    id: 'v_tf5_tacoronte', kind: 'caddy_w', variant: 'reparto',
    x: 84, y: tf5SwCenterY(84) - 1, w: 2, h: 1,
    trainer: 'tf5_tacoronte', honkX: 84, honkY: tf5SwCenterY(84),
  },
  {
    id: 'v_tf5_sauzal', kind: 'caddy_w', variant: 'camper',
    x: 63, y: tf5SwCenterY(63) - 1, w: 2, h: 1,
    trainer: 'tf5_sauzal', honkX: 63, honkY: tf5SwCenterY(63),
  },
  {
    id: 'v_tf5_victoria', kind: 'guagua_w',
    x: 33, y: tf5SwCenterY(34) - 2, w: 3, h: 2,
    trainer: 'tf5_victoria', honkX: 34, honkY: tf5SwCenterY(34) + 1,
  },
];

export function tf5VehicleAt(x: number, y: number): Tf5Vehicle | undefined {
  return TF5_VEHICLES.find((v) => x >= v.x && x < v.x + v.w && y >= v.y && y < v.y + v.h);
}

/** Coches parados de relleno que forman la retencion kilometrica Guajara -> Padre Anchieta -> TFN. */
const QUEUE_CARS: readonly [number, number][] = [
  // Guajara (arranca el tapon)
  [114, 90], [118, 90],
  [114, 86], [115, 86], [118, 84],
  [114, 80], [116, 80], [118, 80],
  // Padre Anchieta (la cola se intensifica hasta el delirio!)
  [115, 75], [116, 75], [117, 75], [118, 75],
  [114, 71], [114, 69], [118, 70],
  [114, 65], [115, 65], [116, 65], [118, 65],
  [114, 61], [115, 60], [118, 61],
  [115, 56], [116, 56], [117, 56], [118, 56],
  [117, 52], [118, 51], [117, 50],
  [114, 46], [115, 46], [116, 46], [117, 46],
  [116, 42], [117, 42], [118, 41],
  // Cola aflojando al llegar a TFN Los Rodeos
  [114, 38], [118, 38],
  [114, 34],
  [118, 29],
];

type Grid = string[][];
const mkGrid = (w: number, h: number, fill: string): Grid =>
  Array.from({ length: h }, () => Array<string>(w).fill(fill));
const put = (g: Grid, x0: number, y0: number, x1: number, y1: number, c: string) => {
  for (let y = Math.max(0, y0); y <= Math.min(g.length - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(g[0].length - 1, x1); x++) g[y][x] = c;
  }
};

export const TF5_LEGEND: Record<string, TileId> = {
  g: 'grass', E: 'tree', P: 'palm', R: 'road', X: 'crosswalk', K: 'parking',
  C: 'car', G: 'guardrail', '!': 'radar', F: 'fence', s: 'sidewalk', Z: 'plaza',
  B: 'building', W: 'window', D: 'door', T: 'sign', O: 'monument',
  '=': 'runway', Q: 'dish', V: 'ravine', u: 'surf', '~': 'sea', h: 'bench',
};

const sign = (x: number, y: number, ...lines: string[]): Trigger =>
  ({ x, y, kind: 'interact', action: { type: 'text', lines } });

interface BuiltTf5 {
  rows: string[];
  triggers: Trigger[];
  radarCount: number;
}

function buildTf5Map(): BuiltTf5 {
  const g = mkGrid(TF5_W, TF5_H, 'g');
  const triggers: Trigger[] = [];

  // 1. Paisaje verde del Norte + Oceano Atlantico y acantilados de Acentejo al NOROESTE
  for (let y = 0; y < TF5_H; y++) {
    for (let x = 0; x < TF5_W; x++) {
      if (x <= 84) {
        const cliffY = Math.round(tf5SwBaseY(x)) - 13;
        if (y < cliffY - 1) { g[y][x] = '~'; continue; }
        if (y === cliffY - 1) { g[y][x] = 'u'; continue; }
        if (y === cliffY) { g[y][x] = 'V'; continue; }
      }
      // Arboleda de laurisilva, castanos y palmeras repartida por las medianias
      const hash = (x * 13 + y * 29) % 37;
      if (hash === 0 || hash === 5) g[y][x] = 'E';
      else if (hash === 11) g[y][x] = 'P';
    }
  }
  // Bordes exteriores arbolados
  put(g, 130, 0, 131, TF5_H - 1, 'E');
  put(g, 0, TF5_H - 2, TF5_W - 1, TF5_H - 1, 'E');
  put(g, 85, 0, TF5_W - 1, 0, 'E');

  // 2. CALZADA TRAMO NORTE: Taco/Guajara (y=95) -> Padre Anchieta -> TFN Los Rodeos (y=12)
  put(g, 114, 12, 118, 95, 'R');
  for (let y = 92; y >= 18; y -= 6) g[y][116] = 'X';

  // 3. CRESTA DE TFN (y=12..16, x=96..118) donde termina de ir al norte y gira al SUROESTE
  put(g, 96, 12, 118, 16, 'R');
  for (const x of [100, 106, 112]) g[14][x] = 'X';

  // 4. CALZADA TRAMO SUROESTE: TFN (x=96,y=15) -> Tacoronte -> El Sauzal (curvas!) ->
  //    La Matanza -> La Victoria -> Santa Ursula -> La Quinta -> hacia La Orotava (x=5,y=86)
  const stampRoad = (cx: number, cy: number) => {
    put(g, cx - 2, cy - 2, cx + 2, cy + 2, 'R');
  };
  let prevY = tf5SwCenterY(96);
  stampRoad(96, prevY);
  for (let x = 95; x >= 5; x--) {
    const cy = tf5SwCenterY(x);
    const step = cy >= prevY ? 1 : -1;
    for (let y = prevY; y !== cy; y += step) stampRoad(x, y);
    stampRoad(x, cy);
    if (x % 7 === 0) g[cy][x] = 'X';
    prevY = cy;
  }
  // Ensanche leve en La Victoria para adelantar comodamente a la Guagua 101
  const vicY = tf5SwCenterY(34);
  put(g, 32, vicY - 2, 36, vicY + 2, 'R');

  // 5. Apartadero TFN Los Rodeos (x=101..107, y=11) y SALIDA 31 · LA QUINTA (x=15..18, y=79..85)
  put(g, 101, 11, 107, 11, 'K');
  put(g, 15, 79, 18, 85, 'K');

  // 6. Anillo continuo de biondas quitamiedos (G) alrededor de toda la calzada
  const isAsphalt = (ch: string) => ch === 'R' || ch === 'X' || ch === 'K';
  const toGuard: [number, number][] = [];
  for (let y = 1; y < TF5_H - 1; y++) {
    for (let x = 1; x < TF5_W - 1; x++) {
      if (isAsphalt(g[y][x])) continue;
      let adj = false;
      for (let dy = -1; dy <= 1 && !adj; dy++) {
        for (let dx = -1; dx <= 1 && !adj; dx++) {
          if (dx === 0 && dy === 0) continue;
          const ch = g[y + dy]?.[x + dx];
          if (ch && isAsphalt(ch)) adj = true;
        }
      }
      if (adj) toGuard.push([x, y]);
    }
  }
  for (const [gx, gy] of toGuard) g[gy][gx] = 'G';
  // Reabrir boca sur (y=95, x=114..118) hacia el Puente de Taco y biondas laterales
  g[95][113] = 'G'; g[95][119] = 'G';
  put(g, 114, 95, 118, 95, 'R');
  // La salida sur de La Quinta sube al pueblo sin cruzar de nuevo la autopista.
  put(g, 14, 86, 19, 86, 'F');
  put(g, 15, 86, 17, 86, 'R');
  for (const x of [15, 16, 17]) {
    triggers.push({ x, y: 86, kind: 'step', action: { type: 'warp', to: 'santa_ursula', x: 52, y: 1, dir: 'down' } });
  }

  // 7. EL SAUZAL (x=50..76): ¡MILES DE SEÑALES DE RADAR EN TODAS LAS CURVAS!
  let radarCount = 0;
  for (let y = 18; y < 65; y++) {
    for (let x = 49; x <= 76; x++) {
      if (g[y][x] === 'G' && (x + y * 2) % 4 !== 0) {
        g[y][x] = '!';
        radarCount++;
      }
    }
  }
  // Segunda fila comica de radares detras de las biondas en las horquillas de El Sauzal
  for (let y = 24; y < 58; y++) {
    for (let x = 52; x <= 74; x++) {
      if (g[y][x] === 'g' && (x + y) % 3 === 0 && (g[y - 1]?.[x] === '!' || g[y + 1]?.[x] === '!')) {
        g[y][x] = '!';
        radarCount++;
      }
    }
  }

  // 8. ESCENOGRAFIA POR TRAMOS
  // ---- A1. Campus Guajara (x=104..111, y=81..89) y Hospital HUC (x=121..128, y=83..89) ----
  put(g, 104, 82, 110, 86, 'B');
  for (const wx of [105, 107, 109]) { g[83][wx] = 'W'; g[85][wx] = 'W'; }
  put(g, 122, 83, 128, 87, 'B');
  for (const wx of [123, 125, 127]) { g[84][wx] = 'W'; g[86][wx] = 'W'; }

  // ---- A2. Padre Anchieta y La Laguna (y=45..72) ----
  put(g, 121, 56, 128, 62, 'Z');
  put(g, 123, 52, 129, 55, 'B'); // Facultad de Biologia / Torre de Quimicas
  for (const wx of [124, 126, 128]) g[53][wx] = 'W';
  g[59][121] = 'O'; // Estatua del Padre Anchieta junto a la rotonda
  put(g, 103, 55, 110, 61, 'B'); // Casco / San Benito de La Laguna
  for (const wx of [104, 106, 109]) { g[56][wx] = 'W'; g[59][wx] = 'W'; }
  put(g, 122, 45, 128, 49, 'B'); // Intercambiador de La Laguna
  for (const wx of [123, 125, 127]) g[47][wx] = 'W';

  // ---- B. Aeropuerto Tenerife Norte · Los Rodeos (TFN) (x=88..124, y=2..10) ----
  put(g, 88, 2, 124, 3, '=');   // Pista 12/30 de Los Rodeos
  put(g, 89, 4, 123, 6, 's');   // Plataforma (con el ATR-72 de Binter en 103,4)
  g[5][117] = 'Q'; g[5][118] = 'B'; // Torre de control TFN
  put(g, 89, 7, 95, 7, 'F');
  put(g, 112, 7, 123, 7, 'F');
  put(g, 96, 7, 111, 9, 'B');   // Edificio Terminal TFN
  for (const wx of [97, 99, 101, 106, 108, 110]) g[8][wx] = 'W';
  g[9][103] = 'D'; g[9][104] = 'D';
  put(g, 96, 10, 111, 10, 's');

  // ---- C1. Tacoronte (x=77..93, lluvia eterna, bodegas y laurisilva) ----
  put(g, 86, 31, 92, 34, 'B'); // Bodegas de Tacoronte-Acentejo
  g[32][88] = 'W'; g[32][90] = 'W';
  for (const [tx, ty] of [[80, 17], [83, 16], [89, 28], [79, 32], [84, 34]]) g[ty][tx] = 'E';

  // ---- C2. El Sauzal (x=50..75, miradores sobre el acantilado y radares) ----
  put(g, 56, 34, 60, 36, 'B');
  g[35][57] = 'W'; g[35][59] = 'W';
  put(g, 67, 46, 72, 48, 'B');
  g[47][68] = 'W'; g[47][71] = 'W';

  // ---- C3. La Matanza de Acentejo (x=37..49, vinedos y guachinches de ladera) ----
  put(g, 43, 61, 48, 64, 'B');
  g[62][44] = 'W'; g[62][47] = 'W'; g[63][45] = 'O';
  put(g, 39, 48, 43, 50, 'Z'); g[49][41] = 'O';

  // ---- C4. La Victoria de Acentejo (x=25..36, Pino de La Victoria y caserio) ----
  put(g, 29, 71, 35, 74, 'B');
  g[72][30] = 'W'; g[72][33] = 'W';
  for (const [px, py] of [[27, 72], [28, 72], [27, 73]]) g[py][px] = 'E'; // Pino centenario

  // ---- C5. Santa Ursula y La Quinta (x=14..24, palmeras, mirador y salida) ----
  put(g, 21, 80, 26, 83, 'B');
  g[81][22] = 'W'; g[81][25] = 'W';
  for (const [px, py] of [[20, 81], [23, 66], [17, 69], [13, 73], [20, 84]]) g[py][px] = 'P';

  // 9. Colocar la cola de coches parados en Guajara -> Padre Anchieta -> TFN
  for (const [cx, cy] of QUEUE_CARS) g[cy][cx] = 'C';

  // 10. Carteles legibles desde el propio carril en cada hito del recorrido
  const placeRoadSign = (x: number, y: number, lines: string[]) => {
    g[y][x] = 'T';
    triggers.push(sign(x, y, ...lines));
  };
  placeRoadSign(119, 91, [
    'AUTOPISTA TF-5 NORTE · KM 6 (TACO - CAMPUS GUAJARA). Empieza la cola reglamentaria.',
    '↑ Norte: Padre Anchieta y Aeropuerto TFN · ↓ Sur: Paso inferior del Puente de Taco y Estación S/C.',
  ]);
  placeRoadSign(119, 73, [
    'KM 9 · ENTRADA A PADRE ANCHIETA. La cola se intensifica a niveles sobrenaturales: mete primera y reza.',
  ]);
  placeRoadSign(119, 62, [
    'ROTONDA Y PASARELA DE PADRE ANCHIETA (LA LAGUNA). Hay gente que entró soltera en el carril izquierdo y salió con dos chiquillos en edad escolar.',
  ]);
  placeRoadSign(113, 48, [
    'PANEL DGT PADRE ANCHIETA: "RETENCIÓN HASTA TFN LOS RODEOS. SI LLEVAS BARRAQUITO EN TERMO, YA ESTÁ FRÍO."',
  ]);
  placeRoadSign(108, 11, [
    '✈️ AEROPUERTO TENERIFE NORTE — CIUDAD DE LA LAGUNA (TFN · LOS RODEOS).',
    '¡Milagro, aquí se acaba la ultra-cola! A partir de TFN la TF-5 deja de subir al norte y vira rumbo SUROESTE hacia Tacoronte y el Valle.',
  ]);
  placeRoadSign(97, 11, [
    '↙ TF-5 SUROESTE: Tacoronte · El Sauzal · La Matanza · La Victoria · Santa Úrsula · La Orotava.',
  ]);
  // Encuentra la bionda exacta pegada al borde SE (+1) o NO (-1) de la calzada en la columna x
  const shoulderY = (x: number, dir: 1 | -1): number => {
    let y = tf5SwCenterY(x);
    while (y > 2 && y < TF5_H - 3 && isAsphalt(g[y][x])) y += dir;
    return y;
  };
  placeRoadSign(87, shoulderY(87, 1), [
    '🌧️ KM 19 · TACORONTE. Aquí está permanentemente lloviendo desde que los guanches inventaron el paraguas.',
    'Cuidado con el aquaplaning y con el olor a vino tinto de Tacoronte-Acentejo.',
  ]);
  placeRoadSign(72, shoulderY(72, 1), [
    '📸 KM 21 · EL SAUZAL. ¡ATENCIÓN: TRAMO DE CURVAS PUESTAS POR LA CARA Y 4.700 SEÑALES DE RADAR!',
    'Límite: 80 km/h (o 60, o 70, según qué radar de los doce te esté mirando ahora mismo).',
  ]);
  placeRoadSign(58, shoulderY(58, -1), [
    '📸 EL SAUZAL · RADAR Nº 3.812: este radar vigila que hayas saludado educadamente a los ocho radares de la curva anterior.',
  ]);
  placeRoadSign(44, shoulderY(44, 1), [
    'KM 25 · LA MATANZA DE ACENTEJO. Tierra de vino de tea, castañas asadas y cuestas donde hasta el Landcruiser suda.',
  ]);
  placeRoadSign(30, shoulderY(30, 1), [
    'KM 27 · LA VICTORIA DE ACENTEJO. Pinos centenarios, brasas de guachinche y el Atlántico rugiendo bajo el risco.',
  ]);
  placeRoadSign(21, shoulderY(21, 1), [
    'KM 31 · SANTA ÚRSULA. Balcón del Norte... y próxima salida: LA QUINTA. Te recorre un fresquito raro por la nuca.',
  ]);
  placeRoadSign(19, 80, [
    'SALIDA 31 · LA QUINTA (SANTA ÚRSULA) ↓ · Continúa TF-5: ↙ La Orotava.',
  ]);
  placeRoadSign(18, 84, [
    'SALIDA 31 · LA QUINTA (SANTA ÚRSULA). Algo en esta salida te da un escalofrío que te eriza hasta las pestañas.',
    'Sigue por la salida al SUR y sube hasta el pueblo de Santa Úrsula. La carretera general continúa al suroeste.',
  ]);
  placeRoadSign(13, shoulderY(13, -1), [
    '↙ TF-5 DIRECCIÓN LA OROTAVA / PUERTO DE LA CRUZ.',
  ]);

  // 11. Salida SUR de vuelta al paso inferior del Puente de Taco (`calle` cota inferior)
  for (let x = 114; x <= 118; x++) {
    triggers.push({ x, y: 95, kind: 'step', action: { type: 'enterTf5Underpass', from: 'north' } });
  }

  // 12. Banners de zona en orden exacto del viaje
  const northZones: [number, string][] = [
    [92, 'TF-5 · SUBIDA GUAJARA'],
    [74, 'KM 9 · PADRE ANCHIETA'],
    [59, 'PASARELA DE ANCHIETA'],
    [27, 'KM 11 · AEROPUERTO TFN'],
  ];
  for (const [zy, name] of northZones) {
    for (let x = 114; x <= 118; x++) {
      triggers.push({ x, y: zy, kind: 'step', action: { type: 'zone', name } });
    }
  }
  for (let y = 12; y <= 16; y++) {
    triggers.push({ x: 101, y, kind: 'step', action: { type: 'zone', name: 'TFN · GIRO AL SUROESTE' } });
  }
  const addSwZone = (zx: number, name: string) => {
    for (let y = 1; y < TF5_H - 1; y++) {
      if (isAsphalt(g[y][zx])) {
        triggers.push({ x: zx, y, kind: 'step', action: { type: 'zone', name } });
      }
    }
  };
  addSwZone(91, 'KM 19 · TACORONTE (LLUVIA)');
  addSwZone(80, 'TACORONTE · AGUACEROS');
  addSwZone(73, 'KM 21 · EL SAUZAL (RADARES)');
  addSwZone(54, 'EL SAUZAL · MAS CURVAS');
  addSwZone(46, 'KM 25 · LA MATANZA');
  addSwZone(35, 'KM 27 · LA VICTORIA');
  addSwZone(23, 'KM 31 · SANTA URSULA');

  // Flash comico de radar a mitad de las curvas de El Sauzal (1 vez)
  for (let y = 1; y < TF5_H - 1; y++) {
    if (isAsphalt(g[y][66])) {
      triggers.push({ x: 66, y, kind: 'step', action: { type: 'sauzalFlash' } });
    }
  }

  // 13. LA QUINTA: escalofrio al pasar por su altura + recolocacion inmediata si avanzas hacia La Orotava
  for (let y = 73; y <= 80; y++) {
    if (isAsphalt(g[y][16])) {
      triggers.push({ x: 16, y, kind: 'step', action: { type: 'laQuintaChill' } });
    }
  }
  for (const bx of [12, 11]) {
    for (let y = 74; y <= 86; y++) {
      if (isAsphalt(g[y][bx])) {
        triggers.push({ x: bx, y, kind: 'step', action: { type: 'orotavaCutscene', from: 'motorway' } });
      }
    }
  }

  // 14. Pitidos de reto al pasar junto a guaguas y furgonetas de la TF-5
  for (const v of TF5_VEHICLES) {
    if (v.trainer && v.honkX !== undefined && v.honkY !== undefined) {
      triggers.push({
        x: v.honkX, y: v.honkY, kind: 'step',
        action: { type: 'highwayChallenge', trainer: v.trainer },
      });
    }
  }

  return { rows: g.map((r) => r.join('')), triggers, radarCount };
}

const BUILT_TF5 = buildTf5Map();
export const SAUZAL_RADAR_COUNT = BUILT_TF5.radarCount;

export const TF5_MAP: GameMap = {
  id: 'tf5',
  name: 'Autopista TF-5 · Anchieta · TFN · Norte · Santa Úrsula',
  rows: BUILT_TF5.rows,
  legend: TF5_LEGEND,
  npcs: [],
  triggers: BUILT_TF5.triggers,
  onEnter: [
    '¡Sales del paso inferior del Puente de Taco todo tieso al NORTE por la AUTOPISTA TF-5!',
    'Delante asoma la mítica cola de PADRE ANCHIETA y el AEROPUERTO TFN, donde la autopista vira rumbo SUROESTE hacia el Norte.',
  ],
};

// ==================================================================
// ARTE 4 COLORES GAME BOY: VEHICULOS N-S, LLUVIA DE TACORONTE,
// PASARELA DE PADRE ANCHIETA Y DOBLE ALTURA DEL PUENTE DE TACO
// ==================================================================

const R = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: number) => {
  ctx.fillStyle = PAL[c];
  ctx.fillRect(x, y, w, h);
};

/** Dibuja una Guagua TITSA (2x3 o 3x2), una VW Caddy (1x2 o 2x1) o un turismo parado (1x2). */
export function drawTf5Vehicle(ctx: CanvasRenderingContext2D, v: Tf5Vehicle, x: number, y: number, frame: number) {
  if (v.kind === 'guagua_w') { drawGuaguaTitsa(ctx, x, y, frame); return; }
  if (v.kind === 'caddy_w') { drawVWCaddy(ctx, x, y, frame, v.variant ?? 'reparto'); return; }

  if (v.kind === 'guagua_n') {
    // Guagua TITSA verde/blanca de 32x48 (2x3 tiles) enfilando al NORTE en la cola de Anchieta
    const vib = Math.floor(frame / 12) % 2;
    R(ctx, x + 3, y + 1 + vib, 26, 45, 3);
    R(ctx, x + 5, y + 2 + vib, 22, 5, 0);  // parabrisas superior
    R(ctx, x + 5, y + 7 + vib, 22, 34, 1); // techo verde TITSA
    R(ctx, x + 7, y + 9 + vib, 18, 26, 0); // franja central blanca
    R(ctx, x + 10, y + 14 + vib, 12, 8, 2); // equipo A/A del techo
    R(ctx, x + 10, y + 25 + vib, 12, 6, 1);
    R(ctx, x + 5, y + 38 + vib, 22, 5, 3); // luneta trasera
    R(ctx, x + 6, y + 39 + vib, 20, 3, 2);
    // Pilotos de freno encendidos en el atasco
    const brake = frame % 30 < 22 ? 0 : 2;
    R(ctx, x + 5, y + 43 + vib, 5, 2, brake);
    R(ctx, x + 22, y + 43 + vib, 5, 2, brake);
    // Retrovisores
    R(ctx, x + 1, y + 5 + vib, 2, 4, 3);
    R(ctx, x + 29, y + 5 + vib, 2, 4, 3);
    return;
  }

  if (v.kind === 'caddy_n') {
    // VW Caddy blanca 16x32 (1x2 tiles) mirando al NORTE con baca
    R(ctx, x + 2, y + 2, 12, 28, 3);
    R(ctx, x + 3, y + 3, 10, 6, 0);  // capo blanco
    R(ctx, x + 3, y + 9, 10, 4, 3);  // parabrisas
    R(ctx, x + 4, y + 10, 8, 2, 1);
    R(ctx, x + 3, y + 13, 10, 14, 0); // caja blanca
    if (v.variant === 'escalera') {
      R(ctx, x + 5, y + 12, 6, 15, 3);
      for (let ly = 14; ly <= 24; ly += 3) R(ctx, x + 6, y + ly, 4, 2, 0);
    } else if (v.variant === 'camper') {
      R(ctx, x + 5, y + 15, 6, 9, 1);
    } else {
      R(ctx, x + 5, y + 16, 6, 1, 2);
      R(ctx, x + 5, y + 22, 6, 1, 2);
    }
    const flash = frame % 20 < 10 ? 0 : 2;
    R(ctx, x + 3, y + 28, 3, 1, flash);
    R(ctx, x + 10, y + 28, 3, 1, flash);
    return;
  }

  // sedan_n: Seat Ibiza parado 16x32 (1x2 tiles)
  R(ctx, x + 2, y + 3, 12, 25, 3);
  R(ctx, x + 3, y + 4, 10, 6, 1);
  R(ctx, x + 4, y + 10, 8, 4, 0);
  R(ctx, x + 3, y + 14, 10, 9, 1);
  R(ctx, x + 4, y + 23, 8, 3, 2);
  R(ctx, x + 3, y + 26, 3, 1, 0);
  R(ctx, x + 10, y + 26, 3, 1, 0);
}

/** Pasarela peatonal circular elevada de Padre Anchieta (se pinta SOBRE la calzada y tu coche). */
export function drawAnchietaBridge(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
  const bx = ANCHIETA_RING.x * TILE - camX;
  const by = ANCHIETA_RING.y * TILE - camY;
  const w = ANCHIETA_RING.w * TILE;
  const h = ANCHIETA_RING.h * TILE;
  if (bx + w < -8 || bx > 168 || by + h < -8 || by > 152) return;
  // Sombra proyectada sobre el asfalto
  R(ctx, bx + 4, by + 10, w - 8, 4, 3);
  R(ctx, bx + 4, by + h - 4, w - 8, 4, 3);
  // Arco norte de la pasarela metalica de Anchieta
  R(ctx, bx, by + 2, w, 9, 3);
  R(ctx, bx + 1, by + 3, w - 2, 2, 0);
  R(ctx, bx + 1, by + 5, w - 2, 4, 1);
  for (let rx = 4; rx < w - 4; rx += 6) R(ctx, bx + rx, by + 3, 1, 7, 3);
  // Arco sur de la pasarela
  R(ctx, bx, by + h - 13, w, 9, 3);
  R(ctx, bx + 1, by + h - 12, w - 2, 2, 0);
  R(ctx, bx + 1, by + h - 10, w - 2, 4, 1);
  for (let rx = 4; rx < w - 4; rx += 6) R(ctx, bx + rx, by + h - 12, 1, 7, 3);
  // Pilares laterales en las biondas (x=113 y x=119, fuera de los carriles)
  R(ctx, bx + 2, by + 2, 8, h - 6, 3);
  R(ctx, bx + 4, by + 4, 4, h - 10, 0);
  R(ctx, bx + w - 10, by + 2, 8, h - 6, 3);
  R(ctx, bx + w - 8, by + 4, 4, h - 10, 0);
}

/** Lluvia permanente de Tacoronte en paleta estricta de 4 colores Game Boy. */
export function drawTacoronteRain(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  frame: number,
  playerInRain: boolean,
) {
  const rx0 = TACORONTE_RAIN.x0 * TILE - camX;
  const ry0 = TACORONTE_RAIN.y0 * TILE - camY;
  const rw = (TACORONTE_RAIN.x1 - TACORONTE_RAIN.x0 + 1) * TILE;
  const rh = (TACORONTE_RAIN.y1 - TACORONTE_RAIN.y0 + 1) * TILE;
  if (rx0 + rw < 0 || rx0 > 160 || ry0 + rh < 0 || ry0 > 144) return;

  const xMin = playerInRain ? 0 : Math.max(0, rx0);
  const xMax = playerInRain ? 160 : Math.min(160, rx0 + rw);
  const yMin = playerInRain ? 0 : Math.max(0, ry0);
  const yMax = playerInRain ? 144 : Math.min(144, ry0 + rh);

  // Cortina densa de gotas diagonales cayendo sin parar
  for (let i = 0; i < 72; i++) {
    const gx = ((i * 29 - frame * 2) % 160 + 160) % 160;
    const gy = ((i * 41 + frame * 5) % 144 + 144) % 144;
    if (gx < xMin || gx >= xMax - 2 || gy < yMin || gy >= yMax - 5) continue;
    R(ctx, gx + 1, gy, 1, 2, 0);
    R(ctx, gx, gy + 2, 1, 3, i % 3 === 0 ? 3 : 0);
  }
  // Salpicaduras de charcos sobre el suelo mojado
  for (let j = 0; j < 14; j++) {
    const sx = ((j * 37 + 11 - (camX % 160)) % 160 + 160) % 160;
    const sy = ((j * 23 + 7 - (camY % 144)) % 144 + 144) % 144;
    if (sx < xMin + 2 || sx >= xMax - 4 || sy < yMin + 2 || sy >= yMax - 2) continue;
    if ((frame + j * 5) % 16 < 6) {
      R(ctx, sx, sy, 4, 1, 0);
      R(ctx, sx + 1, sy - 1, 2, 1, 3);
    }
  }
}

/** Cota inferior (Nivel 0) de la TF-5 en el mapa `calle`: 4 carriles N-S continuos x=22..25. */
export function drawCalleTf5Ground(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  includeUnderBridge: boolean,
) {
  for (let ty = 0; ty <= 11; ty++) {
    const under = ty >= TACO_TF5.bridgeTop && ty <= TACO_TF5.bridgeBottom;
    if (under && !includeUnderBridge) continue;
    for (let tx: number = TACO_TF5.left; tx <= TACO_TF5.right; tx++) {
      const x = tx * TILE - camX;
      const y = ty * TILE - camY;
      if (x + TILE < 0 || x > 160 || y + TILE < 0 || y > 144) continue;
      // Asfalto vertical (un tono mas sombreado bajo el tablero del puente)
      R(ctx, x, y, TILE, TILE, 2);
      if (under && (ty === TACO_TF5.bridgeTop || ty === TACO_TF5.bridgeBottom)) {
        R(ctx, x, y, TILE, TILE, 3);
        R(ctx, x + 2, y + 2, TILE - 4, TILE - 4, 2);
      }
      // Lineas discontinuas blancas de carril N-S
      if (tx === 22 || tx === 24) {
        R(ctx, x + 15, y + 2, 1, 5, 0);
        R(ctx, x + 15, y + 10, 1, 5, 0);
      }
      // Mediana central de hormigon entre sentido sur (22-23) y sentido norte (24-25)
      if (tx === 23) R(ctx, x + 15, y, 1, TILE, 3);
      if (tx === 24) R(ctx, x, y, 1, TILE, 0);
      // Muros de contencion laterales de la trinchera de la TF-5
      if (tx === TACO_TF5.left) { R(ctx, x, y, 2, TILE, 3); R(ctx, x + 2, y, 1, TILE, 0); }
      if (tx === TACO_TF5.right) { R(ctx, x + 14, y, 2, TILE, 3); R(ctx, x + 13, y, 1, TILE, 0); }
      // Sombra proyectada por el puente de Taco en las bocas norte (y=3) y sur (y=9)
      if (ty === TACO_TF5.bridgeTop - 1) R(ctx, x + 2, y + 13, 12, 3, 3);
      if (ty === TACO_TF5.bridgeBottom + 1) R(ctx, x + 2, y, 12, 3, 3);
    }
  }
}

/**
 * Cota superior (Nivel 1): tablero del Puente de Taco sobre la TF-5 (x=22..25, y=4..8).
 * Se dibuja DEBAJO del jugador cuando camina por arriba y ENCIMA del Toyota cuando cruza por debajo!
 */
export function drawCalleTf5BridgeOverpass(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  frame: number,
  underCarPx?: { x: number; y: number } | null,
) {
  const f = Math.floor(frame / 15);
  for (let ty: number = TACO_TF5.bridgeTop; ty <= TACO_TF5.bridgeBottom; ty++) {
    for (let tx: number = TACO_TF5.left; tx <= TACO_TF5.right; tx++) {
      const x = tx * TILE - camX;
      const y = ty * TILE - camY;
      if (x + TILE < 0 || x > 160 || y + TILE < 0 || y > 144) continue;
      if (ty === 5 || ty === 6) {
        // Las vias del Tranvia Linea 1 cruzan limpias por encima del tablero
        drawTile(ctx, 'track', x, y, f);
      } else {
        // Acera de hormigon del puente
        R(ctx, x, y, TILE, TILE, 0);
        for (let i = 3; i < TILE; i += 4) R(ctx, x + i, y + 2, 1, 12, 1);
      }
      // Pretil y barandilla norte (borde superior del puente, y=4) y sur (borde inferior, y=8)
      if (ty === TACO_TF5.bridgeTop) {
        R(ctx, x, y, TILE, 3, 3);
        R(ctx, x + 1, y + 1, 6, 1, 0); R(ctx, x + 9, y + 1, 6, 1, 0);
      }
      if (ty === TACO_TF5.bridgeBottom) {
        R(ctx, x, y + 13, TILE, 3, 3);
        R(ctx, x + 1, y + 14, 6, 1, 0); R(ctx, x + 9, y + 14, 6, 1, 0);
      }
    }
  }
  // Guia sutil de posicion (esquinas discontinuas) cuando el Toyota esta justo bajo el tablero
  if (underCarPx) {
    const bx = TACO_TF5.left * TILE - camX;
    const by = TACO_TF5.bridgeTop * TILE - camY;
    const bh = (TACO_TF5.bridgeBottom - TACO_TF5.bridgeTop + 1) * TILE;
    const cy = underCarPx.y + 8;
    if (cy >= by + 2 && cy <= by + bh - 2 && underCarPx.x >= bx - 4) {
      const sx = underCarPx.x + 3;
      const sy = underCarPx.y + 3;
      const blink = Math.floor(frame / 10) % 2 === 0 ? 3 : 2;
      R(ctx, sx, sy, 3, 1, blink); R(ctx, sx, sy, 1, 3, blink);
      R(ctx, sx + 7, sy, 3, 1, blink); R(ctx, sx + 9, sy, 1, 3, blink);
      R(ctx, sx, sy + 9, 3, 1, blink); R(ctx, sx, sy + 7, 1, 3, blink);
      R(ctx, sx + 7, sy + 9, 3, 1, blink); R(ctx, sx + 9, sy + 7, 1, 3, blink);
    }
  }
}
