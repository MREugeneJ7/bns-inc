export type GameStatus = "ready" | "playing" | "paused" | "over" | "offer";

export type SoundName =
  | "start"
  | "flap"
  | "paddle"
  | "crack"
  | "break"
  | "bomb"
  | "steel"
  | "power"
  | "wave"
  | "shield"
  | "boss"
  | "orb"
  | "phase"
  | "lose";

export type PowerKind = "expand" | "slow" | "multi" | "breaker" | "shield";

export type BrickType = "clay" | "coral" | "lime" | "gold" | "steel" | "bomb";

export type Side = "left" | "right";

export type MetaUpgradeId =
  | "lift"
  | "paddle"
  | "chips"
  | "shield"
  | "lives"
  | "slowStart"
  | "score"
  | "revive"
  | "capsule"
  | "combo";

export type PerkId =
  | "flap"
  | "wide"
  | "slow"
  | "gravity"
  | "score"
  | "luck"
  | "combo"
  | "waveShield"
  | "waveBreaker"
  | "magnet"
  | "spare";

export type MetaState = {
  chips: number;
  lifetimeChips: number;
  runs: number;
  bestWave: number;
  bestScore: number;
  bosses: number;
  stars: number;
  levels: Partial<Record<MetaUpgradeId, number>>;
};

export type MetaUpgrade = {
  id: MetaUpgradeId;
  name: string;
  desc: string;
  max: number;
  base: number;
};

export type Perk = {
  id: PerkId;
  name: string;
  desc: string;
  max: number;
};

export type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

export type Brick = {
  nx: number;
  ny: number;
  nw: number;
  nh: number;
  type: BrickType;
  hp: number;
  maxHp: number;
  alive: boolean;
  cooldown: number;
  flash: number;
};

export type BossCell = {
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  cooldown: number;
  flash: number;
  steel: boolean;
};

export type Boss = {
  name: string;
  index: number;
  cx: number;
  cy: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  phase: number;
  t: number;
  fireTimer: number;
  debrisTimer: number;
  hitFlash: number;
  defeated: boolean;
  cells: BossCell[];
  emitted: number;
};

export type Hazard = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  spin: number;
  kind: "orb" | "debris";
};

export type Capsule = {
  kind: PowerKind;
  x: number;
  y: number;
  vy: number;
  phase: number;
  life: number;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
};

export type Shard = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  life: number;
  maxLife: number;
  color: string;
};

export type Floater = {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};

export type TrailPoint = { x: number; y: number; life: number };

export type Banner = { title: string; sub: string; life: number; maxLife: number };

export type Game = {
  width: number;
  height: number;
  ball: Ball;
  leftY: number;
  rightY: number;
  leftTarget: number;
  rightTarget: number;
  paddleDrawH: number;
  score: number;
  wave: number;
  crossings: number;
  combo: number;
  comboTimer: number;
  stall: number;
  hitSinceCrossing: boolean;
  time: number;
  trailTimer: number;
  lastPaddle: Side;
  savedDir: number;
  intermission: number;
  grace: number;
  clearing: boolean;
  pendingOffer: boolean;
  offer: PerkId[] | null;
  expandTimer: number;
  slowTimer: number;
  multiTimer: number;
  breakerTimer: number;
  shields: number;
  lives: number;
  reviveUsed: boolean;
  perks: Partial<Record<PerkId, number>>;
  metaLevels: Partial<Record<MetaUpgradeId, number>>;
  stars: number;
  bossesDown: number;
  bricks: Brick[];
  boss: Boss | null;
  hazards: Hazard[];
  capsules: Capsule[];
  particles: Particle[];
  shards: Shard[];
  floaters: Floater[];
  trail: TrailPoint[];
  flash: { side: Side; life: number } | null;
  shake: number;
  banner: Banner | null;
  soundAt: Partial<Record<SoundName, number>>;
  salt: number;
};

export type GameEvent =
  | { type: "score"; score: number; left: number }
  | { type: "wave"; wave: number; left: number; boss: boolean }
  | { type: "combo"; combo: number }
  | { type: "offer"; choices: PerkId[]; from: "wall" | "boss" }
  | { type: "bossStart"; name: string; hp: number; maxHp: number; phase: number }
  | { type: "boss"; name: string; hp: number; maxHp: number; phase: number }
  | { type: "bossEnd"; name: string }
  | { type: "die" }
  | { type: "sound"; name: SoundName };

export const BRICK_POINTS: Record<BrickType, number> = {
  clay: 10,
  coral: 25,
  lime: 40,
  gold: 75,
  steel: 0,
  bomb: 35,
};

export const POWER_COLOR: Record<PowerKind, string> = {
  expand: "#d9f47a",
  slow: "#f3e0c4",
  multi: "#f2c14e",
  breaker: "#ff7455",
  shield: "#f7f4ea",
};

export const POWER_NAME: Record<PowerKind, string> = {
  expand: "EXPAND",
  slow: "SLOW",
  multi: "x2",
  breaker: "BREAK",
  shield: "SHIELD",
};

export const POWER_MARK: Record<PowerKind, string> = {
  expand: "E",
  slow: "S",
  multi: "x2",
  breaker: "B",
  shield: "+",
};

export const WAVE_COPY = [
  "SMASH A PATH",
  "THREAD THE GAPS",
  "BREAK THE PYRAMID",
  "CRACK THE TOUGH ONES",
  "TAKE THE GOLD",
  "STEEL DOESN'T BREAK",
  "A CLASSIC WALL",
  "NOTHING IS SAFE",
];

export const BOSS_NAMES = [
  "THE GATEKEEPER",
  "CRICKET MASTER",
  "THE VAULT DOOR",
  "NEON IDOL",
  "THE OVERCLOCKER",
  "CABINET GHOST",
  "JOYSTICK KING",
];

export const META_UPGRADES: MetaUpgrade[] = [
  { id: "lift", name: "Flap Lift", desc: "Flaps hit harder", max: 5, base: 150 },
  { id: "paddle", name: "Paddle Plating", desc: "Bigger paddles", max: 5, base: 180 },
  { id: "slowStart", name: "Heavy Ball", desc: "Slower launch", max: 3, base: 220 },
  { id: "score", name: "Arcade Memory", desc: "Score multiplier", max: 5, base: 300 },
  { id: "chips", name: "Coin Slot", desc: "More chips earned", max: 5, base: 120 },
  { id: "combo", name: "Combo Meter", desc: "Longer combo window", max: 2, base: 260 },
  { id: "capsule", name: "Capsule Cache", desc: "Start with a power", max: 3, base: 350 },
  { id: "shield", name: "Auto Shield", desc: "Shield charges", max: 3, base: 400 },
  { id: "lives", name: "Spare Ball", desc: "Extra life", max: 2, base: 700 },
  { id: "revive", name: "Rally Card", desc: "One revive per run", max: 1, base: 900 },
];

export const PERKS: Perk[] = [
  { id: "flap", name: "Rocket Ballast", desc: "+12% flap lift", max: 3 },
  { id: "wide", name: "Wide Nets", desc: "+10% paddle height", max: 3 },
  { id: "slow", name: "Heavy Ball", desc: "-7% ball speed", max: 3 },
  { id: "gravity", name: "Low Gravity", desc: "-12% gravity", max: 3 },
  { id: "score", name: "Arcade Blood", desc: "+25% score", max: 3 },
  { id: "luck", name: "Lucky Charm", desc: "+50% capsule drops", max: 2 },
  { id: "combo", name: "Combo Meter", desc: "+40% combo window", max: 2 },
  { id: "waveShield", name: "Wave Ward", desc: "Shield each wave", max: 2 },
  { id: "waveBreaker", name: "Crack Ball", desc: "Breaker each wave", max: 1 },
  { id: "magnet", name: "Chip Magnet", desc: "+15% chips", max: 3 },
  { id: "spare", name: "Spare Ball", desc: "+1 life", max: 2 },
];

export const PERK_BY_ID: Record<PerkId, Perk> = PERKS.reduce(
  (map, perk) => ({ ...map, [perk.id]: perk }),
  {} as Record<PerkId, Perk>,
);
