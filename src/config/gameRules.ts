import { Ball, GameState } from '../types/game';

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
 * 1. 공을 보충하는 매 턴마다 생명 1개를 소모합니다.
 * 2. 합친 공 개수만큼 생명을 회복합니다.
 * 3. 최대 공 숫자가 새로 커지면 최대 생명이 1 증가합니다.
 * 4. 매 턴마다 2 공 1개를 보충한 뒤, 합칠 쌍이 없으면 1개를 더 보충합니다.
 */
export function evaluateTurn(
  currentState: GameState,
  currentBalls: Ball[],
  turnMerges: number,
  turnScoreGained: number,
  maxBallIncreases: number = 0
): TurnResult {
  // Every new highest-ball record adds one life slot, including multiple records in a chain.
  const newMaxLife = currentState.maxLife + maxBallIncreases;
  const maxLifeIncreased = maxBallIncreases > 0;

  // Every turn spends one life; each successful merge refunds one life.
  const lifeAfterTurn = currentState.life - 1 + turnMerges;
  const isGameOver = currentState.life === 0 && turnMerges === 0;
  const newLife = Math.min(newMaxLife, Math.max(0, lifeAfterTurn));
  const lifeLost = newLife < currentState.life;
  const lifeRecovered = newLife > Math.max(0, currentState.life - 1);

  const ballCount = currentBalls.length;
  const counts = new Map<number, number>();
  for (const ball of currentBalls) {
    counts.set(ball.value, (counts.get(ball.value) ?? 0) + 1);
  }
  // Always add one 2 first, then add another only if no pair exists afterward.
  const twosAfterFirstSpawn = (counts.get(2) ?? 0) + 1;
  const hasPairAfterFirstSpawn = Array.from(counts.entries()).some(([value, count]) =>
    value === 2 ? twosAfterFirstSpawn >= 2 : count >= 2
  );
  const spawnCount = isGameOver ? 0 : hasPairAfterFirstSpawn ? 1 : 2;
  const shouldSpawnBall = !isGameOver;

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
