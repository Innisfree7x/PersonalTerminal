'use server';

import { requireAuth } from '@/lib/auth/server';
import { createClient } from '@/lib/auth/server';
import { format } from 'date-fns';
import {
  getDashboardNextTasks,
  getDashboardStats,
  type DashboardNextTasksResponse,
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

export async function fetchDashboardNextTasksAction(): Promise<DashboardNextTasksResponse> {
  const user = await requireAuth();
  return getDashboardNextTasks(user.id);
}

export interface DashboardFocusTimeResponse {
  morning: number;
  afternoon: number;
  evening: number;
  totalMinutes: number;
  tasksCompleted: number;
  breakdown: {
    morning: number;
    afternoon: number;
    evening: number;
  };
}

export async function fetchDashboardFocusTimeAction(
  date = format(new Date(), 'yyyy-MM-dd')
): Promise<DashboardFocusTimeResponse> {
  const user = await requireAuth();
  const supabase = createClient();

  const { data: tasks, error } = await supabase
    .from('daily_tasks')
    .select('time_estimate, created_at')
    .eq('user_id', user.id)
    .eq('date', date)
    .eq('completed', true);

  if (error) {
    throw new Error(`Failed to fetch focus time: ${error.message}`);
  }

  let morningMinutes = 0;
  let afternoonMinutes = 0;
  let eveningMinutes = 0;

  tasks?.forEach((task) => {
    let minutes = 0;
    if (task.time_estimate) {
      const timeStr = task.time_estimate.toLowerCase();
      const hoursMatch = timeStr.match(/(\d+)\s*h/);
      const minutesMatch = timeStr.match(/(\d+)\s*m/);
      if (hoursMatch?.[1]) minutes += parseInt(hoursMatch[1], 10) * 60;
      if (minutesMatch?.[1]) minutes += parseInt(minutesMatch[1], 10);
    } else {
      minutes = 30;
    }

    const hour = new Date(task.created_at).getHours();
    if (hour >= 6 && hour < 12) {
      morningMinutes += minutes;
    } else if (hour >= 12 && hour < 18) {
      afternoonMinutes += minutes;
    } else {
      eveningMinutes += minutes;
    }
  });

  const maxMinutesPerPeriod = 180;
  const morning = Math.min(Math.round((morningMinutes / maxMinutesPerPeriod) * 100), 100);
  const afternoon = Math.min(Math.round((afternoonMinutes / maxMinutesPerPeriod) * 100), 100);
  const evening = Math.min(Math.round((eveningMinutes / maxMinutesPerPeriod) * 100), 100);

  return {
    morning,
    afternoon,
    evening,
    totalMinutes: morningMinutes + afternoonMinutes + eveningMinutes,
    tasksCompleted: tasks?.length || 0,
    breakdown: {
      morning: morningMinutes,
      afternoon: afternoonMinutes,
      evening: eveningMinutes,
    },
  };
}

export type DashboardWeekEventsResponse = DashboardWeekEventsPayload;

export async function fetchDashboardWeekEventsAction(
  offset = 0
): Promise<DashboardWeekEventsResponse> {
  const user = await requireAuth();
  return getDashboardWeekEvents(user.id, offset);
}
