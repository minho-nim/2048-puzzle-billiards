import { Ball, GameState } from '../types/game';
import { GAME_CONFIG } from './gameConfig';

export interface TurnResult {
  mergesCount: number;
  scoreAdded: number;
  newLife: number;
  newMaxLife: number;
  maxLifeIncreased: boolean;
  lifeRecovered: boolean;
  lifeLost: boolean;
  isGameOver: boolean;
  shouldSpawnBall: boolean;
  spawnCount: number;
}

/**
 * Monthly23 2048 Puzzle Billiards Rules:
 * 1. 생명은 파란칸 1개로 시작합니다.
 * 2. 실패시 회색으로 바뀌고 모든 생명이 회색이 되면 마지막 기회 1번이 남습니다.
 *    (회색 상태에서 또 실패하면 비로소 Game Over!)
 * 3. 최대 생명은 검은공이 성장할 때마다 1칸 추가.
 * 4. 매 턴마다 2 공 1개를 보충하며, 합칠 쌍이 없을 때만 1개를 더 보충합니다.
 */
export function evaluateTurn(
  currentState: GameState,
  currentBalls: Ball[],
  turnMerges: number,
  turnScoreGained: number,
  blackMergesCount: number = 0
): TurnResult {
  let newMaxLife = currentState.maxLife;
  let maxLifeIncreased = false;

  // Rule 3: Black ball growth increases Max Life by 1
  if (blackMergesCount > 0) {
    const nextMax = Math.min(GAME_CONFIG.MAX_LIFE_CAP, currentState.maxLife + blackMergesCount);
    if (nextMax > newMaxLife) {
      newMaxLife = nextMax;
      maxLifeIncreased = true;
    }
  }

  let newLife = currentState.life;
  let isGameOver = false;
  let lifeLost = false;
  let lifeRecovered = false;

  if (turnMerges === 0) {
    // Failed turn
    if (currentState.life > 0) {
      // Turn a blue ball into gray
      newLife = currentState.life - 1;
      lifeLost = true;
      // Note: when newLife becomes 0 (all gray), 1 last chance remains!
    } else {
      // Already all gray (failed on last chance) -> Game Over!
      isGameOver = true;
      lifeLost = true;
    }
  } else {
    // Successful merge: restore 1 blue life ball
    newLife = Math.min(newMaxLife, currentState.life + 1);
    lifeRecovered = true;
  }

  const ballCount = currentBalls.length;
  const counts = new Map<number, number>();
  for (const ball of currentBalls) {
    counts.set(ball.value, (counts.get(ball.value) ?? 0) + 1);
  }
  const hasAnyPair = Array.from(counts.values()).some((count) => count >= 2);
  const desiredSpawnCount = hasAnyPair ? 1 : 2;
  const availableSlots = Math.max(0, GAME_CONFIG.MAX_BALLS_ON_BOARD - ballCount);
  const spawnCount = Math.min(desiredSpawnCount, availableSlots);
  const shouldSpawnBall = !isGameOver && spawnCount > 0;

  return {
    mergesCount: turnMerges,
    scoreAdded: turnScoreGained,
    newLife,
    newMaxLife,
    maxLifeIncreased,
    lifeRecovered,
    lifeLost,
    isGameOver,
    shouldSpawnBall,
    spawnCount,
  };
}
