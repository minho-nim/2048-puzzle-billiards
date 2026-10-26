import { Ball } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { clamp, computeDynamicRadii } from '../utils/math';

export interface MergeResult {
  updatedBalls: Ball[];
  newBall: Ball;
  scoreGained: number;
  wasBlackNumber: boolean;
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
      scale: 0.94,
      // Exactly ONE black ball exists: it stays black if it merged!
      isBlackNumber: wasBlackNumber,
    };

    const updatedBalls = [...remainingBalls, newBall];

    // Dynamically scale ball radii: max ball becomes subtly larger, smaller balls subtly smaller
    computeDynamicRadii(updatedBalls);
    newBall.x = clamp(newBall.x, this.minX + newBall.radius, this.maxX - newBall.radius);
    newBall.y = clamp(newBall.y, this.minY + newBall.radius, this.maxY - newBall.radius);

    return {
      updatedBalls,
      newBall,
      scoreGained,
      wasBlackNumber,
    };
  }
}

export const mergeEngine = new MergeEngine();
