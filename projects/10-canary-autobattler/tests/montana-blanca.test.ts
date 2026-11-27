import assert from 'node:assert/strict';
import { CARDS, MANA_COLORS, SPELL_IDS } from '../src/battle/cards';
import { createBattle, step, type Minion } from '../src/battle/engine';
import { MAPS, PARRANDEROS, SCHOOLS, type MapId } from '../src/game/maps';
import { MONTANA_ENTRY, MONTANA_EXIT, NARICES_CARD, REFUGIO_DOORS } from '../src/game/mapsMontanaBlanca';
import { vaultable } from '../src/game/safariMoves';
import { SOLID, type TileId } from '../src/game/sprites';
import { TRAINERS } from '../src/game/trainers';

type Edge = { to: string; kind: 'walk' | 'vault'; dir: string };
const DIRS = [[1, 0, 'E'], [-1, 0, 'W'], [0, 1, 'S'], [0, -1, 'N']] as const;
const m = MAPS.montana_blanca;
const tile = (x: number, y: number): TileId => m.legend[m.rows[y]?.[x] ?? ''] ?? 'wall';
const blocked = (x: number, y: number) => SOLID[tile(x, y)] || m.npcs.some(n => n.x === x && n.y === y);
const k = (x: number, y: number) => `${x},${y}`;

/** Búsqueda en anchura con la misma regla del juego: se salta un barranco y se aterriza en suelo libre. */
function search(jump: boolean) {
  const start = k(MONTANA_ENTRY.x, MONTANA_ENTRY.y);
  const prev = new Map<string, { from: string; edge: Edge }>();
  const seen = new Set([start]);
  const q: [number, number][] = [[MONTANA_ENTRY.x, MONTANA_ENTRY.y]];
  for (const [x, y] of q) for (const [dx, dy, name] of DIRS) {
    let nx = x + dx, ny = y + dy, kind: 'walk' | 'vault' = 'walk';
    if (jump && vaultable('montana_blanca', tile(nx, ny))) {
      const lx = nx + dx, ly = ny + dy;
      if (blocked(lx, ly) || m.triggers.some(t => t.kind === 'step' && t.x === lx && t.y === ly)) continue;
      nx = lx; ny = ly; kind = 'vault';
    }
    if (nx < 0 || ny < 0 || nx >= m.rows[0].length || ny >= m.rows.length || blocked(nx, ny) || seen.has(k(nx, ny))) continue;
    seen.add(k(nx, ny));
    prev.set(k(nx, ny), { from: k(x, y), edge: { to: k(nx, ny), kind, dir: name } });
    q.push([nx, ny]);
  }
  const route = (x: number, y: number): Edge[] | null => {
    if (!seen.has(k(x, y))) return null;
    const out: Edge[] = [];
    for (let cur = k(x, y); cur !== start; cur = prev.get(cur)!.from) out.unshift(prev.get(cur)!.edge);
    return out;
  };
  return { seen, route };
}

assert.ok(m.rows.every(row => row.length === m.rows[0].length));
for (const row of m.rows) for (const ch of row) assert.ok(m.legend[ch], `baldosa ${ch}`);

const flat = search(false);
const vault = search(true);
const approaches: [number, number][] = [
  [REFUGIO_DOORS.center.x, REFUGIO_DOORS.center.y + 1],
  [REFUGIO_DOORS.school.x, REFUGIO_DOORS.school.y + 1],
];
assert.ok([...flat.seen].every(s => Number(s.split(',')[1]) >= 21), 'sin la vara sólo se alcanza la base');
for (const [x, y] of approaches) {
  assert.equal(flat.seen.has(k(x, y)), false, `sin vara no llegas a (${x},${y})`);
  assert.ok(vault.route(x, y), `con vara llegas a (${x},${y})`);
}

// El camino principal: muchos saltos, varios hacia los lados, sin pasar por la carta ni por los senderistas.
const main = vault.route(approaches[0][0], approaches[0][1])!;
const jumps = main.filter(e => e.kind === 'vault');
const lateral = jumps.filter(e => e.dir === 'E' || e.dir === 'W');
assert.ok(jumps.length >= 6, `seis o más saltos (hay ${jumps.length})`);
assert.ok(lateral.length >= 3, `saltos laterales en el camino (hay ${lateral.length})`);
assert.ok(new Set(jumps.map(e => e.dir)).size >= 3, 'los saltos van en varias direcciones');
const npcCells = m.npcs.map(n => k(n.x, n.y));
assert.ok(!main.some(e => npcCells.includes(e.to)), 'los senderistas no bloquean el camino');
const cardApproach = k(NARICES_CARD.x - 1, NARICES_CARD.y);
assert.ok(!main.some(e => e.to === cardApproach), 'la carta NO está en el camino principal');
console.log(`ok - subida con ${jumps.length} saltos (${lateral.length} laterales) y ${main.length} pasos`);

// La carta: callejón sin salida, solo se llega saltando desde el pasillo.
assert.equal(flat.seen.has(cardApproach), false, 'sin vara no llegas a la carta');
const pocket = vault.route(NARICES_CARD.x - 1, NARICES_CARD.y);
assert.ok(pocket && pocket.some(e => e.kind === 'vault' && e.dir === 'N'), 'el callejón exige un salto');
assert.equal(tile(NARICES_CARD.x, NARICES_CARD.y), 'card');
assert.ok(m.triggers.some(t => t.action.type === 'pickupNarices' && t.x === NARICES_CARD.x && t.y === NARICES_CARD.y));
console.log('ok - Narices del Teide está en un callejón fuera del camino principal');

// Refugio con interiores funcionales (centro y colegio) y salida a la base.
assert.equal(PARRANDEROS.refugio.outside.x, approaches[0][0]);
assert.equal(PARRANDEROS.refugio.outside.y, approaches[0][1]);
assert.equal(SCHOOLS.refugio.outside.x, approaches[1][0]);
assert.equal(SCHOOLS.refugio.outside.y, approaches[1][1]);
assert.ok(m.triggers.some(t => t.action.type === 'enterParrandero' && t.action.id === 'refugio' && t.x === REFUGIO_DOORS.center.x && t.y === REFUGIO_DOORS.center.y));
assert.ok(m.triggers.some(t => t.action.type === 'enterSchool' && t.action.id === 'refugio' && t.x === REFUGIO_DOORS.school.x && t.y === REFUGIO_DOORS.school.y));
assert.ok(m.triggers.some(t => t.action.type === 'orotavaReturn' && t.x === MONTANA_EXIT.x && t.y === MONTANA_EXIT.y));
assert.equal(MONTANA_EXIT.y, MONTANA_ENTRY.y + 1);
assert.ok(PARRANDEROS.refugio && SCHOOLS.refugio.kids.every(id => TRAINERS[id].repeatable));
console.log('ok - refugio con centro parrandero y colegio accesibles por sus puertas');

// Senderistas alemanes: mazos válidos y duelos que terminan.
for (const id of ['senderista_hans', 'senderista_greta', 'senderista_klaus']) {
  const tr = TRAINERS[id];
  const colors = new Set(tr.deck.map(c => CARDS[c]?.produces));
  for (const c of tr.deck) {
    assert.ok(CARDS[c], `${id}: ${c} existe`);
    for (const color of MANA_COLORS) if (CARDS[c].mana?.[color]) assert.ok(colors.has(color), `${id}: paga ${color}`);
  }
  let duel = createBattle({ name: 'TU', deck: Array(20).fill('tierra_volcan') }, { name: tr.name, deck: tr.deck });
  for (let i = 0; duel.winner === null && i < 1200; i++) duel = step(duel);
  assert.notEqual(duel.winner, null, `${id}: duelo termina`);
}
console.log('ok - los tres senderistas alemanes retan con mazos válidos');

// Narices del Teide: legendaria, fuera de sobres, y destruye todas las criaturas de ambas mesas.
assert.equal(CARDS.narices_teide.legendary, true);
assert.equal(CARDS.narices_teide.effect?.kind, 'day_of_judgement');
assert.equal(SPELL_IDS.includes('narices_teide'), false);
let duel = step(createBattle({ name: 'TU', deck: Array(20).fill('tierra_volcan') }, { name: 'RIVAL', deck: Array(20).fill('tierra_malpais') }));
duel.players[0].deck = [];
duel.players[0].hand = [CARDS.narices_teide];
duel.players[0].lands = [1, 2, 3, 4, 5].map(uid => ({ uid, def: CARDS.tierra_volcan, produces: 'R' as const, tapped: false }))
  .concat([{ uid: 6, def: CARDS.tierra_playa, produces: 'W' as const, tapped: false }]);
duel.players[0].landPlayedThisTurn = true;
const minion = (uid: number, id: string): Minion => ({
  uid, def: CARDS[id], atk: 2, hp: 5, maxHp: 5, shine: 2,
  canAttack: true, attacksLeft: 1, stealthed: CARDS[id].keywords?.includes('sigilo') ?? false,
});
duel.players[0].board = [minion(50, 'cabra'), minion(51, 'choco')];
duel.players[1].board = [minion(60, 'lapa_acorazada'), minion(61, 'michino')];
const before = duel.players[0].graveyard.length + duel.players[1].graveyard.length;
duel = step(duel);
assert.equal(duel.players[0].board.length + duel.players[1].board.length, 0);
assert.equal(duel.players[0].graveyard.length + duel.players[1].graveyard.length, before + 4);
assert.match(duel.lastEvent, /DÍA DEL JUICIO/);
console.log('ok - Narices del Teide destruye las cuatro criaturas de ambas mesas');

assert.ok(MAPS.montana_blanca.id === ('montana_blanca' as MapId));
