// @ts-nocheck — references ops_cron_executions table not yet in generated Supabase types
/**
 * Cron Health Tracker — Phase 12 P0.1
 *
 * Records cron execution results (success/failure/duration) to ops_cron_executions.
 * Alerts on consecutive failures.
 * Gracefully degrades if migration not applied.
 */

import { createClient } from '@/lib/auth/server';
import { dispatchAlert } from '@/lib/ops/alertChannels';

export interface CronExecution {
  cronName: string;
  status: 'success' | 'failure' | 'timeout';
  durationMs: number;
  result?: Record<string, unknown>;
  errorMessage?: string;
}

interface TableStatusCache {
  value: boolean;
  expiresAt: number;
}

let tableStatusCache: TableStatusCache | null = null;
const TABLE_STATUS_TTL_MS = 30_000;

async function isTableAvailable(): Promise<boolean> {
  const now = Date.now();
  if (tableStatusCache && tableStatusCache.expiresAt > now) {
    return tableStatusCache.value;
  }
  const supabase = createClient();
  const { error } = await supabase.from('ops_cron_executions').select('id').limit(1);
  const available = !error;
  tableStatusCache = { value: available, expiresAt: now + TABLE_STATUS_TTL_MS };
  return available;
}

/** Record a cron execution to the database */
export async function recordCronExecution(execution: CronExecution): Promise<void> {
  const available = await isTableAvailable();
  if (!available) return;

  const supabase = createClient();
  const { error } = await supabase.from('ops_cron_executions').insert({
    cron_name: execution.cronName,
    status: execution.status,
    duration_ms: Math.round(execution.durationMs),
    result: execution.result ?? {},
    error_message: execution.errorMessage ?? null,
    started_at: new Date(Date.now() - execution.durationMs).toISOString(),
    completed_at: new Date().toISOString(),
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[CronHealth] failed to record execution:', error.message);
  }
}

/** Check for consecutive failures and alert */
export async function checkCronHealth(cronName: string, failureThreshold = 3): Promise<{
  healthy: boolean;
  consecutiveFailures: number;
}> {
  const available = await isTableAvailable();
  if (!available) return { healthy: true, consecutiveFailures: 0 };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('ops_cron_executions')
    .select('status')
    .eq('cron_name', cronName)
    .order('started_at', { ascending: false })
    .limit(failureThreshold);

  if (error || !data) return { healthy: true, consecutiveFailures: 0 };

  const consecutiveFailures = data.findIndex((r) => r.status === 'success');
  const actualFailures = consecutiveFailures === -1 ? data.length : consecutiveFailures;

  if (actualFailures >= failureThreshold) {
    await dispatchAlert({
      title: `Cron "${cronName}" failing`,
      severity: 'critical',
      summary: `Cron job "${cronName}" has failed ${actualFailures} consecutive times.`,
      details: { cronName, consecutiveFailures: actualFailures },
      triggeredAt: new Date().toISOString(),
      deduplicationKey: `cron-health:${cronName}`,
    }).catch(() => { /* swallow */ });
  }

  return {
    healthy: actualFailures < failureThreshold,
    consecutiveFailures: actualFailures,
  };
}

/**
 * Wrapper to instrument any cron handler with automatic health tracking.
 * Usage:
 *   const result = await withCronTracking('deadline-reminders', async () => { ... return data; });
 */
export async function withCronTracking<T>(
  cronName: string,
  handler: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await handler();
    await recordCronExecution({
      cronName,
      status: 'success',
      durationMs: Date.now() - start,
      result: typeof result === 'object' && result !== null ? result as Record<string, unknown> : { value: result },
    });
    return result;
  } catch (err) {
    await recordCronExecution({
      cronName,
      status: 'failure',
      durationMs: Date.now() - start,
      errorMessage: (err as Error).message,
    });
    throw err;
  }
}
