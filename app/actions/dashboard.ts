'use server';

import { requireAuth } from '@/lib/auth/server';
import {
  getDashboardStats,
  type DashboardStats,
} from '@/lib/dashboard/queries';
import {
  getDashboardWeekEvents,
  type DashboardWeekEventsPayload,
} from '@/lib/dashboard/weekEvents';

export async function fetchDashboardStatsAction(): Promise<DashboardStats> {
  const user = await requireAuth();
  return getDashboardStats(user.id);
}

type DashboardWeekEventsResponse = DashboardWeekEventsPayload;

export async function fetchDashboardWeekEventsAction(
  offset = 0
): Promise<DashboardWeekEventsResponse> {
  const user = await requireAuth();
  return getDashboardWeekEvents(user.id, offset);
}
