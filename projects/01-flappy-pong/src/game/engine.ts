import { brickRect, bricksLeft, spawnWave } from "./bricks";
import { collideBoss, hazardHitsBall, isBossWave, spawnBoss, updateBoss, updateHazards } from "./boss";
import { levelOf } from "./meta";
import { openOffer, perkStacks } from "./perks";
import type { Brick, Game, GameEvent, MetaState, PerkId, PowerKind, Side, SoundName } from "./types";
import { BOSS_NAMES, BRICK_POINTS, POWER_NAME, WAVE_COPY } from "./types";
import { PADDLE_WIDTH, ballRadius, clamp, courtEdges, paddleInset } from "./util";

const POWERS: PowerKind[] = ["expand", "slow", "multi", "breaker", "shield"];

function baseSpeed(width: number) {
  return clamp(width * 0.4, 168, 300);
}

export function isBoss(wave: number) {
  return isBossWave(wave);
}

export function bossTitle(index: number) {
  return BOSS_NAMES[(index - 1) % BOSS_NAMES.length] ?? `WARDEN ${String(index).padStart(2, "0")}`;
}

export function flapLift(game: Game) {
  return (1 + 0.07 * levelOfMeta(game, "lift")) * (1 + 0.12 * perkStacks(game.perks, "flap"));
}

export function paddleScale(game: Game) {
  return (1 + 0.06 * levelOfMeta(game, "paddle")) * (1 + 0.1 * perkStacks(game.perks, "wide"));
}

export function gravityScale(game: Game) {
  return 1 - 0.12 * perkStacks(game.perks, "gravity");
}

export function speedScale(game: Game) {
  return (1 - 0.08 * levelOfMeta(game, "slowStart")) * (1 - 0.07 * perkStacks(game.perks, "slow"));
}

export function scoreMult(game: Game) {
  return (1 + 0.08 * levelOfMeta(game, "score") + 0.05 * game.stars) * (1 + 0.25 * perkStacks(game.perks, "score"));
}

export function chipMult(game: Game) {
  return (1 + 0.15 * levelOfMeta(game, "chips")) * (1 + 0.15 * perkStacks(game.perks, "magnet")) * (1 + 0.12 * game.stars);
}

export function comboWindow(game: Game) {
  return 1.15 * (1 + 0.4 * levelOfMeta(game, "combo")) * (1 + 0.4 * perkStacks(game.perks, "combo"));
}

function levelOfMeta(game: Game, id: Parameters<typeof levelOf>[1]) {
  return levelOf({ levels: game.metaLevels } as MetaState, id);
}

export function rallySpeed(game: Game) {
  const scaled = baseSpeed(game.width) * (1 + Math.min(game.crossings, 16) * 0.028 + (game.wave - 1) * 0.05) * speedScale(game);
  const speed = Math.min(scaled, baseSpeed(game.width) * 1.68 * speedScale(game));
  return game.slowTimer > 0 ? speed * 0.68 : speed;
}

export function targetPaddleHeight(game: Game) {
  const base = clamp((game.height * 0.285 - Math.min(game.wave - 1, 7) * 5) * paddleScale(game), 88, game.height * 0.46);
  const pressured = base * clamp(1 - Math.max(0, game.stall - 2) * 0.08, 0.58, 1);
  return game.expandTimer > 0 ? Math.min(pressured * 1.4, game.height * 0.52) : pressured;
}

function multiplier(game: Game) {
  return game.multiTimer > 0 ? 2 : 1;
}

function applyScore(game: Game, base: number, noteScore: () => void) {
  game.score += Math.round(base * scoreMult(game) * multiplier(game));
  noteScore();
}

function hash(n: number) {
  const x = Math.sin(n * 91.7 + 19.2) * 24634.6345;
  return x - Math.floor(x);
}

export function createGame(width: number, height: number, meta: MetaState): Game {
  const radius = ballRadius(width);
  const y = height * 0.6;
  const game: Game = {
    width,
    height,
    ball: {
      x: paddleInset(width) + PADDLE_WIDTH + radius + 20,
      y,
      vx: baseSpeed(width) * speedScale({ stars: meta.stars, perks: {}, metaLevels: meta.levels } as Game),
      vy: 0,
      radius,
    },
    leftY: y,
    rightY: y - 18,
    leftTarget: y,
    rightTarget: y - 18,
    paddleDrawH: clamp(height * 0.285, 94, 166),
    score: 0,
    wave: 1,
    crossings: 0,
    combo: 0,
    comboTimer: 0,
    stall: 0,
    hitSinceCrossing: false,
    time: 0,
    trailTimer: 0,
    lastPaddle: "left",
    savedDir: 1,
    intermission: 0,
    grace: 0,
    clearing: false,
    pendingOffer: false,
    offer: null,
    expandTimer: 0,
    slowTimer: 0,
    multiTimer: 0,
    breakerTimer: 0,
    shields: levelOf(meta, "shield"),
    lives: levelOf(meta, "lives"),
    reviveUsed: false,
    perks: {},
    metaLevels: { ...meta.levels },
    stars: meta.stars,
    bossesDown: 0,
    bricks: [],
    boss: null,
    hazards: [],
    capsules: [],
    particles: [],
    shards: [],
    floaters: [],
    trail: [],
    flash: null,
    shake: 0,
    banner: null,
    soundAt: {},
    salt: 1,
  };
  game.paddleDrawH = targetPaddleHeight(game);
  spawnWave(game, 1);
  rescueBall(game);
  game.leftY = game.ball.y;
  game.leftTarget = game.ball.y;
  if (levelOf(meta, "capsule") > 0) {
    const kind = POWERS[Math.floor(Math.random() * POWERS.length)];
    grantPower(game, kind, 5 + levelOf(meta, "capsule"));
  }
  return game;
}

function grantPower(game: Game, kind: PowerKind, duration: number) {
  if (kind === "expand") game.expandTimer = duration;
  if (kind === "slow") {
    game.slowTimer = duration;
    game.ball.vx = Math.sign(game.ball.vx || game.savedDir || 1) * rallySpeed(game);
  }
  if (kind === "multi") game.multiTimer = duration;
  if (kind === "breaker") game.breakerTimer = duration;
  if (kind === "shield") game.shields = Math.min(3, game.shields + 1);
}

export function launch(game: Game) {
  game.ball.vy = -Math.max(280, game.height * 0.46) * flapLift(game) * 0.82;
  game.ball.vx = Math.abs(rallySpeed(game));
  game.savedDir = 1;
  game.grace = 0.35;
  game.shake = 2;
  for (const brick of game.bricks) brick.flash = 0.26;
  setBanner(game, "WAVE 01", WAVE_COPY[0], 1.35);
}

export function resizeGame(game: Game, width: number, height: number) {
  if (!width || !height || (width === game.width && height === game.height)) return;
  const scaleX = width / game.width;
  const scaleY = height / game.height;
  game.ball.x *= scaleX;
  game.ball.y *= scaleY;
  game.ball.vx *= scaleX;
  game.ball.vy *= scaleY;
  game.ball.radius = ballRadius(width);
  game.leftY *= scaleY;
  game.rightY *= scaleY;
  game.leftTarget *= scaleY;
  game.rightTarget *= scaleY;
  game.paddleDrawH *= scaleY;
  for (const item of [...game.capsules, ...game.particles, ...game.shards, ...game.floaters, ...game.trail]) {
    item.x *= scaleX;
    item.y *= scaleY;
  }
  for (const hazard of game.hazards) {
    hazard.x *= scaleX;
    hazard.y *= scaleY;
  }
  if (game.boss) resizeBoss(game.boss, scaleX, scaleY);
  game.width = width;
  game.height = height;
}

function resizeBoss(boss: NonNullable<Game["boss"]>, scaleX: number, scaleY: number) {
  boss.cx *= scaleX;
  boss.cy *= scaleY;
  boss.w *= scaleX;
  boss.h *= scaleY;
}

export function flap(game: Game) {
  game.ball.vy = -Math.max(330, game.height * 0.68 * flapLift(game));
  burst(game, game.ball.x, game.ball.y + game.ball.radius, "#fff0bd", 5);
}

export function step(game: Game, dt: number, playing: boolean): GameEvent[] {
  const events: GameEvent[] = [];
  game.time += dt;
  tickEffects(game, dt);
  if (!playing) return events;

  let scored = false;
  let comboChanged = false;
  const noteScore = () => {
    scored = true;
  };
  const noteCombo = () => {
    comboChanged = true;
  };

  for (const brick of game.bricks) {
    if (brick.cooldown > 0) brick.cooldown = Math.max(0, brick.cooldown - dt);
    if (brick.flash > 0) brick.flash = Math.max(0, brick.flash - dt);
  }
  const wasSlow = game.slowTimer > 0;
  game.expandTimer = Math.max(0, game.expandTimer - dt);
  game.slowTimer = Math.max(0, game.slowTimer - dt);
  game.multiTimer = Math.max(0, game.multiTimer - dt);
  game.breakerTimer = Math.max(0, game.breakerTimer - dt);
  game.grace = Math.max(0, game.grace - dt);
  if (game.comboTimer > 0) {
    game.comboTimer = Math.max(0, game.comboTimer - dt);
    if (game.comboTimer === 0 && game.combo !== 0) {
      game.combo = 0;
      noteCombo();
    }
  }
  game.paddleDrawH += (targetPaddleHeight(game) - game.paddleDrawH) * Math.min(1, dt * 8);
  updatePaddles(game, dt);
  if (game.boss) updateBoss(game, dt, events);

  if (wasSlow && game.slowTimer === 0 && game.intermission <= 0) {
    game.ball.vx = Math.sign(game.ball.vx || game.savedDir || 1) * rallySpeed(game);
  }

  if (game.intermission > 0) {
    game.intermission -= dt;
    game.ball.vx = 0;
    game.ball.vy *= Math.exp(-dt * 1.5);
    game.ball.y += game.ball.vy * dt;
    const edges = courtEdges(game.height);
    game.ball.y = clamp(game.ball.y, edges.ceiling + game.ball.radius, edges.floor - game.ball.radius - 10);
    if (game.intermission <= 0) {
      if (game.pendingOffer) {
        game.pendingOffer = false;
        game.offer = openOffer(game.perks);
        game.intermission = 0;
        events.push({ type: "offer", choices: game.offer, from: game.boss?.defeated ? "boss" : "wall" });
        pushScore(events, scored, comboChanged, game);
        return events;
      }
      beginNextWave(game, events);
    }
    pushScore(events, scored, comboChanged, game);
    return events;
  }

  const gravity = Math.max(430, game.height * 0.86) * gravityScale(game);
  const speed = Math.hypot(game.ball.vx, game.ball.vy);
  const substeps = clamp(Math.ceil((speed * dt) / Math.max(6, game.ball.radius * 0.65)), 1, 6);
  const slice = dt / substeps;
  let died = false;

  for (let index = 0; index < substeps; index += 1) {
    const previousX = game.ball.x;
    const previousY = game.ball.y;
    game.ball.vy = Math.min(game.ball.vy + gravity * slice, 470);
    game.ball.x += game.ball.vx * slice;
    game.ball.y += game.ball.vy * slice;
    if (hitFloor(game, events)) {
      died = true;
      break;
    }
    containVertical(game);
    if (collideBricks(game, previousX, previousY, events, noteScore, noteCombo)) {
      died = true;
      break;
    }
    if (game.intermission > 0) break;
    if (game.boss && collideBoss(game, previousX, previousY, events, noteScore)) {
      died = true;
      break;
    }
    if (hazardHitsBall(game)) {
      if (!consumeHazard(game, events)) {
        died = true;
        break;
      }
    }
    if (collidePaddles(game, previousX, events, noteScore, noteCombo)) {
      died = true;
      break;
    }
    if (game.ball.x < -30 || game.ball.x > game.width + 30) {
      died = fail(game, events, game.ball.x < game.width / 2 ? "left" : "right");
      break;
    }
    if (Math.abs(game.ball.vx) < 125) {
      game.ball.vx = (Math.sign(game.ball.vx) || game.savedDir || 1) * 125;
    }
    game.savedDir = Math.sign(game.ball.vx) || game.savedDir;
    collectCapsules(game, events, noteScore);
  }

  if (!died && game.intermission <= 0) {
    game.trailTimer += dt;
    if (game.trailTimer > 0.024) {
      game.trail.push({ x: game.ball.x, y: game.ball.y, life: 0.42 });
      if (game.trail.length > 18) game.trail.shift();
      game.trailTimer = 0;
    }
  }
  if (game.boss) updateHazards(game, dt);

  pushScore(events, scored, comboChanged, game);
  return events;
}

function pushScore(events: GameEvent[], scored: boolean, comboChanged: boolean, game: Game) {
  if (scored) events.push({ type: "score", score: game.score, left: bricksLeft(game.bricks) });
  if (comboChanged) events.push({ type: "combo", combo: game.combo });
}

function consumeHazard(game: Game, events: GameEvent[]) {
  if (game.shields > 0) {
    game.shields -= 1;
    game.shake = 5;
    burst(game, game.ball.x, game.ball.y, "#f7f4ea", 14);
    floatAt(game, game.ball.x, game.ball.y - 24, "SHIELD", "#f7f4ea", 16);
    emitSound(game, events, "shield");
    return true;
  }
  game.ball.vx = 0;
  game.ball.vy = 0;
  game.shake = 10;
  burst(game, game.ball.x, game.ball.y, "#ff7455", 22);
  emitSound(game, events, "lose");
  events.push({ type: "die" });
  return false;
}

function updatePaddles(game: Game, dt: number) {
  const limit = paddleLimits(game);
  if (game.ball.vx < 0) game.leftTarget += (game.ball.y - game.leftTarget) * dt * 0.42;
  if (game.ball.vx > 0) game.rightTarget += (game.ball.y - game.rightTarget) * dt * 0.42;
  game.leftTarget = clamp(game.leftTarget, limit.min, limit.max);
  game.rightTarget = clamp(game.rightTarget, limit.min, limit.max);
  const ease = Math.min(1, dt * 4.1);
  game.leftY += (game.leftTarget - game.leftY) * ease;
  game.rightY += (game.rightTarget - game.rightY) * ease;
}

function paddleLimits(game: Game) {
  return {
    min: game.paddleDrawH / 2 + 32,
    max: game.height - game.paddleDrawH / 2 - 32,
  };
}

function containVertical(game: Game) {
  const edges = courtEdges(game.height);
  const ball = game.ball;
  if (ball.y - ball.radius < edges.ceiling) {
    ball.y = edges.ceiling + ball.radius;
    ball.vy = Math.abs(ball.vy) * 0.34;
    burst(game, ball.x, ball.y, "#fff0bd", 4);
  }
}

function hitFloor(game: Game, events: GameEvent[]) {
  const edges = courtEdges(game.height);
  if (game.ball.y + game.ball.radius < edges.floor) return false;
  game.ball.y = edges.floor - game.ball.radius;
  if (game.grace > 0) {
    game.ball.vy = -Math.max(80, Math.abs(game.ball.vy) * 0.25);
    return false;
  }
  return fail(game, events, "floor");
}

function collidePaddles(
  game: Game,
  previousX: number,
  events: GameEvent[],
  noteScore: () => void,
  noteCombo: () => void,
) {
  const inset = paddleInset(game.width);
  const leftFace = inset + PADDLE_WIDTH;
  const rightFace = game.width - inset - PADDLE_WIDTH;
  const ball = game.ball;
  if (ball.vx < 0 && previousX - ball.radius >= leftFace - 0.4 && ball.x - ball.radius <= leftFace) {
    return resolvePaddle(game, "left", events, noteScore, noteCombo);
  }
  if (ball.vx > 0 && previousX + ball.radius <= rightFace + 0.4 && ball.x + ball.radius >= rightFace) {
    return resolvePaddle(game, "right", events, noteScore, noteCombo);
  }
  return false;
}

function resolvePaddle(
  game: Game,
  side: Side,
  events: GameEvent[],
  noteScore: () => void,
  noteCombo: () => void,
) {
  const ball = game.ball;
  const paddleY = side === "left" ? game.leftY : game.rightY;
  const aligned = Math.abs(ball.y - paddleY) <= game.paddleDrawH / 2 + ball.radius * 1.1;
  if (!aligned) {
    if (game.grace > 0) {
      placeInside(game, side);
      return false;
    }
    return fail(game, events, side);
  }

  placeInside(game, side);
  const offset = clamp((ball.y - paddleY) / (game.paddleDrawH / 2), -1, 1);
  ball.vx = (side === "left" ? 1 : -1) * rallySpeed(game);
  ball.vy = clamp(ball.vy * 0.7 + offset * 150, -390, 420);
  game.savedDir = Math.sign(ball.vx);

  if (game.lastPaddle !== side) {
    game.crossings += 1;
    if (game.hitSinceCrossing) {
      game.stall = 0;
    } else {
      game.stall += 1;
    }
    game.hitSinceCrossing = false;
    applyScore(game, 40, noteScore);
    if (game.combo !== 0) {
      game.combo = 0;
      game.comboTimer = 0;
      noteCombo();
    }
    const limits = paddleLimits(game);
    const target = clamp(ball.y + (Math.random() - 0.5) * game.height * 0.34, limits.min, limits.max);
    if (side === "left") game.rightTarget = target;
    else game.leftTarget = target;
    floatAt(game, ball.x, ball.y - 22, `+${Math.round(40 * scoreMult(game) * multiplier(game))}`, "#f7f4ea", 15);
  }
  game.lastPaddle = side;
  game.flash = { side, life: 1 };
  game.shake = Math.max(game.shake, 3.5);
  burst(game, ball.x, ball.y, side === "right" ? "#d9f47a" : "#ff7455", 12);
  emitSound(game, events, "paddle");
  return false;
}

function placeInside(game: Game, side: Side) {
  const inset = paddleInset(game.width);
  if (side === "left") game.ball.x = inset + PADDLE_WIDTH + game.ball.radius + 1;
  else game.ball.x = game.width - inset - PADDLE_WIDTH - game.ball.radius - 1;
}

function fail(game: Game, events: GameEvent[], cause: Side | "floor") {
  const edges = courtEdges(game.height);
  if (game.shields > 0) {
    game.shields -= 1;
    game.grace = 0.42;
    game.shake = 6;
    if (cause === "floor") {
      game.ball.y = edges.floor - game.ball.radius - 24;
      game.ball.vy = -Math.max(320, game.height * 0.55);
    } else {
      placeInside(game, cause);
      game.ball.vx = (cause === "left" ? 1 : -1) * rallySpeed(game);
      game.ball.vy = -Math.max(160, Math.abs(game.ball.vy) * 0.35);
    }
    burst(game, game.ball.x, game.ball.y, "#f7f4ea", 16);
    floatAt(game, game.ball.x, game.ball.y - 24, "SHIELD", "#f7f4ea", 16);
    emitSound(game, events, "shield");
    return false;
  }
  if (game.lives > 0) {
    game.lives -= 1;
    return respawn(game, events);
  }
  if (!game.reviveUsed && levelOfMeta(game, "revive") > 0) {
    game.reviveUsed = true;
    return respawn(game, events, true);
  }
  if (cause === "floor") game.ball.y = edges.floor - game.ball.radius;
  game.ball.vx = 0;
  game.ball.vy = 0;
  game.shake = 10;
  burst(game, game.ball.x, game.ball.y, "#ff7455", 22);
  emitSound(game, events, "lose");
  events.push({ type: "die" });
  return true;
}

function respawn(game: Game, events: GameEvent[], revived = false) {
  const headingRight = game.ball.vx >= 0 || game.ball.x > game.width / 2;
  const side: Side = headingRight ? "left" : "right";
  placeInside(game, side);
  const edges = courtEdges(game.height);
  game.ball.y = clamp(game.ball.y, edges.ceiling + game.ball.radius + 6, edges.floor - game.ball.radius - 6);
  game.ball.vx = (side === "left" ? 1 : -1) * rallySpeed(game);
  game.ball.vy = -Math.max(200, game.height * 0.3);
  game.grace = 1.1;
  game.hazards = [];
  game.shake = 7;
  burst(game, game.ball.x, game.ball.y, "#d9f47a", 18);
  floatAt(game, game.ball.x, game.ball.y - 26, revived ? "RALLY CARD" : "SPARE BALL", "#d9f47a", 16);
  emitSound(game, events, "power");
  return false;
}

function collideBricks(
  game: Game,
  previousX: number,
  previousY: number,
  events: GameEvent[],
  noteScore: () => void,
  noteCombo: () => void,
) {
  let guard = 0;
  while (guard < 5) {
    guard += 1;
    let closest: { brick: (typeof game.bricks)[number]; dist: number } | null = null;
    for (const brick of game.bricks) {
      if (!brick.alive || brick.cooldown > 0) continue;
      const rect = brickRect(brick, game.width, game.height);
      if (!circleHitsRect(game.ball.x, game.ball.y, game.ball.radius, rect)) continue;
      const centerX = rect.x + rect.w / 2;
      const centerY = rect.y + rect.h / 2;
      const dist = (previousX - centerX) ** 2 + (previousY - centerY) ** 2;
      if (!closest || dist < closest.dist) closest = { brick, dist };
    }
    if (!closest) return false;
    const died = resolveBrick(game, closest.brick, previousX, previousY, events, noteScore, noteCombo);
    if (died || game.intermission > 0) return died;
  }
  return false;
}

function resolveBrick(
  game: Game,
  brick: (typeof game.bricks)[number],
  previousX: number,
  previousY: number,
  events: GameEvent[],
  noteScore: () => void,
  noteCombo: () => void,
) {
  const rect = brickRect(brick, game.width, game.height);
  const ball = game.ball;
  const fromLeft = previousX + ball.radius <= rect.x + 1.5;
  const fromRight = previousX - ball.radius >= rect.x + rect.w - 1.5;
  const fromTop = previousY + ball.radius <= rect.y + 1.5;
  const fromBottom = previousY - ball.radius >= rect.y + rect.h - 1.5;
  const horizontal = fromLeft || fromRight;
  const vertical = fromTop || fromBottom;
  const verticalHit = vertical && (!horizontal || Math.abs(ball.vy) > Math.abs(ball.vx));

  if (brick.type === "steel") {
    reflect(game, rect, fromLeft, fromRight, verticalHit);
    brick.cooldown = 0.08;
    brick.flash = 0.08;
    game.shake = Math.max(game.shake, 2);
    burst(game, ball.x, ball.y, "#d5e1e5", 6);
    emitSound(game, events, "steel");
    return false;
  }

  const breaker = game.breakerTimer > 0;
  if (!breaker && brick.hp > 1) {
    brick.hp -= 1;
    brick.cooldown = passTime(game, rect.w);
    brick.flash = 0.12;
    kick(game, rect, verticalHit, fromTop);
    applyScore(game, 5, noteScore);
    burst(game, rect.x + rect.w / 2, rect.y + rect.h / 2, "#d9f47a", 6);
    emitSound(game, events, "crack");
    return false;
  }

  const chain = new Set<(typeof game.bricks)[number]>();
  destroyBrick(game, brick, events, chain, false, verticalHit, fromTop, noteScore, noteCombo);
  return false;
}

function destroyBrick(
  game: Game,
  brick: (typeof game.bricks)[number],
  events: GameEvent[],
  chain: Set<(typeof game.bricks)[number]>,
  fromBomb: boolean,
  verticalHit: boolean,
  fromTop: boolean,
  noteScore: () => void,
  noteCombo: () => void,
) {
  if (!brick.alive || brick.type === "steel" || chain.has(brick) || chain.size > 16) return;
  chain.add(brick);
  const rect = brickRect(brick, game.width, game.height);
  const breaker = game.breakerTimer > 0;
  if (!fromBomb && !breaker && brick.hp > 1) return;

  brick.alive = false;
  brick.hp = 0;
  game.hitSinceCrossing = true;
  game.combo += 1;
  game.comboTimer = comboWindow(game);
  noteCombo();
  const comboBonus = game.combo > 1 ? game.combo * 5 : 0;
  const points = Math.round((BRICK_POINTS[brick.type] + comboBonus) * scoreMult(game) * multiplier(game));
  game.score += points;
  noteScore();
  const label = game.combo > 1 ? `+${points}  x${game.combo}` : `+${points}`;
  floatAt(game, rect.x + rect.w / 2, rect.y, label, brick.type === "gold" ? "#f2c14e" : "#fff6e8", game.combo > 2 ? 16 : 13);
  shatter(game, rect, brickColor(brick.type), brick.type === "bomb" ? 9 : 5);
  game.shake = Math.max(game.shake, brick.type === "bomb" ? 6 : 2.2);

  if (brick.type === "bomb") emitSound(game, events, "bomb");
  else emitSound(game, events, "break");

  if (shouldDrop(game, brick)) dropCapsule(game, rect.x + rect.w / 2, rect.y + rect.h / 2);
  if (!breaker && !fromBomb) kick(game, rect, verticalHit, fromTop);

  if (brick.type === "bomb") {
    for (const other of game.bricks) {
      if (!other.alive || other.type === "steel") continue;
      const otherRect = brickRect(other, game.width, game.height);
      const dx = otherRect.x + otherRect.w / 2 - (rect.x + rect.w / 2);
      const dy = otherRect.y + otherRect.h / 2 - (rect.y + rect.h / 2);
      if (dx * dx + dy * dy < Math.max(rect.w, rect.h) ** 2 * 3.3) {
        destroyBrick(game, other, events, chain, true, false, false, noteScore, noteCombo);
      }
    }
  }

  if (!game.clearing && !game.boss && bricksLeft(game.bricks) === 0) startIntermission(game, events, noteScore);
}

function reflect(
  game: Game,
  rect: { x: number; y: number; w: number; h: number },
  fromLeft: boolean,
  fromRight: boolean,
  verticalHit: boolean,
) {
  const ball = game.ball;
  if (!verticalHit) {
    if (fromRight) ball.vx = Math.abs(ball.vx);
    else if (fromLeft) ball.vx = -Math.abs(ball.vx);
    else ball.vx = -ball.vx;
    ball.x = ball.vx > 0 ? rect.x + rect.w + ball.radius + 1 : rect.x - ball.radius - 1;
    return;
  }
  const downward = ball.y > rect.y + rect.h / 2;
  ball.vy = downward ? Math.max(130, Math.abs(ball.vy)) : -Math.max(170, Math.abs(ball.vy));
  ball.y = downward ? rect.y + rect.h + ball.radius + 1 : rect.y - ball.radius - 1;
}

function kick(
  game: Game,
  rect: { x: number; y: number; w: number; h: number },
  verticalHit: boolean,
  fromTop: boolean,
) {
  const ball = game.ball;
  if (verticalHit) {
    const downward = fromTop || ball.y <= rect.y + rect.h / 2;
    ball.vy = downward ? -Math.max(170, Math.abs(ball.vy) * 0.7) : Math.max(120, Math.abs(ball.vy) * 0.45);
    ball.y = downward ? rect.y - ball.radius - 1 : rect.y + rect.h + ball.radius + 1;
    return;
  }
  const offset = clamp((ball.y - (rect.y + rect.h / 2)) / (rect.h / 2), -1, 1);
  ball.vy = clamp(ball.vy + offset * 170, -420, 450);
}

function passTime(game: Game, brickWidth: number) {
  return Math.max(0.26, (brickWidth + game.ball.radius * 2) / Math.max(130, Math.abs(game.ball.vx)));
}

function shouldDrop(game: Game, brick: (typeof game.bricks)[number]) {
  if (game.capsules.length >= 3) return false;
  const luck = 1 + 0.5 * perkStacks(game.perks, "luck");
  if (brick.type === "gold") return true;
  if (brick.type === "bomb") return hash(game.salt++ + game.wave) > 0.45 / luck;
  if (brick.type === "coral" && game.wave >= 3) return hash(game.salt++ + brick.nx) > 0.88 / luck;
  return false;
}

function dropCapsule(game: Game, x: number, y: number) {
  const kind = POWERS[Math.floor(hash(game.salt++ * 3.1 + game.wave) * POWERS.length)];
  game.capsules.push({ kind, x, y, vy: 42 + hash(game.salt++) * 28, phase: hash(game.salt++) * 6, life: 6.5 });
}

function collectCapsules(game: Game, events: GameEvent[], noteScore: () => void) {
  const ball = game.ball;
  const remaining: (typeof game.capsules)[number][] = [];
  for (const capsule of game.capsules) {
    const dx = ball.x - capsule.x;
    const dy = ball.y - capsule.y;
    if (dx * dx + dy * dy > (ball.radius + 18) ** 2) {
      remaining.push(capsule);
      continue;
    }
    grantPower(game, capsule.kind, capsule.kind === "shield" ? 0 : 10);
    if (capsule.kind === "shield" && game.shields > 1) {
      game.score += Math.round(25 * scoreMult(game));
      noteScore();
    }
    burst(game, capsule.x, capsule.y, "#f7f4ea", 10);
    floatAt(game, capsule.x, capsule.y - 16, POWER_NAME[capsule.kind], "#d9f47a", 14);
    emitSound(game, events, "power");
  }
  game.capsules = remaining;
}

function startIntermission(game: Game, events: GameEvent[], noteScore: () => void) {
  game.clearing = true;
  game.intermission = 1.05;
  game.pendingOffer = true;
  game.savedDir = Math.sign(game.ball.vx) || game.savedDir || 1;
  game.ball.vx = 0;
  const bonus = Math.round((50 + game.wave * 25) * scoreMult(game) * multiplier(game));
  game.score += bonus;
  noteScore();
  setBanner(game, "CLEARED", `+${bonus}`, 1.05);
  game.shake = Math.max(game.shake, 4);
  emitSound(game, events, "wave");
}

export function beginNextWave(game: Game, events: GameEvent[]) {
  game.wave += 1;
  game.clearing = false;
  game.offer = null;
  const boss = isBoss(game.wave);
  if (boss) {
    spawnBoss(game, game.wave);
    game.hazards = [];
    events.push({
      type: "bossStart",
      name: game.boss?.name ?? "",
      hp: game.boss?.hp ?? 0,
      maxHp: game.boss?.maxHp ?? 0,
      phase: 0,
    });
  } else {
    game.boss = null;
    spawnWave(game, game.wave);
  }
  if (game.perks.waveShield) game.shields = Math.max(game.shields, game.perks.waveShield);
  if (game.perks.waveBreaker) game.breakerTimer = Math.max(game.breakerTimer, 6);
  if (levelOfMeta(game, "shield") >= 3) game.shields = Math.max(game.shields, 1);
  for (const brick of game.bricks) brick.flash = 0.3;
  game.ball.vx = (game.savedDir || 1) * rallySpeed(game);
  rescueBall(game);
  game.grace = 0.45;
  game.shake = 3;
  const copy = boss ? "DESTROY THE CORE" : WAVE_COPY[(game.wave - 1) % WAVE_COPY.length];
  setBanner(game, boss ? `WAVE ${String(game.wave).padStart(2, "0")} · BOSS` : `WAVE ${String(game.wave).padStart(2, "0")}`, copy, 1.3);
  events.push({ type: "wave", wave: game.wave, left: bricksLeft(game.bricks), boss });
  emitSound(game, events, "wave");
}

export function choosePerk(game: Game, perk: PerkId): GameEvent[] {
  const events: GameEvent[] = [];
  game.perks = { ...game.perks, [perk]: perkStacks(game.perks, perk) + 1 };
  game.offer = null;
  if (perk === "spare") game.lives += 1;
  if (perk === "waveShield") game.shields = Math.max(game.shields, game.perks.waveShield ?? 1);
  if (perk === "waveBreaker") game.breakerTimer = Math.max(game.breakerTimer, 6);
  beginNextWave(game, events);
  return events;
}

function rescueBall(game: Game) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const stuck = game.bricks.some(
      (brick) => brick.alive && circleHitsRect(game.ball.x, game.ball.y, game.ball.radius + 2, brickRect(brick, game.width, game.height)),
    );
    if (!stuck) return;
    game.ball.x += -(game.savedDir || 1) * 16;
    game.ball.y += 8;
  }
  const inset = paddleInset(game.width);
  game.ball.x = (game.savedDir || 1) > 0 ? inset + 42 : game.width - inset - 42;
}

function circleHitsRect(x: number, y: number, radius: number, rect: { x: number; y: number; w: number; h: number }) {
  const nearestX = clamp(x, rect.x, rect.x + rect.w);
  const nearestY = clamp(y, rect.y, rect.y + rect.h);
  const dx = x - nearestX;
  const dy = y - nearestY;
  return dx * dx + dy * dy <= radius * radius;
}

function brickColor(type: Brick["type"]) {
  if (type === "coral" || type === "bomb") return "#ff7455";
  if (type === "lime") return "#d9f47a";
  if (type === "gold") return "#f2c14e";
  if (type === "steel") return "#d5e1e5";
  return "#f4e2c6";
}

function setBanner(game: Game, title: string, sub: string, life: number) {
  game.banner = { title, sub, life, maxLife: life };
}

function emitSound(game: Game, events: GameEvent[], name: SoundName) {
  const previous = game.soundAt[name] ?? -10;
  if (game.time - previous < 0.045) return;
  game.soundAt[name] = game.time;
  events.push({ type: "sound", name });
}

function floatAt(game: Game, x: number, y: number, text: string, color: string, size: number) {
  game.floaters.push({ x: x + (Math.random() - 0.5) * 12, y, text, color, size, life: 0.82, maxLife: 0.82 });
  if (game.floaters.length > 16) game.floaters.shift();
}

function burst(game: Game, x: number, y: number, color: string, amount: number) {
  for (let i = 0; i < amount; i += 1) {
    const angle = (Math.PI * 2 * i) / amount + Math.random() * 0.4;
    const speed = 40 + Math.random() * 110;
    const life = 0.28 + Math.random() * 0.28;
    game.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 2.6,
      life,
      maxLife: life,
      color,
    });
  }
  if (game.particles.length > 70) game.particles.splice(0, game.particles.length - 70);
}

function shatter(game: Game, rect: { x: number; y: number; w: number; h: number }, color: string, amount: number) {
  for (let i = 0; i < amount; i += 1) {
    const life = 0.35 + Math.random() * 0.28;
    game.shards.push({
      x: rect.x + Math.random() * rect.w,
      y: rect.y + Math.random() * rect.h,
      vx: (Math.random() - 0.5) * 180,
      vy: -40 - Math.random() * 120,
      w: 3 + Math.random() * 6,
      h: 2 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 10,
      life,
      maxLife: life,
      color,
    });
  }
  if (game.shards.length > 48) game.shards.splice(0, game.shards.length - 48);
}

function tickEffects(game: Game, dt: number) {
  game.trail = game.trail.filter((point) => (point.life -= dt) > 0);
  game.particles = game.particles.filter((particle) => {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 90 * dt;
    return particle.life > 0;
  });
  game.shards = game.shards.filter((shard) => {
    shard.life -= dt;
    shard.x += shard.vx * dt;
    shard.y += shard.vy * dt;
    shard.vy += 280 * dt;
    shard.rot += shard.vr * dt;
    return shard.life > 0;
  });
  game.floaters = game.floaters.filter((floater) => {
    floater.life -= dt;
    floater.y -= 28 * dt;
    return floater.life > 0;
  });
  for (const capsule of game.capsules) {
    if (game.intermission <= 0) capsule.y += capsule.vy * dt;
    capsule.life -= dt;
  }
  game.capsules = game.capsules.filter((capsule) => capsule.life > 0 && capsule.y < game.height - 8);
  if (game.flash) {
    game.flash.life -= dt * 3.1;
    if (game.flash.life <= 0) game.flash = null;
  }
  if (game.banner) {
    game.banner.life -= dt;
    if (game.banner.life <= 0) game.banner = null;
  }
  game.shake = Math.max(0, game.shake - dt * 28);
}
