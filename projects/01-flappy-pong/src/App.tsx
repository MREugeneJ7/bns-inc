import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { closeAudio, playSound } from "./game/audio";
import { bricksLeft } from "./game/bricks";
import { drawGame } from "./game/draw";
import { chipMult, choosePerk, createGame, flap, launch, resizeGame, step } from "./game/engine";
import {
  canBuy,
  canPrestige,
  defaultMeta,
  levelOf,
  loadMeta,
  prestigeCost,
  prestigeTarget,
  saveMeta,
  upgradeById,
  upgradeCost,
} from "./game/meta";
import type { Game, GameStatus, MetaState, MetaUpgradeId, PerkId } from "./game/types";
import { META_UPGRADES, PERK_BY_ID, PERKS } from "./game/types";

const BEST_KEY = "flappy-pong-ark-best";

function formatScore(value: number) {
  return String(Math.max(0, Math.floor(value))).padStart(4, "0");
}

function formatChips(value: number) {
  return Math.floor(value).toLocaleString("en-US");
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function SoundIcon({ enabled }: { enabled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6.5 9H3v6h3.5l4.5 4V5Z" />
      {enabled ? (
        <>
          <path d="M15 9a4 4 0 0 1 0 6" />
          <path d="M18 6a8 8 0 0 1 0 12" />
        </>
      ) : (
        <path d="m15 9 6 6m0-6-6 6" />
      )}
    </svg>
  );
}

function PauseIcon({ paused }: { paused: boolean }) {
  return paused ? (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="m6 3 11 7-11 7V3Z" /></svg>
  ) : (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><rect x="4" y="3" width="4" height="14" rx="1" /><rect x="12" y="3" width="4" height="14" rx="1" /></svg>
  );
}

function ChipIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function App() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const statusRef = useRef<GameStatus>("ready");
  const soundRef = useRef(true);
  const lastFlapRef = useRef(0);
  const baselineRef = useRef(0);
  const [status, setStatus] = useState<GameStatus>("ready");
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [left, setLeft] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [earnedChips, setEarnedChips] = useState(0);
  const [boss, setBoss] = useState<{ name: string; hp: number; maxHp: number; phase: number } | null>(null);
  const [offer, setOffer] = useState<PerkId[] | null>(null);
  const [offerFrom, setOfferFrom] = useState<"wall" | "boss">("wall");
  const [meta, setMeta] = useState<MetaState>(() => loadMeta());
  const [labOpen, setLabOpen] = useState(false);
  const [best, setBest] = useState(() => {
    try {
      return Number(window.localStorage.getItem(BEST_KEY)) || 0;
    } catch {
      return 0;
    }
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const bestRef = useRef(best);
  const metaRef = useRef(meta);

  useEffect(() => {
    metaRef.current = meta;
    saveMeta(meta);
  }, [meta]);

  const focusCourt = useCallback(() => {
    stageRef.current?.focus({ preventScroll: true });
  }, []);

  const handleEvents = useCallback((events: ReturnType<typeof step>) => {
    const game = gameRef.current;
    for (const event of events) {
      if (event.type === "sound") playSound(event.name, soundRef.current);
      if (event.type === "score") {
        setScore(event.score);
        setLeft(event.left);
        if (event.score > bestRef.current) {
          bestRef.current = event.score;
          setBest(event.score);
          try {
            window.localStorage.setItem(BEST_KEY, String(event.score));
          } catch {
            // Storage can be disabled.
          }
        }
      }
      if (event.type === "combo") setCombo(event.combo);
      if (event.type === "wave") {
        setWave(event.wave);
        setLeft(event.left);
        if (!event.boss) setBoss(null);
      }
      if (event.type === "bossStart") setBoss({ name: event.name, hp: event.hp, maxHp: event.maxHp, phase: event.phase });
      if (event.type === "boss") setBoss({ name: event.name, hp: event.hp, maxHp: event.maxHp, phase: event.phase });
      if (event.type === "bossEnd") {
        setBoss(null);
        setMeta((prev) => ({ ...prev, bosses: prev.bosses + 1 }));
      }
      if (event.type === "offer") {
        setOffer(event.choices);
        setOfferFrom(event.from);
        statusRef.current = "offer";
        setStatus("offer");
      }
      if (event.type === "die" && game) {
        statusRef.current = "over";
        setStatus("over");
        const base = Math.floor(game.score / 16) + game.wave * 7 + game.bossesDown * 50;
        const chips = Math.round(base * chipMult(game));
        setEarnedChips(chips);
        setIsNewBest(game.score > baselineRef.current);
        setMeta((prev) => ({
          ...prev,
          chips: prev.chips + chips,
          lifetimeChips: prev.lifetimeChips + chips,
          runs: prev.runs + 1,
          bestWave: Math.max(prev.bestWave, game.wave),
          bestScore: Math.max(prev.bestScore, game.score),
        }));
      }
    }
  }, []);

  const startGame = useCallback(() => {
    const current = gameRef.current;
    if (!current) return;
    const game = createGame(current.width, current.height, metaRef.current);
    launch(game);
    gameRef.current = game;
    statusRef.current = "playing";
    baselineRef.current = bestRef.current;
    setStatus("playing");
    setScore(0);
    setWave(1);
    setCombo(0);
    setLeft(bricksLeft(game.bricks));
    setBoss(null);
    setOffer(null);
    setIsNewBest(false);
    setEarnedChips(0);
    focusCourt();
    playSound("start", soundRef.current);
  }, [focusCourt]);

  const togglePause = useCallback(() => {
    if (statusRef.current === "playing") {
      statusRef.current = "paused";
      setStatus("paused");
    } else if (statusRef.current === "paused") {
      statusRef.current = "playing";
      setStatus("playing");
    }
    focusCourt();
  }, [focusCourt]);

  const toggleSound = useCallback(() => {
    const next = !soundRef.current;
    soundRef.current = next;
    setSoundEnabled(next);
    if (statusRef.current === "playing") focusCourt();
  }, [focusCourt]);

  const pickPerk = useCallback((perk: PerkId) => {
    const game = gameRef.current;
    if (!game) return;
    const events = choosePerk(game, perk);
    setOffer(null);
    statusRef.current = "playing";
    setStatus("playing");
    focusCourt();
    handleEvents(events);
  }, [focusCourt, handleEvents]);

  const handleAction = useCallback(() => {
    if (statusRef.current === "ready" || statusRef.current === "over") {
      startGame();
      return;
    }
    if (statusRef.current === "paused") {
      togglePause();
      return;
    }
    if (statusRef.current === "offer") return;
    const game = gameRef.current;
    if (!game) return;
    const now = performance.now();
    if (now - lastFlapRef.current < 110) return;
    lastFlapRef.current = now;
    flap(game);
    playSound("flap", soundRef.current);
  }, [startGame, togglePause]);

  const buyUpgrade = useCallback((id: MetaUpgradeId) => {
    setMeta((prev) => {
      const upgrade = upgradeById(id);
      const level = levelOf(prev, id);
      const cost = upgradeCost(upgrade, level);
      if (level >= upgrade.max || prev.chips < cost) return prev;
      return { ...prev, chips: prev.chips - cost, levels: { ...prev.levels, [id]: level + 1 } };
    });
  }, []);

  const doPrestige = useCallback(() => {
    setMeta((prev) => {
      if (!canPrestige(prev) || prev.chips < prestigeCost(prev.stars)) return prev;
      return { ...defaultMeta(), stars: prev.stars + 1, bestScore: prev.bestScore, bestWave: prev.bestWave, runs: prev.runs };
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, .lab-panel")) return;
      if (statusRef.current === "offer" && ["Digit1", "Digit2", "Digit3"].includes(event.code)) {
        const index = Number(event.code.slice(-1)) - 1;
        const choices = gameRef.current?.offer ?? [];
        if (choices[index]) pickPerk(choices[index]);
        return;
      }
      if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
        event.preventDefault();
        if (!event.repeat) handleAction();
      } else if (event.code === "Enter" && statusRef.current !== "playing") {
        handleAction();
      } else if (event.code === "Escape" || event.code === "KeyP") {
        togglePause();
      } else if (event.code === "KeyM") {
        toggleSound();
      } else if (event.code === "Tab") {
        setLabOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleAction, pickPerk, togglePause, toggleSound]);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!stage || !canvas || !context) return;

    const resize = () => {
      const { width, height } = stage.getBoundingClientRect();
      if (!width || !height) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const game = gameRef.current;
      if (!game) {
        const created = createGame(width, height, metaRef.current);
        gameRef.current = created;
        setLeft(bricksLeft(created.bricks));
      } else {
        resizeGame(game, width, height);
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(stage);

    let frame = 0;
    let previousTime = 0;
    const loop = (timestamp: number) => {
      const game = gameRef.current;
      const delta = previousTime ? Math.min((timestamp - previousTime) / 1000, 0.034) : 0;
      previousTime = timestamp;
      if (game && delta > 0 && statusRef.current !== "paused") {
        const events = step(game, delta, statusRef.current === "playing");
        handleEvents(events);
      }
      if (game) drawGame(context, game, statusRef.current);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [handleEvents]);

  useEffect(() => () => closeAudio(), []);

  const primaryLabel =
    status === "playing"
      ? "PAUSE GAME"
      : status === "paused"
        ? "RESUME GAME"
        : status === "over"
          ? "PLAY AGAIN"
          : status === "offer"
            ? "PICK A PERK"
            : "START PLAYING";
  const primaryAction = status === "playing" ? togglePause : handleAction;

  const metaSummary = useMemo(() => {
    const parts: string[] = [];
    const scoreLevel = levelOf(meta, "score");
    if (scoreLevel > 0) parts.push(`+${scoreLevel * 8}% SCORE`);
    if (levelOf(meta, "chips") > 0) parts.push(`+${levelOf(meta, "chips") * 15}% CHIPS`);
    if (levelOf(meta, "shield") > 0) parts.push(`SHIELD x${levelOf(meta, "shield")}`);
    if (levelOf(meta, "lives") > 0) parts.push(`+${levelOf(meta, "lives")} BALL`);
    if (meta.stars > 0) parts.push(`${meta.stars}★`);
    return parts.length ? parts.join(" · ") : "NO PERMANENT UPGRADES YET";
  }, [meta]);

  const nextBossIn = 5 - (wave % 5);

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="mini-brand" aria-label="Flappy Pong Arkanoid">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 42 42" fill="none">
              <path d="M7 9v24M35 9v24" stroke="#D9F47A" strokeWidth="3" strokeLinecap="round" />
              <rect x="13" y="15" width="7" height="4" rx="0.6" fill="#F4E2C6" />
              <rect x="21" y="15" width="7" height="4" rx="0.6" fill="#FF7455" />
              <rect x="17" y="20.5" width="7" height="4" rx="0.6" fill="#F2C14E" />
              <circle cx="29" cy="13" r="2.4" fill="#FFF9E8" />
            </svg>
          </span>
          <span>FLAPPY<span className="brand-slash">/</span>PONG</span>
          <span className="ark-badge">ARK</span>
        </div>
        <div className="topbar-right">
          <button className={`chip-button ${labOpen ? "is-open" : ""}`} type="button" onClick={() => setLabOpen((open) => !open)} aria-expanded={labOpen}>
            <ChipIcon />
            <span>{formatChips(meta.chips)}</span>
            <em>META LAB</em>
          </button>
          <button className="sound-button" type="button" onClick={toggleSound} aria-label={soundEnabled ? "Mute sound" : "Turn on sound"} aria-pressed={soundEnabled}>
            <SoundIcon enabled={soundEnabled} />
            <span>SOUND {soundEnabled ? "ON" : "OFF"}</span>
          </button>
        </div>
      </header>

      <main className="main-layout">
        <section className="intro" aria-labelledby="game-title">
          <div className="eyebrow"><span className="eyebrow-dot" /> FLAPPY · PONG · ARKANOID · ROGUELITE</div>
          <h1 id="game-title" className="hero-title">
            <span>FLAPPY</span>
            <span className="title-second">PONG<span className="title-period">.</span></span>
          </h1>
          <p className="title-ark"><i aria-hidden="true"><b /><b /><b /></i><span>ROGUELITE RUNS</span></p>
          <p className="intro-copy">Flap, smash, rally. Draft a perk after every wall, bank chips, and face the meta check every five waves.</p>
          <button className="primary-button" type="button" onClick={() => { primaryAction(); focusCourt(); }}>
            <span>{primaryLabel}</span>
            <span className="button-arrow"><ArrowIcon /></span>
          </button>
          <div className="meta-strip">
            <span className="meta-strip-label">PERMANENT</span>
            <span className="meta-strip-value">{metaSummary}</span>
          </div>
          <ol className="rules">
            <li><span>01</span><strong>Flap</strong><em>Stay off the coral floor.</em></li>
            <li><span>02</span><strong>Smash</strong><em>Clear each Arkanoid wall.</em></li>
            <li><span>03</span><strong>Rally</strong><em>Hit the paddle opposite.</em></li>
          </ol>
          <div className="boss-note"><span className={`boss-dot ${nextBossIn <= 1 ? "is-hot" : ""}`} />{nextBossIn <= 1 ? "BOSS WAVE INCOMING" : `BOSS CHECK IN ${nextBossIn} WAVE${nextBossIn === 1 ? "" : "S"}`}</div>
          <div className="control-note"><span className="keycap">SPACE</span><span>flap · 1 2 3 pick perk · TAB meta lab</span></div>
        </section>

        <section className="game-area" aria-label="Flappy Pong Arkanoid court">
          <div
            className={`game-stage game-stage--${status}`}
            ref={stageRef}
            tabIndex={-1}
            aria-label="Game court. Press space, click, or tap to flap. Smash bricks, dodge hazards, hit the far paddle."
            onPointerDown={(event) => {
              if ((event.target as HTMLElement).closest("button")) return;
              event.preventDefault();
              handleAction();
            }}
          >
            <canvas ref={canvasRef} className="game-canvas" aria-hidden="true" />
            <div className="court-hud">
              <div className="court-state">
                <span className={`state-light ${status === "playing" ? "is-live" : ""}`} />
                <span className="wave-stack">
                  <span>WAVE {String(wave).padStart(2, "0")}</span>
                  <span className={`bricks-left ${combo > 1 ? "is-hot" : ""}`}>
                    {combo > 1 ? `x${combo} COMBO` : boss ? `${boss.hp} CORE` : `${left} LEFT`}
                  </span>
                </span>
              </div>
              <div className="score-display" aria-label={`Score ${score}`}>
                <span>SCORE</span>
                <strong key={score}>{formatScore(score)}</strong>
              </div>
              <div className="court-right">
                <span className="best-display">BEST <strong>{formatScore(best)}</strong></span>
                {(status === "playing" || status === "paused") && (
                  <button className="pause-button" type="button" onClick={togglePause} aria-label={status === "paused" ? "Resume game" : "Pause game"}>
                    <PauseIcon paused={status === "paused"} />
                  </button>
                )}
              </div>
            </div>

            {boss && status !== "ready" && (
              <div className="boss-track" aria-label={`Boss ${boss.name}`}>
                <div className="boss-label">
                  <span>{boss.name}</span>
                  <span className="boss-phase">PHASE {boss.phase + 1}</span>
                </div>
                <div className="boss-bar">
                  <i style={{ width: `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%` }} />
                </div>
              </div>
            )}

            {status === "ready" && (
              <div className="stage-message ready-message" aria-hidden="true">
                <span className="message-kicker">THE WALL IS SET</span>
                <strong>BREAK IT.</strong>
                <span className="message-sub">TAP THE COURT OR PRESS SPACE</span>
              </div>
            )}
            {status === "paused" && (
              <div className="stage-message stage-overlay">
                <span className="message-kicker">THE WALL CAN WAIT</span>
                <strong>PAUSED.</strong>
                <button className="overlay-button" type="button" onClick={togglePause}>RESUME GAME <ArrowIcon /></button>
              </div>
            )}
            {status === "offer" && offer && (
              <div className="stage-message stage-overlay offer-overlay" role="dialog" aria-label="Choose a perk">
                <span className="message-kicker">{offerFrom === "boss" ? "BOSS DOWN · PICK ONE" : "WALL CLEARED · PICK ONE"}</span>
                <strong>DRAFT A PERK.</strong>
                <div className="offer-cards">
                  {offer.map((perk, index) => (
                    <button key={perk} className="offer-card" type="button" onClick={() => pickPerk(perk)}>
                      <span className="offer-key">{index + 1}</span>
                      <strong>{PERK_BY_ID[perk].name}</strong>
                      <em>{PERK_BY_ID[perk].desc}</em>
                      <span className="offer-stack">
                        stack {((gameRef.current?.perks[perk] ?? 0) + 1)}/{PERK_BY_ID[perk].max}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {status === "over" && (
              <div className="stage-message stage-overlay" aria-live="polite">
                <span className={`message-kicker ${isNewBest ? "is-best" : ""}`}>{isNewBest ? "NEW BEST RALLY" : "THE RALLY ENDS HERE"}</span>
                <strong>GAME OVER.</strong>
                <span className="result-line">
                  <span>WAVE {String(wave).padStart(2, "0")}</span>
                  <span className="result-divider" />
                  <span>SCORE {formatScore(score)}</span>
                  <span className="result-divider" />
                  <span>BEST {formatScore(best)}</span>
                </span>
                <span className="chip-payout">
                  <ChipIcon /> +{formatChips(earnedChips)} CHIPS
                  <span className="chip-mult">x{chipMult(gameRef.current ?? ({ stars: 0, perks: {}, metaLevels: {} } as Game)).toFixed(2)}</span>
                </span>
                <div className="overlay-actions">
                  <button className="overlay-button" type="button" onClick={startGame}>PLAY AGAIN <ArrowIcon /></button>
                  <button className="overlay-button is-ghost" type="button" onClick={() => setLabOpen(true)}>META LAB <ArrowIcon /></button>
                </div>
              </div>
            )}
          </div>
          <div className="game-caption">
            <span>01 / THE WALL</span>
            <span>STEEL BOUNCES. HAZARDS KILL. CLEAR EVERY BRICK.</span>
          </div>
        </section>
      </main>

      {labOpen && (
        <aside className="lab-panel" role="dialog" aria-label="Meta lab">
          <header className="lab-head">
            <div>
              <span className="lab-kicker">META PROGRESSION</span>
              <h2>META LAB</h2>
            </div>
            <div className="lab-chips">
              <ChipIcon />
              <strong>{formatChips(meta.chips)}</strong>
            </div>
            <button className="lab-close" type="button" onClick={() => setLabOpen(false)} aria-label="Close meta lab">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m5 5 10 10M15 5 5 15" /></svg>
            </button>
          </header>

          <dl className="lab-stats">
            <div><dt>RUNS</dt><dd>{meta.runs}</dd></div>
            <div><dt>BEST WAVE</dt><dd>{String(meta.bestWave).padStart(2, "0")}</dd></div>
            <div><dt>BEST SCORE</dt><dd>{formatScore(meta.bestScore)}</dd></div>
            <div><dt>BOSSES</dt><dd>{meta.bosses}</dd></div>
          </dl>

          <div className="lab-scroll">
            <ul className="lab-list">
              {META_UPGRADES.map((upgrade) => {
                const level = levelOf(meta, upgrade.id);
                const maxed = level >= upgrade.max;
                const cost = upgradeCost(upgrade, level);
                const affordable = canBuy(meta, upgrade.id);
                return (
                  <li key={upgrade.id} className={`lab-item ${maxed ? "is-maxed" : ""}`}>
                    <div className="lab-item-copy">
                      <strong>{upgrade.name}</strong>
                      <em>{upgrade.desc}</em>
                    </div>
                    <div className="lab-item-right">
                      <span className="lab-levels">
                        {Array.from({ length: upgrade.max }, (_, index) => (
                          <i key={index} className={index < level ? "is-on" : ""} />
                        ))}
                      </span>
                      <button
                        className="lab-buy"
                        type="button"
                        disabled={maxed || !affordable}
                        onClick={() => buyUpgrade(upgrade.id)}
                      >
                        {maxed ? "MAX" : <>{cost} <ChipIcon /></>}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <section className="lab-prestige" aria-label="Prestige">
              <div>
                <strong>REBUILD CABINET</strong>
                <em>
                  Reset all upgrades for a permanent star. Each star adds +5% score and +12% chips forever.
                  Need {formatChips(prestigeTarget(meta.stars))} lifetime chips.
                </em>
                <span className="lab-stars">STARS {meta.stars}</span>
              </div>
              <button className="lab-buy is-prestige" type="button" disabled={!canPrestige(meta) || meta.chips < prestigeCost(meta.stars)} onClick={doPrestige}>
                {formatChips(prestigeCost(meta.stars))} <ChipIcon />
              </button>
            </section>

            <section className="lab-perks" aria-label="Perk pool">
              <span className="lab-kicker">PERK POOL · DRAFTED BETWEEN WAVES</span>
              <ul>
                {PERKS.map((perk) => (
                  <li key={perk.id}>
                    <strong>{perk.name}</strong>
                    <em>{perk.desc}</em>
                    <span>max {perk.max}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </aside>
      )}

      <span className="sr-only" aria-live="polite">
        {status === "over" ? `Game over on wave ${wave}. Score ${score}. Earned ${earnedChips} chips.` : status === "paused" ? "Game paused." : ""}
      </span>
    </div>
  );
}
