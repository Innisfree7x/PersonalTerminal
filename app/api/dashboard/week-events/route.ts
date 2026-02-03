import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { startOfWeek, addDays, format } from 'date-fns';

/**
 * GET /api/dashboard/week-events
 * Aggregates events for the current week (or specified week offset)
 * Combines Google Calendar events + user tasks
 * 
 * Query params:
 * - offset: week offset from current week (default: 0)
 * 
 * Response:
 * - events: Array of {date, count, type}
 *   - type: 'none' | 'low' (1) | 'medium' (2) | 'high' (3+)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get('offset') || '0');
    const userId = session.user.id;

    // Calculate week range
    const weekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const weekStartStr = format(weekDays[0], 'yyyy-MM-dd');
    const weekEndStr = format(weekDays[6], 'yyyy-MM-dd');

    // Fetch daily tasks for the week
    const { data: tasks, error: tasksError } = await supabase
      .from('daily_tasks')
      .select('date')
      .eq('user_id', userId)
      .gte('date', weekStartStr)
      .lte('date', weekEndStr);

    if (tasksError) {
      console.error('Week events error:', tasksError);
      return NextResponse.json({ error: 'Failed to fetch week events' }, { status: 500 });
    }

    // Count events per day
    const eventCounts: Record<string, number> = {};
    
    // Initialize all days with 0
    weekDays.forEach(day => {
      eventCounts[format(day, 'yyyy-MM-dd')] = 0;
    });

    // Count tasks
    if (tasks) {
      tasks.forEach(task => {
        if (task.date in eventCounts) {
          eventCounts[task.date]++;
        }
      });
    }

    // TODO: Add Google Calendar events when available
    // For now, we'll just use tasks

    // Format response
    const events = weekDays.map(day => {
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

    return NextResponse.json({
      events,
      weekStart: weekDays[0].toISOString(),
      weekEnd: weekDays[6].toISOString(),
      totalEvents: Object.values(eventCounts).reduce((sum, count) => sum + count, 0),
    });

  } catch (error) {
    console.error('Week events API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
