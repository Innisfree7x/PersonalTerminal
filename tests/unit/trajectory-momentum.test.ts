import { describe, expect, it } from 'vitest';
import { computeMomentumScore } from '@/lib/trajectory/momentum';

describe('trajectory momentum score', () => {
  const now = new Date('2026-03-06T12:00:00.000Z');

  it('computes strong score for on-track plan with healthy focus load', () => {
    const result = computeMomentumScore({
      plannedHoursPerWeek: 10,
      activeGoals: [
        { bufferWeeks: 3, status: 'active' },
        { bufferWeeks: 2, status: 'active' },
      ],
      generatedBlocks: [{ status: 'on_track' }, { status: 'on_track' }],
      focusSessions: [
        {
          startedAt: '2026-03-05T10:00:00.000Z',
          durationSeconds: 60 * 60 * 3,
          completed: true,
          sessionType: 'focus',
        },
        {
          startedAt: '2026-03-03T10:00:00.000Z',
          durationSeconds: 60 * 60 * 4,
          completed: true,
          sessionType: 'focus',
        },
        {
          startedAt: '2026-02-26T10:00:00.000Z',
          durationSeconds: 60 * 60 * 2,
          completed: true,
          sessionType: 'focus',
        },
      ],
      now,
    });

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.trend).toBe('up');
    expect(result.stats.onTrack).toBe(2);
    expect(result.stats.atRisk).toBe(0);
  });

  it('drops score when plan is at risk and focus delivery falls behind', () => {
    const result = computeMomentumScore({
      plannedHoursPerWeek: 20,
      activeGoals: [
        { bufferWeeks: 0, status: 'active' },
        { bufferWeeks: 1, status: 'active' },
      ],
      generatedBlocks: [{ status: 'at_risk' }, { status: 'tight' }],
      focusSessions: [
        {
          startedAt: '2026-03-05T10:00:00.000Z',
          durationSeconds: 60 * 60 * 1,
          completed: true,
          sessionType: 'focus',
        },
        {
          startedAt: '2026-02-27T10:00:00.000Z',
          durationSeconds: 60 * 60 * 7,
          completed: true,
          sessionType: 'focus',
        },
      ],
      now,
    });

    expect(result.score).toBeLessThanOrEqual(45);
    expect(result.trend).toBe('down');
    expect(result.delta).toBeLessThan(0);
    expect(result.stats.atRisk).toBe(1);
  });

  it('ignores incomplete and break sessions in weekly hours', () => {
    const result = computeMomentumScore({
      plannedHoursPerWeek: 8,
      activeGoals: [{ bufferWeeks: 2, status: 'active' }],
      generatedBlocks: [{ status: 'tight' }],
      focusSessions: [
        {
          startedAt: '2026-03-05T10:00:00.000Z',
          durationSeconds: 60 * 60 * 2,
          completed: false,
          sessionType: 'focus',
        },
        {
          startedAt: '2026-03-05T14:00:00.000Z',
          durationSeconds: 60 * 60 * 2,
          completed: true,
          sessionType: 'break',
        },
        {
          startedAt: '2026-03-04T10:00:00.000Z',
          durationSeconds: 60 * 60 * 3,
          completed: true,
          sessionType: 'focus',
        },
      ],
      now,
    });

    expect(result.stats.last7DaysHours).toBeCloseTo(3, 4);
  });
});
