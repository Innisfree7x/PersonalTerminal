import { addDays, format, startOfWeek } from 'date-fns';
import { createClient } from '@/lib/auth/server';

export interface DashboardWeekEvent {
  date: string;
  count: number;
  type: 'none' | 'low' | 'medium' | 'high';
}

export interface DashboardWeekEventsPayload {
  events: DashboardWeekEvent[];
  weekStart: string;
  weekEnd: string;
  totalEvents: number;
}

export async function getDashboardWeekEvents(
  userId: string,
  weekOffset = 0
): Promise<DashboardWeekEventsPayload> {
  const normalizedOffset = Number.isFinite(weekOffset)
    ? Math.max(-52, Math.min(52, weekOffset))
    : 0;

  const supabase = createClient();
  const weekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), normalizedOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const firstDay = weekDays[0];
  const lastDay = weekDays[6];
  if (!firstDay || !lastDay) {
    throw new Error('Failed to calculate week range');
  }

  const weekStartStr = format(firstDay, 'yyyy-MM-dd');
  const weekEndStr = format(lastDay, 'yyyy-MM-dd');

  const { data: tasks, error: tasksError } = await supabase
    .from('daily_tasks')
    .select('date')
    .eq('user_id', userId)
    .gte('date', weekStartStr)
    .lte('date', weekEndStr);

  if (tasksError) {
    throw new Error(`Failed to fetch week events: ${tasksError.message}`);
  }

  const eventCounts: Record<string, number> = {};
  for (const day of weekDays) {
    eventCounts[format(day, 'yyyy-MM-dd')] = 0;
  }

  for (const task of tasks ?? []) {
    if (task.date in eventCounts) {
      const count = eventCounts[task.date];
      if (count !== undefined) eventCounts[task.date] = count + 1;
    }
  }

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

  const totalEvents = Object.values(eventCounts).reduce((sum, count) => sum + count, 0);

  return {
    events,
    weekStart: firstDay.toISOString(),
    weekEnd: lastDay.toISOString(),
    totalEvents,
  };
}
