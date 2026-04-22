import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/tests/utils/test-utils';
import TodayPage from '@/app/(dashboard)/today/TodayClient';
import { SoundProvider } from '@/components/providers/SoundProvider';

vi.mock('@/components/features/dashboard/FocusTasks', () => ({
  default: () => <div>Focus Tasks Mock</div>,
}));

vi.mock('@/components/features/dashboard/StudyProgress', () => ({
  default: () => <div>Study Progress Mock</div>,
}));

vi.mock('@/components/features/today/AmbientRoomPanel', () => ({
  default: () => <div>Ambient Room Mock</div>,
}));

vi.mock('@/app/actions/calendar', () => ({
  checkGoogleCalendarConnectionAction: vi.fn().mockResolvedValue(false),
  fetchTodayCalendarEventsAction: vi.fn().mockResolvedValue([]),
  disconnectGoogleCalendarAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/api/calendar', () => ({
  connectGoogleCalendar: vi.fn(),
}));

vi.mock('@/lib/hooks/useNotifications', () => ({
  useNotifications: () => ({
    error: null,
    success: null,
    setError: vi.fn(),
    setSuccess: vi.fn(),
  }),
  parseOAuthCallbackParams: () => ({ error: null, success: null }),
}));

describe('Dashboard Integration', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        stats: {
          tasksToday: 0,
          tasksCompleted: 0,
          exercisesThisWeek: 0,
          exercisesTotal: 0,
          nextExam: null,
          goalsDueSoon: 0,
          interviewsUpcoming: 0,
        },
        studyProgress: [],
        goals: [],
        interviews: [],
        nextBestAction: null,
        nextBestAlternatives: [],
        riskSignals: [],
        executionScore: 0,
        meta: {
          generatedAt: new Date().toISOString(),
          queryDurationMs: 10,
        },
      }),
    } as Response);
  });

  test('renders dashboard widgets', async () => {
    renderWithProviders(
      <SoundProvider>
        <TodayPage initialNextTasksData={null} />
      </SoundProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('trajectory-hero-empty')).toBeInTheDocument();
      expect(screen.getByText('Kein aktives Trajectory-Ziel')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Einrichten/i })).toHaveAttribute(
        'href',
        '/trajectory'
      );
      expect(screen.getByText('Focus Tasks Mock')).toBeInTheDocument();
      expect(screen.getByText('Study Progress Mock')).toBeInTheDocument();
      expect(screen.getByText('Ambient Room Mock')).toBeInTheDocument();
      expect(screen.getByText('Streak')).toBeInTheDocument();
    });
  });

  test('loads next-tasks data from API', async () => {
    renderWithProviders(
      <SoundProvider>
        <TodayPage initialNextTasksData={null} />
      </SoundProvider>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/next-tasks?include=trajectory_morning,week_events');
    });
  });
});
