export type TrajectoryRiskStatus = 'on_track' | 'tight' | 'at_risk';

const DAY_MS = 24 * 60 * 60 * 1000;
const TIGHT_COLLISION_THRESHOLD = 0.25;
const AT_RISK_COLLISION_THRESHOLD = 0.5;

function toUtcDate(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  return new Date(`${value}T00:00:00.000Z`);
}

function toIsoDate(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function calculateRequiredWeeks(effortHours: number, capacityHoursPerWeek: number): number {
  if (capacityHoursPerWeek <= 0) return Math.max(1, Math.ceil(effortHours));
  return Math.max(1, Math.ceil(effortHours / capacityHoursPerWeek));
}

export interface TrajectoryPrepWindowInput {
  dueDate: string;
  effortHours: number;
  bufferWeeks: number;
  capacityHoursPerWeek: number;
}

export interface TrajectoryPrepWindowResult {
  effectiveCapacityHoursPerWeek: number;
  requiredWeeks: number;
  startDate: string;
  endDate: string;
  plannedBlockHours: number;
}

export function computeTrajectoryPrepWindow(input: TrajectoryPrepWindowInput): TrajectoryPrepWindowResult {
  const capacity = Math.max(1, Math.floor(input.capacityHoursPerWeek));
  const requiredWeeks = calculateRequiredWeeks(input.effortHours, capacity);
  const dueDate = toUtcDate(input.dueDate);
  const blockEnd = addUtcDays(dueDate, -(Math.max(0, input.bufferWeeks) * 7));
  const blockStart = addUtcDays(blockEnd, -(requiredWeeks * 7));

  return {
    effectiveCapacityHoursPerWeek: capacity,
    requiredWeeks,
    startDate: toIsoDate(blockStart),
    endDate: toIsoDate(blockEnd),
    plannedBlockHours: requiredWeeks * capacity,
  };
}

export interface TrajectoryRiskEvaluationInput {
  startDate: string;
  today?: string | Date;
  overlapRatio?: number;
}

export interface TrajectoryRiskEvaluationResult {
  status: TrajectoryRiskStatus;
  reasons: string[];
}

export function evaluateTrajectoryRisk(input: TrajectoryRiskEvaluationInput): TrajectoryRiskEvaluationResult {
  const now = input.today ? toUtcDate(input.today) : toUtcDate(new Date());
  const startDate = toUtcDate(input.startDate);
  const overlapRatio = Math.min(1, Math.max(0, input.overlapRatio ?? 0));

  const reasons: string[] = [];
  let status: TrajectoryRiskStatus = 'on_track';

  if (startDate < now) {
    status = 'at_risk';
    reasons.push('required_start_in_past');
  } else if (overlapRatio >= AT_RISK_COLLISION_THRESHOLD) {
    status = 'at_risk';
    reasons.push('collision_above_50pct');
  } else if (overlapRatio >= TIGHT_COLLISION_THRESHOLD) {
    status = 'tight';
    reasons.push('collision_above_25pct');
  }

  return { status, reasons };
}

export interface TrajectoryHeroPreviewInput {
  dueDate: string;
  effortHours: number;
  bufferWeeks: number;
  capacityHoursPerWeek: number;
  today?: string | Date;
}

export interface TrajectoryHeroPreviewResult extends TrajectoryPrepWindowResult, TrajectoryRiskEvaluationResult {}

export function simulateTrajectoryGoalPreview(input: TrajectoryHeroPreviewInput): TrajectoryHeroPreviewResult {
  const prepWindow = computeTrajectoryPrepWindow({
    dueDate: input.dueDate,
    effortHours: input.effortHours,
    bufferWeeks: input.bufferWeeks,
    capacityHoursPerWeek: input.capacityHoursPerWeek,
  });

  const risk = evaluateTrajectoryRisk({
    startDate: prepWindow.startDate,
    ...(input.today ? { today: input.today } : {}),
    overlapRatio: 0,
  });

  return {
    ...prepWindow,
    ...risk,
  };
}

export function formatTrajectoryRiskLabel(status: TrajectoryRiskStatus): string {
  if (status === 'on_track') return 'on track';
  if (status === 'tight') return 'tight';
  return 'at risk';
}

export function getDaysUntilDate(targetDate: string, fromDate: Date = new Date()): number {
  const target = toUtcDate(targetDate);
  const from = toUtcDate(fromDate);
  return Math.max(0, Math.ceil((target.getTime() - from.getTime()) / DAY_MS));
}
