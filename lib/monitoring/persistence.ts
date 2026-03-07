import { createAdminClient } from '@/lib/auth/admin';
import type { MonitoringPayload, MonitoringSeverity } from '@/lib/monitoring';

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function extractUserId(context: Record<string, unknown>): string | null {
  return asString(context.user_id) ?? asString(context.userId);
}

export interface PersistentErrorSnapshot {
  available: boolean;
  totalLast24h: number;
  bySeverityLast24h: Record<MonitoringSeverity, number>;
  topMessagesLast24h: Array<{ message: string; count: number; severity: MonitoringSeverity }>;
  reasonIfUnavailable?: string;
}

export async function persistMonitoringEvent(
  payload: Required<MonitoringPayload>,
  input: {
    fingerprint: string;
    requestPath?: string;
  }
): Promise<void> {
  try {
    const admin = createAdminClient() as any;
    await admin.from('ops_error_events').insert({
      fingerprint: input.fingerprint,
      severity: payload.severity,
      source: payload.source,
      message: payload.message,
      error_name: payload.errorName || null,
      stack: payload.stack || null,
      context: payload.context ?? {},
      user_id: extractUserId(payload.context ?? {}) ?? null,
      request_path: input.requestPath ?? asString(payload.context?.route) ?? null,
    });
  } catch {
    // no-op: persistent store is best-effort
  }
}

export async function fetchPersistentErrorSnapshot(): Promise<PersistentErrorSnapshot> {
  try {
    const admin = createAdminClient() as any;
    const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await admin
      .from('ops_error_events')
      .select('message,severity,created_at')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(2000);

    if (error) throw error;

    const rows = Array.isArray(data) ? data : [];
    const bySeverity: Record<MonitoringSeverity, number> = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    };
    const topMap = new Map<string, { message: string; count: number; severity: MonitoringSeverity }>();

    for (const row of rows) {
      const severity = (row.severity ?? 'error') as MonitoringSeverity;
      if (!bySeverity[severity]) bySeverity[severity] = 0;
      bySeverity[severity] += 1;

      const key = `${severity}:${row.message}`;
      const existing = topMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        topMap.set(key, {
          message: row.message,
          count: 1,
          severity,
        });
      }
    }

    const topMessagesLast24h = Array.from(topMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      available: true,
      totalLast24h: rows.length,
      bySeverityLast24h: bySeverity,
      topMessagesLast24h,
    };
  } catch (error) {
    return {
      available: false,
      totalLast24h: 0,
      bySeverityLast24h: {
        info: 0,
        warning: 0,
        error: 0,
        critical: 0,
      },
      topMessagesLast24h: [],
      reasonIfUnavailable: error instanceof Error ? error.message : 'unknown error',
    };
  }
}
