import { buildMonitoringFingerprint, inferSeverity } from '@/lib/monitoring/rules';
import {
  allowIngress,
  getMonitoringHealthSnapshot,
  markIncidentAlerted,
  upsertIncident,
} from '@/lib/monitoring/store';

export type MonitoringSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface MonitoringPayload {
  message: string;
  severity?: MonitoringSeverity;
  errorName?: string;
  stack?: string;
  context?: Record<string, unknown>;
  source?: 'client' | 'server' | 'api';
}

export type MonitoringHealthSnapshot = ReturnType<
  typeof import('@/lib/monitoring/store').getMonitoringHealthSnapshot
>;

function truncate(value: string, max = 4000): string {
  return value.length <= max ? value : `${value.slice(0, max)}...`;
}

function normalizePayload(payload: MonitoringPayload): Required<MonitoringPayload> {
  const inferredSeverity = inferSeverity(payload);
  return {
    message: truncate(payload.message || 'Unknown error'),
    severity: inferredSeverity,
    errorName: truncate(payload.errorName ?? 'Error'),
    stack: truncate(payload.stack ?? ''),
    context: payload.context ?? {},
    source: payload.source ?? 'server',
  };
}

async function tryCaptureWithSentry(payload: Required<MonitoringPayload>): Promise<void> {
  const moduleName = '@sentry/nextjs';
  try {
    const sentryModule = (await import(moduleName)) as {
      captureMessage?: (message: string, level?: string) => void;
      captureException?: (error: Error) => void;
      withScope?: (callback: (scope: { setTag: (key: string, value: string) => void; setContext: (name: string, value: Record<string, unknown>) => void }) => void) => void;
    };

    if (sentryModule.withScope && sentryModule.captureException) {
      sentryModule.withScope((scope) => {
        scope.setTag('source', payload.source);
        scope.setTag('severity', payload.severity);
        scope.setContext('monitoring_context', payload.context);
      });
      const err = new Error(payload.message);
      err.name = payload.errorName;
      if (payload.stack) err.stack = payload.stack;
      sentryModule.captureException(err);
      return;
    }

    sentryModule.captureMessage?.(payload.message, payload.severity);
  } catch {
    // Sentry package is optional. No-op if not installed.
  }
}

async function sendAlertWebhook(payload: Required<MonitoringPayload>): Promise<void> {
  const webhook = process.env.MONITORING_ALERT_WEBHOOK_URL;
  if (!webhook) return;
  if (payload.severity !== 'critical' && payload.severity !== 'error') return;

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `[Prism][${payload.severity.toUpperCase()}] ${payload.message}`,
        source: payload.source,
        context: payload.context,
      }),
    });
  } catch {
    // Avoid recursive monitoring failures.
  }
}

export async function captureServerError(error: unknown, payload: Omit<MonitoringPayload, 'message'> & { message?: string } = {}): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));
  const normalized = normalizePayload({
    message: payload.message ?? err.message,
    severity: payload.severity ?? 'error',
    errorName: err.name,
    ...(err.stack ? { stack: err.stack } : {}),
    ...(payload.context ? { context: payload.context } : {}),
    source: payload.source ?? 'server',
  });

  // Primary server log
  // eslint-disable-next-line no-console
  console.error('[Monitoring]', normalized.message, normalized);

  const fingerprint = buildMonitoringFingerprint({
    message: normalized.message,
    errorName: normalized.errorName,
    source: normalized.source,
  });

  const { shouldAlert } = upsertIncident({
    fingerprint,
    message: normalized.message,
    errorName: normalized.errorName,
    source: normalized.source,
    severity: normalized.severity,
    context: normalized.context,
  });

  const shouldSendExternal =
    shouldAlert || normalized.severity === 'critical' || normalized.severity === 'error';

  if (!shouldSendExternal) {
    await Promise.allSettled([tryCaptureWithSentry(normalized)]);
    return;
  }

  await Promise.allSettled([
    tryCaptureWithSentry(normalized),
    sendAlertWebhook(normalized),
  ]);

  markIncidentAlerted(fingerprint);
}

export function captureClientError(payload: MonitoringPayload): void {
  if (typeof window === 'undefined') return;
  const normalized = normalizePayload({ ...payload, source: payload.source ?? 'client' });
  const body = JSON.stringify(normalized);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/monitoring/error', blob);
      return;
    }
  } catch {
    // fallback below
  }

  void fetch('/api/monitoring/error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // silent fail
  });
}

export function isMonitoringEnabled(): boolean {
  return process.env.NODE_ENV !== 'test';
}

export function getMonitoringHealth() {
  return getMonitoringHealthSnapshot();
}

export function isMonitoringIngressAllowed(key: string): boolean {
  return allowIngress(key);
}
