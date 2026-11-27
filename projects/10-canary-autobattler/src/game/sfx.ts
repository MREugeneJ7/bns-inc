let ctx: AudioContext | null = null;
export let muted = false;
export const setMuted = (m: boolean) => { muted = m; };

function ac(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

function tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.05, delay = 0, slide?: number) {
  const c = ac(); if (!c || muted) return;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, c.currentTime + delay);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, c.currentTime + delay + dur);
  g.gain.setValueAtTime(vol, c.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + delay + dur);
  o.connect(g); g.connect(c.destination);
  o.start(c.currentTime + delay); o.stop(c.currentTime + delay + dur + 0.02);
}

export type Sfx =
  | 'text' | 'talk' | 'bump' | 'open' | 'back' | 'fanfare'
  | 'hit' | 'play' | 'win' | 'lose' | 'heal' | 'parranda'
  | 'bell' | 'motor' | 'vomit' | 'bucio' | 'isa' | 'squelch';

// Compas 3/4 de Isa Canaria tradicional (timple + bajo de guitarra en Sol mayor / Re7)
const ISA_MELODY: readonly [number, number][] = [
  [392.00, 196.00], [493.88, 293.66], [587.33, 293.66],
  [659.25, 196.00], [587.33, 293.66], [493.88, 293.66],
  [587.33, 146.83], [523.25, 220.00], [440.00, 220.00],
  [392.00, 196.00], [493.88, 293.66], [587.33, 293.66],
  [783.99, 196.00], [659.25, 293.66], [587.33, 293.66],
  [523.25, 146.83], [493.88, 220.00], [440.00, 220.00],
  [587.33, 146.83], [659.25, 220.00], [523.25, 220.00],
  [392.00, 196.00], [587.33, 293.66], [783.99, 196.00],
];

export function playIsaBeat(stepIndex: number) {
  const [mel, bass] = ISA_MELODY[Math.abs(stepIndex) % ISA_MELODY.length];
  const isDownbeat = stepIndex % 3 === 0;
  tone(mel, 0.14, 'square', 0.055, 0);
  tone(bass, isDownbeat ? 0.16 : 0.09, 'triangle', isDownbeat ? 0.06 : 0.04, 0);
}

export function beep(k: Sfx) {
  switch (k) {
    case 'text': tone(880, 0.03, 'square', 0.02); break;
    case 'talk': tone(660, 0.06, 'square', 0.05, 0, 990); break;
    case 'squelch': tone(152, .12, 'triangle', .05, 0, 62); tone(280, .06, 'sine', .03, .1, 95); break;
    case 'bump': tone(120, 0.08, 'square', 0.04); break;
    case 'open': tone(523, 0.08, 'square', 0.05); tone(784, 0.1, 'square', 0.05, 0.08); break;
    case 'back': tone(392, 0.08, 'square', 0.04, 0, 262); break;
    case 'play': tone(440, 0.05, 'triangle', 0.06); tone(660, 0.08, 'triangle', 0.06, 0.05); break;
    case 'hit': tone(200, 0.12, 'sawtooth', 0.07, 0, 60); break;
    case 'heal': tone(523, 0.08, 'sine', 0.06); tone(659, 0.08, 'sine', 0.06, 0.08); tone(784, 0.12, 'sine', 0.06, 0.16); break;
    case 'fanfare': [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.14, 'square', 0.06, i * 0.1)); break;
    case 'parranda':
      tone(493.88, 0.14, 'square', 0.06, 0.00);
      tone(493.88, 0.14, 'square', 0.06, 0.16);
      tone(493.88, 0.14, 'square', 0.06, 0.32);
      tone(415.30, 0.16, 'square', 0.06, 0.48);
      tone(659.25, 0.34, 'square', 0.07, 0.66);
      break;
    case 'bell':
      // Timbre del recreo al colarte en un colegio
      [0, 0.06, 0.12, 0.18].forEach((d) => tone(1320, 0.045, 'square', 0.04, d, 1480));
      break;
    case 'motor':
      // Fueraborda 2 tiempos del cayuco a "120dB" (petardeo grave)
      tone(82 + Math.random() * 18, 0.11, 'sawtooth', 0.075, 0, 62);
      tone(145, 0.05, 'square', 0.045, 0.04, 95);
      break;
    case 'vomit':
      // Potada comica 8-bit en el muelle
      tone(310, 0.18, 'sawtooth', 0.07, 0, 110);
      tone(240, 0.28, 'sawtooth', 0.08, 0.16, 68);
      tone(130, 0.22, 'square', 0.05, 0.42, 55);
      break;
    case 'bucio':
      // Bramido grave y resonante de caracola marina (bucio canario)
      tone(165, 0.28, 'sawtooth', 0.07, 0.00, 220);
      tone(220, 0.55, 'triangle', 0.08, 0.22, 208);
      tone(110, 0.65, 'sine', 0.06, 0.12, 104);
      break;
    case 'isa':
      // Rasgueo alegre de timple abriendo la Isa Canaria
      [392, 493.88, 587.33, 783.99, 659.25, 783.99].forEach((f, i) =>
        tone(f, 0.12, 'square', 0.055, i * 0.08)
      );
      break;
    case 'win': [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.18, 'square', 0.06, i * 0.09)); break;
    case 'lose': [392, 349, 311, 262].forEach((f, i) => tone(f, 0.25, 'square', 0.06, i * 0.2)); break;
  }
}
