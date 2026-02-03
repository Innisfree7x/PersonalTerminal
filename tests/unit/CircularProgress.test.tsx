/**
 * Unit tests for CircularProgress component
 * Tests rendering, color logic, animations, and edge cases
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { render, screen } from '@/tests/utils/test-utils';
import CircularProgress from '@/components/features/dashboard/CircularProgress';

// Disable framer-motion animations for faster, more predictable tests
beforeAll(() => {
  vi.mock('framer-motion', () => ({
    motion: {
      div: 'div',
      span: 'span',
      p: 'p',
      circle: 'circle',
    },
  }));
});

describe('CircularProgress', () => {
  describe('Rendering', () => {
    test('renders with default props', () => {
      render(<CircularProgress percentage={75} />);
      // Component should render without crashing
      expect(screen.getByText('Completion')).toBeInTheDocument();
    });

    test('displays percentage number', () => {
      render(<CircularProgress percentage={85} />);
      expect(screen.getByText(/85/)).toBeInTheDocument();
    });

    test('hides percentage when showPercentage is false', () => {
      render(<CircularProgress percentage={85} showPercentage={false} />);
      expect(screen.queryByText(/85/)).not.toBeInTheDocument();
    });

    test('displays custom label', () => {
      render(<CircularProgress percentage={75} label="Today's Progress" />);
      expect(screen.getByText("Today's Progress")).toBeInTheDocument();
    });

    test('hides label when not provided', () => {
      render(<CircularProgress percentage={75} label="" />);
      expect(screen.queryByText('Completion')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('shows skeleton when loading', () => {
      const { container } = render(<CircularProgress percentage={75} isLoading={true} />);
      // Should not show percentage when loading
      expect(screen.queryByText(/75/)).not.toBeInTheDocument();
      // Should render skeleton (checking for animate-pulse class)
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    test('hides content when loading', () => {
      render(<CircularProgress percentage={75} label="Test" isLoading={true} />);
      // Label should still be visible but percentage hidden
      expect(screen.queryByText(/75/)).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles 0% percentage', () => {
      render(<CircularProgress percentage={0} />);
      expect(screen.getByText(/0/)).toBeInTheDocument();
    });

    test('handles 100% percentage', () => {
      render(<CircularProgress percentage={100} />);
      expect(screen.getByText(/100/)).toBeInTheDocument();
    });

    test('handles custom size', () => {
      const { container } = render(<CircularProgress percentage={75} size={200} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '200');
      expect(svg).toHaveAttribute('height', '200');
    });

    test('handles custom stroke width', () => {
      render(<CircularProgress percentage={75} strokeWidth={12} />);
      // Component should render without issues
      expect(screen.getByText('Completion')).toBeInTheDocument();
    });
  });

  describe('Color Logic', () => {
    test('applies success color for >= 80%', () => {
      const { container } = render(<CircularProgress percentage={85} />);
      const progressCircle = container.querySelector('.stroke-success');
      expect(progressCircle).toBeInTheDocument();
    });

    test('applies info color for >= 50%', () => {
      const { container } = render(<CircularProgress percentage={65} />);
      const progressCircle = container.querySelector('.stroke-info');
      expect(progressCircle).toBeInTheDocument();
    });

    test('applies warning color for >= 25%', () => {
      const { container } = render(<CircularProgress percentage={40} />);
      const progressCircle = container.querySelector('.stroke-warning');
      expect(progressCircle).toBeInTheDocument();
    });

    test('applies error color for < 25%', () => {
      const { container } = render(<CircularProgress percentage={15} />);
      const progressCircle = container.querySelector('.stroke-error');
      expect(progressCircle).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('renders semantic HTML', () => {
      const { container } = render(<CircularProgress percentage={75} />);
      // Should render SVG for visualization
      expect(container.querySelector('svg')).toBeInTheDocument();
      // Should render text content
      expect(screen.getByText('Completion')).toBeInTheDocument();
    });
  });
});
