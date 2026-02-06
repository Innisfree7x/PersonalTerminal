import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';

/**
 * GET /api/activity/recent - Fetch recent user activity
 * For now, returns mock data.
 *
 * TODO: Implement proper authentication and database queries
 * when user_id columns are added to tables
 */
export async function GET() {
  const { errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    // TODO: Implement proper authentication and fetch user ID
    // const userId = 'anonymous'; // Placeholder for now

    // In a real application, you would fetch recent activities from your database
    // For example:
    // const { data, error } = await supabase
    //   .from('activities')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .order('timestamp', { ascending: false })
    //   .limit(5);
    // if (error) throw error;

    // Mock data for demonstration
    const mockActivities = [
      { id: '1', type: 'exercise', action: 'Completed Exercise 3 for GDI 2', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { id: '2', type: 'goal', action: 'Added new goal: Learn TypeScript', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
      { id: '3', type: 'task', action: 'Completed task: Review PRs', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { id: '4', type: 'application', action: 'Applied to Google (Software Engineer)', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: '5', type: 'note', action: 'Added quick note about project idea', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    ];

    return NextResponse.json({ activities: mockActivities });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch recent activity' },
      { status: 500 }
    );
  }
}
