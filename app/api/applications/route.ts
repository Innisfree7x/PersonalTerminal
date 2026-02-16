import { NextRequest, NextResponse } from 'next/server';
import { createApplication, fetchApplications } from '@/lib/supabase/applications';
import { createApplicationSchema } from '@/lib/schemas/application.schema';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';

/**
 * GET /api/applications - Fetch applications with pagination
 * Query params:
 * - page: page number (default: 1)
 * - limit: items per page (default: 20, max: 100)
 * - status: filter by status (optional)
 */
export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status') || undefined;

    const { applications } = await fetchApplications({
      userId: user.id,
      page,
      limit,
      status: status as 'applied' | 'interview' | 'offer' | 'rejected' | undefined,
    });

    // Return array directly for frontend compatibility
    return NextResponse.json(applications);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch applications', 'Error fetching applications');
  }
}

/**
 * POST /api/applications - Create a new application
 */
export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();

    // Validate input with Zod
    const validatedData = createApplicationSchema.parse({
      ...body,
      applicationDate: body.applicationDate ? new Date(body.applicationDate) : undefined,
      interviewDate: body.interviewDate ? new Date(body.interviewDate) : undefined,
    });

    const application = await createApplication(user.id, validatedData);
    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    return handleRouteError(error, 'Failed to create application', 'Error creating application');
  }
}
