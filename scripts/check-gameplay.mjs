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
};
globalThis.window = {};
const { GameEngine, aimEngine, physicsEngine, spawnEngine, soundManager } = await import(
  `data:text/javascript;base64,${Buffer.from(chunk.code).toString('base64')}`
);

let nextId = 0;
function ball(value, x, y, cue = false) {
  return { id: `check-${nextId++}`, value, x, y, vx: 0, vy: 0,
    radius: 35, mass: 1, isMoving: false, isMerging: false,
    mergeCooldown: 0, scale: 1, isBlackNumber: cue };
}
function engineWith(balls, life, maxLife) {
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
  for (let index = 0; index < 6; index++) {
    cue.x = 130;
    cue.y = 130;
    engine.balls = [cue, ball(cue.value, 180, 130), ball(2048, 440, 440)];
    engine.updatePhysics(1 / 120);
    cue = engine.balls.find((item) => item.isBlackNumber);
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
console.log('Gameplay checks passed: life timing/rewards, larger spawn/merge pulses, longer cue-only trail, fixed shot strength.');
