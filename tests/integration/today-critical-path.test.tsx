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

vi.mock('@/components/features/dashboard/StudyProgress', () => ({
  default: () => <div>Study Progress Mock</div>,
}));

vi.mock('@/components/features/today/AmbientRoomPanel', () => ({
  default: () => <div>Ambient Room Mock</div>,
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
        kitSignals: {
          nextCampusEvent: {
            title: 'Financial Data Science (V)',
            startsAt: '2026-03-20T10:00:00.000Z',
            kind: 'lecture',
            location: 'Ulrich, WIWI',
          },
          upcomingEventsCount: 2,
          nextCampusExam: {
            title: 'Investments Klausur',
            startsAt: '2026-03-21T08:30:00.000Z',
            location: 'Audimax',
          },
          latestCampusGrade: {
            moduleTitle: 'Operations Research',
            gradeLabel: '1,7',
            publishedAt: '2026-03-19T11:00:00.000Z',
          },
          freshIliasItems: 2,
          latestIliasItem: {
            favoriteTitle: 'Investments SS2025',
            title: 'Neue Klausurhinweise',
            itemType: 'announcement',
            publishedAt: '2026-03-19T12:00:00.000Z',
            itemUrl: 'https://ilias.studium.kit.edu/item-1',
          },
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

  test('renders trajectory hero, momentum pulse, next moves, and secondary widgets', async () => {
    renderWithProviders(<TodayPage />);

    await screen.findByTestId('trajectory-hero');

    expect(screen.getByText('GMAT')).toBeInTheDocument();
    expect(screen.getByTestId('momentum-pulse')).toBeInTheDocument();
    expect(screen.getByText('57')).toBeInTheDocument();
    expect(screen.getByText('Momentum')).toBeInTheDocument();
    expect(screen.getByTestId('next-moves-stack')).toBeInTheDocument();
    expect(screen.getByText('Financial Data Science (V)')).toBeInTheDocument();
    expect(screen.getByText('Focus Tasks Mock')).toBeInTheDocument();
    expect(screen.getByText('Study Progress Mock')).toBeInTheDocument();
    expect(screen.getByText('Ambient Room Mock')).toBeInTheDocument();
    expect(screen.getByText(/1\/3/)).toBeInTheDocument();
    expect(screen.getByText('Streak')).toBeInTheDocument();

    const trajectoryLink = screen.getByRole('link', { name: /Öffne Trajectory/i });
    expect(trajectoryLink).toHaveAttribute(
      'href',
      '/trajectory?goalId=goal_gmat&source=today_hero'
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/dashboard/next-tasks?include=trajectory_morning'
      );
    });
  });
});
