import { GAME_CONFIG } from '../config/gameConfig';

// Remove the forward collision component, preserving real tangent momentum.
// Shared by collisions, merges, and the cue's deflection preview.
export function getDirectCueDeflection(vx: number, vy: number, nx: number, ny: number) {
  const normalSpeed = Math.max(0, vx * nx + vy * ny);
  const tx = vx - nx * normalSpeed;
  const ty = vy - ny * normalSpeed;
  const tangentSpeed = Math.hypot(tx, ty);
  if (tangentSpeed === 0) return { x: 0, y: 0 };
  const residualSpeed = tangentSpeed * GAME_CONFIG.IMPACT_VELOCITY_RETENTION;
  if (residualSpeed <= GAME_CONFIG.VELOCITY_STOP_THRESHOLD) return { x: 0, y: 0 };
  return { x: tx / tangentSpeed * residualSpeed, y: ty / tangentSpeed * residualSpeed };
}

export function getDeflectionPreviewLength(speed: number) {
  const brakeSpeed = Math.min(speed, GAME_CONFIG.BRAKE_START_SPEED);
  const braking = Math.max(0, (brakeSpeed ** 2 - GAME_CONFIG.VELOCITY_STOP_THRESHOLD ** 2)
    * 60 / (2 * GAME_CONFIG.BRAKE_DECELERATION));
  const decay = -Math.log(GAME_CONFIG.FRICTION) * GAME_CONFIG.PHYSICS_HZ;
  const coasting = Math.max(0, speed - GAME_CONFIG.BRAKE_START_SPEED) * 60 / decay;
  return Math.min(160, coasting + braking);
}
