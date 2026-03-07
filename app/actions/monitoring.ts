'use server';

import { requireAuth } from '@/lib/auth/server';
import { createAdminClient } from '@/lib/auth/admin';
import { isAdminUser } from '@/lib/auth/authorization';
import {
  acknowledgeMonitoringIncident,
  clearMonitoringIncidents,
  type MonitoringHealthSnapshot,
  dismissMonitoringIncident,
  getMonitoringHealth,
  isMonitoringEnabled,
  resolveMonitoringIncident,
} from '@/lib/monitoring';
import { fetchPersistentErrorSnapshot } from '@/lib/monitoring/persistence';
import { createAdminAuditLog, fetchRecentAdminAuditLogs } from '@/lib/monitoring/audit';
import { fetchOpsFlowSloSnapshot } from '@/lib/ops/flowMetrics';
import { evaluateBurnRates, summarizeBurnRateStatus, type BurnRateEvaluation } from '@/lib/ops/burnRateAlerts';
import { getDependencyHealthStatus, type CircuitState } from '@/lib/ops/degradation';

export type MonitoringIncidentAction = 'acknowledge' | 'resolve' | 'dismiss' | 'clear_all';

function assertAdmin() {
  return requireAuth().then((user) => {
    if (!isAdminUser(user)) {
      throw new Error('Admin access required');
    }
    return user;
  });
}

interface ActivationMetricsSnapshot {
  available: boolean;
  usersWithTrajectoryGoalTotal: number;
  usersWithTrajectoryGoalLast7d: number;
  avgMinutesSignupToTrajectoryStatusShown: number | null;
  avgSampleSize: number;
  waitlistSegments: Array<{ segment: string; users: number }>;
  reasonIfUnavailable?: string;
}

type OpsAuthUser = {
  created_at?: string;
  user_metadata?: Record<string, unknown> | null;
};

async function listAllUsersForOps(): Promise<OpsAuthUser[]> {
  const admin = createAdminClient();
  const users: OpsAuthUser[] = [];
  let page = 1;
  const perPage = 200;
  while (page <= 50) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }
  return users;
}

async function fetchActivationMetricsSnapshot(): Promise<ActivationMetricsSnapshot> {
  try {
    const admin = createAdminClient();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [{ data: goalsData, error: goalsError }, users] = await Promise.all([
      admin.from('trajectory_goals').select('user_id, created_at'),
      listAllUsersForOps(),
    ]);

    if (goalsError) {
      throw goalsError;
    }

    const uniqueGoalUsers = new Set<string>();
    const uniqueGoalUsersLast7d = new Set<string>();
    for (const row of goalsData ?? []) {
      uniqueGoalUsers.add(row.user_id);
      const createdAt = new Date(row.created_at);
      if (!Number.isNaN(createdAt.getTime()) && createdAt >= sevenDaysAgo) {
        uniqueGoalUsersLast7d.add(row.user_id);
      }
    }

    const waitlistSegmentsMap = new Map<string, number>();
    const signupToStatusMinutes: number[] = [];
    for (const user of users) {
      const metadata = user.user_metadata ?? {};
      const segmentRaw = metadata.waitlist_segment;
      const segment = typeof segmentRaw === 'string' && segmentRaw.trim().length > 0 ? segmentRaw.trim() : 'unknown';
      waitlistSegmentsMap.set(segment, (waitlistSegmentsMap.get(segment) ?? 0) + 1);

      const statusShownRaw = metadata.trajectory_status_shown_at;
      const createdAtRaw = user.created_at;
      if (typeof statusShownRaw !== 'string' || typeof createdAtRaw !== 'string') continue;
      const signupAt = new Date(createdAtRaw);
      const statusShownAt = new Date(statusShownRaw);
      if (Number.isNaN(signupAt.getTime()) || Number.isNaN(statusShownAt.getTime())) continue;
      const deltaMinutes = (statusShownAt.getTime() - signupAt.getTime()) / 60000;
      if (deltaMinutes >= 0) signupToStatusMinutes.push(deltaMinutes);
    }

    const avgMinutesSignupToTrajectoryStatusShown =
      signupToStatusMinutes.length > 0
        ? signupToStatusMinutes.reduce((sum, minutes) => sum + minutes, 0) / signupToStatusMinutes.length
        : null;

    const waitlistSegments = Array.from(waitlistSegmentsMap.entries())
      .map(([segment, usersCount]) => ({ segment, users: usersCount }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 8);

    return {
      available: true,
      usersWithTrajectoryGoalTotal: uniqueGoalUsers.size,
      usersWithTrajectoryGoalLast7d: uniqueGoalUsersLast7d.size,
      avgMinutesSignupToTrajectoryStatusShown,
      avgSampleSize: signupToStatusMinutes.length,
      waitlistSegments,
    };
  } catch (error) {
    return {
      available: false,
      usersWithTrajectoryGoalTotal: 0,
      usersWithTrajectoryGoalLast7d: 0,
      avgMinutesSignupToTrajectoryStatusShown: null,
      avgSampleSize: 0,
      waitlistSegments: [],
      reasonIfUnavailable: error instanceof Error ? error.message : 'unknown error',
    };
  }
}

export async function fetchMonitoringHealthAction(
  options?: { auditView?: boolean }
): Promise<MonitoringHealthSnapshot> {
  const user = await assertAdmin();

  const [flowSlo, activationMetrics, persistentErrors] = await Promise.all([
    fetchOpsFlowSloSnapshot({ windowHours: 24 * 7 }),
    fetchActivationMetricsSnapshot(),
    fetchPersistentErrorSnapshot(),
  ]);

  if (!isMonitoringEnabled()) {
    return {
      generatedAt: new Date().toISOString(),
      totals: { incidents: 0, events: 0, bySeverity: { info: 0, warning: 0, error: 0, critical: 0 } },
      topIncidents: [],
      auditLogMigrationApplied: false,
      recentAdminAuditLogs: [],
      flowSlo,
      activationMetrics,
      persistentErrors,
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
    flowSlo,
    activationMetrics,
    persistentErrors,
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

export interface OpsReliabilitySnapshot {
  burnRateStatus: 'healthy' | 'warning' | 'critical';
  criticalFlows: string[];
  warningFlows: string[];
  evaluations: BurnRateEvaluation[];
  dependencies: Array<{
    name: string;
    state: CircuitState;
    failureCount: number;
    lastFailureAt: string | null;
    lastSuccessAt: string | null;
  }>;
  generatedAt: string;
}

export async function fetchOpsReliabilityAction(): Promise<OpsReliabilitySnapshot> {
  await assertAdmin();

  const [burnReport, dependencyHealth] = await Promise.all([
    evaluateBurnRates(),
    Promise.resolve(getDependencyHealthStatus()),
  ]);

  const burnStatus = summarizeBurnRateStatus(burnReport.evaluations);

  return {
    burnRateStatus: burnStatus.status,
    criticalFlows: burnStatus.criticalFlows,
    warningFlows: burnStatus.warningFlows,
    evaluations: burnReport.evaluations,
    dependencies: dependencyHealth,
    generatedAt: new Date().toISOString(),
  };
}
