import { useCallback, useEffect, useRef, useState } from 'react';
import { GameCanvas, INDOOR_MAPS } from './game/GameCanvas';
import { CLUB_POST } from './game/nightRoute';
import { BattleScreen, Duel } from './battle/BattleScreen';
import { MAPS, StarterId, DIALOGUE } from './game/maps';
import { STORY } from './game/story';
import { grantMagomaniacoVictory, toggleTodoTerreno } from './game/firstEdition';
import { MochilaModal } from './components/MochilaModal';
import { input, ui, Dir } from './game/input';
import { beep, setMuted } from './game/sfx';
import { PocketBooks } from './components/PocketBooks';
import { SaveManagerModal } from './components/SaveManagerModal';
import { BoosterModal } from './components/BoosterModal';
import { AyozePC } from './components/AyozePC';
import { save, touchSave, subscribeSave, blackoutToNearestCenter, exportSaveJSON, importSaveJSON } from './game/save';
import { COCO_MERIDIANO_DECK, TRAINERS } from './game/trainers';
import { diablitoPostVictory } from './game/santaUrsulaQuest';
import { grantTrainerVictory, settleTrainerLoss, trainerDefeated, type PendingBooster } from './game/rewards';
import { HallOfFameModal } from './components/HallOfFameModal';
import { EndCredits } from './components/EndCredits';
import { CableClubModal } from './components/CableClubModal';
import { CARDS, PROFESSOR_DECK, STARTER_INFO } from './battle/cards';

function Scaled({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 320));
    ro.observe(el);
    setScale(el.clientWidth / 320);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="w-full h-full overflow-hidden">
      <div style={{ width: 320, height: 288, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
    </div>
  );
}

const DPAD_SIZE = 120;

function ControlsLift() {
  const [lift, setLift] = useState(16);
  useEffect(() => {
    const f = () => setLift(window.innerWidth > window.innerHeight ? 16 : 76);
    f();
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return lift;
}

function PadBtn({ dir, children, style }: { dir: Dir; children: React.ReactNode; style: React.CSSProperties }) {
  const on = (e: React.PointerEvent) => { e.preventDefault(); (e.target as HTMLElement).setPointerCapture(e.pointerId); input.press(dir); };
  const off = () => input.release(dir);
  return (
    <button
      onPointerDown={on} onPointerUp={off} onPointerCancel={off} onContextMenu={(e) => e.preventDefault()}
      className="absolute flex items-center justify-center bg-white/[0.14] active:bg-white/30 text-white/70 border border-white/10 select-none touch-none backdrop-blur-[1px]"
      style={{ width: DPAD_SIZE / 3, height: DPAD_SIZE / 3, ...style }}
    >{children}</button>
  );
}

function ChoiceBtn({ b, label, className }: { b: 'A' | 'B'; label: string; className?: string }) {
  const tap = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    if (b === 'A') input.tapA(); else input.tapB();
  };
  return (
    <button
      onPointerDown={tap} onContextMenu={(e) => e.preventDefault()}
      className={`flex items-center justify-center rounded-full bg-white/[0.14] active:bg-white/35 text-white/80 border border-white/15 text-sm font-bold select-none touch-none backdrop-blur-[1px] ${className ?? ''}`}
      style={{ width: 60, height: 60 }}
    >{label}</button>
  );
}

interface ActiveDuel {
  duel: Duel;
  trainerId?: string;
  isStarterDuel: boolean;
}

export function App() {
  const lift = ControlsLift();
  const [atTitle, setAtTitle] = useState(true);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  const restored = useRef(false);
  const [mode, setMode] = useState<'world' | 'battle'>('world');
  const [active, setActive] = useState<ActiveDuel | null>(null);
  const [resume, setResume] = useState(false);
  const [afterBattle, setAfterBattle] = useState(false);
  const [worldKey, setWorldKey] = useState(0);
  const [mute, setMute] = useState(false);
  const [fs, setFs] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [showPC, setShowPC] = useState(false);
  const [showMochila, setShowMochila] = useState(false);
  const [booster, setBooster] = useState<PendingBooster | null>(() => save.pendingBooster);
  // Hall de la Fama: tras cerrar el sobre del campeón se muestra el mazo que entra en el salón.
  const [hallEntry, setHallEntry] = useState<{ date: string; deck: string[] } | null>(null);
  const hallQueued = useRef(false);
  const [credits, setCredits] = useState(false);
  // Menú START (la antigua botonera superior): se cierra con ESC o al abrir cualquier ventana.
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Escape') setMenu(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu]);
  // Club del Cable (2ª planta de los Centros Parranderos): la sala la pide el mundo al tocar una mesa.
  const [cable, setCable] = useState<'trade' | 'battle' | null>(null);
  useEffect(() => {
    const open = (e: Event) => setCable((e as CustomEvent<'trade' | 'battle'>).detail);
    window.addEventListener('magomon:cable', open);
    return () => window.removeEventListener('magomon:cable', open);
  }, []);
  const [blackoutLines, setBlackoutLines] = useState<string[] | null>(null);
  const [postWinLines, setPostWinLines] = useState<string[] | null>(null);
  const [, force] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pendingBlackout = useRef<{ lost: number } | null>(null);
  const trainerResultHandled = useRef(false);

  useEffect(() => subscribeSave(() => force((n) => n + 1)), []);

  useEffect(() => {
    if (!restored.current) {
      restored.current = true;
      try {
        const snapshot = localStorage.getItem('magomon.local.v1');
        if (snapshot && importSaveJSON(snapshot)) { setResume(true); setBooster(save.pendingBooster); }
        const m = localStorage.getItem('magomon.mute') === '1'; setMute(m); setMuted(m);
      } catch { /* Private browsing: JSON export remains available. */ }
      setReady(true);
    }
  }, []);
  const toggleSound = () => {
    setMute(!mute); setMuted(!mute);
    try {localStorage.setItem('magomon.mute', mute?'0':'1');} catch { /* optional */ }
  };
  const store = () => { try { if (Object.keys(save.flags).length) localStorage.setItem('magomon.local.v1', exportSaveJSON()); } catch { /* Storage unavailable: manual save still works. */ } };
  useEffect(() => {
    if (!ready || atTitle || mode !== 'world') return;
    let last = '';
    const persist = () => { const value = exportSaveJSON(); if(value!==last){ store(); last=value; } };
    const timer = window.setInterval(persist, 1400);
    const un = subscribeSave(persist); window.addEventListener('pagehide', persist);
    return () => { window.clearInterval(timer); un(); window.removeEventListener('pagehide', persist); };
  }, [ready, atTitle, mode]);
  useEffect(()=>{if(!notice)return; const t=window.setTimeout(()=>setNotice(''),3200);return()=>window.clearTimeout(t);},[notice]);
  const toggleFs = () => {
    const el = wrapRef.current!;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen().catch(() => setNotice('La pantalla completa no está disponible en esta vista.'));
      else setNotice('Este navegador no permite pantalla completa.');
    }
    else document.exitFullscreen().catch(() => undefined);
  };
  useEffect(() => {
    const f = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', f);
    return () => document.removeEventListener('fullscreenchange', f);
  }, []);

  // ---- Duelo de prueba contra Acaymo (tras elegir starter) ----
  const startStarterDuel = useCallback((starter: StarterId) => {
    const info = STARTER_INFO[starter];
    pendingBlackout.current = null;
    setBlackoutLines(null);
    setPostWinLines(null);
    setActive({
      isStarterDuel: true,
      duel: {
        foeName: 'ACAYMO',
        foeTitle: 'LAGARTOS DE OFRA',
        foeDeck: PROFESSOR_DECK,
        purse: 0,
        stake: 0,
        isPractice: true,
        foeIcon: 'lagarto',
        yourIcon: starter,
        yourLabel: info.pack,
        winLines: ['ACAYMO: Ños! Aguanto el tipo tu mazo promocional.', 'ACAYMO: Pero esto no es nada. Ven, que te tengo un recado.'],
        loseLines: ['ACAYMO: Te fundieron los Lagartos de Ofra, chacho.', 'ACAYMO: Revancha o seguimos, que tengo un recado pa ti.'],
      },
    });
    setMode('battle');
  }, []);

  // ---- Reto de entrenador, nino de colegio repetible o lider de gimnasio ----
  const startTrainerDuel = useCallback((trainerId: string) => {
    const t = TRAINERS[trainerId];
    if (!t || trainerDefeated(save, trainerId) || save.pendingBooster) return;
    const starter = save.starter ?? 'cabra';
    const stake = Math.min(save.duros, t.purse);
    pendingBlackout.current = null;
    trainerResultHandled.current = false;
    setBlackoutLines(null);
    setPostWinLines(null);
    const loseLines = stake === 0
      ? [`${t.name}: Te fundi, chacho! Como no llevabas ni un duro no te cobro, pero vete al Centro Parrandero que estas blanco.`]
      : stake < t.purse
      ? [...t.lose, `(Solo llevabas ${stake} duros. Te llevan al Centro Parrandero mas cercano!)`]
      : t.lose;
    // El Coco tiene 3 actos con dificultad creciente: Meridiano (act 1) < Magos (act 2) < Diablito (act 3).
    // Meridiano y Magos comparten el id coco_santa_ursula: el mazo del acto se elige por el mapa actual.
    const isCocoMeridiano = trainerId === 'coco_santa_ursula' && save.mapId === 'guarida_enriscada';
    const foeDeck = isCocoMeridiano ? COCO_MERIDIANO_DECK.deck : t.deck;
    const foeShine = isCocoMeridiano ? COCO_MERIDIANO_DECK.shine : t.shine;
    const foeIcon = (t.ace && CARDS[t.ace]) ? t.ace : (foeDeck.find((id) => CARDS[id]?.type === 'creature') ?? 'lagarto');
    setActive({
      trainerId,
      isStarterDuel: false,
      duel: {
        foeName: t.name,
        foeTitle: t.title.toUpperCase(),
        foeDeck,
        foeShine, // brillo legal de las fusiones de 5 copias en etapa final
        foeLife: t.life, // solo Magec
        foeOpeningHand: t.openingHand,
        purse: t.purse,
        stake,
        isPractice: false,
        bolicheName: t.bolicheName,
        foeIcon,
        yourIcon: starter,
        yourLabel: STARTER_INFO[starter].pack,
        winLines: t.win,
        loseLines,
      },
    });
    setMode('battle');
  }, []);

  // ---- Liquidacion del combate: duros, sobre, o pajara rumbo al Centro Parrandero ----
  const finishDuel = useCallback((result: 'win' | 'lose') => {
    if (!active?.trainerId || trainerResultHandled.current) return;
    trainerResultHandled.current = true;
    if (result === 'win') {
      pendingBlackout.current = null;
      const won = active.trainerId === 'magomaniaco'
        ? grantMagomaniacoVictory(save)
        : !!grantTrainerVictory(save, active.trainerId);
      if (won) {
        const foeIcon = active.duel.foeIcon;
        if (foeIcon) save.flags['seen_' + foeIcon] = true;
        if (active.trainerId === 'alto_mando_bencomo') {
          // Campeón del Alto Mando: el mazo entra al Hall de la Fama y el guirufo pasa a ser el campeón.
          save.flags.campeon_teide = true;
          save.hallOfFame = [...save.hallOfFame, { date: new Date().toLocaleDateString('es-ES'), deck: [...save.deck] }];
          hallQueued.current = true;
        }
        if (/^torre_enriscada_[1-4]$/.test(active.trainerId)) {
          save.flags.tower_advance_pending = true;
        }
        touchSave();
      }
    } else {
      const lost = settleTrainerLoss(save, active.trainerId, active.duel.stake);
      if (lost !== null) {
        touchSave();
        pendingBlackout.current = { lost };
      }
    }
  }, [active]);

  // Después de los créditos: reapareces delante de tu casa, en la plaza de Weyler.
  const backHomeWeyler = useCallback(() => {
    setCredits(false);
    save.mapId = 'calle';
    save.playerPos = { x: 64, y: 4, dir: 'up' };
    touchSave();
    setAtTitle(false);
    setResume(true);
    setAfterBattle(false);
    setActive(null);
    setMode('world');
    setWorldKey((k) => k + 1);
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('magomon:say', {
        detail: [
          'THE END.',
          'Apareces delante de tu casa, en la plaza de Weyler. El Teide se ve desde aquí, y arriba ya no queda nadie que te lo cuestione.',
          'Dicen que los Centros Parranderos han abierto su segunda planta a los campeones: el CLUB DEL CABLE, por la escalera del fondo.',
        ],
      }));
    }, 400);
  }, []);

  const leaveBattle = useCallback(() => {
    const wasStarter = active?.isStarterDuel ?? false;
    setActive(null);
    setResume(true);
    setAfterBattle(wasStarter);
    if (pendingBlackout.current) {
      const lines = blackoutToNearestCenter(pendingBlackout.current.lost);
      pendingBlackout.current = null;
      setBlackoutLines(lines);
    } else {
      setBlackoutLines(null);
    }
    setWorldKey((k) => k + 1);
    setMode('world');
    // El sobre se abre ya de vuelta en la calle, no encima del resultado
    if (save.pendingBooster) setBooster(save.pendingBooster);
  }, [active]);

  return (
    <div ref={wrapRef} className="fixed inset-0 bg-[#15151d] overflow-hidden select-none" style={{ fontFamily: '"Press Start 2P", monospace' }}>
      {notice && <div role="status" className="screen-notice">{notice}</div>}
      {/* Pantalla */}
      <div className="game-stage-shell">
        <div className="game-viewport">
          {ready && mode === 'world' ? (
            <GameCanvas
              key={worldKey}
              showTitle={atTitle}
              onTitleStart={() => setAtTitle(false)}
              resume={resume}
              afterBattle={afterBattle}
              blackoutLines={blackoutLines}
              postWinLines={postWinLines}
              onStarterChosen={startStarterDuel}
              onChallenge={startTrainerDuel}
              onOpenPC={() => setShowPC(true)}
            />
          ) : active ? (
            <Scaled>
              <BattleScreen duel={active.duel} onFinish={finishDuel} onBackToLab={leaveBattle} />
            </Scaled>
          ) : null}

          {/* Libretas de Bencomo */}
          {mode === 'world' && !atTitle && !showPC && !showMochila && !booster && <PocketBooks />}

          {/* Cruceta flotante */}
          {mode === 'world' && (
            <div className="absolute left-3 opacity-90 game-dir-controls" style={{ bottom: lift, width: DPAD_SIZE, height: DPAD_SIZE }}>
              <PadBtn dir="up" style={{ left: DPAD_SIZE / 3, top: 0 }}>▲</PadBtn>
              <PadBtn dir="left" style={{ left: 0, top: DPAD_SIZE / 3 }}>◀</PadBtn>
              <div className="absolute bg-white/[0.14] border border-white/10" style={{ left: DPAD_SIZE / 3, top: DPAD_SIZE / 3, width: DPAD_SIZE / 3, height: DPAD_SIZE / 3 }} />
              <PadBtn dir="right" style={{ left: (DPAD_SIZE / 3) * 2, top: DPAD_SIZE / 3 }}>▶</PadBtn>
              <PadBtn dir="down" style={{ left: DPAD_SIZE / 3, top: (DPAD_SIZE / 3) * 2 }}>▼</PadBtn>
            </div>
          )}

          {/* A/B flotantes */}
          <div className="absolute right-3 flex items-end gap-3 opacity-90 game-action-controls" style={{ bottom: lift }}>
            <ChoiceBtn b="B" label="B" />
            <ChoiceBtn b="A" label="A" className="-translate-y-4" />
          </div>
        </div>
      </div>

      {/* Barra superior: solo el nombre, los duros y START. El resto vive en el menú START. */}
      <div className="game-topbar absolute top-0 inset-x-0 flex items-center justify-between gap-2 px-3 py-2 pointer-events-none z-30">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[8px] text-white/35 tracking-widest">MAGOMON</span>
          {!atTitle && save.flags.starterChosen && (
            <span className="text-[8px] text-[#9bbc0f] bg-[#0f380f]/80 border border-[#9bbc0f]/40 px-2 py-1 rounded whitespace-nowrap">
              ◉ {save.duros} DUROS
            </span>
          )}
        </div>
        <div className="relative pointer-events-auto shrink-0">
          <button
            onClick={() => setMenu((m) => !m)}
            aria-label="START"
            aria-expanded={menu}
            className={`text-[8px] px-3 py-1.5 rounded border backdrop-blur-sm ${menu ? 'bg-[#9bbc0f] text-[#0f380f] border-[#9bbc0f]' : 'bg-[#0f380f]/90 text-[#9bbc0f] border-[#9bbc0f]/50 hover:bg-[#0f380f]'}`}
          >☰ START</button>
          {menu && (
            <div aria-label="Menú START" className="game-start-menu absolute right-0 top-full mt-1.5 w-[208px] max-w-[calc(100vw-24px)] flex flex-col gap-1 p-1.5 bg-[#0f380f] border-2 border-[#9bbc0f] rounded shadow-[0_6px_18px_#0008]">
              {!atTitle && save.flags.starterChosen && (
                <button className="start-item" title="Mazo, colección y combinador" onClick={() => { setMenu(false); setShowPC(true); }}>
                  PC DE AYOZE
                </button>
              )}
              {!atTitle && save.flags.starterChosen && mode === 'world' && (
                <button className="start-item" title="M.O., Fotocopiadora y objetos clave" onClick={() => { setMenu(false); ui.paused = true; setShowMochila(true); }}>
                  {save.flags.car_out ? '🚙 4X4 · MOCHILA' : '🎒 MOCHILA'}
                </button>
              )}
              <button className="start-item" title="Guardar / cargar partida" onClick={() => { setMenu(false); setShowSave(true); }}>
                💾 PARTIDA
              </button>
              <button className="start-item start-item-soft" onClick={toggleSound}>
                {mute ? '🔇 SFX OFF' : '🔊 SFX ON'}
              </button>
              <button className="start-item start-item-soft" onClick={() => { setMenu(false); toggleFs(); }}>
                {fs ? '⛶ SALIR DE PANTALLA COMPLETA' : '⛶ PANTALLA COMPLETA'}
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Clic fuera del menú START: se cierra sin hacer nada más */}
      {menu && <div className="fixed inset-0 z-20" aria-hidden="true" onPointerDown={() => setMenu(false)} />}

      {/* Pistas de control */}
      <div className="absolute bottom-1.5 inset-x-0 text-center text-[7px] text-white/25 pointer-events-none z-30">
        WASD/FLECHAS · Z o ENTER = A · X o ESC = B
      </div>

      {/* Modales */}
      {!atTitle && booster && mode === 'world' && (
        <BoosterModal
          cards={booster.cards}
          purse={booster.purse}
          trainerName={booster.trainerName}
          bolicheName={booster.bolicheName}
          onClose={() => {
            const gymWon = booster.gym;
            const tidWon = booster.trainerId;
            setBooster(null);
            if (hallQueued.current) {
              hallQueued.current = false;
              setHallEntry(save.hallOfFame[save.hallOfFame.length - 1] ?? null);
            }
            touchSave();
            if (gymWon === 5) {
              setPostWinLines(CLUB_POST); setWorldKey(k => k+1);
            } else if (gymWon === 8) {
              setPostWinLines(diablitoPostVictory(save.flags));
              setWorldKey(k => k + 1);
            } else if (tidWon === 'coco_santa_ursula') {
              if (save.mapId === 'guarida_enriscada') {
                setPostWinLines(STORY.coco_post);
              } else {
                setPostWinLines(STORY.magos_coco_post);
              }
              setWorldKey((k) => k + 1);
            } else if (gymWon === 1) {
              setPostWinLines(DIALOGUE.domingo_post);
              setWorldKey((k) => k + 1);
            } else if (gymWon === 2) {
              setPostWinLines(DIALOGUE.cathaysa_after_gym);
              setWorldKey((k) => k + 1);
            } else if (gymWon === 3) {
              setPostWinLines(DIALOGUE.bentejui_post);
              setWorldKey((k) => k + 1);
            } else if (gymWon === 4) {
              setPostWinLines(STORY.palmetum_post);
              setWorldKey((k) => k + 1);
            }
          }}
        />
      )}
      {hallEntry && (
        <HallOfFameModal
          entry={hallEntry}
          onClose={() => { setHallEntry(null); setCredits(true); }}
        />
      )}
      {credits && <EndCredits onClose={backHomeWeyler} />}
      {cable && <CableClubModal room={cable} onClose={() => { setCable(null); force((n) => n + 1); }} />}
      {showPC && <AyozePC onClose={() => setShowPC(false)} />}
      {showMochila && (
        <MochilaModal
          hasTodoTerreno={!!save.flags.hm_todo_terreno}
          carOut={!!save.flags.car_out}
          hasBinter={!!save.flags.hm_binter}
          hasPukas={!!save.flags.hm_pukas}
          hasSaltoPastor={!!save.flags.hm_salto_pastor}
          hasCremaFP50={!!save.flags.has_crema_fp50}
          hasFotocopiadora={!!save.flags.has_fotocopiadora}
          usedFotocopiadora={!!save.flags.used_fotocopiadora}
          hasCazafantasmas={!!save.flags.has_cazafantasmas}
          hasBucio={!!save.flags.has_bucio}
          magosKeys={save.magosKeys}
          onFlyBinter={(dest) => {
            ui.paused = false;
            setShowMochila(false);
            window.dispatchEvent(new CustomEvent('magomon:fly', { detail: dest }));
          }}
          onUseBucio={() => {
            ui.paused = false;
            setShowMochila(false);
            window.dispatchEvent(new CustomEvent('magomon:bucio'));
          }}
          onUsePukas={() => {
            ui.paused = false;
            setShowMochila(false);
            window.dispatchEvent(new CustomEvent('magomon:pukas'));
          }}
          onUseSaltoPastor={() => {
            ui.paused = false;
            setShowMochila(false);
            window.dispatchEvent(new CustomEvent('magomon:salto_pastor'));
          }}
          onUseTodoTerreno={() => {
            ui.paused = false;
            setShowMochila(false);
            const m = MAPS[save.mapId];
            const curTile = m.legend[m.rows[save.playerPos.y]?.[save.playerPos.x] ?? ''] ?? 'floor';
            const res = toggleTodoTerreno(save, curTile, INDOOR_MAPS.includes(save.mapId));
            touchSave();
            if (!res.ok) {
              beep('bump');
              const lines = res.reason === 'indoor'
                ? STORY.car_indoor_spawn
                : res.reason === 'hazard'
                ? STORY.car_hazard_park
                : STORY.car_offroad_spawn;
              window.dispatchEvent(new CustomEvent('magomon:say', { detail: lines }));
              return;
            }
            beep(res.carOut ? 'motor' : 'open');
            window.dispatchEvent(new CustomEvent('magomon:say', { detail: res.carOut ? STORY.car_spawn : STORY.car_park }));
          }}
          onClose={() => { ui.paused = false; setShowMochila(false); }}
        />
      )}
      {showSave && (
        <SaveManagerModal
          onClose={() => setShowSave(false)}
          onStateReload={() => {
            setAtTitle(false);store();
            pendingBlackout.current = null;
            setBooster(save.pendingBooster);
            setBlackoutLines(null);
            setPostWinLines(null);
            setResume(true);
            setAfterBattle(false);
            setActive(null);
            setMode('world');
            setWorldKey((k) => k + 1);
          }}
          onTestBattle={() => {
            setAtTitle(false);
            const st = (save.starter ?? 'cabra') as StarterId;
            setActive(null);
            setMode('world');
            setWorldKey((k) => k + 1);
            window.setTimeout(() => startStarterDuel(st), 60);
          }}
        />
      )}
    </div>
  );
}

export default App;
