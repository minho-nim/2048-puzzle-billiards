export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distanceSq(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

export function normalize(x: number, y: number): { x: number; y: number; length: number } {
  const len = Math.sqrt(x * x + y * y);
  if (len === 0) {
    return { x: 0, y: 0, length: 0 };
  }
  return { x: x / len, y: y / len, length: len };
}

export function dot(x1: number, y1: number, x2: number, y2: number): number {
  return x1 * x2 + y1 * y2;
}

/**
 * Calculates ray-circle intersection for a moving ball of radius r1 hitting a static ball of radius r2.
 * Effective target circle has radius (r1 + r2).
 */
export function rayCircleIntersection(
  originX: number,
  originY: number,
  dirX: number,
  dirY: number,
  circleX: number,
  circleY: number,
  effectiveRadius: number
): { hit: boolean; t: number; pointX: number; pointY: number } {
  const dx = circleX - originX;
  const dy = circleY - originY;

  // Project vector to circle onto ray direction
  const proj = dot(dx, dy, dirX, dirY);

  if (proj <= 0) {
    return { hit: false, t: -1, pointX: 0, pointY: 0 };
  }

  // Perpendicular distance squared
  const dSq = dx * dx + dy * dy - proj * proj;
  const rSq = effectiveRadius * effectiveRadius;

  if (dSq > rSq) {
    return { hit: false, t: -1, pointX: 0, pointY: 0 };
  }

  const th = Math.sqrt(Math.max(0, rSq - dSq));
  const t = proj - th;

  if (t < 0) {
    return { hit: false, t: -1, pointX: 0, pointY: 0 };
  }

  return {
    hit: true,
    t,
    pointX: originX + dirX * t,
    pointY: originY + dirY * t,
  };
}

/**
 * Calculates ray-box intersection for a ball inside bounds [minX, minY, maxX, maxY].
 */
export function rayBoxIntersection(
  originX: number,
  originY: number,
  dirX: number,
  dirY: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): { hit: boolean; t: number; pointX: number; pointY: number; normalX: number; normalY: number } {
  let minT = Infinity;
  let normalX = 0;
  let normalY = 0;

  if (dirX > 0.0001) {
    const t = (maxX - originX) / dirX;
    if (t > 0 && t < minT) {
      minT = t;
      normalX = -1;
      normalY = 0;
    }
  } else if (dirX < -0.0001) {
    const t = (minX - originX) / dirX;
    if (t > 0 && t < minT) {
      minT = t;
      normalX = 1;
      normalY = 0;
    }
  }

  if (dirY > 0.0001) {
    const t = (maxY - originY) / dirY;
    if (t > 0 && t < minT) {
      minT = t;
      normalX = 0;
      normalY = -1;
    }
  } else if (dirY < -0.0001) {
    const t = (minY - originY) / dirY;
    if (t > 0 && t < minT) {
      minT = t;
      normalX = 0;
      normalY = 1;
    }
  }

  if (minT === Infinity) {
    return { hit: false, t: 0, pointX: originX, pointY: originY, normalX: 0, normalY: 0 };
  }

  return {
    hit: true,
    t: minT,
    pointX: originX + dirX * minT,
    pointY: originY + dirY * minT,
    normalX,
    normalY,
  };
}

/**
 * Dynamically scales ball radii extremely subtly (between 27.6px and 28.8px)
 * and assigns very subtle mass scaling (0.02) so larger balls push smaller balls subtly more!
 */
export function computeDynamicRadii(balls: { value: number; radius: number; mass?: number }[]): void {
  if (balls.length === 0) return;
  const maxValue = Math.max(...balls.map((b) => b.value));

  const minLog = 1; // log2(2)
  const maxLog = Math.max(1, Math.log2(maxValue));
  const logRange = Math.max(1, maxLog - minLog);

  balls.forEach((b) => {
    const curLog = Math.max(minLog, Math.log2(b.value));
    const ratio = maxLog === minLog ? 0.5 : Math.max(0, Math.min(1, (curLog - minLog) / logRange));
    // Extremely subtle scaling: 27.6px to 28.8px (1.2px difference)
    b.radius = 27.6 + ratio * 1.2;
    // Extremely subtle mass difference: larger balls push smaller balls subtly further
    b.mass = 1.0 + curLog * 0.02;
  });
}

