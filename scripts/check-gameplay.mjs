import assert from 'node:assert/strict';
import { build } from 'vite';
import { fileURLToPath } from 'node:url';

// Bundle the real engine, without starting React or requiring a browser.
const entry = 'virtual:gameplay-check';
const modulePath = (path) => JSON.stringify(fileURLToPath(new URL(`../${path}`, import.meta.url)));
const result = await build({
  configFile: false,
  logLevel: 'error',
  plugins: [{
    name: 'gameplay-check-entry',
    resolveId(id) { if (id === entry) return id; },
    load(id) {
      if (id === entry) return [
        `export { GameEngine } from ${modulePath('src/engine/gameEngine.ts')};`,
        `export { aimEngine } from ${modulePath('src/engine/aimEngine.ts')};`,
        `export { physicsEngine } from ${modulePath('src/engine/physicsEngine.ts')};`,
        `export { spawnEngine } from ${modulePath('src/engine/spawnEngine.ts')};`,
        `export { soundManager } from ${modulePath('src/utils/audio.ts')};`,
        `export { getStoredProgress, clearStoredProgress, getStoredStats, getStoredSettings } from ${modulePath('src/utils/storage.ts')};`,
        `export { GAME_CONFIG } from ${modulePath('src/config/gameConfig.ts')};`,
      ].join('\n');
    },
  }],
  build: { write: false, minify: false, rolldownOptions: {
    input: entry, preserveEntrySignatures: 'strict', output: { format: 'es' },
  } },
});
const chunk = result.output.find((item) => item.type === 'chunk');
const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
  removeItem: (key) => memory.delete(key),
};
globalThis.window = {};
const { GameEngine, aimEngine, physicsEngine, spawnEngine, soundManager, getStoredProgress,
  clearStoredProgress, getStoredStats, getStoredSettings, GAME_CONFIG } = await import(
  `data:text/javascript;base64,${Buffer.from(chunk.code).toString('base64')}`
);

let nextId = 0;
function ball(value, x, y, cue = false) {
  return { id: `check-${nextId++}`, value, x, y, vx: 0, vy: 0,
    radius: 35, mass: 1, isMoving: false, isMerging: false,
    mergeCooldown: 0, scale: 1, isBlackNumber: cue };
}
function engineWith(balls, life, maxLife) {
  clearStoredProgress();
  const engine = new GameEngine();
  soundManager.setEnabled(false);
  engine.balls = balls;
  Object.assign(engine.state, { balls, life, maxLife, phase: 'simulating', maxBallValue: 64 });
  return engine;
}

for (const count of [1, 2, 3, 4, 5, 8]) {
  const pairs = [[90, 90], [260, 90], [430, 90], [90, 260], [260, 260], [430, 260], [90, 430], [260, 430]].slice(0, count);
  const balls = [ball(1024, 450, 450, true)];
  pairs.forEach(([x, y], index) => {
    const value = 2 ** (index + 1);
    balls.push(ball(value, x, y), ball(value, x + 40, y));
  });
  const engine = engineWith(balls, 3, 30);
  engine.updatePhysics(1 / 120);
  assert.equal(engine.state.turnMerges, count);
  assert.equal(engine.state.life, 3 + count, 'heal immediately on each merge');
  assert.equal(engine.state.phase, 'simulating', 'show recovery before replenishment');
  assert.equal(engine.balls.length, balls.length - count, 'no spawn during recovery');
  const mergedBall = engine.balls.find((item) => item.pulseAge === 0);
  assert.ok(mergedBall, 'merged balls start a visual pulse');
  const physicalRadius = mergedBall.radius;
  engine.updateVisualEffects(0.13);
  assert.ok(mergedBall.scale > 1.2, 'merge pulse visibly grows above 120% size');
  assert.equal(mergedBall.radius, physicalRadius, 'pulse does not change collision radius');
  engine.updateVisualEffects(0.13);
  assert.equal(mergedBall.scale, 1, 'pulse returns exactly to normal size');
  assert.equal(mergedBall.pulseAge, undefined);
  engine.resolveTurn();
  assert.equal(engine.state.life, 3 + count - 1, `${count} merges, then exactly one debit`);
}

{
  const engine = engineWith([], 2, 10);
  let cue = ball(2, 130, 130, true);
  cue.hasBouncedThisShot = true;
  for (let index = 0; index < 6; index++) {
    cue.x = 130;
    cue.y = 130;
    engine.balls = [cue, ball(cue.value, 180, 130), ball(2048, 440, 440)];
    engine.updatePhysics(1 / 120);
    cue = engine.balls.find((item) => item.isBlackNumber);
    assert.equal(cue.hasBouncedThisShot, true, 'cue growth preserves earlier wall contact');
    assert.equal(engine.state.maxLife, 11 + index, 'each repeated cue growth adds capacity');
    assert.equal(engine.state.life, 4 + index * 2, 'each repeated cue merge rewards +2 immediately');
  }
  engine.resolveTurn();
  assert.equal(engine.state.maxLife, 16);
  assert.equal(engine.state.life, 13, 'six cue merges have net +11 after one spawn debit');
}

for (const full of [false, true]) {
  const engine = engineWith([ball(2, 130, 130, true), ball(2, 180, 130), ball(64, 440, 440)], full ? 5 : 2, 5);
  engine.updatePhysics(1 / 120);
  assert.equal(engine.state.maxLife, 6, 'cue growth increases capacity even below the record');
  assert.equal(engine.state.life, full ? 6 : 4, 'merge +1 and growth +1 happen immediately');
  assert.ok(engine.state.lifeChangedSlots.includes(5), 'new capacity slot animates with recovery');
  engine.resolveTurn();
  assert.equal(engine.state.life, full ? 5 : 3, 'spawn deducts one visible life after capped recovery');
  if (full) assert.deepEqual(engine.state.lifeChangedSlots, [5], 'the spent capacity slot turns gray');
}

{
  const engine = engineWith([ball(2, 130, 130), ball(2, 180, 130), ball(64, 440, 440, true)], 5, 5);
  engine.updatePhysics(1 / 120);
  assert.equal(engine.state.life, 5, 'recovery is capped immediately at full life');
  engine.resolveTurn();
  assert.equal(engine.state.life, 4, 'spawn must deduct one life even after a merge at full life');
  assert.deepEqual(engine.state.lifeChangedSlots, [4]);
  assert.equal(engine.state.maxLife, 5, 'ordinary merges do not add capacity');
}
{
  const engine = engineWith([ball(2, 130, 130, true), ball(2, 180, 130)], 1, 1);
  engine.updatePhysics(1 / 120);
  assert.equal(engine.state.life, 2, 'first cue merge visibly fills two life slots');
  engine.resolveTurn();
  assert.equal(engine.state.life, 1, 'first replenishment must visibly spend one life');
  assert.equal(engine.state.maxLife, 2);
  assert.deepEqual(engine.state.lifeChangedSlots, [1]);
}
{
  const engine = engineWith([ball(64, 440, 440, true)], 3, 5);
  engine.resolveTurn();
  assert.equal(engine.balls.length, 3, 'spawn two 2s when the first leaves no pair');
  assert.equal(engine.state.life, 2, 'two spawned balls still cost only one life');
  assert.equal(engine.balls.filter((item) => item.pulseAge === 0).length, 2, 'each spawned ball pulses');
  engine.updateVisualEffects(0.13);
  assert.ok(engine.balls.filter((item) => !item.isBlackNumber).every((item) => item.scale > 1.2), 'new balls use the larger pulse too');
  assert.deepEqual(engine.state.lifeChangedSlots, [2], 'only the spent slot pulses');
}
{
  const engine = engineWith([ball(2, 130, 130), ball(2, 180, 130), ball(64, 440, 440, true)], 0, 5);
  engine.updatePhysics(1 / 120);
  assert.equal(engine.state.life, 1, 'last-chance merge visibly recovers a life');
  engine.resolveTurn();
  assert.equal(engine.state.life, 0, 'that recovery pays for replenishment');
  assert.equal(engine.state.phase, 'ready');
  engine.resolveTurn();
  assert.equal(engine.state.phase, 'gameover', 'no reward at zero ends the final chance');
}
{
  const engine = engineWith([ball(64, 440, 440, true)], 3, 5);
  const original = spawnEngine.spawnReplenishmentBall;
  try {
    spawnEngine.spawnReplenishmentBall = () => null;
    engine.resolveTurn();
    assert.equal(engine.state.life, 3, 'no spawned ball means no debit');
  } finally { spawnEngine.spawnReplenishmentBall = original; }
}
{
  const cue = ball(2, 280, 280, true);
  const short = aimEngine.calculateAim(cue, { dx: 7, dy: 0 }, [cue]);
  const long = aimEngine.calculateAim(cue, { dx: 180, dy: 0 }, [cue]);
  assert.equal(short.speed, long.speed, 'drag distance must not change launch strength');
  assert.ok(short.dirX > 0, 'dragging right must aim right');
  assert.equal(short.destX, long.destX, 'short and long drags share the same trajectory preview');
  assert.equal(aimEngine.calculateAim(cue, { dx: 1, dy: 0 }, [cue]), null, 'a tap is not a shot');
}
{
  const cue = ball(2, 280, 130, true);
  const other = ball(4, 280, 430);
  cue.vx = other.vx = 5;
  cue.isMoving = other.isMoving = true;
  for (let index = 0; index < 45; index++) physicsEngine.step([cue, other]);
  assert.equal(cue.trail.length, 36, 'cue trail retains the longer 36-point history');
  assert.equal(other.trail, undefined, 'other balls do not leave a trail');
}
{
  for (const { bounced, reversed } of [
    { bounced: false, reversed: false }, { bounced: false, reversed: true },
    { bounced: true, reversed: false }, { bounced: true, reversed: true },
  ]) {
    const cue = ball(2, 200, 200, true);
    const target = ball(8, 260, 200);
    cue.vx = 10; cue.isMoving = true; cue.hasBouncedThisShot = bounced;
    target.mass = 2;
    physicsEngine.step(reversed ? [target, cue] : [cue, target]);
    if (!bounced) {
      assert.equal(cue.vx, 0, 'direct centered hit stops cue');
      assert.equal(cue.vy, 0);
      assert.equal(cue.isMoving, false);
      assert.ok(target.vx > 0, 'target receives forward motion');
    } else {
      assert.ok(Math.abs(cue.vx) > 0.1, 'wall-first centered hit retains normal physics');
    }
  }
  const cue = ball(2, 200, 200, true);
  const target = ball(8, 250, 240);
  cue.vx = 10; cue.isMoving = true;
  physicsEngine.step([cue, target]);
  assert.ok(cue.isMoving, 'glancing hits do not force-stop the cue');
  const wallCue = ball(2, 60, 300, true);
  wallCue.vx = -10; wallCue.isMoving = true;
  physicsEngine.step([wallCue]);
  assert.equal(wallCue.hasBouncedThisShot, true, 'wall hits are tracked for the whole shot');
}
for (const direction of [1, -1]) {
  const cue = ball(2, 280, 280, true);
  cue.vx = direction * GAME_CONFIG.MAX_LAUNCH_SPEED; cue.isMoving = true;
  let bounces = 0;
  let firstBounceStep = 0;
  let lastWall = null;
  const right = GAME_CONFIG.BOARD_WIDTH - GAME_CONFIG.BOARD_BORDER_THICKNESS - cue.radius;
  const left = GAME_CONFIG.BOARD_BORDER_THICKNESS + cue.radius;
  for (let step = 0; cue.isMoving && step < 10000; step++) {
    const hits = physicsEngine.step([cue]).collisions.filter((event) => event.type === 'wall').length;
    if (hits && firstBounceStep === 0) firstBounceStep = step + 1;
    if (hits) lastWall = cue.vx < 0 ? right : left;
    bounces += hits;
  }
  assert.equal(bounces, 5, 'centered 2 cue matches five measured wall bounces');
  const traveledFraction = Math.abs(cue.x - lastWall) / (right - left);
  assert.ok(Math.abs(traveledFraction - 0.2) < 0.01, 'travels 20% from the fifth wall in either direction');
  assert.ok(Math.abs((1 - traveledFraction) - 0.8) < 0.01, '80% of the crossing remains, rather than being traveled');
  assert.ok(firstBounceStep / GAME_CONFIG.PHYSICS_HZ / GAME_CONFIG.SIMULATION_SPEED >= 0.1,
    'five-bounce strength must not be achieved by an excessively fast launch');
}
{
  const engine = engineWith([ball(8, 130, 180, true), ball(4, 420, 430)], 2, 5);
  Object.assign(engine.state, { phase: 'ready', score: 200, shots: 7, merges: 4 });
  engine.checkpoint();
  const statsBefore = getStoredStats().gamesPlayed;
  const restored = new GameEngine();
  assert.equal(restored.state.score, 200);
  assert.equal(restored.state.life, 2);
  assert.equal(restored.state.maxLife, 5);
  assert.equal(restored.state.shots, 7);
  assert.deepEqual(restored.getBalls().map(({ id, value, x, y }) => ({ id, value, x, y })), engine.getBalls().map(({ id, value, x, y }) => ({ id, value, x, y })));
  assert.equal(getStoredStats().gamesPlayed, statsBefore, 'resuming does not start/count another game');
  restored.handlePointerDown(100, 100);
  restored.handlePointerMove(120, 100);
  restored.checkpoint();
  const fromAim = new GameEngine();
  assert.equal(fromAim.state.phase, 'ready', 'unfinished drag resumes safely without a shot');
  assert.equal(fromAim.state.shots, 7);
  fromAim.initGame();
  const afterRestart = new GameEngine();
  assert.equal(afterRestart.state.score, 0, 'confirmed restart replaces previous saved game');
  assert.equal(afterRestart.state.life, 1);
}
{
  const cue = ball(2, 130, 130, true);
  cue.vx = 14; cue.isMoving = true; cue.hasBouncedThisShot = true;
  const engine = engineWith([cue, ball(8, 440, 440)], 3, 5);
  Object.assign(engine.state, { score: 4, turnScoreGained: 4, turnMerges: 1, shots: 1 });
  engine.turnScoreGained = 4; engine.currentCombo = 1;
  engine.checkpoint();
  assert.ok(getStoredProgress());
  const restored = new GameEngine();
  assert.equal(restored.state.phase, 'simulating');
  assert.equal(restored.getBalls()[0].vx, 14);
  assert.equal(restored.getBalls()[0].hasBouncedThisShot, true);
  assert.equal(restored.currentCombo, 1);
  assert.equal(restored.turnScoreGained, 4);
  restored.getBalls().forEach((item) => { item.vx = item.vy = 0; item.isMoving = false; });
  restored.resolveTurn();
  assert.equal(restored.state.life, 2, 'resuming a rewarded merge must not duplicate recovery');
  const count = restored.getBalls().length;
  const again = new GameEngine();
  assert.equal(again.getBalls().length, count, 'completed replenishment does not repeat after reload');
  assert.equal(again.state.life, 2);
}
{
  clearStoredProgress();
  memory.set('puzzleBilliards:v1:progress', '{broken');
  assert.equal(getStoredProgress(), null, 'corrupt save is rejected');
  const fresh = new GameEngine();
  assert.equal(fresh.state.life, 1, 'corrupt save falls back to a playable fresh game');
  memory.set('puzzleBilliards:v1:settings', JSON.stringify({ controlMode: 'slingshot', soundEnabled: false }));
  assert.equal(getStoredSettings().controlMode, 'direct', 'old saved reverse controls are migrated');
  const engine = engineWith([ball(2, 280, 280, true)], 1, 1);
  engine.state.phase = 'ready';
  engine.balls[0].hasBouncedThisShot = true;
  engine.handlePointerDown(420, 280);
  assert.ok(engine.getAimData()?.dirX > 0, 'pointer down immediately previews the pressed location');
  engine.handlePointerUp();
  assert.ok(engine.balls[0].vx > 0, 'press and release fires without dragging');
  assert.equal(engine.state.shots, 1);
  assert.equal(engine.balls[0].hasBouncedThisShot, false, 'a fresh shot resets wall history');
}
{
  const engine = engineWith([ball(2, 280, 280, true)], 1, 1);
  engine.state.phase = 'ready';
  engine.handlePointerDown(420, 280);
  assert.ok(engine.getAimData().dirX > 0);
  engine.handlePointerMove(280, 420);
  assert.ok(engine.getAimData().dirY > 0.99, 'aim follows the new pointer location');
  engine.handlePointerUp();
  assert.ok(engine.balls[0].vy > 0);
}
{
  const cue = ball(2, 130, 130, true);
  cue.vx = 86.56; cue.isMoving = true;
  const engine = engineWith([cue, ball(8, 440, 440)], 3, 5);
  engine.checkpoint();
  const saved = JSON.parse(memory.get('puzzleBilliards:v1:progress'));
  delete saved.launchSpeed;
  memory.set('puzzleBilliards:v1:progress', JSON.stringify(saved));
  const restored = new GameEngine();
  assert.ok(Math.abs(restored.balls[0].vx - GAME_CONFIG.MAX_LAUNCH_SPEED) < 1e-9,
    'unfinished legacy shots must not resume at the old excessive speed');
  assert.equal(restored.balls[0].x, 130);
  assert.equal(restored.state.life, 3);
}
console.log('Gameplay checks passed: immediate point aiming, slower five-bounce strength, saved-shot speed migration, persistence/reload/restart, direct-only cue stop, existing life and animation rules.');
