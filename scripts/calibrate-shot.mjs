import { build } from 'vite';
import { fileURLToPath } from 'node:url';

const input = 'virtual:shot-calibration';
const modulePath = (path) => JSON.stringify(fileURLToPath(new URL(`../${path}`, import.meta.url)));
const result = await build({
  configFile: false, logLevel: 'error',
  plugins: [{
    name: 'shot-calibration',
    resolveId(id) { if (id === input) return id; },
    load(id) { if (id === input) return `export { physicsEngine } from ${modulePath('src/engine/physicsEngine.ts')}; export { GAME_CONFIG } from ${modulePath('src/config/gameConfig.ts')};`; },
  }],
  build: { write: false, minify: false, rolldownOptions: { input, preserveEntrySignatures: 'strict', output: { format: 'es' } } },
});
const code = result.output.find((item) => item.type === 'chunk').code;
const { physicsEngine, GAME_CONFIG: config } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

const radius = config.BASE_BALL_RADIUS;
const left = config.BOARD_BORDER_THICKNESS + radius;
const right = config.BOARD_WIDTH - config.BOARD_BORDER_THICKNESS - radius;
const crossing = right - left;
function measure(speed) {
  const ball = { id: 'calibration', value: 2, x: config.BOARD_WIDTH / 2, y: config.BOARD_HEIGHT / 2,
    vx: speed, vy: 0, radius, mass: 1, isMoving: true, isMerging: false, mergeCooldown: 0, isBlackNumber: true };
  let bounces = 0;
  let steps = 0;
  for (; ball.isMoving && steps < 20000; steps++) {
    bounces += physicsEngine.step([ball], 4).collisions.filter((event) => event.type === 'wall').length;
  }
  const afterBounce = bounces % 2 ? right - ball.x : ball.x - left;
  const distance = bounces ? crossing / 2 + (bounces - 1) * crossing + afterBounce : ball.x - config.BOARD_WIDTH / 2;
  return { bounces, fractionAfterBounce: afterBounce / crossing, distance,
    durationSeconds: steps / config.PHYSICS_HZ / config.SIMULATION_SPEED };
}
const target = crossing * (0.5 + 4 + 0.2);
if (process.argv.includes('--friction')) {
  const speed = 26;
  let low = 0.98, high = 0.9999;
  for (let iteration = 0; iteration < 35; iteration++) {
    const middle = (low + high) / 2;
    config.FRICTION = middle;
    if (measure(speed).distance < target) low = middle; else high = middle;
  }
  config.FRICTION = Math.round((low + high) / 2 * 1e8) / 1e8;
  console.log(JSON.stringify({ recommendedSpeed: speed, recommendedFriction: config.FRICTION,
    ...measure(speed), targetBounces: 5, targetFraction: 0.2 }, null, 2));
  process.exit(0);
}
let low = 1, high = 200;
for (let iteration = 0; iteration < 35; iteration++) {
  const middle = (low + high) / 2;
  if (measure(middle).distance < target) low = middle; else high = middle;
}
const speed = Math.round((low + high) / 2 * 100) / 100;
console.log(JSON.stringify({ recommendedSpeed: speed, ...measure(speed), targetBounces: 5, targetFraction: 0.2 }, null, 2));
