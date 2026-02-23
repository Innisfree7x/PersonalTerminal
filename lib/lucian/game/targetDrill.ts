export interface DrillBounds {
  width: number;
  height: number;
  padding?: number;
  minRadius?: number;
  maxRadius?: number;
}

export interface DrillTarget {
  id: string;
  x: number;
  y: number;
  radius: number;
  bornAt: number;
  expiresAt: number;
}

export interface DrillPruneResult {
  active: DrillTarget[];
  expired: number;
}

export interface DrillResult {
  score: number;
  hits: number;
  misses: number;
  maxCombo: number;
  elapsedMs: number;
}

const DEFAULT_PADDING = 64;
const DEFAULT_MIN_RADIUS = 18;
const DEFAULT_MAX_RADIUS = 30;

export function scoreForHit(combo: number): number {
  const safeCombo = Math.max(0, Math.floor(combo));
  return 90 + safeCombo * 15;
}

export function nextComboOnHit(combo: number): number {
  return Math.min(99, Math.max(0, Math.floor(combo)) + 1);
}

export function resetComboOnMiss(): number {
  return 0;
}

export function createTarget(
  now: number,
  bounds: DrillBounds,
  ttlMs: number,
  randomFn: () => number = Math.random,
): DrillTarget {
  const padding = bounds.padding ?? DEFAULT_PADDING;
  const minRadius = bounds.minRadius ?? DEFAULT_MIN_RADIUS;
  const maxRadius = bounds.maxRadius ?? DEFAULT_MAX_RADIUS;
  const radius = minRadius + randomFn() * (maxRadius - minRadius);

  const minX = padding + radius;
  const maxX = Math.max(minX, bounds.width - padding - radius);
  const minY = padding + radius;
  const maxY = Math.max(minY, bounds.height - padding - radius);

  const x = minX + randomFn() * (maxX - minX);
  const y = minY + randomFn() * (maxY - minY);

  return {
    id: `drill-${now}-${Math.random().toString(16).slice(2, 9)}`,
    x,
    y,
    radius,
    bornAt: now,
    expiresAt: now + ttlMs,
  };
}

export function pruneExpiredTargets(targets: DrillTarget[], now: number): DrillPruneResult {
  const active: DrillTarget[] = [];
  let expired = 0;

  for (const target of targets) {
    if (target.expiresAt <= now) {
      expired += 1;
      continue;
    }
    active.push(target);
  }

  return { active, expired };
}

