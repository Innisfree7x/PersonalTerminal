import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { createClient } from '@/lib/auth/server';
import {
  listAvailableSemesters,
  listKitCoursesForSemesters,
} from '@/lib/supabase/kitCourses';

export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const supabase = createClient();
    const url = new URL(request.url);
    const rawSemesters = url.searchParams.getAll('semester').filter(Boolean);

    const availableSemesters = await listAvailableSemesters(supabase, user.id);
    const semesters =
      rawSemesters.length > 0 ? rawSemesters : availableSemesters.slice(0, 1);

    const result = await listKitCoursesForSemesters(supabase, user.id, semesters);

    return NextResponse.json({
      ...result,
      availableSemesters,
    });
  } catch (error) {
    return handleRouteError(
      error,
      'KIT-Kurse konnten nicht geladen werden.',
      'Error loading KIT courses'
    );
  }
}
