import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { getKitSyncStatus } from '@/lib/kit-sync/service';

export async function GET(_request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const status = await getKitSyncStatus(user.id);
    return NextResponse.json(status);
  } catch (error) {
    return handleRouteError(error, 'KIT Sync Status konnte nicht geladen werden.', 'Error loading KIT sync status');
  }
}
