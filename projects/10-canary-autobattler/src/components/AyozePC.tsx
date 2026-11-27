import React, { useEffect, useMemo, useReducer, useState } from 'react';
import {
  CARDS, CardDef, EVO_CHAINS, EVO_NEXT, LAND_INFO, MAX_COPIES, MAX_DECK,
  STAGE_LABEL, formatMana,
} from '../battle/cards';
import { combineInfo, combineReady, countOwned, doCombine, moveToDeck, moveToPC } from '../battle/booster';
import { save, subscribeSave, touchSave } from '../game/save';
import { beep } from '../game/sfx';
import { ui } from '../game/input';
import { CardChip, GB, Sprite } from './CardArt';

type Tab = 'mazo' | 'coleccion' | 'combinar';

const col = () => ({ deck: save.deck, pc: save.pc, shine: save.shine, flags: save.flags });

export function AyozePC({ onClose }: { onClose: () => void }) {
  const [revision, force] = useReducer((x: number) => x + 1, 0);
  const [tab, setTab] = useState<Tab>('mazo');
  const [flash, setFlash] = useState<string | null>(null);
  const [combined, setCombined] = useState<{ from: string; to: string; shineUp: boolean; destination: 'deck' | 'pc' } | null>(null);

  useEffect(() => subscribeSave(force), []);
  useEffect(() => { ui.paused = true; return () => { ui.paused = false; }; }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const say = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(null), 2600);
  };

  // ---- MAZO: agrupado por tipo ----
  const grouped = useMemo(() => {
    const g: Record<string, Record<string, number>> = { land: {}, creature: {}, spell: {} };
    for (const id of save.deck) g[CARDS[id]?.type ?? 'spell'][id] = (g[CARDS[id]?.type ?? 'spell'][id] ?? 0) + 1;
    return g;
  }, [revision]);

  const pcGrouped = useMemo(() => {
    const g: Record<string, number> = {};
    for (const id of save.pc) g[id] = (g[id] ?? 0) + 1;
    return g;
  }, [revision]);

  const allOwned = useMemo(() => {
    const set = new Set([...save.deck, ...save.pc]);
    return [...set].sort((a, b) => {
      const ca = CARDS[a], cb = CARDS[b];
      if (ca.type !== cb.type) return ca.type === 'creature' ? -1 : 1;
      return (ca.stage ?? 0) - (cb.stage ?? 0) || ca.name.localeCompare(cb.name);
    });
  }, [revision]);

  const ready = useMemo(() => combineReady(col()), [revision]);
  const chainsTouched = useMemo(() => {
    const roots = new Set<string>();
    for (const id of [...save.deck, ...save.pc]) if (CARDS[id]?.chain) roots.add(CARDS[id].chain);
    return [...roots];
  }, [revision]);

  const act = (fn: () => string | null | void) => {
    const r = fn();
    touchSave();
    if (typeof r === 'string' && r) { beep('bump'); say(r); } else beep('play');
  };

  return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.panel} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `3px solid ${GB[3]}`, paddingBottom: 6 }}>
          <div>
            <div style={{ fontSize: 12 }}>PC DE AYOZE</div>
            <div style={{ fontSize: 6, color: GB[2], marginTop: 4 }}>
              {save.duros} DUROS · {save.sobres} SOBRE{save.sobres === 1 ? '' : 'S'} · {Object.keys(save.beaten).length} ENTRENADOR{Object.keys(save.beaten).length === 1 ? '' : 'ES'}
            </div>
          </div>
          <button style={S.x} onClick={onClose}>CERRAR</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, margin: '8px 0' }}>
          {(['mazo', 'coleccion', 'combinar'] as Tab[]).map((t) => (
            <button
              key={t}
              style={{ ...S.tab, ...(tab === t ? S.tabOn : null) }}
              onClick={() => { beep('talk'); setTab(t); }}
            >
              {t.toUpperCase()}{t === 'combinar' && ready.length > 0 ? ` (${ready.length})` : ''}
            </button>
          ))}
        </div>

        {/* Aviso */}
        {flash && <div style={S.flash}>{flash}</div>}

        {/* ---------- MAZO ---------- */}
        {tab === 'mazo' && (
          <>
            <div style={S.bar}>
              <div style={{ ...S.barFill, width: `${Math.min(100, (save.deck.length / MAX_DECK) * 100)}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 6.5, margin: '4px 0 10px' }}>
              <span>MAZO {save.deck.length}/{MAX_DECK}</span>
              <span style={{ color: GB[2] }}>max {MAX_COPIES} copias por carta (tierras sin limite)</span>
            </div>

            {(['creature', 'spell', 'land'] as const).map((kind) => {
              const entries = Object.entries(grouped[kind]);
              if (entries.length === 0 && kind !== 'creature') return null;
              return (
                <div key={kind} style={{ marginBottom: 12 }}>
                  <div style={S.section}>
                    {kind === 'creature' ? 'MAGOMONES' : kind === 'spell' ? 'HECHIZOS' : 'TIERRAS'}
                    <span style={{ color: GB[2] }}>{entries.reduce((n, [, q]) => n + q, 0)}</span>
                  </div>
                  {entries.length === 0 && <div style={{ fontSize: 6, color: GB[2], padding: '6px 0' }}>Ninguno.</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {entries.map(([id, q]) => {
                      const def = CARDS[id];
                      const info = combineInfo(col(), id);
                      return (
                        <div key={id} style={S.row}>
                          <Sprite id={id} size={30} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 7, display: 'flex', gap: 5, alignItems: 'baseline' }}>
                              <span>{def.name.toUpperCase()}</span>
                              {def.type === 'creature' && <span style={{ fontSize: 5.5, color: GB[2] }}>{STAGE_LABEL[def.stage ?? 0]}{(save.shine[id] ?? 0) > 0 ? ` ★${save.shine[id]}` : ''}</span>}
                              {def.type === 'creature' && <span style={{ fontSize: 6 }}>⚔{(def.atk ?? 0) + (save.shine[id] ?? 0)} ♥{(def.hp ?? 0) + (save.shine[id] ?? 0)}</span>}
                            </div>
                            <div style={{ fontSize: 5.5, color: GB[2], marginTop: 2 }}>
                              {def.type === 'land' ? (def.producesAny ? 'Gira: 1 maná de cualquier color' : LAND_INFO[def.produces!].name) : formatMana(def.mana)}
                              {info.ready && def.type === 'creature' ? ' · 5 COPIAS: COMBINABLE' : ''}
                            </div>
                          </div>
                          <span style={S.badge}>×{q}</span>
                          <button style={S.mini} onClick={() => act(() => moveToPC(col(), id) ? null : 'No queda ninguna en el mazo.')}>→ PC</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {Object.keys(pcGrouped).length > 0 && (
              <div>
                <div style={S.section}>
                  EN EL PC DE AYOZE
                  <span style={{ color: GB[2] }}>{save.pc.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {Object.entries(pcGrouped).map(([id, q]) => (
                    <div key={id} style={S.row}>
                      <Sprite id={id} size={26} />
                      <span style={{ flex: 1, fontSize: 6.5, minWidth: 0 }}>{CARDS[id].name.toUpperCase()}</span>
                      {CARDS[id].firstEdition && <span style={{ fontSize: 5, color: GB[2] }}>{save.flags['cert_' + id] ? 'CERTIFICADA' : 'SIN CERTIFICAR'}</span>}
                      <span style={S.badge}>×{q}</span>
                      <button style={S.mini} onClick={() => act(() => moveToDeck(col(), id))}>→ MAZO</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ---------- COLECCION ---------- */}
        {tab === 'coleccion' && (
          <>
            <div style={{ fontSize: 6.5, color: GB[2], marginBottom: 8 }}>
              Descubiertos: {allOwned.filter((i) => CARDS[i].type === 'creature').length}/{Object.values(CARDS).filter((c) => c.type === 'creature').length} magomones
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {allOwned.map((id) => (
                <CardChip
                  key={id}
                  id={id}
                  size="sm"
                  shine={save.shine[id] ?? 0}
                  count={countOwned(col(), id)}
                  onClick={() => {
                    const def = CARDS[id];
                    say(`${def.name.toUpperCase()} — ${def.text} (${def.biome?.toUpperCase() ?? 'TIERRA/HECHIZO'})`);
                  }}
                />
              ))}
            </div>

            <div style={{ ...S.section, marginTop: 14 }}>CADENAS EVOLUTIVAS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {chainsTouched.map((root) => {
                const chain = EVO_CHAINS[root] ?? [];
                return (
                  <div key={root} style={{ border: `1px solid ${GB[3]}`, background: GB[1], padding: 6 }}>
                    <div style={{ fontSize: 6, marginBottom: 5, color: GB[3] }}>
                      {chain.length} ETAPA{chain.length === 1 ? '' : 'S'} · combina 5 copias para avanzar
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      {chain.map((cid, i) => {
                        const have = countOwned(col(), cid);
                        return (
                          <React.Fragment key={cid}>
                            {i > 0 && <span style={{ fontSize: 9, color: GB[2] }}>→</span>}
                            <div style={{ textAlign: 'center', opacity: have > 0 ? 1 : 0.32 }}>
                              <Sprite id={cid} size={30} dim={have === 0} />
                              <div style={{ fontSize: 4.5, marginTop: 2, maxWidth: 56, lineHeight: '6px' }}>{CARDS[cid].name.toUpperCase()}</div>
                              <div style={{ fontSize: 5.5, color: have >= 5 ? GB[3] : GB[2] }}>{have}/5</div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {chainsTouched.length === 0 && <div style={{ fontSize: 6, color: GB[2] }}>Aun no tienes magomones.</div>}
            </div>
          </>
        )}

        {/* ---------- COMBINAR ---------- */}
        {tab === 'combinar' && (
          <>
            <div style={{ fontSize: 6.5, lineHeight: '10px', color: GB[2], marginBottom: 10, border: `1px solid ${GB[3]}`, padding: 6, background: GB[1] }}>
              AYOZE: Junta <b>5 copias</b> del mismo magomon y la maquina te devuelve <b>1 carta mas tocha</b>.
              En la ultima etapa de la cadena no evoluciona: sube <b>+1/+1 permanente (BRILLO ★)</b>.
              Tierras y hechizos no evolucionan.
            </div>

            {combined && (
              <div style={S.combineBox}>
                <div style={{ fontSize: 9, marginBottom: 8 }}>{combined.shineUp ? '★ BRILLO +1/+1' : '¡EVOLUCION!'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center', opacity: 0.5 }}>
                    <Sprite id={combined.from} size={48} />
                    <div style={{ fontSize: 5.5, marginTop: 3 }}>5× {CARDS[combined.from].name.toUpperCase()}</div>
                  </div>
                  <span style={{ fontSize: 15 }}>→</span>
                  <div style={{ textAlign: 'center' }}>
                    <Sprite id={combined.to} size={64} />
                    <div style={{ fontSize: 6.5, marginTop: 3 }}>1× {CARDS[combined.to].name.toUpperCase()}{combined.shineUp ? ` ★${save.shine[combined.to] ?? 1}` : ''}</div>
                  </div>
                </div>
                <div style={{ fontSize: 5.5, color: GB[2], marginTop: 8, lineHeight: '9px', textAlign: 'center', maxWidth: 330 }}>
                  {CARDS[combined.to].text} Guardada en {combined.destination === 'deck' ? 'el mazo' : 'el PC'}.
                </div>
                <button style={{ ...S.big, marginTop: 8 }} onClick={() => setCombined(null)}>GUARDAR EN LA MAGODEX</button>
              </div>
            )}

            {!combined && (
              <>
                <div style={S.section}>LISTAS PARA COMBINAR<span style={{ color: GB[2] }}>{ready.length}</span></div>
                {ready.length === 0 && (
                  <div style={{ fontSize: 6.5, color: GB[2], padding: '8px 0', lineHeight: '10px' }}>
                    Nada por ahora. Gana entrenadores, abre sobres y junta 5 copias.
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ready.map((id) => {
                    const next = EVO_NEXT[id];
                    const final = isFinalOf(id);
                    return (
                      <div key={id} style={S.combineRow}>
                        <Sprite id={id} size={40} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 7 }}>5× {CARDS[id].name.toUpperCase()}</div>
                          <div style={{ fontSize: 5.5, color: GB[2], marginTop: 3 }}>
                            {final ? 'Ultima etapa: la carta gana ★ BRILLO (+1/+1 permanente)' : `Evoluciona a ${CARDS[next!].name.toUpperCase()}`}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {!final && <Sprite id={next!} size={46} />}
                          <button
                            style={S.big}
                            onClick={() => {
                              const r = doCombine(col(), id);
                              if (r) {
                                save.flags['seen_' + r.newId] = true;
                                touchSave();
                                beep('fanfare');
                                setCombined({ from: id, to: r.newId, shineUp: r.shineUp, destination: r.destination });
                              }
                            }}
                          >
                            COMBINAR
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ ...S.section, marginTop: 14 }}>PROGRESO POR CADENA</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {Object.entries(EVO_CHAINS).map(([root, chain]) => {
                    const best = chain.filter((c) => countOwned(col(), c) > 0);
                    const furthest = best.length > 0 ? best[best.length - 1] : chain[0];
                    const near = countOwned(col(), chain[Math.max(0, chain.indexOf(furthest) - 1)] ?? chain[0]);
                    return (
                      <div key={root} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 6, borderBottom: `1px dashed ${GB[2]}`, paddingBottom: 4 }}>
                        <Sprite id={furthest} size={22} dim={best.length === 0} />
                        <span style={{ flex: 1, minWidth: 0 }}>{CARDS[furthest].name.toUpperCase()}</span>
                        <span style={{ color: GB[2], fontSize: 5.5 }}>
                          {best.length === 0 ? 'sin descubrir' : `etapa ${chain.indexOf(furthest) + 1}/${chain.length}`}
                        </span>
                        {best.length > 0 && chain.indexOf(furthest) < chain.length - 1 && (
                          <span style={{ fontSize: 5.5 }}>{near}/5 pta. anterior</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function isFinalOf(id: string): boolean {
  const c: CardDef | undefined = CARDS[id];
  if (!c?.chain) return true;
  const chain = EVO_CHAINS[c.chain];
  return !chain || chain[chain.length - 1] === id;
}

const S: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(8,12,8,.86)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10,
  },
  panel: {
    width: '100%', maxWidth: 640, maxHeight: '94vh', overflowY: 'auto',
    background: GB[0], color: GB[3], border: `4px double ${GB[3]}`,
    fontFamily: '"Press Start 2P", monospace', padding: 12,
    boxShadow: '0 20px 60px rgba(0,0,0,.75)',
  },
  x: {
    fontFamily: '"Press Start 2P", monospace', fontSize: 6, padding: '5px 7px',
    border: `2px solid ${GB[3]}`, background: GB[3], color: GB[0], cursor: 'pointer',
  },
  tab: {
    fontFamily: '"Press Start 2P", monospace', fontSize: 6.5, padding: '6px 8px',
    border: `2px solid ${GB[3]}`, background: GB[1], color: GB[3], cursor: 'pointer',
    transition: 'background .14s ease, transform .14s ease',
  },
  tabOn: { background: GB[3], color: GB[0] },
  section: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: 7, borderBottom: `2px solid ${GB[3]}`, paddingBottom: 3, marginBottom: 7, marginTop: 2,
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 7, padding: '4px 5px',
    border: `1px solid ${GB[2]}`, background: GB[1],
  },
  combineRow: {
    display: 'flex', alignItems: 'center', gap: 8, padding: 7,
    border: `2px solid ${GB[3]}`, background: GB[1],
  },
  badge: {
    fontSize: 7, border: `1px solid ${GB[3]}`, padding: '2px 4px', background: GB[0],
  },
  mini: {
    fontFamily: '"Press Start 2P", monospace', fontSize: 5.5, padding: '4px 5px',
    border: `1px solid ${GB[3]}`, background: GB[3], color: GB[0], cursor: 'pointer', whiteSpace: 'nowrap',
  },
  big: {
    fontFamily: '"Press Start 2P", monospace', fontSize: 6.5, padding: '7px 9px',
    border: `2px solid ${GB[3]}`, background: GB[3], color: GB[0], cursor: 'pointer', whiteSpace: 'nowrap',
  },
  bar: { height: 8, border: `2px solid ${GB[3]}`, background: GB[1], overflow: 'hidden' },
  barFill: { height: '100%', background: GB[3], transition: 'width .3s ease' },
  flash: {
    fontSize: 6, lineHeight: '9px', background: GB[3], color: GB[0],
    padding: '5px 7px', marginBottom: 8,
  },
  combineBox: {
    border: `3px solid ${GB[3]}`, background: GB[1], padding: 12,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
};
