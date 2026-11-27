import assert from 'node:assert/strict';
import { CHECKPOINTS } from '../src/game/checkpoints';
import { MAPS, type MapId } from '../src/game/maps';
import { STORE_FLOORS, LIFT, GOURMET_COUNTER, ROSARIO_ROADS, worksTile } from '../src/game/mapsRosario';
import { buyBeer, offerBeer, GOURMET } from '../src/game/rosarioQuest';
import { TRAINERS } from '../src/game/trainers';
import { CARDS, EVO_CHAINS } from '../src/battle/cards';
import { CREATURES } from '../src/game/creatureArt';
import { createBattle, step } from '../src/battle/engine';
import { claimBoosterReward, grantTrainerVictory } from '../src/game/rewards';
import { RUTA } from '../src/game/ruta';
import { loadPreset, save, npcState, exportSaveJSON, importSaveJSON, subscribeSave } from '../src/game/save';
import { SOLID, DRIVABLE_TILES } from '../src/game/sprites';
import { vaultable } from '../src/game/safariMoves';

function reachable(id: MapId, sx: number, sy: number, car = false) {
  const m = MAPS[id];
  const blocked = new Set(m.npcs.map(npcState).filter(n => !n.hidden).map(n => `${n.x},${n.y}`));
  const seen = new Set<string>();
  const q: [number, number][] = [[sx, sy]];
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i], key = `${x},${y}`, ch = m.rows[y]?.[x];
    if (!ch || seen.has(key) || blocked.has(key)) continue;
    const tile = worksTile(id, x, y, !!save.flags.rosario_open) ?? m.legend[ch];
    if (SOLID[tile] || (car && !DRIVABLE_TILES.has(tile))) continue;
    seen.add(key);
    q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return (x: number, y: number) => seen.has(`${x},${y}`);
}

const order = CHECKPOINTS.map(([id]) => id);
assert.equal(new Set(order).size, order.length);
assert.ok(order.indexOf('magomaniaco') < order.indexOf('taganana'));
for (const starter of ['angelote', 'cabra', 'pinzon'] as const) {
  for (const [i, id] of order.entries()) {
    let commits = 0;
    const off = subscribeSave(() => commits++);
    loadPreset(id, starter); off();
    assert.equal(commits, 1, `${id}: solo se publica el estado completo`);
    const {x, y} = save.playerPos, m = MAPS[save.mapId];
    assert.ok(reachable(m.id, x, y)(x, y), `${id}: aparición bloqueada`);
    if (i >= order.indexOf('recado')) assert.equal(save.starter, starter);
    if (i > order.indexOf('siam')) {
      assert.ok(save.flags.hm_pukas && save.flags.hm_salto_pastor, `${id}: faltan M.O. del parque`);
      assert.ok(save.flags.visited_siam_park && save.flags.mago_americas_done);
      assert.ok(save.flags.has_bucio && save.flags.hm_binter && save.flags.boliche_4);
      assert.ok(!save.flags.has_crema_fp50 && !save.flags.pukas_recovered);
      assert.ok(!save.flags.pukas_out && !save.flags.car_out);
    }
    if (i > order.indexOf('papagayos')) assert.ok(save.flags.boliche_5 && save.beaten.gym_papagayos);
    if (i > order.indexOf('caletillas')) assert.ok(save.flags.got_unelco && save.deck.includes('unelco'));
    assert.equal(!!save.flags.rosario_open, i >= order.indexOf('rosario'));
  }
}
loadPreset('siam');
assert.ok(!save.flags.hm_pukas && !save.flags.hm_salto_pastor);
const park = MAPS.siam_park;
for (const row of park.rows) for (const c of row) assert.notEqual(park.legend[c], 'redrock');
for (let x = 15; x <= 46; x++) assert.equal(SOLID[park.legend[park.rows[14][x]]], false);
loadPreset('caletillas'); assert.equal(!!save.flags.got_unelco, false);
console.log('ok - orden cronológico, saltos acumulativos, tres mazos y sendero libre de Siam Park');

loadPreset('gourmet');
const startMoney = save.duros;
for (const b of GOURMET) {
  assert.ok(buyBeer(save, b.id)); assert.equal(save.beers[b.id], 1);
  assert.ok(!save.flags.rosario_open, 'comprar no abre la carretera');
}
assert.equal(save.duros, startMoney - GOURMET.reduce((n, b) => n + b.price, 0));
save.duros = 0;
const before = exportSaveJSON();
assert.equal(buyBeer(save, 'tacoa'), false); assert.equal(exportSaveJSON(), before);
for (const id of ['mahou', 'guinness'] as const) {
  assert.equal(offerBeer(save, id), 'refused'); assert.equal(exportSaveJSON(), before);
}
for (const id of ['dorada', 'tacoa', 'tierra_perros'] as const) {
  assert.ok(importSaveJSON(before));
  assert.equal(offerBeer(save, id), 'accepted'); assert.equal(save.beers[id] ?? 0, 0);
  assert.equal(save.flags.rosario_open, true);
  const bag = JSON.stringify(save.beers);
  assert.equal(offerBeer(save, 'tacoa'), 'open'); assert.equal(JSON.stringify(save.beers), bag);
  const after = exportSaveJSON(); loadPreset('inicio'); assert.ok(importSaveJSON(after));
  assert.ok(save.flags.rosario_open); assert.equal(JSON.stringify(save.beers), bag);
}
loadPreset('gourmet'); assert.equal(offerBeer(save, 'dorada'), 'missing');
const legacy = JSON.parse(before); delete legacy.beers;
assert.ok(importSaveJSON(JSON.stringify(legacy))); assert.deepEqual(save.beers, {}); assert.equal(save.mapId, 'eci_azotea');
assert.deepEqual([!!save.flags.hm_pukas, !!save.flags.hm_salto_pastor], [true, true]);
console.log('ok - precios, saldo insuficiente, tres marcas válidas, rechazo sin consumo y persistencia');

for (const [id, { gateX }] of Object.entries(ROSARIO_ROADS) as [keyof typeof ROSARIO_ROADS, typeof ROSARIO_ROADS[keyof typeof ROSARIO_ROADS]][]) {
  loadPreset('entrega');
  const m = MAPS[id];
  const sx = id === 'barranco_hondo' ? 4 : 22, sy = id === 'barranco_hondo' ? 16 : 8;
  const exit = m.triggers.find(t => t.action.type === 'warp' && t.action.to === 'el_rosario')!;
  for (const driving of [false, true]) {
    const reach = reachable(id, sx, sy, driving);
    assert.ok(reach(id === 'barranco_hondo' ? gateX - 2 : gateX + 2, 8)); assert.ok(!reach(exit.x, exit.y));
  }
  assert.equal(vaultable(id, 'fence'), false);
  assert.ok(m.npcs.every(n => npcState(n).x === (id === 'barranco_hondo' ? gateX - 1 : gateX + 1)));
  assert.equal(offerBeer(save, 'dorada'), 'accepted');
  assert.ok(m.npcs.every(n => npcState(n).y === 10));
  for (const driving of [false, true]) assert.ok(reachable(id, sx, sy, driving)(exit.x, exit.y));
  for (const other of ['acceso_taco', 'barranco_hondo'] as const) assert.equal(worksTile(other, ROSARIO_ROADS[other].gateX, 8, !!save.flags.rosario_open), 'road');
}
assert.ok(reachable('tf1', 133, 16)(133, 0));
assert.ok(reachable('calle', 10, 4)(0, 9), 'Taco: la calle sigue hacia el oeste');
assert.ok(!MAPS.calle.triggers.some(t => t.action.type === 'warp' && t.action.to === 'acceso_taco' && t.x > 1), 'sin ramal al este del bazar');
assert.ok(MAPS.acceso_taco.triggers.some(t => t.action.type === 'warp' && t.action.to === 'el_rosario' && t.x === 0), 'el pueblo queda al oeste de las obras');
assert.ok(reachable('santacruz_sur', 44, 9)(44, 6));
for (const map of Object.values(MAPS)) {
  for (const t of map.triggers) {
    if (t.action.type !== 'warp' || !['barranco_hondo', 'acceso_taco', 'el_rosario', 'eci_pb'].some(id => id === map.id || (t.action.type === 'warp' && id === t.action.to))) continue;
    const a = t.action, dest = MAPS[a.to];
    assert.equal(SOLID[map.legend[map.rows[t.y]?.[t.x]]], false, `salida ${map.id}`);
    assert.equal(SOLID[dest.legend[dest.rows[a.y]?.[a.x]]], false, `llegada ${a.to}`);
    assert.ok(!dest.triggers.some(tr => tr.kind === 'step' && tr.x === a.x && tr.y === a.y && tr.action.type === 'warp'));
  }
}
console.log('ok - dos grupos bloquean sin atajos, un solo regalo despeja ambos accesos y se puede volver');

for (const [id] of STORE_FLOORS) {
  const m = MAPS[id];
  assert.equal(m.name.startsWith('El Corte Inglés'), true);
  assert.ok(m.triggers.some(t => t.x === LIFT.x && t.y === LIFT.y && t.action.type === 'storeLift'));
  assert.equal(m.triggers.some(t => t.action.type === 'gourmetShop'), id === 'eci_azotea');
  assert.equal(m.triggers.some(t => t.action.type === 'warp'), id === 'eci_pb');
  if (id !== 'eci_pb' && id !== 'eci_azotea') assert.equal(m.triggers.length, 1);
  assert.equal(SOLID[m.legend[m.rows[LIFT.y + 1][LIFT.x]]], false);
}
assert.ok(reachable('eci_pb', 10, 12)(LIFT.x, LIFT.y + 1));
assert.ok(reachable('eci_azotea', LIFT.x, LIFT.y + 1)(GOURMET_COUNTER.x, GOURMET_COUNTER.y + 1));
const town = MAPS.el_rosario;
assert.ok(town.rows.some(r => /B{14}/.test(r)), 'hay un edificio de una manzana');
assert.ok(town.triggers.some(t => t.action.type === 'enterParrandero' && t.action.id === 'rosario'));
assert.ok(town.triggers.some(t => t.action.type === 'enterSchool' && t.action.id === 'rosario'));
assert.ok(!town.triggers.some(t => t.action.type === 'warp' && !['acceso_taco', 'barranco_hondo', 'magos_pb', 'guachinche_rosario'].includes(t.action.to)));
assert.ok(town.triggers.some(t => t.action.type === 'warp' && t.action.to === 'magos_pb'), 'entrada a Magos de la Costa desde la plaza');
loadPreset('rosario');
const inTown = reachable('el_rosario', 2, 9);
assert.ok(inTown(5, 7) && inTown(32, 7), 'centro y colegio accesibles desde la calle');
assert.ok(inTown(35, 9) && inTown(0, 10), 'las dos salidas se alcanzan a pie');
const wrestler = town.npcs.find(n => n.id === 'luchador_rosario')!;
assert.ok([[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy]) => inTown(wrestler.x + dx, wrestler.y + dy)), 'se puede hablar con el luchador');
console.log('ok - ocho plantas, ascensor en cada una, tienda solo en azotea, y pueblo con centro, colegio y terrero');

const t = TRAINERS.terrero_rosario;
assert.equal(t.gym, undefined); assert.equal(t.bolicheName, undefined); assert.equal(t.repeatable, undefined);
assert.deepEqual([...new Set(t.deck.filter(id => CARDS[id].type !== 'land'))].sort(), ['pancho_camurria', 'pollito_frontera']);
assert.equal(RUTA[5].name, 'Guachinche de El Rosario', 'el terrero sigue fuera; el guachinche de doña Sabina es el sexto');
assert.equal(RUTA[5].leader, 'Doña Sabina');
assert.ok(!RUTA.some(g => /terrero/i.test(g.name + g.zona + g.leader)), 'el terrero no figura en la Ruta');
for (const id of ['pancho_camurria', 'pollito_frontera']) {
  assert.equal(CARDS[id].type, 'creature'); assert.deepEqual(EVO_CHAINS[id], [id]);
  assert.ok(CREATURES[id].length <= 24 && CREATURES[id].every(r => r.length <= 24), `${id} tiene sprite propio`);
}
loadPreset('terrero');
assert.equal(save.lastCenter, 'rosario'); assert.equal(save.lastSchool, 'rosario');
for (let i = 0; i < 6; i++) { let b = createBattle({ name: 'TU', deck: save.deck }, { name: t.name, deck: t.deck }); for (let n = 0; b.winner === null && n < 1200; n++) b = step(b); assert.notEqual(b.winner, null); }
const boliches = Object.keys(save.flags).filter(k => k.startsWith('boliche_')).length;
const reward = grantTrainerVictory(save, 'terrero_rosario');
assert.ok(reward && reward.gym === undefined && reward.purse === 40);
assert.equal(Object.keys(save.flags).filter(k => k.startsWith('boliche_')).length, boliches, 'ganar no da boliche');
assert.ok(claimBoosterReward(save, 0, 'pc').ok);
assert.equal(grantTrainerVictory(save, 'terrero_rosario'), null, 'no es repetible');
for (const kid of ['cole6_a', 'cole6_b']) assert.ok(TRAINERS[kid].repeatable && TRAINERS[kid].purse === 24);
console.log('ok - terrero: falso gimnasio sin boliche, mazo de dos criaturas, duelo jugable y colegio Nv.6');