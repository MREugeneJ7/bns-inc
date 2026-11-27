import assert from 'node:assert/strict';
import { CARDS, MANA_COLORS } from '../src/battle/cards';
import { canAddToDeck, countOwned, doCombine, moveToDeck } from '../src/battle/booster';
import { createBattle, step } from '../src/battle/engine';
import { certifyFirstEdition } from '../src/game/firstEdition';
import { MAPS, PARRANDEROS, SCHOOLS, nearestParrandero, type MapId } from '../src/game/maps';
import { CURBELO_KEY, GOMERA_DOORS, GOMERA_TALKS, SAN_SEBASTIAN_ENTRY } from '../src/game/mapsGomera';
import { claimBoosterReward, grantTrainerVictory, trainerDefeated } from '../src/game/rewards';
import { RUTA } from '../src/game/ruta';
import { exportSaveJSON, importSaveJSON, loadPreset, save } from '../src/game/save';
import { SOLID } from '../src/game/sprites';
import { TRAINERS } from '../src/game/trainers';

const vectors = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;
function reachable(id: MapId, x: number, y: number) {
  const map = MAPS[id];
  const distances = new Map([[`${x},${y}`, 0]]);
  const queue = [[x, y]];
  for (const [cx, cy] of queue) for (const [dx, dy] of vectors) {
    const nx = cx + dx, ny = cy + dy, key = `${nx},${ny}`;
    const ch = map.rows[ny]?.[nx];
    if (!ch || distances.has(key) || SOLID[map.legend[ch]] || map.npcs.some(n => !n.hidden && n.x === nx && n.y === ny)) continue;
    distances.set(key, distances.get(`${cx},${cy}`)! + 1); queue.push([nx, ny]);
  }
  return distances;
}

for (const id of ['san_sebastian', 'certificador_gomera', 'mansion_curbelo', 'guachinche_curbelo'] as const) {
  const m = MAPS[id];
  assert.ok(m.rows.every(r => r.length === m.rows[0].length));
  for (const row of m.rows) for (const ch of row) assert.ok(m.legend[ch], `${id}: leyenda ${ch}`);
  for (const n of m.npcs) assert.equal(n.sprite, 'casimiro', `${id}: solo hay Casimiros`);
  for (const t of m.triggers) if (t.action.type === 'text') {
    assert.match(t.action.lines.join(' '), /colón/i, `${id}: todos los carteles mencionan a Colón`);
  }
}
for (const [id, lines] of Object.entries(GOMERA_TALKS)) assert.match(lines.join(' '), /colón/i, id);
const port = MAPS.veronicas.triggers.filter(t => t.action.type === 'warp' && t.action.to === 'san_sebastian');
assert.deepEqual(port.map(t => [t.x, t.y]), [[47, 88], [49, 88]]);
assert.ok(port.every(t => t.action.type === 'warp' && t.action.x === SAN_SEBASTIAN_ENTRY.x && t.action.y === SAN_SEBASTIAN_ENTRY.y));
assert.ok(MAPS.san_sebastian.triggers.some(t => t.action.type === 'warp' && t.action.to === 'veronicas' && t.action.x === 48 && t.action.y === 86));

const cityReach = reachable('san_sebastian', SAN_SEBASTIAN_ENTRY.x, SAN_SEBASTIAN_ENTRY.y);
for (const [name, door] of Object.entries(GOMERA_DOORS)) {
  assert.ok(cityReach.has(`${door.x},${door.y + 1}`), `${name}: acceso a pie desde el puerto`);
  assert.equal(MAPS.san_sebastian.legend[MAPS.san_sebastian.rows[door.y][door.x]], 'door');
}
assert.equal(PARRANDEROS.gomera.outside.mapId, 'san_sebastian');
assert.equal(SCHOOLS.gomera.outside.mapId, 'san_sebastian');
assert.equal(SCHOOLS.gomera.kids.length, 2);
for (const id of ['san_sebastian', 'certificador_gomera', 'mansion_curbelo', 'guachinche_curbelo'] as const) {
  assert.equal(nearestParrandero(id, 10, 10), 'gomera');
}
assert.equal(nearestParrandero('colegio', 4, 4, 'weyler', 'gomera'), 'gomera');
console.log('ok - la ciudad está conectada con el pantalán y los cinco edificios son alcanzables');

const maze = MAPS.mansion_curbelo;
const key = maze.triggers.find(t => t.action.type === 'pickupCurbeloKey');
assert.ok(key);
assert.deepEqual([key.x, key.y], [CURBELO_KEY.x, CURBELO_KEY.y]);
assert.equal(maze.legend[maze.rows[key.y][key.x]], 'oldkey');
const fromEntry = reachable('mansion_curbelo', 11, 21);
const approaches = vectors.map(([dx, dy]) => ({ x: key.x + dx, y: key.y + dy }));
const accessible = approaches.filter(p => fromEntry.has(`${p.x},${p.y}`));
assert.equal(accessible.length, 1, 'la llave está al fondo de un callejón');
assert.ok(fromEntry.get(`${accessible[0].x},${accessible[0].y}`)! > 40, 'el recorrido es un laberinto, no una sala directa');
assert.ok(reachable('mansion_curbelo', accessible[0].x, accessible[0].y).has('11,22'), 'se puede volver a salir');
assert.equal(MAPS.san_sebastian.triggers.find(t => t.x === GOMERA_DOORS.gym.x && t.y === GOMERA_DOORS.gym.y)?.action.type, 'enterCurbeloGym');
assert.ok(MAPS.guachinche_curbelo.triggers.some(t => t.action.type === 'warp' && t.action.to === 'san_sebastian'));
console.log('ok - la llave está al final de un laberinto reversible y el guachinche tiene entrada propia');

loadPreset('gomera', 'angelote');
assert.ok(save.pc.includes('burgado_1ed'));
assert.match(canAddToDeck(save, 'burgado_1ed') ?? '', /sin certificar/);
const before = countOwned(save, 'burgado_1ed');
assert.deepEqual(certifyFirstEdition(save), ['burgado_1ed']);
assert.equal(countOwned(save, 'burgado_1ed'), before, 'la certificación no duplica ni mueve cartas');
assert.equal(canAddToDeck(save, 'burgado_1ed'), null);
assert.equal(moveToDeck(save, 'burgado_1ed'), null);
assert.equal(save.flags.cert_cangrejo_1ed, undefined, 'no certifica cartas no poseídas');
assert.deepEqual(certifyFirstEdition(save), [], 'repetir no altera las cartas');
save.pc.push('cangrejo_1ed', 'burgado_gigante_1ed');
assert.deepEqual(certifyFirstEdition(save), ['cangrejo_1ed', 'burgado_gigante_1ed']);
assert.equal(moveToDeck(save, 'cangrejo_1ed'), null);
assert.equal(moveToDeck(save, 'burgado_gigante_1ed'), null);
save.flags.has_curbelo_key = true;
save.lastCenter = 'gomera'; save.lastSchool = 'gomera'; save.mapId = 'san_sebastian';
assert.ok(importSaveJSON(exportSaveJSON()));
assert.equal(save.flags.has_curbelo_key, true);
assert.equal(save.flags.cert_burgado_1ed, true);
assert.equal(save.lastCenter, 'gomera');
assert.equal(save.lastSchool, 'gomera');
assert.equal(save.mapId, 'san_sebastian');
console.log('ok - Casimiro certifica solo las cartas poseídas; el PC y el guardado respetan el sello');

loadPreset('gomera', 'angelote');
save.pc = Array(5).fill('burgado_1ed');
certifyFirstEdition(save);
const evolution = doCombine(save, 'burgado_1ed');
assert.equal(evolution?.newId, 'burgado_gigante_1ed');
assert.equal(evolution?.destination, 'pc', 'la nueva edición necesita su propio sello');
assert.match(canAddToDeck(save, 'burgado_gigante_1ed') ?? '', /sin certificar/);
assert.deepEqual(certifyFirstEdition(save), ['burgado_gigante_1ed']);
assert.equal(moveToDeck(save, 'burgado_gigante_1ed'), null);
console.log('ok - las evoluciones antiguas se pueden certificar al obtenerlas');

for (const id of ['cole7_a', 'cole7_b', 'gym_curbelo'] as const) {
  const t = TRAINERS[id];
  assert.ok(t.deck.every(card => CARDS[card]), `${id}: cartas existentes`);
  const colors = new Set(t.deck.map(card => CARDS[card].produces));
  for (const card of t.deck) for (const color of MANA_COLORS) {
    if (CARDS[card].mana?.[color]) assert.ok(colors.has(color), `${id}: paga ${card}`);
  }
  for (const lines of [t.taunt, t.win, t.lose]) assert.match(lines.join(' '), /colón/i);
}
assert.ok(TRAINERS.cole7_a.repeatable && TRAINERS.cole7_b.repeatable);
assert.ok(TRAINERS.gym_curbelo.deck.filter(id => CARDS[id].type === 'land').every(id => CARDS[id].produces === 'R'));
assert.equal(TRAINERS.gym_curbelo.gym, 7);
assert.equal(TRAINERS.gym_curbelo.bolicheName, RUTA[6].boliche);
assert.equal(RUTA[6].leader, 'Casimiro Curbelo');
let battle = createBattle({ name: 'TU', deck: save.deck }, { name: TRAINERS.gym_curbelo.name, deck: TRAINERS.gym_curbelo.deck });
for (let i = 0; battle.winner === null && i < 1500; i++) battle = step(battle);
assert.notEqual(battle.winner, null);
const reward = grantTrainerVictory(save, 'gym_curbelo');
assert.equal(reward?.gym, 7);
assert.equal(save.flags.boliche_7, true);
assert.ok(claimBoosterReward(save, 0, 'pc').ok);
assert.ok(trainerDefeated(save, 'gym_curbelo'));
assert.equal(grantTrainerVictory(save, 'gym_curbelo'), null);
console.log('ok - colegio repetible y líder de fuego con séptimo boliche y sobre');