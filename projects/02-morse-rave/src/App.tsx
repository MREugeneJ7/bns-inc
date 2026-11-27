import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { CharStrip } from "./components/CharStrip";
import { Btn, Slider, Toggle } from "./components/Controls";
import { Icon } from "./components/Icon";
import { Lamp } from "./components/Lamp";
import { Reference } from "./components/Reference";
import { Spectrum } from "./components/Spectrum";
import { StraightKey } from "./components/StraightKey";
import { Tape } from "./components/Tape";
import { MeltingClock } from "./components/MeltingClock";
import { DisclaimerGate } from "./components/DisclaimerGate";
import { PhobiaProjections } from "./components/PhobiaProjections";
import { readSigned } from "./lib/disclaimer";
import { TripPanel } from "./components/TripPanel";
import { useMorsePlayer } from "./hooks/useMorsePlayer";
import { useTrip } from "./hooks/useTrip";
import {
  BAD_TRIP_PALETTE,
  containsBadWords,
  isForcedBadTripQuery,
  rollBadTripChance,
  type BadTripReason,
} from "./lib/badTrip";
import { TRIP_LEVELS, TRIP_SPEEDS, type TripSpeed } from "./lib/trip";
import { MORSE, buildTimeline, toMorseText } from "./lib/morse";
import {
  LIGHTS,
  SOUNDS,
  type LightPalette,
  type SoundProfile,
} from "./lib/rave";
import { cn } from "./utils/cn";

const MAX = 240;
const PRESETS = ["SOS", "RAVE ON", "ONE MORE TRACK"];

function SoundWave({ profile }: { profile: SoundProfile }) {
  return (
    <svg
      viewBox="0 0 60 24"
      fill="none"
      aria-hidden="true"
      className="sound-wave"
    >
      <path
        d={
          profile === "warehouse"
            ? "M0 17h8V6h9v12h10V6h10v12h10V6h10v11h3"
            : profile === "acid"
              ? "m0 18 10-13v14L24 4v15L38 4v15L52 4v14h8"
              : "M0 12c5-17 10 17 15 0S25 29 30 12s10 17 15 0 10 17 15 0"
        }
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function App() {
  const [text, setText] = useState("hello world");
  const [bpm, setBpm] = useState(138);
  const [profile, setProfile] = useState<SoundProfile>("warehouse");
  const [paletteId, setPaletteId] = useState<LightPalette>("neon");
  const [volume, setVolume] = useState(0.35);
  const [intensity, setIntensity] = useState(60);
  const [soundOn, setSoundOn] = useState(true);
  const [flashOn, setFlashOn] = useState(true);
  const [beatOn, setBeatOn] = useState(true);
  const [softGlow, setSoftGlow] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [loop, setLoop] = useState(false);
  const [syncBeat, setSyncBeat] = useState(true);
  const [wpm, setWpm] = useState(14);
  const [gapScale, setGapScale] = useState(1);
  const [toneHz, setToneHz] = useState(440);
  const [advanced, setAdvanced] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState("Copy");
  const consentRef = useRef(false);
  const requestPlayRef = useRef<() => void>(() => {});
  const warningRef = useRef<HTMLDialogElement>(null);
  const lightPanelRef = useRef<HTMLElement>(null);
  const copyTimerRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const meltRef = useRef<SVGFEDisplacementMapElement>(null);
  const [tripSpeed, setTripSpeed] = useState<TripSpeed>("clocks");
  const [escalate, setEscalate] = useState(true);
  const [randomBadTrip, setRandomBadTrip] = useState(() =>
    isForcedBadTripQuery(),
  );
  const [signed, setSigned] = useState(readSigned);

  const hasBadWords = useMemo(() => containsBadWords(text), [text]);
  const badTrip = hasBadWords || randomBadTrip;
  const badTripReason: BadTripReason = hasBadWords
    ? "words"
    : randomBadTrip
      ? "chance"
      : null;
  const effectiveLoop = loop || badTrip;

  const unit = syncBeat ? 60000 / bpm / 4 : 1200 / wpm;
  const timeline = useMemo(
    () => buildTimeline(text, unit, gapScale),
    [text, unit, gapScale],
  );
  const morseText = useMemo(() => toMorseText(text), [text]);
  const skippedSymbols = useMemo(
    () =>
      Array.from(text.toUpperCase()).some(
        (char) => !MORSE[char] && !/\s/.test(char),
      ),
    [text],
  );
  const palette = LIGHTS.find((item) => item.id === paletteId)!;
  const sound = SOUNDS.find((item) => item.id === profile)!;

  const player = useMorsePlayer({
    segments: timeline.segments,
    total: timeline.total,
    profile,
    bpm,
    toneHz,
    volume,
    soundOn,
    beatOn,
    badTrip,
    loop: effectiveLoop,
    onRequestPlay: () => requestPlayRef.current(),
    onStop: () => setRandomBadTrip(false),
  });
  const live = player.state === "playing";
  const trip = useTrip({
    playing: live,
    paused: player.state === "paused",
    loop: effectiveLoop,
    escalate,
    seconds: TRIP_SPEEDS.find((item) => item.id === tripSpeed)!.seconds,
    soft: softGlow,
    rootRef,
    onTrip: (value, visual) => {
      player.setTrip(badTrip ? Math.max(value, 0.65) : value);
      meltRef.current?.setAttribute(
        "scale",
        (Math.max(0, (badTrip ? Math.max(visual, 0.55) : visual) - 0.22) * 46).toFixed(2),
      );
    },
  });
  const tripLevel = trip.level;
  const activeLetter =
    player.activeChar >= 0
      ? (timeline.chars[player.activeChar]?.char ?? null)
      : null;
  const activeColors = badTrip ? BAD_TRIP_PALETTE.colors : palette.colors;
  const activeRgb = badTrip ? BAD_TRIP_PALETTE.rgb : palette.rgb;
  const colorIndex = softGlow ? 0 : player.pulseIndex % activeColors.length;
  const variables = {
    "--primary": activeColors[0],
    "--secondary": activeColors[1],
    "--primary-rgb": activeRgb[0],
    "--secondary-rgb": activeRgb[1],
    "--signal": activeColors[colorIndex],
    "--signal-rgb": activeRgb[colorIndex],
    "--intensity": intensity / 100,
    "--beat-duration": `${60 / bpm}s`,
  } as CSSProperties;

  const maybeTriggerRandomBadTrip = () => {
    if (player.state !== "paused" && !badTrip && rollBadTripChance()) {
      setRandomBadTrip(true);
    }
  };

  const requestPlay = () => {
    if (!signed) return;
    if (live) {
      player.pause();
      return;
    }
    if (!timeline.total) return;
    if (flashOn && intensity > 0 && !softGlow && !consentRef.current)
      setWarningOpen(true);
    else {
      maybeTriggerRandomBadTrip();
      player.play();
    }
  };
  requestPlayRef.current = requestPlay;

  const startWithLights = (soft: boolean) => {
    consentRef.current = true;
    setSoftGlow(soft);
    setWarningOpen(false);
    maybeTriggerRandomBadTrip();
    player.play();
  };

  const handleStop = () => {
    setRandomBadTrip(false);
    player.stop();
  };

  const handleComeDown = () => {
    setRandomBadTrip(false);
    trip.comeDown();
  };

  useEffect(() => {
    const dialog = warningRef.current;
    if (warningOpen && !dialog?.open) dialog?.showModal();
    else if (!warningOpen && dialog?.open) dialog.close();
  }, [warningOpen]);

  useEffect(() => {
    if (!immersive) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const previousFocus = document.activeElement as HTMLElement | null;
    lightPanelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setImmersive(false);
      if (event.key !== "Tab") return;
      const buttons =
        lightPanelRef.current?.querySelectorAll<HTMLButtonElement>(
          "button:not([disabled])",
        );
      if (!buttons?.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      previousFocus?.focus();
    };
  }, [immersive]);

  useEffect(
    () => () => {
      if (copyTimerRef.current !== null)
        window.clearTimeout(copyTimerRef.current);
    },
    [],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(morseText);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Select text to copy");
    }
    if (copyTimerRef.current !== null)
      window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopyStatus("Copy"), 2000);
  };

  const statusLabel = badTrip
    ? "Bad trip. Loop locked."
    : live
      ? TRIP_LEVELS[escalate ? tripLevel : 0].status
      : player.state === "paused"
        ? "Taking a breather."
        : player.state === "done"
          ? "Message dropped."
          : "Ready when you are.";
  const playLabel = live
    ? "Pause the rave"
    : player.state === "paused"
      ? "Keep it going"
      : player.state === "done"
        ? "Drop it again"
        : "Drop the message";

  return (
    <div
      ref={rootRef}
      className="rave-app"
      style={variables}
      data-live={live}
      data-soft={softGlow}
      data-lights={flashOn}
      data-pulse={player.lamp && flashOn}
      data-trip-level={tripLevel}
      data-tripping={tripLevel > 0 || badTrip}
      data-melting={tripLevel >= 2 || badTrip}
      data-bad-trip={badTrip}
    >
      <svg className="svg-defs" width="0" height="0" aria-hidden="true">
        <filter id="melt" x="-10%" y="-10%" width="120%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.035"
            numOctaves="2"
            seed="7"
          />
          <feDisplacementMap
            ref={meltRef}
            in="SourceGraphic"
            scale="0"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="phobia-light-warp" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.022 0.055"
            numOctaves="2"
            seed="13"
            result="warpNoise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="warpNoise"
            scale="24"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
      <div className="room-background" aria-hidden="true">
        <div className="room-grid" />
        <div className="room-ambient ambient-pink" />
        <div className="room-ambient ambient-blue" />
        <div className="clock-gallery">
          <MeltingClock style={{ top: "12%", left: "3%", "--r": "-14deg" } as CSSProperties} />
          <MeltingClock style={{ top: "44%", right: "2%", "--r": "18deg", animationDelay: "-3s" } as CSSProperties} />
          <MeltingClock style={{ bottom: "6%", left: "6%", "--r": "8deg", animationDelay: "-5s" } as CSSProperties} />
          <MeltingClock style={{ top: "4%", right: "18%", "--r": "-6deg", animationDelay: "-1.5s" } as CSSProperties} />
        </div>
      </div>
      <div className="room-wash" aria-hidden="true" />
      {!signed && <DisclaimerGate onSigned={() => setSigned(true)} />}

      <main className="app-shell">
        <nav className="top-line" aria-label="App controls">
          <div className="brand-lockup">
            <span className="morse-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>
              FLASHBACK<span className="brand-slash"> / </span>
              <span className="brand-edition">AFTER HOURS</span>
            </span>
          </div>
          <span className="nav-caption">A MORSE CODE EXPERIENCE</span>
          <button
            type="button"
            className="sound-switch"
            onClick={() => setSoundOn(!soundOn)}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Mute sound" : "Enable sound"}
          >
            <Icon name={soundOn ? "volume" : "mute"} size={16} />
            <span>SOUND {soundOn ? "ON" : "OFF"}</span>
          </button>
        </nav>

        <header className="intro entrance">
          <div>
            <div className="intro-kicker">WORDS IN. LIGHTS OUT. BASS UP.</div>
            <h1 aria-label="Flashback">
              {"FLASH".split("").map((letter, i) => (
                <span
                  key={i}
                  className="melt-letter"
                  style={{ "--i": i } as CSSProperties}
                  aria-hidden="true"
                >
                  {letter}
                </span>
              ))}
              <span className="title-outline" aria-hidden="true">
                {"BACK".split("").map((letter, i) => (
                  <span
                    key={i}
                    className="melt-letter"
                    style={{ "--i": i + 5 } as CSSProperties}
                  >
                    {letter}
                  </span>
                ))}
              </span>
              <i aria-hidden="true">*</i>
            </h1>
            <p>Type anything. We'll turn it into a Morse code rave.</p>
          </div>
          <div className="transmission-status" aria-live="polite">
            <span className={cn("status-light", live && "is-live")} />
            <span>{statusLabel}</span>
          </div>
        </header>

        <div className="console entrance" style={{ animationDelay: "80ms" }}>
          <div className="workspace">
            <section className="composer" aria-label="Message transmitter">
              <div className="section-heading">
                <label htmlFor="message" className="micro-label">
                  <span className="section-number">01</span> YOUR MESSAGE
                </label>
                <span className="character-count">
                  {text.length}
                  <span> / {MAX}</span>
                </span>
              </div>
              <textarea
                id="message"
                value={text}
                maxLength={MAX}
                spellCheck={false}
                onChange={(event) => setText(event.target.value)}
                placeholder="Say something. Make some noise."
                rows={2}
                aria-describedby="message-help"
              />
              <div className="preset-row">
                <span id="message-help">Try a little</span>
                {PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setText(preset)}
                  >
                    {preset}
                    <Icon name="arrow" size={11} />
                  </button>
                ))}
                <button
                  type="button"
                  className="clear-message"
                  onClick={() => setText("")}
                  disabled={!text}
                >
                  Clear
                </button>
              </div>

              <div className="translation-heading">
                <span className="micro-label">THE MORSE MIX</span>
                <button
                  type="button"
                  className="text-button"
                  onClick={copy}
                  disabled={!morseText}
                >
                  <Icon
                    name={copyStatus === "Copied" ? "check" : "copy"}
                    size={12}
                  />
                  {copyStatus}
                </button>
              </div>
              <p className="morse-readout" aria-label="Morse code translation">
                {morseText || (
                  <span className="silence">A little quiet in here...</span>
                )}
              </p>
              {skippedSymbols && (
                <p className="input-note">
                  Symbols without a Morse equivalent are skipped.
                </p>
              )}
              <CharStrip
                chars={timeline.chars}
                activeChar={player.activeChar}
              />

              <div className="timeline-heading">
                <span className="micro-label">SIGNAL TIMELINE</span>
                <span>
                  {(timeline.total / 1000).toFixed(1)}
                  <small> SEC</small>
                </span>
              </div>
              <Tape
                onSegments={timeline.onSegments}
                total={timeline.total}
                playheadRef={player.playheadRef}
                progressRef={player.progressRef}
                active={live}
              />

              <div className="transport">
                <Btn
                  variant="primary"
                  onClick={requestPlay}
                  disabled={!timeline.total}
                >
                  <Icon name={live ? "pause" : "play"} size={18} />
                  {playLabel}
                  <Icon name="arrow" className="play-arrow" size={17} />
                </Btn>
                <button
                  type="button"
                  className="icon-button stop-button"
                  aria-label="Stop transmission"
                  title="Stop (Esc)"
                  onClick={handleStop}
                >
                  <Icon name="stop" size={16} />
                </button>
                <button
                  type="button"
                  className={cn(
                    "icon-button",
                    effectiveLoop && "is-selected",
                    badTrip && "is-forced",
                  )}
                  aria-label="Repeat message"
                  aria-pressed={effectiveLoop}
                  disabled={badTrip}
                  title={
                    badTrip
                      ? "Loop locked during bad trip"
                      : "Repeat message"
                  }
                  onClick={() => {
                    if (!badTrip) setLoop(!loop);
                  }}
                >
                  <Icon name="repeat" size={17} />
                </button>
              </div>
              <div className="transport-hint">
                <span>
                  <kbd>SPACE</kbd> play / pause
                </span>
                <span>
                  <kbd>ESC</kbd> instant silence
                </span>
              </div>
              {player.audioError && (
                <p className="input-note" role="status">
                  Audio couldn't start. Lights still work; try playing again to
                  enable sound.
                </p>
              )}
            </section>

            <section
              ref={lightPanelRef}
              className={cn("light-panel", immersive && "is-immersive")}
              role={immersive ? "dialog" : undefined}
              aria-modal={immersive || undefined}
              aria-label="Light room"
            >
              <div className="section-heading">
                <span className="micro-label">
                  <span className="section-number">02</span> THE LIGHT ROOM
                </span>
                <button
                  type="button"
                  className="icon-button expand-button"
                  aria-label={
                    immersive ? "Exit light room" : "Expand light room"
                  }
                  title={immersive ? "Exit light room" : "Go full experience"}
                  onClick={() => {
                    if (immersive) player.stop();
                    setImmersive(!immersive);
                  }}
                >
                  <Icon name={immersive ? "close" : "expand"} size={15} />
                </button>
              </div>
              <div
                ref={player.stageRef}
                className="light-stage"
                data-running={live && flashOn}
              >
                <div className="stage-grid" aria-hidden="true" />
                <div className="stage-kaleido" aria-hidden="true" />
                <div className="stage-beams" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <div className="stage-floor" aria-hidden="true" />
                <PhobiaProjections
                  active={badTrip && flashOn}
                  flash={player.lamp && flashOn}
                  pulseIndex={player.pulseIndex}
                />
                <Lamp
                  on={player.lamp && flashOn}
                  running={live && flashOn}
                  kind={player.pulseKind}
                  activeLetter={activeLetter}
                  mustache={tripLevel >= 4 && !badTrip}
                  badTrip={badTrip}
                />
                <Spectrum
                  analyserRef={player.analyserRef}
                  active={live && soundOn}
                />
                <div className="stage-caption">
                  <span>
                    {live ? "LIVE TRANSMISSION" : "YOUR OWN LITTLE WAREHOUSE"}
                  </span>
                  <div
                    className="beat-dots"
                    aria-label={
                      live
                        ? `Beat ${player.beatIndex + 1} of 4`
                        : "Beat standby"
                    }
                  >
                    {[0, 1, 2, 3].map((index) => (
                      <i
                        key={index}
                        className={
                          player.beatIndex === index ? "is-active" : ""
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="light-switches">
                <Toggle
                  label="Lights"
                  on={flashOn}
                  onChange={(on) => {
                    if (on && live && !softGlow && !consentRef.current) {
                      player.pause();
                      setWarningOpen(true);
                    }
                    setFlashOn(on);
                  }}
                />
                <button
                  type="button"
                  className={cn("soft-glow-button", softGlow && "is-selected")}
                  aria-pressed={softGlow}
                  onClick={() => {
                    if (softGlow && live && !consentRef.current) {
                      player.pause();
                      setWarningOpen(true);
                    } else setSoftGlow(!softGlow);
                  }}
                >
                  <span className="soft-glow-dot" />
                  Soft glow
                  <Icon name={softGlow ? "check" : "light"} size={13} />
                </button>
              </div>
              <p className="light-warning">
                <Icon name="warning" size={12} />
                Flashing lights when playing. Soft glow is gentler.
              </p>
              {immersive && (
                <div className="immersive-transport">
                  <Btn
                    variant="primary"
                    onClick={requestPlay}
                    disabled={!timeline.total}
                  >
                    <Icon name={live ? "pause" : "play"} />
                    {playLabel}
                  </Btn>
                  <Btn onClick={player.stop}>
                    <Icon name="stop" />
                    Stop
                  </Btn>
                </div>
              )}
            </section>
          </div>

          <div className="sound-light-mixer">
            <fieldset className="choice-panel sound-choices">
              <legend className="micro-label">
                <span className="section-number">03</span> PICK YOUR SOUND
              </legend>
              <div className="choice-options">
                {SOUNDS.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={cn(
                      "sound-choice",
                      profile === item.id && "is-selected",
                    )}
                    aria-pressed={profile === item.id}
                    onClick={() => setProfile(item.id)}
                  >
                    <SoundWave profile={item.id} />
                    <span>{item.name}</span>
                    <small>{item.tag}</small>
                  </button>
                ))}
              </div>
              <div className="choice-caption">
                <span>{sound.detail}</span>
                <button
                  type="button"
                  className={cn("beat-toggle", beatOn && "is-on")}
                  aria-pressed={beatOn}
                  onClick={() => setBeatOn(!beatOn)}
                >
                  <span />
                  DRUMS {beatOn ? "ON" : "OFF"}
                </button>
              </div>
            </fieldset>
            <fieldset className="choice-panel light-choices">
              <legend className="micro-label">
                <span className="section-number">04</span> PICK YOUR LIGHT
              </legend>
              <div className="choice-options">
                {LIGHTS.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={cn(
                      "palette-choice",
                      paletteId === item.id && "is-selected",
                    )}
                    aria-pressed={paletteId === item.id}
                    onClick={() => setPaletteId(item.id)}
                  >
                    <span
                      className="palette-swatch"
                      style={
                        {
                          background: `linear-gradient(135deg, ${item.colors[0]} 0% 44%, ${item.colors[1]} 56% 100%)`,
                          "--swatch-color": item.colors[0],
                        } as CSSProperties
                      }
                    />
                    <span>{item.name}</span>
                    {paletteId === item.id && <Icon name="check" size={12} />}
                  </button>
                ))}
              </div>
              <div className="choice-caption">
                <span>{palette.detail}</span>
                <span>MORSE-SYNCED</span>
              </div>
            </fieldset>
          </div>

          <TripPanel
            level={tripLevel}
            speed={tripSpeed}
            onSpeed={setTripSpeed}
            escalate={escalate}
            onEscalate={setEscalate}
            loop={effectiveLoop}
            onEnableLoop={() => setLoop(true)}
            comingDown={trip.comingDown}
            onComeDown={handleComeDown}
            badTrip={badTrip}
            badTripReason={badTripReason}
          />

          <div className="mix-controls">
            <Slider
              label="TEMPO"
              value={bpm}
              min={100}
              max={160}
              suffix=" BPM"
              onChange={setBpm}
            />
            <Slider
              label="LIGHT INTENSITY"
              value={intensity}
              min={0}
              max={100}
              suffix="%"
              onChange={setIntensity}
            />
            <Slider
              label="MASTER VOLUME"
              value={Math.round(volume * 100)}
              min={0}
              max={100}
              suffix="%"
              onChange={(value) => setVolume(value / 100)}
            />
            <button
              type="button"
              className={cn("fine-tune-button", advanced && "is-selected")}
              aria-expanded={advanced}
              aria-controls="fine-tune"
              onClick={() => setAdvanced(!advanced)}
            >
              <Icon name="settings" size={17} />
              <span>Fine-tune</span>
              <Icon
                name="chevron"
                size={13}
                className={advanced ? "rotate-180" : ""}
              />
            </button>
          </div>
          {advanced && (
            <div className="advanced-controls" id="fine-tune">
              <Toggle
                label="Beat-locked Morse"
                hint="One dot = a sixteenth note"
                on={syncBeat}
                onChange={setSyncBeat}
              />
              <Slider
                label="MORSE SPEED"
                value={syncBeat ? Math.round(1200 / unit) : wpm}
                min={5}
                max={35}
                suffix=" WPM"
                disabled={syncBeat}
                onChange={setWpm}
              />
              <Slider
                label="LEAD PITCH"
                value={toneHz}
                min={220}
                max={880}
                step={10}
                suffix=" Hz"
                onChange={setToneHz}
              />
              <Slider
                label="LETTER SPACING"
                value={gapScale}
                min={1}
                max={3}
                step={0.1}
                format={(value) => `${value.toFixed(1)}x`}
                onChange={setGapScale}
              />
            </div>
          )}
        </div>

        <div className="under-console">
          <span>
            <i className="tiny-signal" /> BUILT FOR YOUR BROWSER. MADE FOR YOUR
            SENSES.
          </span>
          <button
            type="button"
            onClick={() => setToolsOpen(!toolsOpen)}
            aria-expanded={toolsOpen}
            aria-controls="morse-tools"
          >
            MORSE TOOLS
            <Icon
              name="chevron"
              size={13}
              className={toolsOpen ? "rotate-180" : ""}
            />
          </button>
        </div>
        {toolsOpen && (
          <section className="morse-tools" id="morse-tools">
            <Reference activeChar={activeLetter} />
            <StraightKey
              unit={unit}
              toneHz={toneHz}
              profile={profile}
              soundOn={soundOn}
              onSend={(value) =>
                setText((previous) =>
                  `${previous}${previous ? " " : ""}${value}`.slice(0, MAX),
                )
              }
            />
          </section>
        )}
        <footer className="site-footer">
          <span>NO SIGNAL LOST. JUST A LITTLE MORE BASS.</span>
          <span>
            FLASHBACK <span className="footer-star">*</span> AFTER HOURS EDITION
          </span>
        </footer>
      </main>

      <dialog
        ref={warningRef}
        className="warning-dialog"
        onCancel={() => setWarningOpen(false)}
        onClose={() => setWarningOpen(false)}
        aria-labelledby="warning-title"
        aria-describedby="warning-description"
      >
        <button
          type="button"
          className="icon-button dialog-close"
          aria-label="Cancel playback"
          onClick={() => setWarningOpen(false)}
        >
          <Icon name="close" />
        </button>
        <div className="warning-icon">
          <Icon name="warning" size={28} />
        </div>
        <span className="micro-label">BEFORE WE DROP IT</span>
        <h2 id="warning-title">
          Big energy.
          <br />A little heads-up.
        </h2>
        <p id="warning-description">
          This experience uses flashing, color-changing lights. They can trigger
          seizures or discomfort for people with photosensitivity. Soft glow
          removes the rapid flashes and sweeping lights.
        </p>
        <p className="dialog-trip-note">
          With repeat on, things get progressively trippier: drifting colors,
          melting shapes, wobbling panels. Hit "Come down" or Stop anytime.
        </p>
        <div className="warning-actions">
          <Btn variant="primary" onClick={() => startWithLights(true)}>
            Start with soft glow
            <Icon name="arrow" size={17} />
          </Btn>
          <Btn onClick={() => startWithLights(false)}>Use flashing lights</Btn>
        </div>
        <p className="dialog-hint">
          Start at a low volume. Press Esc to stop at any time.
        </p>
      </dialog>
    </div>
  );
}
