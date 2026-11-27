export const PADDLE_WIDTH = 12;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function paddleInset(width: number) {
  return clamp(width * 0.042, 19, 32);
}

export function ballRadius(width: number) {
  return clamp(width * 0.0185, 9, 13);
}

export function courtEdges(height: number) {
  return { ceiling: 16, floor: height - 16 };
}
