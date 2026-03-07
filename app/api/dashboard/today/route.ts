import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/server';
import { addDays, differenceInDays, startOfDay } from 'date-fns';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { createApiTraceContext, withApiTraceHeaders } from '@/lib/api/observability';
import { applyPrivateSWRPolicy } from '@/lib/api/responsePolicy';
import { recordFlowMetric } from '@/lib/ops/flowMetrics';

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
export async function GET(request: NextRequest) {
  const trace = createApiTraceContext(request, '/api/dashboard/today');
  const startedAt = trace.startedAt;
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return withApiTraceHeaders(errorResponse, trace, { metricName: 'dash_today' });

  try {
    const supabase = createClient();
    const today = new Date();
    const todayStart = startOfDay(today);
    const threeDaysFromNow = addDays(today, 3);
    const sevenDaysAgo = addDays(today, -7);
    const todayIso = todayStart.toISOString().split('T')[0] ?? '';
    const threeDaysIso = startOfDay(threeDaysFromNow).toISOString().split('T')[0] ?? todayIso;
    const sevenDaysAgoIso = startOfDay(sevenDaysAgo).toISOString().split('T')[0] ?? todayIso;

    const [
      { data: goalsDueTodayRows, error: goalsError },
      { data: upcomingInterviewsRows, error: interviewsError },
      { data: pendingFollowUpsRows, error: followUpsError },
    ] = await Promise.all([
      supabase
        .from('goals')
        .select('id, title, category, metrics_current, metrics_target, metrics_unit, target_date')
        .eq('user_id', user.id)
        .eq('target_date', todayIso)
        .order('created_at', { ascending: false }),
      supabase
        .from('job_applications')
        .select('id, company, position, interview_date')
        .eq('user_id', user.id)
        .not('interview_date', 'is', null)
        .gte('interview_date', todayIso)
        .lte('interview_date', threeDaysIso)
        .order('interview_date', { ascending: true }),
      supabase
        .from('job_applications')
        .select('id, company, position, application_date')
        .eq('user_id', user.id)
        .eq('status', 'applied')
        .lt('application_date', sevenDaysAgoIso)
        .order('application_date', { ascending: true })
        .limit(25),
    ]);

    if (goalsError) {
      throw new Error(`Failed to fetch dashboard goals due today: ${goalsError.message}`);
    }
    if (interviewsError) {
      throw new Error(`Failed to fetch dashboard upcoming interviews: ${interviewsError.message}`);
    }
    if (followUpsError) {
      throw new Error(`Failed to fetch dashboard pending follow-ups: ${followUpsError.message}`);
    }

    const goalsDueToday = (goalsDueTodayRows ?? []).map((goal) => ({
      id: goal.id,
      title: goal.title,
      category: goal.category,
      ...(goal.metrics_current !== null && goal.metrics_target !== null && goal.metrics_unit
        ? {
            metrics: {
              current: goal.metrics_current,
              target: goal.metrics_target,
              unit: goal.metrics_unit,
            },
          }
        : {}),
      targetDate: new Date(goal.target_date).toISOString(),
    }));

    const upcomingInterviews = (upcomingInterviewsRows ?? [])
      .map((app) => {
        if (!app.interview_date) return null;
        const interviewDate = startOfDay(new Date(app.interview_date));
        return {
          id: app.id,
          company: app.company,
          position: app.position,
          interviewDate: interviewDate.toISOString(),
          daysUntil: differenceInDays(interviewDate, todayStart),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    const pendingFollowUps = (pendingFollowUpsRows ?? [])
      .map((app) => ({
        id: app.id,
        company: app.company,
        position: app.position,
        applicationDate: new Date(app.application_date).toISOString(),
        daysSince: differenceInDays(todayStart, startOfDay(new Date(app.application_date))),
      }))
      .sort((a, b) => b.daysSince - a.daysSince);

    const priorities: TodayPriorities = {
      goalsDueToday,
      upcomingInterviews,
      pendingFollowUps,
    };

    void recordFlowMetric({
      flow: 'today_load',
      status: 'success',
      durationMs: Date.now() - startedAt,
      userId: user.id,
      route: '/api/dashboard/today',
      requestId: trace.requestId,
      context: {
        goalsDueToday: goalsDueToday.length,
        upcomingInterviews: upcomingInterviews.length,
        pendingFollowUps: pendingFollowUps.length,
      },
    }).catch(() => {});

    const response = applyPrivateSWRPolicy(NextResponse.json(priorities), {
      maxAgeSeconds: 20,
      staleWhileRevalidateSeconds: 60,
    });
    return withApiTraceHeaders(response, trace, { metricName: 'dash_today' });
  } catch (error) {
    void recordFlowMetric({
      flow: 'today_load',
      status: 'failure',
      durationMs: Date.now() - startedAt,
      userId: user.id,
      route: '/api/dashboard/today',
      requestId: trace.requestId,
      errorCode: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    }).catch(() => {});
    const response = handleRouteError(
      error,
      'Failed to fetch priorities',
      'Error fetching today priorities'
    );
    return withApiTraceHeaders(response, trace, { metricName: 'dash_today' });
  }
}
