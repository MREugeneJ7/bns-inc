import type { PerkId } from "./types";
import { PERKS, PERK_BY_ID } from "./types";

export function perkStacks(perks: Partial<Record<PerkId, number>>, id: PerkId) {
  return perks[id] ?? 0;
}

export function isMaxed(perks: Partial<Record<PerkId, number>>, id: PerkId) {
  return perkStacks(perks, id) >= PERK_BY_ID[id].max;
}

function rollOffer(perks: Partial<Record<PerkId, number>>): PerkId[] {
  const pool = PERKS.filter((perk) => perkStacks(perks, perk.id) < perk.max);
  const picks: PerkId[] = [];
  while (picks.length < 3 && pool.length) {
    const index = Math.floor(Math.random() * pool.length);
    picks.push(pool.splice(index, 1)[0].id);
  }
  return picks;
}

export function openOffer(perks: Partial<Record<PerkId, number>>): PerkId[] {
  const picks = rollOffer(perks);
  if (picks.length) return picks;
  return ["score", "magnet", "flap"];
}
