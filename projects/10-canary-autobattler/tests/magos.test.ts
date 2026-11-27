import assert from 'node:assert/strict';
import { CARDS } from '../src/battle/cards';
import { copyRivalCard, createBattle, step } from '../src/battle/engine';
import { grantTrainerVictory, trainerDefeated } from '../src/game/rewards';
import { canOpenMagosDoor, MAGOS_KEYS, hasMagosKeys } from '../src/game/rosarioQuest';
import { useFotocopiadora } from '../src/game/firstEdition';
import { MAPS, type MapId } from '../src/game/maps';
import { MAGOS_DOOR, MAGOS_KEY_1, MAGOS_KEY_2, MAGOS_FLOORS } from '../src/game/mapsRosario';
import { loadPreset, save, npcState, exportSaveJSON, importSaveJSON } from '../src/game/save';
import { SOLID } from '../src/game/sprites';
import { STORY } from '../src/game/story';
import { TRAINERS } from '../src/game/trainers';

function reach(id: MapId, sx: number, sy: number) {
  const m = MAPS[id], seen = new Set([`${sx},${sy}`]), q: [number, number][] = [[sx, sy]];
  const blocked = new Set(m.npcs.map(npcState).filter(n => !n.hidden).map(n => `${n.x},${n.y}`));
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`, c = m.rows[ny]?.[nx];
      if (!c || seen.has(k) || blocked.has(k) || SOLID[m.legend[c]]) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return { has: (x: number, y: number) => seen.has(`${x},${y}`), adj: (x: number, y: number) => [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => seen.has(`${x+dx},${y+dy}`)) };
}

// 1. Entrada desde El Rosario (puerta) a PB y salida de PB al pueblo por la puerta sur.
const town = MAPS.el_rosario;
const toPb = town.triggers.find(t => t.kind === 'step' && t.action.type === 'warp' && t.action.to === 'magos_pb')!;
assert.ok(toPb, 'entrada a PB');
assert.equal(town.legend[town.rows[toPb.y][toPb.x]], 'door');
const pb = MAPS.magos_pb;
const pbExit = pb.triggers.find(t => t.kind === 'step' && t.action.type === 'warp' && t.action.to === 'el_rosario')!;
assert.ok(pbExit, 'salida de PB');
assert.ok(['floor', 'stairs'].includes(pb.legend[pb.rows[pbExit.y][pbExit.x]]));
assert.ok(['sidewalk', 'road'].includes(town.legend[town.rows[pbExit.action.y][pbExit.action.x]]));

// 2. Teletransportadores estilo Silph Co (múltiples pads por planta, cruces y retornos).
for (const [fid] of MAGOS_FLOORS) {
  const m = MAPS[fid];
  const pads = m.triggers.filter(t => t.kind === 'step' && t.action.type === 'warp');
  assert.ok(pads.length >= 2, `${fid} debe tener al menos 2 pads de teletransporte (tipo Silph Co)`);
  for (const t of pads) {
    const tile = m.legend[m.rows[t.y][t.x]];
    assert.ok(['teleport', 'stairs', 'floor'].includes(tile), `${fid} warp en ${t.x},${t.y} con tile ${tile}`);
    const dest = MAPS[t.action.to];
    assert.equal(SOLID[dest.legend[dest.rows[t.action.y][t.action.x]]], false, `${dest.id} aterrizaje libre`);
  }
}
console.log('ok - entrada transitable y teletransportadores cruzados estilo Silph Co');

// 3. 4 reclutas del Team Enriscada repartidos en las plantas P1..P4.
const enriscadaTrainers = ['enriscada_magos_1', 'enriscada_magos_2', 'enriscada_magos_3', 'enriscada_magos_4'];
for (let p = 1; p <= 4; p++) {
  const fid = `magos_${p}` as MapId;
  const tid = enriscadaTrainers[p - 1];
  const tr = TRAINERS[tid];
  assert.ok(tr, `${tid} existe`);
  assert.ok(tr.deck.length >= 18);
  const m = MAPS[fid];
  const grunt = m.npcs.find(n => n.trainer === tid);
  assert.ok(grunt, `recluta ${tid} en planta ${fid}`);
  assert.ok(reach(fid, p === 2 ? 16 : p === 4 ? 16 : 4, p === 2 ? 4 : p === 4 ? 5 : 5).adj(grunt.x, grunt.y), `grunt ${tid} alcanzable`);
  // Combate funcional
  loadPreset('magos_pb');
  let b = createBattle({ name: 'TU', deck: save.deck }, { name: tr.name, deck: tr.deck });
  for (let n = 0; b.winner === null && n < 800; n++) b = step(b);
  assert.notEqual(b.winner, null, `duelo ${tid} termina`);
}
console.log('ok - 4 combates contra el Team Enriscada en el recorrido de las plantas');

// 4. Llaves magnéticas 1 y 2 ocultas tras el laberinto de pads y puerta de la azotea.
loadPreset('magos_llave_1');
assert.deepEqual(save.magosKeys, [1]);
assert.ok(save.flags.magos_key_1 && !save.flags.magos_key_2);
loadPreset('magos_llave_2');
assert.deepEqual(save.magosKeys, [1, 2]);
assert.ok(canOpenMagosDoor(save.magosKeys));
assert.equal(canOpenMagosDoor([]), false);
assert.equal(canOpenMagosDoor([1]), false);

const roof = MAPS.magos_azotea;
assert.ok(roof.npcs.some(n => n.id === 'coco_ursula' && n.trainer === 'coco_santa_ursula'));
assert.ok(roof.npcs.some(n => n.id === 'ricardo_garcia'));
assert.ok(MAPS.guarida_enriscada.npcs.some(n => n.id === 'coco_ursula' && n.trainer === 'coco_santa_ursula'), 'El Coco SÍ está en el sótano del Meridiano');
console.log('ok - llaves magnéticas 1 y 2, puerta de la azotea cerrada sin ambas y Coco en la azotea');

// 5. Ricardo García cuenta su chiste / referencia a Richard Garfield.
assert.ok(STORY.magos_ricardo.some(l => l.includes('posavasos') || l.includes('matemática') || l.includes('Garfield')));
assert.ok(STORY.ricardo_chat.some(l => l.includes('posavasos')) && STORY.ricardo_chat.some(l => l.includes('Sengir')));
console.log('ok - Ricardo García habla de diseño de TCG, maná y vampiros de Sengir');

// 6. El Coco en la azotea: da la FOTOCOPIADORA (no el equipo cazafantasmas).
loadPreset('magos_azotea');
assert.equal(save.flags.has_fotocopiadora, undefined);
const cocoWin = grantTrainerVictory(save, 'coco_santa_ursula');
assert.ok(cocoWin);
assert.equal(save.flags.coco_beaten, true);
assert.equal(save.flags.has_fotocopiadora, true, 'da la fotocopiadora');
assert.equal(save.flags.coco_ricardo_rescued, true);

// 7. Fotocopiadora en combate: copia carta rival a la mano e interrumpe autobattle (un solo uso).
loadPreset('magos_azotea', 'cabra');
save.flags.has_fotocopiadora = true;
delete save.flags.used_fotocopiadora;
let duel = createBattle({ name: 'TU', deck: save.deck }, { name: 'EL COCO', deck: TRAINERS.coco_santa_ursula.deck });
const foeCreature = TRAINERS.coco_santa_ursula.deck.find(id => CARDS[id].type === 'creature')!;
const handLen = duel.players[0].hand.length;
duel = copyRivalCard(duel, foeCreature);
assert.equal(duel.players[0].hand.length, handLen < 7 ? handLen + 1 : handLen);
assert.ok(duel.players[0].hand.some(c => c.id === foeCreature) || duel.players[0].deck.some(c => c.id === foeCreature));
assert.match(duel.lastEvent, /FOTOCOPIADORA/);
assert.equal(useFotocopiadora(save).ok, true);
assert.equal(useFotocopiadora(save).ok, false, 'un solo uso');
console.log('ok - la fotocopiadora actúa en duelo copiando carta rival y se gasta');
