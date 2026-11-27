import assert from 'node:assert/strict';
import { CARDS, EVO_CHAINS, EVO_NEXT, totalMana } from '../src/battle/cards';
import { doCombine } from '../src/battle/booster';
import { createBattle, step } from '../src/battle/engine';
import { CREATURES } from '../src/game/creatureArt';
import { MAPS, PARRANDEROS, nearestParrandero } from '../src/game/maps';
import {
  TF1_VEHICLES, TF1_W, TF1_H, MONTANA_ROJA_POS, BINTER_PLANE_POS,
  TF1_ROMERIA_CART_POS, AMER_CARRETA_POS, AMER_GUAGUA_POS, tf1VehicleAt,
} from '../src/game/mapsTf1';
import {
  GUAGUERO, REPARTIDOR, DONA_BINTER, MAGO_ROMERO,
  drawGuaguaTitsa, drawVWCaddy, drawMontanaRoja, drawBinterPlane, drawCarretaRomera, drawRomeriaCutscene,
} from '../src/game/props';
import { grantBinterTicket, grantBucio } from '../src/game/firstEdition';
import { claimBoosterReward, grantTrainerVictory } from '../src/game/rewards';
import { loadPreset, save } from '../src/game/save';
import { SOLID, DRIVABLE_TILES } from '../src/game/sprites';
import { STORY } from '../src/game/story';
import { TRAINERS } from '../src/game/trainers';
import { buildGymDebugDeck, buildGym2DebugDeck, buildGym3DebugDeck, buildGym4DebugDeck } from '../src/game/presets';

function run(name: string, test: () => void) {
  test();
  console.log(`ok - ${name}`);
}

function bfsTf1(fromX: number, fromY: number, car: boolean) {
  const m = MAPS.tf1;
  const npcs = new Set(m.npcs.filter((n) => !n.hidden).map((n) => `${n.x},${n.y}`));
  const blocked = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= TF1_W || y >= TF1_H) return true;
    const t = m.legend[m.rows[y][x]];
    if (tf1VehicleAt(x, y)) return true;
    if (x >= TF1_ROMERIA_CART_POS.x && x < TF1_ROMERIA_CART_POS.x + TF1_ROMERIA_CART_POS.w && y >= TF1_ROMERIA_CART_POS.y && y < TF1_ROMERIA_CART_POS.y + TF1_ROMERIA_CART_POS.h) return true;
    if (x >= MONTANA_ROJA_POS.x && x < MONTANA_ROJA_POS.x + MONTANA_ROJA_POS.w && y >= MONTANA_ROJA_POS.y && y < MONTANA_ROJA_POS.y + MONTANA_ROJA_POS.h) return true;
    if (x >= BINTER_PLANE_POS.x && x < BINTER_PLANE_POS.x + BINTER_PLANE_POS.w && y >= BINTER_PLANE_POS.y && y < BINTER_PLANE_POS.y + BINTER_PLANE_POS.h) return true;
    if (npcs.has(`${x},${y}`)) return true;
    return car ? !DRIVABLE_TILES.has(t) : !!SOLID[t];
  };
  assert.equal(blocked(fromX, fromY), false, `origen TF-1 (${fromX},${fromY}) libre`);
  const seen = new Set([`${fromX},${fromY}`]);
  const q: [number, number][] = [[fromX, fromY]];
  while (q.length) {
    const [x, y] = q.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (!seen.has(k) && !blocked(nx, ny)) {
        seen.add(k);
        q.push([nx, ny]);
      }
    }
  }
  const has = (x: number, y: number) => seen.has(`${x},${y}`);
  const adj = (x: number, y: number) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => has(x + dx, y + dy));
  return { has, adj };
}

run('mazos de debug: curva de mana equilibrada, criaturas tempranas (T1-T2) y victorias solidas', () => {
  for (const starter of ['cabra', 'angelote', 'pinzon'] as const) {
    for (const build of [buildGymDebugDeck, buildGym2DebugDeck, buildGym3DebugDeck, buildGym4DebugDeck]) {
      const deck = build(starter);
      const lands = deck.filter((id) => CARDS[id].type === 'land').length;
      const earlyCreatures = deck.filter((id) => CARDS[id].type === 'creature' && totalMana(CARDS[id].mana) <= 3).length;
      const heavyCards = deck.filter((id) => totalMana(CARDS[id].mana) >= 5).length;
      assert.ok(lands / deck.length >= 0.37, `${starter}: ratio de tierras sano`);
      assert.ok(earlyCreatures >= 10, `${starter}: minimo 10 criaturas baratas (coste 1-3), tiene ${earlyCreatures}`);
      assert.ok(heavyCards <= 3, `${starter}: sin atasco de costes altos, tiene ${heavyCards}`);
    }

    // Verificar empiricamente que saca criatura antes de T2.1 y gana holgadamente en debug
    const d4 = buildGym4DebugDeck(starter);
    let wins = 0;
    let firstTurnSum = 0;
    const games = 80;
    const foes = [
      TRAINERS.coco_santa_ursula.deck,
      TRAINERS.torre_enriscada_4.deck,
      TRAINERS.guagua_candelaria.deck,
      TRAINERS.caddy_adeje.deck,
    ];
    for (let i = 0; i < games; i++) {
      let b = createBattle({ name: 'TU', deck: d4 }, { name: 'RIVAL', deck: foes[i % foes.length] });
      let firstCreature = 0;
      for (let t = 0; b.winner === null && t < 1000; t++) {
        b = step(b);
        if (!firstCreature && b.players[0].board.length > 0) firstCreature = b.turn;
      }
      firstTurnSum += firstCreature || 6;
      if (b.winner === 0) wins++;
    }
    const avgFirst = firstTurnSum / games;
    assert.ok(avgFirst <= 2.1, `${starter} baja 1a criatura rapido (media T${avgFirst.toFixed(2)})`);
    assert.ok(wins >= games * 0.58, `${starter} supera los escenarios de debug (${wins}/${games})`);
  }
});

run('Autopista TF-1 ("Ruta Bici" en Toyota): 160 tiles, hitos iconicos, Guaguas TITSA y VW Caddys', () => {
  const m = MAPS.tf1;
  assert.equal(m.rows.length, TF1_H);
  assert.ok(TF1_W >= 150, 'TF-1 bien larga');
  let turbines = 0;
  for (const row of m.rows) {
    assert.equal(row.length, TF1_W);
    for (const ch of row) {
      const tid = m.legend[ch];
      assert.ok(tid, `tile desconocido en tf1: ${ch}`);
      if (tid === 'turbine') turbines++;
    }
  }
  assert.ok(turbines >= 24, `Abades lleno de aerogeneradores (${turbines})`);
  assert.equal(m.legend[m.rows[TF1_H - 1][80]], 'sea', 'mar al sur en toda la TF-1');

  // Recorrido completo en Toyota desde Santa Cruz (x=158) hasta la Romeria de Adeje (x=4) y el parking TFS
  const car = bfsTf1(158, 12, true);
  assert.equal(car.has(4, 12), true, 'llega hasta la Romeria que corta la entrada de Adeje al oeste');
  assert.equal(car.has(132, 15), true, 'entra al apartadero de Candelaria');
  assert.equal(car.has(75, 15), true, 'entra al mirador de Montana Roja / El Medano');
  assert.equal(car.has(35, 7), true, 'entra al parking del Aeropuerto TFS');
  assert.equal(car.has(70, 18), false, 'el Toyota NO pisa la playa de El Medano');
  assert.equal(car.has(35, 5), false, 'el Toyota NO se mete en la Terminal del Aeropuerto');

  // Todas las Guaguas de TITSA y VW Caddy son retables desde el carril contiguo
  assert.ok(TF1_VEHICLES.filter((v) => v.kind === 'guagua').length >= 4, '4 Guaguas de TITSA');
  assert.ok(TF1_VEHICLES.filter((v) => v.kind === 'caddy').length >= 4, '4 VW Caddy');
  for (const v of TF1_VEHICLES) {
    assert.ok(TRAINERS[v.trainer], `entrenador ${v.trainer} existe`);
    assert.equal(car.has(v.honkX, v.honkY), true, `carril de reto de ${v.trainer} accesible`);
    assert.equal(car.adj(v.x, v.y), true, `vehiculo ${v.id} interactuable desde el Toyota`);
  }

  // Todos los hitos iconicos anunciados en banners de zona + Adeje aun no construido
  const zones = new Set(
    m.triggers.filter((t) => t.action.type === 'zone').map((t) => (t.action as { type: 'zone'; name: string }).name),
  );
  assert.ok([...zones].some((z) => z.includes('CANDELARIA')));
  assert.ok([...zones].some((z) => z.includes('ABADES')));
  assert.ok([...zones].some((z) => z.includes('MONTAÑA ROJA')));
  assert.ok([...zones].some((z) => z.includes('MEDANO')));
  assert.ok([...zones].some((z) => z.includes('AEROPUERTO')));
  assert.ok([...zones].some((z) => z.includes('ADEJE')));
  assert.equal('adeje' in MAPS, false, 'Adeje reservado para la siguiente iteracion');

  loadPreset('tf1', 'cabra');
  const rw = grantTrainerVictory(save, 'guagua_candelaria');
  assert.ok(rw);
  assert.equal(claimBoosterReward(save, 0, 'pc').ok, true);
});

run('Aeropuerto Tenerife Sur (TFS), M.O. 2 Tarifa Plana Binter, chiste de la Doña y props', () => {
  // Chiste rematado de la doña de la torre + apertura de la TF-1 con el Bucio
  assert.ok(STORY.tower_bruja.some((l) => l.includes('santeria canaria')));
  assert.ok(STORY.tower_bruja.some((l) => l.includes('CROMOS DE CARTON')));
  assert.ok(STORY.tower_bruja.some((l) => l.includes('TF-1')));
  loadPreset('torre_final', 'angelote');
  assert.equal(grantBucio(save), true);
  assert.equal(save.flags.has_bucio, true);
  assert.ok(MAPS.santacruz_sur.triggers.some((t) => t.action.type === 'enterTf1'));

  // Desde el parking del Aeropuerto TFS a pie se entra al C.P. La Reina y a la Terminal
  const foot = bfsTf1(35, 7, false);
  assert.equal(foot.has(35, 5), true, 'puerta Terminal TFS alcanzable a pie');
  assert.equal(foot.has(28, 5), true, 'C.P. La Reina alcanzable a pie');
  assert.equal(nearestParrandero('aeropuerto', 10, 10), 'aeropuerto');
  assert.equal(nearestParrandero('tf1', 30, 12), 'aeropuerto');
  assert.ok(PARRANDEROS.aeropuerto);

  // Terminal TFS: geometria valida y Doña Maruca entrega la M.O. 2 Binter una sola vez
  const ap = MAPS.aeropuerto;
  for (const r of ap.rows) {
    assert.equal(r.length, ap.rows[0].length);
    for (const ch of r) assert.ok(ap.legend[ch], `aeropuerto tile ${ch}`);
  }
  assert.ok(ap.npcs.some((n) => n.id === 'dona_binter'));
  loadPreset('aeropuerto', 'pinzon');
  assert.equal(save.flags.hm_binter, undefined);
  assert.equal(grantBinterTicket(save), true);
  assert.equal(save.flags.hm_binter, true);
  assert.equal(grantBinterTicket(save), false, 'la M.O. 2 se entrega una sola vez');
  assert.ok(STORY.dona_binter_give.some((l) => l.includes('M.O. 2') && l.includes('BINTER')));

  // Sprites 16x16 y smoke-render de los props de la TF-1 y Binter
  for (const [name, spr] of Object.entries({ GUAGUERO, REPARTIDOR, DONA_BINTER })) {
    assert.equal(spr.length, 16, `${name} alto 16`);
    assert.deepEqual([...new Set(spr.map((r) => r.length))], [16], `${name} ancho 16`);
  }
  const mockCtx = { fillStyle: '', fillRect() {} } as unknown as CanvasRenderingContext2D;
  drawGuaguaTitsa(mockCtx, 0, 0, 10);
  drawVWCaddy(mockCtx, 0, 0, 10, 'reparto');
  drawVWCaddy(mockCtx, 0, 0, 10, 'escalera');
  drawVWCaddy(mockCtx, 0, 0, 10, 'camper');
  drawMontanaRoja(mockCtx, 0, 0, 10);
  drawBinterPlane(mockCtx, 0, 0, 10);
});

run('Romeria con Bucio + Isa Canaria, Estacion de Las Americas y Mago obligatorio (Vino Peleon y Yunta de Bueyes)', () => {
  // 1. Lineas evolutivas de Vino Peleon y Yunta de Bueyes completas con arte 16x16
  assert.deepEqual(EVO_CHAINS.vino, ['cuarta_vino', 'garrafa_peleon', 'barrica_romera']);
  assert.deepEqual(EVO_CHAINS.yunta, ['novillo_romero', 'yunta_bueyes', 'yunta_real']);
  assert.equal(EVO_NEXT.cuarta_vino, 'garrafa_peleon');
  assert.equal(EVO_NEXT.garrafa_peleon, 'barrica_romera');
  assert.equal(EVO_NEXT.novillo_romero, 'yunta_bueyes');
  assert.equal(EVO_NEXT.yunta_bueyes, 'yunta_real');
  for (const id of [...EVO_CHAINS.vino, ...EVO_CHAINS.yunta]) {
    assert.ok(CARDS[id], `${id} existe en CARDS`);
    assert.equal(CREATURES[id]?.length, 16, `${id} alto 16`);
    assert.ok(CREATURES[id].every((r) => r.length === 16), `${id} ancho 16`);
  }
  const colVino = { deck: [], pc: Array<string>(5).fill('cuarta_vino'), shine: {} };
  assert.equal(doCombine(colVino, 'cuarta_vino')?.newId, 'garrafa_peleon');
  const colYunta = { deck: [], pc: Array<string>(5).fill('novillo_romero'), shine: {} };
  assert.equal(doCombine(colYunta, 'novillo_romero')?.newId, 'yunta_bueyes');

  // 2. Corte de la Romeria en la entrada a Adeje (TF-1) + cutscene con Isa Canaria
  assert.ok(MAPS.tf1.triggers.some((t) => t.x === 4 && t.y === 12 && t.action.type === 'romeriaBlockade'));
  assert.equal(MAGO_ROMERO.length, 16);
  assert.ok(MAGO_ROMERO.every((r) => r.length === 16));
  const texts: string[] = [];
  const mockCtx = {
    fillStyle: '',
    save() {}, restore() {}, translate() {}, scale() {},
    fillRect() {},
    fillText(s: string) { texts.push(s); },
  } as unknown as CanvasRenderingContext2D;
  drawCarretaRomera(mockCtx, 0, 0, 12);
  for (const stg of ['bucio', 'isa', 'arrival'] as const) {
    drawRomeriaCutscene(mockCtx, 320, 288, stg, 25);
  }
  assert.ok(texts.some((t) => t.includes('BUCIO')));
  assert.ok(texts.some((t) => t.includes('ISA CANARIA')));
  assert.ok(texts.some((t) => t.includes('LAS AMERICAS')));

  // 3. Estacion de Las Americas: geometria, portazo obligatorio del Mago antes de Ciudad Fucsia (esto... Adeje)
  const la = MAPS.las_americas;
  const w = la.rows[0].length;
  for (const r of la.rows) {
    assert.equal(r.length, w);
    for (const ch of r) assert.ok(la.legend[ch], `las_americas tile ${ch}`);
  }
  const magoNpc = la.npcs.find((n) => n.id === 'mago_americas');
  assert.ok(magoNpc && magoNpc.trainer === 'mago_americas' && magoNpc.x === 3 && magoNpc.y === 9);

  // Verificar por BFS que sin ganar a Don Servando es IMPOSIBLE cruzar a Ciudad Fucsia (esto... Adeje)
  const gates = new Set(
    la.triggers
      .filter((t) => t.kind === 'step' && t.action.type === 'gate' && t.action.key === 'mago_americas_done')
      .map((t) => `${t.x},${t.y}`),
  );
  const blocked = (x: number, y: number, gateClosed: boolean) => {
    if (x < 0 || y < 0 || y >= la.rows.length || x >= w) return true;
    if (gateClosed && gates.has(`${x},${y}`)) return true;
    if (x >= AMER_CARRETA_POS.x && x < AMER_CARRETA_POS.x + AMER_CARRETA_POS.w && y >= AMER_CARRETA_POS.y && y < AMER_CARRETA_POS.y + AMER_CARRETA_POS.h) return true;
    if (x >= AMER_GUAGUA_POS.x && x < AMER_GUAGUA_POS.x + AMER_GUAGUA_POS.w && y >= AMER_GUAGUA_POS.y && y < AMER_GUAGUA_POS.y + AMER_GUAGUA_POS.h) return true;
    return !!SOLID[la.legend[la.rows[y][x]]];
  };
  const walk = (gateClosed: boolean) => {
    const seen = new Set(['9,9']);
    const q: [number, number][] = [[9, 9]];
    while (q.length) {
      const [x, y] = q.shift()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
        if (!seen.has(k) && !blocked(nx, ny, gateClosed)) { seen.add(k); q.push([nx, ny]); }
      }
    }
    return seen;
  };
  const beforeWin = walk(true);
  assert.equal(beforeWin.has('4,9'), true, 'llegas frente al Mago Don Servando');
  assert.equal(beforeWin.has('0,9'), false, 'IMPOSIBLE entrar a Ciudad Fucsia/Adeje sin vencer al Mago');
  const afterWin = walk(false);
  assert.equal(afterWin.has('0,9'), true, 'tras vencer al Mago se abre el arco de Ciudad Fucsia (Adeje)');

  // 4. Mazo de Don Servando usa Vino Peleon + Yunta de Bueyes y el combate funciona
  const magoDeck = TRAINERS.mago_americas.deck;
  for (const id of ['cuarta_vino', 'garrafa_peleon', 'barrica_romera', 'novillo_romero', 'yunta_bueyes', 'yunta_real']) {
    assert.ok(magoDeck.includes(id), `Don Servando lleva ${id}`);
  }
  loadPreset('americas', 'cabra');
  let battle = createBattle({ name: 'TU', deck: save.deck }, { name: 'DON SERVANDO', deck: magoDeck });
  for (let t = 0; battle.winner === null && t < 1000; t++) battle = step(battle);
  assert.notEqual(battle.winner, null);
  const reward = grantTrainerVictory(save, 'mago_americas');
  assert.ok(reward);
  assert.equal(save.flags.mago_americas_done, true, 'vencer al Mago abre el paso a Ciudad Fucsia (Adeje)');
  assert.equal(claimBoosterReward(save, 0, 'pc').ok, true);
});
