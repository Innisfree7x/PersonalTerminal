'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createDailyTaskAction } from '@/app/actions/daily-tasks';
import { createGoalAction } from '@/app/actions/goals';
import type { ParsedIntent } from '@/lib/command/parser';
import { PRISM_INTENT_EXECUTE_EVENT } from '@/lib/hooks/useCommandActions';

const DEFAULT_GOAL_CATEGORY = 'learning' as const;
const DEFAULT_GOAL_TARGET_DAYS = 14;

function todayIsoDate(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

function defaultGoalTargetDate(): Date {
  const local = new Date();
  local.setDate(local.getDate() + DEFAULT_GOAL_TARGET_DAYS);
  const year = local.getFullYear();
  const month = local.getMonth();
  const day = local.getDate();
  // Build as explicit UTC date to avoid timezone drift when serialized.
  return new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Befehl konnte nicht ausgeführt werden.';
}

export function useIntentExecutor(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    let inFlight = false;

    const executeIntent = async (intent: ParsedIntent) => {
      if (inFlight) return;
      inFlight = true;

      try {
        if (intent.kind === 'create-task') {
          const targetDate = intent.deadline ?? todayIsoDate();
          await createDailyTaskAction({
            title: intent.title,
            date: targetDate,
            source: 'manual',
          });
          await queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
          await queryClient.invalidateQueries({ queryKey: ['dashboard', 'next-tasks'] });
          toast.success(intent.deadline ? 'Task mit Deadline erstellt.' : 'Task erstellt.');
          return;
        }

        if (intent.kind === 'create-goal') {
          await createGoalAction({
            title: intent.title,
            category: DEFAULT_GOAL_CATEGORY,
            targetDate: defaultGoalTargetDate(),
          });
          await queryClient.invalidateQueries({ queryKey: ['goals'] });
          await queryClient.invalidateQueries({ queryKey: ['dashboard', 'next-tasks'] });
          toast.success('Goal erstellt.');
          return;
        }
      } catch (error) {
        toast.error(toErrorMessage(error));
      } finally {
        inFlight = false;
      }
    };

    const listener = (event: Event) => {
      const customEvent = event as CustomEvent<ParsedIntent>;
      if (!customEvent.detail) return;
      void executeIntent(customEvent.detail);
    };

    window.addEventListener(PRISM_INTENT_EXECUTE_EVENT, listener as EventListener);
    return () => {
      window.removeEventListener(PRISM_INTENT_EXECUTE_EVENT, listener as EventListener);
    };
  }, [queryClient]);
}
