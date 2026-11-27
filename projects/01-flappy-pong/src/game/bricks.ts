import type { Brick, BrickType, Game } from "./types";
import { PADDLE_WIDTH, clamp, paddleInset } from "./util";

export type BrickStyle = { fill: string; edge: string; damaged: string; ink: string };

export const BRICK_STYLE: Record<BrickType, BrickStyle> = {
  clay: { fill: "#f4e2c6", edge: "#c9b08d", damaged: "#f4e2c6", ink: "#e7d0ae" },
  coral: { fill: "#ff7455", edge: "#d24c30", damaged: "#ff7455", ink: "#ffc3b6" },
  lime: { fill: "#d9f47a", edge: "#a8c64e", damaged: "#b7d15a", ink: "#f4ffc7" },
  gold: { fill: "#f2c14e", edge: "#c89022", damaged: "#f2c14e", ink: "#ffe7a8" },
  steel: { fill: "#9aadb4", edge: "#667880", damaged: "#9aadb4", ink: "#d5e1e5" },
  bomb: { fill: "#ff8b5d", edge: "#d85b34", damaged: "#ff8b5d", ink: "#fff0e8" },
};

export type Rect = { x: number; y: number; w: number; h: number };

export function brickRect(brick: Brick, width: number, height: number): Rect {
  const w = brick.nw * width;
  const h = brick.nh * height;
  return { x: brick.nx * width - w / 2, y: brick.ny * height - h / 2, w, h };
}

export function bricksLeft(bricks: Brick[]) {
  return bricks.filter((brick) => brick.alive && brick.type !== "steel").length;
}

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function fieldFor(width: number, height: number, wave: number) {
  const inset = paddleInset(width);
  const sideLane = clamp(width * 0.105, 44, 96);
  const left = inset + PADDLE_WIDTH + sideLane;
  const right = width - left;
  const flank = clamp(96 - wave * 4.5, 52, 96);
  const top = Math.max(84, flank);
  const bottom = height - Math.max(52, flank * 0.82);
  return { left, right, top, bottom, fw: Math.max(120, right - left), fh: Math.max(86, bottom - top) };
}

function makePattern(wave: number, cols: number, rows: number) {
  const grid: (BrickType | null)[][] = Array.from({ length: rows }, () => Array<BrickType | null>(cols).fill(null));
  const style = (wave - 1) % 8;
  const midC = (cols - 1) / 2;
  const midR = (rows - 1) / 2;
  const paint = (type: BrickType, at: (row: number, col: number) => boolean) => {
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (at(row, col)) grid[row][col] = type;
      }
    }
  };

  if (style === 0) {
    const colors: BrickType[] = ["coral", "clay", "coral", "clay"];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) grid[row][col] = colors[row % colors.length];
    }
    grid[Math.min(1, rows - 1)][Math.floor(cols / 2)] = "gold";
    grid[rows - 1][Math.floor(midC)] = null;
  } else if (style === 1) {
    paint("clay", (row, col) => (row + col) % 2 === 0);
    paint("coral", (row, col) => row === 0 && (row + col) % 2 === 1);
    grid[Math.floor(midR)][Math.floor(midC)] = "gold";
  } else if (style === 2) {
    paint("clay", (row, col) => Math.abs(col - midC) <= (row / Math.max(1, rows - 1)) * midC + 0.2);
    paint("coral", (row, col) => row === rows - 1 && grid[row][col] === "clay");
    const peakCol = Math.round(midC);
    grid[0][clampIndex(peakCol, cols)] = "gold";
  } else if (style === 3) {
    paint("lime", (_row, col) => col === 0 || col === cols - 1);
    paint("clay", (row, col) => col > 0 && col < cols - 1 && row !== Math.floor(midR));
    paint("coral", (row, col) => row === 0 && col > 0 && col < cols - 1);
    grid[0][Math.floor(midC)] = "gold";
  } else if (style === 4) {
    paint("coral", (row, col) => {
      const reach = Math.abs(col - midC) / Math.max(0.5, midC) + Math.abs(row - midR) / Math.max(0.5, midR);
      return reach <= 1.02;
    });
    paint("clay", (row, col) => grid[row][col] === "coral" && (row + col) % 3 === 0);
    grid[Math.round(midR)][Math.round(midC)] = "gold";
    if (wave >= 5) grid[clampIndex(Math.round(midR) + 1, rows)][clampIndex(Math.round(midC) - 1, cols)] = "bomb";
  } else if (style === 5) {
    paint("clay", () => true);
    paint("steel", (row, col) => (row === 0 || row === rows - 1) && Math.abs(col - midC) > 0.85);
    paint("coral", (row, col) => row > 0 && row < rows - 1 && (col === 1 || col === cols - 2));
    grid[Math.floor(midR)][Math.floor(midC)] = "bomb";
    grid[Math.max(0, Math.floor(midR) - 1)][clampIndex(Math.floor(midC) + 1, cols)] = "gold";
  } else if (style === 6) {
    const rowColors: BrickType[] = ["coral", "clay", "lime", "coral", "clay"];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) grid[row][col] = rowColors[row % rowColors.length];
      grid[row][(row * 2 + 1) % cols] = null;
    }
    grid[0][Math.min(cols - 1, 2)] = "gold";
    if (rows > 2) grid[rows - 1][0] = "bomb";
  } else {
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const roll = hash(wave * 17 + row * 13 + col * 5);
        if (roll < 0.18) grid[row][col] = null;
        else if (roll < 0.42) grid[row][col] = "coral";
        else if (roll < 0.62) grid[row][col] = "lime";
        else if (roll < 0.74) grid[row][col] = "steel";
        else grid[row][col] = "clay";
      }
      if (grid[row].every((cell) => cell === "steel" || cell === null)) grid[row][Math.floor(midC)] = "clay";
    }
    grid[0][Math.floor(midC)] = "gold";
    grid[rows - 1][cols - 1] = "bomb";
  }

  if (wave >= 6) {
    let flips = wave >= 10 ? 4 : 2;
    for (let row = 0; row < rows && flips > 0; row += 1) {
      for (let col = 0; col < cols && flips > 0; col += 1) {
        if (grid[row][col] === "clay" && (row * cols + col) % 2 === 0) {
          grid[row][col] = "lime";
          flips -= 1;
        }
      }
    }
  }

  if (!grid.some((row) => row.includes("gold"))) grid[0][Math.floor(midC)] = "gold";
  if (!grid.some((row) => row.some((cell) => cell && cell !== "steel"))) {
    grid[Math.floor(midR)][Math.floor(midC)] = "clay";
  }
  return grid;
}

function clampIndex(value: number, length: number) {
  return Math.max(0, Math.min(length - 1, value));
}

export function spawnWave(game: Game, wave: number) {
  const { width, height } = game;
  const field = fieldFor(width, height, wave);
  const gap = clamp(width * 0.012, 8, 12);
  const rowCap = wave === 1 ? 3 : wave < 4 ? 4 : 5;
  const colCap = wave === 1 ? 8 : 9;
  let cols = clamp(Math.round(field.fw / 78), 4, colCap);
  let rows = clamp(Math.round(field.fh / 34), 3, rowCap);
  let bw = (field.fw - gap * (cols - 1)) / cols;
  while (bw > 86 && cols < colCap) {
    cols += 1;
    bw = (field.fw - gap * (cols - 1)) / cols;
  }
  while (bw < 40 && cols > 4) {
    cols -= 1;
    bw = (field.fw - gap * (cols - 1)) / cols;
  }
  let bh = (field.fh - gap * (rows - 1)) / rows;
  while (bh < 16 && rows > 3) {
    rows -= 1;
    bh = (field.fh - gap * (rows - 1)) / rows;
  }
  bh = Math.min(bh, 24);
  const usedH = rows * bh + (rows - 1) * gap;
  const originY = field.top + Math.max(0, (field.fh - usedH) / 2);
  const pattern = makePattern(wave, cols, rows);
  const bricks: Brick[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const type = pattern[row][col];
      if (!type) continue;
      const x = field.left + col * (bw + gap);
      const y = originY + row * (bh + gap);
      const maxHp = type === "lime" ? 2 : type === "steel" ? 99 : 1;
      bricks.push({
        nx: (x + bw / 2) / width,
        ny: (y + bh / 2) / height,
        nw: bw / width,
        nh: bh / height,
        type,
        hp: maxHp,
        maxHp,
        alive: true,
        cooldown: 0,
        flash: 0,
      });
    }
  }
  game.bricks = bricks;
}
