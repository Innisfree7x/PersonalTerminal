'use client';

import { track } from '@vercel/analytics';

export type MarketingEventName =
  | 'landing_cta_clicked'
  | 'landing_cta_primary_clicked'
  | 'landing_cta_secondary_clicked'
  | 'pricing_plan_selected'
  | 'signup_started'
  | 'signup_completed'
  | 'day2_return';

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
  // Canonical event for funnel queries while keeping granular variants.
  if (name === 'landing_cta_primary_clicked' || name === 'landing_cta_secondary_clicked') {
    track('landing_cta_clicked', payload as Record<string, string>);
  }
  track(name, payload as Record<string, string>);

  try {
    if (name === 'landing_cta_primary_clicked' || name === 'landing_cta_secondary_clicked') {
      await fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({ name: 'landing_cta_clicked', payload }),
      });
    }
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
