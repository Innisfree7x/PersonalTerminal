import { NextRequest, NextResponse } from 'next/server';
import { requireCronAuth } from '@/lib/api/cron';
import { handleRouteError } from '@/lib/api/server-errors';
import { syncAllCampusWebcalProfiles } from '@/lib/kit-sync/service';
import { withCronTracking } from '@/lib/ops/cronHealth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  try {
    const result = await withCronTracking('kit-webcal-sync', async () => {
      const sync = await syncAllCampusWebcalProfiles();
      return {
        ok: true,
        source: 'campus_webcal',
        ...sync,
        generatedAt: new Date().toISOString(),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error, 'KIT WebCal Cron konnte nicht ausgeführt werden.', 'Error running KIT WebCal cron');
  }
}
