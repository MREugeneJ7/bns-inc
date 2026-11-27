import assert from 'node:assert/strict';
import { F_DATA, FrameDecoder, cobsDecode, cobsEncode, crc16, encodeFrame } from '../src/link/wire';
import { LinkSession, type LinkTimings, type LinkTransport } from '../src/link/session';
import {
  CableClub, applyTrade, battleDigest, canOffer, canonicalDeck, cleanShine, deckCounts, mirrorState, mulberry32,
  validateLinkDeck, type ClubCollection, type Room,
} from '../src/link/club';
import { SerialCable, UsbCable, identifyUsbChip, type SerialPortLike, type UsbDeviceLike } from '../src/link/transports';
import { createBattle, step, type BattleState } from '../src/battle/engine';
import fs from 'node:fs';
import { MAPS, nearestParrandero, type MapId } from '../src/game/maps';
import { CABLE_ARRIVAL, CABLE_STAIRS_1F, isChampion } from '../src/game/mapsCableClub';
import { SOLID } from '../src/game/sprites';
import { exportSaveJSON, importSaveJSON, loadPreset, save } from '../src/game/save';
import { spriteText } from '../src/game/spriteText';

// ---------------------------------------------------------------------------
// CABLE VIRTUAL: se comporta como un UART. Entrega los bytes en trozos de tamaño
// arbitrario, puede voltear bits (ruido) y perder trozos enteros.
// ---------------------------------------------------------------------------
class Wire implements LinkTransport {
  label = 'cable virtual';
  onData: ((d: Uint8Array) => void) | null = null;
  onClose: ((r: string) => void) | null = null;
  peer!: Wire;
  inbox: Uint8Array[] = [];
  cut = false;
  constructor(private readonly cable: VirtualCable) {}
  write(data: Uint8Array) { if (!this.cut) this.cable.carry(this, data); }
  close() { /* nada que soltar */ }
}

class VirtualCable {
  a = new Wire(this);
  b = new Wire(this);
  noise = 0;
  drop = 0;
  flipped = 0;
  private readonly rnd = mulberry32(20240229);
  constructor() { this.a.peer = this.b; this.b.peer = this.a; }
  carry(from: Wire, data: Uint8Array) {
    let i = 0;
    while (i < data.length) {
      const n = 1 + Math.floor(this.rnd() * 37);
      const chunk = data.slice(i, i + n);
      i += n;
      if (this.rnd() < this.drop) continue;
      for (let k = 0; k < chunk.length; k++) if (this.rnd() < this.noise) { chunk[k] ^= 1 << Math.floor(this.rnd() * 8); this.flipped++; }
      from.peer.inbox.push(chunk);
    }
  }
  flush() {
    for (let guard = 0; guard < 200000; guard++) {
      const w = this.a.inbox.length ? this.a : this.b.inbox.length ? this.b : null;
      if (!w) return;
      w.onData?.(w.inbox.shift()!);
    }
    throw new Error('el cable no se vacía');
  }
}

const FAST: LinkTimings = { helloMs: 30, ackMs: 40, pingMs: 100, lostMs: 600, maxRetries: 12 };
let clock = 1000;
async function run(parts: { tick(now: number): void }[], cable: { flush(): void }, ms: number) {
  for (let t = 0; t < ms; t += 10) {
    clock += 10;
    for (const p of parts) p.tick(clock);
    cable.flush();
    await null; // deja correr las promesas de entrega confirmada
    cable.flush();
  }
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function real(parts: { tick(now: number): void }[], ms: number) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const now = Date.now();
    for (const p of parts) p.tick(now);
    await sleep(2);
  }
}
const L = (id: string, n: number) => Array.from({ length: n }, () => id);
const ok = (name: string) => console.log('ok - ' + name);

// ---------------------------------------------------------------------------
// 1. TRAMA: COBS + CRC + resincronización
// ---------------------------------------------------------------------------
{
  const rnd = mulberry32(7);
  for (const len of [0, 1, 2, 253, 254, 255, 256, 508, 509, 700]) {
    for (let round = 0; round < 6; round++) {
      const src = new Uint8Array(len).map(() => (round === 0 ? 0 : round === 1 ? 0xaa : rnd() < 0.2 ? 0 : Math.floor(rnd() * 256)));
      const enc = cobsEncode(src);
      assert.ok(!enc.includes(0), 'COBS no deja ceros dentro');
      assert.deepEqual([...cobsDecode(enc)!], [...src], `COBS ida y vuelta (${len} bytes)`);
    }
  }
  assert.equal(crc16(new TextEncoder().encode('123456789')), 0x29b1, 'CRC-16/CCITT-FALSE de referencia');

  const payload = new Uint8Array([0, 1, 2, 0, 0, 255, 0]);
  const frame = encodeFrame(F_DATA, 7, 9, 3, payload);
  const dec = new FrameDecoder();
  const out = [];
  for (const b of [0x41, 0x42, 0x00, 0x13, 0x37, ...frame, ...frame]) out.push(...dec.push(new Uint8Array([b]))); // basura + byte a byte
  assert.equal(out.length, 2);
  assert.deepEqual([out[0].type, out[0].seq, out[0].ack, out[0].sess, [...out[0].payload]], [F_DATA, 7, 9, 3, [...payload]]);
  assert.ok(dec.bad >= 1, 'la basura previa se descarta sin romper la trama siguiente');

  let caught = 0;
  for (let bit = 0; bit < (frame.length - 2) * 8; bit++) {
    const bad = frame.slice();
    bad[1 + (bit >> 3)] ^= 1 << (bit & 7);
    if (new FrameDecoder().push(bad).length === 0) caught++;
  }
  assert.equal(caught, (frame.length - 2) * 8, 'cualquier bit volteado tira la trama');
  ok('trama: COBS, CRC-16, resincronización tras basura y detección de cualquier bit volteado');
}

// ---------------------------------------------------------------------------
// 2. ENLACE: saludo, roles, mensajes largos, ruido, caída y reinicio
// ---------------------------------------------------------------------------
{
  const cable = new VirtualCable();
  const a = new LinkSession(cable.a, FAST, mulberry32(11));
  const b = new LinkSession(cable.b, FAST, mulberry32(22));
  const gotA: unknown[] = [];
  const gotB: unknown[] = [];
  a.onMessage = (m) => gotA.push(m);
  b.onMessage = (m) => gotB.push(m);
  await run([a, b], cable, 300);
  assert.deepEqual([a.status, b.status], ['linked', 'linked']);
  assert.deepEqual([a.role, b.role].sort(), ['guest', 'host'], 'un anfitrión y un invitado, sin configurar nada');
  const quiet = a.stats.tx;
  await run([a, b], cable, 250);
  assert.ok(a.stats.tx - quiet <= 4, 'enlazados ya no se cruzan saludos, solo el latido');

  const big = { t: 'x', blob: 'ñ€'.repeat(2500) }; // 12,5 KB: 70 trozos
  let delivered = false;
  a.send(big).then(() => { delivered = true; });
  await run([a, b], cable, 500);
  assert.deepEqual(gotB[0], big);
  assert.ok(delivered, 'la promesa de envío se cumple cuando el otro extremo confirma');
  ok('enlace: saludo, roles automáticos y mensaje de 12 KB troceado y recompuesto');

  cable.noise = 0.001;
  cable.drop = 0.01;
  gotB.length = 0;
  for (let i = 0; i < 150; i++) { a.send({ i, pad: 'x'.repeat(i % 90) }).catch(() => undefined); b.send({ j: i }).catch(() => undefined); }
  await run([a, b], cable, 30000);
  assert.deepEqual(gotB.map((m) => (m as { i: number }).i), Array.from({ length: 150 }, (_, i) => i), 'con ruido: todo llega, una vez y en orden');
  assert.deepEqual(gotA.map((m) => (m as { j: number }).j), Array.from({ length: 150 }, (_, i) => i));
  assert.ok(cable.flipped > 0 && a.stats.retx + b.stats.retx > 0 && a.stats.bad + b.stats.bad > 0, 'hubo ruido de verdad y reenvíos');
  assert.deepEqual([a.status, b.status], ['linked', 'linked']);
  ok(`enlace con ruido: 300 mensajes exactos pese a ${cable.flipped} bits volteados, ${a.stats.bad + b.stats.bad} tramas rotas y ${a.stats.retx + b.stats.retx} reenvíos`);

  cable.noise = 0;
  cable.drop = 0;
  const lost: string[] = [];
  a.onLost = (why) => lost.push('a:' + why);
  b.onLost = (why) => lost.push('b:' + why);
  let failed = false;
  cable.a.cut = cable.b.cut = true; // cable arrancado
  a.send({ perdido: true }).catch(() => { failed = true; });
  await run([a, b], cable, 900);
  assert.deepEqual([a.status, b.status], ['searching', 'searching']);
  assert.ok(lost.length === 2 && failed, 'los dos extremos notan la caída y los envíos pendientes fallan');
  cable.a.cut = cable.b.cut = false;
  await run([a, b], cable, 300);
  assert.deepEqual([a.status, b.status], ['linked', 'linked'], 'al volver a enchufar se reengancha solo');

  lost.length = 0;
  const b2 = new LinkSession(cable.b, FAST, mulberry32(99)); // el otro extremo reinicia el juego
  await run([a, b2], cable, 300);
  assert.deepEqual(lost, ['a:peer-reset']);
  assert.deepEqual([a.status, b2.status], ['linked', 'linked']);
  ok('enlace: cable arrancado, reenganche y reinicio del otro extremo');

  const loop = new VirtualCable();
  loop.a.peer = loop.a; // TX puenteado con RX
  const solo = new LinkSession(loop.a, FAST, mulberry32(5));
  await run([solo], loop, 200);
  assert.equal(solo.status, 'loopback');
  ok('enlace: un cable puenteado sobre sí mismo se detecta (prueba de cable con un solo adaptador)');
}

// ---------------------------------------------------------------------------
// 3. CLUB DEL CABLE
// ---------------------------------------------------------------------------
const deckA = [...L('tierra_volcan', 7), ...L('tierra_laurisilva', 7), ...L('baifo', 4), ...L('cabra', 4), ...L('cabra_chispera', 3), ...L('cabra_titan_teide', 2), ...L('mojo', 2), ...L('tolete', 2)];
const deckB = [...L('tierra_charco', 8), ...L('tierra_playa', 6), ...L('choco', 4), ...L('vieja', 4), ...L('calamar', 3), ...L('angelote', 3), ...L('clipper', 2), ...L('chola', 2)];
const col = (deck: string[], pc: string[]): ClubCollection => ({ deck: [...deck], pc: [...pc], shine: {}, flags: {}, linkStats: { wins: 0, losses: 0, trades: 0 } });
function clubPair(roomA: Room, roomB: Room, colA: ClubCollection, colB: ClubCollection, cable = new VirtualCable()) {
  const saved = { a: 0, b: 0 };
  const A = new CableClub(cable.a, roomA, colA, () => { saved.a++; }, { timings: FAST, rnd: mulberry32(5) });
  const B = new CableClub(cable.b, roomB, colB, () => { saved.b++; }, { timings: FAST, rnd: mulberry32(6) });
  return { cable, A, B, saved };
}
const all = (c: ClubCollection) => [...c.deck, ...c.pc];

{
  assert.equal(validateLinkDeck(deckCounts(deckA)), null);
  assert.match(validateLinkDeck({ cabra: 5, tierra_volcan: 30 })!, /más de 4 copias/);
  assert.match(validateLinkDeck({ carta_inventada: 1, tierra_volcan: 30 })!, /desconocida/);
  assert.match(validateLinkDeck({ __proto__: 1, tierra_volcan: 30 } as never) ?? 'ok', /ok/); // literal: sin clave propia
  assert.match(validateLinkDeck(JSON.parse('{"__proto__":1,"tierra_volcan":30}'))!, /desconocida/);
  assert.match(validateLinkDeck({ tierra_volcan: 10 })!, /al menos 20/);
  assert.match(validateLinkDeck({ tierra_volcan: 61 })!, /pasa de 60/);
  assert.match(validateLinkDeck({ unelco: 2, tierra_volcan: 30 })!, /legendaria/);
  assert.match(validateLinkDeck({ cabra: 1.5, tierra_volcan: 30 })!, /imposible/);
  assert.deepEqual(cleanShine({ cabra_titan_teide: 3, fuera_del_mazo: 9 }, deckCounts(deckA)), { cabra_titan_teide: 3 });
  assert.equal(cleanShine({ baifo: 2 }, deckCounts(deckA)), null, 'solo brillan las últimas etapas (fusión legal)');
  assert.equal(cleanShine({ cabra_titan_teide: -1 }, deckCounts(deckA)), null);
  assert.deepEqual(canonicalDeck({ b: 2, a: 1 }), ['a', 'b', 'b']);
  ok('reglas del cable: mazos ilegales y brillos imposibles se rechazan');
}

{
  const colA = col(deckA, ['cabra_titan_teide', 'burgado_1ed']);
  colA.flags.cert_burgado_1ed = true;
  const colB = col(deckB, ['vieja_abismo']);
  const { cable, A, B, saved } = clubPair('trade', 'trade', colA, colB);
  await run([A, B], cable, 400);
  assert.ok(A.snapshot.ok && B.snapshot.ok, 'enlazados y en la misma sala');
  A.offer('tierra_volcan');
  assert.match(A.snapshot.notice!, /magomones/, 'las tierras no son magomones');
  A.offer('burgado_1ed');
  B.offer('vieja_abismo');
  await run([A, B], cable, 200);
  assert.deepEqual([A.snapshot.trade.theirs, B.snapshot.trade.theirs, B.snapshot.trade.theirsCert], ['vieja_abismo', 'burgado_1ed', true]);
  A.setReady(true);
  await run([A, B], cable, 200);
  assert.ok(B.snapshot.trade.theirReady && colA.pc.includes('burgado_1ed'), 'con una sola confirmación no se mueve nada');
  B.setReady(true);
  await run([A, B], cable, 300);
  assert.ok(!all(colA).includes('burgado_1ed') && all(colA).includes('vieja_abismo'));
  assert.ok(!all(colB).includes('vieja_abismo') && colB.deck.includes('burgado_1ed'), 'la 1ª edición certificada entra directa al mazo');
  assert.ok(colB.flags.cert_burgado_1ed && colB.flags.seen_burgado_1ed, 'el certificado y la Magodex viajan con la carta');
  assert.deepEqual([colA.linkStats.trades, colB.linkStats.trades, saved.a, saved.b], [1, 1, 1, 1], 'un intercambio, guardado en los dos extremos');
  assert.deepEqual([A.snapshot.trade.mine, A.snapshot.trade.theirs, B.snapshot.trade.mine], [null, null, null]);
  assert.deepEqual(A.snapshot.trade.last, { gave: 'burgado_1ed', got: 'vieja_abismo', dest: 'deck' });
  ok('intercambio: hacen falta las dos confirmaciones y las cartas cambian de mano una sola vez');

  // Carreras: los dos extremos tocan botones al azar con ruido en el cable. Pase lo que pase,
  // no se crea ni se pierde ninguna carta y los dos extremos acaban viendo lo mismo.
  const fa = col(deckA, ['cabra_titan_teide', 'baifo', 'cabra']);
  const fb = col(deckB, ['vieja_abismo', 'choco', 'angelote']);
  const before = [...all(fa), ...all(fb)].sort();
  const sizes = [all(fa).length, all(fb).length];
  const f = clubPair('trade', 'trade', fa, fb);
  let drops = 0;
  for (const c of [f.A, f.B]) { const prev = c.link.onLost; c.link.onLost = (w) => { drops++; prev?.(w); }; }
  await run([f.A, f.B], f.cable, 400);
  f.cable.noise = 0.0005;
  f.cable.drop = 0.005;
  const rnd = mulberry32(31337);
  const pick = (c: ClubCollection) => { const ids = all(c).filter((id) => canOffer(c, id) === null); return ids[Math.floor(rnd() * ids.length)]; };
  for (let i = 0; i < 400; i++) {
    const who = rnd() < 0.5 ? f.A : f.B;
    const c = who === f.A ? fa : fb;
    const r = rnd();
    if (r < 0.3) who.offer(pick(c));
    else if (r < 0.85) who.setReady(true);
    else if (r < 0.95) who.setReady(false);
    else who.offer(null);
    await run([f.A, f.B], f.cable, Math.floor(rnd() * 4) * 10);
  }
  await run([f.A, f.B], f.cable, 3000);
  assert.equal(drops, 0, 'el enlace aguantó todo el baile');
  assert.deepEqual([...all(fa), ...all(fb)].sort(), before, 'no se crea ni se destruye ninguna carta');
  assert.deepEqual([all(fa).length, all(fb).length], sizes, 'cada intercambio es uno por uno');
  assert.equal(fa.linkStats.trades, fb.linkStats.trades, 'los dos extremos cuentan los mismos intercambios');
  assert.ok(fa.linkStats.trades >= 5, `hubo intercambios de verdad (${fa.linkStats.trades})`);
  assert.deepEqual([f.A.snapshot.trade.mine, f.A.snapshot.trade.theirs], [f.B.snapshot.trade.theirs, f.B.snapshot.trade.mine], 'los dos ven la misma mesa');
  ok(`intercambio a lo loco: 400 pulsaciones cruzadas con ruido, ${fa.linkStats.trades} intercambios, ni una carta de más ni de menos`);

  const lone = col(['cabra'], []);
  assert.match(canOffer(lone, 'cabra')!, /última carta/);
  assert.equal(applyTrade(lone, 'cabra', 'choco', false), null);
  const m = clubPair('trade', 'battle', col(deckA, []), col(deckB, []));
  await run([m.A, m.B], m.cable, 400);
  assert.ok(!m.A.snapshot.ok && /misma sala/.test(m.A.snapshot.fatal!) && /misma sala/.test(m.B.snapshot.fatal!));
  ok('salas distintas: el enlace se hace pero no deja operar hasta estar los dos en la misma');
}

async function fight(cable: VirtualCable, cA: ClubCollection, cB: ClubCollection) {
  const p = clubPair('battle', 'battle', cA, cB, cable);
  await run([p.A, p.B], cable, 400);
  p.A.battleReady();
  await run([p.A, p.B], cable, 150);
  assert.deepEqual([p.A.snapshot.battle.phase, p.B.snapshot.battle.theirReady], ['waiting', true]);
  p.B.battleReady();
  await run([p.A, p.B], cable, 300);
  assert.deepEqual([p.A.snapshot.battle.phase, p.B.snapshot.battle.phase], ['running', 'running']);
  return p;
}
const untilOver = async (p: { A: CableClub; B: CableClub; cable: VirtualCable }) => {
  for (let i = 0; i < 6000 && (p.A.snapshot.battle.phase === 'running' || p.B.snapshot.battle.phase === 'running'); i++) await run([p.A, p.B], p.cable, 100);
};

{
  const pA = { name: 'A', deck: canonicalDeck(deckCounts(deckA)), shine: { cabra_titan_teide: 2 } };
  const pB = { name: 'B', deck: canonicalDeck(deckCounts(deckB)) };
  const d1 = battleDigest(createBattle(pA, pB, { rnd: mulberry32(7) }));
  assert.equal(d1, battleDigest(createBattle(pA, pB, { rnd: mulberry32(7) })), 'misma semilla, misma baraja');
  assert.notEqual(d1, battleDigest(createBattle(pA, pB, { rnd: mulberry32(8) })));
  assert.ok(!('viewer' in createBattle(pA, pB)), 'el combate de un jugador no cambia de forma');
  let s: BattleState = createBattle(pA, pB, { rnd: mulberry32(7) });
  for (let i = 0; i < 40; i++) s = step(s);
  const mm = mirrorState(mirrorState(s));
  assert.equal(battleDigest(mm), battleDigest(s), 'dar la vuelta dos veces deja el estado igual');
  assert.deepEqual([mirrorState(s).players[0].name, mirrorState(s).active], ['B', s.active === 0 ? 1 : 0]);

  const cA = col(deckA, []);
  cA.shine = { cabra_titan_teide: 2 };
  const cB = col(deckB, []);
  const p = await fight(new VirtualCable(), cA, cB);
  await run([p.A, p.B], p.cable, 20000);
  const va = p.A.snapshot.battle.view!;
  const vb = p.B.snapshot.battle.view!;
  assert.ok(p.A.snapshot.battle.n > 8 && p.A.snapshot.battle.n === p.B.snapshot.battle.n, 'las dos consolas van por el mismo paso');
  assert.deepEqual([va.players[0].name, vb.players[0].name], ['TU', 'TU'], 'cada uno se ve a sí mismo abajo');
  assert.deepEqual([va.players[0].life, va.players[0].hand.length, va.players[0].board.length], [vb.players[1].life, vb.players[1].hand.length, vb.players[1].board.length]);
  assert.equal(va.active, vb.active === 0 ? 1 : 0);
  assert.notEqual(p.A.snapshot.battle.iStart, p.B.snapshot.battle.iStart, 'solo uno abre partida');
  for (const v of [va, vb]) {
    const draws = v.log.filter((l) => /^T\d+: (TU|RIVAL) (endereza y )?roba /.test(l));
    assert.ok(draws.length > 4);
    for (const l of draws) assert.equal(/RIVAL/.test(l), / roba carta\./.test(l), 'se ven mis robos y no los del rival: ' + l);
  }
  await untilOver(p);
  assert.deepEqual([p.A.snapshot.battle.phase, p.B.snapshot.battle.phase], ['over', 'over']);
  assert.deepEqual([p.A.snapshot.battle.result, p.B.snapshot.battle.result].sort(), ['lose', 'win'], 'uno gana y el otro pierde');
  assert.equal(p.A.snapshot.battle.n, p.B.snapshot.battle.n);
  assert.deepEqual([cA.linkStats.wins + cB.linkStats.wins, cA.linkStats.losses + cB.linkStats.losses, p.saved.a, p.saved.b], [1, 1, 1, 1]);
  assert.equal(cA.linkStats.wins === 1, p.A.snapshot.battle.result === 'win');
  assert.equal(p.A.snapshot.battle.view!.winner === 0, p.A.snapshot.battle.result === 'win', 'la pantalla dice lo mismo que el marcador');
  ok(`combate por cable: ${p.A.snapshot.battle.n} pasos idénticos en las dos consolas, vistas espejadas y un solo ganador`);

  // Revancha por el mismo enlace, ahora con ruido en el cable.
  p.A.battleLeave();
  p.B.battleLeave();
  p.cable.noise = 0.0005;
  p.cable.drop = 0.005;
  p.B.battleReady();
  await run([p.A, p.B], p.cable, 300);
  p.A.battleReady();
  await run([p.A, p.B], p.cable, 600);
  assert.deepEqual([p.A.snapshot.battle.phase, p.B.snapshot.battle.phase], ['running', 'running']);
  await untilOver(p);
  assert.deepEqual([p.A.snapshot.battle.phase, p.B.snapshot.battle.phase], ['over', 'over']);
  assert.deepEqual([p.A.snapshot.battle.result, p.B.snapshot.battle.result].sort(), ['lose', 'win']);
  assert.ok(p.A.link.stats.retx + p.B.link.stats.retx > 0);
  ok('revancha con ruido en el cable: el combate termina igual en los dos extremos');
}

{
  const cA = col(deckA, []);
  const cB = col(deckB, []);
  const p = await fight(new VirtualCable(), cA, cB);
  await run([p.A, p.B], p.cable, 6000);
  const guest = p.A.link.role === 'guest' ? p.A : p.B;
  (guest as unknown as { bState: BattleState }).bState.players[0].life -= 1; // una consola hace trampas o se corrompe
  await run([p.A, p.B], p.cable, 3000);
  assert.deepEqual([p.A.snapshot.battle.phase, p.B.snapshot.battle.phase], ['void', 'void']);
  assert.deepEqual([cA.linkStats, cB.linkStats], [{ wins: 0, losses: 0, trades: 0 }, { wins: 0, losses: 0, trades: 0 }]);
  ok('combate: si las dos consolas dejan de coincidir, la partida es nula y nadie puntúa');

  const q = await fight(new VirtualCable(), col(deckA, []), col(deckB, []));
  await run([q.A, q.B], q.cable, 4000);
  q.cable.a.cut = q.cable.b.cut = true;
  await run([q.A, q.B], q.cable, 1500);
  assert.deepEqual([q.A.snapshot.battle.phase, q.B.snapshot.battle.phase], ['void', 'void']);
  assert.match(q.A.snapshot.battle.why!, /cable/);
  ok('combate: arrancar el cable a mitad anula la partida en los dos extremos');

  const r = clubPair('battle', 'battle', col(L('tierra_volcan', 5), []), col(deckB, []));
  await run([r.A, r.B], r.cable, 400);
  r.A.battleReady();
  assert.deepEqual([r.A.snapshot.battle.phase, /al menos 20/.test(r.A.snapshot.notice!)], ['lobby', true]);
  ok('combate: un mazo que no cumple las reglas no sale de la sala');
}

// ---------------------------------------------------------------------------
// 4. TRANSPORTES contra dobles de las APIs del navegador
// ---------------------------------------------------------------------------
function fakeSerialPair() {
  class Port implements SerialPortLike {
    peer!: Port;
    info: Record<string, unknown> = { usbVendorId: 0x0403, usbProductId: 0x6001 };
    openedWith: Record<string, unknown> | null = null;
    closedClean = false;
    readable: ReadableStream<Uint8Array> | null = null;
    writable: WritableStream<Uint8Array> | null = null;
    private ctrl: ReadableStreamDefaultController<Uint8Array> | null = null;
    private fresh() { this.readable = new ReadableStream<Uint8Array>({ start: (c) => { this.ctrl = c; } }); }
    async open(o: Record<string, unknown>) {
      this.openedWith = o;
      this.fresh();
      this.writable = new WritableStream<Uint8Array>({ write: (chunk) => { this.peer.feed(chunk); } });
    }
    feed(chunk: Uint8Array) { if (this.ctrl && this.readable) for (let i = 0; i < chunk.length; i += 7) this.ctrl.enqueue(chunk.slice(i, i + 7)); }
    lineError() { const c = this.ctrl; this.fresh(); c?.error(Object.assign(new Error('framing'), { name: 'FramingError' })); }
    unplug() { const c = this.ctrl; this.readable = null; this.ctrl = null; c?.error(Object.assign(new Error('gone'), { name: 'NetworkError' })); }
    async close() {
      // Como Chrome: no deja cerrar un puerto con un lector o un escritor todavía enganchado.
      if (this.readable?.locked || this.writable?.locked) throw Object.assign(new Error('locked'), { name: 'InvalidStateError' });
      this.closedClean = true;
      this.readable = null;
      this.writable = null;
    }
    getInfo() { return this.info; }
    async setSignals() { /* tres hilos */ }
  }
  const a = new Port();
  const b = new Port();
  a.peer = b;
  b.peer = a;
  return { a, b };
}

{
  const { a: pa, b: pb } = fakeSerialPair();
  const ca = await SerialCable.open(pa);
  const cb = await SerialCable.open(pb);
  assert.deepEqual([pa.openedWith!.baudRate, pa.openedWith!.dataBits, pa.openedWith!.parity, pa.openedWith!.flowControl], [115200, 8, 'none', 'none']);
  assert.match(ca.label, /0403:6001/);
  const sa = new LinkSession(ca, FAST, mulberry32(1));
  const sb = new LinkSession(cb, FAST, mulberry32(2));
  const got: unknown[] = [];
  sb.onMessage = (m) => got.push(m);
  await real([sa, sb], 300);
  assert.deepEqual([sa.status, sb.status], ['linked', 'linked']);
  sa.send({ hola: 'cable' }).catch(() => undefined);
  await real([sa, sb], 150);
  pb.lineError(); // error de trama en la línea: el navegador rehace el stream de lectura
  sa.send({ tras: 'el error' }).catch(() => undefined);
  await real([sa, sb], 300);
  assert.deepEqual(got, [{ hola: 'cable' }, { tras: 'el error' }], 'la lectura sobrevive a un error de línea');
  await ca.close();
  assert.ok(pa.closedClean, 'cierra soltando lector y escritor en el orden que exige el navegador');
  pb.unplug();
  await real([sb], 60);
  assert.equal(sb.status, 'closed');
  assert.match(sb.closeReason!, /desenchufado/);
  const bt = fakeSerialPair().a;
  bt.info = { bluetoothServiceClassId: '00001101-0000-1000-8000-00805f9b34fb' };
  await assert.rejects(SerialCable.open(bt), /Bluetooth/);
  assert.equal(bt.openedWith, null, 'un puerto Bluetooth ni se abre: aquí solo cable');
  ok('Web Serial: 115200 8N1, enlace real sobre streams, error de línea, cierre limpio, desenchufe y veto a Bluetooth');
}

function fakeUsb(vendorId: number, productId: number, o: { ftdi?: boolean; major?: number; cdc?: boolean; ifaces?: number } = {}) {
  class Dev implements UsbDeviceLike {
    vendorId = vendorId;
    productId = productId;
    deviceVersionMajor = o.major ?? 6;
    productName = 'doble';
    peer: Dev | null = null;
    isOpen = false;
    rx: number[] = [];
    control: (number | string | number[])[][] = [];
    claimed: number[] = [];
    configuration = {
      interfaces: Array.from({ length: o.ifaces ?? 1 }, (_, n) => ({
        interfaceNumber: n,
        alternate: {
          interfaceClass: o.cdc ? (n === 0 ? 0x02 : 0x0a) : 0xff,
          endpoints: o.cdc && n === 0
            ? [{ endpointNumber: 3, direction: 'in' as const, type: 'interrupt', packetSize: 8 }]
            : [{ endpointNumber: 1, direction: 'in' as const, type: 'bulk', packetSize: 64 }, { endpointNumber: 2, direction: 'out' as const, type: 'bulk', packetSize: 64 }],
        },
      })),
    };
    async open() { this.isOpen = true; }
    async close() { this.isOpen = false; }
    async selectConfiguration() { /* ya activa */ }
    async claimInterface(n: number) { this.claimed.push(n); }
    async controlTransferOut(s: { requestType: string; recipient: string; request: number; value: number; index: number }, data?: Uint8Array) {
      this.control.push([`${s.requestType}/${s.recipient}`, s.request, s.value, s.index, ...(data ? [[...data]] : [])]);
    }
    async controlTransferIn() { return { data: new DataView(new Uint8Array([0x31, 0x00]).buffer), status: 'ok' }; }
    async transferIn(_ep: number, len: number) {
      await sleep(1);
      if (!this.isOpen) throw Object.assign(new Error('gone'), { name: 'NetworkError' });
      const head = o.ftdi ? [0x01, 0x60] : []; // un FTDI antepone 2 bytes de estado a cada paquete
      return { data: new DataView(new Uint8Array([...head, ...this.rx.splice(0, len - head.length)]).buffer), status: 'ok' };
    }
    async transferOut(_ep: number, data: Uint8Array) { if (this.peer?.isOpen) this.peer.rx.push(...data); }
  }
  return new Dev();
}

{
  const ua = fakeUsb(0x0403, 0x6001, { ftdi: true });
  const ub = fakeUsb(0x0403, 0x6001, { ftdi: true });
  ua.peer = ub;
  ub.peer = ua;
  const xa = await UsbCable.open(ua);
  const xb = await UsbCable.open(ub);
  assert.equal(xa.chip, 'ftdi');
  assert.deepEqual(ua.control, [
    ['vendor/device', 0x00, 0x0000, 0], // reset
    ['vendor/device', 0x03, 0x001a, 0], // 3 MHz / 26 = 115384 baudios
    ['vendor/device', 0x04, 0x0008, 0], // 8N1
    ['vendor/device', 0x02, 0x0000, 0], // sin control de flujo
    ['vendor/device', 0x09, 0x0002, 0], // latencia
    ['vendor/device', 0x01, 0x0303, 0], // DTR + RTS
  ]);
  const sa = new LinkSession(xa, FAST, mulberry32(1));
  const sb = new LinkSession(xb, FAST, mulberry32(2));
  const got: unknown[] = [];
  sa.onMessage = (m) => got.push(m);
  await real([sa, sb], 500);
  assert.deepEqual([sa.status, sb.status], ['linked', 'linked'], 'los bytes de estado del FTDI se quitan (si no, no cuadraría ningún CRC)');
  sb.send({ desde: 'usb', relleno: 'z'.repeat(400) }).catch(() => undefined);
  await real([sa, sb], 500);
  assert.deepEqual(got, [{ desde: 'usb', relleno: 'z'.repeat(400) }]);
  await xa.close();
  await xb.close();

  const h = fakeUsb(0x0403, 0x6014, { ftdi: true, major: 9 }); // FT232H: reloj de 120 MHz
  await (await UsbCable.open(h)).close();
  assert.deepEqual(h.control[1], ['vendor/device', 0x03, 0xc068, 0x0200]);
  const dual = fakeUsb(0x0403, 0x6010, { ftdi: true, major: 5, ifaces: 2 }); // FT2232: canal A = índice 1
  await (await UsbCable.open(dual)).close();
  assert.deepEqual(dual.control[1], ['vendor/device', 0x03, 0x001a, 1]);

  const cp = fakeUsb(0x10c4, 0xea60);
  await (await UsbCable.open(cp)).close();
  assert.deepEqual(cp.control, [
    ['vendor/interface', 0x00, 0x0001, 0],
    ['vendor/interface', 0x1e, 0x0000, 0, [0x00, 0xc2, 0x01, 0x00]], // 115200 en little endian
    ['vendor/interface', 0x03, 0x0800, 0],
    ['vendor/interface', 0x07, 0x0303, 0],
  ]);
  const ch = fakeUsb(0x1a86, 0x7523);
  await (await UsbCable.open(ch)).close();
  assert.deepEqual(ch.control, [
    ['vendor/device', 0xa1, 0x0000, 0],
    ['vendor/device', 0x9a, 0x1312, 0xcc83],
    ['vendor/device', 0x9a, 0x2518, 0x00c3],
    ['vendor/device', 0xa4, 0xff9f, 0],
  ]);
  const cdc = fakeUsb(0x2e8a, 0x000a, { cdc: true, ifaces: 2 });
  const xc = await UsbCable.open(cdc);
  assert.deepEqual([xc.chip, cdc.claimed, cdc.control[0]], ['cdc', [1, 0], ['class/interface', 0x20, 0x0000, 0, [0x00, 0xc2, 0x01, 0x00, 0, 0, 8]]]);
  await xc.close();
  const bridge = fakeUsb(0x067b, 0x25a1);
  const xbr = await UsbCable.open(bridge);
  assert.deepEqual([xbr.chip, bridge.control], ['bridge', [['vendor/device', 3, 0x99, 0]]]);
  await xbr.close();
  assert.equal(identifyUsbChip(fakeUsb(0x067b, 0x2303)), null, 'un PL2303 serie no se confunde con un cable puente');
  const unknown = fakeUsb(0x1234, 0x5678);
  await assert.rejects(UsbCable.open(unknown), /no es un adaptador/);
  assert.equal(unknown.isOpen, false);
  ok('WebUSB: drivers FTDI (clásico, FT232H, FT2232), CP210x, CH34x, CDC-ACM y puente; enlace real sobre el doble FTDI');
}

// ---------------------------------------------------------------------------
// 5. LA SEGUNDA PLANTA DENTRO DEL JUEGO
// ---------------------------------------------------------------------------
{
  const tileOf = (id: MapId, x: number, y: number) => { const m = MAPS[id]; return m.legend[m.rows[y]?.[x] ?? ''] ?? 'wall'; };
  const reach = (id: MapId, sx: number, sy: number) => {
    const m = MAPS[id];
    const seen = new Set([`${sx},${sy}`]);
    const q: [number, number][] = [[sx, sy]];
    for (const [x, y] of q) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (seen.has(k) || ny < 0 || ny >= m.rows.length || nx < 0 || nx >= m.rows[0].length) continue;
      if (SOLID[tileOf(id, nx, ny)] || m.npcs.some((n) => n.x === nx && n.y === ny)) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
    return seen;
  };
  const up = MAPS.parrandero_2;
  assert.equal(new Set(up.rows.map((r) => r.length)).size, 1, 'mapa rectangular');
  for (const row of up.rows) for (const ch of row) assert.ok(up.legend[ch], `baldosa conocida: ${ch}`);
  const seen = reach('parrandero_2', CABLE_ARRIVAL.x, CABLE_ARRIVAL.y);
  const near = (x: number, y: number) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(`${x + dx},${y + dy}`));
  for (const t of up.triggers) {
    if (t.kind === 'step') assert.ok(seen.has(`${t.x},${t.y}`), `se puede pisar (${t.x},${t.y})`);
    else assert.ok(SOLID[tileOf('parrandero_2', t.x, t.y)] && near(t.x, t.y), `se puede tocar (${t.x},${t.y})`);
  }
  for (const n of up.npcs) assert.ok(near(n.x, n.y), 'se puede hablar con ' + n.id);
  const links = up.triggers.filter((t) => t.action.type === 'cableClub');
  assert.equal(links.length, 8);
  for (const t of links) assert.equal(t.action.type === 'cableClub' && t.action.room, t.x < 7 ? 'trade' : 'battle', 'cada sala abre lo suyo');
  const down = up.triggers.find((t) => t.action.type === 'warp')!;
  assert.ok(down.action.type === 'warp' && down.action.to === 'parrandero' && tileOf('parrandero', down.action.x, down.action.y) === 'floor', 'la escalera baja a suelo firme');

  assert.equal(tileOf('parrandero', CABLE_STAIRS_1F.x, CABLE_STAIRS_1F.y), 'stairs');
  const ground = reach('parrandero', 4, 7);
  assert.ok(ground.has(`${CABLE_STAIRS_1F.x},${CABLE_STAIRS_1F.y}`), 'la escalera se alcanza desde la puerta del centro');
  assert.ok(ground.has('7,1') && ground.has('4,8'), 'el PC de Ayoze y la salida siguen donde estaban');
  assert.ok(MAPS.parrandero.triggers.some((t) => t.kind === 'step' && t.x === CABLE_STAIRS_1F.x && t.y === CABLE_STAIRS_1F.y && t.action.type === 'cableStairs'));
  assert.equal(MAPS.parrandero.triggers.filter((t) => t.action.type === 'openPC' || t.action.type === 'exitParrandero').length, 2);
  assert.equal(nearestParrandero('parrandero_2', 7, 8, 'galdar'), 'galdar', 'una pájara arriba te deja en el mismo centro');
  assert.match(spriteText('parrandero_2', 'bench', 2, 3)!, /cable/);

  loadPreset('montana_blanca', 'cabra');
  assert.equal(isChampion(save), false, 'sin vencer a Bencomo, la cadena sigue puesta');
  loadPreset('cueva_magec', 'cabra');
  assert.equal(isChampion(save), true, 'el salto de depuración de campeón abre la 2ª planta');
  assert.equal(isChampion({ flags: {}, beaten: { alto_mando_bencomo: 1 } }), true, 'partidas de antes de la bandera');

  save.linkStats = { wins: 3, losses: 2, trades: 7 };
  const json = exportSaveJSON();
  save.linkStats = { wins: 0, losses: 0, trades: 0 };
  assert.ok(importSaveJSON(json));
  assert.deepEqual(save.linkStats, { wins: 3, losses: 2, trades: 7 }, 'el marcador del Club viaja en el guardado');
  const legacy = JSON.parse(json);
  delete legacy.linkStats;
  assert.ok(importSaveJSON(JSON.stringify(legacy)));
  assert.deepEqual(save.linkStats, { wins: 0, losses: 0, trades: 0 }, 'las partidas antiguas se cargan con el marcador a cero');

  const gc = fs.readFileSync('src/game/GameCanvas.tsx', 'utf8');
  assert.ok(gc.includes("'parrandero', 'parrandero_2', 'colegio'"), 'la 2ª planta es interior (sin coche)');
  assert.ok(gc.indexOf("case 'cableStairs':") > 0 && gc.includes('if (isChampion(save)) {'), 'la escalera comprueba al campeón');
  ok('2ª planta: mapa alcanzable, una sala para cada cosa, escalera solo para el campeón y marcador en el guardado');
}

console.log('CABLE LINK: todas las pruebas pasan');
