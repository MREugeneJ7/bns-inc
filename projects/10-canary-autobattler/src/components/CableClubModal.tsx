import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { BattleScreen, type Duel } from '../battle/BattleScreen';
import { CARDS, STAGE_LABEL } from '../battle/cards';
import { creatureURL } from '../game/creatureArt';
import { input, ui } from '../game/input';
import { exportSaveJSON, save, touchSave } from '../game/save';
import { beep } from '../game/sfx';
import { CableClub, LINK_MIN_DECK, tradeable, type Room } from '../link/club';
import type { LinkTransport } from '../link/session';
import {
  LINK_BAUD, SerialCable, cableSupport, explainCableError, rememberedSerialPorts, requestSerialCable, requestUsbCable,
  type SerialPortLike,
} from '../link/transports';

interface Props {
  room: Room;
  onClose: () => void;
}

/** Cada intercambio y cada combate se guardan al momento: un cable se puede soltar en cualquier instante. */
function persist() {
  touchSave();
  try {
    localStorage.setItem('magomon.local.v1', exportSaveJSON());
  } catch {
    /* sin almacenamiento: queda el guardado manual */
  }
}

/** Encaja la pantalla de combate (320x288) en el hueco disponible. */
function Fit({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current!;
    const fit = () => setScale(el.clientWidth / 320);
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    fit();
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ width: 'min(96vw, calc(88vh * 320 / 288))', aspectRatio: '320 / 288', overflow: 'hidden' }}>
      <div style={{ width: 320, height: 288, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
    </div>
  );
}

/**
 * Reloj del enlace (25 veces por segundo). Va en un worker porque el navegador frena los
 * temporizadores de una pestaña en segundo plano, y un cable no puede quedarse sin latido
 * porque alguien cambie de pestaña en mitad de un combate.
 */
function startTicker(fn: () => void): () => void {
  let fallback = 0;
  const useInterval = () => {
    if (!fallback) fallback = window.setInterval(fn, 40);
  };
  try {
    const src = URL.createObjectURL(new Blob(['setInterval(function(){postMessage(0)},40)'], { type: 'text/javascript' }));
    const worker = new Worker(src);
    worker.onmessage = fn;
    worker.onerror = useInterval;
    return () => {
      worker.terminate();
      URL.revokeObjectURL(src);
      if (fallback) window.clearInterval(fallback);
    };
  } catch {
    useInterval();
    return () => window.clearInterval(fallback);
  }
}

const BTN = 'w-full text-[7px] leading-relaxed py-2 px-2 bg-[#0f380f] text-[#9bbc0f] rounded cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
const BTN_SOFT = 'text-[6.5px] leading-relaxed py-1.5 px-2 bg-[#306230] text-[#9bbc0f] rounded cursor-pointer disabled:opacity-40';
const BOX = 'bg-[#8bac0f] border-2 border-[#0f380f] p-2';

function CardFace({ id, cert, empty }: { id: string | null; cert?: boolean; empty: string }) {
  const c = id ? CARDS[id] : null;
  if (!c) return <div className="h-[92px] flex items-center justify-center text-[6px] text-[#306230] text-center leading-relaxed">{empty}</div>;
  return (
    <div className="h-[92px] flex flex-col items-center justify-center gap-1 text-center">
      <img src={creatureURL(c.id)} alt="" style={{ width: 48, height: 48, imageRendering: 'pixelated' }} />
      <div className="text-[6.5px] leading-tight">{c.name.toUpperCase()}</div>
      <div className="text-[5.5px] text-[#306230]">
        {c.atk}/{c.hp} · {STAGE_LABEL[c.stage ?? 0]}{c.firstEdition ? (cert ? ' · 1ª ED. CERTIFICADA' : ' · 1ª ED. SIN CERTIFICAR') : ''}
      </div>
    </div>
  );
}

/** Segunda planta de los Centros Parranderos: intercambio y combate SOLO por cable físico. */
export function CableClubModal({ room, onClose }: Props) {
  const [club, setClub] = useState<CableClub | null>(null);
  const [cableLabel, setCableLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guide, setGuide] = useState(false);
  const [remembered, setRemembered] = useState<SerialPortLike[]>([]);
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const support = useMemo(cableSupport, []);
  /** Cierre del cable anterior, todavía en curso: no se abre otro hasta que termine. */
  const closing = useRef<Promise<void>>(Promise.resolve());
  const roomName = room === 'trade' ? 'SALA DE INTERCAMBIO' : 'SALA DE COMBATE';

  useEffect(() => {
    ui.paused = true;
    input.held.clear();
    return () => {
      ui.paused = false;
    };
  }, []);

  // El enlace vive mientras exista el club: al cambiarlo o cerrar la sala se suelta el cable.
  useEffect(() => {
    if (!club) {
      // Sin cable abierto: se listan los cables ya autorizados, que se reabren sin pasar por el selector.
      let alive = true;
      void closing.current.then(rememberedSerialPorts).then((ports) => {
        if (alive) setRemembered(ports);
      });
      return () => {
        alive = false;
      };
    }
    const off = club.subscribe(bump);
    const stop = startTicker(() => club.tick(performance.now()));
    return () => {
      off();
      stop();
      closing.current = club.dispose();
    };
  }, [club]);

  const snap = club?.snapshot ?? null;
  const lastTrade = snap?.trade.last ?? null;
  const battlePhase = snap?.battle.phase ?? 'lobby';
  useEffect(() => {
    if (lastTrade) beep('fanfare');
  }, [lastTrade]);
  useEffect(() => {
    if (battlePhase === 'running') beep('bell');
    else if (battlePhase === 'void') beep('bump');
  }, [battlePhase]);

  const connect = async (open: () => Promise<LinkTransport>, viaUsb = false) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await closing.current;
      const cable = await open();
      setCableLabel(cable.label);
      setClub(new CableClub(cable, room, save, persist));
      beep('open');
    } catch (e) {
      const cancelled = (e as { name?: string } | null)?.name === 'NotFoundError';
      const hint = viaUsb && !cancelled && !support.android && support.serial
        ? ' En ordenador prueba PUERTO SERIE: el sistema suele tener ya cogido el adaptador con su propio driver.'
        : '';
      setError(explainCableError(e) + hint);
      beep('bump');
    } finally {
      setBusy(false);
    }
  };

  // ---------------------------------------------------------------- combate en marcha: pantalla completa
  if (club && snap && (snap.battle.phase === 'running' || snap.battle.phase === 'over') && snap.battle.view) {
    const duel: Duel = {
      foeName: 'RIVAL',
      foeTitle: 'CLUB DEL CABLE',
      foeDeck: [],
      purse: 0,
      stake: 0,
      isPractice: true,
      foeIcon: snap.battle.foeAce ?? 'lagarto',
      yourIcon: save.starter ?? 'cabra',
      yourLabel: 'TU MAZO',
      winLines: ['Ganaste el combate por cable.', 'Aquí no hay duros ni sobre: solo el marcador del Club y la cara que se le queda al otro.'],
      loseLines: ['Perdiste el combate por cable.', 'Nadie te lleva al Centro Parrandero: ya estás en él. Pide la revancha.'],
    };
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-[#0f380f]" role="dialog" aria-modal="true" aria-label="Combate por cable">
        <Fit>
          <BattleScreen
            duel={duel}
            link={{ view: snap.battle.view, note: snap.status === 'linked' ? null : 'CABLE EN SILENCIO…' }}
            onFinish={() => undefined}
            onBackToLab={() => club.battleLeave()}
          />
        </Fit>
        {snap.battle.phase === 'running' && (
          <button className={BTN_SOFT} onClick={() => club.battleLeave()}>ABANDONAR (COMBATE NULO)</button>
        )}
      </div>
    );
  }

  const mine = snap ? tradeable(save) : [];
  const searching = snap && (snap.status === 'searching' || snap.status === 'loopback');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2" role="dialog" aria-modal="true" aria-label="Club del Cable">
      <div className="w-full max-w-[560px] max-h-[94vh] overflow-y-auto bg-[#9bbc0f] border-4 border-[#0f380f] p-3 text-[#0f380f]">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="text-[8px] leading-relaxed">CLUB DEL CABLE · {roomName}</div>
            <div className="text-[5.5px] text-[#306230] leading-relaxed">
              COMBATES {save.linkStats.wins}G-{save.linkStats.losses}P · INTERCAMBIOS {save.linkStats.trades}
            </div>
          </div>
          <button className={BTN_SOFT} onClick={onClose}>SALIR</button>
        </div>

        {/* ------------------------------------------------ sin cable todavía */}
        {!club && (
          <div className="flex flex-col gap-2">
            <p className="text-[6.5px] leading-[1.9]">
              Aquí solo se juega con un cable de verdad entre las dos máquinas. Sin wifi, sin Bluetooth y sin servidor:
              enchufa tu extremo y que la otra persona enchufe el suyo en su consola, en esta misma sala.
            </p>
            <button className={BTN} disabled={busy || !support.serial} onClick={() => connect(requestSerialCable)}>
              🔌 CONECTAR CABLE · PUERTO SERIE
            </button>
            {remembered.slice(0, 4).map((port, i) => {
              const info = port.getInfo?.() ?? {};
              const hex = (n: number) => n.toString(16).padStart(4, '0');
              const id = info.usbVendorId !== undefined ? ` (${hex(info.usbVendorId)}:${hex(info.usbProductId ?? 0)})` : '';
              return (
                <button key={i} className={BTN} disabled={busy} onClick={() => connect(() => SerialCable.open(port))}>
                  ↻ CABLE YA AUTORIZADO{remembered.length > 1 ? ` ${i + 1}` : ''}{id}
                </button>
              );
            })}
            <button className={BTN} disabled={busy || !support.usb} onClick={() => connect(requestUsbCable, true)}>
              🔌 CONECTAR CABLE · USB DIRECTO
            </button>
            <div className="text-[5.8px] leading-[1.9] text-[#306230]">
              {!support.secure && <div>⚠ Esta página no va por https ni por localhost: el navegador no deja tocar puertos así.</div>}
              {support.framed && <div>⚠ El juego está incrustado dentro de otra página. Si el navegador bloquea el cable, ábrelo en su propia pestaña.</div>}
              {!support.serial && !support.usb && <div>⚠ Este navegador no sabe hablar con cables. Hace falta Chrome o Edge.</div>}
              {support.serial && !support.android && <div>PUERTO SERIE es la opción normal en ordenador: usa el driver del sistema.</div>}
              {support.android && <div>En Android usa USB DIRECTO con un adaptador OTG: Chrome no ofrece puertos serie por USB en el móvil.</div>}
            </div>
            {error && <div className={`${BOX} text-[6.5px] leading-[1.9]`}>✖ {error}</div>}
            <button className={BTN_SOFT} onClick={() => setGuide((g) => !g)}>{guide ? 'OCULTAR' : '¿QUE CABLE NECESITO?'}</button>
            {guide && (
              <div className={`${BOX} text-[6px] leading-[2]`}>
                <div>La línea es serie a {LINK_BAUD} baudios, 8N1, sin control de flujo. Bastan tres hilos.</div>
                <div className="mt-1">1. CABLE USB NULL-MODEM (dos chips FTDI espalda con espalda, tipo «USB-NMC»). Se enchufa a los dos ordenadores y aparece como puerto serie en cada uno.</div>
                <div className="mt-1">2. DOS ADAPTADORES USB-SERIE (FT232, CP2102 o CH340) y tres cablecitos: TX de uno al RX del otro, RX al TX, y masa con masa.</div>
                <div className="mt-1">3. CABLE RS-232 NULL-MODEM entre dos puertos serie de los de toda la vida.</div>
                <div className="mt-1">4. MOVIL ANDROID: adaptador OTG + adaptador USB-serie, con la opción USB DIRECTO.</div>
                <div className="mt-1">5. EXPERIMENTAL: cable puente USB de PC a PC con chip Prolific (PL25A1/PL27A1), con USB DIRECTO.</div>
                <div className="mt-1">PRUEBA CON UN SOLO ADAPTADOR: une su TX con su RX y conecta. Si el juego avisa de «cable puenteado», el adaptador funciona.</div>
                <div className="mt-1">Un cable USB normal de A a A entre dos ordenadores NO sirve (y puede dañarlos): los dos son anfitriones.</div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------ cable cerrado */}
        {club && snap?.status === 'closed' && (
          <div className="flex flex-col gap-2">
            <div className={`${BOX} text-[6.5px] leading-[1.9]`}>✖ CABLE DESCONECTADO. {snap.closeReason ?? ''}</div>
            <button className={BTN} onClick={() => setClub(null)}>VOLVER A CONECTAR</button>
          </div>
        )}

        {/* ------------------------------------------------ cable abierto, buscando el otro extremo */}
        {club && snap && snap.status !== 'closed' && (
          <div className="text-[5.5px] leading-[1.9] text-[#306230] mb-2">
            {cableLabel} · TRAMAS ↑{snap.stats.tx} ↓{snap.stats.rx} · ROTAS {snap.stats.bad} · REENVIOS {snap.stats.retx}
            {snap.role && <> · {snap.role === 'host' ? 'ANFITRION' : 'INVITADO'}</>}
          </div>
        )}
        {club && searching && (
          <div className="flex flex-col gap-2">
            {snap.status === 'loopback' ? (
              <div className={`${BOX} text-[6.5px] leading-[1.9]`}>
                ↺ CABLE PUENTEADO: este extremo está recibiendo sus propios datos (TX unido a RX). El adaptador funciona.
                Ahora lleva el otro extremo a la otra máquina.
              </div>
            ) : (
              <div className={`${BOX} text-[6.5px] leading-[1.9]`}>
                … BUSCANDO LA OTRA CONSOLA. Tu extremo está abierto y saludando por el cable.
                {snap.stats.rx === 0 && snap.stats.bad === 0 && snap.stats.tx > 12 && <div className="mt-1">No llega nada: comprueba que TX y RX van cruzados, que las masas están unidas y que la otra consola ha conectado su cable en esta sala.</div>}
                {snap.stats.rx === 0 && snap.stats.bad > 3 && <div className="mt-1">Llega señal pero ninguna trama entera: cable flojo, masa sin unir o el otro extremo a otra velocidad.</div>}
              </div>
            )}
            {snap.incompatible && <div className={`${BOX} text-[6.5px] leading-[1.9]`}>✖ El otro extremo habla otra versión del cable. Actualizad el juego en las dos máquinas.</div>}
            {snap.notice && <div className="text-[6px] leading-[1.9]">{snap.notice}</div>}
            <button className={BTN_SOFT} onClick={() => setClub(null)}>SOLTAR EL CABLE</button>
          </div>
        )}

        {/* ------------------------------------------------ enlazados pero sin poder operar */}
        {club && snap?.status === 'linked' && !snap.ok && (
          <div className="flex flex-col gap-2">
            <div className={`${BOX} text-[6.5px] leading-[1.9]`}>{snap.fatal ? `✖ ${snap.fatal}` : '✔ ENLACE HECHO. Las consolas se están presentando…'}</div>
            <button className={BTN_SOFT} onClick={() => setClub(null)}>SOLTAR EL CABLE</button>
          </div>
        )}

        {/* ------------------------------------------------ SALA DE INTERCAMBIO */}
        {club && snap?.ok && room === 'trade' && (
          <div className="flex flex-col gap-2">
            {snap.trade.last && (
              <div className={`${BOX} text-[6.5px] leading-[1.9]`}>
                ★ ¡INTERCAMBIO HECHO! Entregaste {CARDS[snap.trade.last.gave].name.toUpperCase()} y recibiste {CARDS[snap.trade.last.got].name.toUpperCase()},
                que va {snap.trade.last.dest === 'deck' ? 'a tu MAZO' : 'al PC DE AYOZE'}. Partida guardada.
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className={BOX}>
                <div className="text-[6px] mb-1">TU OFRECES {snap.trade.myReady && '· ✔ CONFIRMADO'}</div>
                <CardFace id={snap.trade.mine} cert={!!snap.trade.mine && !!save.flags['cert_' + snap.trade.mine]} empty="Elige un magomón de tu lista" />
              </div>
              <div className={BOX}>
                <div className="text-[6px] mb-1">TE OFRECEN {snap.trade.theirReady && '· ✔ CONFIRMADO'}</div>
                <CardFace id={snap.trade.theirs} cert={snap.trade.theirsCert} empty="La otra consola aún no ha puesto nada sobre la mesa" />
              </div>
            </div>
            {snap.notice && <div className="text-[6px] leading-[1.9]">✖ {snap.notice}</div>}
            <button
              className={BTN}
              disabled={snap.trade.busy || !snap.trade.mine || !snap.trade.theirs}
              onClick={() => club.setReady(!snap.trade.myReady)}
            >
              {snap.trade.busy ? 'CERRANDO EL TRATO POR EL CABLE…'
                : snap.trade.myReady ? 'RETIRAR MI CONFIRMACION'
                : !snap.trade.mine || !snap.trade.theirs ? 'FALTA UNA OFERTA EN CADA LADO'
                : 'CONFIRMAR INTERCAMBIO'}
            </button>
            <div className="text-[5.5px] leading-[1.9] text-[#306230]">
              Hacen falta las dos confirmaciones. Si alguien cambia su oferta, las confirmaciones se borran. No sueltes el cable mientras se cierra el trato.
            </div>
            <div className={BOX}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[6px]">TUS MAGOMONES (MAZO + PC)</span>
                {snap.trade.mine && <button className={BTN_SOFT} disabled={snap.trade.busy} onClick={() => club.offer(null)}>RETIRAR OFERTA</button>}
              </div>
              {mine.length === 0 && <div className="text-[6px] leading-[1.9]">No tienes magomones que ofrecer.</div>}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 max-h-[34vh] overflow-y-auto pr-1">
                {mine.map(({ id, owned }) => (
                  <button
                    key={id}
                    disabled={snap.trade.busy}
                    onClick={() => club.offer(id)}
                    className={`flex flex-col items-center gap-0.5 p-1 border cursor-pointer ${snap.trade.mine === id ? 'bg-[#0f380f] text-[#9bbc0f] border-[#0f380f]' : 'bg-[#9bbc0f] border-[#306230]'}`}
                  >
                    <img src={creatureURL(id)} alt="" style={{ width: 28, height: 28, imageRendering: 'pixelated' }} />
                    <span className="text-[4.8px] leading-tight text-center">{CARDS[id].name.toUpperCase()}</span>
                    <span className="text-[4.8px]">x{owned}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------ SALA DE COMBATE */}
        {club && snap?.ok && room === 'battle' && (
          <div className="flex flex-col gap-2">
            {snap.battle.phase === 'void' && (
              <div className={`${BOX} text-[6.5px] leading-[1.9]`}>✖ COMBATE NULO. {snap.battle.why} No cuenta para el marcador.</div>
            )}
            <div className={`${BOX} text-[6.5px] leading-[1.9]`}>
              <div>TU MAZO: {save.deck.length} cartas (mínimo {LINK_MIN_DECK}, máximo 60). Se juega con el mazo que llevas ahora mismo y con su brillo.</div>
              <div>OTRA CONSOLA: {snap.battle.theirReady ? '✔ LISTA, esperando por ti' : 'todavía preparándose'}.</div>
              <div className="text-[5.5px] text-[#306230] mt-1">
                Las dos consolas calculan el mismo combate y el cable las mantiene a la par. Una moneda decide quién abre. Sin fotocopiadora ni apagones a mano.
              </div>
            </div>
            {snap.notice && <div className="text-[6px] leading-[1.9]">✖ {snap.notice}</div>}
            {snap.battle.phase === 'waiting' ? (
              <>
                <div className="text-[6.5px] leading-[1.9] text-center">… ESPERANDO A QUE LA OTRA CONSOLA DIGA «LISTO»</div>
                <button className={BTN_SOFT} onClick={() => club.battleCancel()}>CANCELAR</button>
              </>
            ) : snap.battle.phase === 'void' ? (
              <button className={BTN} onClick={() => club.battleLeave()}>VOLVER A LA SALA</button>
            ) : (
              <button className={BTN} onClick={() => club.battleReady()}>¡LISTO PARA COMBATIR!</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
