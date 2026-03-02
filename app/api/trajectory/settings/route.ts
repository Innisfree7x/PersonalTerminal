import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { trajectorySettingsSchema } from '@/lib/schemas/trajectory.schema';
import { getOrCreateTrajectorySettings, updateTrajectorySettings } from '@/lib/supabase/trajectory';

export async function GET() {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const settings = await getOrCreateTrajectorySettings(user.id);
    return NextResponse.json(settings);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch trajectory settings', 'Error fetching trajectory settings');
  }
}

export async function PATCH(request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const parsed = trajectorySettingsSchema.partial().parse(body);

    if (Object.keys(parsed).length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'No settings fields provided' } },
        { status: 400 }
      );
    }

    const settings = await updateTrajectorySettings(user.id, parsed);
    return NextResponse.json(settings);
  } catch (error) {
    return handleRouteError(error, 'Failed to update trajectory settings', 'Error updating trajectory settings');
  }
}
