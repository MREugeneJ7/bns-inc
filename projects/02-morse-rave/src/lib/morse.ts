export const MORSE: Record<string, string> = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "'": ".----.",
  "!": "-.-.--",
  "/": "-..-.",
  "(": "-.--.",
  ")": "-.--.-",
  "&": ".-...",
  ":": "---...",
  ";": "-.-.-.",
  "=": "-...-",
  "+": ".-.-.",
  "-": "-....-",
  _: "..--.-",
  '"': ".-..-.",
  $: "...-..-",
  "@": ".--.-.",
  "*": "-..-",
  "#": "....-..",
  "%": "-..-.",
};

export const REVERSE: Record<string, string> = Object.entries(MORSE).reduce(
  (acc, [letter, code]) => {
    if (!(code in acc)) acc[code] = letter;
    return acc;
  },
  {} as Record<string, string>,
);

/** A character that made it onto the wire. */
export type MorseChar = {
  /** index among transmitted characters (ignores spaces) */
  index: number;
  char: string;
  code: string;
  word: number;
};

export function parseText(text: string): MorseChar[] {
  const words = text.toUpperCase().split(/\s+/).filter(Boolean);
  const out: MorseChar[] = [];
  let i = 0;
  words.forEach((word, wi) => {
    for (const raw of Array.from(word)) {
      const code = MORSE[raw];
      if (!code) continue;
      out.push({ index: i++, char: raw, code, word: wi });
    }
  });
  return out;
}

export type Segment = {
  /** ms from the start of the transmission */
  start: number;
  /** ms length */
  dur: number;
  on: boolean;
  /** which transmitted character this belongs to (-1 for gaps) */
  charIndex: number;
  kind: "dit" | "dah" | "gap" | "break";
};

export type Timeline = {
  segments: Segment[];
  onSegments: Segment[];
  total: number;
  chars: MorseChar[];
  dits: number;
  dahs: number;
  words: number;
};

/**
 * Build the transmission timeline.
 * unit = duration of one dit (ms). gapScale multiplies silence between
 * characters / words (Farnsworth style spacing).
 */
export function buildTimeline(
  text: string,
  unit: number,
  gapScale = 1,
): Timeline {
  const chars = parseText(text);
  const segments: Segment[] = [];
  let cursor = 0;
  let dits = 0;
  let dahs = 0;

  chars.forEach((mc, ci) => {
    const symbols = mc.code.split("") as ("." | "-")[];
    symbols.forEach((sym, si) => {
      const len = sym === "." ? unit : unit * 3;
      if (sym === ".") dits++;
      else dahs++;
      segments.push({
        start: cursor,
        dur: len,
        on: true,
        charIndex: ci,
        kind: sym === "." ? "dit" : "dah",
      });
      cursor += len;
      if (si < symbols.length - 1) {
        const gap = unit;
        segments.push({
          start: cursor,
          dur: gap,
          on: false,
          charIndex: ci,
          kind: "gap",
        });
        cursor += gap;
      }
    });

    const next = chars[ci + 1];
    if (next) {
      const gap = unit * (next.word === mc.word ? 3 : 7) * gapScale;
      segments.push({
        start: cursor,
        dur: gap,
        on: false,
        charIndex: -1,
        kind: "break",
      });
      cursor += gap;
    }
  });

  return {
    segments,
    onSegments: segments.filter((s) => s.on),
    total: cursor,
    chars,
    dits,
    dahs,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
  };
}

/** "HELLO WORLD" -> ".... . .-.. .-.. --- / .-- --- .-. .-.. -.." */
export function toMorseText(text: string): string {
  const words = text.toUpperCase().split(/\s+/).filter(Boolean);
  return words
    .map((w) =>
      Array.from(w)
        .map((c) => MORSE[c] ?? "")
        .filter(Boolean)
        .join(" "),
    )
    .filter(Boolean)
    .join(" / ");
}

export function decodeMorse(code: string): string {
  return code
    .trim()
    .split(/\s*\/\s*|\s{3,}/)
    .map((w) =>
      w
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((c) => REVERSE[c] ?? "?")
        .join(""),
    )
    .join(" ");
}

/**
 * Which character "owns" the wire at `ms`; silence inside a letter still
 * belongs to that letter, so highlighting stays steady.
 */
export function charIndexAt(segments: Segment[], ms: number): number {
  if (!segments.length || ms < 0) return -1;
  let lo = 0;
  let hi = segments.length - 1;
  let best = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (segments[mid].start <= ms) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best === -1 ? -1 : segments[best].charIndex;
}

/** Binary search for the segment playing at `ms`. */
export function segmentAt(segments: Segment[], ms: number): Segment | null {
  if (!segments.length || ms < 0) return null;
  let lo = 0;
  let hi = segments.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const s = segments[mid];
    if (ms < s.start) hi = mid - 1;
    else if (ms >= s.start + s.dur) lo = mid + 1;
    else return s;
  }
  return null;
}
