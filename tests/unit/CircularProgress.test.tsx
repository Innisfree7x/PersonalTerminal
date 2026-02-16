import { afterEach, describe, expect, test, vi } from 'vitest';
import { act } from '@testing-library/react';
import { render, screen } from '@/tests/utils/test-utils';
import CircularProgress from '@/components/features/dashboard/CircularProgress';

async function advanceProgressAnimation() {
  await act(async () => {
    vi.advanceTimersByTime(1600);
  });
}

describe('CircularProgress', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    test('renders with default props', () => {
      vi.useFakeTimers();
      render(<CircularProgress percentage={75} />);
      expect(screen.getByText('Completion')).toBeInTheDocument();
    });

    test('displays percentage number after animation', async () => {
      vi.useFakeTimers();
      render(<CircularProgress percentage={85} />);
      await advanceProgressAnimation();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    test('hides percentage when showPercentage is false', async () => {
      vi.useFakeTimers();
      render(<CircularProgress percentage={85} showPercentage={false} />);
      await advanceProgressAnimation();
      expect(screen.queryByText('85%')).not.toBeInTheDocument();
    });

    test('displays custom label', () => {
      vi.useFakeTimers();
      render(<CircularProgress percentage={75} label="Today's Progress" />);
      expect(screen.getByText("Today's Progress")).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('shows skeleton when loading', () => {
      vi.useFakeTimers();
      const { container } = render(<CircularProgress percentage={75} isLoading={true} />);
      expect(screen.queryByText('75%')).not.toBeInTheDocument();
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles 0% percentage', async () => {
      vi.useFakeTimers();
      render(<CircularProgress percentage={0} />);
      await advanceProgressAnimation();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    test('handles 100% percentage', async () => {
      vi.useFakeTimers();
      render(<CircularProgress percentage={100} />);
      await advanceProgressAnimation();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Color Logic', () => {
    test('applies success color for >= 80%', async () => {
      vi.useFakeTimers();
      const { container } = render(<CircularProgress percentage={85} />);
      await advanceProgressAnimation();
      expect(container.querySelector('.stroke-success')).toBeInTheDocument();
    });

    test('applies info color for >= 50%', async () => {
      vi.useFakeTimers();
      const { container } = render(<CircularProgress percentage={65} />);
      await advanceProgressAnimation();
      expect(container.querySelector('.stroke-info')).toBeInTheDocument();
    });

    test('applies warning color for >= 25%', async () => {
      vi.useFakeTimers();
      const { container } = render(<CircularProgress percentage={40} />);
      await advanceProgressAnimation();
      expect(container.querySelector('.stroke-warning')).toBeInTheDocument();
    });

    test('applies error color for < 25%', async () => {
      vi.useFakeTimers();
      const { container } = render(<CircularProgress percentage={15} />);
      await advanceProgressAnimation();
      expect(container.querySelector('.stroke-error')).toBeInTheDocument();
    });
  });
});
