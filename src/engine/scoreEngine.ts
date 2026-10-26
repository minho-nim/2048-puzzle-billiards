import { Achievement, GameStats } from '../types/game';

export interface ScoreState {
  score: number;
  record: number;
  merges: number;
  maxBallValue: number;
}

export class ScoreEngine {
  public processMergeScore(
    currentScore: number,
    currentRecord: number,
    mergedValue: number,
    currentMerges: number,
    currentMaxBall: number
  ): {
    newScore: number;
    newRecord: number;
    newMerges: number;
    newMaxBall: number;
    unlockedAchievements: string[];
  } {
    const newScore = currentScore + mergedValue;
    const newRecord = Math.max(currentRecord, newScore);
    const newMerges = currentMerges + 1;
    const newMaxBall = Math.max(currentMaxBall, mergedValue);

    const unlockedAchievements: string[] = [];

    if (newMerges === 1) {
      unlockedAchievements.push('first_merge');
    }
    if (newMaxBall >= 64) unlockedAchievements.push('ball_64');
    if (newMaxBall >= 128) unlockedAchievements.push('ball_128');
    if (newMaxBall >= 256) unlockedAchievements.push('ball_256');
    if (newMaxBall >= 512) unlockedAchievements.push('ball_512');
    if (newMaxBall >= 1024) unlockedAchievements.push('ball_1024');
    if (newMaxBall >= 2048) unlockedAchievements.push('ball_2048');

    return {
      newScore,
      newRecord,
      newMerges,
      newMaxBall,
      unlockedAchievements,
    };
  }

  public checkComboAchievements(comboCount: number): string[] {
    if (comboCount >= 3) {
      return ['chain_3'];
    }
    return [];
  }
}

export const scoreEngine = new ScoreEngine();
