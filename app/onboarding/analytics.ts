'use client';

export type OnboardingEvent =
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'demo_seed_started'
  | 'demo_seed_removed';

export interface OnboardingEventProperties {
  onboarding_started: Record<string, never>;
  onboarding_step_completed: { step: number; skipped?: boolean };
  onboarding_completed: { courses_count: number; task_created: boolean; demo_seeded: boolean };
  demo_seed_started: Record<string, never>;
  demo_seed_removed: { ids_removed: number };
}

const LS_EVENTS_KEY = 'prism_events';
const MAX_EVENTS = 50;

/**
 * Fire a client-side onboarding analytics event.
 *
 * Currently a stub — logs to console in dev and stores last 50 events
 * in sessionStorage for debugging.
 *
 * TODO (Codex): Connect to real provider:
 *   - Option A: window.analytics?.track(event, properties)  // Segment / PostHog
 *   - Option B: fetch('/api/analytics/event', { method: 'POST', body: JSON.stringify({ event, properties }) })
 *
 * Event payload shapes are typed via OnboardingEventProperties above.
 */
export function trackOnboardingEvent<E extends OnboardingEvent>(
  event: E,
  properties?: OnboardingEventProperties[E]
): void {
  // Persist to sessionStorage for debugging / QA
  try {
    const raw = sessionStorage.getItem(LS_EVENTS_KEY);
    const events: unknown[] = raw ? (JSON.parse(raw) as unknown[]) : [];
    events.push({ event, properties: properties ?? {}, timestamp: new Date().toISOString() });
    // Keep only last MAX_EVENTS
    if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
    sessionStorage.setItem(LS_EVENTS_KEY, JSON.stringify(events));
  } catch {
    // sessionStorage unavailable — proceed silently
  }
}
