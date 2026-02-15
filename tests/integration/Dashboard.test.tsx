import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/tests/utils/test-utils';
import TodayPage from '@/app/(dashboard)/today/page';

vi.mock('@/components/features/dashboard/FocusTasks', () => ({
  default: () => <div>Focus Tasks Mock</div>,
}));

vi.mock('@/components/features/dashboard/ScheduleColumn', () => ({
  default: () => <div>Schedule Mock</div>,
}));

vi.mock('@/components/features/dashboard/DashboardStats', () => ({
  default: () => <div>Stats Mock</div>,
}));

vi.mock('@/components/features/dashboard/QuickActionsWidget', () => ({
  default: () => <div>Quick Actions Mock</div>,
}));

vi.mock('@/components/features/dashboard/StudyProgress', () => ({
  default: () => <div>Study Progress Mock</div>,
}));

vi.mock('@/components/features/dashboard/UpcomingDeadlines', () => ({
  default: () => <div>Deadlines Mock</div>,
}));

vi.mock('@/components/features/dashboard/WeekOverview', () => ({
  default: () => <div>Week Overview Mock</div>,
}));

vi.mock('@/components/features/dashboard/PomodoroTimer', () => ({
  default: () => <div>Pomodoro Mock</div>,
}));

vi.mock('@/lib/api/calendar', () => ({
  checkGoogleCalendarConnection: vi.fn().mockResolvedValue(false),
  fetchTodayCalendarEvents: vi.fn().mockResolvedValue([]),
  disconnectGoogleCalendar: vi.fn().mockResolvedValue(undefined),
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
      }),
    } as Response);
  });

  test('renders dashboard widgets', async () => {
    renderWithProviders(<TodayPage />);

    await waitFor(() => {
      expect(screen.getByText('Focus Tasks Mock')).toBeInTheDocument();
      expect(screen.getByText('Schedule Mock')).toBeInTheDocument();
      expect(screen.getByText('Quick Actions Mock')).toBeInTheDocument();
      expect(screen.getByText('Pomodoro Mock')).toBeInTheDocument();
    });
  });

  test('loads next-tasks data from API', async () => {
    renderWithProviders(<TodayPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/next-tasks');
    });
  });
});
