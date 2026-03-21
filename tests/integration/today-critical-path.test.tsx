import { beforeEach, describe, expect, test, vi } from 'vitest';

function installStorageMock() {
  const store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, String(value)),
      removeItem: (key: string) => void store.delete(key),
      clear: () => void store.clear(),
    },
  });
}
import { renderWithProviders, screen, waitFor } from '@/tests/utils/test-utils';
import TodayPage from '@/app/(dashboard)/today/page';
import { STORAGE_KEYS } from '@/lib/storage/keys';

vi.mock('@/components/features/dashboard/FocusTasks', () => ({
  default: () => <div>Focus Tasks Mock</div>,
}));

vi.mock('@/components/features/dashboard/CommandBar', () => ({
  default: () => <div>Command Bar Mock</div>,
}));

vi.mock('@/components/features/dashboard/ScheduleColumn', () => ({
  default: () => <div>Schedule Mock</div>,
}));

vi.mock('@/components/features/dashboard/QuickActionsWidget', () => ({
  default: () => <div>Quick Actions Mock</div>,
}));

vi.mock('@/components/features/dashboard/MomentumWidget', () => ({
  default: () => <div>Momentum Widget Mock</div>,
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

vi.mock('@/components/features/dashboard/ActivityFeed', () => ({
  default: () => <div>Activity Feed Mock</div>,
}));

vi.mock('@/components/features/dashboard/PomodoroTimer', () => ({
  default: () => <div>Pomodoro Mock</div>,
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

vi.mock('@/lib/analytics/client', () => ({
  trackAppEvent: vi.fn().mockResolvedValue(undefined),
}));

describe('Today critical path integration', () => {
  beforeEach(() => {
    installStorageMock();
    vi.clearAllMocks();
    window.localStorage.clear();
    window.localStorage.setItem('innis_welcomed_v1', '1');
    window.localStorage.removeItem(STORAGE_KEYS.weeklyCheckinWeekKey);
    window.localStorage.setItem('innis:last-momentum-score:v1', '56');

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        homeworks: [],
        goals: [],
        interviews: [],
        studyProgress: [],
        nextBestAction: null,
        nextBestAlternatives: [],
        riskSignals: [],
        executionScore: 61,
        meta: {
          generatedAt: '2026-03-21T10:00:00.000Z',
          queryDurationMs: 12,
        },
        stats: {
          tasksToday: 3,
          tasksCompleted: 1,
          exercisesThisWeek: 0,
          exercisesTotal: 0,
          nextExam: null,
          goalsActive: 1,
          goalsDueSoon: 0,
          interviewsUpcoming: 0,
        },
        trajectoryMorning: {
          generatedAt: '2026-03-21T10:00:00.000Z',
          overview: {
            goals: [
              {
                id: 'goal_gmat',
                title: 'GMAT',
                dueDate: '2027-03-14',
                status: 'active',
              },
            ],
            computed: {
              generatedBlocks: [
                {
                  goalId: 'goal_gmat',
                  startDate: '2026-11-09',
                  status: 'on_track',
                },
              ],
            },
          },
          momentum: {
            score: 57,
            delta: 1,
            trend: 'flat',
            breakdown: {
              statusPoints: 40,
              capacityPoints: 10,
              bufferPoints: 5,
              trendPoints: 1,
              streakBonus: 1,
              taskBonus: 0,
            },
            stats: {
              onTrack: 1,
              tight: 0,
              atRisk: 0,
              activeGoals: 1,
              plannedHoursPerWeek: 40,
              last7DaysHours: 5.7,
              previous7DaysHours: 5.2,
              capacityRatio: 0.14,
            },
          },
        },
        weekEvents: {
          generatedAt: '2026-03-21T10:00:00.000Z',
          events: [],
        },
      }),
    } as Response);
  });

  test('renders the morning briefing, momentum chips, and weekly check-in CTA from the dashboard payload', async () => {
    renderWithProviders(<TodayPage />);

    await screen.findByText(/Morning briefing:/i);

    expect(screen.getByText('GMAT')).toBeInTheDocument();
    expect(screen.getByText(/358d until deadline/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open linked trajectory/i })).toHaveAttribute(
      'href',
      '/trajectory?goalId=goal_gmat&source=morning_briefing'
    );
    expect(screen.getByText('Momentum 57')).toBeInTheDocument();
    expect(screen.getByText('+1 vs last week')).toBeInTheDocument();
    expect(screen.getByText('On track 1')).toBeInTheDocument();
    expect(screen.getByText('Focus load 5.7h / 40h')).toBeInTheDocument();
    expect(screen.getByText('Prep starts 09.11.2026')).toBeInTheDocument();
    expect(screen.getByText('1/3 tasks done')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Review now/i })).toHaveAttribute(
      'href',
      '/trajectory?source=weekly_checkin'
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/next-tasks?include=trajectory_morning,week_events');
    });
  });
});
