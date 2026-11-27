import { CARDS, isFinalStage, MANA_COLORS } from '../battle/cards';

/**
 * Constructor de mazos de los grandes entrenadores.
 *
 * REQUISITOS (sin trampas):
 * - NINGUN multiplicador de stats y NINGUNA vida extra (salvo los 30 de Magec, única excepción).
 * - La dificultad es contenido + FUSIONES LEGALES: juntar 5 copias de una criatura que ya está
 *   en su última etapa evolutiva le da +1/+1 permanente (como en el PC de Ayoze), repetible.
 * - Cada mazo tiene un OBJETIVO DE PODER fijo, estrictamente creciente en el orden de la
 *   historia. El constructor: (1) pone el contenido mínimo temático, (2) rellena con copias
 *   temáticas mientras no supere el objetivo, y (3) cierra la delta exacta con fusiones
 *   legales repartidas entre los ases. El brillo final es la delta mínima, nunca arbitrario.
 * - Se verifica con duelos reales que el winrate desciende a lo largo de la columna vertebral.
 */

export interface MajorSpec {
  /** Objetivo de poder (estrictamente creciente a lo largo de la columna vertebral). */
  target: number;
  /** Tierras: id -> copias. */
  lands: Record<string, number>;
  /** Criaturas mínimas del tema (no brillan): id -> copias. */
  core?: Record<string, number>;
  /** Ases del tema: CRIATURAS FINALES, las únicas que admiten fusión legal: id -> copias mínimas. */
  finals: Record<string, number>;
  /** Candidatos temáticos para el relleno (máx 4 copias por carta). */
  pool?: string[];
  /** Hechizos: id -> copias. */
  spells?: Record<string, number>;
  /** Modo medición: si el objetivo es inalcanzable, devuelve lo máximo sin lanzar. */
  allowStuck?: boolean;
}

export interface ForgedDeck {
  deck: string[];
  shine: Record<string, number>;
  fusions: number;
  power: number;
}

/** Poder de una carta suelta (misma métrica que la validación de la columna vertebral). */
function cardPower(id: string): number {
  const c = CARDS[id];
  if (!c) throw new Error('carta inexistente: ' + id);
  if (c.type === 'land') return 0.9;
  if (c.type === 'creature') return (c.atk ?? 0) + (c.hp ?? 0) + (c.keywords?.length ?? 0) * 1.5;
  const e = c.effect!;
  return e.kind === 'damage' ? e.amount * (e.target === 'all_enemies' ? 1.8 : 1.3)
    : e.kind === 'heal' ? e.amount * 0.85
    : e.kind === 'buff' ? (e.atk + e.hp) * 1.1
    : e.kind === 'draw' ? e.amount * 1.4
    : e.kind === 'fog' ? 5 : 9;
}

function deckPower(deck: string[], shine: Record<string, number>): number {
  let p = 0;
  for (const id of deck) p += cardPower(id) + (CARDS[id]?.type === 'creature' ? 2 * (shine[id] ?? 0) : 0);
  return p;
}

export function buildMajor(spec: MajorSpec): ForgedDeck {
  const deck: string[] = [];
  const copies: Record<string, number> = {};
  const add = (id: string, n: number) => { for (let i = 0; i < n; i++) { deck.push(id); copies[id] = (copies[id] ?? 0) + 1; } };

  for (const [id, n] of Object.entries(spec.lands)) add(id, n);
  for (const [id, n] of Object.entries(spec.core ?? {})) add(id, n);
  const finalIds = Object.keys(spec.finals);
  for (const id of finalIds) add(id, spec.finals[id]);
  for (const [id, n] of Object.entries(spec.spells ?? {})) add(id, n);

  // Validez: todo el mazo existe, los ases SON finales (condición de la fusión legal),
  // y TODA carta del mazo se puede lanzar con las tierras de la spec (ni una carta muerta).
  for (const id of [...deck, ...(spec.pool ?? [])]) if (!CARDS[id]) throw new Error(`spec: carta inexistente ${id}`);
  for (const id of finalIds) {
    const c = CARDS[id];
    if (!c || c.type !== 'creature' || !isFinalStage(id)) throw new Error(`spec: ${id} no es etapa final; fusión ilegal`);
  }
  const landColors: Record<string, number> = {};
  let totalLands = 0;
  for (const [id, n] of Object.entries(spec.lands)) {
    totalLands += n;
    const pr = CARDS[id]?.produces;
    if (pr) landColors[pr] = (landColors[pr] ?? 0) + n;
  }
  const castable = (id: string): boolean => {
    const m = CARDS[id]?.mana;
    if (!m) return true;
    for (const k of MANA_COLORS) if ((m[k] ?? 0) > (landColors[k] ?? 0)) return false;
    return (m.generic ?? 0) <= totalLands;
  };
  for (const id of new Set([...deck, ...(spec.pool ?? [])])) {
    if (!castable(id)) throw new Error(`spec: ${id} no se puede lanzar con las tierras de la spec (faltan colores)`);
  }

  const shine: Record<string, number> = {};
  let power = deckPower(deck, shine);

  // 1) Relleno con CONTENIDO temático: la mejor carta que quepa sin pasarse del objetivo.
  let guard = 0;
  while (power < spec.target && guard++ < 300) {
    const best = (spec.pool ?? [])
      .filter((id) => CARDS[id]?.type === 'creature' && (copies[id] ?? 0) < 4)
      .map((id) => ({ id, p: cardPower(id) }))
      .filter((x) => x.p <= spec.target - power - 8)
      .sort((a, b) => b.p - a.p)[0];
    if (!best) break;
    deck.push(best.id);
    copies[best.id] = (copies[best.id] ?? 0) + 1;
    power += best.p;
  }

  // 2) Delta exacta con FUSIONES LEGALES, repartidas en ronda sobre los ases.
  //    Una fusion le da +1/+1 a CADA copia del as que lleve el mazo (2x poder por copia).
  //    Tope por as (MAX_SHINE_PER_ACE): el brillo es una delta, no una superarma. Si el
  //    objetivo no se alcanza, el spec necesita mas contenido (throw para no pasar de largo).
  const MAX_SHINE_PER_ACE = 12;
  let stuck = false;
  while (power < spec.target) {
    if (finalIds.every((id) => (shine[id] ?? 0) >= MAX_SHINE_PER_ACE)) { stuck = true; break; }
    const id = finalIds.find((id) => (shine[id] ?? 0) < MAX_SHINE_PER_ACE)!;
    shine[id] = (shine[id] ?? 0) + 1;
    power += 2 * (copies[id] ?? 0);
  }
  if (stuck && !spec.allowStuck) throw new Error(`spec: no alcanza el objetivo ${spec.target} con el tope de ${MAX_SHINE_PER_ACE} fusiones/as (falta contenido)`);

  return { deck, shine, fusions: finalIds.reduce((a, id) => a + (shine[id] ?? 0), 0), power: Math.round(power) };
}

// ---------------------------------------------------------------------------
// COLUMNA VERTEBRAL en orden de historia (objetivos estrictamente crecientes):
//  Gym 1 Domingo -> 2 Cathaysa -> 3 Bentejuí -> 4 Jonay -> 5 Yéssica -> 6 Doña Sabina
//  -> 7 Casimiro Curbelo -> COCO: Meridiano -> Magos -> El Diablito (Gym 8)
//  -> Alto Mando: Acaimo -> Tegueste -> Romen -> Pelicar -> Bencomo (campeón) -> MAGEC.
// ---------------------------------------------------------------------------
export const MAJOR_SPECS: Record<string, MajorSpec> = {
  // ---- GIMNASIO 1 · Domingo, Guachinche-Truck ULL (ofra) ----
  gym_ull: {
    target: 150,
    lands: { tierra_malpais: 8, tierra_laurisilva: 6 },
    core: { michino: 2, chupito_garrafon: 2, tabaiba: 2, tunera: 2 },
    finals: { bidon_toxico: 2, palmera_real: 2, gigante_laurisilva: 2 },
    pool: ['michino', 'lapa', 'chupito_garrafon', 'cubata_garrafon', 'gato_callejero', 'tunera', 'tabaiba'],
    spells: { calima: 2 },
  },

  // ---- GIMNASIO 2 · Cathaysa, Taganana (mar) ----
  gym_taganana: {
    target: 170,
    lands: { tierra_charco: 8, tierra_playa: 6 },
    core: { choco: 2, cria_leon: 2, vieja: 2 },
    finals: { tortuga_abuela: 2, leviatan_bajamar: 2, gran_otario: 2 },
    pool: ['choco', 'vieja', 'cria_leon', 'calamar'],
    spells: { clipper: 2 },
  },

  // ---- GIMNASIO 3 · Bentejuí, Cuevas Pintadas (mar/fogones) ----
  gym_galdar: {
    target: 192,
    lands: { tierra_charco: 6, tierra_malpais: 5, tierra_playa: 3 },
    core: { vieja: 2, cazon: 2, calamar: 2 },
    finals: { vieja_abismo: 2, tortuga_abuela: 2, kraken_anaga: 2 },
    pool: ['vieja', 'cazon', 'calamar', 'choco', 'vieja_reina'],
    spells: { clipper: 2 },
  },

  // ---- GIMNASIO 4 · Jonay, Palmetum (pinar) ----
  gym_palmetum: {
    target: 200,
    lands: { tierra_laurisilva: 8, tierra_playa: 5, tierra_volcan: 3 },
    core: { pinzon: 2, tajinaste: 2, semilla: 2 },
    finals: { fenix_azul_teide: 2, achaman: 2, palmera_real: 2 },
    pool: ['pinzon', 'tajinaste', 'pardela', 'tunera', 'tabaiba', 'cernicalo'],
    spells: { silbo_gomero: 2, escaldon: 1, chola: 2, tolete: 2, nevada_teide: 1 },
  },

  // ---- GIMNASIO 5 · Yéssica, Papagayos (VENENO garrafón: test exige >=8 venenosas) ----
  gym_papagayos: {
    target: 209,
    lands: { tierra_malpais: 8, tierra_charco: 6 },
    core: { chupito_garrafon: 3, cubata_garrafon: 3, perita_barranco: 2, michino: 2 },
    finals: { bidon_toxico: 2, aquelarre_bailadero: 2, perita_barranco: 2 },
    pool: ['chupito_garrafon', 'cubata_garrafon', 'perita_barranco', 'michino', 'bruja_anaga', 'lapa'],
    spells: { calima: 2 },
  },

  // ---- GIMNASIO 6 · Doña Sabina, Guachinche de El Rosario (ofra/pinar) ----
  guachinche_rosario: {
    target: 212,
    lands: { tierra_malpais: 7, tierra_laurisilva: 7 },
    core: { gato_callejero: 2, tunera: 2, chupito_garrafon: 2, lapa: 2 },
    finals: { perita_barranco: 2, palmera_real: 2, bidon_toxico: 2 },
    pool: ['gato_callejero', 'tunera', 'chupito_garrafon', 'cubata_garrafon', 'tabaiba'],
    spells: { gofio: 3, tenique: 3 },
  },

  // ---- GIMNASIO 7 · Casimiro Curbelo, La Gomera (risco: test exige tierras SOLO R) ----
  gym_curbelo: {
    target: 214,
    lands: { tierra_volcan: 12, tierra_roque: 3 },
    core: { pollito_frontera: 2, cuarta_vino: 2 },
    finals: { pancho_camurria: 2 },
    pool: ['pollito_frontera', 'cuarta_vino', 'pancho_camurria'],
    spells: { tolete: 4, mojo: 3 },
  },

  // ---- COCO · ACTO 1: guarida del Meridiano (la primera vez: el más débil de los tres) ----
  coco_meridiano: {
    target: 298,
    lands: { tierra_malpais: 7, tierra_charco: 6, tierra_laurisilva: 3 },
    core: { chupito_garrafon: 3, michino: 2, lapa: 2, lapa_acorazada: 2 },
    finals: { bidon_toxico: 2, perita_barranco: 2, aquelarre_bailadero: 2 },
    pool: ['chupito_garrafon', 'cubata_garrafon', 'michino', 'lapa', 'gato_callejero', 'bruja_anaga', 'perita_barranco'],
    spells: { calima: 2, cortar_el_aire: 2, tenique: 2, nevada_teide: 1 },
  },

  // ---- COCO · ACTO 2: azotea de Magos de la Costa (id en juego: coco_santa_ursula) ----
  coco_magos: {
    target: 305,
    lands: { tierra_malpais: 8, tierra_charco: 6, tierra_laurisilva: 3 },
    core: { chupito_garrafon: 2, cubata_garrafon: 2, perita_barranco: 2, lapa: 2 },
    finals: { bidon_toxico: 2, perita_barranco: 2, aquelarre_bailadero: 2 },
    pool: ['chupito_garrafon', 'cubata_garrafon', 'perita_barranco', 'michino', 'bruja_anaga', 'gato_callejero'],
    spells: { calima: 3, cortar_el_aire: 2 },
  },

  // ---- GIMNASIO 8 · COCO · ACTO 3: El Diablito reabierto (el más fuerte de los tres) ----
  gym_diablito: {
    target: 325,
    lands: { tierra_malpais: 8, tierra_charco: 6, tierra_laurisilva: 4 },
    core: { chupito_garrafon: 3, cubata_garrafon: 3, perita_barranco: 2, michino: 2, lapa: 2, gato_azotea: 2 },
    finals: { bidon_toxico: 2, perita_barranco: 2, aquelarre_bailadero: 2 },
    pool: ['chupito_garrafon', 'cubata_garrafon', 'perita_barranco', 'michino', 'bruja_anaga', 'gato_azotea', 'gato_callejero'],
    spells: { calima: 2, cortar_el_aire: 3 },
  },

  // ---- ALTO MANDO 1 · Mencey Acaimo (hielo: a la altura de la cueva del hielo) ----
  alto_mando_acaimo: {
    target: 345,
    lands: { tierra_charco: 9, tierra_playa: 5 },
    core: { choco: 2, vieja: 2, cria_leon: 2, leon_marino: 2 },
    finals: { vieja_abismo: 2, tortuga_abuela: 2, leviatan_bajamar: 2 },
    pool: ['choco', 'vieja_reina', 'cria_leon', 'leon_marino', 'calamar'],
    spells: { nevada_teide: 1, clipper: 2, chola: 2 },
  },

  // ---- ALTO MANDO 2 · Mencey Tegueste (roca y lucha: el mirador) ----
  alto_mando_tegueste: {
    target: 365,
    lands: { tierra_malpais: 8, tierra_volcan: 6 },
    core: { lapa: 2, lapa_acorazada: 2, pollito_frontera: 2, lagarto: 2, lagarto_gigante: 2 },
    finals: { lagarto_magma: 2, pancho_camurria: 2, pollito_frontera: 2 },
    pool: ['lapa_acorazada', 'lagarto_gigante', 'pollito_frontera', 'chupito_garrafon', 'michino'],
    spells: { tolete: 3, mojo: 2 },
  },

  // ---- ALTO MANDO 3 · Mencey Romen (fantasma: camino del teleférico) ----
  alto_mando_romen: {
    target: 395,
    lands: { tierra_malpais: 14 },
    core: { michino: 2, gato_callejero: 2, gato_azotea: 2, perita_barranco: 2, bruja_anaga: 2 },
    finals: { bidon_toxico: 2, aquelarre_bailadero: 2, perita_barranco: 2 },
    pool: ['michino', 'gato_callejero', 'gato_azotea', 'bruja_anaga', 'lapa', 'cubata_garrafon'],
    spells: { calima: 3, cortar_el_aire: 3 },
  },

  // ---- ALTO MANDO 4 · Mencey Pelicar (dragón: base de los escalones, junto al teleférico) ----
  alto_mando_pelicar: {
    target: 425,
    lands: { tierra_laurisilva: 9, tierra_volcan: 5 },
    core: { tabaiba: 2, cardon: 3, novillo_romero: 2, semilla: 2, palmera_real: 2 },
    finals: { drago_milenario: 2, gigante_laurisilva: 2, palmera_real: 2 },
    pool: ['tabaiba', 'cardon', 'tajinaste', 'novillo_romero', 'semilla', 'tunera'],
    spells: { escaldon: 2, gofio: 2, tolete: 2 },
  },

  // ---- ALTO MANDO 5 · Mencey Bencomo (CAMPEÓN: mazo variopinto de los cinco biomas) ----
  alto_mando_bencomo: {
    target: 444,
    lands: { tierra_volcan: 3, tierra_charco: 3, tierra_laurisilva: 3, tierra_playa: 3, tierra_malpais: 3 },
    core: { vieja_reina: 2, cabra_chispera: 2, pinzon_chispero: 2, leon_marino: 2, gato_azotea: 2 },
    finals: { gran_otario: 2, cabra_titan_teide: 2, fenix_azul_teide: 2, cernicalo_alisio: 2, don_michi: 2 },
    pool: ['vieja_reina', 'cabra_chispera', 'pinzon_chispero', 'leon_marino', 'gato_azotea', 'calamar', 'cardon', 'pancho_camurria'],
    spells: { clipper: 2, tolete: 2, parranda: 2, chola: 3, tenique: 2, nevada_teide: 1 },
  },

  // ---- MAGEC · el magomón libre (final secreto de la Cueva del Llano) ----
  // Su propia carta va en el mazo; la mano inicial guionizada (trainers.ts) garantiza que se
  // autoinvoca en el turno 5. El brillo NO va sobre su carta: las fusiones llevan los ases.
  magec: {
    target: 455,
    lands: { tierra_malpais: 8, tierra_charco: 6, tierra_playa: 4 },
    core: { perita_barranco: 3, lapa: 2, michino: 2, calamar: 2, magec: 1 },
    finals: { don_michi: 2, aquelarre_bailadero: 2, bidon_toxico: 2 },
    pool: ['perita_barranco', 'lapa_acorazada', 'michino', 'gato_callejero', 'calamar', 'bruja_anaga', 'gato_azotea'],
    spells: { calima: 2, cortar_el_aire: 2 },
  },

  // ---------------------------------------------------------------------------
  // LATERALES TEMÁTICOS (fuera de la columna vertebral, anclados al poder de su tier).
  // ---------------------------------------------------------------------------

  // Mago Don Servando, Las Américas (test: lleva las 6 de las cadenas vino/yunta).
  mago_americas: {
    target: 243,
    lands: { tierra_volcan: 7, tierra_laurisilva: 6, tierra_playa: 5 },
    core: { cuarta_vino: 2, garrafa_peleon: 2, novillo_romero: 2, yunta_bueyes: 2, cabra: 2, tabaiba: 2 },
    finals: { barrica_romera: 2, yunta_real: 2, pancho_camurria: 2 },
    pool: ['cabra', 'cabra_chispera', 'pollito_frontera', 'tabaiba', 'cardon', 'garrafa_peleon'],
    spells: { mojo: 2, tolete: 1 },
  },

  // Zona Safari de Siam Park (test: >=18 cartas y al menos una criatura safari).
  lifeguard_siam: {
    target: 185,
    lands: { tierra_charco: 6, tierra_playa: 5, tierra_malpais: 4 },
    core: { cria_leon: 2, choco: 2, calamar: 2 },
    finals: { gran_otario: 2, megalodon_siam: 2, leviatan_bajamar: 2 },
    pool: ['cria_leon', 'leon_marino', 'choco', 'calamar', 'cazon', 'vieja'],
  },
  delfines_lucia: {
    target: 185,
    lands: { tierra_charco: 6, tierra_playa: 5, tierra_malpais: 4 },
    core: { cazon: 2, cria_leon: 2, leon_marino: 2 },
    finals: { megalodon_siam: 2, gran_otario: 2, tortuga_abuela: 2 },
    pool: ['cazon', 'jaqueton', 'leon_marino', 'choco', 'vieja', 'cria_leon'],
  },
  delfines_omar: {
    target: 190,
    lands: { tierra_charco: 6, tierra_playa: 5, tierra_malpais: 4 },
    core: { leon_marino: 2, cazon: 2, vieja: 2 },
    finals: { gran_otario: 2, megalodon_siam: 2, vieja_abismo: 2 },
    pool: ['leon_marino', 'cazon', 'jaqueton', 'vieja', 'choco'],
  },
  moto_ines: {
    target: 187,
    lands: { tierra_charco: 6, tierra_playa: 5, tierra_malpais: 4 },
    core: { cazon: 2, jaqueton: 2, leon_marino: 2 },
    finals: { megalodon_siam: 2, gran_otario: 2, kraken_anaga: 2 },
    pool: ['cazon', 'jaqueton', 'leon_marino', 'choco', 'cria_leon'],
  },
  moto_yeray: {
    target: 183,
    lands: { tierra_charco: 6, tierra_playa: 5, tierra_malpais: 4 },
    core: { cria_leon: 2, leon_marino: 2, cazon: 2 },
    finals: { gran_otario: 2, leviatan_bajamar: 2, tortuga_abuela: 2 },
    pool: ['cria_leon', 'leon_marino', 'cazon', 'choco'],
  },
  cola_dragon: {
    target: 195,
    lands: { tierra_charco: 6, tierra_playa: 5, tierra_malpais: 4 },
    core: { jaqueton: 2, cazon: 2, leon_marino: 2 },
    finals: { megalodon_siam: 2, gran_otario: 2, leviatan_bajamar: 2 },
    pool: ['jaqueton', 'cazon', 'leon_marino', 'cria_leon', 'choco'],
  },
  cola_torre_poder: {
    target: 230,
    lands: { tierra_charco: 6, tierra_playa: 5, tierra_malpais: 4 },
    core: { jaqueton: 2, leon_marino: 2, cazon: 2 },
    finals: { megalodon_siam: 2, gran_otario: 2, tortuga_abuela: 2 },
    pool: ['jaqueton', 'leon_marino', 'cazon', 'vieja_reina', 'choco', 'cria_leon'],
  },
};

/** Los tres actos del Coco: Meridiano < Magos < Diablito (objetivos 575 < 600 < 625). */
export const COCO_MERIDIANO = buildMajor(MAJOR_SPECS.coco_meridiano);
export const COCO_MAGOS = buildMajor(MAJOR_SPECS.coco_magos);
