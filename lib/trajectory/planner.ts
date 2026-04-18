import {
  computeTrajectoryPrepWindow,
  evaluateTrajectoryRisk,
  type TrajectoryRiskStatus,
} from '@/lib/trajectory/risk-model';
import type { TrajectoryGoalPlanInput } from '@/lib/trajectory/types';

export type { TrajectoryRiskStatus } from '@/lib/trajectory/risk-model';
export type { TrajectoryGoalPlanInput };

export interface TrajectoryExistingBlockInput {
  goalId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  weeklyHours: number;
  status: 'planned' | 'in_progress' | 'done' | 'skipped';
}

export interface GeneratedTrajectoryBlock {
  goalId: string;
  title: string;
  startDate: string;
  endDate: string;
  weeklyHours: number;
  requiredWeeks: number;
  plannedBlockHours: number;
  overlapRatio: number;
  status: TrajectoryRiskStatus;
  reasons: string[];
}

export interface TrajectoryAlert {
  severity: 'warning' | 'critical';
  code: 'TIGHT_CAPACITY' | 'TIMELINE_COLLISION' | 'LATE_START';
  message: string;
  goalId: string;
}

export interface TrajectoryPlanResult {
  effectiveCapacityHoursPerWeek: number;
  generatedBlocks: GeneratedTrajectoryBlock[];
  alerts: TrajectoryAlert[];
  summary: {
    total: number;
    onTrack: number;
    tight: number;
    atRisk: number;
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

function parseIsoDate(dateString: string): Date {
  return new Date(`${dateString}T00:00:00.000Z`);
}

function toIsoDate(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function dateRangeOverlapDaysInclusive(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): number {
  const start = Math.max(aStart.getTime(), bStart.getTime());
  const end = Math.min(aEnd.getTime(), bEnd.getTime());
  if (end < start) return 0;
  return Math.floor((end - start) / DAY_MS) + 1;
}

export function buildTaskPackageDates(startDate: string, endDate: string, taskCount: number): string[] {
  if (taskCount <= 0) return [];

  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (end < start) return [startDate];

  const totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1);

  const dates = new Set<string>();
  for (let i = 0; i < taskCount; i += 1) {
    const dayOffset = Math.floor((i * totalDays) / taskCount);
    dates.add(toIsoDate(addUtcDays(start, dayOffset)));
  }

  // Ensure we always return exactly taskCount dates, even when range is smaller than count.
  let cursor = 0;
  while (dates.size < taskCount) {
    const date = toIsoDate(addUtcDays(start, cursor % totalDays));
    dates.add(date);
    cursor += 1;
  }

  return Array.from(dates).slice(0, taskCount).sort();
}

function computeOverlapRatio(
  block: { goalId: string; startDate: string; endDate: string; plannedBlockHours: number; weeklyHours: number },
  otherBlocks: Array<{ goalId: string; startDate: string; endDate: string; weeklyHours: number }>
): number {
  if (block.plannedBlockHours <= 0) return 0;

  const blockStart = parseIsoDate(block.startDate);
  const blockEnd = parseIsoDate(block.endDate);

  let overlapHours = 0;
  for (const other of otherBlocks) {
    if (other.goalId === block.goalId) continue;

    const overlapDays = dateRangeOverlapDaysInclusive(
      blockStart,
      blockEnd,
      parseIsoDate(other.startDate),
      parseIsoDate(other.endDate)
    );

    if (overlapDays <= 0) continue;

    const blockDaily = block.weeklyHours / 7;
    const otherDaily = other.weeklyHours / 7;
    overlapHours += overlapDays * Math.min(blockDaily, otherDaily);
  }

  return Math.min(1, overlapHours / block.plannedBlockHours);
}

export function computeTrajectoryPlan(input: {
  goals: TrajectoryGoalPlanInput[];
  existingBlocks?: TrajectoryExistingBlockInput[];
  capacityHoursPerWeek: number;
  today?: string;
}): TrajectoryPlanResult {
  const today = parseIsoDate(input.today ?? toIsoDate(new Date()));
  const capacity = Math.max(1, Math.floor(input.capacityHoursPerWeek));
  const existingActiveBlocks = (input.existingBlocks ?? []).filter(
    (block) => block.status === 'planned' || block.status === 'in_progress'
  );

  const generatedBase = input.goals
    .filter((goal) => goal.status === 'active')
    .map((goal) => {
      if (goal.commitmentMode === 'fixed') {
        const requiredDays = Math.max(
          1,
          Math.floor(
            (parseIsoDate(goal.fixedEndDate).getTime() -
              parseIsoDate(goal.fixedStartDate).getTime()) /
              DAY_MS
          ) + 1
        );
        const requiredWeeks = Math.max(1, Math.ceil(requiredDays / 7));
        return {
          goalId: goal.id,
          title: goal.title,
          startDate: goal.fixedStartDate,
          endDate: goal.fixedEndDate,
          weeklyHours: Math.max(1, Math.ceil(goal.effortHours / requiredWeeks)),
          requiredWeeks,
          plannedBlockHours: goal.effortHours,
        };
      }

      const prepWindow = computeTrajectoryPrepWindow({
        dueDate: goal.dueDate,
        effortHours: goal.effortHours,
        bufferWeeks: goal.bufferWeeks,
        capacityHoursPerWeek: capacity,
      });

      return {
        goalId: goal.id,
        title: goal.title,
        startDate: prepWindow.startDate,
        endDate: prepWindow.endDate,
        weeklyHours: prepWindow.effectiveCapacityHoursPerWeek,
        requiredWeeks: prepWindow.requiredWeeks,
        plannedBlockHours: prepWindow.plannedBlockHours,
      };
    });

  const combinedBlocks = [
    ...generatedBase.map((block) => ({
      goalId: block.goalId,
      startDate: block.startDate,
      endDate: block.endDate,
      weeklyHours: block.weeklyHours,
    })),
    ...existingActiveBlocks.map((block) => ({
      goalId: block.goalId,
      startDate: block.startDate,
      endDate: block.endDate,
      weeklyHours: block.weeklyHours,
    })),
  ];

  const generatedBlocks: GeneratedTrajectoryBlock[] = generatedBase.map((block) => {
    const overlapRatio = computeOverlapRatio(block, combinedBlocks);
    const { status, reasons } = evaluateTrajectoryRisk({
      startDate: block.startDate,
      today,
      overlapRatio,
    });

    return {
      ...block,
      overlapRatio,
      status,
      reasons,
    };
  });

  const alerts: TrajectoryAlert[] = generatedBlocks.flatMap((block) => {
    const items: TrajectoryAlert[] = [];

    if (block.reasons.includes('required_start_in_past')) {
      items.push({
        severity: 'critical',
        code: 'LATE_START',
        message: `Goal \"${block.title}\" should have started already.`,
        goalId: block.goalId,
      });
    }

    if (block.overlapRatio >= 0.5) {
      items.push({
        severity: 'critical',
        code: 'TIMELINE_COLLISION',
        message: `Goal \"${block.title}\" has severe overlap with other planned blocks.`,
        goalId: block.goalId,
      });
    } else if (block.overlapRatio >= 0.25) {
      items.push({
        severity: 'warning',
        code: 'TIGHT_CAPACITY',
        message: `Goal \"${block.title}\" has moderate overlap risk.`,
        goalId: block.goalId,
      });
    }

    return items;
  });

  const summary = generatedBlocks.reduce(
    (acc, block) => {
      acc.total += 1;
      if (block.status === 'on_track') acc.onTrack += 1;
      if (block.status === 'tight') acc.tight += 1;
      if (block.status === 'at_risk') acc.atRisk += 1;
      return acc;
    },
    { total: 0, onTrack: 0, tight: 0, atRisk: 0 }
  );

  return {
    effectiveCapacityHoursPerWeek: capacity,
    generatedBlocks,
    alerts,
    summary,
  };
}
