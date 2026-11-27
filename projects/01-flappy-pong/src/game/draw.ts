import { BRICK_STYLE, brickRect } from "./bricks";
import { cellRect, coreRect } from "./boss";
import type { Brick, Game, GameStatus, PowerKind } from "./types";
import { POWER_COLOR, POWER_MARK } from "./types";
import { PADDLE_WIDTH, courtEdges, paddleInset } from "./util";

function round(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  context.beginPath();
  context.roundRect(x, y, w, h, r);
}

function drawPaddle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  height: number,
  color: string,
  hot: boolean,
  expanded: boolean,
) {
  context.save();
  context.shadowColor = color;
  context.shadowBlur = hot ? 28 : 16;
  context.fillStyle = color;
  round(context, x, y - height / 2, PADDLE_WIDTH, height, 6);
  context.fill();
  if (expanded) {
    context.shadowBlur = 0;
    context.strokeStyle = "rgba(255,255,255,0.7)";
    context.lineWidth = 1.5;
    context.stroke();
  }
  context.shadowBlur = 0;
  context.fillStyle = "rgba(255,255,255,0.5)";
  round(context, x + 3, y - height / 2 + 8, 2, Math.max(8, height - 16), 2);
  context.fill();
  context.restore();
}

function drawBrick(context: CanvasRenderingContext2D, brick: Brick, width: number, height: number, time: number) {
  const rect = brickRect(brick, width, height);
  const style = BRICK_STYLE[brick.type];
  const { x, y, w, h } = rect;
  context.save();
  context.fillStyle = brick.hp < brick.maxHp ? style.damaged : style.fill;
  round(context, x, y, w, h, 3);
  context.fill();
  context.clip();
  context.fillStyle = "rgba(255,255,255,0.3)";
  context.fillRect(x, y, w, Math.max(2, h * 0.24));
  context.fillStyle = "rgba(28, 24, 18, 0.16)";
  context.fillRect(x, y + h - 2, w, 2);
  if (brick.type === "gold") {
    const shift = ((time * 46 + x) % (w + 28)) - 14;
    context.fillStyle = "rgba(255,255,255,0.42)";
    context.beginPath();
    context.moveTo(x + shift, y);
    context.lineTo(x + shift + 7, y);
    context.lineTo(x + shift - 6, y + h);
    context.lineTo(x + shift - 13, y + h);
    context.closePath();
    context.fill();
  }
  context.restore();

  context.strokeStyle = style.edge;
  context.lineWidth = 1;
  round(context, x + 0.5, y + 0.5, w - 1, h - 1, 3);
  context.stroke();

  if (brick.type === "lime") {
    context.strokeStyle = "rgba(48, 62, 24, 0.28)";
    context.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
  }
  if (brick.type === "steel") {
    context.fillStyle = "#5d6f76";
    context.beginPath();
    context.arc(x + 5, y + h / 2, 1.35, 0, Math.PI * 2);
    context.arc(x + w - 5, y + h / 2, 1.35, 0, Math.PI * 2);
    context.fill();
  }
  if (brick.type === "bomb") {
    context.strokeStyle = style.ink;
    context.lineWidth = 1.3;
    context.beginPath();
    context.arc(x + w / 2, y + h / 2, Math.min(w, h) * 0.22, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = style.ink;
    context.beginPath();
    context.arc(x + w / 2, y + h / 2, 1.2, 0, Math.PI * 2);
    context.fill();
  }
  if (brick.hp < brick.maxHp) {
    context.strokeStyle = "rgba(39, 48, 28, 0.55)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x + w * 0.28, y + 2);
    context.lineTo(x + w * 0.48, y + h * 0.58);
    context.lineTo(x + w * 0.36, y + h - 2);
    context.stroke();
  }
  if (brick.flash > 0) {
    context.globalAlpha = Math.min(0.7, brick.flash / 0.2);
    context.fillStyle = "#fffaf0";
    round(context, x, y, w, h, 3);
    context.fill();
    context.globalAlpha = 1;
  }
}

function drawBoss(context: CanvasRenderingContext2D, game: Game) {
  const boss = game.boss;
  if (!boss) return;
  const left = boss.cx - boss.w / 2;
  const top = boss.cy - boss.h / 2;

  context.save();
  context.shadowColor = "rgba(255, 116, 85, 0.5)";
  context.shadowBlur = 26;
  context.fillStyle = "#22333a";
  round(context, left - 6, top - 6, boss.w + 12, boss.h + 12, 10);
  context.fill();
  context.shadowBlur = 0;
  context.strokeStyle = "rgba(217, 244, 122, 0.35)";
  context.lineWidth = 1.5;
  round(context, left - 6.5, top - 6.5, boss.w + 13, boss.h + 13, 10);
  context.stroke();
  context.restore();

  for (const cell of boss.cells) {
    if (!cell.alive) continue;
    const rect = cellRect(boss, cell);
    const color = cell.steel ? "#9aadb4" : boss.phase >= 2 ? "#ff7455" : "#f2c14e";
    context.fillStyle = color;
    round(context, rect.x, rect.y, rect.w, rect.h, 3);
    context.fill();
    context.fillStyle = "rgba(255,255,255,0.28)";
    context.fillRect(rect.x, rect.y, rect.w, Math.max(2, rect.h * 0.22));
    if (cell.steel) {
      context.fillStyle = "#5d6f76";
      context.beginPath();
      context.arc(rect.x + 4, rect.y + rect.h / 2, 1.2, 0, Math.PI * 2);
      context.arc(rect.x + rect.w - 4, rect.y + rect.h / 2, 1.2, 0, Math.PI * 2);
      context.fill();
    }
    if (cell.flash > 0) {
      context.globalAlpha = Math.min(0.8, cell.flash / 0.16);
      context.fillStyle = "#fffaf0";
      round(context, rect.x, rect.y, rect.w, rect.h, 3);
      context.fill();
      context.globalAlpha = 1;
    }
  }

  const exposed = boss.cells.every((cell) => !cell.alive);
  if (exposed) {
    const rect = coreRect(boss);
    const pulse = 0.72 + Math.sin(game.time * 6) * 0.16 + boss.hitFlash;
    context.save();
    context.shadowColor = "rgba(255, 116, 85, 0.9)";
    context.shadowBlur = 30 * pulse;
    context.fillStyle = `rgba(255, 116, 85, ${0.65 + boss.hitFlash * 1.6})`;
    round(context, rect.x, rect.y, rect.w, rect.h, 6);
    context.fill();
    context.restore();
    context.fillStyle = "#fff4e6";
    context.beginPath();
    context.arc(rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.22 * pulse, 0, Math.PI * 2);
    context.fill();
  }
}

function drawHazards(context: CanvasRenderingContext2D, game: Game) {
  for (const hazard of game.hazards) {
    context.save();
    context.translate(hazard.x, hazard.y);
    if (hazard.kind === "orb") {
      context.shadowColor = "rgba(255, 116, 85, 0.9)";
      context.shadowBlur = 14;
      context.fillStyle = "#ff7455";
      context.beginPath();
      context.arc(0, 0, hazard.r, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
      context.strokeStyle = "#ffd8c9";
      context.lineWidth = 1.4;
      for (let i = 0; i < 5; i += 1) {
        const angle = hazard.spin + (i * Math.PI * 2) / 5;
        context.beginPath();
        context.moveTo(Math.cos(angle) * hazard.r, Math.sin(angle) * hazard.r);
        context.lineTo(Math.cos(angle) * (hazard.r + 5), Math.sin(angle) * (hazard.r + 5));
        context.stroke();
      }
    } else {
      context.rotate(hazard.spin);
      context.fillStyle = "#f2c14e";
      context.fillRect(-hazard.r, -hazard.r, hazard.r * 2, hazard.r * 2);
      context.strokeStyle = "rgba(60, 44, 10, 0.5)";
      context.lineWidth = 1;
      context.strokeRect(-hazard.r, -hazard.r, hazard.r * 2, hazard.r * 2);
    }
    context.restore();
  }
}

function drawCapsule(context: CanvasRenderingContext2D, game: Game, kind: PowerKind, x: number, y: number, phase: number) {
  const wobble = x + Math.sin(game.time * 3 + phase) * 7;
  const color = POWER_COLOR[kind];
  context.save();
  context.shadowColor = color;
  context.shadowBlur = 12;
  context.fillStyle = "#f8f3e6";
  round(context, wobble - 15, y - 8, 30, 16, 8);
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = kind === "shield" ? "#172126" : color;
  context.font = "700 10px 'DM Mono', monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(POWER_MARK[kind], wobble, y + 0.5);
  context.restore();
}

function drawChips(context: CanvasRenderingContext2D, game: Game) {
  const chips: { label: string; color: string }[] = [];
  if (game.expandTimer > 0) chips.push({ label: `EXPAND ${Math.ceil(game.expandTimer)}`, color: POWER_COLOR.expand });
  if (game.slowTimer > 0) chips.push({ label: `SLOW ${Math.ceil(game.slowTimer)}`, color: POWER_COLOR.slow });
  if (game.breakerTimer > 0) chips.push({ label: `BREAK ${Math.ceil(game.breakerTimer)}`, color: POWER_COLOR.breaker });
  if (game.multiTimer > 0) chips.push({ label: `x2 ${Math.ceil(game.multiTimer)}`, color: POWER_COLOR.multi });
  if (game.shields > 0) chips.push({ label: `SHIELD x${game.shields}`, color: POWER_COLOR.shield });
  if (game.lives > 0) chips.push({ label: `BALL x${game.lives + 1}`, color: "#d9f47a" });
  if (game.stall >= 3) chips.push({ label: `PRESSURE ${game.stall}`, color: "#ff7455" });
  if (!chips.length) return;

  context.save();
  context.font = "500 9px 'DM Mono', monospace";
  context.textBaseline = "middle";
  const widths = chips.map((chip) => context.measureText(chip.label).width + 16);
  const total = widths.reduce((sum, width) => sum + width, 0) + (chips.length - 1) * 6;
  let cursor = game.width / 2 - total / 2;
  const y = game.height - 34;
  chips.forEach((chip, index) => {
    const width = widths[index];
    context.fillStyle = "rgba(12, 20, 22, 0.72)";
    round(context, cursor, y - 8, width, 16, 8);
    context.fill();
    context.fillStyle = chip.color;
    context.textAlign = "center";
    context.fillText(chip.label, cursor + width / 2, y + 0.5);
    cursor += width + 6;
  });
  context.restore();
}

export function drawGame(context: CanvasRenderingContext2D, game: Game, status: GameStatus) {
  const { width, height, ball } = game;
  const inset = paddleInset(width);
  const edges = courtEdges(height);
  context.clearRect(0, 0, width, height);

  context.save();
  if (game.shake > 0) {
    context.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
  }

  context.strokeStyle = "rgba(229, 239, 229, 0.1)";
  context.lineWidth = 1.5;
  context.setLineDash([5, 11]);
  context.beginPath();
  context.moveTo(width / 2, 78);
  context.lineTo(width / 2, height - 36);
  context.stroke();
  context.setLineDash([]);
  context.beginPath();
  context.arc(width / 2, height / 2, Math.min(62, height * 0.12), 0, Math.PI * 2);
  context.stroke();

  context.fillStyle = "rgba(235, 245, 229, 0.08)";
  context.fillRect(inset, edges.ceiling, width - inset * 2, 1);
  context.fillStyle = "rgba(255, 108, 78, 0.7)";
  context.fillRect(inset, edges.floor, width - inset * 2, 1.5);

  if (game.flash) {
    const onLeft = game.flash.side === "left";
    const gradient = context.createLinearGradient(onLeft ? 0 : width, 0, onLeft ? 150 : width - 150, 0);
    gradient.addColorStop(0, `rgba(${onLeft ? "255, 108, 78" : "217, 244, 122"}, ${game.flash.life * 0.28})`);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = gradient;
    context.fillRect(onLeft ? 0 : width - 150, 0, 150, height);
  }

  for (const brick of game.bricks) {
    if (brick.alive) drawBrick(context, brick, width, height, game.time);
  }
  if (game.boss) drawBoss(context, game);
  drawHazards(context, game);

  for (const capsule of game.capsules) drawCapsule(context, game, capsule.kind, capsule.x, capsule.y, capsule.phase);

  const idle = status === "ready" ? Math.sin(game.time * 0.9) * 7 : 0;
  const expanded = game.expandTimer > 0;
  const headingLeft = game.ball.vx < 0;
  drawPaddle(context, inset, game.leftY + idle, game.paddleDrawH, "#ff7455", status === "playing" && headingLeft, expanded);
  drawPaddle(
    context,
    width - inset - PADDLE_WIDTH,
    game.rightY - idle,
    game.paddleDrawH,
    "#d9f47a",
    status === "playing" && !headingLeft && game.ball.vx > 0,
    expanded,
  );

  const ballY = status === "ready" ? ball.y + Math.sin(game.time * 2.4) * 8 : ball.y;
  if (status === "ready") {
    const gold = game.bricks.find((brick) => brick.alive && brick.type === "gold");
    if (gold) {
      const rect = brickRect(gold, width, height);
      context.strokeStyle = "rgba(217, 244, 122, 0.45)";
      context.setLineDash([3, 7]);
      context.beginPath();
      context.moveTo(ball.x + ball.radius + 4, ballY);
      context.lineTo(rect.x - 4, rect.y + rect.h / 2);
      context.stroke();
      context.setLineDash([]);
    }
  }

  for (const point of game.trail) {
    context.fillStyle = `rgba(255, 245, 222, ${(point.life / 0.42) * 0.28})`;
    context.beginPath();
    context.arc(point.x, point.y, ball.radius * (0.34 + point.life), 0, Math.PI * 2);
    context.fill();
  }
  for (const shard of game.shards) {
    context.save();
    context.globalAlpha = Math.max(0, shard.life / shard.maxLife);
    context.translate(shard.x, shard.y);
    context.rotate(shard.rot);
    context.fillStyle = shard.color;
    context.fillRect(-shard.w / 2, -shard.h / 2, shard.w, shard.h);
    context.restore();
  }
  for (const particle of game.particles) {
    context.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    context.fillStyle = particle.color;
    context.beginPath();
    context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;

  if (game.shields > 0) {
    context.strokeStyle = "rgba(247, 244, 234, 0.85)";
    context.lineWidth = 1.5;
    context.setLineDash([3, 3]);
    context.beginPath();
    context.arc(ball.x, ballY, ball.radius + 6, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
  }
  if (game.breakerTimer > 0) {
    context.strokeStyle = "rgba(255, 116, 85, 0.9)";
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(ball.x, ballY, ball.radius + 4, game.time * 4, game.time * 4 + Math.PI * 1.4);
    context.stroke();
  }

  const glow = context.createRadialGradient(ball.x, ballY, 0, ball.x, ballY, ball.radius * 3.4);
  glow.addColorStop(0, "rgba(255, 255, 224, 0.28)");
  glow.addColorStop(1, "rgba(255, 255, 224, 0)");
  context.fillStyle = glow;
  context.beginPath();
  context.arc(ball.x, ballY, ball.radius * 3.4, 0, Math.PI * 2);
  context.fill();
  context.shadowColor = "rgba(255, 248, 217, 0.85)";
  context.shadowBlur = 16;
  context.fillStyle = "#fff9e8";
  context.beginPath();
  context.arc(ball.x, ballY, ball.radius, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
  const facing = Math.sign(ball.vx || 1);
  context.fillStyle = "#ff7455";
  context.beginPath();
  context.arc(ball.x + facing * ball.radius * 0.2, ballY - ball.radius * 0.14, ball.radius * 0.26, 0, Math.PI * 2);
  context.fill();

  for (const floater of game.floaters) {
    context.globalAlpha = Math.min(1, (floater.life / floater.maxLife) * 1.5);
    context.fillStyle = floater.color;
    context.font = `600 ${floater.size}px 'Space Grotesk', sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(floater.text, floater.x, floater.y);
  }
  context.globalAlpha = 1;

  if (game.banner && status !== "ready") {
    const age = game.banner.maxLife - game.banner.life;
    const alpha = Math.min(1, age / 0.12, game.banner.life / 0.32);
    context.globalAlpha = alpha;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#f7f4ea";
    context.font = `700 ${Math.max(26, Math.min(44, width * 0.05))}px 'Space Grotesk', sans-serif`;
    context.fillText(game.banner.title, width / 2, height * 0.76);
    context.fillStyle = "#d9f47a";
    context.font = "500 11px 'DM Mono', monospace";
    context.fillText(game.banner.sub, width / 2, height * 0.76 + 28);
    context.globalAlpha = 1;
  }

  drawChips(context, game);
  context.restore();
}
