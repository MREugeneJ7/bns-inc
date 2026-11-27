export type TripSpeed = "slow" | "clocks" | "instant";

export const TRIP_LEVELS = [
  {
    name: "Sober-ish",
    status: "On air. All energy.",
    line: "Everything is perfectly normal. For now.",
  },
  {
    name: "Tingly",
    status: "Is the bass... breathing?",
    line: "Colors are starting to wander off.",
  },
  {
    name: "Melting clocks",
    status: "The clocks are melting.",
    line: "Time is getting soft around the edges.",
  },
  {
    name: "Elephants on stilts",
    status: "Elephants on very long legs.",
    line: "The panels have opinions now.",
  },
  {
    name: "Soft Camembert",
    status: "Time is a soft cheese.",
    line: "A mustache has entered the chat.",
  },
  {
    name: "Full Dalí",
    status: "You are the Morse code now.",
    line: "Persistence of memory: achieved.",
  },
] as const;

/** Level boundaries on the 0..1 trip scale. */
export const TRIP_THRESHOLDS = [0.1, 0.28, 0.46, 0.64, 0.85];

export function levelFor(trip: number): number {
  let level = 0;
  for (const threshold of TRIP_THRESHOLDS) if (trip >= threshold) level++;
  return level;
}

export const TRIP_SPEEDS: {
  id: TripSpeed;
  name: string;
  seconds: number;
  detail: string;
}[] = [
  { id: "slow", name: "Slow melt", seconds: 180, detail: "3 MIN" },
  { id: "clocks", name: "Melting clocks", seconds: 90, detail: "90 SEC" },
  { id: "instant", name: "Instant Dalí", seconds: 30, detail: "30 SEC" },
];
