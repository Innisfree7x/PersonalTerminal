import type { MonitoringPayload, MonitoringSeverity } from '@/lib/monitoring';

function includesAny(value: string, needles: string[]): boolean {
  const lower = value.toLowerCase();
  return needles.some((needle) => lower.includes(needle));
}

export function inferSeverity(payload: MonitoringPayload): MonitoringSeverity {
  if (payload.severity) return payload.severity;

  const message = payload.message || '';
  const contextSerialized = JSON.stringify(payload.context || {}).toLowerCase();
  const source = payload.source || 'server';

  if (includesAny(message, ['critical', 'crash', 'fatal']) || includesAny(contextSerialized, ['critical'])) {
    return 'critical';
  }

  if (includesAny(message, ['unauthorized', 'forbidden', 'validation', 'bad request'])) {
    return source === 'api' ? 'warning' : 'error';
  }

  if (includesAny(message, ['timeout', 'network', 'unhandled', 'exception', 'failed'])) {
    return 'error';
  }

  if (includesAny(message, ['poor web vital', 'slow', 'lag', 'degraded'])) {
    return 'warning';
  }

  return 'error';
}

export function buildMonitoringFingerprint(payload: {
  message: string;
  source: string;
  errorName: string;
}): string {
  const raw = `${payload.source}|${payload.errorName}|${payload.message}`
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\d+/g, '#')
    .trim();

  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `fp_${Math.abs(hash)}`;
}

export function alertCooldownMs(severity: MonitoringSeverity): number {
  switch (severity) {
    case 'critical':
      return 60 * 1000;
    case 'error':
      return 5 * 60 * 1000;
    case 'warning':
      return 15 * 60 * 1000;
    default:
      return 60 * 60 * 1000;
  }
}
