import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAudioContext, setMasterVolume } from "../lib/audio";
import { charIndexAt, segmentAt, type Segment } from "../lib/morse";
import { RaveAudio, type RaveSettings } from "../lib/raveAudio";

export type PlayerState = "idle" | "playing" | "paused" | "done";
type Options = RaveSettings & {
  segments: Segment[];
  total: number;
  volume: number;
  loop: boolean;
  onRequestPlay: () => void;
  onStop?: () => void;
};

export function useMorsePlayer(opts: Options) {
  const [state, setState] = useState<PlayerState>("idle");
  const [lamp, setLamp] = useState(false);
  const [activeChar, setActiveChar] = useState(-1);
  const [pulseKind, setPulseKind] = useState<"dit" | "dah">("dit");
  const [pulseIndex, setPulseIndex] = useState(0);
  const [beatIndex, setBeatIndex] = useState(-1);
  const [audioError, setAudioError] = useState(false);
  const stateRef = useRef<PlayerState>("idle");
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const clockRef = useRef<{
    ac: AudioContext | null;
    start: number;
    offset: number;
  }>({ ac: null, start: 0, offset: 0 });
  const offsetRef = useRef(0);
  const generationRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const repeatRef = useRef<number | null>(null);
  const audioRef = useRef<RaveAudio | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const playheadRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const elapsedRef = useRef(0);
  const tickRef = useRef<() => void>(() => {});
  const beginRef = useRef<(offset: number) => Promise<void>>(async () => {});
  const pulseMap = useMemo(
    () =>
      new Map(opts.segments.filter((s) => s.on).map((s, i) => [s.start, i])),
    [opts.segments],
  );
  const pulseMapRef = useRef(pulseMap);
  pulseMapRef.current = pulseMap;
  const tripRef = useRef(0);

  const setTrip = useCallback((trip: number) => {
    if (Math.abs(trip - tripRef.current) < 0.01 && trip !== 0) return;
    if (trip === tripRef.current) return;
    tripRef.current = trip;
    audioRef.current?.setTrip(trip);
  }, []);

  const changeState = useCallback((next: PlayerState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const clearTimers = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (repeatRef.current !== null) window.clearTimeout(repeatRef.current);
    rafRef.current = null;
    repeatRef.current = null;
  }, []);

  const stopAudio = useCallback(() => {
    audioRef.current?.stop();
    audioRef.current = null;
    analyserRef.current = null;
  }, []);

  const quietLights = useCallback(() => {
    setLamp(false);
    setBeatIndex(-1);
    stageRef.current?.style.setProperty("--kick", "0");
  }, []);

  const resetProgress = useCallback(() => {
    if (playheadRef.current)
      playheadRef.current.style.transform = "translateX(0%)";
    if (progressRef.current) progressRef.current.style.transform = "scaleX(0)";
  }, []);

  const nowElapsed = useCallback(() => {
    const clock = clockRef.current;
    if (!Number.isFinite(clock.start)) return clock.offset;
    const now = clock.ac ? clock.ac.currentTime : performance.now() / 1000;
    return Math.max(0, clock.offset + (now - clock.start) * 1000);
  }, []);

  const tick = useCallback(() => {
    if (stateRef.current !== "playing") return;
    const o = optsRef.current;
    const elapsed = nowElapsed();
    elapsedRef.current = elapsed;
    const percent =
      o.total > 0 ? Math.max(0, Math.min(elapsed / o.total, 1)) : 0;
    if (playheadRef.current)
      playheadRef.current.style.transform = `translateX(${percent * 100}%)`;
    if (progressRef.current)
      progressRef.current.style.transform = `scaleX(${percent})`;
    const clock = clockRef.current;
    const started =
      (clock.ac ? clock.ac.currentTime : performance.now() / 1000) >=
      clock.start;
    const segment = started ? segmentAt(o.segments, elapsed) : null;
    setLamp(!!segment?.on);
    setActiveChar(started ? charIndexAt(o.segments, elapsed) : -1);
    if (segment?.on) {
      setPulseKind(segment.kind === "dah" ? "dah" : "dit");
      setPulseIndex(pulseMapRef.current.get(segment.start) ?? 0);
    }
    const beat = elapsed / (60000 / o.bpm);
    setBeatIndex(started ? Math.floor(beat) % 4 : -1);
    const kick = started && o.beatOn ? (1 - (beat % 1)) ** 4 : 0;
    stageRef.current?.style.setProperty("--kick", kick.toFixed(3));

    if (elapsed >= o.total) {
      stopAudio();
      clearTimers();
      quietLights();
      setActiveChar(-1);
      offsetRef.current = 0;
      elapsedRef.current = 0;
      if (o.loop) {
        repeatRef.current = window.setTimeout(() => {
          if (stateRef.current === "playing" && optsRef.current.loop)
            void beginRef.current(0);
          else if (stateRef.current === "playing") changeState("done");
        }, 60000 / o.bpm);
      } else changeState("done");
      return;
    }
    rafRef.current = requestAnimationFrame(() => tickRef.current());
  }, [changeState, clearTimers, nowElapsed, quietLights, stopAudio]);
  tickRef.current = tick;

  const begin = useCallback(
    async (offset: number) => {
      const o = optsRef.current;
      if (!o.total) return;
      const token = ++generationRef.current;
      clearTimers();
      stopAudio();
      clockRef.current = { ac: null, start: Infinity, offset };
      changeState("playing");
      setAudioError(false);
      let ac: AudioContext | null = null;
      try {
        ac = getAudioContext();
        if (ac.state === "suspended") await ac.resume();
      } catch {
        setAudioError(true);
        ac = null;
      }
      if (generationRef.current !== token) return;
      const start = (ac ? ac.currentTime : performance.now() / 1000) + 0.07;
      clockRef.current = { ac, start, offset };
      offsetRef.current = offset;
      if (ac) {
        try {
          setMasterVolume(optsRef.current.volume);
          const engine = new RaveAudio(
            ac,
            optsRef.current,
            o.segments,
            o.total,
          );
          audioRef.current = engine;
          analyserRef.current = engine.analyser;
          engine.setTrip(tripRef.current, true);
          engine.start(offset, start);
        } catch {
          stopAudio();
          setAudioError(true);
        }
      }
      rafRef.current = requestAnimationFrame(() => tickRef.current());
    },
    [changeState, clearTimers, stopAudio],
  );
  beginRef.current = begin;

  const play = useCallback(() => {
    const offset = stateRef.current === "paused" ? offsetRef.current : 0;
    void begin(offset);
  }, [begin]);

  const pause = useCallback(() => {
    if (stateRef.current !== "playing") return;
    generationRef.current++;
    offsetRef.current =
      repeatRef.current !== null
        ? 0
        : Math.min(nowElapsed(), optsRef.current.total);
    clearTimers();
    stopAudio();
    quietLights();
    changeState("paused");
  }, [changeState, clearTimers, nowElapsed, quietLights, stopAudio]);

  const stop = useCallback(() => {
    generationRef.current++;
    clearTimers();
    stopAudio();
    quietLights();
    resetProgress();
    offsetRef.current = 0;
    elapsedRef.current = 0;
    setActiveChar(-1);
    setPulseIndex(0);
    changeState("idle");
  }, [changeState, clearTimers, quietLights, resetProgress, stopAudio]);

  useEffect(() => {
    stop();
  }, [opts.segments, opts.total, opts.bpm, stop]);
  useEffect(() => {
    setMasterVolume(opts.volume);
  }, [opts.volume]);
  useEffect(() => {
    audioRef.current?.update(optsRef.current);
  }, [opts.profile, opts.toneHz, opts.soundOn, opts.beatOn, opts.badTrip]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        stop();
        optsRef.current.onStop?.();
        return;
      }
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey)
        return;
      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          "textarea, input, select, button, a, [contenteditable='true']",
        )
      )
        return;
      if (event.code === "Space") {
        event.preventDefault();
        if (stateRef.current === "playing") pause();
        else optsRef.current.onRequestPlay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pause, stop]);

  useEffect(
    () => () => {
      generationRef.current++;
      clearTimers();
      stopAudio();
    },
    [clearTimers, stopAudio],
  );

  return {
    state,
    lamp,
    activeChar,
    pulseKind,
    pulseIndex,
    beatIndex,
    audioError,
    play,
    pause,
    stop,
    setTrip,
    playheadRef,
    progressRef,
    stageRef,
    elapsedRef,
    analyserRef,
  };
}
