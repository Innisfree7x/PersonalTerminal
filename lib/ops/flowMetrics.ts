import { createClient } from '@/lib/auth/server';
import type { Database, Json } from '@/lib/supabase/types';

export type OpsCriticalFlow = 'login' | 'create_task' | 'toggle_exercise' | 'today_load';
export type OpsFlowStatus = 'success' | 'failure';

type OpsFlowMetricInsert = Database['public']['Tables']['ops_flow_metrics']['Insert'];

export interface RecordFlowMetricInput {
  flow: OpsCriticalFlow;
  status: OpsFlowStatus;
  durationMs: number;
  userId?: string | null;
  route?: string;
  requestId?: string;
  errorCode?: string;
  context?: Json;
}

export interface OpsFlowSloTarget {
  availabilityPct: number;
  p95Ms: number;
}

export interface OpsFlowSummary {
  flow: OpsCriticalFlow;
  target: OpsFlowSloTarget;
  total: number;
  success: number;
  failure: number;
  availabilityPct: number | null;
  p95Ms: number | null;
  errorBudget: {
    allowedErrorRatePct: number;
    consumedErrorRatePct: number | null;
    remainingErrorRatePct: number | null;
    burnRate: number | null;
  };
}

export interface OpsFlowSloSnapshot {
  generatedAt: string;
  windowHours: number;
  from: string;
  to: string;
  migrationApplied: boolean;
  flows: OpsFlowSummary[];
}

interface OpsFlowMetricRow {
  flow: OpsCriticalFlow;
  status: OpsFlowStatus;
  duration_ms: number;
}

interface OpsFlowTableStatusCache {
  value: boolean;
  expiresAt: number;
}

const FLOW_SLO_TARGETS: Record<OpsCriticalFlow, OpsFlowSloTarget> = {
  login: { availabilityPct: 99.9, p95Ms: 1500 },
  create_task: { availabilityPct: 99.5, p95Ms: 700 },
  toggle_exercise: { availabilityPct: 99.5, p95Ms: 500 },
  today_load: { availabilityPct: 99.5, p95Ms: 2000 },
};

const OPS_FLOW_TABLE_STATUS_TTL_MS = 30_000;
let opsFlowTableStatusCache: OpsFlowTableStatusCache | null = null;

function clampDuration(durationMs: number): number {
  if (!Number.isFinite(durationMs)) return 0;
  if (durationMs < 0) return 0;
  if (durationMs > 120_000) return 120_000;
  return Math.round(durationMs);
}

function normalizeText(value: string | undefined, maxLength: number): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length <= maxLength ? trimmed : trimmed.slice(0, maxLength);
}

function computeP95(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rawIndex = Math.ceil(sorted.length * 0.95) - 1;
  const index = Math.min(sorted.length - 1, Math.max(0, rawIndex));
  const value = sorted[index];
  return value === undefined ? null : value;
}

function createBaseSummary(flow: OpsCriticalFlow): OpsFlowSummary {
  const target = FLOW_SLO_TARGETS[flow];
  return {
    flow,
    target,
    total: 0,
    success: 0,
    failure: 0,
    availabilityPct: null,
    p95Ms: null,
    errorBudget: {
      allowedErrorRatePct: Number((100 - target.availabilityPct).toFixed(4)),
      consumedErrorRatePct: null,
      remainingErrorRatePct: null,
      burnRate: null,
    },
  };
}

export async function isOpsFlowMetricsTableAvailable(): Promise<boolean> {
  const now = Date.now();
  if (opsFlowTableStatusCache && opsFlowTableStatusCache.expiresAt > now) {
    return opsFlowTableStatusCache.value;
  }

  const supabase = createClient();
  const { error } = await supabase.from('ops_flow_metrics').select('id').limit(1);
  const available = !error;
  opsFlowTableStatusCache = {
    value: available,
    expiresAt: now + OPS_FLOW_TABLE_STATUS_TTL_MS,
  };
  return available;
}

export async function recordFlowMetric(input: RecordFlowMetricInput): Promise<void> {
  const tableAvailable = await isOpsFlowMetricsTableAvailable();
  if (!tableAvailable) return;

  const route = normalizeText(input.route, 120);
  const requestId = normalizeText(input.requestId, 120);
  const errorCode = normalizeText(input.errorCode, 80);
  const row: OpsFlowMetricInsert = {
    flow: input.flow,
    status: input.status,
    duration_ms: clampDuration(input.durationMs),
    user_id: input.userId ?? null,
    route: route ?? null,
    request_id: requestId ?? null,
    error_code: errorCode ?? null,
    ...(input.context !== undefined ? { context: input.context } : {}),
  };

  const supabase = createClient();
  const { error } = await supabase.from('ops_flow_metrics').insert(row);
  if (error) {
    // Do not break product flows if observability write fails.
    // eslint-disable-next-line no-console
    console.warn('[OpsFlowMetrics] failed to insert metric:', error.message);
  }
}

export async function fetchOpsFlowSloSnapshot(
  options?: { windowHours?: number }
): Promise<OpsFlowSloSnapshot> {
  const windowHours = Math.max(1, Math.min(24 * 30, Math.round(options?.windowHours ?? 24 * 7)));
  const to = new Date();
  const from = new Date(to.getTime() - windowHours * 60 * 60 * 1000);
  const empty: OpsFlowSloSnapshot = {
    generatedAt: to.toISOString(),
    windowHours,
    from: from.toISOString(),
    to: to.toISOString(),
    migrationApplied: false,
    flows: (Object.keys(FLOW_SLO_TARGETS) as OpsCriticalFlow[]).map(createBaseSummary),
  };

  const tableAvailable = await isOpsFlowMetricsTableAvailable();
  if (!tableAvailable) {
    return empty;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('ops_flow_metrics')
    .select('flow, status, duration_ms')
    .gte('measured_at', from.toISOString())
    .lte('measured_at', to.toISOString())
    .order('measured_at', { ascending: false })
    .limit(10_000);

  if (error || !data) {
    return empty;
  }

  const rows = data as OpsFlowMetricRow[];
  const summaries = (Object.keys(FLOW_SLO_TARGETS) as OpsCriticalFlow[]).map((flow) => {
    const summary = createBaseSummary(flow);
    const flowRows = rows.filter((row) => row.flow === flow);
    const successDurations: number[] = [];

    for (const row of flowRows) {
      summary.total += 1;
      if (row.status === 'success') {
        summary.success += 1;
        successDurations.push(row.duration_ms);
      } else {
        summary.failure += 1;
      }
    }

    if (summary.total > 0) {
      const availability = (summary.success / summary.total) * 100;
      summary.availabilityPct = Number(availability.toFixed(3));

      const consumed = 100 - availability;
      const allowed = summary.errorBudget.allowedErrorRatePct;
      const remaining = Math.max(0, allowed - consumed);
      summary.errorBudget.consumedErrorRatePct = Number(consumed.toFixed(4));
      summary.errorBudget.remainingErrorRatePct = Number(remaining.toFixed(4));
      summary.errorBudget.burnRate =
        allowed > 0 ? Number((consumed / allowed).toFixed(4)) : null;
    }

    summary.p95Ms = computeP95(successDurations);
    return summary;
  });

  return {
    generatedAt: new Date().toISOString(),
    windowHours,
    from: from.toISOString(),
    to: to.toISOString(),
    migrationApplied: true,
    flows: summaries,
  };
}
