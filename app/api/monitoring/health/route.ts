import { NextRequest, NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/api/auth';
import { getMonitoringHealth, isMonitoringEnabled } from '@/lib/monitoring';
import { createAdminAuditLog, fetchRecentAdminAuditLogs } from '@/lib/monitoring/audit';

export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireApiAdmin();
  if (errorResponse) return errorResponse;

  if (!isMonitoringEnabled()) {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      totals: { incidents: 0, events: 0, bySeverity: { info: 0, warning: 0, error: 0, critical: 0 } },
      topIncidents: [],
      auditLogMigrationApplied: false,
      recentAdminAuditLogs: [],
    });
  }

  const snapshot = getMonitoringHealth();
  const shouldAudit = request.nextUrl.searchParams.get('audit') === '1';
  if (shouldAudit) {
    await createAdminAuditLog({
      actorUserId: user.id,
      action: 'monitoring.health.view',
      resource: 'monitoring/health',
      metadata: {
        userEmail: user.email || null,
      },
    });
  }
  const { migrationApplied, logs: recentAdminAuditLogs } = await fetchRecentAdminAuditLogs(25);
  return NextResponse.json(
    {
      ...snapshot,
      auditLogMigrationApplied: migrationApplied,
      recentAdminAuditLogs,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
