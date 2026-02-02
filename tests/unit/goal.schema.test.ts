import { describe, it, expect } from 'vitest';
import { createGoalSchema, GoalSchema, GoalCategory } from '@/lib/schemas/goal.schema';

describe('Goal Schema', () => {
  describe('createGoalSchema', () => {
    it('valid goal passes', () => {
      const validGoal = {
        title: 'Lose 5kg',
        description: 'Get in shape for summer',
        targetDate: new Date('2024-12-31'),
        category: 'fitness' as const,
        metrics: {
          current: 80,
          target: 75,
          unit: 'kg',
        },
      };

      const result = createGoalSchema.safeParse(validGoal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Lose 5kg');
        expect(result.data.description).toBe('Get in shape for summer');
        expect(result.data.category).toBe('fitness');
      }
    });

    it('title too short fails', () => {
      const invalidGoal = {
        title: 'AB', // Too short
        targetDate: new Date('2024-12-31'),
        category: 'fitness' as const,
      };

      const result = createGoalSchema.safeParse(invalidGoal);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['title']);
        expect(result.error.issues[0].message).toContain('at least 3 characters');
      }
    });

    it('title too long fails', () => {
      const invalidGoal = {
        title: 'A'.repeat(101), // Too long
        targetDate: new Date('2024-12-31'),
        category: 'fitness' as const,
      };

      const result = createGoalSchema.safeParse(invalidGoal);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['title']);
        expect(result.error.issues[0].message).toContain('at most 100 characters');
      }
    });

    it('invalid category fails', () => {
      const invalidGoal = {
        title: 'Valid Title',
        targetDate: new Date('2024-12-31'),
        category: 'invalid-category' as any,
      };

      const result = createGoalSchema.safeParse(invalidGoal);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['category']);
      }
    });

    it('optional fields work', () => {
      const minimalGoal = {
        title: 'Learn TypeScript',
        targetDate: new Date('2024-12-31'),
        category: 'learning' as const,
      };

      const result = createGoalSchema.safeParse(minimalGoal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
        expect(result.data.metrics).toBeUndefined();
      }
    });

    it('optional description can be provided', () => {
      const goalWithDescription = {
        title: 'Get promoted',
        description: 'Become senior developer',
        targetDate: new Date('2024-12-31'),
        category: 'career' as const,
      };

      const result = createGoalSchema.safeParse(goalWithDescription);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('Become senior developer');
      }
    });

    it('optional metrics can be provided', () => {
      const goalWithMetrics = {
        title: 'Save money',
        targetDate: new Date('2024-12-31'),
        category: 'finance' as const,
        metrics: {
          current: 1000,
          target: 10000,
          unit: 'EUR',
        },
      };

      const result = createGoalSchema.safeParse(goalWithMetrics);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metrics).toEqual({
          current: 1000,
          target: 10000,
          unit: 'EUR',
        });
      }
    });
  });

  describe('GoalSchema (with id and createdAt)', () => {
    it('valid goal with id and createdAt passes', () => {
      const validGoal = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Complete project',
        targetDate: new Date('2024-12-31'),
        category: 'career' as const,
        createdAt: new Date('2024-01-01'),
      };

      const result = GoalSchema.safeParse(validGoal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('123e4567-e89b-12d3-a456-426614174000');
        expect(result.data.createdAt).toBeInstanceOf(Date);
      }
    });

    it('invalid UUID fails', () => {
      const invalidGoal = {
        id: 'not-a-uuid',
        title: 'Complete project',
        targetDate: new Date('2024-12-31'),
        category: 'career' as const,
        createdAt: new Date('2024-01-01'),
      };

      const result = GoalSchema.safeParse(invalidGoal);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['id']);
      }
    });
  });
});
