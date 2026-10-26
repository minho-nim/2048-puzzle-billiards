import { Ball } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { dot } from '../utils/math';

export interface CollisionEvent {
  type: 'ball' | 'wall';
  intensity: number;
  ballId1: string;
  ballId2?: string;
}

export interface MergeCandidate {
  ball1: Ball;
  ball2: Ball;
}

export interface PhysicsStepResult {
  balls: Ball[];
  collisions: CollisionEvent[];
  merges: MergeCandidate[];
  isAllStopped: boolean;
}

export class PhysicsEngine {
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
   * Advances the physics simulation by 1 frame using sub-steps to ensure high fidelity
   * and prevent tunneling at high velocities.
   */
  public step(balls: Ball[], substeps: number = 4): PhysicsStepResult {
    const collisions: CollisionEvent[] = [];
    const merges: MergeCandidate[] = [];
    const mergedBallIds = new Set<string>();

    const subDt = 1 / (GAME_CONFIG.PHYSICS_HZ * substeps);
    // Exponential decay equivalent to friction factor
    const frictionFactor = Math.pow(GAME_CONFIG.FRICTION, 1 / substeps);

    for (let s = 0; s < substeps; s++) {
      if (s === 0) {
        for (const ball of balls) {
          if (!ball.isBlackNumber) continue;
          if (!ball.trail) ball.trail = [];
          if (ball.isMoving) {
            ball.trail.unshift({ x: ball.x, y: ball.y });
            if (ball.trail.length > 36) ball.trail.pop();
          } else if (ball.trail.length > 0) {
            ball.trail.pop();
          }
        }
      }

      // 1. Position update & friction
      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];
        if (mergedBallIds.has(b.id)) continue;

        if (b.isMoving) {
          b.x += b.vx * (subDt * 60);
          b.y += b.vy * (subDt * 60);

          b.vx *= frictionFactor;
          b.vy *= frictionFactor;

          const speedSq = b.vx * b.vx + b.vy * b.vy;
          if (speedSq < GAME_CONFIG.VELOCITY_STOP_THRESHOLD * GAME_CONFIG.VELOCITY_STOP_THRESHOLD) {
            b.vx = 0;
            b.vy = 0;
            b.isMoving = false;
          }
        }
      }

      // 2. Wall collisions
      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];
        if (mergedBallIds.has(b.id)) continue;

        const r = b.radius;
        let hitWall = false;
        let speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);

        // Left wall
        if (b.x - r < this.minX) {
          b.x = this.minX + r;
          if (b.vx < 0) {
            b.vx = -b.vx * GAME_CONFIG.WALL_RESTITUTION;
            hitWall = true;
          }
        }
        // Right wall
        else if (b.x + r > this.maxX) {
          b.x = this.maxX - r;
          if (b.vx > 0) {
            b.vx = -b.vx * GAME_CONFIG.WALL_RESTITUTION;
            hitWall = true;
          }
        }

        // Top wall
        if (b.y - r < this.minY) {
          b.y = this.minY + r;
          if (b.vy < 0) {
            b.vy = -b.vy * GAME_CONFIG.WALL_RESTITUTION;
            hitWall = true;
          }
        }
        // Bottom wall
        else if (b.y + r > this.maxY) {
          b.y = this.maxY - r;
          if (b.vy > 0) {
            b.vy = -b.vy * GAME_CONFIG.WALL_RESTITUTION;
            hitWall = true;
          }
        }

        if (hitWall && speed > 0.5) {
          collisions.push({
            type: 'wall',
            intensity: Math.min(1.0, speed / 15),
            ballId1: b.id,
          });
        }
      }

      // 3. Ball-to-ball collisions & merges
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const b1 = balls[i];
          const b2 = balls[j];

          if (mergedBallIds.has(b1.id) || mergedBallIds.has(b2.id)) continue;

          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const minDist = b1.radius + b2.radius;
          const distSq = dx * dx + dy * dy;

          if (distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq);
            // Overlapping or colliding
            const nx = dist > 0.0001 ? dx / dist : 1;
            const ny = dist > 0.0001 ? dy / dist : 0;

            // Relative velocity
            const rvx = b2.vx - b1.vx;
            const rvy = b2.vy - b1.vy;
            const velAlongNormal = dot(rvx, rvy, nx, ny);

            // Separate overlapping balls
            const overlap = minDist - dist;
            const separation = overlap * 0.5;
            b1.x -= nx * separation;
            b1.y -= ny * separation;
            b2.x += nx * separation;
            b2.y += ny * separation;

            // Check merge condition: same value & relative velocity approaching
            if (b1.value === b2.value && !b1.isMerging && !b2.isMerging) {
              merges.push({ ball1: b1, ball2: b2 });
              mergedBallIds.add(b1.id);
              mergedBallIds.add(b2.id);
              continue;
            }

            // Normal elastic collision impulse
            if (velAlongNormal < 0) {
              const restitution = GAME_CONFIG.RESTITUTION;
              const impulseScalar = (-(1 + restitution) * velAlongNormal) / (1 / b1.mass + 1 / b2.mass);

              const ix = impulseScalar * nx;
              const iy = impulseScalar * ny;

              b1.vx -= (ix / b1.mass);
              b1.vy -= (iy / b1.mass);
              b2.vx += (ix / b2.mass);
              b2.vy += (iy / b2.mass);

              b1.isMoving = (b1.vx * b1.vx + b1.vy * b1.vy) > GAME_CONFIG.VELOCITY_STOP_THRESHOLD * GAME_CONFIG.VELOCITY_STOP_THRESHOLD;
              b2.isMoving = (b2.vx * b2.vx + b2.vy * b2.vy) > GAME_CONFIG.VELOCITY_STOP_THRESHOLD * GAME_CONFIG.VELOCITY_STOP_THRESHOLD;

              const relativeSpeed = Math.abs(velAlongNormal);
              if (relativeSpeed > 0.4) {
                collisions.push({
                  type: 'ball',
                  intensity: Math.min(1.0, relativeSpeed / 15),
                  ballId1: b1.id,
                  ballId2: b2.id,
                });
              }
            }
          }
        }
      }
    }

    // Determine if all balls are now stopped
    const isAllStopped = balls.every(
      (b) => !b.isMoving || (Math.abs(b.vx) < GAME_CONFIG.VELOCITY_STOP_THRESHOLD && Math.abs(b.vy) < GAME_CONFIG.VELOCITY_STOP_THRESHOLD)
    );

    if (isAllStopped) {
      balls.forEach((b) => {
        b.vx = 0;
        b.vy = 0;
        b.isMoving = false;
      });
    }

    return {
      balls,
      collisions,
      merges,
      isAllStopped,
    };
  }
}

export const physicsEngine = new PhysicsEngine();
