import { Ball, Particle } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { getBallColor } from '../config/ballColors';
import { clamp, computeDynamicRadii } from '../utils/math';

export interface MergeResult {
  updatedBalls: Ball[];
  newBall: Ball;
  scoreGained: number;
  wasBlackNumber: boolean;
  particles: Particle[];
}

export class MergeEngine {
  private minX: number;
  private minY: number;
  private maxX: number;
  private maxY: number;

  constructor() {
    const border = GAME_CONFIG.BOARD_BORDER_THICKNESS;
    this.minX = border;
    this.minY = border;
    this.maxX = GAME_CONFIG.BOARD_WIDTH - border;
    this.maxY = GAME_CONFIG.BOARD_HEIGHT - border;
  }

  public executeMerge(
    ball1: Ball,
    ball2: Ball,
    currentBalls: Ball[],
    _comboCount: number = 0
  ): MergeResult {
    const newValue = ball1.value * 2;
    const scoreGained = newValue;

    // Only the unique cue ball carries isBlackNumber
    const wasBlackNumber = Boolean(ball1.isBlackNumber || ball2.isBlackNumber);

    // Center of mass
    let mergedX = (ball1.x + ball2.x) * 0.5;
    let mergedY = (ball1.y + ball2.y) * 0.5;

    const r = GAME_CONFIG.BASE_BALL_RADIUS;
    mergedX = clamp(mergedX, this.minX + r, this.maxX - r);
    mergedY = clamp(mergedY, this.minY + r, this.maxY - r);

    // Momentum conservation
    const mergedVx = (ball1.vx + ball2.vx) * 0.55;
    const mergedVy = (ball1.vy + ball2.vy) * 0.55;

    const remainingBalls = currentBalls.filter(
      (b) => b.id !== ball1.id && b.id !== ball2.id
    );

    const newBall: Ball = {
      id: `ball_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      value: newValue,
      x: mergedX,
      y: mergedY,
      vx: mergedVx,
      vy: mergedVy,
      radius: r,
      mass: GAME_CONFIG.BALL_MASS,
      isMoving: Math.abs(mergedVx) > 0.1 || Math.abs(mergedVy) > 0.1,
      isMerging: false,
      mergeCooldown: 8,
      scale: 1.25,
      // Exactly ONE black ball exists: it stays black if it merged!
      isBlackNumber: wasBlackNumber,
    };

    const updatedBalls = [...remainingBalls, newBall];

    // Dynamically scale ball radii: max ball becomes subtly larger, smaller balls subtly smaller
    computeDynamicRadii(updatedBalls);

    // Create particle sparkles (no text)
    const ballColor = getBallColor(newValue);
    const particles: Particle[] = [];
    const particleCount = wasBlackNumber ? 16 : 10;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5);
      const speed = 1.5 + Math.random() * 3.0;
      particles.push({
        id: `p_${Date.now()}_${i}`,
        x: mergedX,
        y: mergedY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 2.0,
        alpha: 1.0,
        color: wasBlackNumber
          ? (i % 2 === 0 ? '#FFD700' : '#111111')
          : (i % 2 === 0 ? ballColor.primary : '#FFFFFF'),
        life: 20,
      });
    }

    return {
      updatedBalls,
      newBall,
      scoreGained,
      wasBlackNumber,
      particles,
    };
  }
}

export const mergeEngine = new MergeEngine();
