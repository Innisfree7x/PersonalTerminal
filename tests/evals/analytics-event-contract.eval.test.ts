import { describe, expect, it } from 'vitest';
import { analyticsEventSchema } from '@/lib/analytics/events';

describe('AI eval: analytics event contract', () => {
  it('accepts critical onboarding/trajectory event payloads', () => {
    const validEvents = [
      {
        name: 'trajectory_goal_created',
        payload: { category: 'gmat', priority: 4 },
      },
      {
        name: 'trajectory_capacity_set',
        payload: { hours_per_week: 12, horizon_months: 24 },
      },
      {
        name: 'trajectory_status_shown',
        payload: { status: 'on_track' },
      },
      {
        name: 'onboarding_completed',
        payload: {
          trajectory_status: 'tight',
          trajectory_goal_id: 'goal-abc',
          destination: '/trajectory',
          demo_seeded: false,
        },
      },
      {
        name: 'trajectory_briefing_opened',
        payload: {
          source: 'today_morning_briefing',
          route: '/today',
          trajectory_goal_id: 'goal-abc',
          status: 'tight',
        },
      },
    ] as const;

    for (const event of validEvents) {
      expect(analyticsEventSchema.safeParse(event).success).toBe(true);
    }
  });

  it('rejects invalid payloads for critical contract events', () => {
    const invalidEvents = [
      {
        name: 'trajectory_goal_created',
        payload: { category: 'invalid', priority: 4 },
      },
      {
        name: 'trajectory_capacity_set',
        payload: { hours_per_week: 2, horizon_months: 24 },
      },
      {
        name: 'trajectory_status_shown',
        payload: { status: 'foo' },
      },
      {
        name: 'onboarding_step_completed',
        payload: { step: 'three' },
      },
      {
        name: 'trajectory_briefing_opened',
        payload: { source: 'today_morning_briefing', route: '/today', status: 'invalid' },
      },
    ];

    for (const event of invalidEvents) {
      expect(analyticsEventSchema.safeParse(event).success).toBe(false);
    }
  });
});
