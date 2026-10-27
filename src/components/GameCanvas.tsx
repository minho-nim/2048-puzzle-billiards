import React, { useRef, useEffect, useCallback } from 'react';
import { GAME_CONFIG } from '../config/gameConfig';
import { drawBoard } from '../rendering/gameRenderer';
import { replayBuffer } from '../replay/replayBuffer';
import { gameEngine } from '../engine/gameEngine';

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
      replayBuffer.captureEngine();
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
    replayBuffer.captureEngine();
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
    replayBuffer.captureEngine();
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

      const balls = gameEngine.getBalls();
      const aimData = gameEngine.getAimData();
      const particles = gameEngine.getParticles();
      const state = gameEngine.getState();
      const scene = { balls, aimData, particles, selectedBallId: state.phase === 'aiming' ? state.selectedBallId : null };
      drawBoard(ctx, scene);
      replayBuffer.capture(scene, state);

      ctx.restore();

      const hasAnimatedBall = balls.some((ball) => ball.isMoving || ball.pulseAge !== undefined || (ball.scale !== undefined && ball.scale !== 1) || (ball.opacity !== undefined && ball.opacity !== 1));
      if (hasAnimatedBall || particles.length > 0 || aimData !== null || replayBuffer.isRecording()) requestRender();
    };

    requestRenderRef.current = requestRender;
    // Engine updates can add or replace balls between canvas frames (for example,
    // a replenishment ball may spawn after the cue ball stops). Schedule a frame
    // for those changes so scale animations get their first frame too.
    const unsubscribe = gameEngine.subscribe(() => requestRender());
    const unsubscribeReplay = replayBuffer.subscribe(requestRender);
    requestRender();
    return () => {
      unsubscribe();
      unsubscribeReplay();
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

