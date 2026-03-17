import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@/tests/utils/test-utils';

const hoisted = vi.hoisted(() => ({
  router: {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  },
  toastSuccess: vi.fn(),
  confetti: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => hoisted.router,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: hoisted.toastSuccess,
  },
}));

vi.mock('canvas-confetti', () => ({
  default: hoisted.confetti,
}));

vi.mock('@/app/actions/profile', () => ({
  updateProfileAction: vi.fn(),
}));

vi.mock('@/app/onboarding/analytics', () => ({
  trackOnboardingEvent: vi.fn(),
}));

vi.mock('@/lib/trajectory/risk-model', () => ({
  formatTrajectoryRiskLabel: (status: string) => {
    if (status === 'on_track') return 'on track';
    if (status === 'tight') return 'tight';
    return 'at risk';
  },
}));

import { StepComplete } from '@/components/features/onboarding/StepComplete';
import { updateProfileAction } from '@/app/actions/profile';
import { trackOnboardingEvent } from '@/app/onboarding/analytics';

const mockedUpdateProfileAction = vi.mocked(updateProfileAction);
const mockedTrackOnboardingEvent = vi.mocked(trackOnboardingEvent);

const baseCompletedData = {
  trajectory: {
    goalId: 'goal-1',
    goalTitle: 'GMAT Sprint',
    status: 'on_track' as const,
    startDate: '2026-09-01',
    explanation: 'Stable trajectory.',
    effectiveCapacityHoursPerWeek: 10,
  },
  demoSeeded: false,
};

describe('Onboarding StepComplete gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('keeps completion gated when trajectory data is missing', () => {
    render(
      <StepComplete
        completedData={{
          ...baseCompletedData,
          trajectory: null,
        }}
      />
    );

    expect(screen.getByText(/Trajectory-Daten fehlen/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Trajectory öffnen/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Direkt zu Today/i })).toBeDisabled();
    expect(mockedUpdateProfileAction).not.toHaveBeenCalled();
  });

  test('writes onboarding completed only after successful finalize and allows retry after error', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    mockedUpdateProfileAction
      .mockRejectedValueOnce(new Error('profile write failed'))
      .mockResolvedValueOnce(undefined);

    render(<StepComplete completedData={baseCompletedData} onComplete={onComplete} />);

    const openTrajectoryButton = screen.getByRole('button', { name: /Trajectory öffnen/i });
    expect(openTrajectoryButton).not.toBeDisabled();

    await user.click(openTrajectoryButton);
    await screen.findByText(/profile write failed/i);

    expect(onComplete).not.toHaveBeenCalled();
    expect(mockedTrackOnboardingEvent).not.toHaveBeenCalled();
    expect(hoisted.router.push).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Trajectory öffnen/i }));

    await waitFor(() => expect(mockedUpdateProfileAction).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(hoisted.router.push).toHaveBeenCalledWith('/trajectory'));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(mockedTrackOnboardingEvent).toHaveBeenCalledTimes(1);
    expect(hoisted.router.refresh).toHaveBeenCalledTimes(1);
  });
});
