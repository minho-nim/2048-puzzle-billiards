import { Achievement, GameStats } from '../types/game';

const KEYS = {
  RECORD: 'puzzleBilliards:v1:record',
  SETTINGS: 'puzzleBilliards:v1:settings',
  ACHIEVEMENTS: 'puzzleBilliards:v1:achievements',
  STATS: 'puzzleBilliards:v1:stats',
};

export interface StoredSettings {
  soundEnabled: boolean;
  controlMode: 'slingshot' | 'direct';
}

const DEFAULT_SETTINGS: StoredSettings = {
  soundEnabled: true,
  controlMode: 'slingshot',
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
    return val ? { ...DEFAULT_SETTINGS, ...JSON.parse(val) } : DEFAULT_SETTINGS;
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
