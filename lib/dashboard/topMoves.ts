import { differenceInCalendarDays, startOfDay } from 'date-fns';
import type { RankedExecutionCandidate } from '@/lib/application/use-cases/execution-engine';

export interface MoveDestination {
  href: string;
  label: string;
}

export interface TrajectoryWindowBrief {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface WindowMoveCandidate {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  daysUntilStart: number;
}

function toStringValue(
  value: string | number | undefined
): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  if (typeof value === 'number') return String(value);
  return null;
}

export function resolveMoveDestination(move: RankedExecutionCandidate): MoveDestination {
  const payload = move.payload ?? {};
  if (move.type === 'homework') {
    const courseId = toStringValue(payload.courseId);
    const exerciseNumber = toStringValue(payload.exerciseNumber);
    const params = new URLSearchParams();
    params.set('source', 'top_moves');
    if (courseId) params.set('courseId', courseId);
    if (exerciseNumber) params.set('exerciseNumber', exerciseNumber);
    return {
      href: `/university?${params.toString()}`,
      label: 'Uni öffnen',
    };
  }

  if (move.type === 'goal') {
    const goalId = toStringValue(payload.goalId);
    const params = new URLSearchParams();
    params.set('source', 'top_moves');
    if (goalId) params.set('goalId', goalId);
    return {
      href: `/goals?${params.toString()}`,
      label: 'Goal öffnen',
    };
  }

  if (move.type === 'interview') {
    const applicationId = toStringValue(payload.applicationId);
    const params = new URLSearchParams();
    params.set('source', 'top_moves');
    if (applicationId) params.set('applicationId', applicationId);
    return {
      href: `/career?${params.toString()}`,
      label: 'Career öffnen',
    };
  }

  const taskId = toStringValue(payload.taskId);
  const params = new URLSearchParams();
  params.set('source', 'top_moves');
  if (taskId) params.set('taskId', taskId);
  return {
    href: `/today?${params.toString()}#focus-tasks`,
    label: 'Task öffnen',
  };
}

export function buildWindowMoveCandidates(
  windows: TrajectoryWindowBrief[],
  options?: { now?: Date; maxDaysUntilStart?: number; limit?: number }
): WindowMoveCandidate[] {
  const now = startOfDay(options?.now ?? new Date());
  const maxDays = options?.maxDaysUntilStart ?? 45;
  const limit = options?.limit ?? 2;

  return windows
    .map((window) => {
      const startDate = startOfDay(new Date(`${window.startDate}T00:00:00.000Z`));
      const daysUntilStart = differenceInCalendarDays(startDate, now);
      return {
        window,
        daysUntilStart,
      };
    })
    .filter((item) => item.daysUntilStart >= 0 && item.daysUntilStart <= maxDays)
    .sort((a, b) => a.daysUntilStart - b.daysUntilStart)
    .slice(0, limit)
    .map((item) => {
      const suffix = item.daysUntilStart === 0 ? 'heute' : `in ${item.daysUntilStart}d`;
      return {
        id: item.window.id,
        title: item.window.title,
        subtitle: `Start ${suffix}`,
        daysUntilStart: item.daysUntilStart,
        href: `/trajectory?windowId=${encodeURIComponent(item.window.id)}&source=today_window_bridge`,
      };
    });
}
