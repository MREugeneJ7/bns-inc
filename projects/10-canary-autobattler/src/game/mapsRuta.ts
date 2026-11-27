// Mapas de la ruta del Landcruiser y fase Meridiano / Guarida Enriscada:
// 1. carretera_noche: TF-134 nocturna con baches del Team Enriscada y faros averiados.
// 2. san_andres: pueblo con MAR AL SUR, Cementerio de Las Teresitas (Torre Encantada) al ESTE
//    y salida a Avenida Anaga por el OESTE.
// 3. santacruz_sur: entrada por el ESTE (desde San Andres) conduciendo hacia el OESTE;
//    MAR AL SUR (Muelle, Auditorio, Parque Maritimo, Palmetum Gym #4 Tipo Planta con parking hecho polvo),
//    CIUDAD AL NORTE (Plaza de Espana, C.P. El Muelle, Estacion de Guaguas, Corte Ingles,
//    C.C. Meridiano y Recinto Ferial), y al OESTE corte de la TF-1 Sur (sin warp a Taco/Weyler).
// 4. meridiano: C.C. Meridiano (tiendas fast-fashion como casino + cartel de descuento de Bershka).
// 5. guarida_enriscada: sotano secreto bajo Bershka, hogar de EL COCO DE SANTA URSULA y sus gatos callejeros.
import type { GameMap, MapId } from './maps';
import type { TileId } from './sprites';
import { STORY } from './story';

/** Barrera de la entrada hecha polvo del parking del Palmetum: solo se cruza en 4x4. */
export const PARKING_GATE: { x: number; y: number }[] = [
  { x: 20, y: 12 },
  { x: 21, y: 12 },
];

/** Posicion de las escaleras mecanicas secretas en Bershka (aparecen al husmear el cartel tras Gym #4). */
export const BERSHKA_ESCALATOR = { x: 14, y: 2 };
export const BERSHKA_POSTER = { x: 12, y: 1 };

type NewMapId = Extract<
  MapId,
  | 'carretera_noche' | 'san_andres' | 'santacruz_sur' | 'meridiano' | 'guarida_enriscada'
  | 'torre_teresitas_1' | 'torre_teresitas_2' | 'torre_teresitas_3' | 'torre_teresitas_4' | 'torre_teresitas_5'
>;
type TowerMapId = Extract<NewMapId, `torre_teresitas_${1 | 2 | 3 | 4 | 5}`>;
type Grid = string[][];

const LEGEND: Record<string, TileId> = {
  B: 'building', W: 'window', D: 'door', s: 'sidewalk', Z: 'plaza', S: 'stairs',
  R: 'road', X: 'crosswalk', g: 'grass', E: 'tree', P: 'palm', h: 'bench', p: 'path',
  T: 'sign', O: 'monument', V: 'ravine', '~': 'sea', u: 'surf', n: 'blacksand', k: 'pothole',
  K: 'parking', F: 'fence', C: 'car', L: 'rail', M: 'table', H: 'parranda', J: 'colegio',
  d: 'deck', t: 'track',
};

const MALL_LEGEND: Record<string, TileId> = {
  '#': 'wall', '.': 'floor', i: 'tiles', D: 'door', W: 'window', P: 'plant',
  C: 'counter', M: 'table', h: 'bench', T: 'sign', X: 'box', A: 'machine',
  $: 'slot', '%': 'poster', e: 'escalator', S: 'stairs', Y: 'copier', m: 'mat',
  O: 'monument', F: 'fence', g: 'grass',
};

const grid = (w: number, h: number, fill: string): Grid =>
  Array.from({ length: h }, () => Array<string>(w).fill(fill));

const put = (g: Grid, x0: number, y0: number, x1: number, y1: number, c: string) => {
  for (let y = Math.max(0, y0); y <= Math.min(g.length - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(g[0].length - 1, x1); x++) g[y][x] = c;
  }
};

const toRows = (g: Grid): string[] => g.map((r) => r.join(''));

// ------------------------------------------------------------------
// 1. TF-134 NOCTURNA (40x34): NORTE (Taganana) -> SUR (San Andres)
// ------------------------------------------------------------------
const CN_W = 40;
const CN_H = 34;
const roadX = (y: number) => (y >= CN_H - 7 ? 15 : 15 + Math.round(5 * Math.sin(y / 4.2)));
const CN_SIGN = { x: roadX(13) + 2, y: 13 };

function buildCarretera(): string[] {
  const g = grid(CN_W, CN_H, 'E');
  for (let y = 0; y < CN_H; y++) {
    const cx = roadX(y);
    for (let x = 0; x < CN_W; x++) {
      const d = Math.abs(x - cx);
      if (d <= 1) {
        // Fila de baches obligatoria en y=16 para que a pie sea imposible cruzar
        const isHole = y === 16 || (y > 4 && y < CN_H - 7 && (x * 7 + y * 5) % 9 === 0);
        g[y][x] = isHole ? 'k' : 'R';
      } else if (d === 2) {
        g[y][x] = y % 3 === 0 ? 'V' : 'E';
      } else {
        g[y][x] = y % 4 === 0 ? 'P' : 'E';
      }
    }
  }
  g[CN_SIGN.y][CN_SIGN.x] = 'T';
  return toRows(g);
}

// ------------------------------------------------------------------
// 2. SAN ANDRES (30x18): Norte = TF-134, Sur = MAR, Este = Cementerio
//    de Las Teresitas (Torre Encantada), Oeste = Avenida Anaga.
// ------------------------------------------------------------------
const SA_W = 30;
const SA_H = 18;

function buildSanAndres(): string[] {
  const g = grid(SA_W, SA_H, 's');
  // MAR AL SUR
  put(g, 0, 17, SA_W - 1, 17, '~');
  put(g, 0, 16, SA_W - 1, 16, 'u');
  put(g, 0, 15, SA_W - 1, 15, 'n');
  // Casas marineras al norte
  put(g, 0, 0, 12, 6, 'B');
  put(g, 18, 0, SA_W - 1, 6, 'B');
  for (const x of [2, 5, 8, 11, 20, 23, 26]) { g[2][x] = 'W'; g[4][x] = 'W'; }
  g[6][4] = 'D'; g[6][9] = 'D'; g[6][21] = 'D';
  // Plaza del pueblo (peatonal)
  put(g, 3, 7, 21, 10, 'Z');
  g[9][6] = 'h'; g[8][11] = 'P'; g[9][19] = 'h';
  // Asfalto continuo: baja desde TF-134 (14..16, 0..12) y gira al OESTE (0..16, 11..12)
  put(g, 14, 0, 16, 12, 'R');
  put(g, 0, 11, 16, 12, 'R');
  g[11][10] = 'X'; g[12][10] = 'X';
  // Cementerio de Las Teresitas al ESTE con la Torre Encantada (vallado)
  put(g, 23, 8, 29, 8, 'F');
  put(g, 23, 14, 29, 14, 'F');
  put(g, 23, 8, 23, 14, 'F');
  put(g, 29, 8, 29, 14, 'F');
  put(g, 24, 9, 28, 13, 'g');
  g[10][26] = 'O'; // Torre Encantada
  g[11][26] = 'O';
  g[12][28] = 'E'; g[9][24] = 'P';
  g[10][22] = 'T'; // cartel del cementerio
  g[10][3] = 'T';  // cartel ← Avenida Anaga
  return toRows(g);
}

// ------------------------------------------------------------------
// 3. AVENIDA ANAGA · ZONA COMERCIAL · PALMETUM (68x22)
//    ESTE (x=67) = llegada desde San Andres (conduces hacia el OESTE).
//    OESTE (x=0..1) = cortado hacia la TF-1 Sur (sin warp a Weyler/Taco).
//    SUR (y=11..21) = MAR + Muelle + Auditorio + Maritimo + PALMETUM (Gym #4).
//    NORTE (y=0..7) = Plaza Espana + C.P. Muelle + Guaguas + Corte Ingles +
//                     C.C. MERIDIANO (puerta entrable!) + Recinto Ferial.
// ------------------------------------------------------------------
const SC_W = 68;
const SC_H = 22;

function buildSantaCruzSur(): string[] {
  const g = grid(SC_W, SC_H, 's');

  // ---- FRANJA NORTE (CIUDAD / ZONA COMERCIAL) ----
  put(g, 0, 0, SC_W - 1, 6, 'B');
  put(g, 0, 7, SC_W - 1, 7, 's');

  // Plaza de Espana y El Charco (noreste: x=59..65)
  put(g, 59, 2, 65, 6, 'Z');
  g[4][62] = 'O'; g[3][60] = 'P'; g[3][64] = 'P'; g[6][61] = 'T';
  // Centro Parrandero El Muelle (x=55..58)
  g[5][56] = 'H'; g[6][56] = 'D'; g[7][55] = 'T';

  // Intercambiador / Estacion de Guaguas (x=51..54) + Salida NORTE todo tieso a la AUTOPISTA TF-5 (x=48..50)
  for (const x of [52, 54]) { g[3][x] = 'W'; g[5][x] = 'W'; }
  put(g, 48, 0, 50, 6, 'R');
  put(g, 48, 7, 50, 7, 'X');
  g[3][49] = 'X';
  g[6][47] = 'T';
  g[7][51] = 'T';

  // El Corte Ingles (x=40..46)
  for (const x of [41, 43, 45]) { g[2][x] = 'W'; g[4][x] = 'W'; }
  g[6][44] = 'D';
  g[7][43] = 'T';

  // C.C. MERIDIANO — Casino Fast-Fashion (x=26..38, entrada en 32,6 y 33,6)
  for (const x of [27, 29, 31, 34, 36, 37]) { g[2][x] = 'W'; g[4][x] = 'W'; }
  g[6][32] = 'D'; g[6][33] = 'D';
  g[7][30] = 'T'; g[7][27] = 'P'; g[7][37] = 'P';

  // Recinto Ferial de Tenerife (x=6..23)
  put(g, 10, 5, 20, 6, 'Z');
  for (const x of [11, 14, 16, 19]) g[3][x] = 'W';
  g[6][12] = 'P'; g[6][18] = 'P'; g[7][15] = 'T';

  // ---- AVENIDA PRINCIPAL (ESTE -> OESTE: y=8..10) ----
  put(g, 2, 8, SC_W - 1, 10, 'R');
  for (const x of [20, 32, 44, 58]) put(g, x, 8, x, 10, 'X');
  // Corte de la TF-1 al OESTE (sin agujeros de gusano a Taco/Weyler)
  put(g, 0, 7, 1, 18, 'F');
  g[7][3] = 'T';

  // ---- FRANJA SUR (PASEO MARITIMO + PALMETUM + AUDITORIO + MUELLE + MAR AL SUR) ----
  put(g, 2, 11, SC_W - 1, 11, 's');
  put(g, 2, 12, SC_W - 1, 17, 'Z');
  put(g, 2, 18, SC_W - 1, 18, 'L'); // barandilla maritima
  put(g, 0, 19, SC_W - 1, 19, 'u'); // espuma de olas al sur
  put(g, 0, 20, SC_W - 1, 21, '~'); // OCEANO ATLANTICO AL SUR

  // Muelle de Anaga / Estacion Maritima (sureste: x=53..65)
  put(g, 53, 12, 65, 19, 'd');
  g[15][58] = 'O'; g[15][62] = 'O'; g[12][55] = 'T';

  // Auditorio de Tenerife (x=45..51)
  put(g, 46, 13, 50, 15, 'B');
  g[14][47] = 'W'; g[14][49] = 'W'; g[16][48] = 'O'; g[12][48] = 'T';

  // Parque Maritimo Cesar Manrique (x=38..44)
  put(g, 39, 14, 42, 16, 's');
  put(g, 40, 15, 41, 15, '~'); // piscina de agua salada
  g[13][39] = 'P'; g[13][43] = 'P'; g[12][41] = 'T';

  // PALMETUM DE SANTA CRUZ — GIMNASIO #4 (TIPO PLANTA) (x=14..36, y=12..18)
  // Cerrado por verja: SOLO se entra con el todoterreno por la rampa hecha polvo (20..21, 11..12)
  put(g, 14, 12, 36, 12, 'F');
  put(g, 14, 18, 36, 18, 'F');
  put(g, 14, 12, 14, 18, 'F');
  put(g, 36, 12, 36, 18, 'F');
  // Rampa de entrada hecha polvo (baches en y=11 + barrera PARKING_GATE en y=12)
  g[11][20] = 'k'; g[11][21] = 'k';
  g[11][19] = 'T'; // cartel del parking del Palmetum
  // Parking asfaltado interior (x=15..23, y=13..17)
  put(g, 15, 13, 23, 17, 'K');
  g[14][16] = 'C'; g[16][16] = 'C';
  // Valla interior entre el parking y el jardin botanico (paso peatonal en 24,15)
  put(g, 24, 13, 24, 17, 'F');
  g[15][24] = 'p';
  // Jardin Botanico del Palmetum (Gym #4 Tipo Planta: x=25..35, y=13..17)
  put(g, 25, 13, 35, 17, 'g');
  put(g, 25, 15, 34, 15, 'p');
  for (const [px, py] of [[25, 13], [27, 13], [30, 13], [34, 13], [35, 14], [26, 17], [29, 17], [33, 17], [35, 16]]) {
    g[py][px] = 'P';
  }
  g[13][32] = 'E'; g[17][31] = 'E';
  g[14][26] = 'T'; // cartel interior del Gym #4

  // Paseo oeste junto al mar (x=3..12)
  g[14][6] = 'P'; g[14][10] = 'h'; g[16][8] = 'P';

  return toRows(g);
}

// ------------------------------------------------------------------
// 4. C.C. MERIDIANO · CASINO FAST-FASHION (24x16)
//    Tiendas tragaperras a ambos lados + BERSHKA al fondo norte con
//    el cartel de descuento y las escaleras mecanicas ocultas.
// ------------------------------------------------------------------
function buildMeridiano(): string[] {
  const MW = 24, MH = 16;
  const g = grid(MW, MH, 'i');
  // Muros perimetrales
  put(g, 0, 0, MW - 1, 1, '#');
  put(g, 0, 0, 0, MH - 1, '#');
  put(g, MW - 1, 0, MW - 1, MH - 1, '#');
  put(g, 0, MH - 1, MW - 1, MH - 1, '#');
  // Puerta sur de salida a la Avenida
  g[MH - 1][11] = 'D'; g[MH - 1][12] = 'D';
  g[MH - 2][11] = 'm'; g[MH - 2][12] = 'm';

  // ---- FONDO NORTE: BERSHKA (cartel sospechoso en 12,1; escalera secreta en 14,2) ----
  put(g, 8, 2, 15, 4, '.');
  g[1][10] = 'W'; g[1][12] = '%'; g[1][15] = 'W';
  g[3][8] = 'P'; g[3][16] = 'P';
  g[2][9] = 'T'; // letrero BERSHKA

  // ---- GALERIA IZQUIERDA: PRIMARK (arriba) + PULL&BEAR (abajo) ----
  put(g, 2, 3, 6, 6, '.');
  g[3][3] = '$'; g[3][5] = '$'; g[3][2] = 'T';
  put(g, 2, 8, 6, 11, '.');
  g[8][3] = '$'; g[8][5] = '$'; g[8][2] = 'T';

  // ---- GALERIA DERECHA: ZARA VIP (arriba) + STRADIVARIUS (medio) ----
  put(g, 17, 3, 21, 6, '.');
  g[3][18] = '$'; g[3][20] = '$'; g[3][21] = 'T';
  put(g, 17, 8, 21, 10, '.');
  g[8][18] = '$'; g[8][20] = '$'; g[8][21] = 'T';

  // ---- MOSTRADOR DE DEVOLUCIONES / CANJE DE TICKETS REGALO (abajo dcha) ----
  put(g, 17, 12, 21, 12, 'C');
  g[12][16] = 'T';

  // Bancos y palmeras decorativas del pasillo central (sin bloquear paso)
  g[7][11] = 'h'; g[7][12] = 'h';
  g[13][3] = 'P'; g[13][6] = 'h';


  return toRows(g);
}

// ------------------------------------------------------------------
// 5. GUARIDA ENRISCADA · SUBSUELO DE BERSHKA (22x18)
//    Hogar de EL COCO DE SANTA URSULA y su mafia de gatos callejeros.
// ------------------------------------------------------------------
function buildGuaridaEnriscada(): string[] {
  const GW = 22, GH = 18;
  const g = grid(GW, GH, '.');
  // Paredes exteriores
  put(g, 0, 0, GW - 1, 1, '#');
  put(g, 0, GH - 1, GW - 1, GH - 1, '#');
  put(g, 0, 0, 0, GH - 1, '#');
  put(g, GW - 1, 0, GW - 1, GH - 1, '#');

  // Escalera mecanica de subida de vuelta a Bershka (Meridiano)
  g[2][3] = 'e';
  g[2][5] = 'T';

  // Tabique 1: almacen de cajas fast-fashion y picos de obra (paso al este x=16..18)
  put(g, 1, 7, 15, 7, '#');
  g[3][11] = 'X'; g[3][12] = 'X'; g[5][14] = 'X';
  g[2][18] = 'A'; g[2][19] = 'A';

  // Tabique 2: pasillo de seguridad hacia el despacho del Coco (paso en x=11..12)
  put(g, 1, 11, 10, 11, '#');
  put(g, 13, 11, 20, 11, '#');
  g[9][4] = 'X'; g[9][5] = 'X'; g[9][19] = 'X';

  // Despacho "nada italiano" de EL COCO DE SANTA URSULA (abajo)
  put(g, 3, 12, 9, 16, 'i'); // alfombra/marmol del padrino
  g[12][3] = 'P'; g[12][9] = 'P';
  g[13][3] = 'Y'; // la Maquina Fotocopiadora!
  g[13][6] = 'M'; g[13][7] = 'M'; // escritorio del Coco
  g[15][16] = 'X'; g[15][17] = 'A'; g[13][18] = 'T';

  return toRows(g);
}

// ------------------------------------------------------------------
// TORRE ENCANTADA (5 plantas): una guardia Enriscada obligatoria por
// piso; las senoras del club de las peras retan a repetir en los bajos.
// ------------------------------------------------------------------
function buildTowerFloor(floor: number): string[] {
  const W = 20, H = 16;
  const g = grid(W, H, 'i');
  put(g, 0, 0, W - 1, 0, '#');
  put(g, 0, H - 1, W - 1, H - 1, '#');
  put(g, 0, 0, 0, H - 1, '#');
  put(g, W - 1, 0, W - 1, H - 1, '#');

  // Escalera de caracol: bajada en el sur y subida en el norte.
  g[2][9] = 'S';
  g[13][9] = 'S';
  // Tumbas, velas y muebles de la torre; el pasillo central siempre queda libre.
  for (const y of [4, 8, 11]) {
    for (const x of [3, 5, 14, 16]) g[y][x] = 'O';
  }
  for (const [x, y] of [[2, 6], [17, 6], [2, 10], [17, 10]]) g[y][x] = 'A';
  g[6][2] = 'P'; g[6][17] = 'P';
  if (floor === 5) {
    g[5][9] = 'M';
    g[6][9] = 'm';
  }
  return toRows(g);
}

const TOWER_FLOORS: Record<TowerMapId, GameMap> = (() => {
  const floors = {} as Record<TowerMapId, GameMap>;
  const guardIds = ['', 'torre_enriscada_1', 'torre_enriscada_2', 'torre_enriscada_3', 'torre_enriscada_4'];
  const ladies = [
    '', 'nina_peras_barranco', 'dona_petra_teresitas', 'dona_candelaria_teresitas', 'dona_remedios_teresitas',
  ];
  const ladyIds = ['', 'nina_peras_barranco', 'dona_petra', 'dona_candelaria', 'dona_remedios'];
  const floorNames = [
    '', 'Primera planta · Capilla', 'Segunda planta · Osario', 'Tercera planta · Campanas',
    'Cuarta planta · Azotea baja', 'Quinta planta · Mirador encantado',
  ];

  for (let floor = 1; floor <= 5; floor++) {
    const id = `torre_teresitas_${floor}` as TowerMapId;
    const npcs = floor < 5
      ? [
          { id: guardIds[floor], sprite: 'enriscada', x: 9, y: 5, trainer: guardIds[floor] },
          { id: ladyIds[floor], sprite: 'nina_peras', x: 4, y: 9, trainer: ladies[floor] },
        ]
      : [{ id: 'bruja_teresitas', sprite: 'bruja_canaria', x: 9, y: 6 }];
    const triggers: GameMap['triggers'] = [];

    if (floor < 5) {
      triggers.push({
        x: 9, y: 2, kind: 'step',
        action: {
          type: 'towerStairs',
          requiredTrainer: guardIds[floor],
          to: `torre_teresitas_${floor + 1}` as MapId,
          x: 9, y: 12,
        },
      });
    }

    triggers.push(floor === 1
      ? { x: 9, y: 13, kind: 'step', action: { type: 'towerReturn', to: 'san_andres', x: 22, y: 12 } }
      : { x: 9, y: 13, kind: 'step', action: { type: 'towerReturn', to: `torre_teresitas_${floor - 1}` as MapId, x: 9, y: 3 } });

    floors[id] = {
      id,
      name: `Torre Encantada · ${floorNames[floor]}`,
      rows: buildTowerFloor(floor),
      legend: MALL_LEGEND,
      npcs,
      triggers,
      onEnter: floor < 5
        ? [
            `TORRE ENCANTADA · ${floorNames[floor].toUpperCase()}. El aire huele a cera, salitre y cortinas cerradas.`,
            `Un recluta del Team Enriscada corta el paso a la escalera. Derrotalo para subir al piso ${floor + 1}.`,
            'Tambien hay una senora con una Perita del Barranco y el mismo hechizo Cortar el Aire. A ellas se les puede retar todas las veces que quieras.',
          ]
        : [
            'QUINTA PLANTA · MIRADOR DE LA TORRE. La brisa mueve unas cintas rojas y una doña hace santeria canaria junto a un bucio.',
            'Has vencido a los cuatro del Team Enriscada. Habla con ella.',
          ],
    };
  }
  return floors;
})();

export const NEW_MAPS: Record<NewMapId, GameMap> = {
  ...TOWER_FLOORS,
  carretera_noche: {
    id: 'carretera_noche',
    name: 'TF-134 · Cumbre -> San Andres (Noche)',
    rows: buildCarretera(),
    legend: LEGEND,
    night: true,
    npcs: [],
    triggers: [
      { x: 14, y: 0, kind: 'step', action: { type: 'warp', to: 'anaga', x: 33, y: 20, dir: 'up' } },
      { x: 15, y: 0, kind: 'step', action: { type: 'warp', to: 'anaga', x: 33, y: 20, dir: 'up' } },
      { x: 16, y: 0, kind: 'step', action: { type: 'warp', to: 'anaga', x: 33, y: 20, dir: 'up' } },
      { x: 14, y: CN_H - 1, kind: 'step', action: { type: 'warp', to: 'san_andres', x: 15, y: 1, dir: 'down' } },
      { x: 15, y: CN_H - 1, kind: 'step', action: { type: 'warp', to: 'san_andres', x: 15, y: 1, dir: 'down' } },
      { x: 16, y: CN_H - 1, kind: 'step', action: { type: 'warp', to: 'san_andres', x: 15, y: 1, dir: 'down' } },
      { x: CN_SIGN.x, y: CN_SIGN.y, kind: 'interact', action: { type: 'text', lines: STORY.carretera_sign } },
      { x: 16, y: 2, kind: 'step', action: { type: 'zone', name: 'TF-134 · NOCHE' } },
      { x: 17, y: 2, kind: 'step', action: { type: 'zone', name: 'TF-134 · NOCHE' } },
    ],
    onEnter: [
      'CARRETERA A SAN ANDRES (DE NOCHE). Al Toyota Landcruiser del 34 le van fatal los faros: no se ve una mierda!',
      'Sigue el asfalto hacia el SUR: los baches del Team Enriscada te la pelan.',
    ],
  },

  san_andres: {
    id: 'san_andres',
    name: 'San Andres · Las Teresitas (Este) · Av. Anaga (Oeste)',
    rows: buildSanAndres(),
    legend: LEGEND,
    npcs: [
      { id: 'sanandres_vecina', sprite: 'chaxiraxi', x: 9, y: 9 },
      { id: 'sanandres_pescador', sprite: 'cayuquero', x: 13, y: 10 },
    ],
    triggers: [
      { x: 14, y: 0, kind: 'step', action: { type: 'warp', to: 'carretera_noche', x: 15, y: CN_H - 2, dir: 'up' } },
      { x: 15, y: 0, kind: 'step', action: { type: 'warp', to: 'carretera_noche', x: 15, y: CN_H - 2, dir: 'up' } },
      { x: 16, y: 0, kind: 'step', action: { type: 'warp', to: 'carretera_noche', x: 15, y: CN_H - 2, dir: 'up' } },
      { x: 0, y: 11, kind: 'step', action: { type: 'warp', to: 'santacruz_sur', x: 66, y: 9, dir: 'left' } },
      { x: 0, y: 12, kind: 'step', action: { type: 'warp', to: 'santacruz_sur', x: 66, y: 9, dir: 'left' } },
      { x: 22, y: 10, kind: 'interact', action: { type: 'cemeterySign' } },
      { x: 23, y: 11, kind: 'interact', action: { type: 'enterTeresitasTower' } },
      { x: 3, y: 10, kind: 'interact', action: { type: 'text', lines: ['← AVENIDA ANAGA hacia SANTA CRUZ (Muelle · Auditorio · Palmetum · Meridiano · Corte Ingles).'] } },
      { x: 15, y: 3, kind: 'step', action: { type: 'zone', name: 'SAN ANDRES' } },
      { x: 4, y: 11, kind: 'step', action: { type: 'zone', name: 'SALIDA AV. ANAGA' } },
      { x: 4, y: 12, kind: 'step', action: { type: 'zone', name: 'SALIDA AV. ANAGA' } },
    ],
    onEnter: [
      'SAN ANDRES! Ya se oye el mar al sur y se acabo la oscuridad de la cumbre.',
      'Al ESTE esta el Cementerio de Las Teresitas (dicen que montaron una TORRE ENCANTADA, pero sin equipo cazafantasmas pasamos). Al OESTE sale la AVENIDA ANAGA!',
    ],
  },

  santacruz_sur: {
    id: 'santacruz_sur',
    name: 'Av. Anaga · Muelle · Palmetum · Meridiano · Recinto',
    rows: buildSantaCruzSur(),
    legend: LEGEND,
    npcs: [
      { id: 'guardia_parking', sprite: 'conserje', x: 18, y: 11 },
      { id: 'jardinera_palmetum', sprite: 'cathaysa', x: 28, y: 14, trainer: 'jardinera_palmetum' },
      { id: 'gym_palmetum', sprite: 'jardinero', x: 33, y: 15, trainer: 'gym_palmetum' },
    ],
    triggers: [
      // Regreso al ESTE hacia San Andres (conduciendo o a pie)
      { x: 67, y: 8, kind: 'step', action: { type: 'warp', to: 'san_andres', x: 1, y: 12, dir: 'right' } },
      { x: 67, y: 9, kind: 'step', action: { type: 'warp', to: 'san_andres', x: 1, y: 12, dir: 'right' } },
      { x: 67, y: 10, kind: 'step', action: { type: 'warp', to: 'san_andres', x: 1, y: 12, dir: 'right' } },

      // Centro Parrandero El Muelle (norte, junto a Plaza de Espana)
      { x: 56, y: 6, kind: 'step', action: { type: 'enterParrandero', id: 'muelle' } },
      { x: 55, y: 7, kind: 'interact', action: { type: 'text', lines: ['CENTRO PARRANDERO EL MUELLE. Dorada fresquita, barraquito y PC de Ayoze.'] } },

      // C.C. MERIDIANO — puertas de entrada (a pie!)
      { x: 32, y: 6, kind: 'step', action: { type: 'enterMeridiano' } },
      { x: 33, y: 6, kind: 'step', action: { type: 'enterMeridiano' } },
      { x: 30, y: 7, kind: 'interact', action: { type: 'text', lines: STORY.meridiano_sign } },

      // PALMETUM — Parking (solo 4x4) + Jardin Botanico (Gym #4 Tipo Planta)
      { x: 19, y: 11, kind: 'interact', action: { type: 'text', lines: STORY.parking_sign } },
      { x: 20, y: 12, kind: 'interact', action: { type: 'text', lines: STORY.parking_sign } },
      { x: 21, y: 12, kind: 'interact', action: { type: 'text', lines: STORY.parking_sign } },
      { x: 24, y: 15, kind: 'step', action: { type: 'zone', name: 'PALMETUM · GYM #4' } },
      { x: 25, y: 15, kind: 'step', action: { type: 'once', key: 'palmetum_jardin', lines: STORY.jardin } },
      { x: 26, y: 14, kind: 'interact', action: { type: 'text', lines: STORY.palmetum_sign } },

      // Landmarks norte y sur + corte TF-1 al oeste
      { x: 61, y: 6, kind: 'interact', action: { type: 'text', lines: STORY.plaza_espana } },
      { x: 55, y: 12, kind: 'interact', action: { type: 'text', lines: STORY.muelle } },
      { x: 51, y: 7, kind: 'interact', action: { type: 'text', lines: STORY.estacion } },
      { x: 47, y: 6, kind: 'interact', action: { type: 'text', lines: STORY.estacion } },
      // Incorporacion NORTE desde la Estacion de S/C hacia la Autopista TF-5 (bajo el Puente de Taco!)
      { x: 48, y: 0, kind: 'step', action: { type: 'enterTf5' } },
      { x: 49, y: 0, kind: 'step', action: { type: 'enterTf5' } },
      { x: 50, y: 0, kind: 'step', action: { type: 'enterTf5' } },
      { x: 48, y: 4, kind: 'step', action: { type: 'zone', name: '↑ SALIDA TF-5 NORTE' } },
      { x: 49, y: 4, kind: 'step', action: { type: 'zone', name: '↑ SALIDA TF-5 NORTE' } },
      { x: 50, y: 4, kind: 'step', action: { type: 'zone', name: '↑ SALIDA TF-5 NORTE' } },
      { x: 48, y: 12, kind: 'interact', action: { type: 'text', lines: STORY.auditorio } },
      { x: 43, y: 7, kind: 'interact', action: { type: 'text', lines: STORY.corte_ingles } },
      { x: 44, y: 6, kind: 'step', action: { type: 'warp', to: 'eci_pb', x: 10, y: 12, dir: 'up' } },
      { x: 41, y: 12, kind: 'interact', action: { type: 'text', lines: STORY.maritimo } },
      { x: 15, y: 7, kind: 'interact', action: { type: 'text', lines: STORY.recinto } },
      // Incorporacion OESTE a la Autopista TF-1 Sur (cerrada hasta bajar de la Torre con el Bucio)
      { x: 3, y: 7, kind: 'interact', action: { type: 'tf1Sign' } },
      { x: 1, y: 8, kind: 'interact', action: { type: 'tf1Sign' } },
      { x: 1, y: 9, kind: 'interact', action: { type: 'tf1Sign' } },
      { x: 1, y: 10, kind: 'interact', action: { type: 'tf1Sign' } },
      { x: 2, y: 8, kind: 'step', action: { type: 'enterTf1' } },
      { x: 2, y: 9, kind: 'step', action: { type: 'enterTf1' } },
      { x: 2, y: 10, kind: 'step', action: { type: 'enterTf1' } },
      { x: 0, y: 8, kind: 'step', action: { type: 'enterTf1' } },
      { x: 0, y: 9, kind: 'step', action: { type: 'enterTf1' } },
      { x: 0, y: 10, kind: 'step', action: { type: 'enterTf1' } },

      // Banners de zona conduciendo de ESTE a OESTE
      { x: 63, y: 9, kind: 'step', action: { type: 'zone', name: 'AV. ANAGA · MUELLE' } },
      { x: 48, y: 9, kind: 'step', action: { type: 'zone', name: 'AUDITORIO · GUAGUAS' } },
      { x: 42, y: 9, kind: 'step', action: { type: 'zone', name: 'CORTE INGLES · MARITIMO' } },
      { x: 32, y: 9, kind: 'step', action: { type: 'zone', name: 'C.C. MERIDIANO' } },
      { x: 21, y: 9, kind: 'step', action: { type: 'zone', name: 'PARKING PALMETUM' } },
      { x: 14, y: 9, kind: 'step', action: { type: 'zone', name: 'RECINTO FERIAL' } },
    ],
    onEnter: [
      'AVENIDA ANAGA (SANTA CRUZ)! Entras desde San Andres rumbo al OESTE, con el MAR y el MUELLE al SUR.',
      'Al SUR estan el Auditorio, el Parque Maritimo y el PALMETUM (GIMNASIO #4 · TIPO PLANTA: entra en 4x4 por su parking reventado!).',
      'Al NORTE tienes el C.P. El Muelle, la Estacion de Guaguas, el Corte Ingles, el C.C. MERIDIANO y el Recinto Ferial.',
    ],
  },

  meridiano: {
    id: 'meridiano',
    name: 'C.C. Meridiano · Casino Fast-Fashion',
    rows: buildMeridiano(),
    legend: MALL_LEGEND,
    npcs: [
      { id: 'enriscada_bershka', sprite: 'enriscada', x: 12, y: 2 },
      { id: 'dependienta_bershka', sprite: 'cathaysa', x: 9, y: 4 },
      { id: 'clienta_meridiano', sprite: 'professor', x: 8, y: 11 },
      { id: 'pibe_meridiano', sprite: 'estudiante', x: 15, y: 11 },
      { id: 'cajera_meridiano', sprite: 'chaxiraxi', x: 19, y: 11 },
    ],
    triggers: [
      // Salida sur a Santa Cruz Sur
      { x: 11, y: 15, kind: 'step', action: { type: 'warp', to: 'santacruz_sur', x: 32, y: 7, dir: 'down' } },
      { x: 12, y: 15, kind: 'step', action: { type: 'warp', to: 'santacruz_sur', x: 33, y: 7, dir: 'down' } },

      // Cartel sospechoso de descuento de BERSHKA + escaleras mecanicas ocultas
      { x: 12, y: 1, kind: 'interact', action: { type: 'bershkaPoster' } },
      { x: 14, y: 2, kind: 'step', action: { type: 'bershkaEscalator' } },
      { x: 9, y: 2, kind: 'interact', action: { type: 'text', lines: ['BERSHKA — "MEGA DESCUENTO -70%: TE LO PONES HOY, SE DESINTEGRA MAÑANA".'] } },

      // Tragaperras Fast-Fashion
      { x: 3, y: 3, kind: 'interact', action: { type: 'fastFashionSlot', brand: 'PRIMARK', bet: 5 } },
      { x: 5, y: 3, kind: 'interact', action: { type: 'fastFashionSlot', brand: 'PRIMARK', bet: 5 } },
      { x: 2, y: 3, kind: 'interact', action: { type: 'text', lines: ['PRIMARK · RULETA 5 DUROS. Calcetines de usar y tirar: toca la caja de al lado pa jugar!'] } },
      { x: 3, y: 8, kind: 'interact', action: { type: 'fastFashionSlot', brand: 'PULL&BEAR', bet: 5 } },
      { x: 5, y: 8, kind: 'interact', action: { type: 'fastFashionSlot', brand: 'PULL&BEAR', bet: 5 } },
      { x: 2, y: 8, kind: 'interact', action: { type: 'text', lines: ['PULL&BEAR · RULETA 5 DUROS. Sudaderas que encogen tres tallas al mirarlas!'] } },
      { x: 18, y: 3, kind: 'interact', action: { type: 'fastFashionSlot', brand: 'ZARA VIP', bet: 10 } },
      { x: 20, y: 3, kind: 'interact', action: { type: 'fastFashionSlot', brand: 'ZARA VIP', bet: 10 } },
      { x: 21, y: 3, kind: 'interact', action: { type: 'text', lines: ['ZARA VIP · RULETA 10 DUROS. Se rompe igual mañana, pero con etiqueta minimalista y premios dobles!'] } },
      { x: 18, y: 8, kind: 'interact', action: { type: 'fastFashionSlot', brand: 'STRADIVARIUS', bet: 5 } },
      { x: 20, y: 8, kind: 'interact', action: { type: 'fastFashionSlot', brand: 'STRADIVARIUS', bet: 5 } },
      { x: 21, y: 8, kind: 'interact', action: { type: 'text', lines: ['STRADIVARIUS · RULETA 5 DUROS. Gastas hoy, se descose mañana y pasado repites!'] } },

      // Mostrador de canje de Tickets Regalo
      { x: 13, y: 12, kind: 'interact', action: { type: 'text', lines: ['ATENCIÓN AL CLIENTE: El Coco y sus gatos están abajo en el sótano. Si quieres el equipo cazafantasmas, tendrás que ganarle. La fotocopiadora se la llevará después a Magos de la Costa.'] } },
      { x: 16, y: 12, kind: 'interact', action: { type: 'text', lines: ['ATENCION AL CLIENTE / CANJE DE CARTAS. Habla con la cajera para cambiar duros por Magomones exclusivos!'] } },
      { x: 18, y: 12, kind: 'interact', action: { type: 'meridianoPrizes' } },
      { x: 19, y: 12, kind: 'interact', action: { type: 'meridianoPrizes' } },
      { x: 20, y: 12, kind: 'interact', action: { type: 'meridianoPrizes' } },
    ],
    onEnter: [
      'C.C. MERIDIANO! Musica chunda-chunda a tope y tiendas fast-fashion funcionando como un CASINO: gastas hoy, se te rompe mañana y pasado vuelves!',
      'Puedes probar suerte en PRIMARK, PULL&BEAR, STRADIVARIUS y ZARA, canjear cartas en caja o curiosear el BERSHKA al fondo.',
    ],
  },

  guarida_enriscada: {
    id: 'guarida_enriscada',
    name: 'Guarida Enriscada · Sótano del Coco',
    rows: buildGuaridaEnriscada(),
    legend: MALL_LEGEND,
    npcs: [
      { id: 'enriscada_guarida_1', sprite: 'enriscada', x: 9, y: 4, trainer: 'enriscada_guarida_1' },
      { id: 'enriscada_guarida_2', sprite: 'enriscada', x: 14, y: 9, trainer: 'enriscada_guarida_2' },
      { id: 'don_michi_npc', sprite: 'gato_npc', x: 5, y: 15 },
      { id: 'coco_ursula', sprite: 'coco_ursula', x: 7, y: 15, trainer: 'coco_santa_ursula' },
    ],
    triggers: [
      { x: 3, y: 2, kind: 'step', action: { type: 'warp', to: 'meridiano', x: 14, y: 3, dir: 'down' } },
      { x: 5, y: 2, kind: 'interact', action: { type: 'text', lines: ['ESCALERAS MECANICAS SECRETAS. Suben directo al probador falso del BERSHKA en Meridiano.'] } },
      { x: 3, y: 13, kind: 'interact', action: { type: 'text', lines: ['El despacho está vacío: el Coco se llevó su fotocopiadora a MAGOS DE LA COSTA. Solo queda olor a espresso.'] } },
      { x: 18, y: 13, kind: 'interact', action: { type: 'text', lines: ['PIZARRA DEL TEAM ENRISCADA: "1) Abrir zanjas en Anaga. 2) Vender ropa que dura 12h. 3) Subir a la Torre de Las Teresitas. 4) Comprar oregano."'] } },
      { x: 11, y: 12, kind: 'step', action: { type: 'zone', name: 'DESPACHO DEL COCO' } },
      { x: 12, y: 12, kind: 'step', action: { type: 'zone', name: 'DESPACHO DEL COCO' } },
    ],
    onEnter: [
      'GUARIDA ENRISCADA (SOTANO SECRETO DEL MERIDIANO). Bajas por las escaleras mecánicas entre cajas de perchas y maullidos.',
      'Al fondo huele a espresso recién hecho: ahí espera EL COCO DE SANTA ÚRSULA con Don Michi y sus gatos callejeros.',
    ],
  },
};
