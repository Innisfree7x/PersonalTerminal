import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/activity/recent
 * Returns recent user activity across all entities (tasks, goals, applications, courses)
 * 
 * Query params:
 * - limit: number of activities to return (default: 10, max: 50)
 * 
 * Response:
 * - activities: Array of activity objects with type, action, timestamp
 */
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    const userId = session.user.id;
    const activities: Array<{
      id: string;
      type: 'task' | 'goal' | 'exercise' | 'application' | 'note';
      action: string;
      timestamp: Date;
    }> = [];

    // Fetch recent completed tasks (daily_tasks)
    const { data: completedTasks, error: tasksError } = await supabase
      .from('daily_tasks')
      .select('id, title, completed, created_at, updated_at')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (!tasksError && completedTasks) {
      completedTasks.forEach(task => {
        activities.push({
          id: `task-${task.id}`,
          type: 'task',
          action: `Completed task: ${task.title}`,
          timestamp: new Date(task.updated_at || task.created_at),
        });
      });
    }

    // Fetch recent goals (goals)
    const { data: recentGoals, error: goalsError } = await supabase
      .from('goals')
      .select('id, title, status, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!goalsError && recentGoals) {
      recentGoals.forEach(goal => {
        const action = goal.status === 'completed' 
          ? `Completed goal: ${goal.title}`
          : `Created goal: ${goal.title}`;
        activities.push({
          id: `goal-${goal.id}`,
          type: 'goal',
          action,
          timestamp: new Date(goal.status === 'completed' ? goal.updated_at : goal.created_at),
        });
      });
    }

    // Fetch recent completed exercises
    const { data: recentExercises, error: exercisesError } = await supabase
      .from('exercises')
      .select('id, exercise_number, completed, courses(name), created_at, updated_at')
      .eq('completed', true)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (!exercisesError && recentExercises) {
      recentExercises.forEach((exercise: any) => {
        activities.push({
          id: `exercise-${exercise.id}`,
          type: 'exercise',
          action: `Completed ${exercise.courses?.name || 'Course'} - Exercise ${exercise.exercise_number}`,
          timestamp: new Date(exercise.updated_at || exercise.created_at),
        });
      });
    }

    // Fetch recent job applications
    const { data: recentApps, error: appsError } = await supabase
      .from('job_applications')
      .select('id, company, position, status, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!appsError && recentApps) {
      recentApps.forEach(app => {
        activities.push({
          id: `application-${app.id}`,
          type: 'application',
          action: `Applied to ${app.company} - ${app.position}`,
          timestamp: new Date(app.created_at),
        });
      });
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Limit to requested number
    const limitedActivities = activities.slice(0, limit);

    return NextResponse.json({
      activities: limitedActivities,
      total: activities.length,
      limit,
    });

  } catch (error) {
    console.error('Activity feed error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity feed' },
      { status: 500 }
    );
  }
}
