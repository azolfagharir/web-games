export interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  scored: boolean;
  moving: boolean;
  moveDir: number;
  moveSpeed: number;
  originalX: number;
}

export interface Powerup {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'fuel' | 'shield' | 'score';
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface GameState {
  carX: number;
  speed: number;
  score: number;
  level: number;
  gameOver: boolean;
  gameOverReason: string;
  obstacles: Obstacle[];
  powerups: Powerup[];
  particles: Particle[];
  fuel: number;
  lives: number;
  combo: number;
  comboDisplay: number;
  shakeAmount: number;
  leftPressed: boolean;
  rightPressed: boolean;
  startTime: number;
  elapsedTime: number;
  bestTime: number | null;
}