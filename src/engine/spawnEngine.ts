import { Ball } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { distance, computeDynamicRadii } from '../utils/math';

export class SpawnEngine {
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

  /**
   * Starts with clean board containing only two '2' balls:
   * Exactly 1 black number ball (player's cue ball), and 1 white number ball.
   */
  public createInitialBalls(): Ball[] {
    const r = GAME_CONFIG.BASE_BALL_RADIUS;
    const initialBalls: Ball[] = [
      {
        id: `ball_cue_${Date.now()}`,
        value: 2,
        x: 230,
        y: 280,
        vx: 0,
        vy: 0,
        radius: r,
        mass: GAME_CONFIG.BALL_MASS,
        isMoving: false,
        isMerging: false,
        mergeCooldown: 0,
        scale: 1.0,
        isBlackNumber: true, // The unique player controllable black number ball!
      },
      {
        id: `ball_target_${Date.now() + 1}`,
        value: 2,
        x: 330,
        y: 280,
        vx: 0,
        vy: 0,
        radius: r,
        mass: GAME_CONFIG.BALL_MASS,
        isMoving: false,
        isMerging: false,
        mergeCooldown: 0,
        scale: 1.0,
        isBlackNumber: false, // Standard white number ball
      },
    ];

    computeDynamicRadii(initialBalls);
    return initialBalls;
  }

  /**
   * Spawns a new white-number ball with value 2 in an empty safe spot on the board
   */
  public spawnReplenishmentBall(existingBalls: Ball[], forceValue: number = 2): Ball | null {
    const r = GAME_CONFIG.BASE_BALL_RADIUS;
    const padding = 14;

    const playMinX = this.minX + r + padding;
    const playMinY = this.minY + r + padding;
    const playMaxX = this.maxX - r - padding;
    const playMaxY = this.maxY - r - padding;

    const chosenValue = forceValue;

    // Try finding an empty position
    const maxTries = 80;
    const minSafeDist = r * 2 + 10;

    for (let tryCount = 0; tryCount < maxTries; tryCount++) {
      const candidateX = playMinX + Math.random() * (playMaxX - playMinX);
      const candidateY = playMinY + Math.random() * (playMaxY - playMinY);

      const hasConflict = existingBalls.some(
        (b) => distance(candidateX, candidateY, b.x, b.y) < minSafeDist
      );

      if (!hasConflict) {
        const newBall: Ball = {
          id: `ball_spawn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          value: chosenValue,
          x: candidateX,
          y: candidateY,
          vx: 0,
          vy: 0,
          radius: r,
          mass: GAME_CONFIG.BALL_MASS,
          isMoving: false,
          isMerging: false,
          mergeCooldown: 0,
          scale: 0.985,
          isBlackNumber: false, // All other balls are strictly white number balls
        };

        const allBalls = [...existingBalls, newBall];
        computeDynamicRadii(allBalls);
        return newBall;
      }
    }

    // Fallback: slight tolerance if board is crowded
    const fallbackSafeDist = r * 2 + 2;
    for (let tryCount = 0; tryCount < 40; tryCount++) {
      const candidateX = playMinX + Math.random() * (playMaxX - playMinX);
      const candidateY = playMinY + Math.random() * (playMaxY - playMinY);

      const hasConflict = existingBalls.some(
        (b) => distance(candidateX, candidateY, b.x, b.y) < fallbackSafeDist
      );

      if (!hasConflict) {
        const newBall: Ball = {
          id: `ball_spawn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          value: chosenValue,
          x: candidateX,
          y: candidateY,
          vx: 0,
          vy: 0,
          radius: r,
          mass: GAME_CONFIG.BALL_MASS,
          isMoving: false,
          isMerging: false,
          mergeCooldown: 0,
          scale: 0.985,
          isBlackNumber: false,
        };

        const allBalls = [...existingBalls, newBall];
        computeDynamicRadii(allBalls);
        return newBall;
      }
    }

    return null;
  }
}

export const spawnEngine = new SpawnEngine();
