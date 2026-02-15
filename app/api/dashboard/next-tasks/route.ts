import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { getDashboardNextTasks } from '@/lib/dashboard/queries';

/**
 * GET /api/dashboard/next-tasks - Returns actionable next tasks
 */
export async function GET(_request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const result = await getDashboardNextTasks(user.id);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch next tasks', 'Error fetching next tasks');
  }
}
