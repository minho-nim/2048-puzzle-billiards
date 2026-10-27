import { gameEngine } from '../engine/gameEngine';
import type { GameState } from '../types/game';
import type { BoardScene } from '../rendering/gameRenderer';

export interface ReplayFrame {
  time: number;
  scene: BoardScene;
  score: number;
  life: number;
  maxLife: number;
}
export interface ReplayShot { frames: ReplayFrame[]; duration: number; }

// Keep scene data rather than full-size pixel frames. The original renderer is
// used again when encoding, including aiming, trails, and spawn animations.
export class ReplayBuffer {
  private completed: ReplayShot[] = [];
  private active: { frames: ReplayFrame[]; start: number; shot: number; fired: boolean; ending?: number; interval: number } | null = null;
  private listeners = new Set<() => void>();
  private pausedAt: number | null = null;

  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getCount = () => this.completed.length;
  getShots = () => structuredClone(this.completed);
  isRecording = () => this.active !== null && this.pausedAt === null;

  reset() {
    this.active = null;
    this.completed = [];
    this.listeners.forEach((listener) => listener());
  }

  setPaused(paused: boolean, now = performance.now()) {
    const wasPaused = this.pausedAt !== null;
    if (paused && this.pausedAt === null) this.pausedAt = now;
    if (!paused && this.pausedAt !== null) {
      if (this.active) {
        const elapsed = now - this.pausedAt;
        this.active.start += elapsed;
        if (this.active.ending !== undefined) this.active.ending += elapsed;
      }
      this.pausedAt = null;
    }
    if (wasPaused !== paused) this.listeners.forEach((listener) => listener());
  }

  captureEngine() {
    const state = gameEngine.getState();
    this.capture({ balls: gameEngine.getBalls(), aimData: gameEngine.getAimData(),
      particles: gameEngine.getParticles(), selectedBallId: state.selectedBallId }, state);
  }

  private finish() {
    if (!this.active?.fired || !this.active.frames.length) { this.active = null; return; }
    const frames = this.active.frames;
    this.completed = [...this.completed, { frames, duration: frames.at(-1)!.time + 100 }].slice(-2);
    this.active = null;
    this.listeners.forEach((listener) => listener());
  }

  capture(scene: BoardScene, state: GameState, now = performance.now()) {
    if (this.pausedAt !== null) return;
    if (this.active?.ending !== undefined && state.phase === 'aiming') this.finish();
    if (!this.active && state.phase === 'aiming') {
      this.active = { frames: [], start: now, shot: state.shots + 1, fired: false, interval: 1000 / 30 };
    }
    const active = this.active;
    if (!active) return;
    if (state.shots >= active.shot) active.fired = true;
    if (!active.fired && state.phase !== 'aiming') { this.active = null; return; }
    if (active.fired && (state.phase === 'ready' || state.phase === 'gameover') && active.ending === undefined) active.ending = now;
    const time = now - active.start;
    const last = active.frames.at(-1);
    // Preserve long aiming sessions without unbounded memory growth.
    if (active.frames.length >= 1800) {
      active.frames = active.frames.filter((_, index) => index % 2 === 0);
      active.interval *= 2;
    }
    if (!last || time - last.time >= active.interval || active.ending !== undefined) {
      active.frames.push({ time, scene: structuredClone(scene), score: state.score, life: state.life, maxLife: state.maxLife });
    }
    if (active.ending !== undefined && now - active.ending >= 350) this.finish();
  }
}

export const replayBuffer = new ReplayBuffer();
