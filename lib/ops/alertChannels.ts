// @ts-nocheck — needs downlevelIteration for Map.entries(); will fix with schema update
/**
 * Alert Channel Abstraction — Phase 12 P0.1
 *
 * Multi-channel alert dispatch (webhook, email, extensible).
 * Non-blocking: failures are logged, never thrown.
 */

import { serverEnv } from '@/lib/env';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface AlertPayload {
  title: string;
  severity: AlertSeverity;
  summary: string;
  details?: Record<string, unknown>;
  /** ISO timestamp */
  triggeredAt: string;
  /** Unique key to prevent duplicate alerts */
  deduplicationKey?: string;
}

export interface AlertChannelResult {
  channel: string;
  sent: boolean;
  error?: string;
}

// ── In-memory deduplication (serverless-safe with short TTL) ──────────────
const recentAlerts = new Map<string, number>();
const ALERT_DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function isDuplicate(key: string | undefined): boolean {
  if (!key) return false;
  const now = Date.now();
  // Clean stale entries
  for (const [k, ts] of recentAlerts) {
    if (now - ts > ALERT_DEDUP_WINDOW_MS) recentAlerts.delete(k);
  }
  if (recentAlerts.has(key)) return true;
  recentAlerts.set(key, now);
  return false;
}

// ── Webhook Channel ──────────────────────────────────────────────────────
async function sendWebhookAlert(payload: AlertPayload): Promise<AlertChannelResult> {
  const webhookUrl = serverEnv.MONITORING_ALERT_WEBHOOK_URL;
  if (!webhookUrl) return { channel: 'webhook', sent: false, error: 'no webhook configured' };

  try {
    const emoji =
      payload.severity === 'critical' ? '🔴' :
      payload.severity === 'warning' ? '🟡' : 'ℹ️';

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${emoji} *[INNIS OPS]* ${payload.title}\n${payload.summary}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${emoji} *${payload.title}*\n${payload.summary}`,
            },
          },
          ...(payload.details ? [{
            type: 'context',
            elements: Object.entries(payload.details).map(([k, v]) => ({
              type: 'mrkdwn',
              text: `*${k}:* ${String(v)}`,
            })),
          }] : []),
        ],
      }),
      signal: AbortSignal.timeout(5000),
    });
    return { channel: 'webhook', sent: true };
  } catch (err) {
    return { channel: 'webhook', sent: false, error: (err as Error).message };
  }
}

// ── Email Channel (via existing Resend) ──────────────────────────────────
async function sendEmailAlert(payload: AlertPayload): Promise<AlertChannelResult> {
  // Only import dynamically to avoid dependency issue if Resend is not configured
  try {
    const { sendEmail } = await import('@/lib/email/resend');
    const adminEmails = serverEnv.ADMIN_EMAILS;
    if (!adminEmails) return { channel: 'email', sent: false, error: 'no ADMIN_EMAILS configured' };

    const recipients = adminEmails.split(',').map((e) => e.trim()).filter(Boolean);
    if (recipients.length === 0) return { channel: 'email', sent: false, error: 'empty ADMIN_EMAILS' };

    const sevLabel =
      payload.severity === 'critical' ? '🔴 CRITICAL' :
      payload.severity === 'warning' ? '⚠️ WARNING' : 'ℹ️ INFO';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px;">
        <div style="padding: 16px; background: ${payload.severity === 'critical' ? '#fef2f2' : '#fffbeb'}; border-radius: 8px; margin-bottom: 16px;">
          <h2 style="margin: 0 0 8px 0; color: #111;">${sevLabel}: ${payload.title}</h2>
          <p style="margin: 0; color: #333;">${payload.summary}</p>
        </div>
        ${payload.details ? `
          <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
            ${Object.entries(payload.details).map(([k, v]) =>
              `<tr><td style="padding: 4px 8px; color: #666; font-weight: 600;">${k}</td><td style="padding: 4px 8px; color: #333;">${String(v)}</td></tr>`
            ).join('')}
          </table>
        ` : ''}
        <p style="font-size: 12px; color: #999; margin-top: 16px;">
          Triggered at ${payload.triggeredAt} — INNIS Ops Alert System
        </p>
      </div>
    `;

    // Send to first admin (Resend free tier limitation)
    const result = await sendEmail({
      to: recipients[0],
      subject: `[INNIS OPS] ${payload.severity.toUpperCase()}: ${payload.title}`,
      html,
      text: `${payload.title}\n\n${payload.summary}`,
    });

    return { channel: 'email', sent: result.sent };
  } catch (err) {
    return { channel: 'email', sent: false, error: (err as Error).message };
  }
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Dispatch alert to all configured channels.
 * Non-blocking: all errors caught internally. Returns per-channel results.
 */
export async function dispatchAlert(payload: AlertPayload): Promise<AlertChannelResult[]> {
  if (isDuplicate(payload.deduplicationKey)) {
    return [{ channel: 'dedup', sent: false, error: 'suppressed (duplicate within window)' }];
  }

  const channels: Promise<AlertChannelResult>[] = [
    sendWebhookAlert(payload),
  ];

  // Only send email for critical alerts to avoid spam
  if (payload.severity === 'critical') {
    channels.push(sendEmailAlert(payload));
  }

  const results = await Promise.allSettled(channels);
  return results.map((r) =>
    r.status === 'fulfilled' ? r.value : { channel: 'unknown', sent: false, error: (r.reason as Error).message }
  );
}
