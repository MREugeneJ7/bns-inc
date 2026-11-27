import assert from 'node:assert/strict';
import { CARDS, EVO_CHAINS, EVO_NEXT } from '../src/battle/cards';
import { doCombine } from '../src/battle/booster';
import { createBattle, step } from '../src/battle/engine';
import { MAPS } from '../src/game/maps';
import { findCremaFP50, grantVaraPastor, grantPukasBoard } from '../src/game/firstEdition';
import { GUIRI_CREMA, SURFERO_PUKAS, LEON_NPC, CREMA_NPC } from '../src/game/props';
import { claimBoosterReward, grantTrainerVictory } from '../src/game/rewards';
import { loadPreset, save } from '../src/game/save';
import { SOLID } from '../src/game/sprites';
import { STORY } from '../src/game/story';
import { TRAINERS } from '../src/game/trainers';
import { CREATURES } from '../src/game/creatureArt';

function run(name: string, test: () => void) {
  test();
  console.log(`ok - ${name}`);
}

run('Siam Park (Zona Safari): lineas evolutivas de Leones Marinos y Tiburones completas', () => {
  // Linea Leon Marino: cria_leon -> leon_marino -> gran_otario
  assert.deepEqual(EVO_CHAINS.leon_marino, ['cria_leon', 'leon_marino', 'gran_otario']);
  assert.equal(EVO_NEXT.cria_leon, 'leon_marino');
  assert.equal(EVO_NEXT.leon_marino, 'gran_otario');
  assert.equal(EVO_NEXT.gran_otario, undefined);

  // Linea Tiburon: cazon -> jaqueton -> megalodon_siam
  assert.deepEqual(EVO_CHAINS.tiburon, ['cazon', 'jaqueton', 'megalodon_siam']);
  assert.equal(EVO_NEXT.cazon, 'jaqueton');
  assert.equal(EVO_NEXT.jaqueton, 'megalodon_siam');
  assert.equal(EVO_NEXT.megalodon_siam, undefined);

  for (const id of [...EVO_CHAINS.leon_marino, ...EVO_CHAINS.tiburon]) {
    assert.ok(CARDS[id], `${id} existe en CARDS`);
    assert.ok(CREATURES[id], `${id} tiene pixel art en CREATURES`);
    assert.equal(CREATURES[id]?.length, 16, `${id} alto 16`);
  }

  // Combinacion de 5 copias
  const colLeon = { deck: [], pc: Array<string>(5).fill('cria_leon'), shine: {} };
  assert.equal(doCombine(colLeon, 'cria_leon')?.newId, 'leon_marino');
  const colTib = { deck: [], pc: Array<string>(5).fill('cazon'), shine: {} };
  assert.equal(doCombine(colTib, 'cazon')?.newId, 'jaqueton');
});

run('Siam Park: geometria, conexion desde Las Americas y leyendas de toboganes/olas', () => {
  const m = MAPS.siam_park;
  assert.equal(m.rows.length, 24);
  const w = m.rows[0].length;
  assert.equal(w, 52);
  for (const r of m.rows) {
    assert.equal(r.length, w);
    for (const ch of r) assert.ok(m.legend[ch], `tile desconocido en siam_park: ${ch}`);
  }

  // El cruce es físico: los dos extremos de cada enlace se pueden pisar.
  const expected = [ ['las_americas','puente_magma'], ['puente_magma','siam_park'],
    ['siam_park','puente_magma'], ['puente_magma','las_americas'] ] as const;
  for (const [from, to] of expected) {
    const t = MAPS[from].triggers.find(t=>t.action.type==='warp' && t.action.to===to);
    assert.ok(t && t.action.type === 'warp');
    assert.equal(SOLID[MAPS[from].legend[MAPS[from].rows[t.y][t.x]]], false, `${from}: salida bloqueada`);
    assert.equal(SOLID[MAPS[to].legend[MAPS[to].rows[t.action.y][t.action.x]]], false, `${to}: llegada bloqueada`);
  }
});

run('Siam Park: combates de cola de toboganes y socorrista con leones y tiburones', () => {
  for (const tid of ['cola_torre_poder', 'cola_dragon', 'lifeguard_siam']) {
    const tr = TRAINERS[tid];
    assert.ok(tr, `${tid} existe`);
    assert.ok(tr.deck.length >= 18);
    for (const cardId of tr.deck) assert.ok(CARDS[cardId], `${tid} usa carta valida ${cardId}`);

    // Comprobar que usan leones marinos y tiburones
    const usesSafariBeasts = tr.deck.some((cid) =>
      ['cria_leon', 'leon_marino', 'gran_otario', 'cazon', 'jaqueton', 'megalodon_siam'].includes(cid)
    );
    assert.ok(usesSafariBeasts, `${tid} usa criaturas de Siam Park`);

    // Duelo funcional
    loadPreset('siam', 'cabra');
    let battle = createBattle({ name: 'TU', deck: save.deck }, { name: tr.name, deck: tr.deck });
    for (let t = 0; battle.winner === null && t < 1000; t++) battle = step(battle);
    assert.notEqual(battle.winner, null);

    const rew = grantTrainerVictory(save, tid);
    assert.ok(rew);
    assert.equal(claimBoosterReward(save, 0, 'pc').ok, true);
  }
});

run('M.O. 4 (Salto del Pastor) & Crema Solar FP50: mision del guiri Dave que te confunde con local', () => {
  loadPreset('siam', 'angelote');
  assert.equal(save.flags.has_crema_fp50, undefined);
  assert.equal(save.flags.hm_salto_pastor, undefined);

  // Intentar pedir la MO4 antes de tener la crema no funciona
  assert.equal(grantVaraPastor(save), false);

  // Recoger la crema solar FP50 en las tumbonas
  assert.equal(findCremaFP50(save), true);
  assert.equal(save.flags.has_crema_fp50, true);
  assert.equal(findCremaFP50(save), false, 'solo se recoge una vez');

  // Entregarle la crema a Dave otorga la M.O. 4: Vara del Salto del Pastor
  assert.equal(grantVaraPastor(save), true);
  assert.equal(save.flags.hm_salto_pastor, true);
  assert.equal(grantVaraPastor(save), false, 'solo se entrega una vez');

  // Diálogos clave
  assert.ok(STORY.siam_guiri_quest_prompt.join(' ').includes('FACTOR 50') && STORY.siam_guiri_quest_prompt.join(' ').includes('proper canarian'));
  assert.ok(STORY.siam_guiri_reward.join(' ').includes('SALTO DEL PASTOR') && STORY.siam_guiri_reward.join(' ').includes('M.O. 4'));
});

run('M.O. 3 (Pukas / Surf): evento en The Wave Palace con la ola gigante y Borja el surfero', () => {
  loadPreset('siam', 'pinzon');
  assert.equal(save.flags.hm_pukas, undefined);

  // Ver la caída, recoger la tabla y ofrecérsela al dueño antes de recibir la M.O.
  assert.equal(grantPukasBoard(save), false);
  save.flags.pukas_dropped = true; save.flags.pukas_recovered = true;
  assert.equal(grantPukasBoard(save), true);
  assert.equal(save.flags.hm_pukas, true);
  assert.equal(grantPukasBoard(save), false, 'solo se obtiene una vez');

  // Diálogos de la ola de 3 metros y tabla Pukas
  assert.ok(STORY.siam_pukas_event.join(' ').includes('The Wave Palace') && STORY.siam_pukas_event.join(' ').includes('PUKAS'));
  assert.ok(STORY.siam_pukas_event.some((l) => l.includes('M.O. 3')));
});

run('Sprites 16x16 de Siam Park y preset "siam"', () => {
  for (const [name, spr] of Object.entries({ GUIRI_CREMA, SURFERO_PUKAS, LEON_NPC, CREMA_NPC })) {
    assert.equal(spr.length, 16, `${name} alto 16`);
    assert.deepEqual([...new Set(spr.map((r) => r.length))], [16], `${name} ancho 16`);
  }

  loadPreset('siam', 'cabra');
  assert.equal(save.mapId, 'siam_park');
  assert.equal(save.flags.car_out, false, 'coche guardado en Siam Park');
  assert.equal(SOLID[MAPS.siam_park.legend[MAPS.siam_park.rows[save.playerPos.y][save.playerPos.x]]], false, 'posicion caminable');
});
