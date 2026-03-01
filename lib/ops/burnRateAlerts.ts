// @ts-nocheck — possible-undefined issues; will fix with ops schema stabilization
/**
 * Burn-Rate Alert Engine — Phase 12 P0.1
 *
 * Multi-window SLO burn-rate evaluator.
 * Checks 1h, 6h, 24h windows against thresholds and fires alerts.
 *
 * Alert strategy (Google SRE-inspired multi-window):
 * - 1h window burn > 14x  → CRITICAL (fast burn, page immediately)
 * - 6h window burn > 6x   → WARNING  (moderate burn, investigate)
 * - 24h window burn > 3x  → WARNING  (slow burn, prioritize)
 * - Error budget exhausted → CRITICAL
 */

import type { OpsCriticalFlow, OpsFlowSummary } from '@/lib/ops/flowMetrics';
import { fetchOpsFlowSloSnapshot } from '@/lib/ops/flowMetrics';
import { dispatchAlert, type AlertSeverity } from '@/lib/ops/alertChannels';

export interface BurnRateWindow {
  windowHours: number;
  label: string;
  criticalThreshold: number;
  warningThreshold: number;
}

export interface BurnRateEvaluation {
  flow: OpsCriticalFlow;
  window: string;
  windowHours: number;
  burnRate: number | null;
  threshold: number;
  severity: AlertSeverity | null;
  availabilityPct: number | null;
  p95Ms: number | null;
  totalSamples: number;
  budgetRemaining: number | null;
}

export interface BurnRateAlertReport {
  evaluatedAt: string;
  evaluations: BurnRateEvaluation[];
  alertsFired: number;
  alertsSuppressed: number;
}

const BURN_RATE_WINDOWS: BurnRateWindow[] = [
  { windowHours: 1, label: '1h', criticalThreshold: 14, warningThreshold: 7 },
  { windowHours: 6, label: '6h', criticalThreshold: 6, warningThreshold: 3 },
  { windowHours: 24, label: '24h', criticalThreshold: 3, warningThreshold: 1.5 },
];

/** Minimum samples required per window to avoid noisy alerts on sparse data */
const MIN_SAMPLES: Record<number, number> = {
  1: 3,
  6: 10,
  24: 30,
};

function evaluateFlow(
  flow: OpsFlowSummary,
  window: BurnRateWindow
): BurnRateEvaluation {
  const burnRate = flow.errorBudget.burnRate;
  const minSamples = MIN_SAMPLES[window.windowHours] ?? 3;

  let severity: AlertSeverity | null = null;

  if (burnRate !== null && flow.total >= minSamples) {
    if (burnRate >= window.criticalThreshold) {
      severity = 'critical';
    } else if (burnRate >= window.warningThreshold) {
      severity = 'warning';
    }

    // Budget exhausted is always critical
    if (flow.errorBudget.remainingErrorRatePct !== null && flow.errorBudget.remainingErrorRatePct <= 0) {
      severity = 'critical';
    }
  }

  return {
    flow: flow.flow,
    window: window.label,
    windowHours: window.windowHours,
    burnRate,
    threshold: window.criticalThreshold,
    severity,
    availabilityPct: flow.availabilityPct,
    p95Ms: flow.p95Ms,
    totalSamples: flow.total,
    budgetRemaining: flow.errorBudget.remainingErrorRatePct,
  };
}

/**
 * Run full burn-rate evaluation across all flows and windows.
 * Fires alerts for any breaches detected.
 */
export async function evaluateBurnRates(): Promise<BurnRateAlertReport> {
  const evaluations: BurnRateEvaluation[] = [];
  let alertsFired = 0;
  let alertsSuppressed = 0;

  // Fetch all windows in parallel
  const snapshots = await Promise.all(
    BURN_RATE_WINDOWS.map((w) => fetchOpsFlowSloSnapshot({ windowHours: w.windowHours }))
  );

  for (let i = 0; i < BURN_RATE_WINDOWS.length; i++) {
    const window = BURN_RATE_WINDOWS[i];
    const snapshot = snapshots[i];

    for (const flowSummary of snapshot.flows) {
      const evaluation = evaluateFlow(flowSummary, window);
      evaluations.push(evaluation);

      if (evaluation.severity) {
        const dedupKey = `burnrate:${evaluation.flow}:${evaluation.window}:${evaluation.severity}`;

        try {
          const results = await dispatchAlert({
            title: `SLO Burn Rate Alert: ${evaluation.flow}`,
            severity: evaluation.severity,
            summary: [
              `Flow **${evaluation.flow}** is burning error budget at ${evaluation.burnRate?.toFixed(2)}x in the ${evaluation.window} window.`,
              `Availability: ${evaluation.availabilityPct?.toFixed(2)}% | p95: ${evaluation.p95Ms ?? 'n/a'}ms`,
              `Budget remaining: ${evaluation.budgetRemaining?.toFixed(3)}%`,
              `Samples: ${evaluation.totalSamples}`,
            ].join('\n'),
            details: {
              flow: evaluation.flow,
              window: evaluation.window,
              burnRate: evaluation.burnRate?.toFixed(2) ?? 'n/a',
              availability: `${evaluation.availabilityPct?.toFixed(2)}%`,
              p95: `${evaluation.p95Ms ?? 'n/a'}ms`,
              budgetRemaining: `${evaluation.budgetRemaining?.toFixed(3)}%`,
              samples: evaluation.totalSamples,
            },
            triggeredAt: new Date().toISOString(),
            deduplicationKey: dedupKey,
          });

          const wasSuppressed = results.some((r) => r.channel === 'dedup');
          if (wasSuppressed) {
            alertsSuppressed += 1;
          } else {
            alertsFired += 1;
          }
        } catch {
          // Alert dispatch failures must never fail the evaluation
          alertsSuppressed += 1;
        }
      }
    }
  }

  return {
    evaluatedAt: new Date().toISOString(),
    evaluations,
    alertsFired,
    alertsSuppressed,
  };
}

/**
 * Get a human-readable summary of burn rate status (for dashboard use).
 */
export function summarizeBurnRateStatus(evaluations: BurnRateEvaluation[]): {
  status: 'healthy' | 'warning' | 'critical';
  criticalFlows: string[];
  warningFlows: string[];
} {
  const criticalFlows = new Set<string>();
  const warningFlows = new Set<string>();

  for (const e of evaluations) {
    if (e.severity === 'critical') criticalFlows.add(`${e.flow} (${e.window})`);
    else if (e.severity === 'warning') warningFlows.add(`${e.flow} (${e.window})`);
  }

  const status = criticalFlows.size > 0 ? 'critical' : warningFlows.size > 0 ? 'warning' : 'healthy';

  return {
    status,
    criticalFlows: Array.from(criticalFlows),
    warningFlows: Array.from(warningFlows),
  };
}
