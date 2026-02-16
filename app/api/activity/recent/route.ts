import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { createClient } from '@/lib/auth/server';
import { handleRouteError } from '@/lib/api/server-errors';

/**
 * GET /api/activity/recent - Fetch recent user activity
 * For now, returns mock data.
 *
 * TODO: Implement proper authentication and database queries
 * when user_id columns are added to tables
 */
export async function GET() {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const supabase = createClient();
    const limit = 5;

    const [{ data: tasks }, { data: goals }, { data: applications }, { data: exercises }] =
      await Promise.all([
        supabase
          .from('daily_tasks')
          .select('id,title,created_at,completed')
          .eq('user_id', user.id)
          .eq('completed', true)
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('goals')
          .select('id,title,created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('job_applications')
          .select('id,company,position,created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('exercise_progress')
          .select('id,exercise_number,course_id,completed_at')
          .eq('user_id', user.id)
          .eq('completed', true)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(limit),
      ]);

    const activities = [
      ...(tasks || []).map((t) => ({
        id: `task-${t.id}`,
        type: 'task',
        action: `Completed task: ${t.title}`,
        timestamp: t.created_at,
      })),
      ...(goals || []).map((g) => ({
        id: `goal-${g.id}`,
        type: 'goal',
        action: `Added new goal: ${g.title}`,
        timestamp: g.created_at,
      })),
      ...(applications || []).map((a) => ({
        id: `application-${a.id}`,
        type: 'application',
        action: `Applied to ${a.company} (${a.position})`,
        timestamp: a.created_at,
      })),
      ...(exercises || []).map((e) => ({
        id: `exercise-${e.id}`,
        type: 'exercise',
        action: `Completed exercise ${e.exercise_number}`,
        timestamp: e.completed_at as string,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json({ activities });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch recent activity', 'Error fetching recent activity');
  }
}
