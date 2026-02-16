import { NextRequest, NextResponse } from 'next/server';
import { updateApplication, deleteApplication } from '@/lib/supabase/applications';
import { createApplicationSchema } from '@/lib/schemas/application.schema';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';

/**
 * PATCH /api/applications/[id] - Update an existing application
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;
    const body = await request.json();

    // Validate input with Zod
    const validatedData = createApplicationSchema.parse({
      ...body,
      applicationDate: body.applicationDate ? new Date(body.applicationDate) : undefined,
      interviewDate: body.interviewDate ? new Date(body.interviewDate) : undefined,
    });

    const updatedApplication = await updateApplication(user.id, id, validatedData);
    return NextResponse.json(updatedApplication);
  } catch (error) {
    return handleRouteError(error, 'Failed to update application', `Error updating application ${params.id}`);
  }
}

/**
 * DELETE /api/applications/[id] - Delete an application
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const { id } = params;
    await deleteApplication(user.id, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error, 'Failed to delete application', `Error deleting application ${params.id}`);
  }
}
