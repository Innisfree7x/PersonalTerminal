import { NextRequest, NextResponse } from 'next/server';
import { updateApplication, deleteApplication } from '@/lib/supabase/applications';
import { createApplicationSchema } from '@/lib/schemas/application.schema';

/**
 * PATCH /api/applications/[id] - Update an existing application
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate input with Zod
    const validatedData = createApplicationSchema.parse({
      ...body,
      applicationDate: body.applicationDate ? new Date(body.applicationDate) : undefined,
      interviewDate: body.interviewDate ? new Date(body.interviewDate) : undefined,
    });

    const updatedApplication = await updateApplication(id, validatedData);
    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error(`Error updating application ${params.id}:`, error);

    // Check if it's a Zod validation error
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { message: 'Validation error', errors: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to update application' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/applications/[id] - Delete an application
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await deleteApplication(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting application ${params.id}:`, error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to delete application' },
      { status: 500 }
    );
  }
}
