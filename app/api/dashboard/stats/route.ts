import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { getDashboardStats } from '@/lib/dashboard/queries';

/**
 * GET /api/dashboard/stats - Fetch dashboard statistics
 */
export async function GET(_request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const stats = await getDashboardStats(user.id);
    return NextResponse.json(stats);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch stats', 'Error fetching dashboard stats');
  }
}
