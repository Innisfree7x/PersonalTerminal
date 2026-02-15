'use server';

import { requireAuth } from '@/lib/auth/server';
import {
  getDashboardNextTasks,
  getDashboardStats,
  type DashboardNextTasksResponse,
  type DashboardStats,
} from '@/lib/dashboard/queries';

export async function fetchDashboardStatsAction(): Promise<DashboardStats> {
  const user = await requireAuth();
  return getDashboardStats(user.id);
}

export async function fetchDashboardNextTasksAction(): Promise<DashboardNextTasksResponse> {
  const user = await requireAuth();
  return getDashboardNextTasks(user.id);
}
