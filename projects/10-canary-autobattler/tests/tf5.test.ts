import assert from 'node:assert/strict';
import { CARDS, MANA_COLORS } from '../src/battle/cards';
import { createBattle, step } from '../src/battle/engine';
import { toggleTodoTerreno } from '../src/game/firstEdition';
import { MAPS, nearestParrandero, type MapId } from '../src/game/maps';
import {
  LA_QUINTA_EXIT, SAUZAL_RADAR_COUNT, TACO_TF5, TACO_UNDERPASS_VEHICLES, TF5_VEHICLES,
  drawAnchietaBridge, drawCalleTf5BridgeOverpass, drawCalleTf5Ground, drawTacoronteRain,
  drawTf5Vehicle, inTacoronteRain, tacoUnderpassVehicleAt, tf5SwCenterY, tf5VehicleAt,
} from '../src/game/mapsTf5';
import { claimBoosterReward, grantTrainerVictory } from '../src/game/rewards';
import { exportSaveJSON, importSaveJSON, loadPreset, save } from '../src/game/save';
import { DRIVABLE_TILES, SOLID, drawTile, type TileId } from '../src/game/sprites';
import { TRAINERS } from '../src/game/trainers';

function run(name: string, fn: () => void) {
  fn();
  console.log(`ok - ${name}`);
}

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]] as const;
const tile = (id: MapId, x: number, y: number): TileId =>
  MAPS[id].legend[MAPS[id].rows[y]?.[x] ?? ''] ?? 'wall';

run('Estación de S/C sube todo tieso al norte a la TF-5 y cruza Taco en 2 alturas', () => {
  // 1. Desde la Estación de Guaguas en santacruz_sur (x=48..50, y=8) se sube recto hasta y=0
  for (let y = 0; y <= 8; y++) {
    for (const x of [48, 49, 50]) {
      assert.ok(DRIVABLE_TILES.has(tile('santacruz_sur', x, y)), `asfalto continuo en (${x},${y})`);
    }
  }
  const northGates = MAPS.santacruz_sur.triggers.filter((t) => t.action.type === 'enterTf5');
  assert.deepEqual(northGates.map((t) => [t.x, t.y]), [[48, 0], [49, 0], [50, 0]]);

  // 2. Cota superior (Nivel 1) en `calle`: puente transitable E-O y cerrado N-S
  for (let x = TACO_TF5.left; x <= TACO_TF5.right; x++) {
    for (let y = TACO_TF5.bridgeTop; y <= TACO_TF5.bridgeBottom; y++) {
      assert.equal(tile('calle', x, y), 'bridge');
      assert.equal(SOLID[tile('calle', x, y)], false);
    }
    for (const y of [0, 1, 2, 3, 9, 10, 11]) {
      assert.equal(tile('calle', x, y), 'tf5');
      assert.equal(SOLID[tile('calle', x, y)], true, 'desde arriba no caes a la TF-5');
    }
  }

  // 3. Cota inferior (Nivel 0) en `calle`: paso libre N-S bajo el puente (carriles 23 y 24) y cerrado E-O
  const underSolid = (x: number, y: number) =>
    y < 0 || y >= MAPS.calle.rows.length || x < TACO_TF5.left || x > TACO_TF5.right || !!tacoUnderpassVehicleAt(x, y);
  for (let y = 0; y <= 11; y++) {
    assert.equal(underSolid(23, y), false, `carril sur (23,${y}) libre bajo el puente`);
    assert.equal(underSolid(24, y), false, `carril norte (24,${y}) libre bajo el puente`);
    assert.equal(underSolid(21, y), true, 'muro oeste separa la TF-5 de Taco');
    assert.equal(underSolid(26, y), true, 'muro este separa la TF-5 de La Candelaria');
  }

  // 4. Prohibido bajarse del 4x4 bajo el puente + persistencia limpia en JSON
  loadPreset('tf5', 'cabra');
  save.mapId = 'calle';
  save.playerPos = { x: 24, y: 6, dir: 'up' };
  save.flags.car_out = true;
  save.flags.tf5_underpass = true;
  const parkAttempt = toggleTodoTerreno(save, tile('calle', 24, 6), false);
  assert.deepEqual(parkAttempt, { ok: false, reason: 'hazard' });
  const snap = exportSaveJSON();
  assert.equal(importSaveJSON(snap), true);
  assert.equal(save.mapId, 'calle');
  assert.equal(save.flags.tf5_underpass, true);
  assert.equal(save.flags.car_out, true);
});

run('TF-5: ultra-cola en Padre Anchieta, giro SO en TFN, lluvia en Tacoronte, curvas+radares en El Sauzal, Matanza, Victoria, Santa Úrsula y La Quinta', () => {
  const m = MAPS.tf5;
  assert.ok(m.rows.every((r) => r.length === m.rows[0].length));
  for (const r of m.rows) for (const ch of r) assert.ok(m.legend[ch], `tile TF-5 ${ch}`);

  // Intensificacion de la cola en Padre Anchieta (y=41..75) frente a Guajara y cero atasco tras TFN
  const carsInBand = (x0: number, x1: number, y0: number, y1: number) => {
    let n = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (tile('tf5', x, y) === 'car') n++;
    return n;
  };
  const guajaraCars = carsInBand(114, 118, 78, 94);
  const anchietaCars = carsInBand(114, 118, 41, 75);
  const postTfnCars = carsInBand(5, 95, 12, 90);
  assert.ok(guajaraCars >= 6, 'ya hay cola saliendo de Taco/Guajara');
  assert.ok(anchietaCars > guajaraCars * 2, `la cola se intensifica en Padre Anchieta (${anchietaCars} vs ${guajaraCars})`);
  assert.equal(postTfnCars, 0, 'en TFN se acaba la ultra-cola');

  // A partir de TFN la autopista deja de ir al norte y avanza rumbo SUROESTE (-x, +y)
  assert.ok(tf5SwCenterY(85) > tf5SwCenterY(96), 'Tacoronte queda al suroeste de TFN');
  assert.ok(tf5SwCenterY(50) > tf5SwCenterY(76), 'El Sauzal baja al suroeste');
  assert.ok(tf5SwCenterY(42) > tf5SwCenterY(50), 'La Matanza sigue al suroeste');
  assert.ok(tf5SwCenterY(30) > tf5SwCenterY(42), 'La Victoria sigue al suroeste');
  assert.ok(tf5SwCenterY(18) > tf5SwCenterY(30), 'Santa Úrsula sigue al suroeste');
  assert.ok(tf5SwCenterY(10) > tf5SwCenterY(18), 'La Orotava sigue al suroeste');

  // El Sauzal tiene curvas por la cara (cambios de signo en la pendiente) y montones de señales de radar
  let directionFlips = 0;
  let lastSign = 0;
  for (let x = 75; x >= 50; x--) {
    const d = tf5SwCenterY(x) - tf5SwCenterY(x + 1);
    const s = Math.sign(d);
    if (s !== 0 && lastSign !== 0 && s !== lastSign) directionFlips++;
    if (s !== 0) lastSign = s;
  }
  assert.ok(directionFlips >= 4, `curvas por la cara en El Sauzal (giros=${directionFlips})`);
  assert.ok(SAUZAL_RADAR_COUNT >= 50, `miles de señales de radar en El Sauzal (${SAUZAL_RADAR_COUNT})`);

  // Recorrido completo en 4x4 desde la entrada sur (117,94) hasta la salida de La Quinta
  const relocate = new Set(m.triggers.filter((t) => t.action.type === 'orotavaCutscene').map((t) => `${t.x},${t.y}`));
  const seen = new Set<string>(['117,94']);
  const q: [number, number][] = [[117, 94]];
  let touchedRelocate = 0;
  for (const [x, y] of q) {
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
      if (seen.has(key) || nx < 0 || ny < 0 || nx >= m.rows[0].length || ny >= m.rows.length) continue;
      const t = tile('tf5', nx, ny);
      if (!DRIVABLE_TILES.has(t) || SOLID[t] || tf5VehicleAt(nx, ny)) continue;
      if (relocate.has(key)) { touchedRelocate++; continue; }
      seen.add(key);
      q.push([nx, ny]);
    }
  }
  assert.ok(seen.has('104,11'), 'alcanza el apartadero del Aeropuerto TFN');
  assert.ok([...seen].some((k) => { const [x, y] = k.split(',').map(Number); return inTacoronteRain(x, y); }), 'cruza la lluvia permanente de Tacoronte');
  assert.ok(seen.has(`63,${tf5SwCenterY(63)}`), 'cruza las curvas de El Sauzal');
  assert.ok(seen.has(`44,${tf5SwCenterY(44)}`), 'cruza La Matanza');
  assert.ok(seen.has(`30,${tf5SwCenterY(30)}`), 'cruza La Victoria');
  assert.ok(seen.has(`21,${tf5SwCenterY(21)}`), 'cruza Santa Úrsula');
  assert.ok(seen.has(`${LA_QUINTA_EXIT.x},${LA_QUINTA_EXIT.y}`), 'alcanza el ramal de salida de La Quinta');
  assert.ok(touchedRelocate > 0, 'el tramo hacia La Orotava intercepta y recoloca en La Quinta');
  assert.equal([...seen].some((k) => Number(k.split(',')[0]) <= 10), false, 'imposible saltarse la recolocación hacia La Orotava');

  // Todos los carteles e hitos de la TF-5 son alcanzables desde el 4x4
  for (const tr of m.triggers.filter((t) => t.kind === 'interact')) {
    assert.ok(DIRS.some(([dx, dy]) => seen.has(`${tr.x + dx},${tr.y + dy}`)), `cartel alcanzable en (${tr.x},${tr.y})`);
  }
  const chillTriggers = m.triggers.filter((t) => t.action.type === 'laQuintaChill');
  assert.ok(chillTriggers.length >= 4 && chillTriggers.every((t) => seen.has(`${t.x},${t.y}`)));
  assert.equal(nearestParrandero('tf5', 16, 83), 'santa_ursula', 'el nuevo centro de Santa Úrsula está junto a La Quinta');
  assert.equal(nearestParrandero('tf5', 116, 90), 'candelaria');
});

run('Entrenadores de la TF-5 (concentrados hasta TFN y algunos después) y renderizado Game Boy', () => {
  const preTfn = TF5_VEHICLES.filter((v) => v.trainer && v.x >= 96);
  const postTfn = TF5_VEHICLES.filter((v) => v.trainer && v.x < 96);
  assert.equal(preTfn.length, 6, 'ultra-cola cargada de entrenadores hasta TFN');
  assert.equal(postTfn.length, 3, 'sigue habiendo algunos entrenadores tras TFN');

  const allIds = [
    ...TACO_UNDERPASS_VEHICLES.flatMap((v) => v.trainer ? [v.trainer] : []),
    ...TF5_VEHICLES.flatMap((v) => v.trainer ? [v.trainer] : []),
  ];
  assert.equal(allIds.length, 10);
  loadPreset('tf5', 'cabra');
  for (const id of allIds) {
    const tr = TRAINERS[id];
    assert.ok(tr, `existe entrenador ${id}`);
    const colors = new Set(tr.deck.map((c) => CARDS[c]?.produces).filter(Boolean));
    for (const cid of tr.deck) {
      const def = CARDS[cid];
      assert.ok(def, `${id}: carta valida ${cid}`);
      for (const col of MANA_COLORS) {
        if (def.mana?.[col]) assert.ok(colors.has(col), `${id}: paga ${col} en ${cid}`);
      }
    }
    let b = createBattle({ name: 'TU', deck: save.deck }, { name: tr.name, deck: tr.deck });
    for (let i = 0; b.winner === null && i < 1200; i++) b = step(b);
    assert.notEqual(b.winner, null, `${id}: duelo termina`);
  }
  const rw = grantTrainerVictory(save, 'tf5_anchieta_1');
  assert.ok(rw);
  assert.ok(claimBoosterReward(save, 0, 'pc').ok);

  // Smoke-render 4 colores (radar, lluvia de Tacoronte, pasarela Anchieta, doble altura Taco y vehiculos)
  const mockCtx = { fillStyle: '', fillRect() {} } as unknown as CanvasRenderingContext2D;
  drawTile(mockCtx, 'radar', 0, 0, 4);
  for (const v of [...TACO_UNDERPASS_VEHICLES, ...TF5_VEHICLES]) drawTf5Vehicle(mockCtx, v, 0, 0, 8);
  drawAnchietaBridge(mockCtx, 112 * 16, 55 * 16);
  drawTacoronteRain(mockCtx, 82 * 16, 20 * 16, 12, true);
  drawCalleTf5Ground(mockCtx, 20 * 16, 0, true);
  drawCalleTf5BridgeOverpass(mockCtx, 20 * 16, 0, 6, { x: 48, y: 80 });
});
