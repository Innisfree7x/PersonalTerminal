import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { createTrajectoryWindowSchema } from '@/lib/schemas/trajectory.schema';
import { createTrajectoryWindow, listTrajectoryWindows } from '@/lib/supabase/trajectory';

export async function GET() {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const windows = await listTrajectoryWindows(user.id);
    return NextResponse.json(windows);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch trajectory windows', 'Error fetching trajectory windows');
  }
}

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const parsed = createTrajectoryWindowSchema.parse(body);

    const created = await createTrajectoryWindow(user.id, parsed);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleRouteError(error, 'Failed to create trajectory window', 'Error creating trajectory window');
  }
}
