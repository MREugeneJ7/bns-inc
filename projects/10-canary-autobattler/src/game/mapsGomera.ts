import type { GameMap, NPC, Trigger } from './maps';
import type { TileId } from './sprites';

export const GOMERA_SEA_START = 29;
export const SAN_SEBASTIAN_PIER = { x: 48, y: 84 } as const;
export const SAN_SEBASTIAN_ENTRY = { x: 23, y: 2 } as const;
export const BORONDON_COVE = { x: 12, y: 20 } as const;
export const BORONDON_RETURN = { x: 42, y: 60 } as const;
export const BORONDON_PRIZE = { x: 13, y: 3 } as const;
export const BORONDON_HIDDEN_MS = 6000;
export const BORONDON_PERIOD_MS = BORONDON_HIDDEN_MS + 9000;

const bank = {
  x: 39, y: 53,
  rows: [
    '  rrr  ',
    ' rr^rr ',
    'rr^^Prr',
    'rr^nnrr',
    ' rnnnrr',
    '  nnrr ',
    '  nn   ',
  ],
};
const bankTiles: Record<string, TileId> = { r: 'roque', '^': 'redrock', P: 'palm', n: 'blacksand' };

export function borondonBankAt(x: number, y: number): TileId | undefined {
  return bankTiles[bank.rows[y - bank.y]?.[x - bank.x] ?? ''];
}

export function borondonAboveWater(ms: number): boolean {
  return ms % BORONDON_PERIOD_MS >= BORONDON_HIDDEN_MS;
}

export const GOMERA_TRAINERS: NPC[] = [
  { id: 'delfines_lucia', x: 43, y: 36, sprite: 'barco_delfines', trainer: 'delfines_lucia' },
  { id: 'moto_yeray', x: 47, y: 45, sprite: 'moto_acuatica', trainer: 'moto_yeray' },
  { id: 'delfines_omar', x: 45, y: 65, sprite: 'barco_delfines', trainer: 'delfines_omar' },
  { id: 'moto_ines', x: 49, y: 76, sprite: 'moto_acuatica', trainer: 'moto_ines' },
];

export function gomeraVesselRadius(sprite: string): number {
  return sprite === 'barco_delfines' ? 1 : 0;
}

export const GOMERA_BUOYS = [
  [41, 31], [50, 40], [44, 49], [47, 53], [46, 60], [50, 70], [46, 79],
] as const;

// Continue the Troya grid itself; crossing into the strait never changes maps.
export function appendGomeraChannel(coast: string[][]) {
  const width = coast[0].length;
  for (let y = GOMERA_SEA_START; y <= 89; y++) {
    const center = 44 + Math.round(4 * (y - GOMERA_SEA_START) / (SAN_SEBASTIAN_PIER.y - GOMERA_SEA_START));
    const row: string[] = Array.from({ length: width }, (_, x) => {
      if (Math.abs(x - center) > 11) return 'u'; // Corriente fuera del canal balizado.
      if (y >= 88) return '^';
      if (y >= 86 && (x < 44 || x > 52)) return 'r';
      return '~';
    });
    if (y >= SAN_SEBASTIAN_PIER.y && y <= 87) {
      for (const x of [47, 48, 49]) row[x] = 'd';
      if (y === 87) row[SAN_SEBASTIAN_PIER.x] = 'T';
    }
    if (y === 88) { row[47] = 'd'; row[49] = 'd'; }
    coast.push(row);
  }
}

const sign = (x: number, y: number, ...lines: string[]): Trigger =>
  ({ x, y, kind: 'interact', action: { type: 'text', lines } });

export const GOMERA_COAST_TRIGGERS: Trigger[] = [
  ...bank.rows.flatMap((row, dy) => Array.from(row).flatMap((c, dx): Trigger[] => c === 'n'
    ? [{ x: bank.x + dx, y: bank.y + dy, kind: 'step', action: { type: 'landBorondon' } }]
    : [])),
  ...[47, 48, 49].map((x): Trigger => ({ x, y: SAN_SEBASTIAN_PIER.y, kind: 'step', action: { type: 'zone', name: 'SAN SEBASTIÁN · LA GOMERA' } })),
  ...[47, 49].map((x): Trigger => ({ x, y: 88, kind: 'step', action: { type: 'warp', to: 'san_sebastian', ...SAN_SEBASTIAN_ENTRY, dir: 'down' } })),
  sign(SAN_SEBASTIAN_PIER.x, 87, 'SAN SEBASTIÁN DE LA GOMERA. Colón estuvo aquí. La ciudad está al sur, a ambos lados de este cartel.',
    'Para volver a Troya, saca la Pukas mirando al norte desde el borde del pantalán.'),
];

function buildBorondon(): GameMap {
  const grid = Array.from({ length: 23 }, (_, y) => Array(23).fill(y < 19 ? '^' : '~'));
  const fill = (x: number, y: number, right: number, bottom: number, ch: string) => {
    for (let j = y; j <= bottom; j++) for (let i = x; i <= right; i++) grid[j][i] = ch;
  };
  fill(1, 1, 21, 18, 'v');
  fill(9, 16, 14, 21, 'n'); // Cala de regreso.
  fill(11, 22, 13, 22, 'n');
  fill(4, 14, 6, 18, '.'); grid[17][7] = 'p';
  fill(4, 8, 7, 12, '.'); grid[10][8] = 'p';
  fill(11, 8, 15, 12, '.'); grid[10][10] = 'p';
  fill(11, 2, 15, 6, 'f');
  fill(16, 16, 19, 18, '.');
  fill(3, 3, 6, 6, '.');
  fill(17, 8, 20, 10, '.');

  for (const [x, y] of [[9, 17], [6, 17], [5, 14], [5, 12], [7, 10], [11, 10], [13, 8], [13, 6]]) grid[y][x] = 'p';
  for (const [x, y] of [[9, 18], [4, 15], [7, 9], [14, 8], [11, 3], [15, 3]]) grid[y][x] = 'o';
  for (const [x, y] of [[12, 18], [18, 17], [5, 4], [19, 9]]) grid[y][x] = 'T';
  grid[BORONDON_PRIZE.y][BORONDON_PRIZE.x] = '*';
  return {
    id: 'san_borondon', name: 'San Borondón · Los riscos de la bruma',
    legend: { '^': 'redrock', '~': 'sea', v: 'ravine', n: 'blacksand', '.': 'arid', f: 'floor', p: 'path', o: 'monument', T: 'sign', '*': 'card' },
    rows: grid.map(row => row.join('')), npcs: [],
    triggers: [
      ...[11, 12, 13].map((x): Trigger => ({ x, y: 22, kind: 'step', action: { type: 'sailFromBorondon' } })),
      { ...BORONDON_PRIZE, kind: 'interact', action: { type: 'pickupNevada' } },
      sign(12, 18, 'LOS RISCOS DE LA BRUMA. Los mojones en pie marcan las cornisas que llevan a la cumbre.',
        'Mira al otro borde de cada grieta y usa la VARA DEL SALTO DEL PASTOR desde la mochila.'),
      sign(18, 17, 'Un mojón tumbado. Aquí no hay subida. El primer mojón en pie está al oeste de la cala.'),
      sign(5, 4, 'La bruma tapa el fondo. No hay salto que cubra ese ancho. La senda sigue al otro lado, hacia el este.'),
      sign(19, 9, 'Aquí solo quedan conchas. El último mojón mira al norte.'),
    ],
    onEnter: ['SAN BORONDÓN. La bruma se cierra detrás de ti. Al sur de la cala siempre puedes volver al mar.',
      'Los mojones asoman entre los riscos. El aire huele a nieve.'],
  };
}

export const SAN_BORONDON = buildBorondon();

const makeGrid = (w: number, h: number, ch: string): string[][] => Array.from({ length: h }, () => Array(w).fill(ch));
const rect = (g: string[][], x: number, y: number, right: number, bottom: number, ch: string) => {
  for (let j = y; j <= bottom; j++) for (let i = x; i <= right; i++) g[j][i] = ch;
};
const warp = (x: number, y: number, to: GameMap['id'], tx: number, ty: number, dir: 'up' | 'down' | 'left' | 'right'): Trigger =>
  ({ x, y, kind: 'step', action: { type: 'warp', to, x: tx, y: ty, dir } });

export const GOMERA_DOORS = {
  center: { x: 6, y: 10 }, school: { x: 40, y: 10 }, certifier: { x: 15, y: 10 },
  mansion: { x: 9, y: 24 }, gym: { x: 36, y: 24 },
} as const;

function sanSebastian(): GameMap {
  const g = makeGrid(47, 30, 'E');
  rect(g, 1, 1, 45, 28, 'Z');
  rect(g, 1, 1, 45, 3, '~');
  rect(g, 21, 0, 25, 4, 'd');
  rect(g, 1, 14, 45, 15, 'R');
  // The five entrances surround a central plaza, all on foot-accessible ground.
  for (const [x1, x2] of [[2, 9], [12, 19], [37, 44]]) {
    rect(g, x1, 5, x2, 10, 'B');
    for (let x = x1 + 1; x < x2; x += 3) { g[7][x] = 'W'; g[9][x] = 'W'; }
  }
  rect(g, 3, 18, 16, 24, 'B'); rect(g, 30, 18, 43, 24, 'B');
  for (const x of [4, 7, 11, 14, 31, 34, 38, 41]) { g[20][x] = 'W'; g[22][x] = 'W'; }
  for (const door of Object.values(GOMERA_DOORS)) g[door.y][door.x] = 'D';
  g[9][6] = 'H'; g[9][40] = 'J';
  rect(g, 28, 6, 34, 10, 'g');
  g[6][33] = 'P'; g[8][29] = 'P'; g[8][31] = 'o'; g[10][30] = 'h'; g[10][34] = 'h';
  for (const [x, y] of [[2, 12], [44, 12], [2, 26], [44, 26], [20, 19], [26, 19]]) g[y][x] = 'P';
  for (const [x, y] of [[19, 22], [27, 22], [4, 16], [42, 16]]) g[y][x] = 'h';
  for (const [x, y] of [[25, 4], [7, 11], [16, 11], [41, 11], [11, 25], [38, 25], [25, 17]]) g[y][x] = 'T';
  g[18][23] = 'o';

  return {
    id: 'san_sebastian', name: 'San Sebastián de La Gomera',
    rows: g.map(row => row.join('')),
    legend: { E: 'tree', Z: 'plaza', g: 'grass', '~': 'sea', d: 'deck', R: 'road', B: 'building', W: 'window', D: 'door', H: 'parranda', J: 'colegio', P: 'palm', h: 'bench', T: 'sign', o: 'monument' },
    npcs: [
      { id: 'curbelo_puerto', sprite: 'casimiro', x: 27, y: 5 },
      { id: 'curbelo_plaza', sprite: 'casimiro', x: 20, y: 12 },
      { id: 'curbelo_calle', sprite: 'casimiro', x: 31, y: 16 },
      { id: 'curbelo_mansion_fuera', sprite: 'casimiro', x: 17, y: 26 },
    ],
    triggers: [
      ...[21, 22, 23, 24, 25].map(x => warp(x, 0, 'veronicas', 48, 86, 'up')),
      { ...GOMERA_DOORS.center, kind: 'step', action: { type: 'enterParrandero', id: 'gomera' } },
      { ...GOMERA_DOORS.school, kind: 'step', action: { type: 'enterSchool', id: 'gomera' } },
      warp(GOMERA_DOORS.certifier.x, GOMERA_DOORS.certifier.y, 'certificador_gomera', 7, 8, 'up'),
      warp(GOMERA_DOORS.mansion.x, GOMERA_DOORS.mansion.y, 'mansion_curbelo', 11, 21, 'up'),
      { ...GOMERA_DOORS.gym, kind: 'step', action: { type: 'enterCurbeloGym' } },
      sign(25, 4, 'SAN SEBASTIÁN DE LA GOMERA. Colón estuvo aquí. El puerto está al norte y la plaza al sur.'),
      sign(31, 8, 'JARDÍN DEL PUERTO. Otro monumento recuerda que Colón estuvo aquí. No será el último.'),
      sign(7, 11, 'CENTRO PARRANDERO. Chaxiraxi plancha las cartas. Colón estuvo aquí, por si nadie te lo había dicho.'),
      sign(16, 11, 'CENTRO CERTIFICADOR. Casimiro legaliza tus cartas antiguas. Colón estuvo aquí antes que tú.'),
      sign(41, 11, 'CEIP SAN SEBASTIÁN. Duelos de recreo. Colón estuvo aquí, aunque no sabemos si aprobó mates.'),
      sign(11, 25, 'MANSIÓN DE CASIMIRO. Un laberinto custodia la llave del guachinche. Colón estuvo aquí; la llave, también.'),
      sign(38, 25, 'GUACHINCHE DE CASIMIRO · TIPO FUEGO. Se necesita la llave de la mansión. ¿Sabías que Colón estuvo aquí?'),
      sign(25, 17, 'PLAZA DE COLÓN. Sí, ese Colón. Sí, estuvo aquí.'),
      sign(23, 18, 'Monumento a Colón. Debajo pone: «COLÓN ESTUVO AQUÍ». En letras aún más grandes.'),
    ],
    onEnter: ['SAN SEBASTIÁN DE LA GOMERA. El puerto queda al norte. Las calles desembocan en la plaza.',
      'Un cartel, otro cartel y tres señores idénticos te informan de que COLÓN ESTUVO AQUÍ.'],
  };
}

function certificador(): GameMap {
  const g = makeGrid(15, 11, '#');
  rect(g, 1, 1, 13, 9, '.');
  rect(g, 4, 3, 10, 3, 'C');
  g[2][2] = 'X'; g[2][12] = 'X'; g[5][2] = 'T'; g[5][12] = 'T';
  g[7][3] = 'h'; g[7][11] = 'a'; g[10][7] = 'D';
  return {
    id: 'certificador_gomera', name: 'Centro Certificador · La Gomera',
    rows: g.map(row => row.join('')),
    legend: { '#': 'wall', '.': 'floor', C: 'counter', X: 'box', T: 'sign', h: 'bench', a: 'plant', D: 'door' },
    npcs: [{ id: 'curbelo_certificador', sprite: 'casimiro', x: 7, y: 2 }],
    triggers: [
      warp(7, 10, 'san_sebastian', 15, 11, 'down'),
      sign(2, 5, 'CENTRO CERTIFICADOR. Las cartas antiguas son legales cuando Casimiro las sella. Colón estuvo aquí.'),
      sign(12, 5, 'Certificado de presencia: COLÓN ESTUVO AQUÍ. Certificado de cartas: pregúntale a Casimiro.'),
    ],
  };
}

function mansion() {
  const g = makeGrid(25, 23, '#');
  const start = { x: 11, y: 17 };
  const stack = [start];
  g[start.y][start.x] = '.';
  let seed = 1492;
  const directions = [[0, -2], [2, 0], [0, 2], [-2, 0]] as const;
  while (stack.length) {
    const current = stack[stack.length - 1];
    const next = directions.map(([dx, dy]) => ({ x: current.x + dx, y: current.y + dy, dx, dy }))
      .filter(p => p.x > 0 && p.x < 24 && p.y > 0 && p.y < 18 && g[p.y][p.x] === '#');
    if (!next.length) { stack.pop(); continue; }
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const target = next[seed % next.length];
    g[current.y + target.dy / 2][current.x + target.dx / 2] = '.';
    g[target.y][target.x] = '.';
    stack.push({ x: target.x, y: target.y });
  }

  // A fixed maze and a farthest reachable dead end keep the key in the same place in every save.
  const queue = [start];
  const seen = new Set([`${start.x},${start.y}`]);
  for (let i = 0; i < queue.length; i++) {
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const x = queue[i].x + dx, y = queue[i].y + dy, key = `${x},${y}`;
      if (g[y]?.[x] !== '.' || seen.has(key)) continue;
      seen.add(key); queue.push({ x, y });
    }
  }
  const key = queue[queue.length - 1];
  g[key.y][key.x] = 'K';
  g[18][11] = '.';
  rect(g, 7, 19, 17, 21, '.');
  g[20][15] = 'T'; g[19][7] = 'a'; g[22][11] = 'D';

  const plaques: Trigger[] = [];
  for (let y = 2; y <= 16 && plaques.length < 5; y++) for (let x = 2; x <= 22 && plaques.length < 5; x++) {
    if (g[y][x] !== '#' || (x * 7 + y * 11) % 17 !== 0) continue;
    if (![[0, -1], [1, 0], [0, 1], [-1, 0]].some(([dx, dy]) => g[y + dy]?.[x + dx] === '.')) continue;
    g[y][x] = 'T';
    plaques.push(sign(x, y, `Retrato ${plaques.length + 1}: Colón estuvo aquí. La llave sigue al fondo del laberinto.`));
  }
  const map: GameMap = {
    id: 'mansion_curbelo', name: 'Mansión de Casimiro · Laberinto',
    rows: g.map(row => row.join('')),
    legend: { '#': 'wall', '.': 'floor', K: 'oldkey', T: 'sign', a: 'plant', D: 'door' },
    npcs: [{ id: 'curbelo_mansion', sprite: 'casimiro', x: 8, y: 20 }],
    triggers: [
      warp(11, 22, 'san_sebastian', 9, 25, 'down'),
      { ...key, kind: 'interact', action: { type: 'pickupCurbeloKey' } },
      sign(15, 20, 'MANSIÓN DE CASIMIRO. Colón estuvo aquí. La llave del guachinche espera al fondo; vuelve por la misma puerta.'),
      ...plaques,
    ],
    onEnter: ['MANSIÓN DE CASIMIRO. Colón estuvo aquí. Su retrato aparece en cada pasillo.',
      'El vestíbulo queda a tu espalda. Busca la llave del guachinche entre los corredores.'],
  };
  return { map, key };
}

const mansionResult = mansion();
export const CURBELO_KEY = mansionResult.key;

function guachinche(): GameMap {
  const g = makeGrid(21, 16, '#');
  rect(g, 1, 1, 19, 14, '.');
  rect(g, 7, 2, 13, 2, 'C');
  for (const [x, y] of [[2, 3], [18, 3], [3, 6], [17, 6]]) g[y][x] = 'Q';
  for (const [x, y] of [[4, 9], [6, 9], [14, 9], [16, 9]]) g[y][x] = 'M';
  g[12][3] = 'T'; g[12][17] = 'T'; g[15][10] = 'D';
  return {
    id: 'guachinche_curbelo', name: 'Guachinche de Casimiro · Tipo Fuego',
    rows: g.map(row => row.join('')),
    legend: { '#': 'wall', '.': 'floor', C: 'counter', Q: 'fogon', M: 'table', T: 'sign', D: 'door' },
    npcs: [
      { id: 'curbelo_lider', sprite: 'casimiro', x: 10, y: 3, trainer: 'gym_curbelo' },
      { id: 'curbelo_cocinero', sprite: 'casimiro', x: 4, y: 6 },
      { id: 'curbelo_camarero', sprite: 'casimiro', x: 16, y: 6 },
    ],
    triggers: [
      warp(10, 15, 'san_sebastian', 36, 25, 'down'),
      sign(3, 12, 'GUACHINCHE TIPO FUEGO. Colón estuvo aquí. No metas las cartas en la parrilla.'),
      sign(17, 12, 'SÉPTIMO GUACHINCHE. Colón estuvo aquí. El líder está junto a los fogones del fondo.'),
    ],
    onEnter: ['GUACHINCHE DE CASIMIRO. Las brasas chisporrotean y alguien ha colgado otro retrato de Colón.',
      'Colón estuvo aquí. El líder del guachinche de fuego te espera al fondo.'],
  };
}

export const GOMERA_MAPS: Record<'san_sebastian' | 'certificador_gomera' | 'mansion_curbelo' | 'guachinche_curbelo', GameMap> = {
  san_sebastian: sanSebastian(), certificador_gomera: certificador(), mansion_curbelo: mansionResult.map, guachinche_curbelo: guachinche(),
};

export const GOMERA_TALKS: Record<string, string[]> = {
  curbelo_puerto: ['CASIMIRO CURBELO: Bienvenido a San Sebastián. Colón estuvo aquí. Yo también, como puedes comprobar.', 'CASIMIRO CURBELO: Al norte tienes el pantalán; por ahí vuelves a Troya con la Pukas.'],
  curbelo_plaza: ['CASIMIRO CURBELO: Colón estuvo aquí. El certificador queda al norte y mi mansión al suroeste.', 'CASIMIRO CURBELO: ¿El otro Casimiro? Soy yo.'],
  curbelo_calle: ['CASIMIRO CURBELO: Colón estuvo aquí. El guachinche de fuego queda al sureste, pero necesita la llave de mi mansión.'],
  curbelo_mansion_fuera: ['CASIMIRO CURBELO: Colón estuvo aquí. Entra en mi mansión y busca la llave por el laberinto. La salida sigue en el vestíbulo.'],
  curbelo_mansion: ['CASIMIRO CURBELO: Colón estuvo aquí. Dejé la llave al fondo de los corredores para que nadie la confundiera con la de mi coche.'],
  curbelo_cocinero: ['CASIMIRO CURBELO: Colón estuvo aquí. Mientras, yo avivo las brasas y el otro yo atiende el salón.'],
  curbelo_camarero: ['CASIMIRO CURBELO: Colón estuvo aquí. La mesa del líder está al fondo; si hace falta salir, la puerta está al sur.'],
};