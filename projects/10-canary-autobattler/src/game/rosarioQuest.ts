import type { MapId } from './maps';
export const GOURMET = [
  { id: 'dorada', name: 'Dorada', price: 4, accepted: true },
  { id: 'mahou', name: 'Mahou Maestra', price: 7, accepted: false },
  { id: 'tacoa', name: 'Tacoa', price: 6, accepted: true },
  { id: 'guinness', name: 'Guinness', price: 8, accepted: false },
  { id: 'tierra_perros', name: 'Tierra de Perros', price: 6, accepted: true },
] as const;

export type BeerId = typeof GOURMET[number]['id'];
export type BeerBag = Partial<Record<BeerId, number>>;
type Shopper = { flags: Record<string, boolean>; duros: number; beers: BeerBag };

export function readBeerBag(value: unknown): BeerBag {
  const bag: BeerBag = {};
  if (!value || typeof value !== 'object') return bag;
  for (const { id } of GOURMET) {
    const n = (value as Record<string, unknown>)[id];
    if (typeof n === 'number' && Number.isSafeInteger(n) && n > 0) bag[id] = n;
  }
  return bag;
}

export function buyBeer(s: Shopper, id: BeerId): boolean {
  const item = GOURMET.find((beer) => beer.id === id);
  if (!item || s.duros < item.price || (s.beers[id] ?? 0) >= Number.MAX_SAFE_INTEGER) return false;
  s.duros -= item.price;
  s.beers[id] = (s.beers[id] ?? 0) + 1;
  return true;
}

export function offerBeer(s: Shopper, id: BeerId): 'open' | 'missing' | 'refused' | 'accepted' {
  if (s.flags.rosario_open) return 'open';
  const qty = s.beers[id] ?? 0;
  if (qty < 1) return 'missing';
  if (!GOURMET.find((beer) => beer.id === id)?.accepted) return 'refused';
  if (qty === 1) delete s.beers[id];
  else s.beers[id] = qty - 1;
  s.flags.rosario_open = true;
  return 'accepted';
}
export const MAGOS_KEYS = [
  { key: 1, flag: 'magos_key_1', name: 'Llave magnética 1 · Archivo' },
  { key: 2, flag: 'magos_key_2', name: 'Llave magnética 2 · Dirección' },
] as const;
export function canOpenMagosDoor(keys: number[]): boolean {
  return keys.includes(1) && keys.includes(2);
}
export function hasMagosKeys(flags: Record<string, boolean>): boolean {
  return MAGOS_KEYS.every(k => !!flags[k.flag]);
}

/** Cada sede del Coco tiene su primer diálogo, su repetición tras perder y su estado de partida ganada. */
export function cocoEncounter(mapId: MapId, flags: Record<string, boolean>): 'first' | 'retry' | null {
  if (mapId === 'guarida_enriscada') {
    if (flags.coco_meridiano_beaten) return null;
    return flags.coco_meridiano_seen ? 'retry' : 'first';
  }
  if (mapId === 'magos_azotea') {
    if (flags.coco_beaten) return null;
    return flags.coco_magos_seen ? 'retry' : 'first';
  }
  return null;
}
