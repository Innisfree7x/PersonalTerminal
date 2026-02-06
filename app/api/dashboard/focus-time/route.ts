import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { requireApiAuth } from '@/lib/api/auth';

/**
 * GET /api/dashboard/focus-time
 * Calculates focus time by time blocks (morning, afternoon, evening)
 * Based on completed tasks with time estimates
 * 
 * Query params:
 * - date: YYYY-MM-DD (default: today)
 * 
 * Response:
 * - morning: progress 0-100
 * - afternoon: progress 0-100
 * - evening: progress 0-100
 * - totalMinutes: total focus time in minutes
 */
export async function GET(request: Request) {
  const { errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
    
    // For now, we'll use a dummy userId since we don't have auth yet
    // TODO: Implement proper authentication
    const userId = 'anonymous';

    // Fetch completed tasks for the day with time estimates
    const { data: tasks, error: tasksError } = await supabase
      .from('daily_tasks')
      .select('id, title, completed, time_estimate, created_at')
      .eq('user_id', userId)
      .eq('date', date)
      .eq('completed', true);

    if (tasksError) {
      console.error('Focus time error:', tasksError);
      return NextResponse.json({ error: 'Failed to fetch focus time' }, { status: 500 });
    }

    // Initialize time blocks (in minutes)
    let morningMinutes = 0;
    let afternoonMinutes = 0;
    let eveningMinutes = 0;

    // Parse time estimates and categorize by creation time
    // (In a real app, you'd want to track actual completion time)
    if (tasks && tasks.length > 0) {
      tasks.forEach(task => {
        // Parse time estimate (format: "30m", "1h", "2h 30m", etc.)
        let minutes = 0;
        if (task.time_estimate) {
          const timeStr = task.time_estimate.toLowerCase();
          const hoursMatch = timeStr.match(/(\d+)\s*h/);
          const minutesMatch = timeStr.match(/(\d+)\s*m/);
          
          if (hoursMatch && hoursMatch[1]) {
            minutes += parseInt(hoursMatch[1]) * 60;
          }
          if (minutesMatch && minutesMatch[1]) {
            minutes += parseInt(minutesMatch[1]);
          }
        } else {
          // Default to 30 minutes if no estimate
          minutes = 30;
        }

        // Categorize by hour (using created_at as proxy for completion time)
        const hour = new Date(task.created_at).getHours();
        
        if (hour >= 6 && hour < 12) {
          morningMinutes += minutes;
        } else if (hour >= 12 && hour < 18) {
          afternoonMinutes += minutes;
        } else {
          eveningMinutes += minutes;
        }
      });
    }

    // Calculate progress (assuming 3 hours per period is 100%)
    const maxMinutesPerPeriod = 180; // 3 hours
    const morningProgress = Math.min(Math.round((morningMinutes / maxMinutesPerPeriod) * 100), 100);
    const afternoonProgress = Math.min(Math.round((afternoonMinutes / maxMinutesPerPeriod) * 100), 100);
    const eveningProgress = Math.min(Math.round((eveningMinutes / maxMinutesPerPeriod) * 100), 100);

    return NextResponse.json({
      morning: morningProgress,
      afternoon: afternoonProgress,
      evening: eveningProgress,
      totalMinutes: morningMinutes + afternoonMinutes + eveningMinutes,
      tasksCompleted: tasks?.length || 0,
      breakdown: {
        morning: morningMinutes,
        afternoon: afternoonMinutes,
        evening: eveningMinutes,
      },
    });

  } catch (error) {
    console.error('Focus time API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
