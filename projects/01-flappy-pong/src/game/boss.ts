import type { Boss, Game, GameEvent } from "./types";
import { BOSS_NAMES } from "./types";
import { clamp, courtEdges } from "./util";

const SHAPE = [
  [true, true, true, true],
  [true, false, false, true],
  [true, true, true, true],
];

export function isBossWave(wave: number) {
  return wave % 5 === 0;
}

export function bossName(index: number) {
  return BOSS_NAMES[(index - 1) % BOSS_NAMES.length] ?? `WARDEN ${String(index).padStart(2, "0")}`;
}

export function spawnBoss(game: Game, wave: number) {
  const index = Math.max(1, Math.round(wave / 5));
  const w = Math.min(game.width * 0.46, 430);
  const h = Math.min(w * 0.5, game.height * 0.3);
  const cellHp = 2 + Math.floor((index - 1) / 3);
  const cols = 4;
  const rows = SHAPE.length;
  const padX = w * 0.04;
  const padY = h * 0.09;
  const cw = (w - padX * 2) / cols;
  const ch = (h - padY * 2) / rows;
  const cells = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (!SHAPE[row][col]) continue;
      cells.push({
        dx: padX + col * cw + cw * 0.06,
        dy: padY + row * ch + ch * 0.08,
        dw: cw * 0.88,
        dh: ch * 0.84,
        hp: cellHp,
        maxHp: cellHp,
        alive: true,
        cooldown: 0,
        flash: 0,
        steel: false,
      });
    }
  }
  const maxHp = 10 + index * 6;
  game.boss = {
    name: bossName(index),
    index,
    cx: game.width / 2,
    cy: game.height * 0.3,
    w,
    h,
    hp: maxHp,
    maxHp,
    phase: 0,
    t: 0,
    fireTimer: 1.6,
    debrisTimer: 2.6,
    hitFlash: 0,
    defeated: false,
    cells,
    emitted: -1,
  };
  game.bricks = [];
  game.hazards = [];
}

export function cellRect(boss: Boss, cell: Boss["cells"][number]) {
  return { x: boss.cx - boss.w / 2 + cell.dx, y: boss.cy - boss.h / 2 + cell.dy, w: cell.dw, h: cell.dh };
}

export function coreRect(boss: Boss) {
  const w = boss.w * 0.52;
  const h = boss.h * 0.4;
  return { x: boss.cx - w / 2, y: boss.cy - h / 2, w, h };
}

export function resizeBoss(boss: Boss, scaleX: number, scaleY: number) {
  boss.cx *= scaleX;
  boss.cy *= scaleY;
  boss.w *= scaleX;
  boss.h *= scaleY;
}

export function updateBoss(game: Game, dt: number, events: GameEvent[]) {
  const boss = game.boss;
  if (!boss || boss.defeated) return;
  boss.t += dt;
  const edges = courtEdges(game.height);
  const base = Math.max(edges.ceiling + boss.h * 0.6 + 26, game.height * 0.29);
  boss.cy = base + Math.sin(boss.t * 0.72) * game.height * 0.11;
  boss.cx = game.width / 2 + Math.sin(boss.t * 0.42) * Math.min(70, game.width * 0.07);
  boss.hitFlash = Math.max(0, boss.hitFlash - dt * 4);
  for (const cell of boss.cells) {
    if (cell.cooldown > 0) cell.cooldown = Math.max(0, cell.cooldown - dt);
    if (cell.flash > 0) cell.flash = Math.max(0, cell.flash - dt);
  }

  if (boss.hp <= boss.maxHp * 0.66 && boss.phase < 1) raisePhase(game, boss, events);
  if (boss.hp <= boss.maxHp * 0.33 && boss.phase < 2) raisePhase(game, boss, events);

  boss.fireTimer -= dt;
  if (boss.fireTimer <= 0) {
    fireOrbs(game, boss);
    boss.fireTimer = Math.max(0.85, 2.5 - boss.phase * 0.6);
  }
  boss.debrisTimer -= dt;
  if (boss.debrisTimer <= 0) {
    dropDebris(game, boss);
    boss.debrisTimer = Math.max(1.2, 3.1 - boss.phase * 0.6);
  }
  emitBoss(boss, events);
}

function emitBoss(boss: Boss, events: GameEvent[]) {
  if (boss.emitted === boss.hp) return;
  boss.emitted = boss.hp;
  events.push({ type: "boss", name: boss.name, hp: boss.hp, maxHp: boss.maxHp, phase: boss.phase });
}

function raisePhase(game: Game, boss: Boss, events: GameEvent[]) {
  boss.phase += 1;
  let plates = 0;
  for (const cell of boss.cells) {
    if (plates >= 3) break;
    if (!cell.steel && cell.alive && Math.random() < 0.4) {
      cell.steel = true;
      cell.hp = 99;
      cell.maxHp = 99;
      cell.flash = 0.3;
      plates += 1;
    }
  }
  if (plates === 0) {
    const fallback = boss.cells.find((cell) => cell.alive && !cell.steel);
    if (fallback) {
      fallback.steel = true;
      fallback.hp = 99;
      fallback.maxHp = 99;
      fallback.flash = 0.3;
    }
  }
  game.shake = Math.max(game.shake, 5);
  events.push({ type: "sound", name: "phase" });
  emitBoss(boss, events);
}

function fireOrbs(game: Game, boss: Boss) {
  const count = 1 + boss.phase;
  for (let i = 0; i < count; i += 1) {
    const targetX = game.ball.x + (Math.random() - 0.5) * game.width * 0.2;
    const targetY = game.ball.y;
    const angle = Math.atan2(targetY - boss.cy, targetX - boss.cx);
    const speed = 150 + boss.phase * 34;
    game.hazards.push({
      x: boss.cx + Math.cos(angle) * boss.w * 0.4,
      y: boss.cy + Math.sin(angle) * boss.h * 0.3,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 8,
      life: 7,
      spin: 0,
      kind: "orb",
    });
  }
  trimHazards(game);
  events_sound(game, "orb");
}

function dropDebris(game: Game, boss: Boss) {
  const spread = boss.w * 1.5;
  const x = boss.cx + (Math.random() - 0.5) * spread;
  game.hazards.push({
    x: clamp(x, 40, game.width - 40),
    y: 24,
    vx: (Math.random() - 0.5) * 30,
    vy: 120 + Math.random() * 70,
    r: 7,
    life: 9,
    spin: Math.random() * 6,
    kind: "debris",
  });
  trimHazards(game);
}

function trimHazards(game: Game) {
  if (game.hazards.length > 16) game.hazards.splice(0, game.hazards.length - 16);
}

export function updateHazards(game: Game, dt: number) {
  for (const hazard of game.hazards) {
    hazard.life -= dt;
    hazard.x += hazard.vx * dt;
    hazard.y += hazard.vy * dt;
    hazard.spin += dt * 5;
    if (hazard.kind === "debris") hazard.vy = Math.min(hazard.vy + 40 * dt, 260);
    if (hazard.kind === "orb") {
      hazard.vy += 22 * dt;
      if (hazard.y > game.height * 0.55) hazard.vy -= 70 * dt;
    }
  }
  game.hazards = game.hazards.filter(
    (hazard) => hazard.life > 0 && hazard.y < game.height - 6 && hazard.x > 6 && hazard.x < game.width - 6,
  );
}

function events_sound(game: Game, name: "orb") {
  const previous = game.soundAt[name] ?? -10;
  if (game.time - previous < 0.09) return;
  game.soundAt[name] = game.time;
}

function circleHitsRect(x: number, y: number, radius: number, rect: { x: number; y: number; w: number; h: number }) {
  const nearestX = clamp(x, rect.x, rect.x + rect.w);
  const nearestY = clamp(y, rect.y, rect.y + rect.h);
  const dx = x - nearestX;
  const dy = y - nearestY;
  return dx * dx + dy * dy <= radius * radius;
}

function reflectOff(game: Game, rect: { x: number; y: number; w: number; h: number }, previousX: number, previousY: number) {
  const ball = game.ball;
  const fromLeft = previousX + ball.radius <= rect.x + 1.5;
  const fromRight = previousX - ball.radius >= rect.x + rect.w - 1.5;
  const fromTop = previousY + ball.radius <= rect.y + 1.5;
  const horizontal = fromLeft || fromRight;
  const vertical = fromTop || previousY - ball.radius >= rect.y + rect.h - 1.5;
  const verticalHit = vertical && (!horizontal || Math.abs(ball.vy) > Math.abs(ball.vx));

  if (!verticalHit) {
    if (fromRight) ball.vx = Math.abs(ball.vx);
    else if (fromLeft) ball.vx = -Math.abs(ball.vx);
    else ball.vx = -ball.vx;
    ball.x = ball.vx > 0 ? rect.x + rect.w + ball.radius + 1 : rect.x - ball.radius - 1;
    return;
  }
  const downward = ball.y > rect.y + rect.h / 2;
  ball.vy = downward ? Math.max(130, Math.abs(ball.vy) * 0.8) : -Math.max(170, Math.abs(ball.vy) * 0.8);
  ball.y = downward ? rect.y + rect.h + ball.radius + 1 : rect.y - ball.radius - 1;
}

export function hazardHitsBall(game: Game) {
  const ball = game.ball;
  for (const hazard of game.hazards) {
    const dx = ball.x - hazard.x;
    const dy = ball.y - hazard.y;
    if (dx * dx + dy * dy > (hazard.r + ball.radius) ** 2) continue;
    hazard.life = 0;
    return true;
  }
  return false;
}

export function collideBoss(game: Game, previousX: number, previousY: number, events: GameEvent[], noteScore: () => void) {
  const boss = game.boss;
  if (!boss || boss.defeated) return false;

  let target: { cell: Boss["cells"][number]; dist: number } | null = null;
  for (const cell of boss.cells) {
    if (!cell.alive || cell.cooldown > 0) continue;
    const rect = cellRect(boss, cell);
    if (!circleHitsRect(game.ball.x, game.ball.y, game.ball.radius, rect)) continue;
    const centerX = rect.x + rect.w / 2;
    const centerY = rect.y + rect.h / 2;
    const dist = (previousX - centerX) ** 2 + (previousY - centerY) ** 2;
    if (!target || dist < target.dist) target = { cell, dist };
  }
  if (target) {
    const rect = cellRect(boss, target.cell);
    const breaker = game.breakerTimer > 0;
    if (target.cell.steel && !breaker) {
      reflectOff(game, rect, previousX, previousY);
      target.cell.cooldown = 0.08;
      target.cell.flash = 0.1;
      game.shake = Math.max(game.shake, 2);
      events.push({ type: "sound", name: "steel" });
      return false;
    }
    target.cell.hp -= 1;
    target.cell.flash = 0.14;
    if (target.cell.hp <= 0) {
      target.cell.alive = false;
      target.cell.steel = false;
      game.score += 60;
      noteScore();
      events.push({ type: "sound", name: "break" });
    } else {
      target.cell.cooldown = 0.24;
      events.push({ type: "sound", name: "crack" });
    }
    reflectOff(game, rect, previousX, previousY);
    return false;
  }

  const exposed = boss.cells.every((cell) => !cell.alive);
  if (!exposed) return false;
  const rect = coreRect(boss);
  if (!circleHitsRect(game.ball.x, game.ball.y, game.ball.radius, rect)) return false;

  boss.hp -= 1;
  game.hitSinceCrossing = true;
  boss.hitFlash = 0.3;
  game.shake = Math.max(game.shake, 4);
  reflectOff(game, rect, previousX, previousY);
  events.push({ type: "sound", name: "crack" });
  emitBoss(boss, events);
  if (boss.hp <= 0) {
    boss.defeated = true;
    game.bossesDown += 1;
    game.score += 400 + boss.index * 200;
    noteScore();
    game.shake = 9;
    events.push({ type: "sound", name: "wave" });
    events.push({ type: "bossEnd", name: boss.name });
    game.banner = { title: "BOSS DOWN", sub: boss.name, life: 1.6, maxLife: 1.6 };
    game.pendingOffer = true;
    game.clearing = true;
    game.intermission = 1.5;
    game.savedDir = Math.sign(game.ball.vx) || game.savedDir || 1;
    game.ball.vx = 0;
  }
  return false;
}
