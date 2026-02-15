import { NextRequest, NextResponse } from 'next/server';
import { fetchFocusAnalytics } from '@/lib/supabase/focusSessions';
import { requireApiAuth } from '@/lib/api/auth';
import { format } from 'date-fns';

/**
 * GET /api/focus-sessions/analytics?days=30
 * Returns computed analytics for charts
 */
export async function GET(request: NextRequest) {
  const { errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(365, Math.max(7, parseInt(searchParams.get('days') || '30')));

    const sessions = await fetchFocusAnalytics(days);

    // Total stats
    const totalSeconds = sessions.reduce((sum, s) => sum + s.duration_seconds, 0);
    const completedSessions = sessions.filter((s) => s.completed);
    const longestSession = sessions.reduce(
      (max, s) => Math.max(max, s.duration_seconds),
      0
    );

    // Daily data
    const dailyMap = new Map<string, { totalSeconds: number; sessions: number; completed: number }>();
    sessions.forEach((s) => {
      const date = format(new Date(s.started_at), 'yyyy-MM-dd');
      const existing = dailyMap.get(date) || { totalSeconds: 0, sessions: 0, completed: 0 };
      existing.totalSeconds += s.duration_seconds;
      existing.sessions += 1;
      if (s.completed) existing.completed += 1;
      dailyMap.set(date, existing);
    });

    const dailyData = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        totalMinutes: Math.round(data.totalSeconds / 60),
        sessions: data.sessions,
        completedSessions: data.completed,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Hourly distribution
    const hourlyMap = new Map<number, { totalSeconds: number; sessions: number }>();
    sessions.forEach((s) => {
      const hour = new Date(s.started_at).getHours();
      const existing = hourlyMap.get(hour) || { totalSeconds: 0, sessions: 0 };
      existing.totalSeconds += s.duration_seconds;
      existing.sessions += 1;
      hourlyMap.set(hour, existing);
    });

    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
      const data = hourlyMap.get(hour) || { totalSeconds: 0, sessions: 0 };
      return {
        hour,
        totalMinutes: Math.round(data.totalSeconds / 60),
        sessions: data.sessions,
      };
    });

    // Category breakdown
    const categoryMap = new Map<string, { totalSeconds: number; sessions: number }>();
    sessions.forEach((s) => {
      const cat = s.category || 'other';
      const existing = categoryMap.get(cat) || { totalSeconds: 0, sessions: 0 };
      existing.totalSeconds += s.duration_seconds;
      existing.sessions += 1;
      categoryMap.set(cat, existing);
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      totalMinutes: Math.round(data.totalSeconds / 60),
      sessions: data.sessions,
    }));

    // Weekday distribution
    const weekdayMap = new Map<number, { totalSeconds: number; sessions: number }>();
    sessions.forEach((s) => {
      const day = new Date(s.started_at).getDay(); // 0=Sun, 6=Sat
      const existing = weekdayMap.get(day) || { totalSeconds: 0, sessions: 0 };
      existing.totalSeconds += s.duration_seconds;
      existing.sessions += 1;
      weekdayMap.set(day, existing);
    });

    const weekdayDistribution = Array.from({ length: 7 }, (_, day) => {
      const data = weekdayMap.get(day) || { totalSeconds: 0, sessions: 0 };
      return {
        day,
        totalMinutes: Math.round(data.totalSeconds / 60),
        sessions: data.sessions,
      };
    });

    // Streak calculation
    let currentStreak = 0;
    let longestStreak = 0;
    const completedDates = new Set(
      completedSessions.map((s) => format(new Date(s.started_at), 'yyyy-MM-dd'))
    );

    if (completedDates.size > 0) {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

      if (completedDates.has(todayStr) || completedDates.has(yesterdayStr)) {
        let checkDate = new Date(today);
        for (let i = 0; i < 365; i++) {
          if (completedDates.has(format(checkDate, 'yyyy-MM-dd'))) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      // Find longest streak from all dates
      const sortedDates = Array.from(completedDates).sort();
      let tempStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1]!);
        const curr = new Date(sortedDates[i]!);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return NextResponse.json({
      totalMinutes: Math.round(totalSeconds / 60),
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      averageSessionMinutes:
        sessions.length > 0 ? Math.round(totalSeconds / 60 / sessions.length) : 0,
      longestSessionMinutes: Math.round(longestSession / 60),
      currentStreak,
      longestStreak,
      dailyData,
      hourlyDistribution,
      categoryBreakdown,
      weekdayDistribution,
    });
  } catch (error) {
    console.error('Error fetching focus analytics:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
