import assert from 'node:assert/strict';
import { CARDS, LAND_IDS, MANA_COLORS } from '../src/battle/cards';
import { canAddToDeck, countOwned } from '../src/battle/booster';
import { canPayMana, canTapUnelco, createBattle, sacrificeUnelco, step, tapUnelco, type LandOnBoard } from '../src/battle/engine';
import { grantUnelco } from '../src/game/firstEdition';
import { MAPS } from '../src/game/maps';
import { CALETILLAS_DESEMBARCO, CANDELARIA_ORILLA } from '../src/game/mapsTf1';
import { boardWater, vaultable } from '../src/game/safariMoves';
import { exportSaveJSON, importSaveJSON, loadPreset, save } from '../src/game/save';
import { DRIVABLE_TILES, SOLID } from '../src/game/sprites';

function run(name: string, test: () => void) {
  test();
  console.log(`ok - ${name}`);
}

const land = (uid: number, id: string, tapped = false): LandOnBoard => ({ uid, def: CARDS[id], produces: CARDS[id].produces, tapped });
const duel = () => createBattle(
  { name: 'TU', deck: Array(12).fill('tierra_volcan') },
  { name: 'RIVAL', deck: Array(12).fill('tierra_charco') },
);

run('Unelco se recoge una sola vez y no sale en sobres normales', () => {
  assert.equal(CARDS.unelco.type, 'land');
  assert.equal(CARDS.unelco.producesAny, true);
  assert.equal(CARDS.unelco.produces, undefined, 'no tiene un color fijo');
  assert.equal(CARDS.unelco.legendary, true);
  assert.equal(CARDS.unelco.sacrifice?.name, 'APAGÓN');
  assert.equal(LAND_IDS.includes('unelco'), false);
  loadPreset('capitulo1', 'angelote');
  assert.deepEqual(grantUnelco(save), { ok: true, destination: 'deck' });
  assert.equal(countOwned(save, 'unelco'), 1);
  assert.ok(canAddToDeck(save, 'unelco'));
  assert.equal(grantUnelco(save).ok, false);
});

run('Unelco entra enderezada y paga un solo maná flexible en automático', () => {
  const unelco = land(1, 'unelco');
  const volcan = land(2, 'tierra_volcan');
  const playa = land(3, 'tierra_playa');
  for (const color of MANA_COLORS) assert.deepEqual(canPayMana([unelco], { [color]: 1 }), [unelco]);
  assert.equal(canPayMana([unelco], { R: 1, U: 1 }), null);
  assert.equal(canPayMana([unelco], { generic: 2 }), null);
  assert.equal(canPayMana([{ ...unelco, tapped: true }], { B: 1 }), null);
  assert.deepEqual(canPayMana([unelco, volcan, playa], { R: 1, G: 1, W: 1 }), [volcan, unelco, playa]);
  assert.deepEqual(canPayMana([unelco, volcan], { R: 1 }), [volcan], 'conserva Unelco si hay una tierra del color');

  const fresh = step(duel());
  fresh.players[0].hand = [CARDS.tierra_volcan, CARDS.chola, CARDS.unelco];
  const played = step(fresh);
  assert.equal(played.players[0].lands[0].def.id, 'unelco');
  assert.equal(canTapUnelco(played, 0), true, 'se puede girar en el turno en que entra');
  const cast = step(played);
  assert.equal(cast.players[0].lands[0].tapped, true, 'pagó el maná blanco de la chola');
  assert.equal(cast.players[1].life, 17);
  assert.match(cast.lastEvent, /gira Unelco/);
  assert.equal(cast.blackout, false);
  assert.equal(cast.players[0].graveyard.includes(CARDS.unelco), false);
});

run('Girar Unelco es independiente del sacrificio y paga el color elegido una sola vez', () => {
  const before = step(duel());
  before.players[0].lands = [land(1, 'unelco')];
  before.players[0].landPlayedThisTurn = true;
  before.players[0].hand = [CARDS.lagarto, CARDS.chola, CARDS.chola];
  assert.equal(tapUnelco(before, 1, 'W'), before, 'no se gira en el turno rival');
  for (const color of MANA_COLORS) {
    const tapped = tapUnelco(before, 0, color);
    assert.equal(tapped.players[0].unelcoMana, color);
    assert.equal(tapped.players[0].lands[0].tapped, true);
    assert.equal(tapped.blackout, false);
    assert.equal(tapped.players[0].graveyard.length, 0);
    assert.equal(tapUnelco(tapped, 0, color), tapped, 'no se gira dos veces');
  }
  const white = tapUnelco(before, 0, 'W');
  const cast = step(white);
  assert.deepEqual(cast.players[0].hand.map((c) => c.id), ['lagarto', 'chola']);
  assert.equal(cast.players[0].unelcoMana, null);
  assert.equal(cast.players[0].lands[0].tapped, true);
  assert.equal(cast.players[1].life, 17);
  assert.equal(step(cast).players[1].life, 17, 'no hay un segundo maná');
  assert.equal(before.players[0].lands[0].tapped, false, 'el estado anterior no se modifica');

  const unused = step(tapUnelco(before, 0, 'G'));
  assert.equal(unused.active, 1);
  assert.equal(unused.players[0].unelcoMana, null, 'el maná sin gastar no pasa de fase');
  const nextTurn = step({ ...unused, turn: 2, active: 0, phase: 'start' });
  assert.equal(canTapUnelco(nextTurn, 0), true, 'Unelco se endereza normalmente sin Apagón');
});

run('Apagón solo se activa al sacrificar y evita enderezar para los dos jugadores', () => {
  const b = step(duel());
  b.players[0].lands = [land(1, 'unelco'), land(2, 'tierra_volcan', true), land(3, 'tierra_playa')];
  b.players[1].lands = [land(4, 'tierra_charco', true)];
  b.players[0].hand = [CARDS.lagarto];
  const tapped = tapUnelco(b, 0, 'B');
  const off = sacrificeUnelco(tapped, 0);
  assert.ok(off.blackout);
  assert.ok(off.players[0].graveyard.includes(CARDS.unelco));
  assert.ok(!off.players[0].lands.some((l) => l.def.id === 'unelco'));
  assert.match(off.lastEvent, /APAGÓN/);
  assert.equal(sacrificeUnelco(off, 0), off);
  const cast = step(off);
  assert.equal(cast.players[0].board[0]?.def.id, 'lagarto', 'el maná ya generado no se pierde al sacrificar');
  for (const side of [0, 1] as const) {
    const start = step({ ...cast, active: side, turn: 2, phase: 'start' });
    assert.equal(start.players[side].lands[0].tapped, true);
    assert.ok(start.blackout);
    if (side === 0) assert.equal(start.players[side].lands[1].tapped, false, 'Apagón no gira tierras que ya estaban libres');
  }
  const next = step({ ...cast, turn: 2, phase: 'start' });
  const newLand = step(next).players[0].lands.at(-1);
  assert.equal(newLand?.tapped, false, 'una tierra nueva entra libre aunque haya Apagón');
});

run('La subestación está al este de la plaza en la TF-1 y solo se llega cruzando agua', () => {
  const m = MAPS.tf1;
  const tile = (x: number, y: number) => m.legend[m.rows[y]?.[x] ?? ''] ?? 'wall';
  const shore = CANDELARIA_ORILLA;
  const landing = CALETILLAS_DESEMBARCO;
  const card = m.triggers.find((t) => t.action.type === 'pickupUnelco');
  assert.ok(card?.kind === 'interact');
  assert.equal(tile(card.x, card.y), 'card');
  assert.equal(shore.y, landing.y, 'no hay rodeo al sur');
  assert.ok(shore.x < landing.x && landing.x < card.x && card.y > 15, 'todo queda al este y debajo de la calzada');
  assert.ok(!('caletillas' in MAPS), 'la subestación ya no es un mapa aparte');
  assert.equal(SOLID[tile(shore.x, shore.y)], false);
  assert.equal(SOLID[tile(landing.x, landing.y)], false);
  for (let x = shore.x + 1; x < landing.x; x++) {
    const t = tile(x, shore.y);
    assert.equal(SOLID[t], true);
    assert.ok(boardWater('tf1', t, x, shore.y));
  }

  const reach = (origin: [number, number], mode: 'foot' | 'car' | 'jump') => {
    const seen = new Set([origin.join(',')]);
    const q = [origin];
    for (let i = 0; i < q.length; i++) {
      const [x, y] = q[i];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let nx = x + dx, ny = y + dy;
        if (mode === 'jump' && vaultable('tf1', tile(nx, ny))) { nx += dx; ny += dy; }
        const t = tile(nx, ny), key = `${nx},${ny}`;
        if (!seen.has(key) && (mode === 'car' ? DRIVABLE_TILES.has(t) : !SOLID[t])) {
          seen.add(key); q.push([nx, ny]);
        }
      }
    }
    return (x: number, y: number) => seen.has(`${x},${y}`);
  };
  const walk = reach([132, 15], 'foot');
  assert.ok(walk(shore.x, shore.y));
  for (const mode of ['foot', 'car', 'jump'] as const) {
    const fromRoad = reach([151, 14], mode);
    assert.equal(fromRoad(landing.x, landing.y), false, `no hay atajo desde la carretera (${mode})`);
    assert.equal(fromRoad(card.x, card.y + 1), false, `no se llega a la carta sin surf (${mode})`);
  }
  assert.equal(walk(landing.x, landing.y), false);
  assert.ok(reach([landing.x, landing.y], 'foot')(card.x, card.y + 1), 'al desembarcar se puede recoger a pie');
});

run('Los guardados de la antigua zona de Caletillas conservan su progreso', () => {
  loadPreset('tf1', 'angelote');
  save.flags.hm_pukas = true;
  grantUnelco(save);
  const old = JSON.parse(exportSaveJSON());
  old.version = 10;
  old.flags.pukas_out = true;
  for (const [mapId, x, y] of [['caletillas', 10, 10], ['tf1', 148, 18], ['tf1', 132, 20]] as const) {
    assert.ok(importSaveJSON(JSON.stringify({ ...old, mapId, playerPos: { x, y, dir: 'up' } })));
    assert.equal(save.mapId, 'tf1');
    assert.deepEqual(save.playerPos, { ...CANDELARIA_ORILLA, dir: 'right' });
    assert.equal(save.flags.pukas_out, false);
    assert.equal(save.flags.got_unelco, true);
    assert.equal(countOwned(save, 'unelco'), 1);
    assert.equal(save.duros, old.duros);
  }
});