import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { getDashboardStats } from '@/lib/dashboard/queries';
import { createApiTraceContext, withApiTraceHeaders } from '@/lib/api/observability';

/**
 * GET /api/dashboard/stats - Fetch dashboard statistics
 */
export async function GET(request: NextRequest) {
  const trace = createApiTraceContext(request, '/api/dashboard/stats');
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return withApiTraceHeaders(errorResponse, trace, { metricName: 'dash_stats' });

  try {
    const stats = await getDashboardStats(user.id);
    const response = NextResponse.json(stats);
    return withApiTraceHeaders(response, trace, { metricName: 'dash_stats' });
  } catch (error) {
    const response = handleRouteError(error, 'Failed to fetch stats', 'Error fetching dashboard stats');
    return withApiTraceHeaders(response, trace, { metricName: 'dash_stats' });
  }
}
