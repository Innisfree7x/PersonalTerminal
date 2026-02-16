import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/api/auth';
import { getMonitoringHealth, isMonitoringEnabled } from '@/lib/monitoring';
import { createAdminAuditLog, fetchRecentAdminAuditLogs } from '@/lib/monitoring/audit';

export async function GET() {
  const { user, errorResponse } = await requireApiAdmin();
  if (errorResponse) return errorResponse;

  if (!isMonitoringEnabled()) {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      totals: { incidents: 0, events: 0, bySeverity: { info: 0, warning: 0, error: 0, critical: 0 } },
      topIncidents: [],
      recentAdminAuditLogs: [],
    });
  }

  const snapshot = getMonitoringHealth();
  await createAdminAuditLog({
    actorUserId: user.id,
    action: 'monitoring.health.view',
    resource: 'monitoring/health',
    metadata: {
      userEmail: user.email || null,
    },
  });
  const recentAdminAuditLogs = await fetchRecentAdminAuditLogs(25);
  return NextResponse.json(
    {
      ...snapshot,
      recentAdminAuditLogs,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
