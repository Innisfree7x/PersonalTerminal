import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@/tests/utils/test-utils';
import PomodoroTimer from '@/components/features/dashboard/PomodoroTimer';

describe('PomodoroTimer', () => {
  test('renders current timer UI', () => {
    render(<PomodoroTimer />);
    expect(screen.getByText('Pomodoro')).toBeInTheDocument();
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /switch to break mode/i })).toBeInTheDocument();
  });

  test('start button toggles to pause label', async () => {
    render(<PomodoroTimer />);
    fireEvent.click(screen.getByRole('button', { name: /start timer/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause timer/i })).toBeInTheDocument();
    });
  });

  test('switching mode shows break timer', async () => {
    render(<PomodoroTimer />);
    fireEvent.click(screen.getByRole('button', { name: /switch to break mode/i }));

    await waitFor(() => {
      expect(screen.getByText('05:00')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /switch to work mode/i })).toBeInTheDocument();
    });
  });

  test('shows loading skeleton', () => {
    const { container } = render(<PomodoroTimer isLoading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByText('25:00')).not.toBeInTheDocument();
  });
});
