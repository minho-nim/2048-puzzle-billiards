import React, { useRef, useEffect, useCallback } from 'react';
import { GAME_CONFIG } from '../config/gameConfig';
import { getBallColor } from '../config/ballColors';
import { gameEngine } from '../engine/gameEngine';
import { Ball, AimData, Particle } from '../types/game';

interface GameCanvasProps {
  onPointerStateChange?: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ onPointerStateChange }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRenderRef = useRef<() => void>(() => {});

  // Convert client coordinates to canvas logical coordinates (560x560)
  const getCanvasCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = GAME_CONFIG.BOARD_WIDTH / rect.width;
    const scaleY = GAME_CONFIG.BOARD_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const { x, y } = getCanvasCoords(e);
    const handled = gameEngine.handlePointerDown(x, y);
    if (handled) {
      e.currentTarget.setPointerCapture(e.pointerId);
      requestRenderRef.current();
      onPointerStateChange?.();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    gameEngine.handlePointerMove(x, y);
    requestRenderRef.current();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignored
    }
    gameEngine.handlePointerUp();
    requestRenderRef.current();
    onPointerStateChange?.();
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignored
    }
    gameEngine.cancelAim();
    requestRenderRef.current();
    onPointerStateChange?.();
  };

  // Main canvas render loop
  useEffect(() => {
    let animId: number | null = null;
    let render: () => void;

    const requestRender = () => {
      if (animId === null) animId = requestAnimationFrame(render);
    };

    render = () => {
      animId = null;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Cap backing-store resolution to avoid oversized canvases on high-DPI screens.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = GAME_CONFIG.BOARD_WIDTH;
      const height = GAME_CONFIG.BOARD_HEIGHT;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

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
      ctx.fillStyle = '#FAFAFA';
      ctx.fillRect(border, border, width - border * 2, height - border * 2);

      const balls = gameEngine.getBalls();
      const aimData = gameEngine.getAimData();
      const particles = gameEngine.getParticles();

      const gameState = gameEngine.getState();
      const selectedBallId = gameState.phase === 'aiming' ? gameState.selectedBallId : null;

      // 3. Draw Motion Trails (ribbon behind moving balls, matching screenshot image_9bad0948.png)
      for (const ball of balls) {
        drawMotionTrail(ctx, ball);
      }

      // 4. Draw Aim Trajectory & Ghost Ball
      if (aimData) {
        drawAimTrajectory(ctx, aimData, balls);
      }

      // 5. Draw Balls
      for (const ball of balls) {
        drawBall(ctx, ball, ball.id === selectedBallId);
      }

      // 6. Draw Particles
      for (const p of particles) {
        drawParticle(ctx, p);
      }

      ctx.restore();

      const hasAnimatedBall = balls.some((ball) => ball.isMoving || (ball.scale !== undefined && ball.scale !== 1));
      if (hasAnimatedBall || particles.length > 0 || aimData !== null) requestRender();
    };

    requestRenderRef.current = requestRender;
    requestRender();
    return () => {
      requestRenderRef.current = () => {};
      if (animId !== null) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      className="w-full max-w-[560px] aspect-square relative select-none touch-none mx-auto shadow-md"
      style={{
        touchAction: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="w-full h-full block cursor-crosshair select-none"
        style={{
          width: '100%',
          height: '100%',
          touchAction: 'none',
        }}
      />
    </div>
  );
};

/**
 * Draws the smooth fading ribbon motion trail matching image_9bad0948.png
 */
function drawMotionTrail(ctx: CanvasRenderingContext2D, ball: Ball) {
  if (!ball.trail || ball.trail.length < 2) return;
  const points = [{ x: ball.x, y: ball.y }, ...ball.trail];
  const count = points.length;
  if (count < 2) return;

  const color = getBallColor(ball.value);
  const r = ball.radius;

  ctx.save();

  // Draw wide trailing ribbon polygon
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
  for (let i = 1; i < leftEdge.length; i++) {
    ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
  }
  for (let i = rightEdge.length - 1; i >= 0; i--) {
    ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
  }
  ctx.closePath();

  const tail = points[count - 1];
  const grad = ctx.createLinearGradient(ball.x, ball.y, tail.x, tail.y);
  grad.addColorStop(0, color.primary + '5A'); // ~35% opacity near ball
  grad.addColorStop(0.5, color.primary + '2B'); // ~17% opacity mid
  grad.addColorStop(1, color.primary + '00'); // Faded out at tail

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

  // Selection ring for cue ball while aiming
  if (isSelected) {
    ctx.beginPath();
    ctx.arc(x, y, r + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#38B6FF';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // Soft subtle drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.20)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  ctx.shadowOffsetX = 1;

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

  // Clean soft specular highlight reflection near the top (matching original screenshot)
  ctx.beginPath();
  ctx.ellipse(
    x + r * 0.08,
    y - r * 0.44,
    r * 0.38,
    r * 0.18,
    0.22,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.fill();

  // Draw number text
  const isBlack = Boolean(ball.isBlackNumber);
  const text = ball.value.toString();

  let fontSize = r * 0.88;
  if (text.length === 2) fontSize = r * 0.78;
  if (text.length === 3) fontSize = r * 0.62;
  if (text.length >= 4) fontSize = r * 0.5;

  ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
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

  // 1. Dashed line from start ball to impact point (short when weakly pulled, long when strongly pulled)
  ctx.beginPath();
  ctx.setLineDash([7, 6]);
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#38B6FF';
  ctx.moveTo(startBall.x, startBall.y);
  ctx.lineTo(destX, destY);
  ctx.stroke();

  // 2. Ghost ball at collision point (only if pulled far enough to reach target)
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
      const deflectLen = 50 + aimData.power * 70;
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

