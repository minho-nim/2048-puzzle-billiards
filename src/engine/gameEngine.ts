import { Ball, GameState, AimData, FloatingText, Particle, Achievement } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { evaluateTurn } from '../config/gameRules';
import { physicsEngine } from './physicsEngine';
import { aimEngine } from './aimEngine';
import { mergeEngine } from './mergeEngine';
import { scoreEngine } from './scoreEngine';
import { spawnEngine } from './spawnEngine';
import { soundManager } from '../utils/audio';
import { computeDynamicRadii } from '../utils/math';
import {
  getStoredRecord,
  saveStoredRecord,
  getStoredSettings,
  saveStoredSettings,
  getStoredAchievements,
  saveStoredAchievements,
  getStoredStats,
  saveStoredStats,
} from '../utils/storage';

export type StateListener = (state: GameState) => void;
export type AchievementListener = (achievement: Achievement) => void;

export class GameEngine {
  private balls: Ball[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private aimData: AimData | null = null;
  private selectedBall: Ball | null = null;
  private dragOrigin: { x: number; y: number } | null = null;

  private state: GameState;
  private stateListeners: Set<StateListener> = new Set();
  private achievementListeners: Set<AchievementListener> = new Set();
  private achievements: Achievement[] = [];

  private lastTime: number = 0;
  private accumulator: number = 0;
  private animationFrameId: number | null = null;
  private turnScoreGained: number = 0;
  private currentCombo: number = 0;
  private turnBlackMergesCount: number = 0;
  private resolveNotBefore: number = 0;

  constructor() {
    const record = getStoredRecord();
    const settings = getStoredSettings();
    soundManager.setEnabled(settings.soundEnabled);
    this.achievements = getStoredAchievements();

    this.state = {
      balls: [],
      score: 0,
      turnScoreGained: 0,
      record,
      life: GAME_CONFIG.INITIAL_LIFE,
      maxLife: GAME_CONFIG.INITIAL_MAX_LIFE,
      lifeRevision: 0,
      lifeChangedSlots: [],
      phase: 'ready',
      selectedBallId: null,
      shots: 0,
      merges: 0,
      turnMerges: 0,
      turnBlackMerges: 0,
      maxBallValue: 64,
      soundEnabled: settings.soundEnabled,
    };

    this.initGame();
  }

  public initGame() {
    this.balls = spawnEngine.createInitialBalls();
    this.particles = [];
    this.floatingTexts = [];
    this.aimData = null;
    this.selectedBall = null;
    this.dragOrigin = null;
    this.currentCombo = 0;
    this.turnScoreGained = 0;
    this.turnBlackMergesCount = 0;
    this.resolveNotBefore = 0;

    const record = getStoredRecord();

    this.state = {
      ...this.state,
      balls: this.balls,
      score: 0,
      turnScoreGained: 0,
      record,
      life: GAME_CONFIG.INITIAL_LIFE,
      maxLife: GAME_CONFIG.INITIAL_MAX_LIFE,
      lifeRevision: 0,
      lifeChangedSlots: [],
      phase: 'ready',
      selectedBallId: null,
      shots: 0,
      merges: 0,
      turnMerges: 0,
      turnBlackMerges: 0,
      maxBallValue: 2,
    };

    // Update stats: games played
    const stats = getStoredStats();
    stats.gamesPlayed += 1;
    saveStoredStats(stats);

    this.notifyState();
  }

  public subscribe(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  public subscribeAchievement(listener: AchievementListener): () => void {
    this.achievementListeners.add(listener);
    return () => this.achievementListeners.delete(listener);
  }

  private notifyState() {
    this.state.balls = this.balls;
    const snapshot: GameState = {
      ...this.state,
      balls: this.balls,
    };
    this.stateListeners.forEach((l) => l(snapshot));
  }

  public getBalls(): Ball[] {
    return this.balls;
  }

  public getParticles(): Particle[] {
    return this.particles;
  }

  public getFloatingTexts(): FloatingText[] {
    return this.floatingTexts;
  }

  public getAimData(): AimData | null {
    return this.aimData;
  }

  public getState(): GameState {
    return this.state;
  }

  public getAchievements(): Achievement[] {
    return this.achievements;
  }

  public toggleSound(): boolean {
    const newVal = !this.state.soundEnabled;
    this.state.soundEnabled = newVal;
    soundManager.setEnabled(newVal);
    saveStoredSettings({
      ...getStoredSettings(),
      soundEnabled: newVal,
    });
    this.notifyState();
    return newVal;
  }

  // --- Pointer & Aim Controls ---

  public handlePointerDown(x: number, y: number): boolean {
    if (this.state.phase !== 'ready' || this.balls.length === 0) return false;

    // Only the black number ball (cue ball) can be controlled!
    // Clicking anywhere (even empty ground) immediately controls the black ball.
    const cueBall = this.balls.find((b) => b.isBlackNumber);
    if (!cueBall) return false;

    this.selectedBall = cueBall;
    this.dragOrigin = { x, y };
    this.state.phase = 'aiming';
    this.state.selectedBallId = cueBall.id;
    this.aimData = null;
    this.notifyState();
    return true;
  }

  public handlePointerMove(x: number, y: number) {
    if (this.state.phase !== 'aiming' || !this.selectedBall || !this.dragOrigin) {
      return;
    }

    const dx = x - this.dragOrigin.x;
    const dy = y - this.dragOrigin.y;

    const settings = getStoredSettings();
    this.aimData = aimEngine.calculateAim(
      this.selectedBall,
      { dx, dy },
      this.balls,
      settings.controlMode
    );
  }

  public handlePointerUp(): boolean {
    if (this.state.phase !== 'aiming' || !this.selectedBall) {
      this.cancelAim();
      return false;
    }

    if (this.aimData && this.aimData.speed > 0) {
      // Launch the ball!
      const launchVx = this.aimData.dirX * this.aimData.speed;
      const launchVy = this.aimData.dirY * this.aimData.speed;

      this.selectedBall.vx = launchVx;
      this.selectedBall.vy = launchVy;
      this.selectedBall.isMoving = true;

      soundManager.playCueShot(this.aimData.power);

      this.state.phase = 'simulating';
      this.state.shots += 1;
      this.state.turnMerges = 0;
      this.state.turnBlackMerges = 0;
      this.turnBlackMergesCount = 0;
      this.resolveNotBefore = 0;
      this.turnScoreGained = 0;
      this.state.turnScoreGained = 0;
      this.currentCombo = 0;

      // Update total shots stat
      const stats = getStoredStats();
      stats.totalShots += 1;
      saveStoredStats(stats);

      this.aimData = null;
      this.selectedBall = null;
      this.dragOrigin = null;
      this.notifyState();
      return true;
    }

    this.cancelAim();
    return false;
  }

  public cancelAim() {
    this.aimData = null;
    this.selectedBall = null;
    this.dragOrigin = null;
    if (this.state.phase === 'aiming') {
      this.state.phase = 'ready';
      this.state.selectedBallId = null;
      this.notifyState();
    }
  }

  // --- Game Loop Execution ---

  public start() {
    if (this.animationFrameId !== null) return;
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop(currentTime: number) {
    const elapsed = Math.min(100, currentTime - this.lastTime);
    this.lastTime = currentTime;
    this.accumulator += elapsed / 1000 * GAME_CONFIG.SIMULATION_SPEED;

    const fixedDt = GAME_CONFIG.FIXED_DT;
    let updates = 0;

    while (this.accumulator >= fixedDt && updates < GAME_CONFIG.MAX_SUBSTEPS_PER_FRAME) {
      this.updatePhysics(fixedDt);
      this.accumulator -= fixedDt;
      updates++;
    }

    this.updateVisualEffects(elapsed / 1000);

    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  private updatePhysics(_dt: number) {
    if (this.state.phase === 'simulating') {
      const stepResult = physicsEngine.step(this.balls, 4);

      // Play collision sounds
      for (const coll of stepResult.collisions) {
        if (coll.type === 'ball') {
          soundManager.playBallCollision(coll.intensity);
        } else if (coll.type === 'wall') {
          soundManager.playWallCollision(coll.intensity);
        }
      }

      // Handle merges
      if (stepResult.merges.length > 0) {
        this.state.lifeChangedSlots = [];
        for (const candidate of stepResult.merges) {
          const b1Exists = this.balls.some((b) => b.id === candidate.ball1.id);
          const b2Exists = this.balls.some((b) => b.id === candidate.ball2.id);
          if (!b1Exists || !b2Exists) continue;

          this.currentCombo += 1;
          const mergeResult = mergeEngine.executeMerge(
            candidate.ball1,
            candidate.ball2,
            this.balls,
            this.currentCombo
          );

          this.balls = mergeResult.updatedBalls;

          if (mergeResult.wasBlackNumber) {
            this.turnBlackMergesCount += 1;
            this.state.turnBlackMerges += 1;
          }

          // Recover immediately on contact. Cue growth adds both a capacity
          // slot and another current life, in the same notification/animation.
          const growthBonus = mergeResult.wasBlackNumber ? 1 : 0;
          const newMaxLife = this.state.maxLife + growthBonus;
          const totalLife = this.state.life + 1 + growthBonus;
          this.applyLifeChange(Math.min(newMaxLife, totalLife), newMaxLife);
          this.resolveNotBefore = performance.now() + 260;

          // Audio
          soundManager.playMerge(mergeResult.newBall.value, this.currentCombo);

          // Score & achievements
          this.turnScoreGained += mergeResult.scoreGained;
          this.state.turnScoreGained = this.turnScoreGained;
          this.state.turnMerges += 1;

          const scoreUpdate = scoreEngine.processMergeScore(
            this.state.score,
            this.state.record,
            mergeResult.scoreGained,
            this.state.merges,
            this.state.maxBallValue
          );

          this.state.score = scoreUpdate.newScore;
          this.state.record = scoreUpdate.newRecord;
          this.state.merges = scoreUpdate.newMerges;
          this.state.maxBallValue = scoreUpdate.newMaxBall;

          // Save high record
          if (scoreUpdate.newScore >= scoreUpdate.newRecord) {
            saveStoredRecord(scoreUpdate.newRecord);
          }

          // Check combo achievements
          const comboAchs = scoreEngine.checkComboAchievements(this.currentCombo);
          this.unlockAchievements([...scoreUpdate.unlockedAchievements, ...comboAchs]);
        }

        this.notifyState();
      }

      // If all balls have stopped, end the turn
      if (stepResult.isAllStopped && this.balls.every((ball) => !ball.isMoving)
        && performance.now() >= this.resolveNotBefore) {
        this.resolveTurn();
      }
    }
  }

  private resolveTurn() {
    this.state.phase = 'resolving';
    this.state.balls = [...this.balls];

    const turnResult = evaluateTurn(
      this.state,
      this.balls,
      this.state.turnMerges,
      this.turnScoreGained
    );

    if (turnResult.isGameOver) {
      this.state.phase = 'gameover';
      soundManager.playGameOver();

      const stats = getStoredStats();
      stats.highScore = Math.max(stats.highScore, this.state.score);
      stats.maxBallAchieved = Math.max(stats.maxBallAchieved, this.state.maxBallValue);
      stats.totalMerges += this.state.merges;
      saveStoredStats(stats);
      saveStoredRecord(this.state.record);

      this.notifyState();
      return;
    }

    // Replenish one 2, and a second only if no pair exists after the first.
    let spawnedCount = 0;
    if (turnResult.shouldSpawnBall) {
      for (let i = 0; i < turnResult.spawnCount; i++) {
        const newBall = spawnEngine.spawnReplenishmentBall(this.balls, 2);
        if (!newBall) break;
        this.balls.push(newBall);
        spawnedCount += 1;
      }
      computeDynamicRadii(this.balls);
    }

    if (spawnedCount > 0) {
      this.state.lifeChangedSlots = [];
      this.applyLifeChange(turnResult.newLife, turnResult.newMaxLife);
      soundManager.playLifeLost();
    }

    this.state.balls = [...this.balls];
    this.state.phase = 'ready';
    this.state.selectedBallId = null;
    this.notifyState();
  }

  private applyLifeChange(life: number, maxLife: number) {
    const changed = new Set(this.state.lifeChangedSlots);
    for (let index = 0; index < Math.max(this.state.maxLife, maxLife); index++) {
      if ((index < this.state.life) !== (index < life)
        || (index < this.state.maxLife) !== (index < maxLife)) {
        changed.add(index);
      }
    }
    // A recovery at full life still pulses the credited slot. Replenishment
    // always spends one of the currently displayed lives afterwards.
    if (changed.size === 0) changed.add(Math.max(0, Math.min(life, maxLife) - 1));
    this.state.life = life;
    this.state.maxLife = maxLife;
    this.state.lifeChangedSlots = [...changed];
    this.state.lifeRevision += 1;
  }

  private unlockAchievements(achIds: string[]) {
    if (achIds.length === 0) return;
    let changed = false;

    achIds.forEach((id) => {
      const ach = this.achievements.find((a) => a.id === id);
      if (ach && !ach.unlocked) {
        ach.unlocked = true;
        ach.unlockedAt = new Date().toISOString();
        changed = true;
        this.achievementListeners.forEach((l) => l(ach));
      }
    });

    if (changed) {
      saveStoredAchievements(this.achievements);
    }
  }

  private updateVisualEffects(dt: number) {
    for (const b of this.balls) {
      if (b.opacity !== undefined && b.opacity < 1) {
        b.opacity = Math.min(1, b.opacity + dt * 10);
      }
      if (b.pulseAge !== undefined) {
        b.pulseAge += dt;
        const progress = Math.min(1, b.pulseAge / 0.26);
        b.scale = 1 + Math.sin(progress * Math.PI) * 0.22;
        if (progress === 1) {
          b.scale = 1;
          delete b.pulseAge;
        }
      } else if (b.scale !== undefined && b.scale !== 1.0) {
        if (b.scale > 1.0) {
          b.scale = Math.max(1.0, b.scale - dt * 2.5);
        } else if (b.scale < 1.0) {
          const remainingScale = 1.0 - b.scale;
          b.scale = remainingScale < 0.001
            ? 1.0
            : 1.0 - remainingScale * Math.exp(-dt * 6);
        }
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.alpha -= dt * 1.8;
      p.life -= 1;
      if (p.alpha <= 0 || p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
}

export const gameEngine = new GameEngine();
