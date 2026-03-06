import type { TrajectoryRiskStatus } from '@/lib/trajectory/risk-model';

const DAY_MS = 24 * 60 * 60 * 1000;

export type MomentumTrend = 'up' | 'flat' | 'down';

export interface MomentumScoreInput {
  plannedHoursPerWeek: number;
  activeGoals: Array<{
    bufferWeeks: number;
    status: 'active' | 'done' | 'archived';
  }>;
  generatedBlocks: Array<{
    status: TrajectoryRiskStatus;
  }>;
  focusSessions: Array<{
    startedAt: string | Date;
    durationSeconds: number;
    completed: boolean;
    sessionType?: 'focus' | 'break';
  }>;
  now?: Date;
}

export interface MomentumScoreResult {
  score: number;
  delta: number;
  trend: MomentumTrend;
  breakdown: {
    statusPoints: number;
    capacityPoints: number;
    bufferPoints: number;
    trendPoints: number;
  };
  stats: {
    onTrack: number;
    tight: number;
    atRisk: number;
    activeGoals: number;
    plannedHoursPerWeek: number;
    last7DaysHours: number;
    previous7DaysHours: number;
    capacityRatio: number;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function statusWeight(status: TrajectoryRiskStatus): number {
  if (status === 'on_track') return 1;
  if (status === 'tight') return 0.65;
  return 0.25;
}

function toTime(value: string | Date): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function summarizeStatus(blocks: Array<{ status: TrajectoryRiskStatus }>) {
  return blocks.reduce(
    (acc, block) => {
      if (block.status === 'on_track') acc.onTrack += 1;
      else if (block.status === 'tight') acc.tight += 1;
      else acc.atRisk += 1;
      return acc;
    },
    { onTrack: 0, tight: 0, atRisk: 0 }
  );
}

function sumFocusHoursInRange(
  sessions: MomentumScoreInput['focusSessions'],
  rangeStart: number,
  rangeEnd: number
): number {
  let totalSeconds = 0;
  for (const session of sessions) {
    if (session.completed !== true) continue;
    if (session.sessionType && session.sessionType !== 'focus') continue;
    const startedAt = toTime(session.startedAt);
    if (!Number.isFinite(startedAt)) continue;
    if (startedAt < rangeStart || startedAt >= rangeEnd) continue;
    totalSeconds += Math.max(0, session.durationSeconds);
  }
  return totalSeconds / 3600;
}

export function computeMomentumScore(input: MomentumScoreInput): MomentumScoreResult {
  const now = input.now ?? new Date();
  const nowMs = now.getTime();
  const last7Start = nowMs - 7 * DAY_MS;
  const prev7Start = nowMs - 14 * DAY_MS;

  const plannedHours = Math.max(1, Math.round(input.plannedHoursPerWeek));
  const activeGoals = input.activeGoals.filter((goal) => goal.status === 'active');
  const statusSummary = summarizeStatus(input.generatedBlocks);

  const statusAverage =
    input.generatedBlocks.length === 0
      ? 0.5
      : input.generatedBlocks.reduce((sum, block) => sum + statusWeight(block.status), 0) /
        input.generatedBlocks.length;
  const statusPoints = clamp(statusAverage * 50, 0, 50);

  const last7DaysHours = sumFocusHoursInRange(input.focusSessions, last7Start, nowMs);
  const previous7DaysHours = sumFocusHoursInRange(input.focusSessions, prev7Start, last7Start);
  const capacityRatio = clamp(last7DaysHours / plannedHours, 0, 1.2);
  const capacityPoints = clamp(Math.min(1, capacityRatio) * 30, 0, 30);

  const avgBufferWeeks =
    activeGoals.length === 0
      ? 2
      : activeGoals.reduce((sum, goal) => sum + Math.max(0, goal.bufferWeeks), 0) /
        activeGoals.length;
  const bufferPoints = clamp((Math.min(8, avgBufferWeeks) / 8) * 10, 0, 10);

  const trendRatio = clamp((last7DaysHours - previous7DaysHours) / plannedHours, -1, 1);
  const trendPoints = trendRatio * 10;

  const rawScore = statusPoints + capacityPoints + bufferPoints + trendPoints;
  const score = Math.round(clamp(rawScore, 0, 100));
  const delta = Math.round(clamp(trendRatio * 15, -15, 15));
  const trend: MomentumTrend = delta >= 2 ? 'up' : delta <= -2 ? 'down' : 'flat';

  return {
    score,
    delta,
    trend,
    breakdown: {
      statusPoints: Number(statusPoints.toFixed(2)),
      capacityPoints: Number(capacityPoints.toFixed(2)),
      bufferPoints: Number(bufferPoints.toFixed(2)),
      trendPoints: Number(trendPoints.toFixed(2)),
    },
    stats: {
      onTrack: statusSummary.onTrack,
      tight: statusSummary.tight,
      atRisk: statusSummary.atRisk,
      activeGoals: activeGoals.length,
      plannedHoursPerWeek: plannedHours,
      last7DaysHours: Number(last7DaysHours.toFixed(2)),
      previous7DaysHours: Number(previous7DaysHours.toFixed(2)),
      capacityRatio: Number(capacityRatio.toFixed(2)),
    },
  };
}
