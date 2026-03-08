import { format, isWithinInterval, parseISO, startOfDay } from 'date-fns';

export type TrajectoryRiskStatus = 'on_track' | 'tight' | 'at_risk';
export type TrajectoryGoalStatus = 'active' | 'done' | 'archived';
export type TrajectoryWindowConfidence = 'low' | 'medium' | 'high';

export interface TrajectoryGhostGoalInput {
  id: string;
  title: string;
  dueDate: string;
  status: TrajectoryGoalStatus;
}

export interface TrajectoryGhostBlockInput {
  goalId: string;
  title: string;
  startDate: string;
  endDate: string;
  status: TrajectoryRiskStatus;
}

export interface TrajectoryGhostWindowInput {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  confidence: TrajectoryWindowConfidence;
}

export type TrajectoryGhostEventKind = 'milestone' | 'prep_block' | 'window';

export interface TrajectoryGhostEvent {
  id: string;
  kind: TrajectoryGhostEventKind;
  title: string;
  subtitle: string;
  status?: TrajectoryRiskStatus;
  confidence?: TrajectoryWindowConfidence;
}

export interface BuildTrajectoryGhostEventsInput {
  weekDays: Date[];
  goals: TrajectoryGhostGoalInput[];
  generatedBlocks: TrajectoryGhostBlockInput[];
  windows: TrajectoryGhostWindowInput[];
}

const KIND_ORDER: Record<TrajectoryGhostEventKind, number> = {
  milestone: 0,
  prep_block: 1,
  window: 2,
};

const RISK_ORDER: Record<TrajectoryRiskStatus, number> = {
  at_risk: 0,
  tight: 1,
  on_track: 2,
};

function toDayKey(date: Date): string {
  return format(startOfDay(date), 'yyyy-MM-dd');
}

function parseDateOnly(value: string): Date {
  // Dates in this feature are stored as YYYY-MM-DD.
  return startOfDay(parseISO(value));
}

export function buildTrajectoryGhostEventsForWeek(
  input: BuildTrajectoryGhostEventsInput
): Record<string, TrajectoryGhostEvent[]> {
  const dayKeys = input.weekDays.map((day) => toDayKey(day));
  const byDay: Record<string, TrajectoryGhostEvent[]> = {};
  dayKeys.forEach((dayKey) => {
    byDay[dayKey] = [];
  });

  for (const goal of input.goals) {
    if (goal.status !== 'active') continue;
    const due = parseDateOnly(goal.dueDate);
    const dayKey = toDayKey(due);
    if (!(dayKey in byDay)) continue;
    byDay[dayKey]?.push({
      id: `ghost:milestone:${goal.id}:${dayKey}`,
      kind: 'milestone',
      title: goal.title,
      subtitle: `Milestone due ${format(due, 'dd MMM')}`,
    });
  }

  for (const block of input.generatedBlocks) {
    const blockStart = parseDateOnly(block.startDate);
    const blockEnd = parseDateOnly(block.endDate);
    for (const day of input.weekDays) {
      const dayStart = startOfDay(day);
      if (!isWithinInterval(dayStart, { start: blockStart, end: blockEnd })) continue;
      const dayKey = toDayKey(dayStart);
      byDay[dayKey]?.push({
        id: `ghost:prep:${block.goalId}:${block.startDate}:${block.endDate}:${dayKey}`,
        kind: 'prep_block',
        title: block.title,
        subtitle: `Prep block · ${format(blockStart, 'dd MMM')} → ${format(blockEnd, 'dd MMM')}`,
        status: block.status,
      });
    }
  }

  for (const windowEntry of input.windows) {
    const windowStart = parseDateOnly(windowEntry.startDate);
    const windowEnd = parseDateOnly(windowEntry.endDate);
    for (const day of input.weekDays) {
      const dayStart = startOfDay(day);
      if (!isWithinInterval(dayStart, { start: windowStart, end: windowEnd })) continue;
      const dayKey = toDayKey(dayStart);
      byDay[dayKey]?.push({
        id: `ghost:window:${windowEntry.id}:${windowEntry.startDate}:${windowEntry.endDate}:${dayKey}`,
        kind: 'window',
        title: windowEntry.title,
        subtitle: `Opportunity window`,
        confidence: windowEntry.confidence,
      });
    }
  }

  for (const dayKey of dayKeys) {
    byDay[dayKey]?.sort((a, b) => {
      const kindCompare = KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
      if (kindCompare !== 0) return kindCompare;
      const aRisk = a.status ? RISK_ORDER[a.status] : 99;
      const bRisk = b.status ? RISK_ORDER[b.status] : 99;
      return aRisk - bRisk;
    });
  }

  return byDay;
}
