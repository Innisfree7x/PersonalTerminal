import { serverEnv } from '@/lib/env';
import type { MonitoringPayload } from '@/lib/monitoring';

interface ParsedDsn {
  origin: string;
  projectId: string;
  publicKey: string;
}

export function parseSentryDsn(dsn: string): ParsedDsn | null {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/\//g, '').trim();
    if (!projectId || !url.username) return null;
    return {
      origin: url.origin,
      projectId,
      publicKey: url.username,
    };
  } catch {
    return null;
  }
}

function normalizeLevel(severity: MonitoringPayload['severity']): 'info' | 'warning' | 'error' | 'fatal' {
  if (severity === 'critical') return 'fatal';
  if (severity === 'warning') return 'warning';
  if (severity === 'info') return 'info';
  return 'error';
}

export function buildSentryEnvelope(payload: Required<MonitoringPayload>, dsn: string): string | null {
  const parsed = parseSentryDsn(dsn);
  if (!parsed) return null;

  const event = {
    event_id: crypto.randomUUID().replace(/-/g, ''),
    level: normalizeLevel(payload.severity),
    message: payload.message,
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    tags: {
      source: payload.source,
      severity: payload.severity,
    },
    ...(payload.errorName
      ? {
          exception: {
            values: [
              {
                type: payload.errorName,
                value: payload.message,
                ...(payload.stack ? { stacktrace: { frames: payload.stack.split('\n').map((line) => ({ filename: line.trim() })) } } : {}),
              },
            ],
          },
        }
      : {}),
    extra: payload.context ?? {},
  };

  const envelopeHeader = {
    event_id: event.event_id,
    sent_at: new Date().toISOString(),
    dsn,
  };

  const itemHeader = { type: 'event' };
  return `${JSON.stringify(envelopeHeader)}\n${JSON.stringify(itemHeader)}\n${JSON.stringify(event)}`;
}

export async function captureWithSentry(payload: Required<MonitoringPayload>): Promise<void> {
  const dsn = serverEnv.SENTRY_DSN;
  if (!dsn) return;

  const parsed = parseSentryDsn(dsn);
  if (!parsed) return;

  const envelope = buildSentryEnvelope(payload, dsn);
  if (!envelope) return;

  const endpoint = `${parsed.origin}/api/${parsed.projectId}/envelope/`;
  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${parsed.publicKey}`,
      },
      body: envelope,
    });
  } catch {
    // no-op
  }
}
