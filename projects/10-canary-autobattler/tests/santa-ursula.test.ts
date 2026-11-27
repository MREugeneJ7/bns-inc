import assert from 'node:assert/strict';
import { CARDS, MANA_COLORS } from '../src/battle/cards';
import { createBattle, step } from '../src/battle/engine';
import { MAPS, PARRANDEROS, SCHOOLS, nearestParrandero, type MapId } from '../src/game/maps';
import { GENERAL_ROUTE, SANTA_URSULA_ENTRY, URSULA_DOORS } from '../src/game/mapsSantaUrsula';
import { LA_QUINTA_EXIT } from '../src/game/mapsTf5';
import { claimBoosterReward, grantTrainerVictory, settleTrainerLoss, trainerDefeated } from '../src/game/rewards';
import { cocoEncounter } from '../src/game/rosarioQuest';
import { RUTA } from '../src/game/ruta';
import {
  DIABLITO_DISCOVERY, DIABLITO_FIRST, DIABLITO_RETRY, DIABLITO_TRAINER,
  diablitoPostVictory, discoverDiablito,
} from '../src/game/santaUrsulaQuest';
import { blackoutToNearestCenter, exportSaveJSON, importSaveJSON, loadPreset, save } from '../src/game/save';
import { DRIVABLE_TILES, SOLID } from '../src/game/sprites';
import { TRAINERS } from '../src/game/trainers';

const vectors = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;
const key = (x: number, y: number) => `${x},${y}`;
function reach(id: MapId, from: { x: number; y: number }, car = false, excludeAroma = false) {
  const m = MAPS[id];
  const visited = new Set([key(from.x, from.y)]), queue = [[from.x, from.y]];
  for (const [x, y] of queue) for (const [dx, dy] of vectors) {
    const nx = x + dx, ny = y + dy, p = key(nx, ny), ch = m.rows[ny]?.[nx];
    if (!ch || visited.has(p) || SOLID[m.legend[ch]] || (car && !DRIVABLE_TILES.has(m.legend[ch]))) continue;
    if (m.npcs.some(n => !n.hidden && n.x === nx && n.y === ny)) continue;
    if (excludeAroma && m.triggers.some(t => t.x === nx && t.y === ny && t.action.type === 'diablitoAroma')) continue;
    visited.add(p); queue.push([nx, ny]);
  }
  return visited;
}

const city = MAPS.santa_ursula;
for (const m of [city, MAPS.el_diablito]) {
  assert.ok(m.rows.every(row => row.length === m.rows[0].length));
  for (const row of m.rows) for (const ch of row) assert.ok(m.legend[ch], `${m.id}: baldosa ${ch}`);
}
const exits = MAPS.tf5.triggers.filter(t => t.action.type === 'warp' && t.action.to === 'santa_ursula');
assert.equal(exits.length, 3);
for (const exit of exits) {
  assert.equal(exit.y, 86, 'la salida sigue hacia el sur, sin otro puente');
  assert.ok(DRIVABLE_TILES.has(MAPS.tf5.legend[MAPS.tf5.rows[exit.y][exit.x]]));
}
assert.ok(city.triggers.some(t => t.action.type === 'warp' && t.action.to === 'tf5' && t.action.x === LA_QUINTA_EXIT.x && t.action.y === 85));
const walking = reach('santa_ursula', SANTA_URSULA_ENTRY);
const driving = reach('santa_ursula', SANTA_URSULA_ENTRY, true);
for (const door of Object.values(URSULA_DOORS)) assert.ok(walking.has(key(door.x, door.y + 1)));
assert.ok(driving.has(key(URSULA_DOORS.diablito.x, URSULA_DOORS.diablito.y + 1)));
for (let i = 1; i < GENERAL_ROUTE.length; i++) {
  assert.ok(GENERAL_ROUTE[i][0] <= GENERAL_ROUTE[i - 1][0] && GENERAL_ROUTE[i][1] >= GENERAL_ROUTE[i - 1][1], 'la general avanza al suroeste');
}
for (const car of [false, true]) assert.ok(!reach('santa_ursula', SANTA_URSULA_ENTRY, car, true).has(`${URSULA_DOORS.diablito.x},${URSULA_DOORS.diablito.y + 1}`), 'el aroma se encuentra antes de la puerta a pie y en coche');
// Más allá del Diablito, la carretera general acaba en el borde sur y lanza la cutscene de La Orotava.
const cutscenes = city.triggers.filter(t => t.action.type === 'orotavaCutscene');
assert.ok(cutscenes.length >= 2, 'hay disparadores de la cutscene al final de la carretera');
assert.ok(cutscenes.every(t => walking.has(key(t.x, t.y))), 'la cutscene es alcanzable a pie desde el pueblo');
assert.ok(cutscenes.every(t => t.y === 47), 'la cutscene solo salta en el borde sur del mapa');
assert.ok(cutscenes.every(t => !(t.x >= URSULA_DOORS.diablito.x - 4 && t.x <= URSULA_DOORS.diablito.x + 4 && t.y < 44)), 'no salta al pasar junto al Diablito');
const inside = reach('el_diablito', { x: 11, y: 16 });
assert.ok(inside.has('11,5') && inside.has('11,17'), 'se llega al Coco y se vuelve a salir');
assert.equal(PARRANDEROS.santa_ursula.outside.mapId, 'santa_ursula');
assert.equal(SCHOOLS.santa_ursula.outside.mapId, 'santa_ursula');
assert.ok(SCHOOLS.santa_ursula.kids.every(id => TRAINERS[id].repeatable));
assert.equal(nearestParrandero('el_diablito', 11, 5), 'santa_ursula');
assert.equal(nearestParrandero('colegio', 3, 4, 'ull', 'santa_ursula'), 'santa_ursula');
console.log('ok - subida desde La Quinta, pueblo con servicios y general al suroeste hasta El Diablito');

loadPreset('santa_ursula', 'angelote');
assert.equal(discoverDiablito(save), true);
assert.equal(discoverDiablito(save), false, 'el recuerdo solo se dispara una vez');
assert.equal(save.flags.ruta, true);
assert.match(DIABLITO_DISCOVERY.join(' '), /aroma.*italiana/i);
assert.match(DIABLITO_DISCOVERY.join(' '), /cartel.*CERRADO/i);
assert.match(DIABLITO_DISCOVERY.join(' '), /RUTA DEL BUEN YANTAR.*último gimnasio/i);
assert.match(MAPS.el_diablito.onEnter!.join(' '), /O sole mio/i);
assert.match(DIABLITO_FIRST.join(' '), /Meridiano.*Magos de la Costa/);
assert.match(DIABLITO_FIRST.join(' '), /cerrado.*niñatos.*boliches/);
assert.match(DIABLITO_FIRST.join(' '), /negocios criminales.*reabrir/);
assert.notDeepEqual(DIABLITO_FIRST, DIABLITO_RETRY);
assert.equal(RUTA.length, 8);
assert.equal(RUTA[7].name, 'El Diablito');
assert.equal(RUTA[7].leader, 'El Coco de Santa Úrsula');
console.log('ok - aroma, cartel cerrado, recuerdo de la Ruta y explicación de la reapertura');

// Defeating either old encounter must not settle the third, in any order.
for (const thirdFirst of [false, true]) {
  loadPreset('la_quinta', 'angelote');
  const clearReward = () => assert.ok(claimBoosterReward(save, 0, 'pc').ok);
  if (thirdFirst) {
    save.mapId = 'el_diablito';
    assert.ok(grantTrainerVictory(save, DIABLITO_TRAINER)); clearReward();
    assert.ok(!save.flags.coco_meridiano_beaten && !save.flags.coco_beaten);
    assert.equal(trainerDefeated(save, 'coco_santa_ursula'), false);
  }
  save.mapId = 'guarida_enriscada';
  assert.equal(cocoEncounter(save.mapId, save.flags), 'first');
  assert.ok(grantTrainerVictory(save, 'coco_santa_ursula')); clearReward();
  assert.ok(save.flags.has_cazafantasmas);
  assert.ok(!save.flags.coco_beaten);
  save.mapId = 'magos_azotea';
  assert.equal(cocoEncounter(save.mapId, save.flags), 'first');
  assert.ok(grantTrainerVictory(save, 'coco_santa_ursula')); clearReward();
  assert.ok(save.flags.has_fotocopiadora && save.flags.coco_ricardo_rescued);
  assert.equal(trainerDefeated(save, DIABLITO_TRAINER), thirdFirst);
  if (!thirdFirst) {
    assert.ok(!save.flags.boliche_8, 'Meridiano y Magos no conceden el octavo boliche');
    save.mapId = 'el_diablito';
    const duros = save.duros;
    const loss = settleTrainerLoss(save, DIABLITO_TRAINER, 10);
    assert.equal(loss, 10);
    assert.equal(save.duros, duros - 10);
    assert.equal(trainerDefeated(save, DIABLITO_TRAINER), false);
    assert.ok(grantTrainerVictory(save, DIABLITO_TRAINER)); clearReward();
  }
  assert.ok(save.flags.coco_meridiano_beaten && save.flags.coco_beaten && save.flags.coco_diablito_beaten);
  assert.ok(save.flags.has_cazafantasmas && save.flags.has_fotocopiadora && save.flags.boliche_8);
  assert.equal(grantTrainerVictory(save, DIABLITO_TRAINER), null, 'no duplica el boliche o la bolsa');
  for (const id of ['guarida_enriscada', 'magos_azotea'] as const) {
    assert.ok(MAPS[id].npcs.some(n => n.id === 'coco_ursula' && n.trainer === 'coco_santa_ursula'), 'se conservan las dos apariciones anteriores');
  }
  assert.ok(MAPS.el_diablito.npcs.some(n => n.id === 'coco_diablito' && n.trainer === DIABLITO_TRAINER));
}
console.log('ok - las tres apariciones y sus premios son independientes, incluso completándolas fuera de orden');

loadPreset('diablito', 'angelote');
assert.ok(save.flags.coco_meridiano_beaten && save.flags.coco_beaten);
assert.equal(trainerDefeated(save, DIABLITO_TRAINER), false);
save.flags.diablito_discovered = true; save.flags.coco_diablito_seen = true;
save.mapId = 'el_diablito'; save.playerPos = { x: 11, y: 5, dir: 'up' };
assert.ok(importSaveJSON(exportSaveJSON()));
assert.equal(save.lastCenter, 'santa_ursula');
assert.equal(save.lastSchool, 'santa_ursula');
assert.equal(save.mapId, 'el_diablito');
assert.ok(save.flags.diablito_discovered && save.flags.coco_diablito_seen);
const reward = grantTrainerVictory(save, DIABLITO_TRAINER);
assert.equal(reward?.gym, 8);
assert.equal(reward?.bolicheName, RUTA[7].boliche);
assert.match(diablitoPostVictory(save.flags).join(' '), /OCHO DE OCHO/);
assert.match(diablitoPostVictory({ boliche_8: true }).join(' '), /1\/8.*pendientes/);
assert.ok(claimBoosterReward(save, 0, 'pc').ok);
blackoutToNearestCenter(0);
assert.equal(save.mapId, 'parrandero');
assert.equal(save.lastCenter, 'santa_ursula');
assert.ok(save.flags.boliche_8 && save.flags.coco_meridiano_beaten && save.flags.coco_beaten);
console.log('ok - el octavo boliche completa la Ruta y el guardado conserva los tres encuentros y los servicios');

for (const id of [DIABLITO_TRAINER, ...SCHOOLS.santa_ursula.kids]) {
  const trainer = TRAINERS[id];
  assert.ok(trainer.deck.length <= 60);
  const colors = new Set(trainer.deck.map(c => CARDS[c]?.produces));
  for (const cid of trainer.deck) {
    assert.ok(CARDS[cid], `${id}: existe ${cid}`);
    for (const color of MANA_COLORS) if (CARDS[cid].mana?.[color]) assert.ok(colors.has(color), `${id}: paga ${color}`);
  }
  let battle = createBattle({ name: 'TU', deck: save.deck }, { name: trainer.name, deck: trainer.deck });
  for (let i = 0; battle.winner === null && i < 1800; i++) battle = step(battle);
  assert.notEqual(battle.winner, null);
}
console.log('ok - los mazos del último líder y del colegio son válidos y los duelos terminan');