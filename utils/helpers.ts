export function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const remainingS = s % 60;
  return `${String(m).padStart(2, '0')}:${String(remainingS).padStart(2, '0')}`;
}

export function randomColor(): string {
  const colors = ['#ff4757', '#ff6b81', '#eccc68', '#7bed9f', '#70a1ff', '#a29bfe', '#ff6348', '#2ed573'];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function collide(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// Constants
export const CANVAS_W = 400;
export const CANVAS_H = 600;
export const CAR_W = 38;
export const CAR_H = 62;
export const ROAD_W = 280;
export const ROAD_L = (CANVAS_W - ROAD_W) / 2;
export const CAR_Y = CANVAS_H - CAR_H - 35;
export const MAX_LIVES = 3;
export const MAX_FUEL = 150;