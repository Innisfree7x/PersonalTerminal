import { NextRequest, NextResponse } from 'next/server';
import { createApplication, fetchApplications } from '@/lib/supabase/applications';
import { createApplicationSchema } from '@/lib/schemas/application.schema';

/**
 * GET /api/applications - Fetch applications with pagination
 * Query params:
 * - page: page number (default: 1)
 * - limit: items per page (default: 20, max: 100)
 * - status: filter by status (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status') || undefined;

    const { applications, total } = await fetchApplications({
      page,
      limit,
      status: status as any,
    });

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/applications - Create a new application
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const validatedData = createApplicationSchema.parse({
      ...body,
      applicationDate: body.applicationDate ? new Date(body.applicationDate) : undefined,
      interviewDate: body.interviewDate ? new Date(body.interviewDate) : undefined,
    });

    const application = await createApplication(validatedData);
    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error('Error creating application:', error);

    // Check if it's a Zod validation error
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { message: 'Validation error', errors: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create application' },
      { status: 500 }
    );
  }
}
