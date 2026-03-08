import { describe, expect, it } from 'vitest';
import { detectGoalStatusTransitions } from '@/lib/trajectory/statusTransition';

describe('detectGoalStatusTransitions', () => {
  it('returns changed goals when status changed outside cooldown', () => {
    const result = detectGoalStatusTransitions({
      previousByGoal: { a: 'on_track', b: 'tight' },
      currentByGoal: { a: 'tight', b: 'at_risk' },
      lastPulseByGoal: {},
      nowMs: 100_000,
      cooldownMs: 10_000,
    });

    expect(result.changedGoalIds).toEqual(['a', 'b']);
    expect(result.nextLastPulseByGoal.a).toBe(100_000);
    expect(result.nextLastPulseByGoal.b).toBe(100_000);
  });

  it('suppresses repeated pulse inside cooldown window', () => {
    const result = detectGoalStatusTransitions({
      previousByGoal: { a: 'on_track' },
      currentByGoal: { a: 'tight' },
      lastPulseByGoal: { a: 95_000 },
      nowMs: 100_000,
      cooldownMs: 10_000,
    });

    expect(result.changedGoalIds).toEqual([]);
    expect(result.nextLastPulseByGoal.a).toBe(95_000);
  });

  it('does not pulse on initial status without previous value', () => {
    const result = detectGoalStatusTransitions({
      previousByGoal: {},
      currentByGoal: { a: 'at_risk' },
      lastPulseByGoal: {},
      nowMs: 100_000,
      cooldownMs: 10_000,
    });

    expect(result.changedGoalIds).toEqual([]);
  });
});
