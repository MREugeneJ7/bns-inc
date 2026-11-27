import assert from 'node:assert/strict';
import { CARDS, MAX_DECK, MANA_COLORS, SPELL_IDS } from '../src/battle/cards';
import { canAddToDeck, countOwned } from '../src/battle/booster';
import { createBattle, step, type LandOnBoard, type Minion } from '../src/battle/engine';
import { grantNevada } from '../src/game/firstEdition';
import { MAPS, nearestParrandero, type MapId } from '../src/game/maps';
import {
  BORONDON_COVE, BORONDON_HIDDEN_MS, BORONDON_PERIOD_MS, BORONDON_PRIZE, BORONDON_RETURN,
  GOMERA_SEA_START, GOMERA_TRAINERS, SAN_SEBASTIAN_PIER, borondonAboveWater, borondonBankAt, gomeraVesselRadius,
} from '../src/game/mapsGomera';
import { boardWater, vaultable } from '../src/game/safariMoves';
import { exportSaveJSON, importSaveJSON, loadPreset, save } from '../src/game/save';
import { SOLID, type TileId } from '../src/game/sprites';
import { TRAINERS } from '../src/game/trainers';

const vectors = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;
const tile = (id: MapId, x: number, y: number): TileId => MAPS[id].legend[MAPS[id].rows[y]?.[x] ?? ''] ?? 'wall';

function coastReach(surfing: boolean, visible = false) {
  const queue = [[40, 25]];
  const visited = new Set(['40,25']);
  for (const [x, y] of queue) for (const [dx, dy] of vectors) {
    const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
    if (visited.has(key) || (visible && borondonBankAt(nx, ny))) continue;
    if (GOMERA_TRAINERS.some(n => n.y === ny && Math.abs(n.x - nx) <= gomeraVesselRadius(n.sprite))) continue;
    const t = tile('veronicas', nx, ny);
    if (SOLID[t] && !(surfing && boardWater('veronicas', t, nx, ny))) continue;
    visited.add(key);
    queue.push([nx, ny]);
  }
  return (x: number, y: number) => visited.has(`${x},${y}`);
}

const dry = coastReach(false);
const sea = coastReach(true);
const raised = coastReach(true, true);
assert.equal(dry(40, GOMERA_SEA_START), false);
assert.ok(sea(40, GOMERA_SEA_START), 'se sale de Troya directamente al canal por agua');
assert.ok(sea(SAN_SEBASTIAN_PIER.x, SAN_SEBASTIAN_PIER.y));
assert.ok(raised(SAN_SEBASTIAN_PIER.x, SAN_SEBASTIAN_PIER.y), 'la isla no corta la travesía');
assert.ok(MAPS.san_sebastian, 'el pantalán continúa hacia la ciudad');
const townAccess = MAPS.veronicas.triggers.filter(t => t.y >= GOMERA_SEA_START && t.action.type === 'warp');
assert.equal(townAccess.length, 2);
assert.ok(townAccess.every(t => t.y === 88 && t.action.type === 'warp' && t.action.to === 'san_sebastian'), 'el canal sigue siendo navegable hasta el pantalán');
assert.equal(nearestParrandero('veronicas', 44, 45), 'troya');
assert.equal(boardWater('veronicas', tile('veronicas', 20, 39), 20, 39), false, 'la corriente limita el canal');
assert.equal(GOMERA_TRAINERS.filter(n => n.sprite === 'barco_delfines').length, 2);
assert.equal(GOMERA_TRAINERS.filter(n => n.sprite === 'moto_acuatica').length, 2);
for (const n of GOMERA_TRAINERS) {
  assert.ok(raised(n.x, n.y - 1), `${n.id} es alcanzable desde el mar`);
  const trainer = TRAINERS[n.trainer!];
  const cards = trainer.deck.map(id => { assert.ok(CARDS[id], id); return CARDS[id]; });
  const colors = new Set(cards.map(c => c.produces));
  for (const card of cards) for (const color of MANA_COLORS) {
    if (card.mana?.[color]) assert.ok(colors.has(color), `${n.id} paga ${card.name}`);
  }
}
console.log('ok - ruta continua desde Troya, pantalán final y cuatro duelos acuáticos');

for (let cycle = 0; cycle < 3; cycle++) {
  const start = cycle * BORONDON_PERIOD_MS;
  assert.equal(borondonAboveWater(start), false);
  assert.equal(borondonAboveWater(start + BORONDON_HIDDEN_MS - 1), false);
  assert.equal(borondonAboveWater(start + BORONDON_HIDDEN_MS), true);
  assert.equal(borondonAboveWater(start + BORONDON_PERIOD_MS - 1), true);
}
const landings = MAPS.veronicas.triggers.filter(t => t.action.type === 'landBorondon');
assert.ok(landings.length > 0);
for (const t of landings) {
  assert.equal(t.kind, 'step');
  assert.equal(borondonBankAt(t.x, t.y), 'blacksand');
  assert.equal(tile('veronicas', t.x, t.y), 'sea', 'sumergida, la cala es mar navegable');
}
assert.ok(landings.some(t => vectors.some(([dx, dy]) => raised(t.x + dx, t.y + dy))));
assert.ok(raised(BORONDON_RETURN.x, BORONDON_RETURN.y), 'la salida deja al jugador sobre mar navegable, incluso con la isla emergida');
console.log('ok - la cala de San Borondón emerge y vuelve a sumergirse de forma cíclica');

function jumpsFrom(from: { x: number; y: number }, jump: boolean) {
  const id = 'san_borondon';
  const best = new Map([[`${from.x},${from.y}`, 0]]);
  const queue = [[from.x, from.y]];
  const stepTriggers = new Set(MAPS[id].triggers.filter(t => t.kind === 'step').map(t => `${t.x},${t.y}`));
  for (const [x, y] of queue) {
    const distance = best.get(`${x},${y}`)!;
    for (const [dx, dy] of vectors) {
      let nx = x + dx, ny = y + dy, cost = distance;
      if (jump && vaultable(id, tile(id, nx, ny))) {
        nx += dx; ny += dy; cost++;
        if (stepTriggers.has(`${nx},${ny}`)) continue;
      }
      const key = `${nx},${ny}`;
      if (SOLID[tile(id, nx, ny)] || (best.get(key) ?? Infinity) <= cost) continue;
      best.set(key, cost); queue.push([nx, ny]);
    }
  }
  return (x: number, y: number) => best.get(`${x},${y}`) ?? Infinity;
}

const approach = vectors.map(([dx, dy]) => ({ x: BORONDON_PRIZE.x + dx, y: BORONDON_PRIZE.y + dy }));
assert.equal(tile('san_borondon', BORONDON_PRIZE.x, BORONDON_PRIZE.y), 'card');
assert.ok(approach.every(p => jumpsFrom(BORONDON_COVE, false)(p.x, p.y) === Infinity));
const withVara = jumpsFrom(BORONDON_COVE, true);
assert.equal(Math.min(...approach.map(p => withVara(p.x, p.y))), 4, 'mínimo cuatro saltos distintos');
for (const p of approach.filter(p => withVara(p.x, p.y) < Infinity)) {
  const back = jumpsFrom(p, true);
  assert.ok(MAPS.san_borondon.triggers.some(t => t.action.type === 'sailFromBorondon' && back(t.x, t.y) < Infinity));
}
assert.equal(boardWater('san_borondon', 'sea', 11, 21), false, 'la Pukas no sustituye a la vara');
console.log('ok - el rompecabezas exige cuatro saltos y siempre se puede regresar a la cala');

assert.equal(CARDS.nevada_teide.type, 'spell');
assert.equal(CARDS.nevada_teide.legendary, true);
assert.ok(!SPELL_IDS.includes('nevada_teide'));
loadPreset('noche', 'angelote');
assert.equal(grantNevada(save), 'deck');
assert.equal(grantNevada(save), null);
assert.match(canAddToDeck(save, 'nevada_teide') ?? '', /legendaria/);
assert.equal(countOwned(save, 'nevada_teide'), 1);
assert.ok(importSaveJSON(exportSaveJSON()));
assert.equal(save.flags.seen_nevada_teide, true);
assert.equal(grantNevada(save), null);
loadPreset('noche', 'angelote');
save.deck = Array(MAX_DECK).fill('tierra_charco');
assert.equal(grantNevada(save), 'pc');
assert.equal(countOwned(save, 'nevada_teide'), 1);
console.log('ok - Nevada del Teide es única, persistente y va al PC si no cabe en el mazo');

const battle = () => createBattle(
  { name: 'TU', deck: Array(14).fill('tierra_charco') },
  { name: 'RIVAL', deck: Array(14).fill('tierra_playa') },
);
const land = (uid: number, id: string): LandOnBoard => ({ uid, def: CARDS[id], produces: CARDS[id].produces, tapped: false });
const minion = (uid: number, id: string): Minion => ({
  uid, def: CARDS[id], atk: 2, hp: 5, maxHp: 5, shine: 0, canAttack: true, attacksLeft: 1, stealthed: false,
});
const pass = (s: ReturnType<typeof battle>) => step({ ...s, phase: 'end' });
const play = (s: ReturnType<typeof battle>) => step({ ...s, phase: 'play' });
const attack = (s: ReturnType<typeof battle>) => step({ ...s, phase: 'attack' });

let s = step(battle());
s.players[0].hand = [CARDS.nevada_teide];
s.players[0].lands = [1, 2, 3, 4].map(uid => land(uid, 'tierra_charco'));
s.players[0].poisoned = true;
s = play(s);
assert.equal(s.players[0].fogTurns, 0);
assert.equal(s.players[0].nextFogTurns, 3);
assert.ok(s.players[0].lands.every(l => l.tapped));
assert.ok(s.players[0].graveyard.includes(CARDS.nevada_teide));
s = pass(s);
assert.equal(s.players[0].life, 19, 'el veneno sigue actuando durante el turno de lanzamiento');
assert.equal(s.players[0].fogTurns, 3);
s.players[1].lands = [land(5, 'tierra_playa')];
s.players[1].hand = [CARDS.chola];
s = play(s);
assert.equal(s.players[0].life, 19, 'el daño de hechizo al entrenador queda bloqueado');
s.players[0].poisoned = false;
s.players[1].board = [minion(6, 'cubata_garrafon')];
s = attack(s);
assert.equal(s.players[0].life, 19);
assert.equal(s.players[0].poisoned, false, 'un ataque prevenido tampoco envenena');
s = pass(s);
assert.equal(s.players[0].fogTurns, 2);
s.players[0].poisoned = true;
s = pass(s);
assert.equal(s.players[0].life, 19, 'la nevada suspende el daño de un veneno existente');
assert.equal(s.players[0].fogTurns, 1);
s = pass(s);
assert.equal(s.players[0].fogTurns, 0);
assert.equal(pass(s).players[0].life, 18, 'el daño vuelve al cuarto turno');

let combat = { ...battle(), active: 1 as const };
combat.players[1].board = [minion(10, 'baifo')];
combat.players[0].board = [minion(11, 'baifo'), { ...minion(12, 'lapa'), poisoned: true }];
combat.players[0].fogTurns = 2;
combat.players[1].hand = [CARDS.calima, CARDS.chola];
combat.players[1].lands = [land(13, 'tierra_malpais'), land(14, 'tierra_charco'), land(15, 'tierra_playa')];
combat.players[1].landPlayedThisTurn = true;
const area = play(combat);
const single = play(area);
assert.deepEqual(single.players[0].board.map(m => m.hp), [5, 5], 'ni el área ni el hechizo dirigido dañan a sus criaturas');
const block = attack(single);
assert.deepEqual(block.players[0].board.map(m => m.hp), [5, 5]);
assert.equal(block.players[1].board[0].hp, 3, 'la protección no cubre al rival');
const retaliation = attack({ ...pass(block), phase: 'attack' });
assert.equal(retaliation.players[0].board[0].hp, 5, 'también protege del contragolpe en tu turno');
assert.equal(pass(retaliation).players[0].board[1].hp, 5, 'también protege a tus criaturas del veneno');
console.log('ok - el escudo empieza al turno siguiente y previene ataques, hechizos y veneno durante exactamente tres turnos');