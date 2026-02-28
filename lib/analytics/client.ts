'use client';

import { track } from '@vercel/analytics';
import type { AnalyticsEventName } from './events';

type AnalyticsScalar = string | number | boolean | null;
export type AnalyticsClientPayload = Record<string, AnalyticsScalar>;

/**
 * Fire a product analytics event in the browser.
 * Non-blocking by design: analytics must never break UX flows.
 */
export async function trackAppEvent(
  name: AnalyticsEventName,
  payload: AnalyticsClientPayload = {}
): Promise<void> {
  track(name, payload);

  try {
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ name, payload }),
    });
  } catch {
    // Non-blocking by design.
  }
}
