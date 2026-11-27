import { CARDS, STARTER_BIOME } from '../battle/cards';
import {
  addToDeck, canAddToDeck, combineWithReward, countOwned, rollBooster,
  type CombineResult,
} from '../battle/booster';
import type { SaveState } from './save';
import { TRAINERS } from './trainers';
import { DIABLITO_TRAINER } from './santaUrsulaQuest';

export interface PendingBooster {
  trainerId: string;
  trainerName: string;
  purse: number;
  cards: string[];
  gym?: number;
  bolicheName?: string;
}

export type RewardDestination = 'deck' | 'pc' | 'evolve';
export type ClaimResult =
  | { ok: true; cardId: string; destination: 'deck' | 'pc'; combination?: CombineResult }
  | { ok: false; error: string };

/** True si un entrenador de 1 sola victoria (o lider de gym) ya fue vencido. Los colegios son repetibles. */
export function trainerDefeated(state: Pick<SaveState, 'beaten' | 'flags'>, trainerId: string): boolean {
  if (trainerId === 'coco_santa_ursula') {
    // Duelo en dos sedes: Meridiano da el equipo cazafantasmas y Magos da la fotocopiadora.
    // Vencer en una sola no cuenta como vencido del otro sitio.
    return !!(state.flags.coco_meridiano_beaten && state.flags.coco_beaten);
  }
  if (TRAINERS[trainerId]?.repeatable) return false;
  return (state.beaten[trainerId] ?? 0) > 0;
}

/** Awards a victory (once for normal/gym trainers; repeatable for schoolyard kids) and stores the 1-of-5 pack. */
export function grantTrainerVictory(
  state: SaveState,
  trainerId: string,
  rnd: () => number = Math.random,
): PendingBooster | null {
  const trainer = TRAINERS[trainerId];
  if (!trainer || trainerDefeated(state, trainerId) || state.pendingBooster) return null;

  const owned: Record<string, number> = {};
  for (const id of new Set([...state.deck, ...state.pc])) owned[id] = countOwned(state, id);
  const cards = rollBooster({
    homeBiomes: state.starter ? STARTER_BIOME[state.starter] : trainer.biomes,
    owned,
    slots: 5,
    maxStage: trainer.maxStage,
    gymBonus: !!trainer.gym,
  }, rnd);

  state.beaten[trainerId] = trainer.repeatable ? (state.beaten[trainerId] ?? 0) + 1 : 1;
  state.duros += trainer.purse;
  state.sobres += 1;
  if (trainer.gym) state.flags['boliche_' + trainer.gym] = true;
  if (trainerId === DIABLITO_TRAINER) state.flags.coco_diablito_beaten = true;
  if (trainerId === 'coco_santa_ursula') {
    // En el sótano de Bershka (Meridiano) da el equipo cazafantasmas y se marcha a Magos de la Costa.
    if (state.mapId === 'guarida_enriscada') {
      state.flags.coco_meridiano_beaten = true;
      state.flags.has_cazafantasmas = true;
    } else {
      // En la azotea de Magos de la Costa da la fotocopiadora y se va también.
      state.flags.coco_beaten = true;
      state.flags.has_fotocopiadora = true;
      state.flags.coco_ricardo_rescued = true;
      state.flags.magos_floor_cleared = true;
    }
  }
  if (trainerId === 'guachinche_rosario') {
    state.flags.guachinche_rosario_beaten = true;
  }
  if (trainerId === 'mago_americas') {
    state.flags.mago_americas_done = true;
  }
  if (trainerId === 'magec') {
    // Magec desaparece de la cueva tras el combate ganado.
    state.flags.magec_beaten = true;
  }
  for (const id of cards) state.flags['seen_' + id] = true;

  const reward: PendingBooster = {
    trainerId,
    trainerName: trainer.name,
    purse: trainer.purse,
    cards,
    ...(trainer.gym ? { gym: trainer.gym, bolicheName: trainer.bolicheName } : {}),
  };
  state.pendingBooster = reward;
  return reward;
}

/** A loss never marks a trainer as defeated, so the same opponent can be retried. */
export function settleTrainerLoss(state: SaveState, trainerId: string, stake: number): number | null {
  if (!TRAINERS[trainerId] || trainerDefeated(state, trainerId)) return null;
  const lost = Math.min(state.duros, Math.max(0, Math.floor(stake)));
  state.duros -= lost;
  return lost;
}

/** Claims exactly one of the five offers. The four unchosen cards are discarded. */
export function claimBoosterReward(
  state: SaveState,
  index: number,
  destination: RewardDestination,
): ClaimResult {
  const reward = state.pendingBooster;
  if (!reward) return { ok: false, error: 'Este sobre ya se ha elegido.' };
  if (!Number.isInteger(index) || index < 0 || index >= reward.cards.length) {
    return { ok: false, error: 'Elige una carta del sobre.' };
  }

  const id = reward.cards[index];
  const card = CARDS[id];
  if (!card) return { ok: false, error: 'Carta desconocida.' };
  const canEvolve = card.type === 'creature' && countOwned(state, id) >= 4;

  if (destination === 'deck') {
    if (canEvolve) return { ok: false, error: 'Ya tienes cuatro: evoluciona o guarda esta copia en el PC.' };
    const error = canAddToDeck(state, id);
    if (error) return { ok: false, error };
    addToDeck(state, id);
    state.pendingBooster = null;
    return { ok: true, cardId: id, destination: 'deck' };
  }

  if (destination === 'pc') {
    state.pc.push(id);
    state.pendingBooster = null;
    return { ok: true, cardId: id, destination: 'pc' };
  }

  if (destination === 'evolve') {
    if (!canEvolve) return { ok: false, error: 'Necesitas cuatro copias del mismo magomon.' };
    const combination = combineWithReward(state, id);
    if (!combination) return { ok: false, error: 'No se ha podido combinar esta carta.' };
    state.flags['seen_' + combination.newId] = true;
    state.pendingBooster = null;
    return { ok: true, cardId: id, destination: combination.destination, combination };
  }

  return { ok: false, error: 'Destino desconocido.' };
}
