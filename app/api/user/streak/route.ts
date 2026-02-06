import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { startOfDay, subDays, format } from 'date-fns';
import { requireApiAuth } from '@/lib/api/auth';

/**
 * GET /api/user/streak
 * Calculates user's current streak based on completed daily tasks
 * 
 * Algorithm:
 * 1. Get all dates where user completed at least one task
 * 2. Start from today and count backwards
 * 3. Break on first missing day
 * 
 * Response:
 * - streak: number of consecutive days
 * - lastActivityDate: ISO date of last activity
 * - longestStreak: highest streak ever (future enhancement)
 */
export async function GET() {
  const { errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    // For now, we'll use a dummy userId since we don't have auth yet
    // TODO: Implement proper authentication
    const userId = 'anonymous';
    const today = startOfDay(new Date());

    // Fetch all completed tasks for the last 365 days
    const oneYearAgo = format(subDays(today, 365), 'yyyy-MM-dd');
    const { data: completedTasks, error: tasksError } = await supabase
      .from('daily_tasks')
      .select('date, completed')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('date', oneYearAgo)
      .order('date', { ascending: false });

    if (tasksError) {
      console.error('Streak calculation error:', tasksError);
      return NextResponse.json({ error: 'Failed to calculate streak' }, { status: 500 });
    }

    if (!completedTasks || completedTasks.length === 0) {
      return NextResponse.json({
        streak: 0,
        lastActivityDate: null,
        message: 'No completed tasks found',
      });
    }

    // Get unique dates with completed tasks
    const activeDates = new Set(
      completedTasks.map(task => task.date)
    );

    // Calculate streak
    let streak = 0;
    let currentDate = today;
    const todayStr = format(today, 'yyyy-MM-dd');

    // Check if user has activity today or yesterday (to allow for timezone differences)
    const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
    
    if (!activeDates.has(todayStr) && !activeDates.has(yesterdayStr)) {
      // No recent activity, streak is 0
      return NextResponse.json({
        streak: 0,
        lastActivityDate: completedTasks[0]?.date || null,
        message: 'Streak broken - no activity today or yesterday',
      });
    }

    // Count consecutive days backwards from today
    for (let i = 0; i < 365; i++) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      
      if (activeDates.has(dateStr)) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else {
        // Streak broken
        break;
      }
    }

    return NextResponse.json({
      streak,
      lastActivityDate: completedTasks[0]?.date || null,
      activeDaysLast30: Array.from(activeDates).filter(date => {
        const thirtyDaysAgo = format(subDays(today, 30), 'yyyy-MM-dd');
        return date >= thirtyDaysAgo;
      }).length,
    });

  } catch (error) {
    console.error('Streak API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
