'use server';

import { requireAuth } from '@/lib/auth/server';
import { isAdminUser } from '@/lib/auth/authorization';
import {
  acknowledgeMonitoringIncident,
  clearMonitoringIncidents,
  dismissMonitoringIncident,
  getMonitoringHealth,
  isMonitoringEnabled,
  resolveMonitoringIncident,
  type MonitoringHealthSnapshot,
} from '@/lib/monitoring';
import { createAdminAuditLog, fetchRecentAdminAuditLogs } from '@/lib/monitoring/audit';

export type MonitoringIncidentAction = 'acknowledge' | 'resolve' | 'dismiss' | 'clear_all';

function assertAdmin() {
  return requireAuth().then((user) => {
    if (!isAdminUser(user)) {
      throw new Error('Admin access required');
    }
    return user;
  });
}

export async function fetchMonitoringHealthAction(
  options?: { auditView?: boolean }
): Promise<MonitoringHealthSnapshot> {
  const user = await assertAdmin();

  if (!isMonitoringEnabled()) {
    return {
      generatedAt: new Date().toISOString(),
      totals: { incidents: 0, events: 0, bySeverity: { info: 0, warning: 0, error: 0, critical: 0 } },
      topIncidents: [],
      auditLogMigrationApplied: false,
      recentAdminAuditLogs: [],
    };
  }

  const snapshot = getMonitoringHealth();
  if (options?.auditView) {
    await createAdminAuditLog({
      actorUserId: user.id,
      action: 'monitoring.health.view',
      resource: 'monitoring/health',
      metadata: { userEmail: user.email || null },
    });
  }

  const { migrationApplied, logs: recentAdminAuditLogs } = await fetchRecentAdminAuditLogs(25);
  return {
    ...snapshot,
    auditLogMigrationApplied: migrationApplied,
    recentAdminAuditLogs,
  };
}

export async function applyMonitoringIncidentAction(input: {
  action: MonitoringIncidentAction;
  fingerprint?: string;
}): Promise<{ ok: true; affected: number }> {
  const user = await assertAdmin();

  const fingerprint = input.fingerprint?.trim();
  let ok = false;
  let affected = 0;

  if (input.action === 'clear_all') {
    affected = clearMonitoringIncidents();
    ok = true;
  } else {
    if (!fingerprint) {
      throw new Error('Missing fingerprint');
    }

    if (input.action === 'acknowledge') {
      ok = acknowledgeMonitoringIncident(fingerprint);
    } else if (input.action === 'resolve') {
      ok = resolveMonitoringIncident(fingerprint);
    } else if (input.action === 'dismiss') {
      ok = dismissMonitoringIncident(fingerprint);
    }
    affected = ok ? 1 : 0;
  }

  if (!ok) {
    throw new Error('Incident not found');
  }

  await createAdminAuditLog({
    actorUserId: user.id,
    action: `monitoring.incident.${input.action}`,
    resource: 'monitoring/incidents',
    metadata: {
      userEmail: user.email || null,
      action: input.action,
      affected,
      ...(fingerprint ? { fingerprint } : {}),
    },
  });

  return { ok: true, affected };
}
