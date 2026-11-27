export type PhobiaKind = "spider" | "clown" | "blood";
export type BadTripReason = "words" | "chance" | null;

export const PHOBIAS: readonly PhobiaKind[] = ["spider", "clown", "blood"];

export const BAD_TRIP_PALETTE = {
  colors: ["#ff1736", "#5e1224"],
  rgb: ["255, 23, 54", "94, 18, 36"],
};

const BAD_WORDS = [
  // English
  "fuck",
  "fucker",
  "fucking",
  "fucked",
  "motherfucker",
  "shit",
  "shitty",
  "bullshit",
  "bitch",
  "bitches",
  "asshole",
  "bastard",
  "cunt",
  "dick",
  "dickhead",
  "cock",
  "cocksucker",
  "pussy",
  "whore",
  "slut",
  "piss",
  "crap",
  "douche",
  "douchebag",
  "wanker",
  "bollocks",
  "prick",
  "twat",
  "retard",
  "retarded",
  "faggot",
  "nigger",
  "nigga",
  // Spanish
  "puta",
  "putas",
  "puto",
  "putos",
  "putazo",
  "mierda",
  "mierdas",
  "cabron",
  "cabrones",
  "cabrona",
  "pendejo",
  "pendejos",
  "pendeja",
  "verga",
  "vergas",
  "chinga",
  "chingar",
  "chingada",
  "chingado",
  "chingatumadre",
  "joder",
  "jodido",
  "cono",
  "gilipollas",
  "culero",
  "culeros",
  "malparido",
  "malparida",
  "hijueputa",
  "hijodeputa",
  "gonorrea",
  "maricon",
  "marica",
  "zorra",
  "perra",
  "carajo",
  "pinche",
  "culiao",
  "weon",
  "huevon",
  "mamaguevo",
  "cojones",
  "hostia",
  "capullo",
];

const BAD_WORD_REGEX = new RegExp(`\\b(?:${BAD_WORDS.join("|")})\\b`, "i");

function normalizeForFilter(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/@/g, "a")
    .replace(/3/g, "e")
    .replace(/[1!]/g, "i")
    .replace(/0/g, "o")
    .replace(/[$5]/g, "s")
    .replace(/7/g, "t")
    .replace(/[^a-z0-9\s]+/g, " ");
}

export function containsBadWords(text: string): boolean {
  if (!text.trim()) return false;
  const normalized = normalizeForFilter(text);
  return BAD_WORD_REGEX.test(normalized);
}

export function isForcedBadTripQuery(): boolean {
  const value = new URLSearchParams(window.location.search).get("badtrip");
  return value === "1" || value === "true";
}

/** 1% random chance on drop (or forced via ?badtrip=1). */
export function rollBadTripChance(): boolean {
  if (isForcedBadTripQuery()) return true;
  return Math.random() < 0.01;
}
