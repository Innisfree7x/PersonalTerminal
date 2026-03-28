import { describe, expect, test } from 'vitest';

import { calculateProgress, goalToCreateInput } from '@/lib/utils/goalUtils';

describe('goalUtils', () => {
  test('calculateProgress begrenzt auf 100 und behandelt target 0', () => {
    expect(calculateProgress({ current: 5, target: 0, unit: 'tasks' })).toBe(0);
    expect(calculateProgress({ current: 2, target: 4, unit: 'tasks' })).toBe(50);
    expect(calculateProgress({ current: 12, target: 10, unit: 'tasks' })).toBe(100);
  });

  test('goalToCreateInput entfernt nur id und createdAt', () => {
    const result = goalToCreateInput({
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'GMAT',
      description: 'Verbal aufbauen',
      targetDate: new Date('2026-10-01'),
      category: 'learning',
      metrics: {
        current: 10,
        target: 100,
        unit: 'hours',
      },
      createdAt: new Date('2026-03-28'),
    });

    expect(result).toEqual({
      title: 'GMAT',
      description: 'Verbal aufbauen',
      targetDate: new Date('2026-10-01'),
      category: 'learning',
      metrics: {
        current: 10,
        target: 100,
        unit: 'hours',
      },
    });
  });
});
