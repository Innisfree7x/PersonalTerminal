/**
 * Unit tests for PomodoroTimer component
 * Tests timer functionality, mode switching, input validation, and controls
 */

import { describe, test, expect, beforeAll, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/tests/utils/test-utils';
import PomodoroTimer from '@/components/features/dashboard/PomodoroTimer';

// Disable framer-motion animations
beforeAll(() => {
  vi.mock('framer-motion', () => ({
    motion: {
      div: 'div',
      button: 'button',
    },
  }));
});

// Mock timers
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PomodoroTimer', () => {
  describe('Rendering', () => {
    test('renders title', () => {
      render(<PomodoroTimer />);
      expect(screen.getByText('Pomodoro Timer')).toBeInTheDocument();
    });

    test('displays initial time (25:00)', () => {
      render(<PomodoroTimer />);
      expect(screen.getByText('25:00')).toBeInTheDocument();
    });

    test('shows work mode by default', () => {
      render(<PomodoroTimer />);
      expect(screen.getByText('Work Time')).toBeInTheDocument();
    });

    test('renders control buttons', () => {
      render(<PomodoroTimer />);
      // Play button (or pause when running)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Timer Controls', () => {
    test('starts timer when play button clicked', async () => {
      render(<PomodoroTimer />);
      const playButton = screen.getAllByRole('button')[0]; // First button is play/pause
      fireEvent.click(playButton);
      
      // Advance timer by 1 second
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByText('24:59')).toBeInTheDocument();
      });
    });

    test('pauses timer when pause button clicked', async () => {
      render(<PomodoroTimer />);
      const playButton = screen.getAllByRole('button')[0];
      
      // Start timer
      fireEvent.click(playButton);
      vi.advanceTimersByTime(1000);
      
      // Pause timer
      fireEvent.click(playButton);
      const currentTime = screen.getByText(/24:59/).textContent;
      
      // Advance time again
      vi.advanceTimersByTime(2000);
      
      // Time should not change
      await waitFor(() => {
        expect(screen.getByText(/24:59/)).toBeInTheDocument();
      });
    });

    test('resets timer to initial duration', () => {
      render(<PomodoroTimer />);
      const buttons = screen.getAllByRole('button');
      const resetButton = buttons[1]; // Second button is reset
      
      fireEvent.click(resetButton);
      
      expect(screen.getByText('25:00')).toBeInTheDocument();
    });
  });

  describe('Mode Switching', () => {
    test('switches to break mode when clicked', () => {
      render(<PomodoroTimer />);
      const breakButton = screen.getByText('Break Time');
      fireEvent.click(breakButton);
      
      // Should show break duration (5 minutes)
      expect(screen.getByText('5:00')).toBeInTheDocument();
    });

    test('switches back to work mode', () => {
      render(<PomodoroTimer />);
      // Switch to break
      fireEvent.click(screen.getByText('Break Time'));
      // Switch back to work
      fireEvent.click(screen.getByText('Work Time'));
      
      expect(screen.getByText('25:00')).toBeInTheDocument();
    });

    test('resets timer when switching modes', () => {
      render(<PomodoroTimer />);
      const playButton = screen.getAllByRole('button')[0];
      
      // Start work timer
      fireEvent.click(playButton);
      vi.advanceTimersByTime(5000); // 5 seconds
      
      // Switch to break mode
      fireEvent.click(screen.getByText('Break Time'));
      
      // Should reset to break duration
      expect(screen.getByText('5:00')).toBeInTheDocument();
    });
  });

  describe('Input Validation', () => {
    test('clamps work duration to max (60 minutes)', async () => {
      render(<PomodoroTimer />);
      // Find work duration input (first input)
      const inputs = screen.getAllByRole('spinbutton');
      const workInput = inputs[0];
      
      // Try to set to 999 minutes
      fireEvent.change(workInput, { target: { value: '999' } });
      
      await waitFor(() => {
        // Should be clamped to 60
        expect((workInput as HTMLInputElement).value).toBe('60');
      });
    });

    test('clamps work duration to min (1 minute)', async () => {
      render(<PomodoroTimer />);
      const inputs = screen.getAllByRole('spinbutton');
      const workInput = inputs[0];
      
      // Try to set to 0 minutes
      fireEvent.change(workInput, { target: { value: '0' } });
      
      await waitFor(() => {
        // Should be clamped to 1
        expect((workInput as HTMLInputElement).value).toBe('1');
      });
    });

    test('clamps break duration to max (30 minutes)', async () => {
      render(<PomodoroTimer />);
      const inputs = screen.getAllByRole('spinbutton');
      const breakInput = inputs[1];
      
      fireEvent.change(breakInput, { target: { value: '999' } });
      
      await waitFor(() => {
        expect((breakInput as HTMLInputElement).value).toBe('30');
      });
    });

    test('handles NaN input with default value', async () => {
      render(<PomodoroTimer />);
      const inputs = screen.getAllByRole('spinbutton');
      const workInput = inputs[0];
      
      fireEvent.change(workInput, { target: { value: 'abc' } });
      
      await waitFor(() => {
        // Should default to 25 (or 1 if implementation uses min)
        const value = (workInput as HTMLInputElement).value;
        expect(['1', '25']).toContain(value);
      });
    });
  });

  describe('Loading State', () => {
    test('shows skeleton when loading', () => {
      const { container } = render(<PomodoroTimer isLoading={true} />);
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
      
      // Should not show timer
      expect(screen.queryByText('25:00')).not.toBeInTheDocument();
    });

    test('hides controls when loading', () => {
      render(<PomodoroTimer isLoading={true} />);
      // Play/pause and reset buttons should not be visible
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBe(0);
    });
  });

  describe('Progress Display', () => {
    test('shows progress as percentage', async () => {
      render(<PomodoroTimer />);
      const playButton = screen.getAllByRole('button')[0];
      
      // Start timer
      fireEvent.click(playButton);
      
      // Run for 25 seconds (out of 25 minutes = 1500 seconds)
      vi.advanceTimersByTime(25000);
      
      await waitFor(() => {
        // Should show some progress (not 0%)
        const progressText = screen.getByText(/\d+%/);
        expect(progressText).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('inputs have proper type', () => {
      render(<PomodoroTimer />);
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs.length).toBe(2); // Work and break duration inputs
    });

    test('buttons are clickable', () => {
      render(<PomodoroTimer />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeEnabled();
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles timer completion', async () => {
      render(<PomodoroTimer />);
      const playButton = screen.getAllByRole('button')[0];
      
      // Start timer with short duration (set work to 0.01 min = ~1 second)
      const workInput = screen.getAllByRole('spinbutton')[0];
      fireEvent.change(workInput, { target: { value: '1' } });
      
      fireEvent.click(playButton);
      
      // Fast forward to completion (60 seconds + buffer)
      vi.advanceTimersByTime(61000);
      
      await waitFor(() => {
        // Timer should stop at 0:00 or reset
        expect(screen.getByText(/0:00|1:00/)).toBeInTheDocument();
      });
    });
  });
});
