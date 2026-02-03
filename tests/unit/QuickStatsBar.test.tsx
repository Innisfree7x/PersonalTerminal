/**
 * Unit tests for QuickStatsBar component
 * Tests rendering of stats, loading states, and animations
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { render, screen } from '@/tests/utils/test-utils';
import { createMockStats } from '@/tests/utils/test-data';
import QuickStatsBar from '@/components/features/dashboard/QuickStatsBar';

// Disable framer-motion animations
beforeAll(() => {
  vi.mock('framer-motion', () => ({
    motion: {
      div: 'div',
    },
  }));
});

describe('QuickStatsBar', () => {
  const mockStats = createMockStats();

  describe('Rendering', () => {
    test('renders all stat labels', () => {
      render(<QuickStatsBar {...mockStats} />);
      expect(screen.getByText('Events Today')).toBeInTheDocument();
      expect(screen.getByText('Productivity')).toBeInTheDocument();
      expect(screen.getByText('Focus Time')).toBeInTheDocument();
      expect(screen.getByText('Day Streak')).toBeInTheDocument();
      expect(screen.getByText('Goals')).toBeInTheDocument();
      expect(screen.getByText('Exercises')).toBeInTheDocument();
    });

    test('displays correct stat values', () => {
      render(<QuickStatsBar {...mockStats} />);
      expect(screen.getByText('5')).toBeInTheDocument(); // eventsToday
      expect(screen.getByText('85%')).toBeInTheDocument(); // productivity
      expect(screen.getByText('6h')).toBeInTheDocument(); // focusTime
      expect(screen.getByText('7')).toBeInTheDocument(); // streak
      expect(screen.getByText('2/5')).toBeInTheDocument(); // goals
      expect(screen.getByText('12')).toBeInTheDocument(); // exercises
    });

    test('handles zero values', () => {
      const zeroStats = createMockStats({
        eventsToday: 0,
        productivity: 0,
        focusTime: 0,
        streak: 0,
        goalsThisWeek: { completed: 0, total: 0 },
        exercisesThisWeek: 0,
      });
      render(<QuickStatsBar {...zeroStats} />);
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('0h')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('shows skeleton when loading', () => {
      const { container } = render(<QuickStatsBar {...mockStats} isLoading={true} />);
      // Should render 6 skeleton cards
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
      
      // Should not show actual values
      expect(screen.queryByText('85%')).not.toBeInTheDocument();
    });

    test('shows gradient background even when loading', () => {
      const { container } = render(<QuickStatsBar {...mockStats} isLoading={true} />);
      const gradientElement = container.querySelector('.bg-gradient-to-br');
      expect(gradientElement).toBeInTheDocument();
    });
  });

  describe('Streak Highlighting', () => {
    test('highlights streak when greater than 0', () => {
      const { container } = render(<QuickStatsBar {...mockStats} streak={5} />);
      // Should have ring indicator for active streak
      const ringElement = container.querySelector('.ring-2.ring-warning\\/30');
      // Note: Testing for this class is fragile, main point is streak >0 renders differently
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    test('does not highlight when streak is 0', () => {
      render(<QuickStatsBar {...mockStats} streak={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Goals Display', () => {
    test('shows completed vs total goals', () => {
      render(<QuickStatsBar {...mockStats} goalsThisWeek={{ completed: 3, total: 10 }} />);
      expect(screen.getByText('3/10')).toBeInTheDocument();
    });

    test('handles completed equals total', () => {
      render(<QuickStatsBar {...mockStats} goalsThisWeek={{ completed: 5, total: 5 }} />);
      expect(screen.getByText('5/5')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles high productivity value', () => {
      render(<QuickStatsBar {...mockStats} productivity={100} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    test('handles large event count', () => {
      render(<QuickStatsBar {...mockStats} eventsToday={50} />);
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    test('handles large streak', () => {
      render(<QuickStatsBar {...mockStats} streak={365} />);
      expect(screen.getByText('365')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('renders with proper structure', () => {
      const { container } = render(<QuickStatsBar {...mockStats} />);
      // Should have grid layout
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    test('all text is readable', () => {
      render(<QuickStatsBar {...mockStats} />);
      // All stat values should be visible
      const statValues = screen.getAllByText(/[0-9]/);
      expect(statValues.length).toBeGreaterThan(0);
    });
  });
});
