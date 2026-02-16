import { differenceInDays, startOfDay } from 'date-fns';

export type ExecutionActionType = 'daily-task' | 'homework' | 'goal' | 'interview';

export interface ExecutionCandidate {
  id: string;
  type: ExecutionActionType;
  title: string;
  subtitle?: string;
  dueDate?: Date;
  impact: 1 | 2 | 3 | 4 | 5;
  effort: 1 | 2 | 3 | 4 | 5;
  payload: Record<string, string | number>;
}

export interface RankedExecutionCandidate extends ExecutionCandidate {
  score: number;
  urgencyLabel: 'overdue' | 'today' | 'soon' | 'normal';
  daysUntilDue?: number;
}

export interface NextBestActionResult {
  primary: RankedExecutionCandidate | null;
  alternatives: RankedExecutionCandidate[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getUrgencyLabel(dueDate?: Date): RankedExecutionCandidate['urgencyLabel'] {
  if (!dueDate) return 'normal';
  const daysUntilDue = differenceInDays(startOfDay(dueDate), startOfDay(new Date()));
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue === 0) return 'today';
  if (daysUntilDue <= 3) return 'soon';
  return 'normal';
}

function urgencyScore(daysUntilDue?: number): number {
  if (daysUntilDue === undefined) return 8;
  if (daysUntilDue < 0) return 30;
  if (daysUntilDue === 0) return 26;
  if (daysUntilDue <= 3) return 18;
  if (daysUntilDue <= 7) return 11;
  return 6;
}

export function rankExecutionCandidates(candidates: ExecutionCandidate[]): RankedExecutionCandidate[] {
  const today = startOfDay(new Date());

  return candidates
    .map((candidate) => {
      const daysUntilDue =
        candidate.dueDate !== undefined
          ? differenceInDays(startOfDay(candidate.dueDate), today)
          : undefined;

      const score =
        urgencyScore(daysUntilDue) +
        candidate.impact * 6 -
        candidate.effort * 2.5 +
        (candidate.type === 'interview' ? 6 : 0);

      return {
        ...candidate,
        urgencyLabel: getUrgencyLabel(candidate.dueDate),
        score: Number(score.toFixed(2)),
        ...(daysUntilDue !== undefined ? { daysUntilDue } : {}),
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.daysUntilDue !== undefined && b.daysUntilDue !== undefined) {
        return a.daysUntilDue - b.daysUntilDue;
      }
      if (a.daysUntilDue !== undefined) return -1;
      if (b.daysUntilDue !== undefined) return 1;
      return a.title.localeCompare(b.title);
    });
}

export function pickNextBestAction(candidates: ExecutionCandidate[]): NextBestActionResult {
  const ranked = rankExecutionCandidates(candidates);
  return {
    primary: ranked[0] ?? null,
    alternatives: ranked.slice(1, 3),
  };
}

export interface ExecutionScoreInput {
  openCandidates: number;
  overdueCandidates: number;
  completedToday: number;
  plannedToday: number;
}

export function computeDailyExecutionScore(input: ExecutionScoreInput): number {
  const planned = Math.max(input.plannedToday, 1);
  const completionRate = clamp(input.completedToday / planned, 0, 1);
  const completionComponent = completionRate * 65;
  const momentumBonus = Math.min(input.completedToday * 4, 20);
  const backlogPenalty = Math.min(input.overdueCandidates * 6, 30);
  const openLoadPenalty = Math.min(Math.max(input.openCandidates - 8, 0) * 1.5, 12);

  const score = 15 + completionComponent + momentumBonus - backlogPenalty - openLoadPenalty;
  return Math.round(clamp(score, 0, 100));
}
