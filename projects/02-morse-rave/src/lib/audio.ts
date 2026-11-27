let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let masterVolume = 0.35;

/** A single shared AudioContext for beeps + the straight key. */
export function getAudioContext(): AudioContext {
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  try {
    getAudioContext();
  } catch {
    /* no audio available */
  }
}

/** Shared output bus for the transmitter and straight key. */
export function getMaster(): GainNode {
  const ac = getAudioContext();
  if (!master) {
    master = ac.createGain();
    master.gain.value = masterVolume;
    const limiter = ac.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.knee.value = 12;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.15;
    master.connect(limiter);
    limiter.connect(ac.destination);
  }
  return master;
}

export function setMasterVolume(v: number) {
  masterVolume = Math.max(0, Math.min(1, v));
  if (!master) return;
  master.gain.setTargetAtTime(
    masterVolume,
    getAudioContext().currentTime,
    0.015,
  );
}

export function hasMaster() {
  return !!master;
}

export type Tone = { osc: OscillatorNode; gain: GainNode };

/** Start a hand-held key tone. Returns a handle you must stop later. */
export function startTone(
  dest: AudioNode,
  freq: number,
  vol: number,
  waveform: OscillatorType = "triangle",
): Tone | null {
  try {
    const ac = getAudioContext();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const t = ac.currentTime;
    osc.type = waveform;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.006);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    return { osc, gain };
  } catch {
    return null;
  }
}

/** Stop a tone with a short anti-click fade. */
export function stopTone(tone: Tone | null) {
  if (!tone) return;
  try {
    const ac = getAudioContext();
    const t = ac.currentTime;
    tone.gain.gain.cancelScheduledValues(t);
    tone.gain.gain.setValueAtTime(tone.gain.gain.value, t);
    tone.gain.gain.linearRampToValueAtTime(0.0001, t + 0.015);
    tone.osc.stop(t + 0.03);
    tone.osc.onended = () => {
      try {
        tone.osc.disconnect();
        tone.gain.disconnect();
      } catch {
        /* ignore */
      }
    };
  } catch {
    /* ignore */
  }
}
