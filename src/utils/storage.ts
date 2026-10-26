import { Achievement, GameState, GameStats } from '../types/game';

const KEYS = {
  RECORD: 'puzzleBilliards:v1:record',
  SETTINGS: 'puzzleBilliards:v1:settings',
  ACHIEVEMENTS: 'puzzleBilliards:v1:achievements',
  STATS: 'puzzleBilliards:v1:stats',
  PROGRESS: 'puzzleBilliards:v1:progress',
};

export interface StoredSettings {
  soundEnabled: boolean;
  controlMode: 'slingshot' | 'direct';
}

const DEFAULT_SETTINGS: StoredSettings = {
  soundEnabled: true,
  controlMode: 'direct',
};

const DEFAULT_STATS: GameStats = {
  gamesPlayed: 0,
  highScore: 0,
  maxBallAchieved: 64,
  totalMerges: 0,
  totalShots: 0,
  maxCombo: 0,
};

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_merge', title: '첫 합성', description: '첫 번째 숫자 합성을 성공하세요', unlocked: false },
  { id: 'ball_64', title: '64 공 만들기', description: '64 숫자 공을 만드세요', unlocked: false },
  { id: 'ball_128', title: '128 공 만들기', description: '128 숫자 공을 만드세요', unlocked: false },
  { id: 'ball_256', title: '256 공 만들기', description: '256 숫자 공을 만드세요', unlocked: false },
  { id: 'ball_512', title: '512 공 만들기', description: '512 숫자 공을 만드세요', unlocked: false },
  { id: 'ball_1024', title: '1024 공 만들기', description: '1024 숫자 공을 만드세요', unlocked: false },
  { id: 'ball_2048', title: '2048 공 만들기', description: '2048 숫자 공을 만드세요', unlocked: false },
  { id: 'chain_3', title: '연쇄 합성 3회', description: '한 턴에 3번 이상 연속 합성을 달성하세요', unlocked: false },
];

export function getStoredRecord(): number {
  try {
    const val = localStorage.getItem(KEYS.RECORD);
    return val ? parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function saveStoredRecord(record: number): void {
  try {
    localStorage.setItem(KEYS.RECORD, record.toString());
  } catch {
    // localStorage disabled
  }
}

export function getStoredSettings(): StoredSettings {
  try {
    const val = localStorage.getItem(KEYS.SETTINGS);
    return val ? { ...DEFAULT_SETTINGS, ...JSON.parse(val), controlMode: 'direct' } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: StoredSettings): void {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // localStorage disabled
  }
}

export function getStoredAchievements(): Achievement[] {
  try {
    const val = localStorage.getItem(KEYS.ACHIEVEMENTS);
    if (!val) return INITIAL_ACHIEVEMENTS;
    const parsed = JSON.parse(val) as Achievement[];
    // Merge with any newly added achievements
    return INITIAL_ACHIEVEMENTS.map((item) => {
      const match = parsed.find((p) => p.id === item.id);
      return match ? match : item;
    });
  } catch {
    return INITIAL_ACHIEVEMENTS;
  }
}

export function saveStoredAchievements(achievements: Achievement[]): void {
  try {
    localStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
  } catch {
    // localStorage disabled
  }
}

export function getStoredStats(): GameStats {
  try {
    const val = localStorage.getItem(KEYS.STATS);
    return val ? { ...DEFAULT_STATS, ...JSON.parse(val) } : DEFAULT_STATS;
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveStoredStats(stats: GameStats): void {
  try {
    localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  } catch {
    // localStorage disabled
  }
}

export interface StoredGameProgress {
  version: 1;
  state: GameState;
  turnScoreGained: number;
  currentCombo: number;
  turnBlackMergesCount: number;
  resolveDelay: number;
}

export function getStoredProgress(): StoredGameProgress | null {
  try {
    const value = localStorage.getItem(KEYS.PROGRESS);
    if (!value) return null;
    const progress = JSON.parse(value) as StoredGameProgress;
    if (progress.version !== 1 || !progress.state) return null;
    const state = progress.state;
    const counters = [state.score, state.record, state.life, state.maxLife, state.shots,
      state.merges, state.turnMerges, state.turnBlackMerges, state.maxBallValue,
      progress.turnScoreGained, progress.currentCombo, progress.turnBlackMergesCount];
    if (!counters.every((number) => Number.isSafeInteger(number) && number >= 0)
      || state.maxLife < 1 || state.life > state.maxLife || state.maxBallValue < 2
      || !Number.isFinite(progress.resolveDelay) || progress.resolveDelay < 0
      || !['ready', 'aiming', 'simulating', 'resolving', 'gameover'].includes(state.phase)
      || !Array.isArray(state.balls) || state.balls.length < 1 || state.balls.length > 512) return null;
    const ids = new Set<string>();
    for (const ball of state.balls) {
      if (!ball || typeof ball.id !== 'string' || ids.has(ball.id)
        || !Number.isSafeInteger(ball.value) || ball.value < 2 || !Number.isInteger(Math.log2(ball.value))
        || ![ball.x, ball.y, ball.vx, ball.vy, ball.radius, ball.mass].every(Number.isFinite)
        || ball.radius <= 0 || ball.radius > 560 || ball.mass <= 0
        || typeof ball.isMoving !== 'boolean' || typeof ball.isMerging !== 'boolean') return null;
      ids.add(ball.id);
    }
    if (state.balls.filter((ball) => ball.isBlackNumber === true).length !== 1) return null;
    return progress;
  } catch {
    return null;
  }
}

export function saveStoredProgress(progress: StoredGameProgress): void {
  try {
    localStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress));
  } catch {
    // Browsers with unavailable/full local storage can still play.
  }
}

export function clearStoredProgress(): void {
  try { localStorage.removeItem(KEYS.PROGRESS); } catch { /* Storage unavailable. */ }
}
