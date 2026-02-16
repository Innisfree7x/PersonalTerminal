import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/api/auth';
import { getMonitoringHealth, isMonitoringEnabled } from '@/lib/monitoring';

export async function GET() {
  const { errorResponse } = await requireApiAdmin();
  if (errorResponse) return errorResponse;

  if (!isMonitoringEnabled()) {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      totals: { incidents: 0, events: 0, bySeverity: { info: 0, warning: 0, error: 0, critical: 0 } },
      topIncidents: [],
    });
  }

  const snapshot = getMonitoringHealth();
  return NextResponse.json(snapshot, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
