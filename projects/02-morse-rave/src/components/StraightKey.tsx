import { useCallback, useEffect, useRef, useState } from "react";
import { getMaster, startTone, stopTone, type Tone } from "../lib/audio";
import { REVERSE } from "../lib/morse";
import type { SoundProfile } from "../lib/rave";
import { cn } from "../utils/cn";
import { Btn } from "./Controls";
import { Icon } from "./Icon";

export function StraightKey({
  unit,
  toneHz,
  profile,
  soundOn,
  onSend,
}: {
  unit: number;
  toneHz: number;
  profile: SoundProfile;
  soundOn: boolean;
  onSend: (text: string) => void;
}) {
  const [pressed, setPressed] = useState(false);
  const [buffer, setBuffer] = useState("");
  const [output, setOutput] = useState("");
  const toneRef = useRef<Tone | null>(null);
  const pressedRef = useRef(false);
  const downRef = useRef(0);
  const lastRef = useRef(0);
  const bufferRef = useRef("");
  const outputRef = useRef("");
  const settingsRef = useRef({ unit, toneHz, profile, soundOn });
  settingsRef.current = { unit, toneHz, profile, soundOn };

  const keyDown = useCallback(() => {
    if (pressedRef.current) return;
    pressedRef.current = true;
    downRef.current = performance.now();
    lastRef.current = downRef.current;
    setPressed(true);
    const settings = settingsRef.current;
    if (!settings.soundOn) return;
    try {
      const waveform =
        settings.profile === "warehouse"
          ? "square"
          : settings.profile === "acid"
            ? "sawtooth"
            : "triangle";
      toneRef.current = startTone(getMaster(), settings.toneHz, 0.2, waveform);
    } catch {
      /* The key still works without audio. */
    }
  }, []);

  const keyUp = useCallback(() => {
    if (!pressedRef.current) return;
    pressedRef.current = false;
    stopTone(toneRef.current);
    toneRef.current = null;
    const duration = performance.now() - downRef.current;
    bufferRef.current = (
      bufferRef.current + (duration < settingsRef.current.unit * 2 ? "." : "-")
    ).slice(-8);
    setBuffer(bufferRef.current);
    lastRef.current = performance.now();
    setPressed(false);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (pressedRef.current || !lastRef.current) return;
      const idle = performance.now() - lastRef.current;
      const currentUnit = settingsRef.current.unit;
      if (bufferRef.current && idle > currentUnit * 3) {
        outputRef.current = (
          outputRef.current + (REVERSE[bufferRef.current] ?? "?")
        ).slice(-120);
        bufferRef.current = "";
        setBuffer("");
        setOutput(outputRef.current);
      }
      if (
        !bufferRef.current &&
        idle > currentUnit * 7 &&
        outputRef.current &&
        !outputRef.current.endsWith(" ")
      ) {
        outputRef.current += " ";
        setOutput(outputRef.current);
      }
    }, 30);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") keyUp();
    };
    window.addEventListener("pointerup", keyUp);
    window.addEventListener("pointercancel", keyUp);
    window.addEventListener("blur", keyUp);
    window.addEventListener("keydown", escape);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pointerup", keyUp);
      window.removeEventListener("pointercancel", keyUp);
      window.removeEventListener("blur", keyUp);
      window.removeEventListener("keydown", escape);
      stopTone(toneRef.current);
    };
  }, [keyUp]);

  useEffect(() => {
    if (!soundOn) {
      stopTone(toneRef.current);
      toneRef.current = null;
    }
  }, [soundOn]);

  const clear = () => {
    keyUp();
    bufferRef.current = "";
    outputRef.current = "";
    lastRef.current = 0;
    setOutput("");
    setBuffer("");
  };

  return (
    <section className="straight-key">
      <div className="straight-key-heading">
        <h3 className="micro-label">THE STRAIGHT KEY</h3>
        <span>1 DIT = {Math.round(unit)} MS</span>
      </div>
      <button
        type="button"
        className={cn("key-pad", pressed && "is-pressed")}
        aria-label="Hold to key a Morse signal"
        aria-pressed={pressed}
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          keyDown();
        }}
        onPointerUp={keyUp}
        onLostPointerCapture={keyUp}
        onKeyDown={(event) => {
          if (event.code === "Space" || event.code === "Enter") {
            event.preventDefault();
            keyDown();
          }
        }}
        onKeyUp={(event) => {
          if (event.code === "Space" || event.code === "Enter") {
            event.preventDefault();
            keyUp();
          }
        }}
        onBlur={keyUp}
      >
        <Icon name="bolt" size={18} />
        <span>{pressed ? "On the air" : "Hold to key your own"}</span>
        <span>{buffer}</span>
      </button>
      <p className="key-output" aria-live="polite">
        {output}
      </p>
      <div className="key-actions">
        <Btn
          variant="primary"
          disabled={!output.trim()}
          onClick={() => onSend(output.trim())}
        >
          Add to message
          <Icon name="arrow" size={13} />
        </Btn>
        <Btn onClick={clear}>Clear</Btn>
      </div>
    </section>
  );
}
