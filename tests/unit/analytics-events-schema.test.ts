import { describe, expect, it } from 'vitest';
import { analyticsEventSchema } from '@/lib/analytics/events';

describe('analyticsEventSchema', () => {
  it('accepts a valid onboarding completion payload', () => {
    const parsed = analyticsEventSchema.safeParse({
      name: 'onboarding_completed',
      payload: {
        courses_count: 2,
        task_created: true,
        demo_seeded: false,
      },
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects invalid payload types', () => {
    const parsed = analyticsEventSchema.safeParse({
      name: 'onboarding_step_completed',
      payload: {
        step: 'three',
      },
    });

    expect(parsed.success).toBe(false);
  });

  it('accepts lucian spell cast payload', () => {
    const parsed = analyticsEventSchema.safeParse({
      name: 'lucian_spell_cast',
      payload: {
        route: '/today',
        source: 'champion_provider',
        ability: 'q',
      },
    });

    expect(parsed.success).toBe(true);
  });
});
