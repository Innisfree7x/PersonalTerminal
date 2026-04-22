'use client';

import type { DashboardNextTasksResponse } from '@/lib/dashboard/queries';

export const DASHBOARD_NEXT_TASKS_QUERY_PREFIX = ['dashboard', 'next-tasks'] as const;
export const DASHBOARD_NEXT_TASKS_QUERY_KEY = [
  ...DASHBOARD_NEXT_TASKS_QUERY_PREFIX,
  'today-bundle',
] as const;

const NEXT_TASKS_INCLUDE = 'trajectory_morning,week_events';
export const DASHBOARD_NEXT_TASKS_URL = `/api/dashboard/next-tasks?include=${NEXT_TASKS_INCLUDE}`;

export async function fetchDashboardNextTasks(): Promise<DashboardNextTasksResponse> {
  const response = await fetch(DASHBOARD_NEXT_TASKS_URL);
  if (!response.ok) throw new Error('Failed to fetch next tasks');
  return response.json() as Promise<DashboardNextTasksResponse>;
}

export async function fetchDashboardNextTasksSafe(): Promise<DashboardNextTasksResponse | null> {
  try {
    return await fetchDashboardNextTasks();
  } catch {
    return null;
  }
}
