// @ts-nocheck — references ops_burn_rate_snapshots table not yet in generated Supabase types
/**
 * Ops Reliability Cron — Phase 12 P0.1
 *
 * Scheduled endpoint (every 5 min recommended) that:
 * 1. Evaluates SLO burn rates across all critical flows
 * 2. Fires alerts for breaches
 * 3. Persists burn-rate snapshots for trending
 * 4. Checks cron health for other scheduled jobs
 * 5. Self-tracks its own execution health
 *
 * Vercel Cron config in vercel.json:
 *   path: /api/cron/ops-reliability, schedule: every 5 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCronAuth } from '@/lib/api/cron';
import { handleRouteError } from '@/lib/api/server-errors';
import { evaluateBurnRates, summarizeBurnRateStatus } from '@/lib/ops/burnRateAlerts';
import { withCronTracking, checkCronHealth } from '@/lib/ops/cronHealth';
import { getDependencyHealthStatus } from '@/lib/ops/degradation';
import { createClient } from '@/lib/auth/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function persistBurnRateSnapshots(
  evaluations: Awaited<ReturnType<typeof evaluateBurnRates>>['evaluations']
): Promise<number> {
  try {
    const supabase = createClient();
    // Check table availability
    const { error: checkError } = await supabase
      .from('ops_burn_rate_snapshots')
      .select('id')
      .limit(1);

    if (checkError) return 0; // Table not yet created

    const rows = evaluations
      .filter((e) => e.totalSamples > 0) // Only persist flows with data
      .map((e) => ({
        flow: e.flow,
        window_label: e.window,
        window_hours: e.windowHours,
        burn_rate: e.burnRate,
        availability_pct: e.availabilityPct,
        p95_ms: e.p95Ms,
        total_samples: e.totalSamples,
        budget_remaining_pct: e.budgetRemaining,
        severity: e.severity,
        evaluated_at: new Date().toISOString(),
      }));

    if (rows.length === 0) return 0;

    const { error } = await supabase.from('ops_burn_rate_snapshots').insert(rows);
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[OpsReliability] failed to persist burn rate snapshots:', error.message);
      return 0;
    }
    return rows.length;
  } catch {
    return 0;
  }
}

export async function GET(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  try {
    const result = await withCronTracking('ops-reliability', async () => {
      // 1. Evaluate SLO burn rates + fire alerts
      const burnReport = await evaluateBurnRates();
      const burnStatus = summarizeBurnRateStatus(burnReport.evaluations);

      // 2. Persist snapshots for trending
      const snapshotsPersisted = await persistBurnRateSnapshots(burnReport.evaluations);

      // 3. Check health of other cron jobs
      const [deadlineHealth, weeklyReportHealth] = await Promise.all([
        checkCronHealth('deadline-reminders'),
        checkCronHealth('weekly-report'),
      ]);

      // 4. Get dependency health
      const dependencyHealth = getDependencyHealthStatus();

      return {
        ok: true,
        generatedAt: new Date().toISOString(),
        burnRate: {
          status: burnStatus.status,
          criticalFlows: burnStatus.criticalFlows,
          warningFlows: burnStatus.warningFlows,
          alertsFired: burnReport.alertsFired,
          alertsSuppressed: burnReport.alertsSuppressed,
          evaluationsCount: burnReport.evaluations.length,
          snapshotsPersisted,
        },
        cronHealth: {
          'deadline-reminders': deadlineHealth,
          'weekly-report': weeklyReportHealth,
        },
        dependencyHealth,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error, 'Ops reliability check failed', 'Error in ops-reliability cron');
  }
}
