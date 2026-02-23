import { describe, expect, test, vi } from 'vitest';
import type { ReactElement } from 'react';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/tests/utils/test-utils';
import PomodoroTimer from '@/components/features/dashboard/PomodoroTimer';
import { FocusTimerProvider } from '@/components/providers/FocusTimerProvider';

function renderWithFocusProvider(ui: ReactElement) {
  return renderWithProviders(<FocusTimerProvider>{ui}</FocusTimerProvider>);
}

describe('PomodoroTimer', () => {
  test('renders current timer UI', () => {
    renderWithFocusProvider(<PomodoroTimer />);
    expect(screen.getByText('Pomodoro')).toBeInTheDocument();
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument();
  });

  test('start button toggles to pause label', async () => {
    renderWithFocusProvider(<PomodoroTimer />);
    fireEvent.click(screen.getByRole('button', { name: /start timer/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause timer/i })).toBeInTheDocument();
    });
  });

  test('selecting a duration updates ready timer', async () => {
    renderWithFocusProvider(<PomodoroTimer />);
    fireEvent.click(screen.getByRole('button', { name: '50m' }));

    await waitFor(() => {
      expect(screen.getByText('50:00')).toBeInTheDocument();
      expect(screen.getByRole('timer', { name: /focus timer: 50:00 remaining/i })).toBeInTheDocument();
    });
  });

  test('shows loading skeleton', () => {
    const { container } = renderWithFocusProvider(<PomodoroTimer isLoading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByText('25:00')).not.toBeInTheDocument();
  });
});
