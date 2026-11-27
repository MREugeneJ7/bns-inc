import type { Dir } from './input';

// Game-space directions: east is +x; south is +y. This is a playable schematic,
// not a north-up, geographically scaled street map.
export const COAST = {
  stationGate: 42, entry: 41, sanEugenio: 32, hotel: 19,
  alleyTop: { x: 11, y: 10 }, alleyBottom: { x: 18, y: 17 },
  monkey: 23, troya: 41, veronicas: 57, club: 73, center: 35,
} as const;

export function coastLocation(x: number, y: number): string {
  if (y <= 10) return x > 26 ? 'SAN EUGENIO' : 'HOTEL H10';
  if (y < 17) return 'CALLEJUELA';
  if (x < COAST.troya) return 'MONKEY BEACH';
  if (x < COAST.veronicas) return 'PLAYA DE TROYA';
  return 'LAS VERÓNICAS';
}

// The previous save version mirrored the entire coast. Keep the landmark a
// player was standing at, rather than globally flipping the new layout.
export function migrateMirroredCoast(p: { x: number; y: number; dir: Dir }) {
  const oldX = 82 - p.x;
  if (p.y <= 10) {
    const x = oldX <= 9 ? 41 - Math.round(oldX * 22 / 9) : 19 - Math.round((oldX - 9) * 8 / 12);
    return { ...p, x: Math.max(10, Math.min(COAST.entry, x)) };
  }
  if (p.y < 17) return { ...p, x: p.y + 1 + Math.max(-1, Math.min(1, oldX - 21)) };
  const dir: Dir = p.dir === 'left' ? 'right' : p.dir === 'right' ? 'left' : p.dir;
  return { ...p, x: oldX, dir };
}
