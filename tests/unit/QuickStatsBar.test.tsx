import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@/tests/utils/test-utils';
import { createMockStats } from '@/tests/utils/test-data';
import QuickStatsBar from '@/components/features/dashboard/QuickStatsBar';

describe('QuickStatsBar', () => {
  const mockStats = createMockStats();

  test('renders all stat labels', () => {
    render(<QuickStatsBar {...mockStats} />);
    expect(screen.getByText('Events Today')).toBeInTheDocument();
    expect(screen.getByText('Productivity')).toBeInTheDocument();
    expect(screen.getByText('Focus Time')).toBeInTheDocument();
    expect(screen.getByText('Day Streak')).toBeInTheDocument();
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('Exercises')).toBeInTheDocument();
  });

  test('displays formatted values', () => {
    render(<QuickStatsBar {...mockStats} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('6h')).toBeInTheDocument();
    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  test('handles zero values', () => {
    render(
      <QuickStatsBar
        {...mockStats}
        eventsToday={0}
        productivity={0}
        focusTime={0}
        streak={0}
        goalsThisWeek={{ completed: 0, total: 0 }}
        exercisesThisWeek={0}
      />
    );
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('0h')).toBeInTheDocument();
    expect(screen.getByText('0/0')).toBeInTheDocument();
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  test('shows loading skeleton', () => {
    const { container } = render(<QuickStatsBar {...mockStats} isLoading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByText('85%')).not.toBeInTheDocument();
  });

  test('adds streak highlight ring when streak > 0', () => {
    const { container } = render(<QuickStatsBar {...mockStats} streak={5} />);
    expect(container.querySelector('.ring-2.ring-warning\\/30')).toBeInTheDocument();
  });
});
