import assert from 'node:assert/strict';
import { CARDS, MAX_COPIES, MAX_DECK, type LandColor } from '../src/battle/cards';
import { combineReady, countOwned, doCombine, statsOf } from '../src/battle/booster';
import { createBattle, step } from '../src/battle/engine';
import { claimBoosterReward, grantTrainerVictory, settleTrainerLoss, trainerDefeated } from '../src/game/rewards';
import { blackoutToNearestCenter, exportSaveJSON, importSaveJSON, loadPreset, save, type SaveState } from '../src/game/save';
import { TRAINERS } from '../src/game/trainers';
import {
  MAPS, SCHOOLS, PARRANDEROS, TRUCK_POS, CAYUCO_POS, GALDAR_CAYUCO_POS, OLSEN_POS, CUEVA_DOOR,
  CUEVA_COLS, CUEVA_ROWS, cuevaTableIndex, adjacentCuevaTables, DIALOGUE, type MapId,
} from '../src/game/maps';
import { SOLID } from '../src/game/sprites';
import { PEDRO, CANARION, CAPITAN, MARINERO, CATHAYSA, CATHAYSA_SURF, drawCayucoFeverDream } from '../src/game/props';

function freshState(): SaveState {
  loadPreset('capitulo1', 'cabra');
  const state = JSON.parse(exportSaveJSON()) as SaveState;
  state.duros = 0;
  state.beaten = {};
  state.sobres = 0;
  state.pendingBooster = null;
  return state;
}

function offer(state: SaveState, first: string) {
  state.pendingBooster = {
    trainerId: 'chacho_portal', trainerName: 'RAYCO', purse: 5,
    cards: [first, 'lagarto', 'chola', 'tierra_playa', 'pinzon'],
  };
}

function run(name: string, test: () => void) {
  test();
  console.log(`ok - ${name}`);
}

run('una victoria por entrenador; derrota y cero duros permiten volver a intentarlo', () => {
  const state = freshState();
  assert.equal(settleTrainerLoss(state, 'chacho_portal', 5), 0);
  assert.equal(state.duros, 0);
  assert.equal(trainerDefeated(state, 'chacho_portal'), false);

  const reward = grantTrainerVictory(state, 'chacho_portal', () => 0.45);
  assert.ok(reward);
  assert.equal(state.duros, 5);
  assert.equal(state.beaten.chacho_portal, 1);
  assert.equal(state.sobres, 1);
  assert.equal(reward.cards.length, 5);
  assert.equal(trainerDefeated(state, 'chacho_portal'), true);
  const before = JSON.stringify(state);
  assert.equal(grantTrainerVictory(state, 'chacho_portal'), null);
  assert.equal(JSON.stringify(state), before);
  assert.equal(settleTrainerLoss(state, 'chacho_portal', 5), null);

  const cardCount = state.deck.length + state.pc.length;
  assert.equal(claimBoosterReward(state, 0, 'pc').ok, true);
  assert.equal(state.deck.length + state.pc.length, cardCount + 1);
  assert.equal(state.pendingBooster, null);
  const afterClaim = JSON.stringify(state);
  assert.equal(claimBoosterReward(state, 1, 'pc').ok, false);
  assert.equal(grantTrainerVictory(state, 'chacho_portal'), null);
  assert.equal(JSON.stringify(state), afterClaim);
});

run('una derrota con saldo parcial descuenta solo lo disponible y no da recompensas', () => {
  const state = freshState();
  state.duros = 2;
  assert.equal(settleTrainerLoss(state, 'chacho_portal', 5), 2);
  assert.equal(state.duros, 0);
  assert.equal(state.sobres, 0);
  assert.equal(trainerDefeated(state, 'chacho_portal'), false);
  assert.ok(grantTrainerVictory(state, 'chacho_portal', () => 0.3));
  assert.equal(state.duros, 5);
});

run('un sobre entrega una sola carta, incluso si se intenta reclamar otra', () => {
  const state = freshState();
  offer(state, 'cabra');
  const beforeDeck = state.deck.length;
  const beforePC = state.pc.length;
  assert.equal(claimBoosterReward(state, 6, 'deck').ok, false);
  assert.ok(state.pendingBooster);
  assert.equal(claimBoosterReward(state, 0, 'deck').ok, true);
  assert.equal(state.deck.length, beforeDeck + 1);
  assert.equal(state.pc.length, beforePC);
  assert.equal(claimBoosterReward(state, 1, 'pc').ok, false);
  assert.equal(state.deck.length + state.pc.length, beforeDeck + beforePC + 1);
});

run('quinta copia: opcion de PC sin evolucion automatica', () => {
  const state = freshState();
  state.deck = ['baifo', 'baifo', 'baifo', 'baifo'];
  state.pc = [];
  offer(state, 'baifo');
  assert.equal(claimBoosterReward(state, 0, 'deck').ok, false);
  assert.ok(state.pendingBooster);
  assert.equal(claimBoosterReward(state, 0, 'pc').ok, true);
  assert.equal(countOwned(state, 'baifo'), 5);
  assert.equal(countOwned(state, 'cabra'), 0);
  assert.deepEqual(combineReady(state), ['baifo']);
});

run('quinta copia: evolucion directa con el mazo lleno', () => {
  const state = freshState();
  state.deck = [...Array<string>(56).fill('tierra_volcan'), ...Array<string>(4).fill('baifo')];
  state.pc = [];
  offer(state, 'baifo');
  const result = claimBoosterReward(state, 0, 'evolve');
  assert.ok(result.ok && result.combination);
  assert.equal(result.combination.removedFromDeck, 4);
  assert.equal(result.combination.removedFromPC, 0);
  assert.equal(result.combination.newId, 'cabra');
  assert.equal(result.destination, 'deck');
  assert.equal(state.deck.length, 57);
  assert.equal(countOwned(state, 'baifo'), 0);
  assert.equal(countOwned(state, 'cabra'), 1);
  assert.equal(state.flags.seen_cabra, true);
  assert.equal(state.pendingBooster, null);
});

run('cuatro copias repartidas entre mazo y PC cuentan para evolucionar', () => {
  const state = freshState();
  state.deck = ['baifo', 'baifo', 'tierra_volcan'];
  state.pc = ['baifo', 'baifo', 'mojo'];
  offer(state, 'baifo');
  const result = claimBoosterReward(state, 0, 'evolve');
  assert.ok(result.ok && result.combination);
  assert.equal(result.combination.removedFromDeck, 2);
  assert.equal(result.combination.removedFromPC, 2);
  assert.deepEqual(state.deck, ['tierra_volcan', 'cabra']);
  assert.deepEqual(state.pc, ['mojo']);
});

run('mazo lleno con cuatro copias en el PC: la evolucion tambien cabe en el PC', () => {
  const state = freshState();
  state.deck = Array<string>(60).fill('tierra_volcan');
  state.pc = Array<string>(4).fill('baifo');
  offer(state, 'baifo');
  const result = claimBoosterReward(state, 0, 'evolve');
  assert.ok(result.ok && result.combination);
  assert.equal(result.destination, 'pc');
  assert.equal(state.deck.length, 60);
  assert.deepEqual(state.pc, ['cabra']);
});

run('la evolucion va al PC cuando ya hay cuatro copias del resultado en el mazo', () => {
  const state = freshState();
  state.deck = [
    ...Array<string>(52).fill('tierra_volcan'),
    ...Array<string>(4).fill('baifo'),
    ...Array<string>(4).fill('cabra'),
  ];
  state.pc = [];
  offer(state, 'baifo');
  const result = claimBoosterReward(state, 0, 'evolve');
  assert.ok(result.ok && result.combination);
  assert.equal(result.destination, 'pc');
  assert.equal(state.deck.length, 56);
  assert.equal(state.deck.filter((id) => id === 'cabra').length, 4);
  assert.deepEqual(state.pc, ['cabra']);
});

run('ultima etapa: la quinta copia mejora +1/+1 en lugar de evolucionar', () => {
  const state = freshState();
  state.deck = Array<string>(4).fill('cabra_titan_teide');
  state.pc = [];
  offer(state, 'cabra_titan_teide');
  const before = statsOf('cabra_titan_teide', state.shine);
  const result = claimBoosterReward(state, 0, 'evolve');
  assert.ok(result.ok && result.combination);
  assert.equal(result.combination.shineUp, true);
  assert.equal(state.shine.cabra_titan_teide, 1);
  assert.deepEqual(statsOf('cabra_titan_teide', state.shine), { atk: before.atk + 1, hp: before.hp + 1 });
  assert.equal(countOwned(state, 'cabra_titan_teide'), 1);
});

run('tierras y hechizos nunca evolucionan; limites del mazo respetados', () => {
  const state = freshState();
  state.deck = Array<string>(4).fill('chola');
  state.pc = Array<string>(4).fill('tierra_volcan');
  offer(state, 'chola');
  assert.equal(claimBoosterReward(state, 0, 'evolve').ok, false);
  assert.equal(claimBoosterReward(state, 0, 'deck').ok, false);
  assert.equal(claimBoosterReward(state, 0, 'pc').ok, true);
  assert.equal(doCombine(state, 'chola'), null);
  state.pc.push('tierra_volcan');
  assert.equal(doCombine(state, 'tierra_volcan'), null);
  assert.equal(state.deck.filter((id) => id === 'chola').length, 4);
});

run('el sobre pendiente y las victorias sobreviven al archivo de guardado', () => {
  loadPreset('capitulo1', 'cabra');
  save.beaten = {};
  const reward = grantTrainerVictory(save, 'chacho_portal', () => 0.4);
  assert.ok(reward);
  const serialized = exportSaveJSON();
  loadPreset('inicio');
  assert.equal(importSaveJSON(serialized), true);
  assert.deepEqual(save.pendingBooster, reward);
  assert.equal(trainerDefeated(save, 'chacho_portal'), true);
  assert.equal(claimBoosterReward(save, 0, 'pc').ok, true);
  assert.equal(claimBoosterReward(save, 1, 'pc').ok, false);

  const oldSave = JSON.parse(serialized);
  oldSave.version = 3;
  oldSave.beaten = { chacho_portal: 2 };
  delete oldSave.pendingBooster;
  assert.equal(importSaveJSON(JSON.stringify(oldSave)), true);
  assert.equal(trainerDefeated(save, 'chacho_portal'), true);
  assert.equal(save.pendingBooster, null);
});

run('los tres saltos al gimnasio incluyen mazos mejorados y jugables', () => {
  for (const starter of ['cabra', 'angelote', 'pinzon'] as const) {
    loadPreset('ull', starter);
    assert.equal(save.mapId, 'subida');
    assert.equal(save.starter, starter);
    assert.equal(save.flags.magodex, true);
    assert.equal(save.flags.pcIntro, true);
    assert.ok(save.deck.length > 24 && save.deck.length <= MAX_DECK);
    assert.ok(save.deck.includes(starter));
    assert.ok(save.deck.some((id) => (CARDS[id]?.stage ?? 0) >= 2 && id !== starter));
    const counts: Record<string, number> = {};
    const landColors = new Set<LandColor>();
    for (const id of save.deck) {
      const card = CARDS[id];
      assert.ok(card, `Carta inexistente: ${id}`);
      counts[id] = (counts[id] ?? 0) + 1;
      if (card.type === 'land') landColors.add(card.produces!);
      else assert.ok(counts[id] <= MAX_COPIES, `${id}: demasiadas copias`);
    }
    for (const id of save.deck) {
      for (const color of ['R', 'U', 'G', 'W', 'B'] as const) {
        if (CARDS[id].mana?.[color]) assert.ok(landColors.has(color), `${id} no tiene tierra ${color}`);
      }
    }
    assert.equal(trainerDefeated(save, 'chacho_portal'), true);
    assert.equal(trainerDefeated(save, 'est_parking'), false);
    assert.equal(save.pendingBooster, null);
    assert.equal(TRAINERS.est_parking.purse, 20);

    for (let game = 0; game < 10; game++) {
      let battle = createBattle({ name: 'TU', deck: save.deck }, { name: 'DOMINGO', deck: TRAINERS.gym_ull.deck });
      assert.equal(battle.players[0].hand.length, 7);
      for (let ticks = 0; battle.winner === null && ticks < 1000; ticks++) battle = step(battle);
      assert.notEqual(battle.winner, null, 'El duelo de gimnasio debe terminar');
    }
  }
});

run('colegios: los ninos del patio son repetibles y escalan en nivel segun la ruta (Nv.1 a Nv.5)', () => {
  const order = ['sc', 'cuesta', 'sanbenito', 'taganana', 'galdar'] as const;
  let prevPurse = 0;
  for (const sid of order) {
    const [k1, k2] = SCHOOLS[sid].kids;
    assert.equal(TRAINERS[k1].repeatable, true);
    assert.equal(TRAINERS[k2].repeatable, true);
    assert.ok(TRAINERS[k1].purse > prevPurse, `${sid} escala recompensa`);
    prevPurse = TRAINERS[k1].purse;
  }
  const state = freshState();
  for (let i = 1; i <= 5; i++) {
    assert.equal(trainerDefeated(state, 'cole1_a'), false);
    const reward = grantTrainerVictory(state, 'cole1_a');
    assert.ok(reward);
    assert.equal(state.beaten.cole1_a, i);
    assert.equal(claimBoosterReward(state, 0, 'pc').ok, true);
  }
  assert.equal(state.duros, 20);
  assert.equal(trainerDefeated(state, 'cole1_a'), false);
});

run('gimnasios #1 (Domingo), #2 (Cathaysa + Pedro Guerra) y #3 (Bentejui) entregan sus boliches', () => {
  for (const [name, spr] of Object.entries({ PEDRO, CANARION, CAPITAN, MARINERO, CATHAYSA, CATHAYSA_SURF })) {
    assert.equal(spr.length, 16, `${name} alto`);
    assert.deepEqual([...new Set(spr.map((r) => r.length))], [16], `${name} ancho`);
  }

  assert.equal(TRAINERS.gym_taganana.name, 'CATHAYSA');
  assert.ok(TRAINERS.gym_taganana.taunt[0].includes('senor Guerra'));
  assert.ok(TRAINERS.gym_taganana.taunt[0].includes('Cathaysa la nina guanche no vera mas Taganana'));
  assert.ok(DIALOGUE.pedro_closed.join(' ').includes('CATHAYSA no esta'));

  loadPreset('ull', 'cabra');
  const g1 = grantTrainerVictory(save, 'gym_ull');
  assert.ok(g1 && g1.gym === 1);
  assert.equal(save.flags.boliche_1, true);
  assert.equal(claimBoosterReward(save, 0, 'pc').ok, true);

  loadPreset('taganana', 'angelote');
  const g2 = grantTrainerVictory(save, 'gym_taganana');
  assert.ok(g2 && g2.gym === 2);
  assert.equal(save.flags.boliche_2, true);
  assert.equal(claimBoosterReward(save, 0, 'pc').ok, true);

  loadPreset('cuevas', 'pinzon');
  const g3 = grantTrainerVictory(save, 'gym_galdar');
  assert.ok(g3 && g3.gym === 3);
  assert.equal(save.flags.boliche_3, true);
  assert.equal(claimBoosterReward(save, 0, 'pc').ok, true);

  save.mapId = 'cuevas_pintadas';
  save.playerPos = { x: 10, y: 12, dir: 'up' };
  blackoutToNearestCenter(0);
  assert.equal(save.lastCenter, 'galdar');
});

run('ruta Anaga + Galdar (Curvas del Demonio, S.S. Olsen y Guachinche Cuevas Pintadas) 100% conectada', () => {
  const reachMap = (
    mapId: MapId,
    sx: number,
    sy: number,
    opts: { cuevaDoorOpen?: boolean; customNpcs?: Record<string, { x: number; y: number; hidden?: boolean }> } = {},
  ) => {
    const m = MAPS[mapId];
    const h = m.rows.length, w = m.rows[0].length;
    for (const r of m.rows) assert.equal(r.length, w, `${mapId} ancho uniforme`);
    const npcs = new Set(
      m.npcs
        .map((n) => opts.customNpcs?.[n.id] ?? { x: n.x, y: n.y, hidden: n.hidden })
        .filter((n) => !n.hidden)
        .map((n) => `${n.x},${n.y}`),
    );
    const isSolid = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return true;
      const tid = m.legend[m.rows[y][x]];
      assert.ok(tid, `${mapId} tile desconocido: ${m.rows[y][x]}`);
      if (SOLID[tid]) return true;
      if (npcs.has(`${x},${y}`)) return true;
      if (mapId === 'subida' && x >= TRUCK_POS.x && x < TRUCK_POS.x + TRUCK_POS.w && y >= TRUCK_POS.y && y < TRUCK_POS.y + TRUCK_POS.h) return true;
      if (mapId === 'anaga' && x >= CAYUCO_POS.x && x < CAYUCO_POS.x + CAYUCO_POS.w && y >= CAYUCO_POS.y && y < CAYUCO_POS.y + CAYUCO_POS.h) return true;
      if (mapId === 'galdar') {
        if (x >= GALDAR_CAYUCO_POS.x && x < GALDAR_CAYUCO_POS.x + GALDAR_CAYUCO_POS.w && y >= GALDAR_CAYUCO_POS.y && y < GALDAR_CAYUCO_POS.y + GALDAR_CAYUCO_POS.h) return true;
        if (!(x === OLSEN_POS.gangwayX && y === OLSEN_POS.gangwayY) && x >= OLSEN_POS.x && x < OLSEN_POS.x + OLSEN_POS.w && y >= OLSEN_POS.y && y < OLSEN_POS.y + OLSEN_POS.h) return true;
      }
      if (mapId === 'cuevas_pintadas' && !opts.cuevaDoorOpen && y === CUEVA_DOOR.y && x >= CUEVA_DOOR.x && x < CUEVA_DOOR.x + CUEVA_DOOR.w) return true;
      return false;
    };
    assert.equal(isSolid(sx, sy), false, `${mapId} inicio solido`);
    const seen = new Set([`${sx},${sy}`]);
    const q: [number, number][] = [[sx, sy]];
    while (q.length) {
      const [x, y] = q.shift()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
        if (!seen.has(k) && !isSolid(nx, ny)) { seen.add(k); q.push([nx, ny]); }
      }
    }
    const adj = (tx: number, ty: number) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(`${tx + dx},${ty + dy}`));
    return { reach: (x: number, y: number) => seen.has(`${x},${y}`), adj };
  };

  // Anaga: Pedro en la puerta, Cathaysa en Almaciga y luego en el gym
  const anBefore = reachMap('anaga', 9, 64);
  assert.equal(anBefore.adj(43, 6), true); // Pedro en la puerta del Gym #2
  assert.equal(anBefore.adj(60, 3), true); // Cathaysa en el agua de Almaciga
  assert.equal(anBefore.adj(71, 4), true); // Carmelo en Benijo
  const anAfter = reachMap('anaga', 9, 64, {
    customNpcs: { cathaysa_surf: { x: 60, y: 3, hidden: true }, cathaysa_gym: { x: 44, y: 6, hidden: false }, pedro: { x: 42, y: 7, hidden: false } },
  });
  assert.equal(anAfter.adj(44, 6), true);
  assert.equal(anAfter.adj(42, 7), true);

  // Galdar antes de las dos: portero canarion bloquea la puerta (22,4), pasarela S.S. Olsen (27,50) alcanzable
  const galClosed = reachMap('galdar', 13, 50);
  assert.equal(galClosed.reach(7, 44), true);   // C.P. El Faro
  assert.equal(galClosed.reach(33, 44), true);  // CEIP Galdar Nv.5
  assert.equal(galClosed.reach(27, 50), true);  // Pasarela del S.S. Olsen
  assert.equal(galClosed.adj(21, 32), true);    // Motero de las Curvas del Demonio
  assert.equal(galClosed.adj(13, 10), true);    // Vendedora de roscas
  assert.equal(galClosed.adj(22, 5), true);     // Portero canarion
  assert.equal(galClosed.reach(22, 4), false);  // Puerta bloqueada antes de las dos!

  // Galdar a las dos ("landon"): portero se aparta a (20,5) y la puerta (22,4) queda abierta
  const galOpen = reachMap('galdar', 13, 50, { customNpcs: { portero_cuevas: { x: 20, y: 5, hidden: false } } });
  assert.equal(galOpen.reach(22, 4), true);

  // S.S. Olsen: desde el portalon (4,14) hasta el Capitan mareado (21,5)
  const olsen = reachMap('ss_olsen', 4, 14);
  assert.equal(olsen.adj(5, 5), true);
  assert.equal(olsen.adj(12, 5), true);
  assert.equal(olsen.adj(21, 5), true);

  // Cuevas Pintadas: las 15 mesas de carne fiesta alcanzables; cocina bloqueada antes y abierta tras los 2 botones
  const cuevaClosed = reachMap('cuevas_pintadas', 10, 18, { cuevaDoorOpen: false });
  assert.equal(cuevaClosed.adj(10, 3), false); // Bentejui detras de los 2 cerrojos
  for (const ry of CUEVA_ROWS) {
    for (const cx of CUEVA_COLS) {
      const idx = cuevaTableIndex(cx, ry);
      assert.ok(idx >= 0 && idx < 15);
      assert.ok(adjacentCuevaTables(idx).length >= 2);
      assert.equal(cuevaClosed.adj(cx, ry), true, `Mesa ${idx} alcanzable`);
    }
  }
  const cuevaOpen = reachMap('cuevas_pintadas', 10, 18, { cuevaDoorOpen: true });
  assert.equal(cuevaOpen.adj(10, 3), true); // Bentejui alcanzable en la cocina!

  // Verificar las frases clave de Galdar y el cayuco
  assert.ok(DIALOGUE.canarion_closed[0].includes('Merameneño'));
  assert.ok(DIALOGUE.canarion_closed[0].includes('roscah'));
  assert.ok(DIALOGUE.canarion_closed[0].includes('hasta landon no abremoh'));
  assert.ok(DIALOGUE.canarion_closed[1].includes('quizas no era tan canario'));
  assert.ok(DIALOGUE.canarion_open[0].includes('YA SON LAS DOS'));
  assert.ok(DIALOGUE.canarion_open[0].includes('no se te vayan a subir los humos'));
  assert.ok(DIALOGUE.cayuco_arrival.join(' ').includes('Chacho, hasta el Armas se mueve menos'));

  // Verificar que todos los presets aparecen en casillas validas y todos los mazos pagan sus colores
  for (const pid of ['inicio', 'hospital', 'recado', 'capitulo1', 'weyler', 'ull', 'sanbenito', 'taganana', 'benijo', 'galdar', 'cuevas'] as const) {
    loadPreset(pid, 'cabra');
    const m = MAPS[save.mapId];
    assert.equal(SOLID[m.legend[m.rows[save.playerPos.y][save.playerPos.x]]], false, `Preset ${pid} caminable`);
  }
  for (const tr of Object.values(TRAINERS)) {
    const lands = new Set<LandColor>();
    for (const cid of tr.deck) if (CARDS[cid].type === 'land') lands.add(CARDS[cid].produces!);
    for (const cid of tr.deck) {
      const mn = CARDS[cid].mana;
      if (!mn) continue;
      for (const k of ['R', 'U', 'G', 'W', 'B'] as LandColor[]) {
        if (mn[k]) assert.ok(lands.has(k), `${tr.id} paga ${k} en ${cid}`);
      }
    }
  }

  // Smoke-render del fever dream del cayuco
  const texts: string[] = [];
  const mockCtx = {
    fillStyle: '',
    save() {}, restore() {}, translate() {}, rotate() {},
    fillRect() {},
    fillText(s: string) { texts.push(s); },
  } as unknown as CanvasRenderingContext2D;
  for (const stage of ['storm', 'dream', 'vomit', 'after'] as const) {
    drawCayucoFeverDream(mockCtx, 320, 288, stage, 20);
  }
  assert.ok(texts.some((t) => t.includes('120dB')));
});