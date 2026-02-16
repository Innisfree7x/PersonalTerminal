'use server';

import { requireAuth } from '@/lib/auth/server';
import { createClient } from '@/lib/auth/server';
import { addDays, format, startOfWeek } from 'date-fns';
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

export interface DashboardWeekEvent {
  date: string;
  count: number;
  type: 'none' | 'low' | 'medium' | 'high';
}

export interface DashboardWeekEventsResponse {
  events: DashboardWeekEvent[];
  weekStart: string;
  weekEnd: string;
  totalEvents: number;
}

export async function fetchDashboardWeekEventsAction(
  offset = 0
): Promise<DashboardWeekEventsResponse> {
  const user = await requireAuth();
  const supabase = createClient();

  const weekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), offset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const firstDay = weekDays[0];
  const lastDay = weekDays[6];
  if (!firstDay || !lastDay) {
    throw new Error('Failed to calculate week range');
  }

  const weekStartStr = format(firstDay, 'yyyy-MM-dd');
  const weekEndStr = format(lastDay, 'yyyy-MM-dd');

  const { data: tasks, error } = await supabase
    .from('daily_tasks')
    .select('date')
    .eq('user_id', user.id)
    .gte('date', weekStartStr)
    .lte('date', weekEndStr);

  if (error) {
    throw new Error(`Failed to fetch week events: ${error.message}`);
  }

  const eventCounts: Record<string, number> = {};
  weekDays.forEach((day) => {
    eventCounts[format(day, 'yyyy-MM-dd')] = 0;
  });

  tasks?.forEach((task) => {
    if (task.date in eventCounts) {
      const count = eventCounts[task.date];
      if (count !== undefined) {
        eventCounts[task.date] = count + 1;
      }
    }
  });

  const events = weekDays.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const count = eventCounts[dateStr] || 0;
    let type: 'none' | 'low' | 'medium' | 'high' = 'none';
    if (count === 1) type = 'low';
    else if (count === 2) type = 'medium';
    else if (count >= 3) type = 'high';
    return {
      date: day.toISOString(),
      count,
      type,
    };
  });

  return {
    events,
    weekStart: firstDay.toISOString(),
    weekEnd: lastDay.toISOString(),
    totalEvents: Object.values(eventCounts).reduce((sum, count) => sum + count, 0),
  };
}
