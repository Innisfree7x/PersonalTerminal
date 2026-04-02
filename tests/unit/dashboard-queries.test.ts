import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/courses', () => ({
  fetchCoursesWithExercises: vi.fn(),
}));

import { createClient } from '@/lib/auth/server';
import { fetchCoursesWithExercises } from '@/lib/supabase/courses';
import { getDashboardNextTasks, getDashboardStats } from '@/lib/dashboard/queries';

const mockedCreateClient = vi.mocked(createClient);
const mockedFetchCoursesWithExercises = vi.mocked(fetchCoursesWithExercises);

function makeResolvedQuery<T>(result: T) {
  const query = Promise.resolve(result) as Promise<T> & Record<string, any>;
  const methods = ['select', 'eq', 'gte', 'lte', 'in', 'order', 'limit', 'lt', 'is', 'maybeSingle'];
  for (const method of methods) {
    query[method] = vi.fn(() => query);
  }
  return query;
}

function makeSupabase(tableQueues: Record<string, Array<ReturnType<typeof makeResolvedQuery>>>) {
  return {
    from: vi.fn((table: string) => {
      const queue = tableQueues[table];
      if (!queue || queue.length === 0) {
        throw new Error(`Unexpected table access: ${table}`);
      }
      return queue.shift();
    }),
  };
}

describe('dashboard queries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-18T10:00:00.000Z'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('aggregates dashboard stats from goals, applications and study counts', async () => {
    mockedCreateClient.mockReturnValue(
      makeSupabase({
        goals: [
          // 1: categories query
          makeResolvedQuery({
            data: [
              { category: 'career' },
              { category: 'career' },
              { category: 'learning' },
            ],
            error: null,
          }),
          // 2: overdue count
          makeResolvedQuery({ count: 1, error: null }),
          // 3: week goals with metrics
          makeResolvedQuery({
            data: [
              { id: 'goal-week', metrics_current: 60, metrics_target: 100, metrics_unit: 'points' },
              { id: 'goal-today', metrics_current: 2, metrics_target: 4, metrics_unit: 'chapters' },
            ],
            error: null,
          }),
          // 4: today goals count
          makeResolvedQuery({ count: 1, error: null }),
        ],
        job_applications: [
          // 1: next interview (single row)
          makeResolvedQuery({
            data: {
              company: 'Lazard',
              position: 'Intern PE',
              interview_date: '2026-03-19T13:00:00.000Z',
            },
            error: null,
          }),
          // 2: pending count
          makeResolvedQuery({ count: 2, error: null }),
          // 3: oldest pending (single row)
          makeResolvedQuery({
            data: { application_date: '2026-03-08T09:00:00.000Z' },
            error: null,
          }),
          // 4: follow-up count
          makeResolvedQuery({ count: 1, error: null }),
          // 5: interview count
          makeResolvedQuery({ count: 1, error: null }),
        ],
        courses: [
          makeResolvedQuery({
            data: [
              { id: 'course-1', name: 'VWL 2', exam_date: '2026-03-22' },
              { id: 'course-2', name: 'E-Tech 1', exam_date: '2026-04-10' },
            ],
            error: null,
          }),
        ],
        exercise_progress: [
          makeResolvedQuery({ count: 20, error: null }),
          makeResolvedQuery({ count: 10, error: null }),
          makeResolvedQuery({ count: 3, error: null }),
        ],
      }) as any
    );

    const stats = await getDashboardStats('user-1');

    expect(stats.career).toMatchObject({
      activeInterviews: 1,
      applicationsPending: 2,
      pendingDays: 10,
      followUpNeeded: 1,
      nextInterview: {
        company: 'Lazard',
        position: 'Intern PE',
        date: '2026-03-19T13:00:00.000Z',
      },
    });
    expect(stats.goals).toEqual({
      weeklyProgress: { onTrack: 2, total: 2 },
      byCategory: { career: 2, learning: 1 },
      overdue: 1,
    });
    expect(stats.study).toEqual({
      weekCompleted: 3,
      semesterPercent: 50,
      nextExam: {
        courseName: 'VWL 2',
        daysUntil: 4,
      },
    });
    expect(stats.metrics).toEqual({
      todayCompletion: 50,
      weekProgress: { day: 3, total: 7 },
      focusTime: 'Peak hours - good for deep work',
    });
  });

  it('builds next tasks, execution scores and risk signals from the daily operating state', async () => {
    mockedFetchCoursesWithExercises.mockResolvedValueOnce([
      {
        id: 'course-1',
        name: 'VWL 2',
        ects: 5,
        numExercises: 12,
        semester: 'WS 2025/26',
        examDate: new Date('2026-03-20T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        exercises: [
          { id: 'ex-1', courseId: 'course-1', exerciseNumber: 1, completed: true, createdAt: new Date() },
          { id: 'ex-2', courseId: 'course-1', exerciseNumber: 2, completed: false, createdAt: new Date() },
        ],
      },
      {
        id: 'course-2',
        name: 'E-Tech 1',
        ects: 3,
        numExercises: 6,
        semester: 'WS 2025/26',
        examDate: new Date('2026-03-27T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        exercises: [
          { id: 'ex-3', courseId: 'course-2', exerciseNumber: 1, completed: false, createdAt: new Date() },
        ],
      },
    ] as any);

    mockedCreateClient.mockReturnValue(
      makeSupabase({
        goals: [
          makeResolvedQuery({
            data: [
              {
                id: 'goal-1',
                title: 'GMAT verbal block',
                category: 'career',
                target_date: '2026-03-21',
                metrics_current: 20,
                metrics_target: 100,
                metrics_unit: 'points',
              },
            ],
            error: null,
          }),
        ],
        job_applications: [
          makeResolvedQuery({
            data: [
              {
                id: 'app-interview',
                company: 'Kern Advisory',
                position: 'Intern TS',
                status: 'interview',
                application_date: '2026-03-10T09:00:00.000Z',
                interview_date: '2026-03-19T10:00:00.000Z',
                updated_at: '2026-03-17T09:00:00.000Z',
              },
            ],
            error: null,
          }),
        ],
        daily_tasks: [
          makeResolvedQuery({
            data: [
              {
                id: 'task-open',
                title: 'Update CV bullet points',
                completed: false,
                date: '2026-03-18',
                time_estimate: '30m',
              },
              {
                id: 'task-done',
                title: 'Send thank-you email',
                completed: true,
                date: '2026-03-18',
                time_estimate: '15m',
              },
            ],
            error: null,
          }),
        ],
        exercise_progress: [
          makeResolvedQuery({
            data: [{ id: 'done-today-1' }],
            error: null,
          }),
        ],
        kit_campus_events: [
          makeResolvedQuery({
            data: {
              title: 'Financial Data Science (V)',
              starts_at: '2026-03-20T10:00:00.000Z',
              kind: 'lecture',
              location: 'Ulrich, WIWI',
            },
            error: null,
          }),
          makeResolvedQuery({
            data: {
              title: 'Investments Klausur',
              starts_at: '2026-03-21T08:30:00.000Z',
              location: 'Audimax',
            },
            error: null,
          }),
          makeResolvedQuery({
            count: 2,
            error: null,
          }),
        ],
        kit_campus_grades: [
          makeResolvedQuery({
            data: {
              module_id: 'module-db-1',
              grade_label: '1,7',
              published_at: '2026-03-17T12:00:00.000Z',
            },
            error: null,
          }),
        ],
        kit_ilias_items: [
          makeResolvedQuery({
            count: 2,
            error: null,
          }),
          makeResolvedQuery({
            data: {
              title: 'Neue Klausurhinweise',
              item_type: 'announcement',
              published_at: '2026-03-18T08:00:00.000Z',
              item_url: 'https://ilias.studium.kit.edu/item-1',
              favorite_id: 'favorite-db-1',
            },
            error: null,
          }),
        ],
        kit_campus_modules: [
          makeResolvedQuery({
            data: {
              title: 'Volkswirtschaftslehre II: Makroökonomie',
            },
            error: null,
          }),
        ],
        kit_ilias_favorites: [
          makeResolvedQuery({
            data: {
              title: 'Investments SS2025',
            },
            error: null,
          }),
        ],
      }) as any
    );

    const result = await getDashboardNextTasks('user-1');

    expect(result.homeworks).toHaveLength(2);
    expect(result.goals).toEqual([
      expect.objectContaining({
        id: 'goal-1',
        title: 'GMAT verbal block',
        daysUntil: 3,
      }),
    ]);
    expect(result.interviews).toEqual([
      expect.objectContaining({
        company: 'Kern Advisory',
        daysUntil: 1,
      }),
    ]);
    expect(result.nextBestAction).toMatchObject({
      title: 'Kern Advisory Interview Prep',
      urgencyLabel: 'soon',
    });
    expect(result.riskSignals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'exam-window',
          title: 'Exam risk window',
          detail: 'VWL 2 in 2d',
        }),
        expect.objectContaining({
          id: 'interview-app-interview',
          title: 'Interview preparation urgency',
          detail: 'Kern Advisory in 1d',
        }),
      ])
    );
    expect(result.executionScore).toBe(56);
    expect(result.kitSignals).toEqual({
      nextCampusEvent: {
        title: 'Financial Data Science (V)',
        startsAt: '2026-03-20T10:00:00.000Z',
        kind: 'lecture',
        location: 'Ulrich, WIWI',
      },
      nextCampusExam: {
        title: 'Investments Klausur',
        startsAt: '2026-03-21T08:30:00.000Z',
        location: 'Audimax',
      },
      latestCampusGrade: {
        moduleTitle: 'Volkswirtschaftslehre II: Makroökonomie',
        gradeLabel: '1,7',
        publishedAt: '2026-03-17T12:00:00.000Z',
      },
      freshIliasItems: 2,
      latestIliasItem: {
        favoriteTitle: 'Investments SS2025',
        title: 'Neue Klausurhinweise',
        itemType: 'announcement',
        publishedAt: '2026-03-18T08:00:00.000Z',
        itemUrl: 'https://ilias.studium.kit.edu/item-1',
      },
      upcomingEventsCount: 2,
    });
    expect(result.stats).toMatchObject({
      tasksToday: 4,
      tasksCompleted: 1,
      exercisesThisWeek: 1,
      exercisesTotal: 18,
      goalsActive: 1,
      goalsDueSoon: 1,
      interviewsUpcoming: 1,
    });
    expect(result.meta.generatedAt).toContain('2026-03-18T10:00:00.000Z');
    expect(result.meta.queryDurationMs).toBeGreaterThanOrEqual(0);
  });
});
