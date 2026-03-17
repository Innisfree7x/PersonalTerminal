'use client';

export type OnboardingEvent =
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'trajectory_goal_created'
  | 'trajectory_capacity_set'
  | 'trajectory_status_shown'
  | 'demo_seed_started'
  | 'demo_seed_removed'
  | 'first_task_created'
  | 'first_course_created';

export interface OnboardingEventProperties {
  onboarding_started: Record<string, never>;
  onboarding_step_completed: { step: number; skipped?: boolean };
  onboarding_completed: {
    trajectory_status: 'on_track' | 'tight' | 'at_risk';
    trajectory_goal_id: string;
    destination: '/trajectory' | '/today';
    demo_seeded: boolean;
  };
  trajectory_goal_created: { category: 'thesis' | 'gmat' | 'master_app' | 'internship' | 'other'; priority: number };
  trajectory_capacity_set: { hours_per_week: number; horizon_months: number };
  trajectory_status_shown: { status: 'on_track' | 'tight' | 'at_risk' };
  demo_seed_started: Record<string, never>;
  demo_seed_removed: { ids_removed: number };
  first_task_created: { source: 'onboarding' };
  first_course_created: { source: 'onboarding'; count: number };
}

const LS_EVENTS_KEY = 'innis_events';
const MAX_EVENTS = 50;

/**
 * Fire a client-side onboarding analytics event.
 *
 * Keeps a short sessionStorage debug trail and forwards events
 * non-blocking to the internal analytics route.
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

  // Forward to analytics API (non-blocking).
  try {
    void fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ name: event, payload: properties ?? {} }),
    });
  } catch {
    // Non-blocking by design.
  }
}
