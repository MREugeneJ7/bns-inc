import assert from 'node:assert/strict';
import { createBattle, step } from '../src/battle/engine';
import { CARDS, CREATURE_IDS } from '../src/battle/cards';
import { MAPS, type MapId } from '../src/game/maps';
import { CREATURES } from '../src/game/creatureArt';
import { BRUJA_CANARIA, NINA_PERAS } from '../src/game/props';
import { grantBucio } from '../src/game/firstEdition';
import { claimBoosterReward, grantTrainerVictory, trainerDefeated } from '../src/game/rewards';
import { loadPreset, save } from '../src/game/save';
import { SOLID } from '../src/game/sprites';
import { TRAINERS } from '../src/game/trainers';
import { STORY } from '../src/game/story';

function run(name: string, test: () => void) {
  test();
  console.log(`ok - ${name}`);
}

type Point = { x: number; y: number };

function reachable(mapId: MapId, from: Point): { has: (x: number, y: number) => boolean; adj: (x: number, y: number) => boolean } {
  const map = MAPS[mapId];
  const blockedNpc = new Set(map.npcs.filter((n) => !n.hidden).map((n) => `${n.x},${n.y}`));
  const blocked = (x: number, y: number) => {
    if (x < 0 || y < 0 || y >= map.rows.length || x >= map.rows[0].length) return true;
    return !!SOLID[map.legend[map.rows[y][x]]] || blockedNpc.has(`${x},${y}`);
  };
  assert.equal(blocked(from.x, from.y), false, `${mapId} start is blocked`);
  const visited = new Set([`${from.x},${from.y}`]);
  const queue: Point[] = [from];
  while (queue.length) {
    const p = queue.shift()!;
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const x = p.x + dx, y = p.y + dy, key = `${x},${y}`;
      if (!visited.has(key) && !blocked(x, y)) { visited.add(key); queue.push({ x, y }); }
    }
  }
  const has = (x: number, y: number) => visited.has(`${x},${y}`);
  return {
    has,
    adj: (x, y) => [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dy]) => has(x + dx, y + dy)),
  };
}

run('cementerio: verja con llave, entrada interactuable y torre al este de San Andres', () => {
  const sanAndres = MAPS.san_andres;
  const gate = sanAndres.triggers.find((t) => t.action.type === 'enterTeresitasTower');
  assert.ok(gate && gate.x === 23 && gate.y === 11);
  assert.equal(sanAndres.legend[sanAndres.rows[11][23]], 'fence', 'la verja no se atraviesa andando');
  assert.ok(sanAndres.triggers.some((t) => t.action.type === 'cemeterySign'));
  assert.ok(STORY.cemetery_locked.some((line) => line.includes('EQUIPO CAZAFANTASMAS')));
  assert.ok(STORY.cemetery_enter.some((line) => line.includes('Torre Encantada')));
  assert.equal(MAPS.anaga.triggers.some((t) => t.action.type === 'warp' && t.action.to.startsWith('torre_')), false);
});

run('cinco plantas: pasillos uniformes, escaleras conectadas y doña en la azotea', () => {
  for (let floor = 1; floor <= 5; floor++) {
    const id = `torre_teresitas_${floor}` as MapId;
    const map = MAPS[id];
    assert.equal(map.rows.length, 16, `${id} height`);
    const width = map.rows[0].length;
    for (const row of map.rows) {
      assert.equal(row.length, width, `${id} row width`);
      for (const ch of row) assert.ok(map.legend[ch], `${id} unknown tile ${ch}`);
    }
    const from = reachable(id, { x: 9, y: 12 });
    assert.equal(from.adj(9, 13), true, `${id} lower stair reachable`);
    if (floor < 5) {
      assert.equal(from.has(9, 2), true, `${id} upper stair reachable`);
      const stair = map.triggers.find((t) => t.x === 9 && t.y === 2 && t.action.type === 'towerStairs');
      assert.ok(stair && stair.action.requiredTrainer === `torre_enriscada_${floor}`);
      assert.equal(stair.action.to, `torre_teresitas_${floor + 1}`);
      const guard = map.npcs.find((n) => n.trainer === `torre_enriscada_${floor}`);
      assert.ok(guard, `${id} mandatory guard`);
      assert.equal(from.adj(guard.x, guard.y), true, `${id} guard can be challenged`);
      const lady = map.npcs.find((n) => n.trainer?.startsWith('nina_') || n.trainer?.startsWith('dona_'));
      assert.ok(lady && from.adj(lady.x, lady.y), `${id} optional ghost lady is reachable`);
      assert.equal(TRAINERS[guard.trainer!].repeatable, undefined);
    }
  }
  assert.equal(MAPS.torre_teresitas_5.npcs.some((n) => n.id === 'bruja_teresitas'), true);
  for (const [name, sprite] of Object.entries({ BRUJA_CANARIA, NINA_PERAS })) {
    assert.equal(sprite.length, 16, `${name} sprite height`);
    assert.ok(sprite.every((row) => row.length === 16), `${name} sprite width`);
  }
  const rooftop = reachable('torre_teresitas_5', { x: 9, y: 12 });
  assert.equal(rooftop.adj(9, 6), true, 'la doña del bucio es alcanzable');
});

run('guardias: las cuatro escaleras exigen cuatro entrenadores distintos', () => {
  for (let floor = 1; floor <= 4; floor++) {
    const trainerId = `torre_enriscada_${floor}`;
    const trainer = TRAINERS[trainerId];
    assert.ok(trainer, `${trainerId} exists`);
    assert.equal(trainer.repeatable, undefined, 'encuentro obligatorio, no repetible');
    assert.ok(trainer.deck.length >= 18);
    for (const cardId of trainer.deck) assert.ok(CARDS[cardId], `${trainerId}: unknown ${cardId}`);
    loadPreset('torre', 'cabra');
    const reward = grantTrainerVictory(save, trainerId, () => 0.4);
    assert.ok(reward, `${trainerId} can be defeated`);
    assert.equal(trainerDefeated(save, trainerId), true);
    assert.equal(claimBoosterReward(save, 0, 'pc').ok, true);
  }
  const top = MAPS.torre_teresitas_5.triggers.filter((t) => t.action.type === 'towerStairs');
  assert.equal(top.length, 0, 'la quinta planta termina en la doña, no hay quinto guardia');
});

run('Perita y Cortar el Aire: las cuatro señoras comparten el mismo mazo fantasma repetible', () => {
  const ids = ['nina_peras_barranco', 'dona_petra_teresitas', 'dona_candelaria_teresitas', 'dona_remedios_teresitas'];
  const baseline = TRAINERS[ids[0]].deck;
  assert.equal(baseline.filter((id) => id === 'perita_barranco').length, 4);
  assert.equal(baseline.filter((id) => id === 'cortar_el_aire').length, 4);
  assert.equal(CARDS.perita_barranco.biome, 'fantasma');
  assert.equal(CARDS.cortar_el_aire.type, 'spell');
  assert.equal(CARDS.cortar_el_aire.name, 'Cortar el Aire');
  assert.deepEqual(CREATURES.perita_barranco?.length, 16);
  assert.ok(CREATURE_IDS.includes('perita_barranco'));
  for (const id of ids) {
    const lady = TRAINERS[id];
    assert.equal(lady.repeatable, true);
    assert.deepEqual(lady.deck, baseline, `${id} uses the same 4 Peritas + 4 spells deck`);
    assert.deepEqual(lady.biomes, ['fantasma']);
  }
  assert.ok(STORY.tower_bruja.some((line) => line.includes('Magomon')));
  assert.ok(STORY.tower_bruja.some((line) => line.includes('BUCIO')));
});

run('duelos fantasma: la niña de las peras y cada guardia terminan combate sin atascarse', () => {
  const opponents = [
    'nina_peras_barranco',
    'torre_enriscada_1',
    'torre_enriscada_2',
    'torre_enriscada_3',
    'torre_enriscada_4',
  ];
  for (const trainerId of opponents) {
    const deck = TRAINERS[trainerId].deck;
    let battle = createBattle({ name: 'TU', deck: TRAINERS.torre_enriscada_4.deck }, { name: trainerId, deck });
    for (let tick = 0; battle.winner === null && tick < 1500; tick++) battle = step(battle);
    assert.notEqual(battle.winner, null, `${trainerId} battle should finish`);
  }
  loadPreset('torre', 'angelote');
  const firstWin = grantTrainerVictory(save, 'nina_peras_barranco', () => 0.3);
  assert.ok(firstWin);
  assert.equal(claimBoosterReward(save, 0, 'pc').ok, true);
  assert.equal(trainerDefeated(save, 'nina_peras_barranco'), false, 'la señora acepta otra partida');
  assert.ok(grantTrainerVictory(save, 'nina_peras_barranco', () => 0.3));
});

run('bucio: los presets de entrada y azotea persisten llave, cuarto guardias y el regalo', () => {
  loadPreset('torre', 'cabra');
  assert.equal(save.flags.has_cazafantasmas, true);
  assert.equal(save.mapId, 'torre_teresitas_1');
  assert.equal(save.flags.has_bucio, undefined);
  loadPreset('torre_final', 'cabra');
  assert.equal(save.mapId, 'torre_teresitas_5');
  for (let floor = 1; floor <= 4; floor++) assert.equal(save.beaten[`torre_enriscada_${floor}`], 1);
  assert.equal(save.flags.has_cazafantasmas, true);
  assert.equal(save.flags.has_bucio, undefined, 'el bucio se recibe hablando con la doña');
  assert.equal(grantBucio(save), true);
  assert.equal(save.flags.has_bucio, true);
  assert.equal(grantBucio(save), false, 'la doña solo entrega un bucio');
});