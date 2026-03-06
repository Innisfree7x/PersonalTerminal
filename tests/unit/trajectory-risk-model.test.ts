import { describe, expect, it } from 'vitest';
import {
  calculateRequiredWeeks,
  computeTrajectoryPrepWindow,
  evaluateTrajectoryRisk,
  formatTrajectoryRiskLabel,
  simulateTrajectoryGoalPreview,
} from '@/lib/trajectory/risk-model';

describe('trajectory risk model', () => {
  it('computes required weeks deterministically', () => {
    expect(calculateRequiredWeeks(120, 20)).toBe(6);
    expect(calculateRequiredWeeks(121, 20)).toBe(7);
    expect(calculateRequiredWeeks(10, 0)).toBe(10);
  });

  it('computes prep window from due date, effort and buffer', () => {
    const result = computeTrajectoryPrepWindow({
      dueDate: '2027-03-01',
      effortHours: 520,
      bufferWeeks: 2,
      capacityHoursPerWeek: 20,
    });

    expect(result.requiredWeeks).toBe(26);
    expect(result.endDate).toBe('2027-02-15');
    expect(result.startDate).toBe('2026-08-17');
  });

  it('classifies risk states using shared thresholds', () => {
    expect(
      evaluateTrajectoryRisk({
        startDate: '2026-01-01',
        today: '2026-01-10',
      }).status
    ).toBe('at_risk');

    expect(
      evaluateTrajectoryRisk({
        startDate: '2026-12-01',
        today: '2026-01-10',
        overlapRatio: 0.3,
      }).status
    ).toBe('tight');

    expect(
      evaluateTrajectoryRisk({
        startDate: '2026-12-01',
        today: '2026-01-10',
        overlapRatio: 0.55,
      }).status
    ).toBe('at_risk');
  });

  it('simulates single-goal preview consistently with risk label helper', () => {
    const preview = simulateTrajectoryGoalPreview({
      dueDate: '2027-03-01',
      effortHours: 520,
      bufferWeeks: 2,
      capacityHoursPerWeek: 20,
      today: '2026-03-01',
    });

    expect(preview.status).toBe('on_track');
    expect(formatTrajectoryRiskLabel(preview.status)).toBe('on track');
    expect(preview.requiredWeeks).toBeGreaterThan(0);
  });
});
