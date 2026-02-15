import { NextResponse } from 'next/server';
import { fetchTodayFocusSummary } from '@/lib/supabase/focusSessions';
import { requireApiAuth } from '@/lib/api/auth';
import { createClient } from '@/lib/auth/server';
import { format, subDays, startOfDay } from 'date-fns';

/**
 * GET /api/focus-sessions/today - Get today's focus summary + streak
 */
export async function GET() {
  const { errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const summary = await fetchTodayFocusSummary();

    // Calculate focus streak
    const supabase = createClient();
    const today = startOfDay(new Date());
    const oneYearAgo = format(subDays(today, 365), 'yyyy-MM-dd');

    const { data: sessions } = await supabase
      .from('focus_sessions')
      .select('started_at')
      .eq('session_type', 'focus')
      .eq('completed', true)
      .gte('started_at', oneYearAgo)
      .order('started_at', { ascending: false });

    let streak = 0;
    if (sessions && sessions.length > 0) {
      const activeDates = new Set(
        sessions.map((s) => format(new Date(s.started_at), 'yyyy-MM-dd'))
      );

      const todayStr = format(today, 'yyyy-MM-dd');
      const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

      if (activeDates.has(todayStr) || activeDates.has(yesterdayStr)) {
        let currentDate = today;
        for (let i = 0; i < 365; i++) {
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          if (activeDates.has(dateStr)) {
            streak++;
            currentDate = subDays(currentDate, 1);
          } else {
            break;
          }
        }
      }
    }

    return NextResponse.json({
      ...summary,
      currentStreak: streak,
    });
  } catch (error) {
    console.error('Error fetching today focus summary:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch focus summary' },
      { status: 500 }
    );
  }
}
