import type { StarterId } from './maps';

// ==================================================================
// MAZOS DE SALTO RAPIDO (DEBUG) CON CURVA DE MANA AFILADA (26-29 CARTAS)
// ~41% tierras en 2 colores limpios, abundantes criaturas de coste 1, 2 y 3
// para bajar bicho desde el Turno 1-2 sin atascarse jamas, y solo 2-3 remates.
// (Ademas deja una carta de coste alto en GYM4 para probar la Fotocopiadora.)
// ==================================================================

// Salto a ULL (Gym #1) y Magomaniaco — 26 cartas (11 tierras + 15 cartas de curva 1-2-3-5).
const GYM1_DECKS: Record<StarterId, [string, number][]> = {
  cabra: [
    ['tierra_laurisilva', 6], ['tierra_volcan', 5],
    ['pardela', 4], ['tunera', 2], ['mojo', 2],
    ['baifo', 2],
    ['cabra', 1], ['pardela_tormenta', 3],
    ['cabra_chispera', 1],
  ],
  angelote: [
    ['tierra_charco', 7], ['tierra_playa', 4],
    ['choco', 4], ['chola', 2],
    ['vieja', 2], ['cernicalo', 2],
    ['angelote', 1], ['calamar', 3],
    ['kraken_anaga', 1],
  ],
  pinzon: [
    ['tierra_laurisilva', 7], ['tierra_playa', 4],
    ['pardela', 4], ['tunera', 2], ['chola', 2],
    ['cernicalo', 2],
    ['pinzon', 1], ['pardela_tormenta', 3],
    ['parranda', 1],
  ],
};

// Salto a Taganana (Gym #2) — 27 cartas (11 tierras, salida T1 garantizada).
const GYM2_DECKS: Record<StarterId, [string, number][]> = {
  cabra: [
    ['tierra_laurisilva', 6], ['tierra_volcan', 5],
    ['pardela', 4], ['mojo', 3],
    ['baifo', 2],
    ['cabra', 1], ['pardela_tormenta', 4],
    ['cabra_chispera', 2],
  ],
  angelote: [
    ['tierra_charco', 7], ['tierra_playa', 4],
    ['choco', 4],
    ['vieja', 3],
    ['angelote', 2], ['calamar', 4], ['vieja_reina', 1],
    ['kraken_anaga', 2],
  ],
  pinzon: [
    ['tierra_laurisilva', 7], ['tierra_playa', 4],
    ['pardela', 4], ['chola', 2],
    ['cernicalo', 2],
    ['pinzon', 1], ['pardela_tormenta', 4],
    ['parranda', 2], ['palmera_real', 1],
  ],
};

// Salto a Galdar / Cuevas Pintadas (Gym #3) — 28 cartas (12 tierras, aguanta Calima).
const GYM3_DECKS: Record<StarterId, [string, number][]> = {
  cabra: [
    ['tierra_laurisilva', 6], ['tierra_volcan', 5],
    ['pardela', 4], ['mojo', 3],
    ['baifo', 2], ['tolete', 1],
    ['cabra', 1], ['pardela_tormenta', 4],
    ['cabra_chispera', 2],
  ],
  angelote: [
    ['tierra_charco', 8], ['tierra_playa', 4],
    ['choco', 4],
    ['vieja', 3],
    ['angelote', 2], ['calamar', 3], ['vieja_reina', 2],
    ['kraken_anaga', 2],
  ],
  pinzon: [
    ['tierra_laurisilva', 7], ['tierra_playa', 4],
    ['pardela', 4], ['chola', 2],
    ['cernicalo', 2],
    ['pinzon', 1], ['pardela_tormenta', 4],
    ['parranda', 2], ['palmera_real', 2],
  ],
};

// Salto a Palmetum (Gym #4), Meridiano, El Coco, Torre Teresitas y Autopista TF-1 — 28-29 cartas.
const GYM4_DECKS: Record<StarterId, [string, number][]> = {
  cabra: [
    ['tierra_laurisilva', 6], ['tierra_volcan', 5],
    // Coste 1 (7): criatura en T1 casi siempre + Mojo Picon (+2/+2) por 1 mana
    ['pardela', 4], ['mojo', 3],
    // Coste 2 (2): cuerpo 3/3 en T2
    ['baifo', 2],
    // Coste 3 (5): Pardela de Tormenta (4/4 prisa doble) + Cabra (guardia regen)
    ['cabra', 1], ['pardela_tormenta', 4],
    // Remate (2): Cabra Chispera (6/6 guardia regen prisa)
    ['cabra_chispera', 2],
  ],
  angelote: [
    ['tierra_charco', 8], ['tierra_playa', 4],
    // Coste 1 (4): Choco (2/2 sigilo directo)
    ['choco', 4],
    // Coste 2 (3): Vieja (2/4 guardia, frena aggro y sobrevive Calima)
    ['vieja', 3],
    // Coste 3 (8): Calamar (4/3 sigilo directo) + Angelote (5/4 sigilo) + Vieja Reina (3/6 regen)
    ['calamar', 4], ['angelote', 2], ['vieja_reina', 2],
    // Remate (3): Kraken de Anaga (7/6 sigilo directo doble)
    ['kraken_anaga', 3],
  ],
  pinzon: [
    ['tierra_laurisilva', 7], ['tierra_playa', 4],
    // Coste 1 (6): Pardela (2/2 prisa) + Chola Voladora (3 dano)
    ['pardela', 4], ['chola', 2],
    // Coste 2 (2): Cernicalo (3/2 directo)
    ['cernicalo', 2],
    // Coste 3 (5): Pardela de Tormenta (4/4 prisa doble) + Pinzon (2/4 prisa doble)
    ['pardela_tormenta', 4], ['pinzon', 1],
    // Coste 4-5 (4): Parranda (+3/+3 sobre doble ataque!) + Palmera Canaria (6/8 guardia regen)
    ['parranda', 2], ['palmera_real', 2],
  ],
};

export function buildGymDebugDeck(starter: StarterId): string[] {
  return GYM1_DECKS[starter].flatMap(([id, copies]) => Array<string>(copies).fill(id));
}

export function buildGym2DebugDeck(starter: StarterId): string[] {
  return GYM2_DECKS[starter].flatMap(([id, copies]) => Array<string>(copies).fill(id));
}

export function buildGym3DebugDeck(starter: StarterId): string[] {
  return GYM3_DECKS[starter].flatMap(([id, copies]) => Array<string>(copies).fill(id));
}

export function buildGym4DebugDeck(starter: StarterId): string[] {
  return GYM4_DECKS[starter].flatMap(([id, copies]) => Array<string>(copies).fill(id));
}
