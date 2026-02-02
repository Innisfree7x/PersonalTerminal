import { NextRequest, NextResponse } from 'next/server';
import { createApplication, fetchApplications } from '@/lib/supabase/applications';
import { createApplicationSchema } from '@/lib/schemas/application.schema';

/**
 * GET /api/applications - Fetch all applications
 */
export async function GET() {
  try {
    const applications = await fetchApplications();
    return NextResponse.json(applications);
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
