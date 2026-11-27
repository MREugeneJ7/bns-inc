import assert from 'node:assert/strict';
import { canAddToDeck, countOwned, doCombine } from '../src/battle/booster';
import { CARDS, CREATURE_IDS, EVO_CHAINS, EVO_NEXT, creaturesInBiomes } from '../src/battle/cards';
import { copyRivalCard, createBattle, step } from '../src/battle/engine';
import { MAPS, type MapId } from '../src/game/maps';
import { PARKING_GATE, BERSHKA_POSTER, BERSHKA_ESCALATOR } from '../src/game/mapsRuta';
import {
  claimFirstEdition, grantMagomaniacoVictory, MAGOMANIACO_OFFER,
  toggleTodoTerreno, useFotocopiadora, redeemMeridianoPrize, MERIDIANO_PRIZES,
} from '../src/game/firstEdition';
import { claimBoosterReward, grantTrainerVictory } from '../src/game/rewards';
import { COCO_URSULA, GATO_NPC, MAGOMANIACO_SPR, JARDINERO } from '../src/game/props';
import { loadPreset, save, type PresetId } from '../src/game/save';
import { SOLID, DRIVABLE_TILES } from '../src/game/sprites';
import { TRAINERS } from '../src/game/trainers';
import { CREATURES } from '../src/game/creatureArt';

type Pt = { x: number; y: number };

function run(name: string, test: () => void) {
  test();
  console.log(`ok - ${name}`);
}

/** BFS exacto con las mismas reglas de GameCanvas: el 4x4 SOLO pisa DRIVABLE_TILES + PARKING_GATE. */
function bfs(mapId: MapId, from: Pt, car: boolean, hideBershkaGrunt = false) {
  const m = MAPS[mapId];
  const h = m.rows.length;
  const w = m.rows[0].length;
  const npcs = new Set(
    m.npcs
      .filter((n) => !n.hidden && !(hideBershkaGrunt && n.id === 'enriscada_bershka'))
      .map((n) => `${n.x},${n.y}`),
  );
  const isGate = (x: number, y: number) =>
    mapId === 'santacruz_sur' && PARKING_GATE.some((p) => p.x === x && p.y === y);
  const blocked = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return true;
    const t = m.legend[m.rows[y][x]];
    if (car) {
      if (!DRIVABLE_TILES.has(t) && !isGate(x, y)) return true;
      return npcs.has(`${x},${y}`);
    }
    if (SOLID[t]) return true;
    return npcs.has(`${x},${y}`);
  };
  assert.equal(blocked(from.x, from.y), false, `${mapId} origen (${from.x},${from.y}) bloqueado (car=${car})`);
  const seen = new Set([`${from.x},${from.y}`]);
  const queue: Pt[] = [from];
  while (queue.length) {
    const p = queue.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = p.x + dx, ny = p.y + dy, k = `${nx},${ny}`;
      if (!seen.has(k) && !blocked(nx, ny)) {
        seen.add(k);
        queue.push({ x: nx, y: ny });
      }
    }
  }
  const has = (x: number, y: number) => seen.has(`${x},${y}`);
  const adj = (x: number, y: number) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => has(x + dx, y + dy));
  return { has, adj, seen };
}

const tile = (mapId: MapId, x: number, y: number) => MAPS[mapId].legend[MAPS[mapId].rows[y][x]];

run('mapas nuevos y sprites 16x16: geometria y leyendas 100% validas', () => {
  for (const id of ['carretera_noche', 'san_andres', 'santacruz_sur', 'meridiano', 'guarida_enriscada'] as MapId[]) {
    const m = MAPS[id];
    const w = m.rows[0].length;
    for (const r of m.rows) {
      assert.equal(r.length, w, `${id} ancho uniforme`);
      for (const ch of r) assert.ok(m.legend[ch], `${id}: caracter sin leyenda '${ch}'`);
    }
  }
  for (const [name, spr] of Object.entries({ COCO_URSULA, GATO_NPC, MAGOMANIACO_SPR, JARDINERO })) {
    assert.equal(spr.length, 16, `${name} alto 16`);
    assert.deepEqual([...new Set(spr.map((r) => r.length))], [16], `${name} ancho 16`);
  }
});

run('todoterreno estricto: SOLO asfalto/parking/baches, NUNCA playa, acera, plaza, cesped ni interiores', () => {
  loadPreset('carretera', 'cabra');
  save.flags.car_out = false;
  // Prohibido spawnear en playa, acera, plaza, cesped o interior
  for (const bad of ['blacksand', 'sidewalk', 'plaza', 'grass', 'path', 'stairs', 'floor', 'court'] as const) {
    assert.deepEqual(toggleTodoTerreno(save, bad, false), { ok: false, reason: 'offroad' });
    assert.equal(save.flags.car_out, false);
  }
  assert.deepEqual(toggleTodoTerreno(save, 'road', true), { ok: false, reason: 'indoor' });
  // Permitido sobre carretera o parking
  assert.deepEqual(toggleTodoTerreno(save, 'road', false), { ok: true, carOut: true });
  assert.deepEqual(toggleTodoTerreno(save, 'pothole', false), { ok: false, reason: 'hazard' });
  assert.deepEqual(toggleTodoTerreno(save, 'parking', false), { ok: true, carOut: false });

  // Ruta continua 100% asfalto desde la carretera de Benijo hasta el parking del Palmetum
  const anCar = bfs('anaga', { x: 71, y: 9 }, true);
  assert.equal(anCar.has(33, 21), true, 'Benijo -> TF-134 por puro asfalto');
  assert.equal(anCar.has(71, 5), false, 'el coche NO pisa la playa de Benijo');
  assert.equal(anCar.has(60, 5), false, 'el coche NO pisa la playa de Almaciga');
  assert.equal(anCar.has(44, 7), false, 'el coche NO pisa la plaza peatonal de Taganana');

  const anFoot = bfs('anaga', { x: 44, y: 10 }, false);
  assert.equal(anFoot.has(33, 21), false, 'a pie no se cruzan los baches de TF-134');

  const cnCar = bfs('carretera_noche', { x: 15, y: 1 }, true);
  assert.equal(cnCar.has(15, 33), true, 'TF-134 nocturna conectada de norte a sur en 4x4');
  const cnFoot = bfs('carretera_noche', { x: 15, y: 1 }, false);
  assert.equal(cnFoot.has(15, 33), false, 'TF-134 bloqueada a pie por zanjas');

  const saCar = bfs('san_andres', { x: 15, y: 1 }, true);
  assert.equal(saCar.has(0, 12), true, 'San Andres conectado hasta salida oeste Av. Anaga');
  assert.equal(saCar.has(10, 15), false, 'el coche NO pisa la arena de San Andres');
  assert.equal(saCar.has(9, 9), false, 'el coche NO se sube a la plaza de San Andres');
});

run('geografia correcta: mar al SUR, Teresitas al ESTE, Av. Anaga de ESTE a OESTE y sin warp a Weyler/Taco', () => {
  // Mar en el borde SUR (ultima fila), jamas en el borde NORTE (fila 0)
  for (const id of ['san_andres', 'santacruz_sur'] as MapId[]) {
    const m = MAPS[id];
    const lastRow = m.rows.length - 1;
    assert.equal(tile(id, 10, lastRow), 'sea', `${id} tiene mar al sur`);
    assert.notEqual(tile(id, 10, 0), 'sea', `${id} NO tiene mar al norte`);
  }
  // Cementerio de Las Teresitas al este de San Andres, cerrado
  const saFoot = bfs('san_andres', { x: 15, y: 1 }, false);
  assert.equal(saFoot.adj(22, 10), true, 'cartel del Cementerio de Las Teresitas al este alcanzable');
  assert.equal(saFoot.has(26, 10), false, 'Torre Encantada cerrada');

  // Salida oeste de San Andres entra por el ESTE de santacruz_sur mirando al OESTE
  const toAnaga = MAPS.san_andres.triggers.find((t) => t.x === 0 && t.y === 12)?.action;
  assert.ok(toAnaga && toAnaga.type === 'warp' && toAnaga.to === 'santacruz_sur');
  assert.equal(toAnaga.x, 66);
  assert.equal(toAnaga.dir, 'left');
  assert.equal(tile('santacruz_sur', toAnaga.x, toAnaga.y), 'road');

  // Cero warps entre santacruz_sur y calle (ni Taco ni Weyler)
  assert.equal(
    MAPS.santacruz_sur.triggers.some((t) => t.action.type === 'warp' && t.action.to === 'calle'),
    false,
    'Av. Anaga no hace warp a calle/Taco/Weyler',
  );
  assert.equal(
    MAPS.calle.triggers.some((t) => t.action.type === 'warp' && t.action.to === 'santacruz_sur'),
    false,
    'calle no tiene warp fantasma a santacruz_sur',
  );
});

run('Palmetum (Gym #4 Tipo Planta): requiere 4x4 por el parking reventado y entrega Boliche #4', () => {
  const scFoot = bfs('santacruz_sur', { x: 66, y: 9 }, false);
  assert.equal(scFoot.has(20, 15), false, 'a pie no se entra al parking del Palmetum');
  assert.equal(scFoot.adj(33, 15), false, 'a pie desde la calle no se llega al lider Jonay');
  assert.equal(scFoot.has(32, 6), true, 'a pie si se entra al C.C. Meridiano');
  assert.equal(scFoot.has(56, 6), true, 'a pie si se entra al C.P. El Muelle');

  const scCar = bfs('santacruz_sur', { x: 66, y: 9 }, true);
  assert.equal(scCar.has(20, 15), true, 'el 4x4 entra al parking del Palmetum');
  assert.equal(scCar.has(25, 15), false, 'el 4x4 NO se mete al jardin botanico');
  assert.equal(scCar.has(32, 6), false, 'el 4x4 NO entra al C.C. Meridiano');

  // Tras aparcar en (20,15) y bajarse a pie, se llega a Yurena y a Jonay (Gym #4)
  const gardenFoot = bfs('santacruz_sur', { x: 20, y: 15 }, false);
  assert.equal(gardenFoot.adj(28, 14), true, 'botanica Yurena alcanzable');
  assert.equal(gardenFoot.adj(33, 15), true, 'lider Jonay (Gym #4 Planta) alcanzable');

  loadPreset('palmetum', 'cabra');
  const reward = grantTrainerVictory(save, 'gym_palmetum');
  assert.ok(reward && reward.gym === 4);
  assert.equal(save.flags.boliche_4, true);
  assert.equal(claimBoosterReward(save, 0, 'pc').ok, true);
});

run('C.C. Meridiano (casino fast-fashion + cartel Bershka) y Guarida Enriscada (El Coco de Santa Ursula)', () => {
  // Antes del Gym #4: el recluta del Team Enriscada tapa el cartel de Bershka
  const mallBefore = bfs('meridiano', { x: 11, y: 14 }, false, false);
  assert.equal(mallBefore.adj(12, 2), true, 'recluta de Bershka alcanzable antes del Gym #4');
  assert.equal(mallBefore.adj(3, 3), true, 'tragaperras Primark alcanzable');
  assert.equal(mallBefore.adj(18, 3), true, 'tragaperras Zara VIP alcanzable');
  assert.equal(mallBefore.adj(3, 8), true, 'tragaperras Pull&Bear alcanzable');
  assert.equal(mallBefore.adj(18, 8), true, 'tragaperras Stradivarius alcanzable');
  assert.equal(mallBefore.adj(19, 12), true, 'mostrador de canje alcanzable');

  // Despues del Gym #4: el recluta desaparece y puedes husmear el cartel y bajar las escaleras mecanicas
  const mallAfter = bfs('meridiano', { x: 11, y: 14 }, false, true);
  assert.equal(mallAfter.adj(BERSHKA_POSTER.x, BERSHKA_POSTER.y), true, 'cartel raro de Bershka accesible');
  assert.equal(mallAfter.has(BERSHKA_ESCALATOR.x, BERSHKA_ESCALATOR.y), true, 'escaleras mecanicas accesibles');

  // Canje de premios en Meridiano
  loadPreset('meridiano', 'angelote');
  const durosBefore = save.duros;
  const prize = redeemMeridianoPrize(save, 0);
  assert.ok(prize.ok && prize.cardId === MERIDIANO_PRIZES[0].cardId);
  assert.equal(save.duros, durosBefore - MERIDIANO_PRIZES[0].cost);

  // Guarida Enriscada: recorrido completo hasta El Coco de Santa Ursula y Don Michi
  const hideout = bfs('guarida_enriscada', { x: 3, y: 3 }, false);
  assert.equal(hideout.adj(9, 4), true, 'recluta Kevin alcanzable');
  assert.equal(hideout.adj(14, 9), true, 'consigliere Toni alcanzable');
  assert.equal(hideout.adj(5, 15), true, 'Don Michi alcanzable');
  assert.equal(hideout.adj(7, 15), true, 'El Coco está en el sótano del Meridiano');

  // Linea evolutiva de gatos callejeros + combate real contra El Coco + recompensas
  assert.deepEqual(EVO_CHAINS.gato, ['michino', 'gato_callejero', 'gato_azotea', 'don_michi']);
  for (const cid of [...EVO_CHAINS.gato, ...EVO_CHAINS.tunera]) {
    assert.ok(CARDS[cid] && CREATURES[cid], `${cid} tiene carta y pixel art`);
  }
  const catState = { deck: [], pc: Array<string>(5).fill('gato_callejero'), shine: {} };
  const evo = doCombine(catState, 'gato_callejero');
  assert.ok(evo && evo.newId === 'gato_azotea');

  loadPreset('guarida', 'pinzon');
  let battle = createBattle({ name: 'TU', deck: save.deck }, { name: 'EL COCO', deck: TRAINERS.coco_santa_ursula.deck });
  for (let i = 0; battle.winner === null && i < 1000; i++) battle = step(battle);
  assert.notEqual(battle.winner, null, 'el duelo contra El Coco termina limpiamente');

  const cocoWin = grantTrainerVictory(save, 'coco_santa_ursula');
  assert.ok(cocoWin);
  // En el sótano del Meridiano da el equipo cazafantasmas, NO la fotocopiadora
  assert.equal(save.flags.coco_meridiano_beaten, true, 'Coco derrotado en Meridiano');
  assert.equal(save.flags.has_cazafantasmas, true, 'equipo cazafantasmas del Coco en Meridiano');
  assert.equal(save.flags.has_fotocopiadora, undefined, 'la fotocopiadora NO está en Meridiano');
  assert.equal(save.flags.coco_beaten, undefined, 'coco_beaten solo se activa en Magos');
  assert.equal(claimBoosterReward(save, 0, 'pc').ok, true);
  loadPreset('guarida', 'pinzon');
  delete save.flags.has_cazafantasmas;
  const machine = grantTrainerVictory(save, 'coco_santa_ursula');
  assert.ok(machine);
  const rivalBattle = createBattle({ name: 'TU', deck: save.deck }, { name: 'EL COCO', deck: TRAINERS.coco_santa_ursula.deck });
  const copy = copyRivalCard(rivalBattle, TRAINERS.coco_santa_ursula.deck.find(id => CARDS[id].type === 'creature')!);
  assert.ok(copy.players[0].hand.length >= rivalBattle.players[0].hand.length);

  // Fotocopiadora: un solo uso, se gasta en combate
  save.flags.has_fotocopiadora = true; // se obtiene en Magos de la Costa, no en Meridiano
  const copy1 = useFotocopiadora(save);
  assert.ok(copy1.ok);
  assert.equal(save.flags.used_fotocopiadora, true);
  const copy2 = useFotocopiadora(save);
  assert.equal(copy2.ok, false, 'la fotocopiadora es de un solo uso');
});

run('Magomaniaco unificado + cartas 1ª edicion (Burgado y Cangrejo) + los 16 presets validos', () => {
  assert.equal(MAPS.anaga.npcs.some((n) => n.id === 'notas'), false, 'sin NPC notas separado');
  assert.ok(MAPS.anaga.npcs.some((n) => n.id === 'magomaniaco' && n.x === 39 && n.y === 46));
  assert.equal(tile('anaga', 38, 46), 'fogon', 'fogon con cenizas junto al Magomaniaco');
  // Comprobar con BFS real que es 100% IMPOSIBLE colarse a Taganana sin vencer al Magomaniaco
  const gates = new Set(
    MAPS.anaga.triggers
      .filter((t) => t.kind === 'step' && t.action.type === 'gate' && t.action.key === 'magomaniaco_done')
      .map((t) => `${t.x},${t.y}`),
  );
  const visited = new Set(['9,64']);
  const q: Pt[] = [{ x: 9, y: 64 }];
  while (q.length) {
    const p = q.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = p.x + dx, ny = p.y + dy, k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || ny >= MAPS.anaga.rows.length || nx >= MAPS.anaga.rows[0].length) continue;
      if (visited.has(k) || gates.has(k) || SOLID[tile('anaga', nx, ny)]) continue;
      visited.add(k);
      q.push({ x: nx, y: ny });
    }
  }
  assert.equal(visited.has('39,47'), true, 'se llega justo delante del Magomaniaco');
  assert.equal(visited.has('44,10'), false, 'IMPOSIBLE pasar a Taganana sin vencer al Magomaniaco');

  loadPreset('magomaniaco', 'cabra');
  assert.equal(grantMagomaniacoVictory(save), true);
  assert.equal(claimFirstEdition(save, 1).ok, true);
  assert.ok(save.pc.includes('cangrejo_1ed'));
  assert.equal(claimFirstEdition(save, 0).ok, false);
  assert.ok(canAddToDeck(save, 'cangrejo_1ed')?.includes('Gomera'));
  assert.equal(EVO_NEXT.burgado_1ed, 'burgado_gigante_1ed');
  assert.equal(EVO_NEXT.cangrejo_1ed, 'cangrejo_sierra_1ed');
  for (const id of ['burgado_1ed', 'burgado_gigante_1ed', 'cangrejo_1ed', 'cangrejo_sierra_1ed']) {
    assert.ok(CREATURES[id], `${id} con arte propio`);
    assert.equal(CREATURE_IDS.includes(id), false);
  }
  for (const b of ['mar', 'risco', 'pinar', 'ofra'] as const) {
    assert.equal(creaturesInBiomes([b]).some((id) => !!CARDS[id].firstEdition), false);
  }

  // Todos los presets caen en casilla valida, y si traen car_out estan sobre asfalto real
  const allPresets: PresetId[] = [
    'inicio', 'hospital', 'recado', 'capitulo1', 'weyler', 'ull', 'sanbenito',
    'magomaniaco', 'taganana', 'benijo', 'galdar', 'cuevas',
    'carretera', 'sanandres', 'palmetum', 'meridiano', 'guarida',
    'torre', 'torre_final', 'tf1', 'aeropuerto', 'romeria', 'americas', 'siam', 'noche', 'papagayos',
  ];
  for (const pid of allPresets) {
    loadPreset(pid, 'cabra');
    const t = tile(save.mapId, save.playerPos.x, save.playerPos.y);
    assert.equal(SOLID[t], false, `preset ${pid} caminable (${save.mapId} ${save.playerPos.x},${save.playerPos.y} = ${t})`);
    if (save.flags.car_out) {
      assert.equal(DRIVABLE_TILES.has(t), true, `preset ${pid} con 4x4 esta sobre asfalto (${t})`);
    }
  }
});
