import { CARDS, MAX_COPIES, MAX_DECK, isFinalStage } from '../battle/cards';
import { canAddToDeck, type Collection } from '../battle/booster';
import { createBattle, step, type BattleState } from '../battle/engine';
import { DEFAULT_TIMINGS, LinkSession, type LinkStatus, type LinkTimings, type LinkTransport } from './session';

/**
 * CLUB DEL CABLE · lógica de las dos salas, encima del enlace fiable.
 *
 * INTERCAMBIO: cada uno ofrece un magomón y confirma. Solo el anfitrión cierra el trato,
 * y lo aplica cuando el otro extremo ha confirmado la recepción del cierre. Con el cable
 * puesto no hay carrera posible; si alguien arranca el cable justo en ese instante puede
 * quedar una carta duplicada, igual que pasaba con los cartuchos de verdad.
 *
 * COMBATE: los dos extremos simulan EL MISMO combate. Se cruzan los mazos y una semilla,
 * barajan igual y avanzan paso a paso al ritmo que marca el anfitrión. Cada paso viaja
 * con una huella del estado: si las dos máquinas dejan de coincidir, el combate es nulo.
 * Nadie retransmite la partida al otro; cada consola la calcula y el cable las mantiene a la par.
 */

export const CLUB_PROTO = 1;
export const LINK_MIN_DECK = 20;
/** Los combates por cable van algo más vivos que el autobattle normal. */
const LINK_SPEED = 1.5;
const INTRO_MS = 1500;

export type Room = 'trade' | 'battle';

export interface LinkStats {
  wins: number;
  losses: number;
  trades: number;
}

export interface ClubCollection extends Collection {
  flags: Record<string, boolean>;
  linkStats: LinkStats;
}

const card = (id: unknown) => (typeof id === 'string' && Object.prototype.hasOwnProperty.call(CARDS, id) ? CARDS[id] : undefined);

const fnv = (h: number, s: string): number => {
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h;
};

let catalogMemo: string | null = null;
/** Huella del catálogo de cartas: dos versiones distintas del juego no pueden combatir (desincronizarían). */
export function catalogHash(): string {
  if (catalogMemo) return catalogMemo;
  let h = 0x811c9dc5;
  for (const id of Object.keys(CARDS).sort()) {
    const c = CARDS[id];
    h = fnv(h, JSON.stringify([id, c.type, c.atk ?? 0, c.hp ?? 0, c.mana ?? null, c.keywords ?? [], c.effect ?? null,
      c.produces ?? null, !!c.producesAny, !!c.legendary, c.stage ?? 0, c.chain ?? '']));
  }
  catalogMemo = (h >>> 0).toString(36);
  return catalogMemo;
}

/** Generador con semilla: mismo número de entrada, misma baraja en los dos extremos. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function deckCounts(deck: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of deck) out[id] = (out[id] ?? 0) + 1;
  return out;
}

/** Mazo en orden canónico: los dos extremos parten exactamente de la misma lista antes de barajar. */
export function canonicalDeck(counts: Record<string, number>): string[] {
  const out: string[] = [];
  for (const id of Object.keys(counts).sort()) for (let i = 0; i < counts[id]; i++) out.push(id);
  return out;
}

/** Reglas de mazo para el cable (las mismas del juego). Devuelve el motivo si no vale. */
export function validateLinkDeck(counts: unknown): string | null {
  if (!counts || typeof counts !== 'object' || Array.isArray(counts)) return 'mazo ilegible.';
  let total = 0;
  for (const [id, n] of Object.entries(counts as Record<string, unknown>)) {
    const c = card(id);
    if (!c) return `carta desconocida (${id}).`;
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 1) return `cantidad imposible de ${c.name}.`;
    if (c.legendary && n > 1) return `${c.name} es legendaria: solo 1 copia.`;
    if (c.type !== 'land' && n > MAX_COPIES) return `más de ${MAX_COPIES} copias de ${c.name}.`;
    total += n;
  }
  if (total < LINK_MIN_DECK) return `hacen falta al menos ${LINK_MIN_DECK} cartas (hay ${total}).`;
  if (total > MAX_DECK) return `pasa de ${MAX_DECK} cartas.`;
  return null;
}

/** Brillo legal: solo criaturas en su última etapa (5 copias fundidas = +1/+1). null si es imposible. */
export function cleanShine(shine: unknown, counts: Record<string, number>): Record<string, number> | null {
  if (shine === undefined || shine === null) return {};
  if (typeof shine !== 'object' || Array.isArray(shine)) return null;
  const out: Record<string, number> = {};
  for (const [id, n] of Object.entries(shine as Record<string, unknown>)) {
    if (!Object.prototype.hasOwnProperty.call(counts, id)) continue; // brillo de cartas que no van en el mazo
    const c = card(id);
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > 9999) return null;
    if (n === 0) continue;
    if (!c || c.type !== 'creature' || !isFinalStage(id)) return null;
    out[id] = n;
  }
  return out;
}

/** Magomones (criaturas) que se pueden ofrecer, con cuántas copias hay entre mazo y PC. */
export function tradeable(col: Collection): { id: string; owned: number }[] {
  const n: Record<string, number> = {};
  for (const id of [...col.deck, ...col.pc]) if (card(id)?.type === 'creature') n[id] = (n[id] ?? 0) + 1;
  return Object.keys(n)
    .sort((a, b) => CARDS[a].name.localeCompare(CARDS[b].name))
    .map((id) => ({ id, owned: n[id] }));
}

export function canOffer(col: Collection, id: string): string | null {
  const c = card(id);
  if (!c || c.type !== 'creature') return 'Solo se intercambian magomones (criaturas).';
  const inPc = col.pc.includes(id);
  if (!inPc && !col.deck.includes(id)) return 'Esa carta ya no está en tu colección.';
  if (!inPc && col.deck.length <= 1) return 'Es la última carta de tu mazo: no te puedes quedar sin mazo.';
  return null;
}

/**
 * Aplica un intercambio a la colección: sale `give` (del PC si hay copia allí, si no del mazo)
 * y entra `get` (al mazo si cabe; si no, al PC de Ayoze). El certificado de 1ª edición viaja
 * con la carta; el brillo no, porque es entrenamiento de cada colección.
 */
export function applyTrade(col: ClubCollection, give: string, get: string, cert: boolean): 'deck' | 'pc' | null {
  if (canOffer(col, give) !== null || card(get)?.type !== 'creature') return null;
  let i = col.pc.indexOf(give);
  if (i !== -1) col.pc.splice(i, 1);
  else {
    i = col.deck.indexOf(give);
    col.deck.splice(i, 1);
  }
  if (cert) col.flags['cert_' + get] = true;
  const dest = canAddToDeck(col, get) === null ? 'deck' : 'pc';
  (dest === 'deck' ? col.deck : col.pc).push(get);
  col.flags['seen_' + get] = true;
  col.linkStats.trades++;
  return dest;
}

/** Huella de todo lo que decide el combate (no del texto del registro, que cada extremo narra a su modo). */
export function battleDigest(s: BattleState): string {
  let h = 0x811c9dc5;
  const add = (str: string) => {
    h = fnv(h, str);
    h = Math.imul(h ^ 0x7c, 0x01000193);
  };
  add(`${s.turn},${s.active},${s.phase},${s.winner},${s.blackout ? 1 : 0}`);
  for (const p of s.players) {
    add(`${p.life},${p.poisoned ? 1 : 0},${p.fogTurns},${p.nextFogTurns},${p.landPlayedThisTurn ? 1 : 0},${p.unelcoMana ?? '-'}`);
    add(p.lands.map((l) => l.def.id + (l.tapped ? '!' : '')).join(','));
    add(p.hand.map((c) => c.id).join(','));
    add(p.deck.map((c) => c.id).join(','));
    add(p.graveyard.map((c) => c.id).join(','));
    add(p.board.map((m) => `${m.def.id}:${m.atk}:${m.hp}:${m.maxHp}:${m.canAttack ? 1 : 0}:${m.attacksLeft}:${m.stealthed ? 1 : 0}:${m.poisoned ? 1 : 0}`).join(','));
  }
  return (h >>> 0).toString(36);
}

/** La pantalla de combate siempre pinta al jugador en el lado 0: al otro extremo se le da la vuelta. */
export function mirrorState(s: BattleState): BattleState {
  const flip = (v: 0 | 1): 0 | 1 => (v === 0 ? 1 : 0);
  return {
    ...s,
    players: [s.players[1], s.players[0]],
    active: flip(s.active),
    winner: s.winner === null ? null : flip(s.winner),
    shake: s.shake === null ? null : flip(s.shake),
    highlights: s.highlights.map((h) => ({ ...h, side: flip(h.side) })),
    shine: [s.shine[1], s.shine[0]],
  };
}

interface BDeck {
  deck: Record<string, number>;
  shine: Record<string, number>;
  r: number;
}

export interface ClubSnapshot {
  status: LinkStatus;
  role: 'host' | 'guest' | null;
  incompatible: boolean;
  closeReason: string | null;
  peerRoom: Room | null;
  /** Enlace hecho y los dos en la misma sala con la misma versión. */
  ok: boolean;
  fatal: string | null;
  notice: string | null;
  stats: { tx: number; rx: number; bad: number; retx: number };
  trade: {
    mine: string | null;
    theirs: string | null;
    theirsCert: boolean;
    myReady: boolean;
    theirReady: boolean;
    busy: boolean;
    last: { gave: string; got: string; dest: 'deck' | 'pc' } | null;
  };
  battle: {
    phase: 'lobby' | 'waiting' | 'running' | 'over' | 'void';
    view: BattleState | null;
    result: 'win' | 'lose' | null;
    iStart: boolean;
    n: number;
    theirReady: boolean;
    why: string | null;
    foeAce: string | null;
  };
  record: LinkStats;
}

export class CableClub {
  readonly room: Room;
  readonly link: LinkSession;
  snapshot: ClubSnapshot;

  private readonly col: ClubCollection;
  private readonly persist: () => void;
  private readonly rnd: () => number;
  private readonly listeners = new Set<() => void>();
  private now = 0;
  private lastEmit = 0;
  private lastStats = 0;
  private peerRoom: Room | null = null;
  private fatal: string | null = null;
  private notice: string | null = null;

  // --- sala de intercambio ---
  private epoch = 0;
  private tMine: string | null = null;
  private tTheirs: string | null = null;
  private tTheirsCert = false;
  private tMyReady = false;
  private tTheirReady = false;
  private tBusy = false;
  private readonly readied = new Set<string>();
  private tLast: ClubSnapshot['trade']['last'] = null;

  // --- sala de combate ---
  private bMine: BDeck | null = null;
  private bTheirs: BDeck | null = null;
  private bState: BattleState | null = null;
  private bPhase: ClubSnapshot['battle']['phase'] = 'lobby';
  private bAmP0 = true;
  private bN = 0;
  private bNextAt = 0;
  private bResult: 'win' | 'lose' | null = null;
  private bWhy: string | null = null;
  private bFoeAce: string | null = null;

  constructor(
    transport: LinkTransport,
    room: Room,
    col: ClubCollection,
    persist: () => void,
    opts: { timings?: LinkTimings; rnd?: () => number } = {},
  ) {
    this.room = room;
    this.col = col;
    this.persist = persist;
    this.rnd = opts.rnd ?? Math.random;
    this.link = new LinkSession(transport, opts.timings ?? DEFAULT_TIMINGS, this.rnd);
    this.link.onStatus = (s) => this.onStatus(s);
    this.link.onLost = (why) => this.onLost(why);
    this.link.onMessage = (m) => this.onMessage(m);
    this.snapshot = this.build();
  }

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  /** Hay que llamarlo unas 25 veces por segundo: mueve el enlace y marca el paso del combate. */
  tick(now: number): void {
    this.now = now;
    this.link.tick(now);
    const b = this.bState;
    if (this.link.role === 'host' && this.bPhase === 'running' && b && b.winner === null && now >= this.bNextAt && this.link.backlog === 0) {
      const next = step(b);
      this.bState = next;
      this.bN++;
      this.post({ t: 'bstep', n: this.bN, d: battleDigest(next) });
      this.bNextAt = now + (next.phase === 'start' ? 750 : next.phase === 'end' ? 450 : 950) / LINK_SPEED;
      if (next.winner !== null) this.finishBattle();
      this.emit();
      return;
    }
    const st = this.link.stats;
    const sum = st.tx + st.rx + st.bad + st.retx;
    if (sum !== this.lastStats && now - this.lastEmit >= 500) this.emit();
  }

  dispose(): Promise<void> {
    const freed = this.link.close();
    this.emit();
    return freed;
  }

  // ------------------------------------------------------------ intercambio

  offer(id: string | null): void {
    if (!this.ok || this.room !== 'trade' || this.tBusy) return;
    if (id !== null) {
      const err = canOffer(this.col, id);
      if (err) {
        this.notice = err;
        return this.emit();
      }
    }
    this.tMine = id;
    this.tMyReady = false;
    this.tTheirReady = false;
    this.notice = null;
    this.post({ t: 'offer', e: this.epoch, id, cert: id !== null && !!this.col.flags['cert_' + id] });
    this.emit();
  }

  setReady(v: boolean): void {
    if (!this.ok || this.room !== 'trade' || this.tBusy || !this.tMine || !this.tTheirs) return;
    this.tMyReady = v;
    if (v) {
      const k = this.dealKey();
      this.readied.add(k);
      this.post({ t: 'ready', e: this.epoch, k });
      this.maybeCommit();
    } else {
      this.post({ t: 'unready', e: this.epoch });
    }
    this.emit();
  }

  // ---------------------------------------------------------------- combate

  battleReady(): void {
    if (!this.ok || this.room !== 'battle' || this.bPhase !== 'lobby') return;
    const counts = deckCounts(this.col.deck);
    const err = validateLinkDeck(counts);
    const shine = err ? null : cleanShine(this.col.shine, counts);
    if (err || !shine) {
      this.notice = `Tu mazo no vale para el cable: ${err ?? 'tiene brillos imposibles.'}`;
      return this.emit();
    }
    this.bMine = { deck: counts, shine, r: Math.floor(this.rnd() * 0x100000000) >>> 0 };
    this.bPhase = 'waiting';
    this.notice = null;
    this.post({ t: 'bdeck', deck: counts, shine, r: this.bMine.r });
    this.tryStart();
    this.emit();
  }

  battleCancel(): void {
    if (this.bPhase !== 'waiting') return;
    this.bMine = null;
    this.bPhase = 'lobby';
    this.post({ t: 'blobby' });
    this.emit();
  }

  /** Volver a la sala: desde el resultado, o abandonando un combate en marcha (que queda nulo). */
  battleLeave(): void {
    if (this.bPhase === 'running') {
      this.post({ t: 'bvoid' });
      this.bTheirs = null;
    }
    this.bPhase = 'lobby';
    this.bState = null;
    this.bMine = null;
    this.bResult = null;
    this.bWhy = null;
    this.emit();
  }

  // ---------------------------------------------------------------- interno

  private get ok(): boolean {
    return this.link.status === 'linked' && this.peerRoom === this.room && !this.fatal;
  }

  private post(msg: unknown): void {
    this.link.send(msg).catch(() => undefined);
  }

  private emit(): void {
    const st = this.link.stats;
    this.lastStats = st.tx + st.rx + st.bad + st.retx;
    this.lastEmit = this.now;
    this.snapshot = this.build();
    for (const fn of [...this.listeners]) fn();
  }

  private build(): ClubSnapshot {
    const l = this.link;
    return {
      status: l.status,
      role: l.role,
      incompatible: l.incompatible,
      closeReason: l.closeReason,
      peerRoom: this.peerRoom,
      ok: this.ok,
      fatal: this.fatal,
      notice: this.notice,
      stats: { ...l.stats },
      trade: {
        mine: this.tMine,
        theirs: this.tTheirs,
        theirsCert: this.tTheirsCert,
        myReady: this.tMyReady,
        theirReady: this.tTheirReady,
        busy: this.tBusy,
        last: this.tLast,
      },
      battle: {
        phase: this.bPhase,
        view: this.bState ? (this.bAmP0 ? this.bState : mirrorState(this.bState)) : null,
        result: this.bResult,
        iStart: this.bAmP0,
        n: this.bN,
        theirReady: !!this.bTheirs,
        why: this.bWhy,
        foeAce: this.bFoeAce,
      },
      record: { ...this.col.linkStats },
    };
  }

  private onStatus(s: LinkStatus): void {
    this.peerRoom = null;
    this.fatal = null;
    if (s === 'linked') {
      this.clearTrade();
      this.bMine = null;
      this.bTheirs = null;
      if (this.bPhase === 'waiting') this.bPhase = 'lobby';
      this.post({ t: 'hi', v: CLUB_PROTO, cat: catalogHash(), room: this.room });
    }
    this.emit();
  }

  private onLost(why: string): void {
    if (this.bPhase === 'running') this.voidBattle('Se soltó el cable en mitad del combate: partida nula.');
    else if (this.bPhase === 'waiting') this.bPhase = 'lobby';
    this.bMine = null;
    this.bTheirs = null;
    this.tBusy = false;
    this.clearTrade();
    this.notice = why === 'peer-reset' ? 'El otro extremo reinició el enlace.' : why === 'closed' ? null : 'Se perdió el enlace por el cable. Buscando de nuevo…';
  }

  private onMessage(raw: unknown): void {
    if (!raw || typeof raw !== 'object') return;
    const m = raw as Record<string, unknown>;
    if (m.t === 'hi') this.onHi(m);
    else if (!this.ok) return;
    else if (this.room === 'trade') this.onTradeMessage(m);
    else this.onBattleMessage(m);
    this.emit();
  }

  private onHi(m: Record<string, unknown>): void {
    this.peerRoom = null;
    if (m.v !== CLUB_PROTO) this.fatal = 'El otro extremo usa otra versión del Club del Cable. Actualizad el juego en los dos.';
    else if (m.cat !== catalogHash()) this.fatal = 'Los dos juegos no llevan las mismas cartas (versiones distintas). Actualizad el juego en los dos.';
    else if (m.room !== 'trade' && m.room !== 'battle') this.fatal = 'El saludo del otro extremo no se entiende.';
    else {
      this.peerRoom = m.room;
      this.fatal = m.room === this.room ? null
        : `El otro extremo está en la SALA DE ${m.room === 'trade' ? 'INTERCAMBIO' : 'COMBATE'} y tú en la de ${this.room === 'trade' ? 'INTERCAMBIO' : 'COMBATE'}. Id los dos a la misma sala.`;
    }
  }

  // --- intercambio ---

  private dealKey(): string {
    const host = this.link.role === 'host';
    return `${host ? this.tMine : this.tTheirs}>${host ? this.tTheirs : this.tMine}`;
  }

  private clearTrade(): void {
    this.tMine = null;
    this.tTheirs = null;
    this.tTheirsCert = false;
    this.tMyReady = false;
    this.tTheirReady = false;
    this.readied.clear();
  }

  private onTradeMessage(m: Record<string, unknown>): void {
    if (m.t === 'commit') return this.onCommit(m);
    if (this.tBusy || m.e !== this.epoch) return; // mensajes de un trato ya cerrado
    if (m.t === 'offer') {
      if (m.id !== null && card(m.id)?.type !== 'creature') {
        this.notice = 'El otro extremo ofreció algo que no es un magomón. Oferta ignorada.';
        return;
      }
      this.tTheirs = m.id as string | null;
      this.tTheirsCert = m.cert === true;
      this.tMyReady = false;
      this.tTheirReady = false;
    } else if (m.t === 'ready') {
      if (this.tMine && this.tTheirs && m.k === this.dealKey()) {
        this.tTheirReady = true;
        this.maybeCommit();
      }
    } else if (m.t === 'unready') {
      this.tTheirReady = false;
    }
  }

  /** Solo el anfitrión cierra tratos: así no hay dos consolas decidiendo a la vez. */
  private maybeCommit(): void {
    if (this.link.role !== 'host' || this.tBusy || !this.tMyReady || !this.tTheirReady || !this.tMine || !this.tTheirs) return;
    const give = this.tMine;
    const get = this.tTheirs;
    const cert = this.tTheirsCert;
    this.tBusy = true;
    this.link.send({ t: 'commit', e: this.epoch, k: this.dealKey() }).then(
      () => {
        this.finishTrade(give, get, cert);
        this.emit();
      },
      () => {
        this.tBusy = false;
        this.emit();
      },
    );
  }

  private onCommit(m: Record<string, unknown>): void {
    if (this.link.role !== 'guest' || m.e !== this.epoch || typeof m.k !== 'string') return;
    const [h, g] = m.k.split('>');
    if (!this.readied.has(m.k) || !g || h !== this.tTheirs) {
      this.notice = 'El anfitrión cerró un trato que tú no habías confirmado. Tu colección no se ha tocado.';
      return;
    }
    this.finishTrade(g, h, this.tTheirsCert);
  }

  private finishTrade(give: string, get: string, cert: boolean): void {
    const dest = applyTrade(this.col, give, get, cert);
    this.tBusy = false;
    this.epoch++;
    this.clearTrade();
    if (!dest) {
      this.notice = 'El intercambio no se pudo aplicar en este extremo.';
      return;
    }
    this.tLast = { gave: give, got: get, dest };
    this.notice = null;
    this.persist();
  }

  // --- combate ---

  private onBattleMessage(m: Record<string, unknown>): void {
    if (m.t === 'bdeck') {
      const err = validateLinkDeck(m.deck);
      const shine = err ? null : cleanShine(m.shine, m.deck as Record<string, number>);
      if (err || !shine || typeof m.r !== 'number') {
        this.bTheirs = null;
        this.notice = `El mazo del otro extremo no es legal: ${err ?? 'brillos imposibles.'}`;
        return;
      }
      this.bTheirs = { deck: m.deck as Record<string, number>, shine, r: m.r >>> 0 };
      this.tryStart();
    } else if (m.t === 'blobby') {
      this.bTheirs = null;
    } else if (m.t === 'bstart') {
      if (this.link.role !== 'guest' || this.bPhase !== 'waiting' || !this.bMine || !this.bTheirs) return;
      const seed = (this.bMine.r ^ this.bTheirs.r) >>> 0;
      if (m.seed !== seed || m.first !== (seed & 1)) {
        this.post({ t: 'bvoid' });
        return this.voidBattle('La semilla del combate no cuadra entre los dos extremos.');
      }
      this.begin(seed);
    } else if (m.t === 'bstep') {
      if (this.link.role !== 'guest' || this.bPhase !== 'running' || !this.bState) return;
      const next = m.n === this.bN + 1 ? step(this.bState) : null;
      if (!next || battleDigest(next) !== m.d) {
        this.post({ t: 'bvoid' });
        return this.voidBattle('Las dos consolas dejaron de coincidir. Combate nulo.');
      }
      this.bState = next;
      this.bN++;
      if (next.winner !== null) this.finishBattle();
    } else if (m.t === 'bvoid') {
      if (this.bPhase === 'running' || this.bPhase === 'waiting') this.voidBattle('El otro extremo canceló el combate.');
    }
  }

  private tryStart(): void {
    if (this.link.role !== 'host' || this.bPhase !== 'waiting' || !this.bMine || !this.bTheirs) return;
    const seed = (this.bMine.r ^ this.bTheirs.r) >>> 0;
    this.post({ t: 'bstart', seed, first: seed & 1 });
    this.begin(seed);
  }

  /** Los dos extremos montan exactamente el mismo combate. La semilla decide también quién abre. */
  private begin(seed: number): void {
    const mine = this.bMine!;
    const theirs = this.bTheirs!;
    const hostOpens = (seed & 1) === 0;
    this.bAmP0 = (this.link.role === 'host') === hostOpens;
    const p0 = this.bAmP0 ? mine : theirs;
    const p1 = this.bAmP0 ? theirs : mine;
    this.bState = createBattle(
      { name: this.bAmP0 ? 'TU' : 'RIVAL', deck: canonicalDeck(p0.deck), shine: p0.shine },
      { name: this.bAmP0 ? 'RIVAL' : 'TU', deck: canonicalDeck(p1.deck), shine: p1.shine },
      { rnd: mulberry32(seed), viewer: this.bAmP0 ? 0 : 1 },
    );
    let ace: string | null = null;
    let best = -1;
    for (const id of Object.keys(theirs.deck)) {
      const c = CARDS[id];
      const power = c.type === 'creature' ? (c.atk ?? 0) + (c.hp ?? 0) + 2 * (theirs.shine[id] ?? 0) : -1;
      if (power > best) {
        best = power;
        ace = id;
      }
    }
    this.bFoeAce = ace;
    this.bN = 0;
    this.bResult = null;
    this.bWhy = null;
    this.bPhase = 'running';
    this.bNextAt = this.now + INTRO_MS;
  }

  private finishBattle(): void {
    const iWon = (this.bState!.winner === 0) === this.bAmP0;
    this.bResult = iWon ? 'win' : 'lose';
    if (iWon) this.col.linkStats.wins++;
    else this.col.linkStats.losses++;
    this.bPhase = 'over';
    this.bMine = null;
    this.bTheirs = null;
    this.persist();
  }

  private voidBattle(why: string): void {
    this.bPhase = 'void';
    this.bWhy = why;
    this.bState = null;
    this.bMine = null;
    this.bTheirs = null;
  }
}
