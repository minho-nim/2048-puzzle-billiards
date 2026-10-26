import { Ball, AimData } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { rayCircleIntersection, rayBoxIntersection, normalize, dot, clamp } from '../utils/math';

export class AimEngine {
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
   * Calculates the aiming trajectory, ghost ball, and deflection lines.
   * @param ball The ball being aimed
   * @param dragVector {dx, dy} drag offset from ball position
   * @param balls All other balls currently on the board
   * @param mode 'slingshot' (default: pull back to shoot forward) or 'direct'
   */
  public calculateAim(
    ball: Ball,
    dragVector: { dx: number; dy: number },
    balls: Ball[],
    mode: 'slingshot' | 'direct' = GAME_CONFIG.CONTROL_MODE
  ): AimData | null {
    // Determine launch vector based on mode
    let launchDx = mode === 'slingshot' ? -dragVector.dx : dragVector.dx;
    let launchDy = mode === 'slingshot' ? -dragVector.dy : dragVector.dy;

    const dragDist = Math.sqrt(dragVector.dx * dragVector.dx + dragVector.dy * dragVector.dy);

    if (dragDist < GAME_CONFIG.MIN_DRAG_DISTANCE) {
      return null;
    }

    const { x: dirX, y: dirY } = normalize(launchDx, launchDy);
    // Drag distance selects direction only; every valid shot uses the same speed.
    const power = 1;
    const speed = GAME_CONFIG.MAX_LAUNCH_SPEED;

    const r = ball.radius;
    const playMinX = this.minX + r;
    const playMinY = this.minY + r;
    const playMaxX = this.maxX - r;
    const playMaxY = this.maxY - r;

    // 1. Raycast against walls
    const wallHit = rayBoxIntersection(
      ball.x,
      ball.y,
      dirX,
      dirY,
      playMinX,
      playMinY,
      playMaxX,
      playMaxY
    );

    let nearestT = wallHit.hit ? wallHit.t : 1000;
    let hitType: 'ball' | 'wall' | 'none' = wallHit.hit ? 'wall' : 'none';
    let ghostX = ball.x + dirX * nearestT;
    let ghostY = ball.y + dirY * nearestT;
    let hitBall: Ball | null = null;
    let wallNormalX = wallHit.normalX;
    let wallNormalY = wallHit.normalY;

    // 2. Raycast against other balls
    for (const other of balls) {
      if (other.id === ball.id) continue;

      const effectiveRadius = ball.radius + other.radius;
      const circleHit = rayCircleIntersection(
        ball.x,
        ball.y,
        dirX,
        dirY,
        other.x,
        other.y,
        effectiveRadius
      );

      if (circleHit.hit && circleHit.t < nearestT) {
        nearestT = circleHit.t;
        hitType = 'ball';
        ghostX = circleHit.pointX;
        ghostY = circleHit.pointY;
        hitBall = other;
      }
    }

    // Preview the fixed-strength shot.
    const maxAimDist = 520;

    const reachesTarget = nearestT <= maxAimDist && hitType !== 'none';
    const finalHitType = reachesTarget ? hitType : 'none';
    const destX = reachesTarget ? ghostX : ball.x + dirX * maxAimDist;
    const destY = reachesTarget ? ghostY : ball.y + dirY * maxAimDist;

    const aimData: AimData = {
      startBall: ball,
      dirX,
      dirY,
      power,
      speed,
      hasCollision: reachesTarget,
      collisionType: finalHitType,
      destX,
      destY,
      ghostX: reachesTarget ? ghostX : undefined,
      ghostY: reachesTarget ? ghostY : undefined,
    };

    if (reachesTarget && hitType === 'ball' && hitBall) {
      aimData.hitTargetId = hitBall.id;

      // Normal vector from ghost cue ball to target ball
      const { x: normX, y: normY } = normalize(hitBall.x - ghostX, hitBall.y - ghostY);

      // Tangent vector
      let tangX = -normY;
      let tangY = normX;

      // Ensure tangent aligns with cue ball direction
      if (dot(dirX, dirY, tangX, tangY) < 0) {
        tangX = -tangX;
        tangY = -tangY;
      }

      // Decompose incoming velocity
      const velNormal = dot(dirX * speed, dirY * speed, normX, normY);
      const velTang = dot(dirX * speed, dirY * speed, tangX, tangY);

      // Target ball receives impulse along collision normal
      aimData.targetDirX = normX;
      aimData.targetDirY = normY;

      // Cue ball deflects along tangent
      aimData.cueDeflectX = tangX;
      aimData.cueDeflectY = tangY;
    } else if (reachesTarget && hitType === 'wall') {
      // Reflection vector
      const reflectDot = dot(dirX, dirY, wallNormalX, wallNormalY);
      const refX = dirX - 2 * reflectDot * wallNormalX;
      const refY = dirY - 2 * reflectDot * wallNormalY;
      const { x: normRefX, y: normRefY } = normalize(refX, refY);

      aimData.cueDeflectX = normRefX;
      aimData.cueDeflectY = normRefY;
      aimData.wallNormalX = wallNormalX;
      aimData.wallNormalY = wallNormalY;
    }

    return aimData;
  }
}

export const aimEngine = new AimEngine();
