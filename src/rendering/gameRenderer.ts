import { GAME_CONFIG } from '../config/gameConfig';
import { getBallColor } from '../config/ballColors';
import { Ball, AimData, Particle } from '../types/game';

export interface BoardScene { balls: Ball[]; aimData: AimData | null; particles: Particle[]; selectedBallId: string | null; }

export function drawBoard(ctx: CanvasRenderingContext2D, { balls, aimData, particles, selectedBallId }: BoardScene) {
  const width = GAME_CONFIG.BOARD_WIDTH;
  const height = GAME_CONFIG.BOARD_HEIGHT;
  // 1. Clear background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // 2. Draw thick solid black border
  const border = GAME_CONFIG.BOARD_BORDER_THICKNESS;
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, width, border);
  ctx.fillRect(0, height - border, width, border);
  ctx.fillRect(0, 0, border, height);
  ctx.fillRect(width - border, 0, border, height);

  // Playfield inner background
  ctx.fillStyle = '#F2F2F2';
  ctx.fillRect(border, border, width - border * 2, height - border * 2);


  // Only the manually controlled black ball leaves a trail.
  for (const ball of balls) {
    if (ball.isBlackNumber && ball.isMoving) drawMotionTrail(ctx, ball);
  }

  // 3. Draw Aim Trajectory & Ghost Ball
  if (aimData) {
    drawAimTrajectory(ctx, aimData, balls);
  }

  // 4. Draw Balls
  for (const ball of balls) {
    drawBall(ctx, ball, ball.id === selectedBallId);
  }

  // 5. Draw Particles
  for (const p of particles) {
    drawParticle(ctx, p);
  }

}

function drawMotionTrail(ctx: CanvasRenderingContext2D, ball: Ball) {
  if (!ball.trail || ball.trail.length < 2) return;
  const points = [{ x: ball.x, y: ball.y }, ...ball.trail];
  const count = points.length;
  const r = ball.radius;

  ctx.save();
  const leftEdge: { x: number; y: number }[] = [];
  const rightEdge: { x: number; y: number }[] = [];

  for (let i = 0; i < count; i++) {
    const cur = points[i];
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(count - 1, i + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const progress = i / (count - 1);
    const halfWidth = r * (1 - progress * 0.72) * 0.9;

    leftEdge.push({ x: cur.x + nx * halfWidth, y: cur.y + ny * halfWidth });
    rightEdge.push({ x: cur.x - nx * halfWidth, y: cur.y - ny * halfWidth });
  }

  ctx.beginPath();
  ctx.moveTo(leftEdge[0].x, leftEdge[0].y);
  for (let i = 1; i < leftEdge.length; i++) ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
  for (let i = rightEdge.length - 1; i >= 0; i--) ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
  ctx.closePath();

  const tail = points[count - 1];
  const color = getBallColor(ball.value);
  const grad = ctx.createLinearGradient(ball.x, ball.y, tail.x, tail.y);
  grad.addColorStop(0, `${color.primary}70`);
  grad.addColorStop(0.5, `${color.primary}38`);
  grad.addColorStop(1, `${color.primary}00`);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

/**
 * Draws clean 3D billiard balls matching original image_94b6cd2d.png
 */
function drawBall(ctx: CanvasRenderingContext2D, ball: Ball, isSelected: boolean = false) {
  const scale = ball.scale || 1.0;
  const r = ball.radius * scale;
  const x = ball.x;
  const y = ball.y;
  const color = getBallColor(ball.value);

  ctx.save();
  ctx.globalAlpha = ball.opacity ?? 1;

  // Selection ring for cue ball while aiming
  if (isSelected) {
    ctx.beginPath();
    ctx.arc(x, y, r + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#38B6FF';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // Offset shadow and broad color reflections follow the supplied ball artwork.
  ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
  ctx.shadowBlur = 1;
  ctx.shadowOffsetY = 6;
  ctx.shadowOffsetX = -3;

  // Base spherical body: light from upper-left (around 11 o'clock)
  const grad = ctx.createRadialGradient(
    x - r * 0.22,
    y - r * 0.28,
    r * 0.05,
    x,
    y,
    r * 1.02
  );
  grad.addColorStop(0, color.gradientStart);
  grad.addColorStop(0.58, color.primary);
  grad.addColorStop(1, color.gradientEnd);

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Reset shadow for inner details
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.ellipse(x - r * 0.04, y + r * 0.06, r * 0.91, r * 0.68, 0, 0, Math.PI);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.11)';
  ctx.lineWidth = r * 0.25;
  ctx.stroke();

  // Clean soft specular highlight reflection near the top (matching original screenshot)
  ctx.beginPath();
  ctx.ellipse(
    x + r * 0.12,
    y - r * 0.4,
    r * 0.6,
    r * 0.27,
    0.45,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(x, y, r - 0.6, 0, Math.PI * 2);
  ctx.strokeStyle = color.gradientStart;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Draw number text
  const isBlack = Boolean(ball.isBlackNumber);
  const text = ball.value.toString();

  let fontSize = r * 1.08;
  if (text.length === 2) fontSize = r * 0.98;
  if (text.length === 3) fontSize = r * 0.78;
  if (text.length >= 4) fontSize = r * 0.64;

  ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
  const textWidth = ctx.measureText(text).width;
  if (textWidth > r * 1.6) {
    fontSize *= r * 1.6 / textWidth;
    ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (!isBlack) {
    // White text with subtle contrast shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillText(text, x, y + 1.2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, x, y);
  } else {
    // Black text for milestone / cue ball
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillText(text, x, y - 0.8);
    ctx.fillStyle = '#000000';
    ctx.fillText(text, x, y);
  }

  ctx.restore();
}

/**
 * Draws trajectory and ghost ball matching screenshot
 */
function drawAimTrajectory(
  ctx: CanvasRenderingContext2D,
  aimData: AimData,
  balls: Ball[]
) {
  const { startBall, ghostX, ghostY, targetDirX, targetDirY, cueDeflectX, cueDeflectY } = aimData;

  ctx.save();

  const destX = aimData.destX ?? (ghostX ?? startBall.x + aimData.dirX * 300);
  const destY = aimData.destY ?? (ghostY ?? startBall.y + aimData.dirY * 300);

  // Dashed line from the cue ball to the predicted impact point.
  ctx.beginPath();
  ctx.setLineDash([7, 6]);
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#38B6FF';
  ctx.moveTo(startBall.x, startBall.y);
  ctx.lineTo(destX, destY);
  ctx.stroke();

  // Ghost ball at the predicted collision point.
  if (aimData.hasCollision && ghostX !== undefined && ghostY !== undefined) {
    const r = startBall.radius;

    ctx.beginPath();
    ctx.arc(ghostX, ghostY, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 182, 255, 0.32)';
    ctx.fill();
    ctx.strokeStyle = '#38B6FF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Imparted target ball path in target ball's color
    if (aimData.collisionType === 'ball' && aimData.hitTargetId) {
      const targetBall = balls.find((b) => b.id === aimData.hitTargetId);
      if (targetBall && targetDirX !== undefined && targetDirY !== undefined) {
        const targetColor = getBallColor(targetBall.value);
        const impartedLen = 60 + aimData.power * 80;
        ctx.beginPath();
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = targetColor.primary;
        ctx.moveTo(targetBall.x, targetBall.y);
        ctx.lineTo(
          targetBall.x + targetDirX * impartedLen,
          targetBall.y + targetDirY * impartedLen
        );
        ctx.stroke();
      }
    }

    // 4. Deflected cue ball path
    if (cueDeflectX !== undefined && cueDeflectY !== undefined) {
      const deflectLen = aimData.cueDeflectLength ?? (50 + aimData.power * 70);
      ctx.beginPath();
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#5ECEFF';
      ctx.moveTo(ghostX, ghostY);
      ctx.lineTo(ghostX + cueDeflectX * deflectLen, ghostY + cueDeflectY * deflectLen);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, p.alpha);
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fillStyle = p.color;
  ctx.fill();
  ctx.restore();
}
