'use client';

import type { QueryClient } from '@tanstack/react-query';
import { DASHBOARD_NEXT_TASKS_QUERY_PREFIX } from '@/lib/dashboard/nextTasksClient';

export const DAILY_TASKS_QUERY_PREFIX = ['daily-tasks'] as const;
export const COURSES_QUERY_PREFIX = ['courses'] as const;
export const GOALS_QUERY_PREFIX = ['goals'] as const;

export function invalidateDailyTasksAndNextTasks(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: DAILY_TASKS_QUERY_PREFIX });
  queryClient.invalidateQueries({ queryKey: DASHBOARD_NEXT_TASKS_QUERY_PREFIX });
}

export function invalidateCoursesAndNextTasks(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: COURSES_QUERY_PREFIX });
  queryClient.invalidateQueries({ queryKey: DASHBOARD_NEXT_TASKS_QUERY_PREFIX });
}

export function invalidateGoalsAndNextTasks(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: GOALS_QUERY_PREFIX });
  queryClient.invalidateQueries({ queryKey: DASHBOARD_NEXT_TASKS_QUERY_PREFIX });
}
