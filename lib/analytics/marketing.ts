'use client';

import { track } from '@vercel/analytics';

export type MarketingEventName =
  | 'landing_cta_primary_clicked'
  | 'landing_cta_secondary_clicked'
  | 'pricing_plan_selected'
  | 'signup_started'
  | 'signup_completed';

export interface MarketingEventPayload {
  source?: string;
  plan?: string;
  variant?: string;
}

/**
 * Track a marketing funnel event in the browser.
 *
 * - Sends to Vercel Analytics for dashboard visibility.
 * - Also forwards to /api/analytics/event for future provider fan-out.
 */
export async function trackMarketingEvent(
  name: MarketingEventName,
  payload: MarketingEventPayload = {}
): Promise<void> {
  track(name, payload as Record<string, string>);

  try {
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ name, payload }),
    });
  } catch {
    // Non-blocking: analytics should never break UX.
  }
}
