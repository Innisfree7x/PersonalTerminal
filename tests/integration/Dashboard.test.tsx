import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/tests/utils/test-utils';
import TodayPage from '@/app/(dashboard)/today/page';
import { SoundProvider } from '@/components/providers/SoundProvider';

vi.mock('@/components/features/dashboard/FocusTasks', () => ({
  default: () => <div>Focus Tasks Mock</div>,
}));

vi.mock('@/components/features/dashboard/StudyProgress', () => ({
  default: () => <div>Study Progress Mock</div>,
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

  test('renders command center terminal widgets', async () => {
    renderWithProviders(
      <SoundProvider>
        <TodayPage />
      </SoundProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/TERMINAL LIVE/i)).toBeInTheDocument();
      expect(screen.getByText(/Google Workspace:/i)).toBeInTheDocument();
      expect(screen.getByText(/Tagesplan/i)).toBeInTheDocument();
      expect(screen.getByText(/Fokus-Aufgaben/i)).toBeInTheDocument();
      expect(screen.getByText(/Aktive Projekte/i)).toBeInTheDocument();
    });
  });

  test('loads terminal data from APIs', async () => {
    renderWithProviders(
      <SoundProvider>
        <TodayPage />
      </SoundProvider>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      const calledUrls = (global.fetch as any).mock.calls.map((call: any[]) => call[0]);
      expect(calledUrls.some((url: string) => url.includes('/api/calendar/entries'))).toBe(true);
      expect(calledUrls.some((url: string) => url.includes('/api/daily-tasks'))).toBe(true);
    });
  });
});
