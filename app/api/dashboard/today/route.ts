import { NextRequest, NextResponse } from 'next/server';
import { fetchGoals } from '@/lib/supabase/goals';
import { fetchApplications } from '@/lib/supabase/applications';
import { startOfDay, endOfDay, addDays, differenceInDays } from 'date-fns';

interface TodayPriorities {
  goalsDueToday: Array<{
    id: string;
    title: string;
    category: string;
    metrics?: { current: number; target: number; unit: string };
    targetDate: string;
  }>;
  upcomingInterviews: Array<{
    id: string;
    company: string;
    position: string;
    interviewDate: string;
    daysUntil: number;
  }>;
  pendingFollowUps: Array<{
    id: string;
    company: string;
    position: string;
    applicationDate: string;
    daysSince: number;
  }>;
}

/**
 * GET /api/dashboard/today - Fetch today's priorities (goals, interviews, follow-ups)
 */
export async function GET(_request: NextRequest) {
  try {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const threeDaysFromNow = addDays(today, 3);
    const sevenDaysAgo = addDays(today, -7);

    // Fetch goals due today
    const { goals: allGoals } = await fetchGoals();
    const goalsDueToday = allGoals
      .filter((goal: any) => {
        const goalDate = startOfDay(goal.targetDate);
        return goalDate >= todayStart && goalDate <= todayEnd;
      })
      .map((goal: any) => ({
        id: goal.id,
        title: goal.title,
        category: goal.category,
        metrics: goal.metrics,
        targetDate: goal.targetDate.toISOString(),
      }));

    // Fetch upcoming interviews (next 3 days)
    const { applications: allApplications } = await fetchApplications();
    const upcomingInterviews = allApplications
      .filter((app: any) => {
        if (!app.interviewDate) return false;
        const interviewDate = startOfDay(app.interviewDate);
        return interviewDate >= todayStart && interviewDate <= startOfDay(threeDaysFromNow);
      })
      .map((app: any) => ({
        id: app.id,
        company: app.company,
        position: app.position,
        interviewDate: app.interviewDate!.toISOString(),
        daysUntil: differenceInDays(startOfDay(app.interviewDate!), todayStart),
      }))
      .sort((a: any, b: any) => a.daysUntil - b.daysUntil);

    // Fetch pending follow-ups (applied >7 days ago, status='applied')
    const pendingFollowUps = allApplications
      .filter((app: any) => {
        if (app.status !== 'applied') return false;
        const appDate = startOfDay(app.applicationDate);
        return appDate < startOfDay(sevenDaysAgo);
      })
      .map((app: any) => ({
        id: app.id,
        company: app.company,
        position: app.position,
        applicationDate: app.applicationDate.toISOString(),
        daysSince: differenceInDays(todayStart, startOfDay(app.applicationDate)),
      }))
      .sort((a: any, b: any) => b.daysSince - a.daysSince);

    const priorities: TodayPriorities = {
      goalsDueToday,
      upcomingInterviews,
      pendingFollowUps,
    };

    return NextResponse.json(priorities);
  } catch (error) {
    console.error('Error fetching today priorities:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch priorities' },
      { status: 500 }
    );
  }
}
