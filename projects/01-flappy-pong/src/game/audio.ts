import type { SoundName } from "./types";

let context: AudioContext | null = null;

function tone(
  audio: AudioContext,
  frequency: number,
  duration: number,
  volume: number,
  delay = 0,
  type: OscillatorType = "sine",
) {
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const start = audio.currentTime + delay;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 1.16), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function noise(audio: AudioContext, duration: number, volume: number) {
  const length = Math.max(1, Math.floor(audio.sampleRate * duration));
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2;
  const source = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  filter.type = "highpass";
  filter.frequency.value = 700;
  gain.gain.value = volume;
  source.buffer = buffer;
  source.connect(filter).connect(gain).connect(audio.destination);
  source.start();
}

export function playSound(name: SoundName, enabled: boolean) {
  if (!enabled) return;
  try {
    const audio = context ?? new AudioContext();
    context = audio;
    if (audio.state === "suspended") void audio.resume();
    if (name === "flap") tone(audio, 430, 0.09, 0.045);
    if (name === "start") {
      tone(audio, 380, 0.1, 0.05);
      tone(audio, 560, 0.14, 0.04, 0.08);
    }
    if (name === "paddle") {
      tone(audio, 520, 0.09, 0.06);
      tone(audio, 780, 0.14, 0.04, 0.06);
    }
    if (name === "crack") tone(audio, 760, 0.07, 0.045, 0, "triangle");
    if (name === "break") {
      tone(audio, 540, 0.08, 0.05, 0, "triangle");
      tone(audio, 860, 0.11, 0.035, 0.04);
    }
    if (name === "bomb") {
      noise(audio, 0.18, 0.07);
      tone(audio, 180, 0.22, 0.06, 0, "sawtooth");
    }
    if (name === "steel") tone(audio, 150, 0.09, 0.045, 0, "square");
    if (name === "power") {
      tone(audio, 620, 0.08, 0.045);
      tone(audio, 830, 0.1, 0.04, 0.07);
      tone(audio, 1120, 0.14, 0.03, 0.14);
    }
    if (name === "wave") {
      tone(audio, 420, 0.1, 0.045);
      tone(audio, 560, 0.12, 0.04, 0.09);
      tone(audio, 740, 0.16, 0.035, 0.18);
    }
    if (name === "shield") {
      tone(audio, 300, 0.1, 0.05);
      tone(audio, 520, 0.16, 0.04, 0.08);
    }
    if (name === "lose") {
      tone(audio, 340, 0.16, 0.06);
      tone(audio, 210, 0.32, 0.05, 0.12);
    }
  } catch {
    // Gameplay continues if this browser blocks Web Audio.
  }
}

export function closeAudio() {
  void context?.close();
  context = null;
}
