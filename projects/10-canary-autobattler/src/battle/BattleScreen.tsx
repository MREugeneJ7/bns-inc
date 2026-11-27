import { useEffect, useMemo, useRef, useState } from 'react';
import { BattleState, Minion, canTapUnelco, copyRivalCard, createBattle, sacrificeUnelco, step, tapUnelco } from './engine';
import { CardDef, CARDS, formatMana, LAND_INFO, MANA_COLORS } from './cards';
import { creatureURL } from '../game/creatureArt';
import { beep } from '../game/sfx';
import { exportSaveJSON, save, touchSave } from '../game/save';
import { useFotocopiadora } from '../game/firstEdition';
import { canAddToDeck } from './booster';
import { NevadaGlyph } from '../components/CardArt';

const G = ['#9bbc0f', '#8bac0f', '#306230', '#0f380f'];

export interface Duel {
  foeName: string;
  foeTitle: string;
  foeDeck: string[];
  /** Brillo legal (fusiones de 5 copias en criaturas finales) del rival. */
  foeShine?: Record<string, number>;
  /** Solo Magec: vida inicial para que le dé tiempo a autoinvocarse. */
  foeLife?: number;
  /** Cartas garantizadas en la mano inicial del rival. */
  foeOpeningHand?: string[];
  /** Duros que te llevas si ganas (+ sobre). */
  purse: number;
  /** Duros reales que arriesgas si pierdes (0 si vas pelao sin un duro!). */
  stake: number;
  /** Mesa de practica del laboratorio (permite revancha directa sin ir al Centro Parrandero). */
  isPractice?: boolean;
  /** Si es duelo de gimnasio, nombre del Boliche en juego. */
  bolicheName?: string;
  /** carta que se muestra en el splash VS */
  foeIcon: string;
  yourIcon: string;
  yourLabel: string;
  winLines: string[];
  loseLines: string[];
}

interface Props {
  duel: Duel;
  onFinish: (result: 'win' | 'lose') => void;
  onBackToLab: () => void;
  /**
   * Combate por cable: el estado no lo calcula esta pantalla, llega sincronizado del enlace
   * (ya orientado: players[0] soy yo). Sin pausa, sin velocidad, sin fotocopias ni apagones.
   */
  link?: { view: BattleState; note?: string | null };
}

function Glyph({ def, size }: { def: CardDef; size: number }) {
  if (def.id === 'nevada_teide') return <NevadaGlyph size={size} />;
  if (def.type === 'creature') {
    return (
      <img
        src={creatureURL(def.id)}
        alt={def.name}
        draggable={false}
        style={{ width: size, height: size, imageRendering: 'pixelated', display: 'block' }}
      />
    );
  }
  return (
    <span style={{ fontSize: size * 0.78, lineHeight: `${size}px`, filter: 'grayscale(1) sepia(1) hue-rotate(45deg) saturate(3) contrast(1.5)' }}>
      {def.icon}
    </span>
  );
}

const KW_LABEL: Record<string, string> = { guardia: 'G', prisa: 'P', sigilo: 'S', doble: 'D', regen: 'R', directo: '↗', veneno: 'V' };

function MinionCard({ m, hl }: { m: Minion; hl: boolean }) {
  const kw = (m.def.keywords ?? []).map((k) => KW_LABEL[k]).join('');
  return (
    <div
      style={{
        width: 54, height: 58, border: `2px solid ${G[3]}`, background: hl ? G[2] : G[0], color: G[3],
        display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 1,
        boxShadow: hl ? `0 0 0 2px ${G[3]}` : 'none', opacity: m.stealthed ? 0.55 : 1, position: 'relative',
      }}
    >
      <div style={{ fontSize: 4, lineHeight: '5px', textAlign: 'center', height: 9, overflow: 'hidden', width: '100%', color: hl ? G[0] : G[3] }}>
        {m.def.name.toUpperCase()}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Glyph def={m.def} size={28} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: 7, borderTop: `1px solid ${G[3]}`, padding: '0 1px', color: hl ? G[0] : G[3] }}>
        <span>⚔{m.atk}</span>
        <span style={{ fontSize: 5 }}>{kw}</span>
        <span title={m.poisoned ? 'Envenenado: pierde 1 de vida al final de su turno' : undefined}>♥{m.hp}{m.poisoned ? 'V' : ''}</span>
      </div>
      {!m.canAttack && !m.stealthed && <div style={{ position: 'absolute', top: 1, right: 1, width: 4, height: 4, background: hl ? G[0] : G[2] }} />}
    </div>
  );
}

function HandCard({ c }: { c: CardDef }) {
  const isLand = c.type === 'land';
  const costLabel = isLand ? (c.producesAny ? '*' : LAND_INFO[c.produces!].short) : formatMana(c.mana, true);
  return (
    <div style={{ width: 41, height: 44, flexShrink: 0, border: `2px solid ${G[3]}`, background: isLand ? G[1] : G[0], color: G[3], padding: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 5 }}>
        <span style={{ border: `1px solid ${G[3]}`, padding: '0 1px', background: isLand ? G[3] : 'transparent', color: isLand ? G[0] : G[3] }}>{costLabel}</span>
        <span style={{ fontSize: 5 }}>{c.type === 'creature' ? `${c.atk}/${c.hp}` : isLand ? 'T' : 'H'}</span>
      </div>
      <Glyph def={c} size={c.type === 'creature' ? 18 : 14} />
      <div style={{ fontSize: 4, lineHeight: '5px', textAlign: 'center', overflow: 'hidden', height: 9, width: '100%' }}>{c.name.toUpperCase()}</div>
    </div>
  );
}

export function BattleScreen({ duel, onFinish, onBackToLab, link }: Props) {
  const newBattle = () => createBattle(
    { name: 'TU', deck: save.deck, shine: save.shine },
    { name: duel.foeName, deck: duel.foeDeck, shine: duel.foeShine, openingHand: duel.foeOpeningHand, life: duel.foeLife }
  );
  const [own, setS] = useState<BattleState>(() => (link ? link.view : newBattle()));
  const s = link ? link.view : own;
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [intro, setIntro] = useState(!link);
  const [overlay, setOverlay] = useState<'log' | 'cem' | 'unelco' | 'apagon' | 'copier' | null>(null);
  const [copied, setCopied] = useState(false);
  const prevWinner = useRef<0 | 1 | null>(null);

  useEffect(() => {
    if (link || intro || paused || overlay || s.winner !== null) return;
    const delay = (s.phase === 'start' ? 750 : s.phase === 'end' ? 450 : 950) / speed;
    const t = setTimeout(() => {
      setS((prev) => {
        const n = step(prev);
        if (n.shake !== null) beep('hit');
        else if (n.lastEvent.includes('->')) beep('play');
        else if (n.lastEvent.includes('baja ')) beep('open');
        else if (n.lastEvent.includes('vida)')) beep('heal');
        else if (n.lastEvent.includes('choca')) beep('hit');
        return n;
      });
    }, delay);
    return () => clearTimeout(t);
  }, [s, speed, paused, intro, overlay]);

  useEffect(() => {
    if (s.winner !== null && prevWinner.current === null) {
      beep(s.winner === 0 ? 'win' : 'lose');
      onFinish(s.winner === 0 ? 'win' : 'lose');
    }
    prevWinner.current = s.winner;
  }, [s.winner, onFinish]);

  // Combate por cable: el estado llega del enlace; aquí solo suenan los golpes.
  const linkView = link?.view;
  useEffect(() => {
    if (!linkView || linkView.winner !== null) return;
    if (linkView.shake !== null || linkView.lastEvent.includes('choca')) beep('hit');
    else if (linkView.lastEvent.includes('->')) beep('play');
    else if (linkView.lastEvent.includes('baja ')) beep('open');
    else if (linkView.lastEvent.includes('vida)')) beep('heal');
  }, [linkView]);

  const [me, foe] = s.players;
  const copierAvailable = !!save.flags.has_fotocopiadora && !save.flags.used_fotocopiadora && !copied;
  const rivalCards = [...new Map([...foe.hand, ...foe.board.map(m => m.def), ...foe.graveyard].map(c => [c.id, c])).values()];
  const unelco = me.lands.find((l) => l.def.id === 'unelco');
  const canTap = canTapUnelco(s, 0);
  const hl = (side: 0 | 1, kind: 'hand' | 'board' | 'hero' | 'land', uid?: number) =>
    s.highlights.some((h) => h.side === side && h.kind === kind && (kind !== 'board' || h.uid === uid));

  const heroRow = (p: typeof me, side: 0 | 1) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 5px', background: hl(side, 'hero') ? G[3] : 'transparent', color: hl(side, 'hero') ? G[0] : G[3], fontSize: 6, animation: s.shake === side ? 'gbshake 0.3s' : undefined, borderTop: side === 0 ? `2px solid ${G[3]}` : undefined, borderBottom: side === 1 ? `2px solid ${G[3]}` : undefined }}>
      <span title={p.poisoned ? 'Envenenado: pierde 1 de vida al final de su turno' : undefined}>{p.name} ♥{p.life}{p.poisoned ? ' V' : ''}</span>
      {p.fogTurns > 0 && <span title={`Nevada del Teide: ${p.fogTurns} turnos de protección restantes`}>NEVADA {p.fogTurns}</span>}
      {p.fogTurns === 0 && p.nextFogTurns > 0 && <span title="Nevada del Teide empieza al pasar turno">NEVADA +</span>}
      <span>MAZO:{p.deck.length}</span>
      <span>MANO:{p.hand.length}</span>
      <span>☠{p.graveyard.length}</span>
    </div>
  );

  const landStrip = (p: typeof me, side: 0 | 1) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, height: 15, padding: '0 4px', background: hl(side, 'land') ? G[1] : 'transparent' }}>
      <span style={{ fontSize: 5, color: G[2], marginRight: 2 }}>TIERRAS:</span>
      {p.lands.length === 0 && <span style={{ fontSize: 5, color: G[2] }}>ninguna</span>}
      {s.blackout && <span style={{ fontSize: 5, color: G[3], border: `1px solid ${G[3]}`, padding: '0 2px' }}>APAGÓN</span>}
      {p.lands.map((l) => {
        const title = `${l.def.name} (${l.tapped ? 'girada' : 'libre'})`;
        const style: React.CSSProperties = {
          display: 'inline-flex', alignItems: 'center', fontSize: 5, padding: '0 2px',
          border: `1px solid ${G[3]}`, background: l.tapped ? G[1] : G[0], opacity: l.tapped ? 0.5 : 1,
          transform: l.tapped ? 'rotate(18deg)' : 'none', transition: 'transform 0.15s',
        };
        if (!link && side === 0 && l.def.id === 'unelco' && !intro && s.winner === null) {
          return <button key={l.uid} type="button" title={title} aria-label={title} onClick={() => setOverlay('unelco')}
            style={{ ...style, minHeight: 12, background: canTap ? G[3] : style.background, color: canTap ? G[0] : G[3], cursor: 'pointer' }}>UNELCO *</button>;
        }
        return <span key={l.uid} title={title} style={style}>{l.produces ? LAND_INFO[l.produces].short : '*'}</span>;
      })}
      {p.unelcoMana && <span title={`1 maná ${LAND_INFO[p.unelcoMana].color.toLowerCase()} disponible`} style={{ fontSize: 5 }}>+1 {p.unelcoMana}</span>}
    </div>
  );

  const logText = useMemo(() => s.log.slice(-50), [s.log]);
  const eventUid = s.highlights.find((h) => h.kind === 'board')?.uid;
  const eventMinion = eventUid == null ? undefined : [...me.board, ...foe.board].find((m) => m.uid === eventUid);

  return (
    <div style={{ width: 320, height: 288, background: G[0], color: G[3], fontFamily: '"Press Start 2P", monospace', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', userSelect: 'none' }}>
      <style>{`@keyframes gbshake{0%{transform:translateX(0)}25%{transform:translateX(-3px)}50%{transform:translateX(3px)}75%{transform:translateX(-2px)}100%{transform:translateX(0)}}`}</style>

      {/* Rival + sus tierras */}
      {heroRow(foe, 1)}
      {landStrip(foe, 1)}

      {/* Mesa rival */}
      <div style={{ display: 'flex', gap: 3, justifyContent: 'center', alignItems: 'center', height: 62, padding: '0 3px' }}>
        {foe.board.length === 0 && <span style={{ fontSize: 6, color: G[2] }}>- campo despejado -</span>}
        {foe.board.map((m) => <MinionCard key={m.uid} m={m} hl={hl(1, 'board', m.uid)} />)}
      </div>

      {/* Tira de evento */}
      <div style={{ margin: '1px 5px', border: `2px solid ${G[3]}`, padding: '3px 5px', height: 28, background: G[0], display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {eventMinion && <span style={{ marginRight: 4, display: 'flex', alignItems: 'center' }}><Glyph def={eventMinion.def} size={20} /></span>}
        <span style={{ flex: 1, fontSize: 5.5, lineHeight: '8px' }}>{s.lastEvent}</span>
        <span style={{ fontSize: 5.5, color: G[2], marginLeft: 4, whiteSpace: 'nowrap' }}>T{s.turn} {s.active === 0 ? '▼TU' : '▲EL'}</span>
      </div>

      {/* Mesa tuya */}
      <div style={{ display: 'flex', gap: 3, justifyContent: 'center', alignItems: 'center', height: 62, padding: '0 3px' }}>
        {me.board.length === 0 && <span style={{ fontSize: 6, color: G[2] }}>- campo despejado -</span>}
        {me.board.map((m) => <MinionCard key={m.uid} m={m} hl={hl(0, 'board', m.uid)} />)}
      </div>

      {/* Tus tierras + Tu mano (7 iniciales) */}
      {landStrip(me, 0)}
      <div style={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'flex-end', padding: '1px 2px', height: 47, background: hl(0, 'hand') ? G[1] : 'transparent' }}>
        {me.hand.length === 0 && <span style={{ fontSize: 5, color: G[2], alignSelf: 'center' }}>- sin cartas en mano -</span>}
        {me.hand.map((c, i) => <HandCard key={i} c={c} />)}
      </div>

      {/* Tu barra */}
      {heroRow(me, 0)}

      {/* Controles de reproduccion */}
      <div style={{ display: 'flex', gap: 3, justifyContent: 'center', padding: 2, fontSize: 6 }}>
        {link ? <span style={{ ...btn(true), cursor: 'default' }}>⇄ CABLE</span> : <>
          {[1, 2, 4].map((v) => <button key={v} onClick={() => setSpeed(v)} style={btn(speed === v)}>x{v}</button>)}
          <button onClick={() => setPaused((p) => !p)} style={btn(paused)}>{paused ? 'PLAY' : 'PAUSA'}</button>
        </>}
        {!link && save.flags.has_fotocopiadora && <button onClick={() => setOverlay(overlay === 'copier' ? null : 'copier')} disabled={!copierAvailable} title="Interrumpe el autobattle y copia una carta rival. Un solo uso." style={{ ...btn(overlay === 'copier'), opacity: copierAvailable ? 1 : .55 }}>FOTO</button>}
        <button onClick={() => setOverlay((o) => (o === 'cem' ? null : 'cem'))} style={btn(overlay === 'cem')}>☠CEM</button>
        <button onClick={() => setOverlay((o) => (o === 'log' ? null : 'log'))} style={btn(overlay === 'log')}>LOG</button>
      </div>

      {(overlay === 'unelco' || overlay === 'apagon') && unelco && s.winner === null && (
        <div role="dialog" aria-label={overlay === 'apagon' ? 'Confirmar Apagón' : 'Unelco'}
          style={{ position: 'absolute', inset: 'auto 8px 30px', background: G[0], border: `3px double ${G[3]}`, padding: 8, fontSize: 5.5, lineHeight: '10px', zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <b>{overlay === 'apagon' ? 'APAGÓN' : 'UNELCO · TIERRA LEGENDARIA'}</b>
            <button type="button" style={btn(false)} onClick={() => setOverlay(overlay === 'apagon' ? 'unelco' : null)}>VOLVER</button>
          </div>
          {overlay === 'unelco' ? <>
            <p>{canTap ? 'GIRAR: elige el color del maná.' : unelco.tapped ? 'Unelco ya está girada.' : 'Puedes girar Unelco en tu fase principal.'}</p>
            {canTap && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, margin: '5px 0 8px' }}>
              {MANA_COLORS.map((color) => <button key={color} type="button" style={btn(true)}
                aria-label={`Girar Unelco por maná ${LAND_INFO[color].color.toLowerCase()}`}
                onClick={() => { setS((prev) => tapUnelco(prev, 0, color)); beep('play'); setOverlay(null); }}>
                {LAND_INFO[color].color.toUpperCase()}
              </button>)}
            </div>}
            {!s.blackout && <button type="button" style={{ ...btn(false), marginTop: 4 }} onClick={() => setOverlay('apagon')}>SACRIFICAR: APAGÓN</button>}
          </> : <>
            <p>{CARDS.unelco.sacrifice?.text}</p>
            <button type="button" style={{ ...btn(true), marginTop: 5 }}
              onClick={() => { setS((prev) => sacrificeUnelco(prev, 0)); beep('hit'); setOverlay(null); }}>CONFIRMAR SACRIFICIO</button>
          </>}
        </div>
      )}

      {/* Fotocopiadora: la Master Ball de papel */}
      {overlay === 'copier' && s.winner === null && (
        <div role="dialog" aria-label="Fotocopiadora" style={{ position: 'absolute', inset: 8, background: G[0], border: `3px double ${G[3]}`, padding: 6, zIndex: 40, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <b style={{ fontSize: 6 }}>FOTOCOPIADORA · ELIGE UNA CARTA RIVAL</b>
            <button onClick={() => setOverlay(null)} style={btn(true)}>VOLVER</button>
          </div>
          <div style={{ fontSize: 5.2, lineHeight: '8px', marginBottom: 5, color: G[2] }}>Autobattle interrumpido. La copia queda en tu mano y la máquina se gasta para siempre.</div>
          {!copierAvailable && <div style={{ fontSize: 5.5, marginBottom: 4 }}>{save.flags.used_fotocopiadora || copied ? 'La máquina ya está gastada.' : 'No tienes la Fotocopiadora.'}</div>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {rivalCards.map((c) => (
              <button key={c.id} disabled={!copierAvailable} style={{ ...btn(false), width: 91, textAlign: 'left', opacity: copierAvailable ? 1 : .5 }}
                onClick={() => {
                  const result = useFotocopiadora(save);
                  if (!result.ok) { setOverlay(null); return; }
                  if (c.id === 'magec' && !save.flags.magec_captured) {
                    // Magec no se puede capturar de ningún modo... salvo fotocopiándolo en su propio combate.
                    // La copia queda para siempre en tu colección (además de entrar en tu mano para este duelo).
                    save.flags.magec_captured = true;
                    save.flags['seen_magec'] = true;
                    const destination = canAddToDeck(save, 'magec') === null ? 'deck' : 'pc';
                    (destination === 'deck' ? save.deck : save.pc).push('magec');
                  }
                  touchSave(); setCopied(true);
                  try { localStorage.setItem('magomon.local.v1', exportSaveJSON()); } catch { /* Optional persistence. */ }
                  setS((prev) => copyRivalCard(prev, c.id));
                  beep('fanfare'); setOverlay(null);
                }}>
                <span style={{ display: 'block', fontSize: 4.8, lineHeight: '6px', marginBottom: 2 }}>{c.name.toUpperCase()}</span>
                <span style={{ fontSize: 4.2, color: G[2] }}>{c.type.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Registro */}
      {overlay === 'log' && (
        <div style={{ position: 'absolute', inset: 8, background: G[0], border: `3px double ${G[3]}`, padding: 6, fontSize: 5.5, lineHeight: '9px', overflowY: 'auto', zIndex: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><b>REGISTRO</b><button onClick={() => setOverlay(null)} style={btn(true)}>CERRAR</button></div>
          {logText.map((l, i) => <div key={i}>› {l}</div>)}
        </div>
      )}

      {/* Cementerio (lo que cae aqui NO vuelve al mazo jamas) */}
      {overlay === 'cem' && (
        <div style={{ position: 'absolute', inset: 8, background: G[0], border: `3px double ${G[3]}`, padding: 6, fontSize: 5.5, lineHeight: '9px', overflowY: 'auto', zIndex: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <b>☠ CEMENTERIO (NO VUELVEN)</b>
            <button onClick={() => setOverlay(null)} style={btn(true)}>CERRAR</button>
          </div>
          <div style={{ marginBottom: 6 }}>
            <b>TUS CAIDOS ({me.graveyard.length}):</b><br />
            {me.graveyard.length === 0 ? 'Ninguno aun.' : me.graveyard.map((c) => c.name).join(', ')}
          </div>
          <div>
            <b>CAIDOS DE {foe.name} ({foe.graveyard.length}):</b><br />
            {foe.graveyard.length === 0 ? 'Ninguno aun.' : foe.graveyard.map((c) => c.name).join(', ')}
          </div>
        </div>
      )}

      {/* Intro con reglas */}
      {intro && (
        <div style={{ position: 'absolute', inset: 0, background: G[0], display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 10, textAlign: 'center', zIndex: 40 }}>
          <div style={{ fontSize: 7 }}>
            {duel.bolicheName
              ? `★ ${duel.bolicheName} ★`
              : duel.isPractice
              ? 'MESA DEL LABORATORIO'
              : duel.stake === 0
              ? `SIN RIESGO (0D) · GANAS +${duel.purse}D + SOBRE`
              : duel.stake < duel.purse
              ? `ARRIESGAS ${duel.stake}D · GANAS +${duel.purse}D + SOBRE`
              : `APUESTA: ${duel.purse} DUROS + SOBRE`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Glyph def={CARDS[duel.yourIcon]} size={56} />
              <span style={{ fontSize: 5 }}>{duel.yourLabel.toUpperCase()}</span>
            </div>
            <span style={{ fontSize: 9 }}>VS</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Glyph def={CARDS[duel.foeIcon]} size={56} />
              <span style={{ fontSize: 5 }}>{CARDS[duel.foeIcon].name.toUpperCase()}</span>
            </div>
          </div>
          <div style={{ fontSize: 5.5 }}>{duel.yourLabel.toUpperCase()} ({save.deck.length}) vs {duel.foeTitle.toUpperCase()} ({duel.foeDeck.length})</div>
          <div style={{ fontSize: 4.8, lineHeight: '8px', color: G[2], border: `2px solid ${G[3]}`, padding: 4, textAlign: 'left', width: '95%' }}>
            • MANO INICIAL DE 7 ALEATORIAS + ROBAS 1 CADA TURNO.<br />
            • CEMENTERIO REAL: bicho muerto NO vuelve al mazo jamas.<br />
            • TIERRAS: R=Volcan · U=Charco · G=Laurisilva · W=Playa · B=Malpais.<br />
            {save.deck.includes('unelco') && <>• TOCA UNELCO EN TUS TIERRAS: GÍRALA POR MANÁ O SACRIFÍCALA PARA APAGÓN.<br /></>}
            {save.flags.has_fotocopiadora && !save.flags.used_fotocopiadora && <>• FOTO: INTERRUMPE EL AUTOBATTLE Y COPIA UNA CARTA RIVAL. UN USO.<br /></>}
            • PROHIBIDO PEGAR AL ENTRENADOR si tiene bichos (salvo ↗DIRECTO).
            {duel.foeDeck.some(id => CARDS[id]?.keywords?.includes('veneno')) && <><br />• VENENO (V): -1 VIDA AL FINAL DEL TURNO DEL AFECTADO.</>}
          </div>
          <button onClick={() => { beep('fanfare'); setIntro(false); }} style={{ ...btn(true), fontSize: 7, padding: '5px 8px' }}>BARAJAR Y ROBAR 7</button>
        </div>
      )}

      {link?.note && s.winner === null && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, background: G[3], color: G[0], fontSize: 5.5, textAlign: 'center', padding: '2px 0', zIndex: 39 }}>{link.note}</div>
      )}

      {/* Fin del combate */}
      {s.winner !== null && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,56,15,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7, color: G[0], textAlign: 'center', padding: 14, zIndex: 40 }}>
          <div style={{ fontSize: 11 }}>{s.winner === 0 ? '¡VICTORIA!' : '¡PAJARA! DERROTA'}</div>
          <Glyph def={s.winner === 0 ? CARDS[duel.yourIcon] : CARDS[duel.foeIcon]} size={50} />
          <div style={{ fontSize: 5.8, lineHeight: '9.5px', maxWidth: 290 }}>
            {(s.winner === 0 ? duel.winLines : duel.loseLines).map((l, i) => <div key={i} style={{ marginBottom: 3 }}>{l}</div>)}
          </div>
          {!duel.isPractice && !link && (
            <div style={{ fontSize: 6.5, border: `2px solid ${G[0]}`, padding: '4px 7px', lineHeight: '10px' }}>
              {s.winner === 0
                ? duel.bolicheName
                  ? `★ ${duel.bolicheName} · +${duel.purse}D + SOBRE`
                  : `+${duel.purse} DUROS + SOBRE (ELIGE 1 DE 5)`
                : duel.stake > 0
                ? `-${duel.stake} DUROS · RUMBO AL CENTRO PARRANDERO`
                : `SIN RIESGO (0 DUROS) · RUMBO AL CENTRO PARRANDERO`}
            </div>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            {link ? (
              <button onClick={onBackToLab} style={{ ...btn(true), fontSize: 7, padding: '5px 9px' }}>VOLVER AL CLUB DEL CABLE</button>
            ) : duel.isPractice ? (
              <>
                <button onClick={() => { prevWinner.current = null; setS(newBattle()); setIntro(false); }} style={{ ...btn(true), fontSize: 7 }}>REVANCHA</button>
                <button onClick={onBackToLab} style={{ ...btn(false), fontSize: 7, color: G[0], borderColor: G[0], background: 'transparent' }}>VOLVER AL LAB</button>
              </>
            ) : (
              <button onClick={onBackToLab} style={{ ...btn(true), fontSize: 7, padding: '5px 9px' }}>
                {s.winner === 0 ? 'ABRIR SOBRE' : 'IR AL CENTRO PARRANDERO'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const btn = (active: boolean): React.CSSProperties => ({
  fontFamily: 'inherit', fontSize: 5.5, padding: '2px 4px', border: `2px solid ${G[3]}`, background: active ? G[3] : G[0], color: active ? G[0] : G[3], cursor: 'pointer',
});
