import type { TrajectoryGoalPlanInput } from '@/lib/trajectory/types';

export interface CrisisCollision {
  code:
    | 'FIXED_WINDOW_COLLISION'
    | 'FIXED_BLOCKS_PREP'
    | 'NO_FLEXIBLE_SLOT'
    | 'LEAD_TIME_TOO_SHORT';
  severity: 'critical';
  conflictingGoalIds: string[];
  window: { startDate: string; endDate: string };
  message: string;
}

export interface CrisisReport {
  collisions: CrisisCollision[];
  hasCrisis: boolean;
}

export interface DetectCrisesInput {
  goals: TrajectoryGoalPlanInput[];
  today?: string;
}

function parseIsoDate(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

function toIsoDate(d: Date): string {
  return d.toISOString().split('T')[0] ?? '';
}

interface FixedBlock {
  goalId: string;
  title: string;
  startDate: string;
  endDate: string;
  type: 'fixed';
}

interface PrepBlock {
  goalId: string;
  title: string;
  startDate: string;
  endDate: string;
  type: 'leadtime' | 'flexible';
}

const CAPACITY_FOR_FLEXIBLE_PREP = 20;

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isActive(g: TrajectoryGoalPlanInput): boolean {
  return g.status === 'active';
}

function buildFixedBlocks(goals: TrajectoryGoalPlanInput[], today: string): FixedBlock[] {
  const todayMs = parseIsoDate(today).getTime();
  return goals
    .filter(isActive)
    .filter((g): g is Extract<TrajectoryGoalPlanInput, { commitmentMode: 'fixed' }> =>
      g.commitmentMode === 'fixed'
    )
    .filter((g) => parseIsoDate(g.fixedEndDate).getTime() >= todayMs)
    .map((g) => ({
      goalId: g.id,
      title: g.title,
      startDate: g.fixedStartDate,
      endDate: g.fixedEndDate,
      type: 'fixed' as const,
    }));
}

function buildLeadTimeBlocks(
  goals: TrajectoryGoalPlanInput[],
  today: string
): PrepBlock[] {
  const todayMs = parseIsoDate(today).getTime();
  return goals
    .filter(isActive)
    .filter((g): g is Extract<TrajectoryGoalPlanInput, { commitmentMode: 'lead-time' }> =>
      g.commitmentMode === 'lead-time'
    )
    .filter((g) => parseIsoDate(g.dueDate).getTime() >= todayMs)
    .map((g) => {
      const due = parseIsoDate(g.dueDate);
      const prepEnd = addUtcDays(due, -(g.bufferWeeks * 7));
      const prepStart = addUtcDays(prepEnd, -(g.leadTimeWeeks * 7));
      return {
        goalId: g.id,
        title: g.title,
        startDate: toIsoDate(prepStart),
        endDate: toIsoDate(prepEnd),
        type: 'leadtime' as const,
      };
    });
}

function buildFlexiblePrepBlocks(
  goals: TrajectoryGoalPlanInput[],
  today: string
): PrepBlock[] {
  const todayMs = parseIsoDate(today).getTime();
  return goals
    .filter(isActive)
    .filter((g): g is Extract<TrajectoryGoalPlanInput, { commitmentMode: 'flexible' }> =>
      g.commitmentMode === 'flexible'
    )
    .filter((g) => parseIsoDate(g.dueDate).getTime() >= todayMs)
    .map((g) => {
      const due = parseIsoDate(g.dueDate);
      const requiredWeeks = Math.max(
        1,
        Math.ceil(g.effortHours / CAPACITY_FOR_FLEXIBLE_PREP)
      );
      const prepEnd = addUtcDays(due, -(g.bufferWeeks * 7));
      const prepStart = addUtcDays(prepEnd, -(requiredWeeks * 7));
      return {
        goalId: g.id,
        title: g.title,
        startDate: toIsoDate(prepStart),
        endDate: toIsoDate(prepEnd),
        type: 'flexible' as const,
      };
    });
}

function overlapsInclusive(
  a: { startDate: string; endDate: string },
  b: { startDate: string; endDate: string }
): boolean {
  const aStart = parseIsoDate(a.startDate).getTime();
  const aEnd = parseIsoDate(a.endDate).getTime();
  const bStart = parseIsoDate(b.startDate).getTime();
  const bEnd = parseIsoDate(b.endDate).getTime();
  return Math.max(aStart, bStart) <= Math.min(aEnd, bEnd);
}

export function detectCrises(input: DetectCrisesInput): CrisisReport {
  const today = input.today ?? toIsoDate(new Date());
  const uniqueGoals = Array.from(new Map(input.goals.map((g) => [g.id, g])).values());

  const fixed = buildFixedBlocks(uniqueGoals, today);
  const leadTimePrep = buildLeadTimeBlocks(uniqueGoals, today);
  const flexiblePrep = buildFlexiblePrepBlocks(uniqueGoals, today);
  const collisions: CrisisCollision[] = [];

  for (let i = 0; i < fixed.length; i += 1) {
    for (let j = i + 1; j < fixed.length; j += 1) {
      const a = fixed[i]!;
      const b = fixed[j]!;
      if (overlapsInclusive(a, b)) {
        const ids = [a.goalId, b.goalId].sort();
        const startDate =
          a.startDate < b.startDate ? a.startDate : b.startDate;
        const endDate = a.endDate > b.endDate ? a.endDate : b.endDate;
        collisions.push({
          code: 'FIXED_WINDOW_COLLISION',
          severity: 'critical',
          conflictingGoalIds: ids,
          window: { startDate, endDate },
          message: `„${a.title}" und „${b.title}" haben ein überlappendes festes Zeitfenster.`,
        });
      }
    }
  }

  for (const prep of [...leadTimePrep, ...flexiblePrep]) {
    for (const f of fixed) {
      if (overlapsInclusive(f, prep)) {
        const ids = [prep.goalId, f.goalId].sort();
        const startDate =
          f.startDate < prep.startDate ? f.startDate : prep.startDate;
        const endDate = f.endDate > prep.endDate ? f.endDate : prep.endDate;
        collisions.push({
          code: 'FIXED_BLOCKS_PREP',
          severity: 'critical',
          conflictingGoalIds: ids,
          window: { startDate, endDate },
          message: `„${f.title}" blockiert das Vorbereitungsfenster von „${prep.title}".`,
        });
      }
    }
  }

  return { collisions, hasCrisis: collisions.length > 0 };
}
