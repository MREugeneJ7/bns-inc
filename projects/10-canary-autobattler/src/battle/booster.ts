import {
  CARDS, CardDef, CREATURE_IDS, SPELL_IDS, LAND_IDS, STAGE_WEIGHT,
  creaturesInBiomes, COMBINE_COST, EVO_NEXT, isFinalStage, MAX_DECK, MAX_COPIES,
} from './cards';

export interface BoosterOptions {
  /** Biomas del jugador: el sobre tira mas de lo que ya juega (sinergia). */
  homeBiomes?: CardDef['biome'][];
  /** Cartas ya en mazo+PC: sesgo hacia cadenas que pueda combinar. */
  owned?: Record<string, number>;
  slots?: number;
  /** Tope de etapa evolutiva (para los sobres de patio de colegio segun ruta). */
  maxStage?: number;
  /** Si es lider de gimnasio, asegura al menos una carta evolucionada de tu bioma. */
  gymBonus?: boolean;
}

const pick = <T,>(arr: T[], rnd: () => number): T => arr[Math.floor(rnd() * arr.length)];

function weightedCreature(pool: string[], rnd: () => number, owned: Record<string, number>): string {
  const weights = pool.map((id) => {
    const st = CARDS[id].stage ?? 0;
    let w = STAGE_WEIGHT[st] ?? 10;
    // Sesgo de sinergia: si ya tienes 3-4 copias, es mas probable que salga la 5a
    const have = owned[id] ?? 0;
    if (have >= 3 && have < COMBINE_COST) w *= 2.2;
    else if (have > 0) w *= 1.25;
    // Carta ya maxeada de brillo: menos frecuente
    if (isFinalStage(id) && have >= COMBINE_COST) w *= 0.5;
    return Math.max(0.5, w);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rnd() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/** Abre un sobre. Slot 1 es criatura garantizada; el resto mezcla criatura/hechizo/tierra. */
export function rollBooster(opts: BoosterOptions = {}, rnd: () => number = Math.random): string[] {
  const slots = opts.slots ?? 5;
  const owned = opts.owned ?? {};
  const withinCap = (id: string) => opts.maxStage === undefined || (CARDS[id]?.stage ?? 0) <= opts.maxStage;
  const allCreatures = CREATURE_IDS.filter(withinCap);
  const creaturePool = allCreatures.length > 0 ? allCreatures : CREATURE_IDS;
  const home = creaturesInBiomes(opts.homeBiomes).filter(withinCap);
  const out: string[] = [];

  // Garantizamos al menos 1 de tu bioma y 1 fuera de el (para descubrir sinergias)
  const homePool = home.length > 0 ? home : creaturePool;
  const offPool = creaturePool.filter((id) => !homePool.includes(id));

  if (opts.gymBonus) {
    const evolved = homePool.filter((id) => (CARDS[id]?.stage ?? 0) >= 2);
    out.push(weightedCreature(evolved.length > 0 ? evolved : homePool, rnd, owned));
  } else {
    out.push(weightedCreature(homePool, rnd, owned));
  }
  if (offPool.length > 0 && slots > 2) out.push(weightedCreature(offPool, rnd, owned));

  while (out.length < slots) {
    const r = rnd();
    if (r < 0.52) out.push(weightedCreature(creaturePool, rnd, owned));
    else if (r < 0.78) out.push(pick(SPELL_IDS, rnd));
    else out.push(pick(LAND_IDS, rnd));
  }
  return out;
}

// ------------------------------------------------------------------
// COLECCION / MAZO / PC DE AYOZE
// ------------------------------------------------------------------
export interface Collection {
  deck: string[];
  pc: string[];
  shine: Record<string, number>;
  /** Banderas de progreso: 'cert_<id>' = carta de 1a edicion ya certificada en La Gomera. */
  flags?: Record<string, boolean>;
}

export function countOwned(col: Collection, id: string): number {
  return col.deck.filter((c) => c === id).length + col.pc.filter((c) => c === id).length;
}

export function canAddToDeck(col: Collection, id: string): string | null {
  const def = CARDS[id];
  if (!def) return 'Carta desconocida.';
  if (def.firstEdition && !col.flags?.['cert_' + id]) {
    return `${def.name}: carta de 1ª edicion sin certificar. Llevala al centro certificador de La Gomera para jugarla.`;
  }
  if (col.deck.length >= MAX_DECK) return `Mazo lleno (${MAX_DECK}/${MAX_DECK}). Saca algo al PC de Ayoze.`;
  if (def.legendary && col.deck.includes(id)) return `${def.name} es legendaria: solo 1 copia en el mazo.`;
  if (def.type !== 'land' && col.deck.filter((c) => c === id).length >= MAX_COPIES) {
    return `Maximo ${MAX_COPIES} copias de ${def.name} en el mazo.`;
  }
  return null;
}

export function addToDeck(col: Collection, id: string): boolean {
  const err = canAddToDeck(col, id);
  if (err) return false;
  col.deck.push(id);
  return true;
}

export function moveToPC(col: Collection, id: string): boolean {
  const i = col.deck.indexOf(id);
  if (i === -1) return false;
  col.deck.splice(i, 1);
  col.pc.push(id);
  return true;
}

export function moveToDeck(col: Collection, id: string): string | null {
  const err = canAddToDeck(col, id);
  if (err) return err;
  const i = col.pc.indexOf(id);
  if (i === -1) return 'No esta en el PC.';
  col.pc.splice(i, 1);
  col.deck.push(id);
  return null;
}

export interface CombineInfo {
  id: string;
  have: number;
  need: number;
  ready: boolean;
  final: boolean;
  nextId?: string;
}

export function combineInfo(col: Collection, id: string): CombineInfo {
  const def = CARDS[id];
  const have = countOwned(col, id);
  const final = !def || def.type !== 'creature' || isFinalStage(id);
  return {
    id,
    have,
    need: COMBINE_COST,
    ready: def?.type === 'creature' && have >= COMBINE_COST,
    final,
    nextId: final ? undefined : EVO_NEXT[id],
  };
}

/** Todas las cartas combinables ahora mismo (5+ copias). */
export function combineReady(col: Collection): string[] {
  const ids = new Set([...col.deck, ...col.pc]);
  return [...ids]
    .filter((id) => CARDS[id]?.type === 'creature')
    .filter((id) => countOwned(col, id) >= COMBINE_COST);
}

export interface CombineResult {
  newId: string;
  shineUp: boolean;
  destination: 'deck' | 'pc';
  removedFromDeck: number;
  removedFromPC: number;
}

// The incoming reward is consumed directly, without ever entering a full deck or PC.
function combineCopies(col: Collection, id: string, incoming: 0 | 1): CombineResult | null {
  const def = CARDS[id];
  if (!def || def.type !== 'creature' || countOwned(col, id) + incoming < COMBINE_COST) return null;

  const final = isFinalStage(id);
  const newId = final ? id : EVO_NEXT[id];
  if (!newId || !CARDS[newId]) return null;

  const deck = [...col.deck];
  const pc = [...col.pc];
  let left = COMBINE_COST - incoming;
  let removedFromDeck = 0;
  let removedFromPC = 0;
  for (let i = deck.length - 1; i >= 0 && left > 0; i--) {
    if (deck[i] === id) { deck.splice(i, 1); left--; removedFromDeck++; }
  }
  for (let i = pc.length - 1; i >= 0 && left > 0; i--) {
    if (pc[i] === id) { pc.splice(i, 1); left--; removedFromPC++; }
  }
  if (left > 0) return null;

  const next = { deck, pc, shine: col.shine, flags: col.flags };
  const destination = addToDeck(next, newId) ? 'deck' : 'pc';
  if (destination === 'pc') pc.push(newId);

  col.deck.splice(0, col.deck.length, ...deck);
  col.pc.splice(0, col.pc.length, ...pc);
  if (final) col.shine[id] = (col.shine[id] ?? 0) + 1;
  return { newId, shineUp: final, destination, removedFromDeck, removedFromPC };
}

/** Combines five existing creatures from the deck and PC. */
export function doCombine(col: Collection, id: string): CombineResult | null {
  return combineCopies(col, id, 0);
}

/** Combines an unclaimed reward with four owned creatures in one transaction. */
export function combineWithReward(col: Collection, id: string): CombineResult | null {
  return combineCopies(col, id, 1);
}

/** Stats finales de una carta aplicando el brillo acumulado. */
export function statsOf(id: string, shine: Record<string, number>): { atk: number; hp: number } {
  const c = CARDS[id];
  const s = shine[id] ?? 0;
  return { atk: (c.atk ?? 0) + s, hp: (c.hp ?? 0) + s };
}
