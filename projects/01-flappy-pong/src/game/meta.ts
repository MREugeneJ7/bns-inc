import type { MetaState, MetaUpgrade, MetaUpgradeId } from "./types";
import { META_UPGRADES } from "./types";

export const META_KEY = "flappy-pong-ark-meta-v1";

export function defaultMeta(): MetaState {
  return {
    chips: 0,
    lifetimeChips: 0,
    runs: 0,
    bestWave: 0,
    bestScore: 0,
    bosses: 0,
    stars: 0,
    levels: {},
  };
}

export function loadMeta(): MetaState {
  try {
    const raw = window.localStorage.getItem(META_KEY);
    if (!raw) return defaultMeta();
    const parsed = JSON.parse(raw) as Partial<MetaState>;
    const base = defaultMeta();
    return {
      ...base,
      ...parsed,
      levels: { ...base.levels, ...(parsed.levels ?? {}) },
    };
  } catch {
    return defaultMeta();
  }
}

export function saveMeta(meta: MetaState) {
  try {
    window.localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // Storage can be disabled.
  }
}

export function upgradeById(id: MetaUpgradeId): MetaUpgrade {
  return META_UPGRADES.find((upgrade) => upgrade.id === id) ?? META_UPGRADES[0];
}

export function upgradeCost(upgrade: MetaUpgrade, level: number) {
  return Math.round((upgrade.base * Math.pow(1.62, level)) / 10) * 10;
}

export function levelOf(meta: MetaState, id: MetaUpgradeId) {
  return meta.levels[id] ?? 0;
}

export function canBuy(meta: MetaState, id: MetaUpgradeId) {
  const upgrade = upgradeById(id);
  const level = levelOf(meta, id);
  return level < upgrade.max && meta.chips >= upgradeCost(upgrade, level);
}

export function prestigeTarget(stars: number) {
  return 5000 * (stars + 1);
}

export function canPrestige(meta: MetaState) {
  return meta.lifetimeChips >= prestigeTarget(meta.stars);
}

export function prestigeCost(stars: number) {
  return Math.round((1200 * Math.pow(2.4, stars)) / 10) * 10;
}

