import { CARDS } from '../battle/cards';
import { canAddToDeck } from '../battle/booster';
import { DRIVABLE_TILES, type TileId } from './sprites';
import { TRAINERS } from './trainers';
import type { SaveState } from './save';

/** Las dos cartas de 1ª edicion descatalogadas que el Magomaniaco saco de las cenizas de los fogones. */
export const MAGOMANIACO_OFFER: readonly string[] = ['burgado_1ed', 'cangrejo_1ed'];

/** La doña de la Torre Encantada entrega el bucio una sola vez (y abre la incorporacion a la TF-1). */
export function grantBucio(state: SaveState): boolean {
  if (state.flags.has_bucio) return false;
  state.flags.has_bucio = true;
  state.flags.tower_bruja_gifted = true;
  return true;
}

/** Dona Maruca en el Aeropuerto Tenerife Sur entrega la M.O. 2: Ticket Tarifa Plana de Binter una sola vez. */
export function grantBinterTicket(state: SaveState): boolean {
  if (state.flags.hm_binter) return false;
  state.flags.hm_binter = true;
  return true;
}

/** Recoger el bote de Crema Solar FP50 perdido en Siam Park. */
export function findCremaFP50(state: SaveState): boolean {
  if (state.flags.has_crema_fp50 || state.flags.hm_salto_pastor) return false;
  state.flags.has_crema_fp50 = true;
  return true;
}

/** El guiri de Siam Park entrega la M.O. 4: Vara del Salto del Pastor al devolverle su Crema FP50. */
export function grantVaraPastor(state: SaveState): boolean {
  if (!state.flags.has_crema_fp50 || state.flags.hm_salto_pastor) return false;
  state.flags.has_crema_fp50 = false;
  state.flags.hm_salto_pastor = true;
  return true;
}

/** En la piscina de olas (The Wave Palace), el pibe te regala la M.O. 3: Pukas (Surf) tras rescatar su tabla. */
export function grantPukasBoard(state: SaveState): boolean {
  if (state.flags.hm_pukas || !state.flags.pukas_recovered) return false;
  state.flags.pukas_recovered = false;
  state.flags.hm_pukas = true;
  return true;
}

/** Victoria contra el Magomaniaco: cobras sus duros y se desbloquea la eleccion de 1ª edicion (sin sobre normal). */
export function grantMagomaniacoVictory(state: SaveState): boolean {
  const trainer = TRAINERS.magomaniaco;
  if (!trainer || state.beaten.magomaniaco) return false;
  state.beaten.magomaniaco = 1;
  state.duros += trainer.purse;
  state.flags.magomaniaco_done = true;
  return true;
}

/** Eliges una de las dos cartas de 1ª edicion. Va al PC y queda bloqueada hasta certificarla en La Gomera. */
export function claimFirstEdition(
  state: SaveState,
  index: number,
): { ok: true; cardId: string } | { ok: false; error: string } {
  if (!state.flags.magomaniaco_done) return { ok: false, error: 'Antes tienes que ganarle al MAGOMANIACO.' };
  if (state.flags.first_ed_claimed) return { ok: false, error: 'Ya elegiste tu carta de 1ª edicion.' };
  const cardId = MAGOMANIACO_OFFER[index];
  if (!cardId || !CARDS[cardId]) return { ok: false, error: 'Elige una de las dos cartas.' };
  state.pc.push(cardId);
  state.flags.first_ed_claimed = true;
  state.flags['seen_' + cardId] = true;
  return { ok: true, cardId };
}

/** El certificador legaliza solamente las ediciones antiguas que el jugador posee. */
export function certifyFirstEdition(state: SaveState): string[] {
  const cards = [...new Set([...state.deck, ...state.pc])]
    .filter(id => CARDS[id]?.firstEdition && !state.flags['cert_' + id]);
  for (const id of cards) state.flags['cert_' + id] = true;
  return cards;
}

/** Carta legendaria encontrada en la subestacion de Caletillas (solo accesible surfeando con la Pukas). */
export function grantUnelco(state: SaveState): { ok: true; destination: 'deck' | 'pc' } | { ok: false; error: string } {
  if (state.flags.got_unelco) return { ok: false, error: 'Ya recogiste la carta legendaria UNELCO de Caletillas.' };
  state.flags.got_unelco = true;
  state.flags.seen_unelco = true;
  if (canAddToDeck(state, 'unelco') === null) {
    state.deck.push('unelco');
    return { ok: true, destination: 'deck' };
  }
  state.pc.push('unelco');
  return { ok: true, destination: 'pc' };
}

export function grantNevada(state: SaveState): 'deck' | 'pc' | null {
  const id = 'nevada_teide';
  if (state.flags.got_nevada_teide || state.deck.includes(id) || state.pc.includes(id)) return null;
  const destination = canAddToDeck(state, id) === null ? 'deck' : 'pc';
  state[destination].push(id);
  state.flags.got_nevada_teide = true;
  state.flags.seen_nevada_teide = true;
  return destination;
}

/** Sube o baja del Toyota Landcruiser. Solo permite sacarlo sobre asfalto/parking legal, nunca en playas ni aceras. */
export function toggleTodoTerreno(
  state: SaveState,
  currentTile: TileId,
  isIndoor: boolean,
): { ok: true; carOut: boolean } | { ok: false; reason: 'no_hm' | 'indoor' | 'offroad' | 'hazard' } {
  if (!state.flags.hm_todo_terreno) return { ok: false, reason: 'no_hm' };
  if (state.flags.car_out) {
    if (currentTile === 'pothole' || currentTile === 'fence' || (state.mapId === 'calle' && state.flags.tf5_underpass)) {
      return { ok: false, reason: 'hazard' };
    }
    state.flags.car_out = false;
    return { ok: true, carOut: false };
  }
  if (isIndoor) return { ok: false, reason: 'indoor' };
  if (!DRIVABLE_TILES.has(currentTile)) return { ok: false, reason: 'offroad' };
  state.flags.car_out = true;
  return { ok: true, carOut: true };
}

/**
 * Maquina Fotocopiadora del Coco de Santa Ursula (UN SOLO USO).
 * Durante un duelo copia una carta rival: su función equivale a la Master Ball.
 * La elección concreta se hace en la mesa de combate, no desde la mochila.
 */
export function useFotocopiadora(state: SaveState): { ok: true } | { ok: false; error: string } {
  if (!state.flags.has_fotocopiadora) return { ok: false, error: 'Aun no tienes la Maquina Fotocopiadora.' };
  if (state.flags.used_fotocopiadora) return { ok: false, error: 'La Fotocopiadora ya se quedo sin toner (era de 1 solo uso).' };
  state.flags.used_fotocopiadora = true;
  return { ok: true };
}

/** Mostrador de Devoluciones / Tickets Regalo del C.C. Meridiano. */
export const MERIDIANO_PRIZES: readonly { cardId: string; cost: number; label: string }[] = [
  { cardId: 'gato_callejero', cost: 20, label: 'GATO CALLEJERO (20D)' },
  { cardId: 'tajinaste', cost: 40, label: 'TAJINASTE REAL (40D)' },
  { cardId: 'gato_azotea', cost: 55, label: 'GATO DE AZOTEA (55D)' },
  { cardId: 'don_michi', cost: 95, label: 'DON MICHI (95D)' },
];

export function redeemMeridianoPrize(
  state: SaveState,
  index: number,
): { ok: true; cardId: string; cost: number; destination: 'deck' | 'pc' } | { ok: false; error: string } {
  const prize = MERIDIANO_PRIZES[index];
  if (!prize || !CARDS[prize.cardId]) return { ok: false, error: 'Premio no disponible.' };
  if (state.duros < prize.cost) {
    return { ok: false, error: `Te faltan ${prize.cost - state.duros} duros pa ese capricho, mi nino.` };
  }
  state.duros -= prize.cost;
  state.flags['seen_' + prize.cardId] = true;
  if (canAddToDeck(state, prize.cardId) === null) {
    state.deck.push(prize.cardId);
    return { ok: true, cardId: prize.cardId, cost: prize.cost, destination: 'deck' };
  }
  state.pc.push(prize.cardId);
  return { ok: true, cardId: prize.cardId, cost: prize.cost, destination: 'pc' };
}
