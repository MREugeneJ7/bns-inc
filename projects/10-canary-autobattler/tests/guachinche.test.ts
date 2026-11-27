import assert from 'node:assert/strict';
import { CARDS, type LandColor } from '../src/battle/cards';
import { createBattle, step } from '../src/battle/engine';
import { MAPS, type Action, type MapId, type Trigger } from '../src/game/maps';
import { cocoEncounter } from '../src/game/rosarioQuest';
import { claimBoosterReward, grantTrainerVictory, trainerDefeated } from '../src/game/rewards';
import { loadPreset, save, npcState } from '../src/game/save';
import { SOLID } from '../src/game/sprites';
import { STORY } from '../src/game/story';
import { TRAINERS } from '../src/game/trainers';

function run(name: string, test: () => void) {
  test();
  console.log(`ok - ${name}`);
}
type Warp = Extract<Action, { type: 'warp' }>;
const warpOf = (t: Trigger): Warp | null => (t.action.type === 'warp' ? t.action : null);
const toMap = (t: Trigger, mapId: MapId) => { const w = warpOf(t); return w && w.to === mapId ? w : null; };

const GW = 18, GH = 13;
const room = (x: number, y: number) => `${Math.floor(x / GW)},${Math.floor(y / GH)}`;

run('guachinche: nueve salas en una sola planta con paredes entre salas', () => {
  const m = MAPS.guachinche_rosario;
  assert.equal(m.rows.length, GH * 3);
  assert.equal(m.rows[0].length, GW * 3);
  for (const r of m.rows) for (const ch of r) assert.ok(m.legend[ch]);
  for (const x of [0, 17, 35, 53]) for (let y = 0; y < m.rows.length; y++) assert.equal(m.legend[m.rows[y][x]], 'wall', `muro vertical ${x}`);
  for (const y of [0, 12, 25, 38]) for (let x = 0; x < m.rows[0].length; x++) assert.equal(m.legend[m.rows[y][x]], 'wall', `muro horizontal ${y}`);
  const rooms = new Set<string>();
  for (let y = 1; y < m.rows.length; y++) for (let x = 1; x < m.rows[0].length; x++) {
    if (!SOLID[m.legend[m.rows[y][x]]]) rooms.add(room(x, y));
  }
  assert.equal(rooms.size, 9, 'exactamente nueve salas caminables');
  assert.ok(rooms.has('1,0'), 'la sala central superior existe');
});

run('guachinche: las placas saltan de una sala a otra sin subir de planta', () => {
  const m = MAPS.guachinche_rosario;
  const pads = m.triggers.filter(t => t.action.type === 'warp' && t.action.type && toMap(t, 'guachinche_rosario'));
  assert.ok(pads.length >= 15, `una placa por sala, hay ${pads.length}`);
  for (const pad of pads) {
    const a = warpOf(pad)!;
    assert.equal(m.legend[m.rows[pad.y][pad.x]], 'teleport');
    assert.notEqual(room(pad.x, pad.y), room(a.x, a.y), 'una placa siempre salta a otra sala');
    assert.equal(SOLID[m.legend[m.rows[a.y][a.x]]], false, 'aterrizaje libre');
    assert.ok(!m.triggers.some(t => t.x === a.x && t.y === a.y && t.action.type === 'warp'), 'nunca aterriza sobre otra placa');
  }
  // La llegada desde el pueblo y la puerta de vuelta.
  const fromTown = warpOf(MAPS.el_rosario.triggers.find(t => toMap(t, 'guachinche_rosario'))!)!;
  const toTown = m.triggers.find(t => toMap(t, 'el_rosario'));
  assert.ok(toTown, 'hay puerta de salida al pueblo');
  // BFS con teletransporte: desde la llegada se recorren las nueve salas.
  const blockedNpc = new Set(m.npcs.map(npcState).filter(n => !n.hidden).map(n => `${n.x},${n.y}`));
  const seen = new Set([`${fromTown.x},${fromTown.y}`]);
  const q: [number, number][] = [[fromTown.x, fromTown.y]];
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    const here = m.triggers.find(t => t.kind === 'step' && t.x === x && t.y === y && toMap(t, 'guachinche_rosario'));
    if (here) {
      const a = warpOf(here)!;
      if (!seen.has(`${a.x},${a.y}`)) { seen.add(`${a.x},${a.y}`); q.push([a.x, a.y]); }
      continue;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (seen.has(k) || blockedNpc.has(k)) continue;
      const c = m.rows[ny]?.[nx];
      if (!c || SOLID[m.legend[c]]) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  const visitedRooms = new Set([...seen].map(k => { const [x, y] = k.split(',').map(Number); return room(x, y); }));
  assert.equal(visitedRooms.size, 9, 'el recorrido por placas alcanza las nueve salas');
  assert.ok(visitedRooms.has('1,0'), 'se llega a la sala central superior');
  assert.ok(seen.has(`${fromTown.x},${fromTown.y + 1}`) || seen.has(`${fromTown.x + 1},${fromTown.y}`), 'la puerta de salida es alcanzable desde el aterrizaje');
  const leader = m.npcs.find(n => n.trainer === 'guachinche_rosario')!;
  assert.ok(leader && room(leader.x, leader.y) === '1,0', 'el líder está en la sala central superior');
  assert.ok([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(`${leader.x + dx},${leader.y + dy}`)), 'se puede hablar con el líder');
  const escape = m.triggers.find(t => t.kind === 'step' && toMap(t, 'guachinche_rosario')
    && room(t.x, t.y) === room(leader.x, leader.y)
    && room(warpOf(t)!.x, warpOf(t)!.y) === room(fromTown.x, fromTown.y));
  assert.ok(escape, 'hay una placa de salida de la sala del líder a la entrada');
});

run('guachinche: el acceso desde El Rosario y la vuelta son transitables', () => {
  const town = MAPS.el_rosario;
  const entry = town.triggers.find(t => toMap(t, 'guachinche_rosario'));
  assert.ok(entry);
  const entryWarp = warpOf(entry)!;
  assert.equal(town.legend[town.rows[entry.y][entry.x]], 'door');
  const m = MAPS.guachinche_rosario;
  const exit = m.triggers.find(t => toMap(t, 'el_rosario'))!;
  const exitWarp = warpOf(exit)!;
  assert.equal(m.legend[m.rows[exit.y][exit.x]], 'door');
  assert.equal(town.legend[town.rows[exitWarp.y][exitWarp.x]], 'plaza');
  const seen = new Set(['2,9']);
  const q: [number, number][] = [[2, 9]];
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (seen.has(k)) continue;
      const c = town.rows[ny]?.[nx];
      if (!c || SOLID[town.legend[c]] || town.npcs.some(n => !n.hidden && n.x === nx && n.y === ny)) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  assert.ok(seen.has(`${entry.x},${entry.y + 1}`), 'se puede llegar a la puerta del guachinche a pie');
});

run('guachinche: doña Sabina es el gym #6 y da su boliche con el sobre', () => {
  const t = TRAINERS.guachinche_rosario;
  assert.ok(t);
  assert.equal(t.gym, 6);
  assert.equal(t.bolicheName, 'Boliche de la Mesa del Fondo');
  assert.equal(t.repeatable, undefined);
  const colors = new Set<LandColor>();
  for (const id of t.deck) {
    const card = CARDS[id];
    assert.ok(card, `carta válida ${id}`);
    if (card.type === 'land') colors.add(card.produces!);
  }
  for (const id of t.deck) for (const k of ['R', 'U', 'G', 'W', 'B'] as const) {
    if (CARDS[id].mana?.[k]) assert.ok(colors.has(k), `${id} paga ${k}`);
  }
  loadPreset('guachinche_rosario', 'cabra');
  assert.equal(save.mapId, 'guachinche_rosario');
  assert.deepEqual(save.playerPos, { x: 27, y: 36, dir: 'up' });
  assert.ok(save.flags.rosario_open, 'el checkpoint conserva el paso de las obras');
  for (let i = 0; i < 12; i++) {
    let b = createBattle({ name: 'TU', deck: save.deck }, { name: t.name, deck: t.deck });
    for (let n = 0; b.winner === null && n < 1000; n++) b = step(b);
    assert.notEqual(b.winner, null, 'el duelo termina');
  }
  const boliches = Object.keys(save.flags).filter(k => k.startsWith('boliche_')).length;
  const reward = grantTrainerVictory(save, 'guachinche_rosario');
  assert.ok(reward && reward.purse === 45);
  assert.equal(save.flags.guachinche_rosario_beaten, true);
  assert.equal(save.flags.boliche_6, true, 'otorga el sexto boliche');
  assert.equal(Object.keys(save.flags).filter(k => k.startsWith('boliche_')).length, boliches + 1, 'un solo boliche nuevo');
  assert.ok(claimBoosterReward(save, 0, 'pc').ok);
  assert.equal(trainerDefeated(save, 'guachinche_rosario'), true);
  assert.equal(grantTrainerVictory(save, 'guachinche_rosario'), null, 'no es repetible');
});

run('diálogos contextuales: Coco y Ricardo nunca repiten el mismo texto', () => {
  assert.equal(cocoEncounter('guarida_enriscada', {}), 'first');
  assert.equal(cocoEncounter('guarida_enriscada', { coco_meridiano_seen: true }), 'retry');
  assert.equal(cocoEncounter('guarida_enriscada', { coco_meridiano_beaten: true }), null);
  assert.equal(cocoEncounter('magos_azotea', {}), 'first');
  assert.equal(cocoEncounter('magos_azotea', { coco_magos_seen: true }), 'retry');
  assert.equal(cocoEncounter('magos_azotea', { coco_beaten: true }), null);
  assert.equal(cocoEncounter('meridiano', {}), null);
  const coco = [STORY.coco_meridiano_first, STORY.coco_meridiano_again, STORY.coco_magos_first, STORY.coco_magos_again];
  assert.equal(new Set(coco.map(x => x.join('|'))).size, 4, 'los cuatro encuentros del Coco son distintos');
  const ricardo = [STORY.magos_ricardo, STORY.ricardo_waiting, STORY.ricardo_chat];
  assert.equal(new Set(ricardo.map(x => x.join('|'))).size, 3, 'Ricardo tiene texto distinto en cada momento');
  assert.notEqual(STORY.magos_door_after.join('|'), STORY.magos_coco_after.join('|'));
  assert.ok(!STORY.magos_door_after.join('|').includes('FOTOCOPIADORA'), 'la puerta no repite el discurso de la máquina');
});
