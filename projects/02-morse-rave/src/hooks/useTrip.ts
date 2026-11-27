import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { levelFor } from "../lib/trip";

type Options = {
  playing: boolean;
  paused: boolean;
  loop: boolean;
  escalate: boolean;
  seconds: number;
  soft: boolean;
  rootRef: RefObject<HTMLElement | null>;
  onTrip: (trip: number, visual: number) => void;
};

function initialTrip() {
  // Easter egg / shortcut: ?trip=0.9 skips the line.
  const value = Number(new URLSearchParams(window.location.search).get("trip"));
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

/**
 * The trip rises while a message is looping, holds while paused or playing
 * once, and gently comes back down when the music stops.
 */
export function useTrip(options: Options) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const tripRef = useRef(initialTrip());
  const comingDownRef = useRef(false);
  // A ?trip= shortcut waits for the first play instead of fading on load.
  const seededRef = useRef(tripRef.current > 0);
  const [level, setLevel] = useState(() => levelFor(tripRef.current));
  const [comingDown, setComingDown] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let last = performance.now();
    let lastVisual = -1;
    let lastMeter = -1;
    let lastTrip = -1;

    const step = (now: number) => {
      // Real time, so the trip progresses correctly even at low frame rates;
      // capped so returning to a background tab doesn't jump.
      const dt = Math.min(500, now - last);
      last = now;
      const o = optionsRef.current;
      let trip = tripRef.current;
      const rising = o.playing && o.loop && o.escalate && !comingDownRef.current;
      if (o.playing) seededRef.current = false;
      const holding =
        seededRef.current ||
        (!rising && !comingDownRef.current && o.escalate && (o.paused || o.playing));

      if (rising) trip = Math.min(1, trip + dt / (o.seconds * 1000));
      else if (!holding)
        trip = Math.max(0, trip - dt / (comingDownRef.current ? 2500 : 1800));

      if (comingDownRef.current && trip === 0) {
        comingDownRef.current = false;
        setComingDown(false);
      }
      tripRef.current = trip;

      // Quantized: CSS only hears about the trip in small steps, which keeps
      // style recalculation and repaints rare while the motion stays smooth.
      const visual =
        Math.round(trip * (o.soft ? 0.45 : 1) * (reduced.matches ? 0.35 : 1) * 100) / 100;
      const meter = Math.round(trip * 200) / 200;
      const root = o.rootRef.current;
      if (meter !== lastMeter) {
        lastMeter = meter;
        root?.style.setProperty("--trip", String(meter));
        setLevel(levelFor(trip));
      }
      if (visual !== lastVisual) {
        lastVisual = visual;
        root?.style.setProperty("--tv", String(visual));
      }
      if (Math.abs(trip - lastTrip) >= 0.005 || (trip === 0 && lastTrip !== 0)) {
        lastTrip = trip;
        o.onTrip(trip, visual);
      }
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

  const comeDown = useCallback(() => {
    if (tripRef.current <= 0) return;
    comingDownRef.current = true;
    setComingDown(true);
  }, []);

  return { level, comingDown, comeDown, tripRef };
}
