export interface Ball {
  id: string;
  value: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  isMoving: boolean;
  isMerging: boolean;
  mergeCooldown: number;
  scale?: number;
  isBlackNumber?: boolean;
  trail?: { x: number; y: number }[]; // Motion trail history points
}

export type GamePhase =
  | 'ready'
  | 'aiming'
  | 'simulating'
  | 'resolving'
  | 'gameover';

export interface GameState {
  balls: Ball[];
  score: number;
  record: number;
  life: number;
  maxLife: number;
  phase: GamePhase;
  selectedBallId: string | null;
  shots: number;
  merges: number;
  turnMerges: number;
  turnBlackMerges: number;
  maxBallValue: number;
  soundEnabled: boolean;
}

export interface AimData {
  startBall: Ball;
  dirX: number;
  dirY: number;
  power: number; // 0 to 1
  speed: number;
  hasCollision: boolean;
  collisionType?: 'ball' | 'wall' | 'none';
  destX?: number;
  destY?: number;
  ghostX?: number;
  ghostY?: number;
  hitTargetId?: string;
  targetDirX?: number;
  targetDirY?: number;
  cueDeflectX?: number;
  cueDeflectY?: number;
  wallNormalX?: number;
  wallNormalY?: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  alpha: number;
  scale: number;
  color: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
  life: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface GameStats {
  gamesPlayed: number;
  highScore: number;
  maxBallAchieved: number;
  totalMerges: number;
  totalShots: number;
  maxCombo: number;
}
