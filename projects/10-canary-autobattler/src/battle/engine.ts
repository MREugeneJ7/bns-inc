import { CARDS, CardDef, Keyword, LandColor, ManaCost, LAND_INFO, MANA_COLORS, totalMana } from './cards';
import { statsOf } from './booster';
import { save } from '../game/save';

export interface Minion {
  uid: number;
  def: CardDef;
  atk: number;
  hp: number;
  maxHp: number;
  shine: number;
  canAttack: boolean;
  attacksLeft: number;
  stealthed: boolean;
  poisoned?: boolean;
}

export interface LandOnBoard {
  uid: number;
  def: CardDef;
  produces?: LandColor;
  tapped: boolean;
}

export interface PlayerState {
  name: string;
  life: number;
  poisoned?: boolean;
  lands: LandOnBoard[];
  deck: CardDef[];
  hand: CardDef[];
  board: Minion[];
  graveyard: CardDef[]; // lo que muere NO vuelve al mazo jamas
  landPlayedThisTurn: boolean;
  unelcoMana: LandColor | null;
  fogTurns: number;
  nextFogTurns: number;
}

export type Phase = 'start' | 'play' | 'attack' | 'end';

export interface Highlight {
  side: 0 | 1;
  kind: 'hand' | 'board' | 'hero' | 'land';
  uid?: number;
}

export interface BattleState {
  players: [PlayerState, PlayerState];
  active: 0 | 1;
  turn: number;
  phase: Phase;
  log: string[];
  lastEvent: string;
  highlights: Highlight[];
  winner: 0 | 1 | null;
  /** APAGON de Unelco: a partir de activarse nadie vuelve a enderezar tierras. */
  blackout: boolean;
  uidCounter: number;
  shake: 0 | 1 | null;
  /** Brillo permanente (+1/+1 por nivel) de cada duelista, por carta. */
  shine: [Record<string, number>, Record<string, number>];
  /** Solo en combates por cable: lado desde el que se narra el registro. */
  viewer?: 0 | 1;
}

export const OPENING_HAND = 7;
export const MAX_HAND = 7;
export const MAX_BOARD = 6;

const shuffle = <T,>(arr: T[], rnd: () => number = Math.random): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export interface Duelist {
  name: string;
  deck: string[];
  shine?: Record<string, number>;
  /** Vida inicial (solo se usa para Magec: debe sobrevivir hasta autoinvocarse en T5). */
  life?: number;
  /** Cartas garantizadas en la mano inicial (p.ej. Magec debe salir si o si). */
  openingHand?: string[];
}

export interface BattleOptions {
  /** Azar inyectable: en un combate por cable los dos extremos barajan con la misma semilla. */
  rnd?: () => number;
  /** Lado desde el que se narra el registro (de quién se ven los robos). Por defecto, el 0. */
  viewer?: 0 | 1;
}

export function createBattle(p0: Duelist, p1: Duelist, opts: BattleOptions = {}): BattleState {
  const rnd = opts.rnd ?? Math.random;
  const mk = (d: Duelist): PlayerState => {
    const pool = d.deck.map((id) => CARDS[id]).filter(Boolean);
    let hand: CardDef[];
    let rest: CardDef[];
    if (d.openingHand && d.openingHand.length > 0) {
      // Mano inicial guionizada (Magec): las cartas forzadas entran seguro y el mulligan no aplica.
      const forced: CardDef[] = [];
      const leftover: CardDef[] = [...pool];
      for (const id of d.openingHand) {
        const i = leftover.findIndex((c) => c.id === id);
        if (i !== -1) forced.push(leftover.splice(i, 1)[0]);
      }
      const shuffled = shuffle(leftover, rnd);
      hand = [...forced, ...shuffled.slice(0, Math.max(0, OPENING_HAND - forced.length))];
      rest = shuffled.slice(Math.max(0, OPENING_HAND - forced.length));
    } else {
      // Mano de 7 aleatorias, con un mulligan automatico si salen 0 o 6+ tierras
      let shuffled = shuffle(pool, rnd);
      hand = shuffled.slice(0, OPENING_HAND);
      const lands = hand.filter((c) => c.type === 'land').length;
      if (lands === 0 || lands >= 6) {
        shuffled = shuffle(pool, rnd);
        hand = shuffled.slice(0, OPENING_HAND);
      }
      rest = shuffled.slice(OPENING_HAND);
    }
    return {
      name: d.name,
      life: d.life ?? 20,
      lands: [],
      deck: rest,
      hand,
      board: [],
      graveyard: [],
      landPlayedThisTurn: false,
      unelcoMana: null,
      fogTurns: 0,
      nextFogTurns: 0,
    };
  };

  const a = mk(p0);
  const b = mk(p1);
  return {
    players: [a, b],
    active: 0,
    turn: 1,
    phase: 'start',
    log: [
      `Mazos de ${p0.deck.length} y ${p1.deck.length} barajados. Cada uno roba ${OPENING_HAND}.`,
      'El cementerio no se baraja nunca: bicho muerto, bicho enterrao.',
    ],
    lastEvent: `${OPENING_HAND} cartas en mano, ${a.deck.length} en mazo.`,
    highlights: [],
    winner: null,
    blackout: false,
    uidCounter: 1,
    shake: null,
    shine: [{ ...(p0.shine ?? {}) }, { ...(p1.shine ?? {}) }],
    ...(opts.viewer === undefined ? {} : { viewer: opts.viewer }),
  };
}

function drawOne(p: PlayerState): CardDef | null {
  const c = p.deck.shift();
  if (!c) return null;
  p.hand.push(c);
  return c;
}

const has = (m: Pick<Minion, 'def'>, k: Keyword) => m.def.keywords?.includes(k) ?? false;

function cloneState(s: BattleState): BattleState {
  const cp = (p: PlayerState): PlayerState => ({
    ...p,
    lands: p.lands.map((l) => ({ ...l })),
    deck: [...p.deck],
    hand: [...p.hand],
    board: p.board.map((m) => ({ ...m })),
    graveyard: [...p.graveyard],
  });
  return {
    ...s,
    players: [cp(s.players[0]), cp(s.players[1])],
    log: [...s.log],
    highlights: [],
    shake: null,
    shine: [{ ...s.shine[0] }, { ...s.shine[1] }],
  };
}

function checkWinner(s: BattleState) {
  if (s.winner !== null) return;
  const [a, b] = s.players;
  if (a.life <= 0 && b.life <= 0) s.winner = 1;
  else if (a.life <= 0) s.winner = 1;
  else if (b.life <= 0) s.winner = 0;
}

function cleanup(s: BattleState) {
  for (const p of s.players) {
    const survivors: Minion[] = [];
    for (const m of p.board) {
      if (m.hp <= 0) {
        p.graveyard.push(m.def);
        s.log.push(`${m.def.name} muere -> cementerio.`);
      } else survivors.push(m);
    }
    p.board = survivors;
  }
  checkWinner(s);
}

function dealDamage(owner: PlayerState, target: PlayerState | Minion, amount: number): number {
  if (owner.fogTurns > 0) return 0;
  if ('life' in target) target.life -= amount;
  else target.hp -= amount;
  return amount;
}

export function canPayMana(lands: LandOnBoard[], mana?: ManaCost): LandOnBoard[] | null {
  if (!mana) return [];
  const untappedLands = lands.filter((l) => !l.tapped);
  const used = new Set<LandOnBoard>();
  const flexible = untappedLands.filter((l) => l.def.producesAny);
  const fixed = untappedLands.filter((l) => !l.def.producesAny);

  // Las tierras fijas cubren primero su color; Unelco solo se gasta cuando falta ese color.
  for (const color of MANA_COLORS) {
    let need = mana[color] ?? 0;
    for (const l of fixed) {
      if (need <= 0) break;
      if (!used.has(l) && l.produces === color) { used.add(l); need--; }
    }
    while (need > 0) {
      const l = flexible.find((f) => !used.has(f));
      if (!l) return null;
      used.add(l);
      need--;
    }
  }

  const generic = mana.generic ?? 0;
  if (generic > 0) {
    const rem = untappedLands.filter((l) => !used.has(l));
    if (rem.length < generic) return null;
    const counts: Record<string, number> = {};
    for (const l of rem) if (l.produces) counts[l.produces] = (counts[l.produces] ?? 0) + 1;
    const count = (l: LandOnBoard) => l.produces ? counts[l.produces] : 0;
    rem.sort((a, b) => count(b) - count(a));
    for (let i = 0; i < generic; i++) used.add(rem[i]);
  }
  return Array.from(used);
}

export function canTapUnelco(s: BattleState, side: 0 | 1): boolean {
  const player = s.players[side];
  return s.winner === null && s.active === side && s.phase === 'play' && player.unelcoMana === null
    && player.lands.some((l) => l.def.id === 'unelco' && !l.tapped);
}

export function tapUnelco(prev: BattleState, side: 0 | 1, color: LandColor): BattleState {
  if (!MANA_COLORS.includes(color) || !canTapUnelco(prev, side)) return prev;
  const s = cloneState(prev);
  const player = s.players[side];
  const land = player.lands.find((l) => l.def.id === 'unelco' && !l.tapped)!;
  land.tapped = true;
  player.unelcoMana = color;
  s.lastEvent = `${player.name} gira Unelco: +1 maná ${LAND_INFO[color].color.toLowerCase()}.`;
  s.log.push(s.lastEvent);
  s.highlights = [{ side, kind: 'land', uid: land.uid }];
  return s;
}

// El mana ya generado se gasta primero y no cuenta como una segunda activacion de la tierra.
function planPayment(lands: LandOnBoard[], cost: ManaCost | undefined, stored: LandColor | null) {
  if (stored && cost) {
    const key = cost[stored] ? stored : cost.generic ? 'generic' : null;
    if (key) {
      const tap = canPayMana(lands, { ...cost, [key]: (cost[key] ?? 0) - 1 });
      return tap === null ? null : { tap, spent: stored };
    }
  }
  const tap = canPayMana(lands, cost);
  return tap === null ? null : { tap, spent: null };
}

/** Sacrificar no exige girar Unelco: tambien se puede hacer si ya dio mana. */
/** La Fotocopiadora copia una carta rival y la mete en tu mano para este duelo. */
export function copyRivalCard(prev: BattleState, cardId: string): BattleState {
  if (prev.winner !== null) return prev;
  const def = CARDS[cardId];
  if (!def) return prev;
  const s = cloneState(prev);
  const me = s.players[0];
  if (me.hand.length < MAX_HAND) me.hand.push(def);
  else me.deck.unshift(def);
  s.lastEvent = `FOTOCOPIADORA: copias ${def.name} del rival. ${me.hand.includes(def) ? 'Entra directa a tu mano.' : 'Se guarda encima del mazo.'}`;
  s.log.push(s.lastEvent);
  s.highlights = [{ side: 0, kind: 'hand' }];
  return s;
}

export function sacrificeUnelco(prev: BattleState, side: 0 | 1): BattleState {
  if (prev.blackout || prev.winner !== null) return prev;
  const s = cloneState(prev);
  const me = s.players[side];
  const idx = me.lands.findIndex((l) => l.def.id === 'unelco');
  if (idx === -1) return prev;
  const [unelco] = me.lands.splice(idx, 1);
  me.graveyard.push(unelco.def);
  s.blackout = true;
  s.lastEvent = `${me.name} sacrifica UNELCO: ¡APAGÓN! Nadie vuelve a enderezar tierras.`;
  s.log.push(s.lastEvent);
  s.highlights = [{ side, kind: 'land', uid: unelco.uid }];
  return s;
}

function pickLandIndex(me: PlayerState): number {
  const idxs = me.hand.map((c, i) => ({ c, i })).filter(({ c }) =>
    c.type === 'land' && (!c.legendary || !me.lands.some((l) => l.def.id === c.id)));
  if (idxs.length === 0) return -1;
  const wild = idxs.find(({ c }) => c.producesAny);
  if (wild) return wild.i;
  const onBoard: Record<string, number> = {};
  for (const l of me.lands) if (l.produces) onBoard[l.produces] = (onBoard[l.produces] ?? 0) + 1;
  const needed: Record<string, number> = {};
  for (const c of me.hand) {
    if (!c.mana) continue;
    for (const k of MANA_COLORS) {
      if (c.mana[k]) needed[k] = (needed[k] ?? 0) + c.mana[k]!;
    }
  }
  idxs.sort((a, b) => {
    const ca = a.c.produces!, cb = b.c.produces!;
    const haveA = onBoard[ca] ?? 0, haveB = onBoard[cb] ?? 0;
    if (haveA !== haveB) return haveA - haveB;
    return (needed[cb] ?? 0) - (needed[ca] ?? 0);
  });
  return idxs[0].i;
}

/** Avanza el combate una micro-accion. */
export function step(prev: BattleState): BattleState {
  if (prev.winner !== null) return prev;
  const s = cloneState(prev);
  const me = s.players[s.active];
  const foe = s.players[s.active === 0 ? 1 : 0];
  const foeSide = (s.active === 0 ? 1 : 0) as 0 | 1;
  const say = (t: string) => { s.lastEvent = t; s.log.push(t); };

  // --- ENDEREZAR + ROBAR ---
  if (s.phase === 'start') {
    if (!s.blackout) for (const l of me.lands) l.tapped = false;
    else if (me.lands.some((l) => l.tapped)) s.log.push(`APAGÓN: las tierras de ${me.name} no se enderezan.`);
    for (const m of me.board) {
      m.canAttack = true;
      m.attacksLeft = has(m, 'doble') ? 2 : 1;
    }
    me.landPlayedThisTurn = false;

    const skipFirstDraw = s.turn === 1 && s.active === 0;
    if (skipFirstDraw) {
      say(`T1: ${me.name} abre partida (no roba en T1).`);
    } else {
      const drawn = drawOne(me);
      if (!drawn) {
        say(`${me.name} se quedo sin mazo!`);
        s.winner = foeSide;
        s.highlights = [{ side: s.active, kind: 'hero' }];
        s.shake = s.active;
        return s;
      }
      say(`T${s.turn}: ${me.name} ${s.blackout ? 'roba' : 'endereza y roba'} ${s.active === (s.viewer ?? 0) ? drawn.name : 'carta'}.`);
    }
    s.highlights = [{ side: s.active, kind: 'hand' }];
    s.phase = 'play';
    return s;
  }

  // --- FASE PRINCIPAL ---
  if (s.phase === 'play') {
    if (!me.landPlayedThisTurn) {
      const li = pickLandIndex(me);
      if (li !== -1) {
        const landCard = me.hand.splice(li, 1)[0];
        const nl: LandOnBoard = { uid: s.uidCounter++, def: landCard, produces: landCard.produces, tapped: false };
        me.lands.push(nl);
        me.landPlayedThisTurn = true;
        say(`${me.name} baja ${landCard.name} ${nl.produces ? LAND_INFO[nl.produces].icon : '*'}.`);
        s.highlights = [{ side: s.active, kind: 'land', uid: nl.uid }];
        return s;
      }
    }

    const foeTargetable = foe.board.filter((m) => !m.stealthed);

    const playable = me.hand
      .map((c, i) => ({ c, i, payment: c.type === 'land' ? null : planPayment(me.lands, c.mana, me.unelcoMana) }))
      .filter((p): p is { c: CardDef; i: number; payment: NonNullable<ReturnType<typeof planPayment>> } => p.payment !== null)
      .filter(({ c }) => {
        if (c.type === 'creature') return me.board.length < MAX_BOARD;
        const e = c.effect!;
        if (e.kind === 'heal') return me.life <= 15;
        if (e.kind === 'buff') return me.board.length > 0;
        if (e.kind === 'draw') return me.deck.length >= 3 && me.hand.length <= 5;
        if (e.kind === 'fog') return me.fogTurns <= 1 && !me.nextFogTurns;
        if (e.kind === 'damage' && e.target === 'all_enemies') return foe.board.length >= 2;
        if (e.kind === 'damage') return foeTargetable.length > 0 || foe.board.length === 0;
        return true;
      })
      // La IA baja primero la criatura mas PODEROSA (stats reales con brillo ya aplicado),
      // no la que cuesta mas maná. Así el brillo legal de las etapas finales (=+1/+1 por
      // cada 5 copias fusionadas) se nota de verdad en la mesa.
      .sort((x, y) => {
        const power = (p: typeof x) => {
          const c = p.c;
          if (c.type !== 'creature') return totalMana(c.mana) * 2;
          const st = statsOf(c.id, s.shine[s.active]);
          return st.atk * 2 + st.hp + (c.keywords?.length ?? 0);
        };
        return power(y) - power(x);
      });

    if (playable.length > 0) {
      const { c, i, payment: { tap, spent } } = playable[0];
      me.hand.splice(i, 1);
      for (const l of tap) l.tapped = true;
      if (spent) me.unelcoMana = null;
      const icons = [spent ? LAND_INFO[spent].icon : '', ...tap.map((l) => l.produces ? LAND_INFO[l.produces].icon : 'Unelco')].join('');
      const paymentText = spent ? `paga ${icons}` : `gira ${icons}`;

      if (c.type === 'creature') {
        const shine = s.shine[s.active][c.id] ?? 0;
        const st = statsOf(c.id, s.shine[s.active]);
        const m: Minion = {
          uid: s.uidCounter++,
          def: c,
          atk: st.atk,
          hp: st.hp,
          maxHp: st.hp,
          shine,
          canAttack: has({ def: c }, 'prisa'),
          attacksLeft: has({ def: c }, 'doble') ? 2 : 1,
          stealthed: has({ def: c }, 'sigilo'),
        };
        me.board.push(m);
        save.flags['seen_' + c.id] = true;
        const star = shine > 0 ? '★'.repeat(Math.min(shine, 3)) : '';
        say(`${me.name} ${paymentText} -> ${c.name}${star} (${st.atk}/${st.hp}).`);
        s.highlights = [{ side: s.active, kind: 'board', uid: m.uid }];
      } else {
        const e = c.effect!;
        if (e.kind === 'damage' && e.target === 'enemy') {
          const guards = foeTargetable.filter((m) => has(m, 'guardia'));
          const pool = guards.length ? guards : foeTargetable;
          if (pool.length > 0) {
            const kill = pool.filter((m) => m.hp <= e.amount).sort((a, b) => b.atk - a.atk)[0];
            const t = kill ?? [...pool].sort((a, b) => b.atk - a.atk)[0];
            const hit = dealDamage(foe, t, e.amount);
            say(hit ? `${me.name} ${paymentText}: ${c.name} a ${t.def.name} (-${hit}).` : `La nevada frena ${c.name} en ${t.def.name}.`);
            s.highlights = [{ side: foeSide, kind: 'board', uid: t.uid }];
          } else if (foe.board.length === 0) {
            const hit = dealDamage(foe, foe, e.amount);
            say(hit ? `${me.name} ${paymentText}: ${c.name} a ${foe.name} (-${hit})!` : `La nevada frena ${c.name} en ${foe.name}.`);
            s.highlights = [{ side: foeSide, kind: 'hero' }];
            if (hit) s.shake = foeSide;
          }
        } else if (e.kind === 'damage' && e.target === 'all_enemies') {
          for (const m of foe.board) dealDamage(foe, m, e.amount);
          say(foe.fogTurns ? `La nevada cubre la mesa de ${foe.name} frente a ${c.name}.` : `${me.name} ${paymentText}: ${c.name} barre la mesa (-${e.amount}).`);
          s.highlights = foe.board.map((m) => ({ side: foeSide, kind: 'board' as const, uid: m.uid }));
        } else if (e.kind === 'day_of_judgement') {
          const wiped = s.players[0].board.length + s.players[1].board.length;
          for (const p of s.players) {
            p.graveyard.push(...p.board.map((m) => m.def));
            p.board = [];
          }
          say(`${me.name} ${paymentText}: NARICES DEL TEIDE! DÍA DEL JUICIO: ${wiped} criaturas destruidas. No queda nadie en pie.`);
          s.highlights = [{ side: 0, kind: 'hero' }, { side: 1, kind: 'hero' }];
          s.shake = foeSide;
        } else if (e.kind === 'fog') {
          me.nextFogTurns = e.turns;
          say(`${me.name} lanza ${c.name}: ${e.turns} turnos sin daño, desde el siguiente.`);
          s.highlights = [{ side: s.active, kind: 'hero' }];
        } else if (e.kind === 'heal') {
          me.life = Math.min(20, me.life + e.amount);
          say(`${me.name} ${paymentText}: ${c.name} (+${e.amount} vida).`);
          s.highlights = [{ side: s.active, kind: 'hero' }];
        } else if (e.kind === 'buff') {
          const t = [...me.board].sort((a, b) => (Number(b.canAttack) - Number(a.canAttack)) || b.atk - a.atk)[0];
          t.atk += e.atk;
          t.hp += e.hp;
          t.maxHp += e.hp;
          say(`${me.name} ${paymentText}: ${c.name} en ${t.def.name} (+${e.atk}/+${e.hp}).`);
          s.highlights = [{ side: s.active, kind: 'board', uid: t.uid }];
        } else if (e.kind === 'draw') {
          let got = 0;
          for (let k = 0; k < e.amount; k++) if (drawOne(me)) got++;
          say(`${me.name} ${paymentText}: ${c.name}, roba ${got}.`);
          s.highlights = [{ side: s.active, kind: 'hand' }];
        }
        if (e.kind !== 'day_of_judgement') me.graveyard.push(c);
      }
      cleanup(s);
      return s;
    }

    me.unelcoMana = null;
    s.phase = 'attack';
    return step(s);
  }

  // --- COMBATE ---
  if (s.phase === 'attack') {
    const attacker = me.board.find((m) => m.canAttack && m.attacksLeft > 0);
    if (!attacker) { s.phase = 'end'; return step(s); }

    const targets = foe.board.filter((m) => !m.stealthed);
    const guards = targets.filter((m) => has(m, 'guardia'));
    const foeHasCreatures = foe.board.length > 0;
    const canGoFace = !foeHasCreatures || has(attacker, 'directo');

    if (foeHasCreatures && !canGoFace && targets.length === 0) {
      attacker.attacksLeft = 0;
      attacker.canAttack = false;
      say(`${attacker.def.name} no ve objetivo (todo en sigilo).`);
      s.highlights = [{ side: s.active, kind: 'board', uid: attacker.uid }];
      return s;
    }

    attacker.attacksLeft -= 1;
    if (attacker.attacksLeft <= 0) attacker.canAttack = false;
    attacker.stealthed = false;

    if (!canGoFace) {
      const pool = guards.length > 0 ? guards : targets;
      const cleanKill = pool.filter((m) => m.hp <= attacker.atk && m.atk < attacker.hp).sort((a, b) => b.atk - a.atk)[0];
      const anyKill = pool.filter((m) => m.hp <= attacker.atk).sort((a, b) => b.atk - a.atk)[0];
      const weakest = [...pool].sort((a, b) => a.hp - b.hp)[0];
      const target = cleanKill ?? anyKill ?? weakest;

      const hit = dealDamage(foe, target, attacker.atk);
      const counter = dealDamage(me, attacker, target.atk);
      if (hit > 0 && has(attacker, 'veneno')) target.poisoned = true;
      if (counter > 0 && has(target, 'veneno')) attacker.poisoned = true;
      say(`${attacker.def.name} choca con ${target.def.name} (${hit} vs ${counter}).${target.poisoned ? ' VENENO!' : ''}${me.fogTurns || foe.fogTurns ? ' NEVADA!' : ''}`);
      s.highlights = [
        { side: s.active, kind: 'board', uid: attacker.uid },
        { side: foeSide, kind: 'board', uid: target.uid },
      ];
    } else {
      const hit = dealDamage(foe, foe, attacker.atk);
      if (hit > 0 && has(attacker, 'veneno')) foe.poisoned = true;
      say(
        foe.fogTurns ? `La nevada protege a ${foe.name} de ${attacker.def.name}.`
          : foeHasCreatures
          ? `${attacker.def.name} (DIRECTO) pega a ${foe.name}: -${hit}!`
          : `Sin defensas! ${attacker.def.name} pega a ${foe.name}: -${hit}!`
      );
      s.highlights = [
        { side: s.active, kind: 'board', uid: attacker.uid },
        { side: foeSide, kind: 'hero' },
      ];
      if (hit) s.shake = foeSide;
    }

    cleanup(s);
    return s;
  }

  // --- FIN DE TURNO ---
  let poisonedThisTurn = false;
  for (const m of me.board) {
    if (has(m, 'regen') && m.hp < m.maxHp) {
      m.hp = m.maxHp;
      s.log.push(`${m.def.name} regenera.`);
    }
    if (m.poisoned && dealDamage(me, m, 1)) {
      poisonedThisTurn = true;
      s.log.push(`El veneno hace 1 de dano a ${m.def.name}.`);
    }
  }
  if (me.poisoned && dealDamage(me, me, 1)) {
    poisonedThisTurn = true;
    s.log.push(`El veneno hace 1 de dano a ${me.name}.`);
    s.highlights = [{ side: s.active, kind: 'hero' }];
  }
  cleanup(s);
  if (s.winner !== null) {
    s.lastEvent = `El veneno acaba con ${me.name}.`;
    return s;
  }
  while (me.hand.length > MAX_HAND) {
    let idx = me.lands.length >= 4 ? me.hand.findIndex((c) => c.type === 'land') : -1;
    if (idx === -1) idx = 0;
    const disc = me.hand.splice(idx, 1)[0];
    me.graveyard.push(disc);
    s.log.push(`${me.name} descarta ${disc.name}.`);
  }

  say(poisonedThisTurn ? `El VENENO hace 1 de dano. ${me.name} pasa turno.` : `${me.name} pasa turno.`);
  // First exhaust protection for this turn, then activate any spell cast during it.
  for (const p of s.players) {
    p.fogTurns = p.nextFogTurns || Math.max(0, p.fogTurns - 1);
    p.nextFogTurns = 0;
  }
  s.active = foeSide;
  if (s.active === 0) s.turn += 1;
  s.phase = 'start';
  return s;
}

