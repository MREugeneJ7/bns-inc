import { PAL, drawSprite } from './sprites';
import { CAR_SPRITES } from './vehicle';

// Cutscene de la carretera general: La Orotava a toda pastilla, subida en zigzag y llegada a Montaña Blanca.
export type RallyStage = 'rally' | 'climb' | 'arrival';
export interface RallyCutscene {
  stage: RallyStage;
  t: number;
}

/** Duración de cada tramo en fotogramas. */
export const RALLY_TIMES: Record<RallyStage, number> = { rally: 240, climb: 240, arrival: 150 };

/** Lo que se dice al llegar arriba, ya mareado. */
export const ORO_ARRIVAL_LINES = [
  'MONTAÑA BLANCA. Has subido la carretera general sin frenar ni una vez. Ni una.',
  'TU: Bueno... al menos esta vez no he potado como en el cayuco. Aunque los oídos me pitan.',
];

const rect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: number) => {
  ctx.fillStyle = PAL[c];
  ctx.fillRect(x, y, w, h);
};

const label = (ctx: CanvasRenderingContext2D, s: string, x: number, y: number, c: number) => {
  ctx.fillStyle = PAL[c];
  ctx.fillText(s, x, y);
};

function banner(ctx: CanvasRenderingContext2D, s: string) {
  const w = Math.min(312, s.length * 8 + 16);
  rect(ctx, 4, 6, w, 20, 3);
  rect(ctx, 6, 8, w - 4, 16, 0);
  label(ctx, s, 10, 13, 3);
}

function flower(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rect(ctx, x + 2, y, 3, 2, 3);
  rect(ctx, x, y + 2, 7, 2, 3);
  rect(ctx, x + 2, y + 4, 3, 2, 3);
  rect(ctx, x + 3, y + 2, 1, 2, 0);
}

function sandDots(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rect(ctx, x + 1, y + 1, 1, 1, 2);
  rect(ctx, x + 5, y + 4, 1, 1, 2);
  rect(ctx, x + 3, y + 6, 1, 1, 2);
}

/** Suelo de flores y arena que pasa a toda velocidad; más separado cuanto más cerca. */
function floralGround(ctx: CanvasRenderingContext2D, W: number, H: number, horizon: number, scroll: number) {
  rect(ctx, 0, horizon, W, H - horizon, 1);
  for (let y = horizon; y < H; y += 8) {
    const depth = (y - horizon) / 8;
    const step = 16 + depth * 4;
    for (let x = -32 + ((scroll + y * 3) % step); x < W; x += step) {
      const h = (Math.floor(x / 4) * 7 + y * 13) % 11;
      if (h < 3) flower(ctx, Math.round(x), y);
      else if (h < 5) sandDots(ctx, Math.round(x), y);
    }
  }
}

function drawRally(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  const horizon = 112;
  rect(ctx, 0, 0, W, horizon, 1);
  for (let i = 0; i < 4; i++) {
    const cloud = (((i * 97 - t * 6) % (W + 40)) + W + 40) % (W + 40) - 20;
    rect(ctx, cloud, 24 + i * 18, 24, 3, 2);
  }
  floralGround(ctx, W, H, horizon, (t * 9) % 64);
  // Asfalto en perspectiva que serpentea por la Orotava
  for (let y = horizon; y < H; y++) {
    const k = (y - horizon) / (H - horizon);
    const half = 8 + k * 110;
    const cx = 160 + Math.round(Math.sin(t * 0.05 + k * 2) * 6 * k);
    rect(ctx, Math.round(cx - half), y, Math.round(half * 2), 1, 2);
    rect(ctx, Math.round(cx - half), y, 2, 1, 3);
    rect(ctx, Math.round(cx + half) - 2, y, 2, 1, 3);
    if (Math.floor(y + t * 8) % 14 < 6) rect(ctx, cx - 1, y, 2, 1, 0);
  }
  ctx.save();
  ctx.translate(136 + Math.round(Math.sin(t * 0.7) * 2), 196);
  ctx.scale(2, 2);
  drawSprite(ctx, CAR_SPRITES.up, 0, 0);
  ctx.restore();
  rect(ctx, 200, 260, 104, 18, 3);
  rect(ctx, 202, 262, 100, 14, 0);
  label(ctx, `${180 + Math.round(Math.sin(t * 0.1) * 20)} KM/H`, 208, 266, 3);
  banner(ctx, 'LA OROTAVA · A TOPE!!');
}

function drawClimb(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  rect(ctx, 0, 0, W, H, 1);
  floralGround(ctx, W, H, 0, (t * 2) % 64);
  // Zigzag de la carretera general subiendo a Montaña Blanca
  for (let y = 0; y < H; y++) {
    const k = y / H;
    const cx = 160 + Math.round(Math.sin(y * 0.045 + t * 0.035) * 58);
    const half = 14 + k * 26;
    rect(ctx, Math.round(cx - half), y, Math.round(half * 2), 1, 2);
    rect(ctx, Math.round(cx - half), y, 2, 1, 3);
    rect(ctx, Math.round(cx + half) - 2, y, 2, 1, 3);
    if (Math.floor(y + t * 6) % 12 < 5) rect(ctx, cx - 1, y, 2, 1, 0);
  }
  ctx.save();
  ctx.translate(144, 200);
  ctx.scale(2, 2);
  drawSprite(ctx, CAR_SPRITES.up, 0, 0);
  ctx.restore();
  banner(ctx, 'CARRETERA GENERAL · SUBIDA');
}

function drawArrival(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  rect(ctx, 0, 0, W, H, 1);
  // Cumbre con su capa de nieve
  for (let y = 36; y < 120; y++) {
    const half = (y - 36) * 0.9;
    rect(ctx, Math.round(160 - half), y, Math.round(half * 2), 1, 2);
    if (y < 56) rect(ctx, Math.round(160 - half * 0.5), y, Math.round(half), 1, 0);
  }
  rect(ctx, 52, 86, 216, 40, 3);
  rect(ctx, 56, 90, 208, 32, 0);
  label(ctx, 'MONTAÑA BLANCA', 70, 106, 3);
  // El coche se bambolea mientras el mareo sube
  const swing = Math.sin(t * 0.25) * Math.min(t, 80) / 16;
  ctx.save();
  ctx.translate(136 + Math.round(swing), 176);
  ctx.scale(2, 2);
  drawSprite(ctx, CAR_SPRITES.right, 0, 0);
  ctx.restore();
  // Estrellitas girando alrededor de la cabeza
  if (t > 20) {
    for (let k = 0; k < 3; k++) {
      const a = t * 0.15 + (k * 2 * Math.PI) / 3;
      rect(ctx, Math.round(152 + Math.cos(a) * 16), Math.round(168 + Math.sin(a) * 4), 3, 3, 0);
    }
  }
  // Pitido de oídos
  if (t > 60 && Math.floor(t / 6) % 2 === 0) label(ctx, 'PIIIIIIIIII', 96, 232, 3);
  banner(ctx, 'LLEGADA · MONTAÑA BLANCA');
}

export function drawOrotavaRally(ctx: CanvasRenderingContext2D, W: number, H: number, stage: RallyStage, t: number) {
  if (stage === 'rally') drawRally(ctx, W, H, t);
  else if (stage === 'climb') drawClimb(ctx, W, H, t);
  else drawArrival(ctx, W, H, t);
}
