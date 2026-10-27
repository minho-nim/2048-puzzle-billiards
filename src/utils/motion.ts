import { GAME_CONFIG } from '../config/gameConfig';

// Remove the forward collision component, retaining a short tangent roll.
// Shared by collisions, merges, and the cue's deflection preview.
export function getDirectCueDeflection(vx: number, vy: number, nx: number, ny: number) {
  const normalSpeed = Math.max(0, vx * nx + vy * ny);
  const tx = vx - nx * normalSpeed;
  const ty = vy - ny * normalSpeed;
  const tangentSpeed = Math.hypot(tx, ty);
  if (tangentSpeed === 0) return { x: 0, y: 0 };
  const residualSpeed = Math.min(
    tangentSpeed * GAME_CONFIG.DIRECT_CUE_TANGENT_RETENTION,
    GAME_CONFIG.DIRECT_CUE_MAX_RESIDUAL_SPEED,
  ) * GAME_CONFIG.IMPACT_VELOCITY_RETENTION;
  if (residualSpeed <= GAME_CONFIG.VELOCITY_STOP_THRESHOLD) return { x: 0, y: 0 };
  return { x: tx / tangentSpeed * residualSpeed, y: ty / tangentSpeed * residualSpeed };
}

export function getDeflectionPreviewLength(speed: number) {
  return Math.max(0, (speed * speed - GAME_CONFIG.VELOCITY_STOP_THRESHOLD ** 2)
    * 60 / (2 * GAME_CONFIG.BRAKE_DECELERATION));
}
