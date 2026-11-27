import React, { useEffect, useState } from 'react';
import { CARDS, EVO_NEXT, MAX_DECK, isFinalStage } from '../battle/cards';
import { canAddToDeck, combineWithReward, countOwned } from '../battle/booster';
import { claimBoosterReward, type ClaimResult, type RewardDestination } from '../game/rewards';
import { save, touchSave } from '../game/save';
import { input, ui } from '../game/input';
import { beep } from '../game/sfx';
import { CardChip, GB, Sprite } from './CardArt';

interface Props {
  cards: string[];
  purse: number;
  trainerName: string;
  bolicheName?: string;
  onClose: () => void;
}

type Success = Extract<ClaimResult, { ok: true }>;

export function BoosterModal({ cards, purse, trainerName, bolicheName, onClose }: Props) {
  const [revealed, setRevealed] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<Success | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    ui.paused = true;
    input.held.clear();
    return () => { ui.paused = false; };
  }, []);

  useEffect(() => {
    if (revealed >= cards.length) return;
    const timer = window.setTimeout(() => {
      setRevealed((value) => value + 1);
      beep(revealed === cards.length - 1 ? 'fanfare' : 'open');
    }, revealed === 0 ? 260 : 350);
    return () => window.clearTimeout(timer);
  }, [revealed, cards.length]);

  const selectedId = selected === null ? null : cards[selected];
  const chosenCard = selectedId ? CARDS[selectedId] : null;
  const owned = selectedId ? countOwned(save, selectedId) : 0;
  const eligible = !!chosenCard && chosenCard.type === 'creature' && owned >= 4;
  const deckError = selectedId && !eligible ? canAddToDeck(save, selectedId) : null;
  const preview = eligible && selectedId
    ? combineWithReward({ deck: [...save.deck], pc: [...save.pc], shine: { ...save.shine }, flags: { ...save.flags } }, selectedId)
    : null;

  const claim = (destination: RewardDestination) => {
    if (selected === null || outcome) return;
    const result = claimBoosterReward(save, selected, destination);
    if (!result.ok) {
      setError(result.error);
      beep('bump');
      return;
    }
    setOutcome(result);
    setError('');
    touchSave();
    beep(result.combination ? 'fanfare' : 'play');
  };

  return (
    <div style={S.backdrop}>
      <div style={S.panel} role="dialog" aria-modal="true" aria-labelledby="booster-title">
        <div style={S.heading}>
          <div>
            <div id="booster-title" style={{ fontSize: 12 }}>ELIGE 1 DE 5</div>
            {bolicheName && (
              <div style={{ fontSize: 7, background: GB[3], color: GB[0], padding: '3px 6px', marginTop: 5, display: 'inline-block' }}>
                ★ {bolicheName} CONSEGUIDO
              </div>
            )}
            <div style={{ fontSize: 8, color: GB[2], marginTop: 6, lineHeight: '13px' }}>
              {trainerName} abre su sobre. Las otras cuatro se quedan con el entrenador.
            </div>
          </div>
          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: 14 }}>+{purse}</div>
            <div style={{ fontSize: 6, color: GB[2], marginTop: 3 }}>DUROS</div>
          </div>
        </div>

        {!outcome ? (
          <>
            <p style={S.caption}>Mira las cinco cartas y escoge una. Desliza para verlas todas.</p>
            <div style={S.carousel} aria-label="Cartas disponibles en el sobre">
              {cards.map((id, index) => {
                const shown = index < revealed;
                return (
                  <button
                    key={index}
                    type="button"
                    disabled={!shown || revealed < cards.length}
                    aria-label={shown ? `Elegir ${CARDS[id].name}, carta ${index + 1} de ${cards.length}` : `Carta ${index + 1} sin revelar`}
                    aria-pressed={selected === index}
                    onClick={() => { setSelected(index); setError(''); beep('talk'); }}
                    style={S.cardButton}
                  >
                    <div className={shown ? 'card-in' : 'card-back'}>
                      {shown ? (
                        <CardChip id={id} shine={save.shine[id] ?? 0} highlight={selected === index} />
                      ) : (
                        <div style={S.cardBack}>?</div>
                      )}
                    </div>
                    <span style={{ ...S.cardIndex, color: selected === index ? GB[3] : GB[2] }}>
                      {selected === index ? 'SELECCIONADA' : `${index + 1} / ${cards.length}`}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={S.actionArea} aria-live="polite">
              {chosenCard && selectedId ? (
                <>
                  <div style={S.selectedTitle}>{chosenCard.name.toUpperCase()}</div>
                  <p style={S.detail}>
                    {chosenCard.type === 'creature'
                      ? `Ya tienes ${owned}: ${save.deck.filter((id) => id === selectedId).length} en el mazo y ${save.pc.filter((id) => id === selectedId).length} en el PC.`
                      : chosenCard.type === 'land'
                      ? 'Las tierras no evolucionan y no tienen limite de copias.'
                      : 'Los hechizos no evolucionan. Maximo cuatro copias en el mazo.'}
                  </p>

                  {eligible && preview ? (
                    <>
                      <p style={S.evolutionHint}>
                        Tu carta del sobre es la quinta. Combina ahora las cinco para obtener{' '}
                        {isFinalStage(selectedId) ? `${chosenCard.name} con +1/+1` : CARDS[EVO_NEXT[selectedId]!].name}.
                        {preview.destination === 'deck'
                          ? ` Ira al mazo (${save.deck.length} -> ${save.deck.length - preview.removedFromDeck + 1}/60).`
                          : ' Ira al PC: no cabe en el mazo o ya tienes cuatro de la evolucion.'}
                      </p>
                      <div style={S.buttons}>
                        <button type="button" onClick={() => claim('pc')} style={S.secondary}>GUARDAR EN PC</button>
                        <button type="button" onClick={() => claim('evolve')} style={S.primary}>
                          {isFinalStage(selectedId) ? 'MEJORAR +1/+1' : 'EVOLUCIONAR'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {deckError && <p style={S.evolutionHint}>{deckError} Puedes guardar la carta en el PC.</p>}
                      <div style={S.buttons}>
                        <button type="button" onClick={() => claim('pc')} style={S.secondary}>GUARDAR EN PC</button>
                        <button type="button" onClick={() => claim('deck')} disabled={!!deckError} style={{ ...S.primary, opacity: deckError ? 0.45 : 1 }}>
                          ANADIR AL MAZO
                        </button>
                      </div>
                    </>
                  )}
                  {error && <p role="alert" style={S.error}>{error}</p>}
                </>
              ) : (
                <div style={S.detail}>{revealed < cards.length ? 'Abriendo el sobre...' : 'Selecciona una carta para ver tus opciones.'}</div>
              )}
            </div>
          </>
        ) : (
          <div style={S.result} aria-live="polite">
            {outcome.combination ? (
              <>
                <div style={S.resultTitle}>{outcome.combination.shineUp ? 'MEJORA COMPLETADA' : 'EVOLUCION COMPLETADA'}</div>
                <div style={S.evolutionRow}>
                  <div style={S.evolutionCard}>
                    <Sprite id={outcome.cardId} size={48} />
                    <span>5 x {CARDS[outcome.cardId].name}</span>
                  </div>
                  <span style={{ fontSize: 15 }}>-&gt;</span>
                  <div style={S.evolutionCard}>
                    <Sprite id={outcome.combination.newId} size={64} />
                    <span>1 x {CARDS[outcome.combination.newId].name}</span>
                  </div>
                </div>
                <p style={S.detail}>
                  {outcome.combination.shineUp ? 'La carta final gana +1/+1 permanente. ' : ''}
                  Resultado guardado en {outcome.destination === 'deck' ? 'tu mazo' : 'el PC de Ayoze'}.
                </p>
              </>
            ) : (
              <>
                <div style={S.resultTitle}>CARTA ELEGIDA</div>
                <CardChip id={outcome.cardId} size="lg" shine={save.shine[outcome.cardId] ?? 0} />
                <p style={S.detail}>Guardada en {outcome.destination === 'deck' ? 'tu mazo' : 'el PC de Ayoze'}.</p>
              </>
            )}
            <p style={S.caption}>Solo te llevas esta carta; las otras cuatro no se anaden a tu coleccion.</p>
            <button type="button" style={S.primary} onClick={() => { beep('talk'); onClose(); }}>CERRAR SOBRE</button>
          </div>
        )}
        <div style={S.footer}>MAZO {save.deck.length}/{MAX_DECK} &nbsp; PC {save.pc.length} &nbsp; DUROS {save.duros}</div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(8,12,8,.86)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
  },
  panel: {
    width: '100%', maxWidth: 660, maxHeight: '94vh', overflowY: 'auto',
    background: GB[0], color: GB[3], border: `4px double ${GB[3]}`,
    fontFamily: '"Press Start 2P", monospace', padding: 12,
    boxShadow: '0 20px 60px rgba(0,0,0,.75)',
  },
  heading: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
    borderBottom: `3px solid ${GB[3]}`, paddingBottom: 9,
  },
  caption: { fontSize: 7, lineHeight: '12px', color: GB[2], margin: '10px 0 4px' },
  carousel: { display: 'flex', gap: 8, overflowX: 'auto', padding: '10px 4px 10px', alignItems: 'flex-start' },
  cardButton: {
    appearance: 'none', border: 0, padding: 0, background: 'transparent', color: GB[3],
    fontFamily: 'inherit', cursor: 'pointer', flex: '0 0 116px', textAlign: 'center',
  },
  cardBack: {
    width: 116, height: 142, border: `2px solid ${GB[3]}`,
    background: `repeating-linear-gradient(45deg, ${GB[2]} 0 4px, ${GB[1]} 4px 8px)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
  },
  cardIndex: { display: 'block', fontSize: 6, marginTop: 6, minHeight: 12 },
  actionArea: { borderTop: `2px solid ${GB[3]}`, paddingTop: 10, minHeight: 80 },
  selectedTitle: { fontSize: 9, marginBottom: 6 },
  detail: { fontSize: 7, lineHeight: '13px', margin: '5px 0', color: GB[3] },
  evolutionHint: { fontSize: 7, lineHeight: '13px', margin: '7px 0', padding: 7, border: `1px solid ${GB[3]}`, background: GB[1] },
  error: { fontSize: 7, color: '#7a1f1f', lineHeight: '12px' },
  buttons: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9 },
  primary: {
    fontFamily: 'inherit', fontSize: 8, padding: '8px 10px', border: `2px solid ${GB[3]}`,
    background: GB[3], color: GB[0], cursor: 'pointer',
  },
  secondary: {
    fontFamily: 'inherit', fontSize: 8, padding: '8px 10px', border: `2px solid ${GB[3]}`,
    background: GB[1], color: GB[3], cursor: 'pointer',
  },
  result: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center', padding: '18px 0' },
  resultTitle: { fontSize: 9, marginBottom: 5 },
  evolutionRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 },
  evolutionCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, fontSize: 6, lineHeight: '10px', maxWidth: 120 },
  footer: { borderTop: `1px solid ${GB[3]}`, paddingTop: 8, fontSize: 7, lineHeight: '12px', color: GB[2] },
};