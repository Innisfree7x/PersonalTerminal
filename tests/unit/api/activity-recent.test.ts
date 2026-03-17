import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/api/server-errors', () => ({
  handleRouteError: vi.fn((error, userMessage) => NextResponse.json({ error: userMessage }, { status: 500 })),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { createClient } from '@/lib/auth/server';
import { GET } from '@/app/api/activity/recent/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedCreateClient = vi.mocked(createClient);

function makeBuilder(result: { data: any[] | null }) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    not: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn().mockResolvedValue(result),
  };

  return builder;
}

describe('GET /api/activity/recent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns unauthorized when auth fails', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({
      user: null,
      errorResponse: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    } as any);

    const response = await GET(new NextRequest('http://localhost:3000/api/activity/recent'));
    expect(response.status).toBe(401);
  });

  it('uses the requested limit, enriches exercise activity with course names, and sorts results', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({
      user: { id: 'user-1' },
      errorResponse: null,
    } as any);

    const tasks = makeBuilder({
      data: [
        {
          id: 'task-1',
          title: 'Review DCF deck',
          created_at: '2026-03-17T09:00:00.000Z',
          completed: true,
        },
      ],
    });

    const goals = makeBuilder({
      data: [
        {
          id: 'goal-1',
          title: 'GMAT 700',
          created_at: '2026-03-16T08:00:00.000Z',
        },
      ],
    });

    const applications = makeBuilder({
      data: [
        {
          id: 'app-1',
          company: 'Deloitte',
          position: 'Intern M&A',
          created_at: '2026-03-15T10:00:00.000Z',
        },
      ],
    });

    const exercises = makeBuilder({
      data: [
        {
          id: 'exercise-1',
          exercise_number: 7,
          course_id: 'course-1',
          completed_at: '2026-03-17T11:00:00.000Z',
        },
      ],
    });

    const courses = makeBuilder({
      data: [
        {
          id: 'course-1',
          name: 'GDI 2',
        },
      ],
    });

    mockedCreateClient.mockReturnValue({
      from: vi.fn((table: string) => {
        switch (table) {
          case 'daily_tasks':
            return tasks;
          case 'goals':
            return goals;
          case 'job_applications':
            return applications;
          case 'exercise_progress':
            return exercises;
          case 'courses':
            return courses;
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      }),
    } as any);

    const response = await GET(new NextRequest('http://localhost:3000/api/activity/recent?limit=3'));

    expect(response.status).toBe(200);
    expect(tasks.limit).toHaveBeenCalledWith(3);
    expect(goals.limit).toHaveBeenCalledWith(3);
    expect(applications.limit).toHaveBeenCalledWith(3);
    expect(exercises.limit).toHaveBeenCalledWith(3);
    expect(courses.in).toHaveBeenCalledWith('id', ['course-1']);

    const body = await response.json();
    expect(body.activities).toHaveLength(3);
    expect(body.activities[0]).toMatchObject({
      id: 'exercise-exercise-1',
      type: 'exercise',
      action: 'Completed GDI 2 exercise 7',
    });
    expect(body.activities[1]).toMatchObject({
      id: 'task-task-1',
      type: 'task',
    });
  });

  it('falls back to the default limit when the query param is invalid', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({
      user: { id: 'user-1' },
      errorResponse: null,
    } as any);

    const emptyResult = makeBuilder({ data: [] });

    mockedCreateClient.mockReturnValue({
      from: vi.fn((table: string) => {
        switch (table) {
          case 'daily_tasks':
          case 'goals':
          case 'job_applications':
          case 'exercise_progress':
            return emptyResult;
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      }),
    } as any);

    const response = await GET(new NextRequest('http://localhost:3000/api/activity/recent?limit=not-a-number'));

    expect(response.status).toBe(200);
    expect(emptyResult.limit).toHaveBeenCalledWith(5);
    const body = await response.json();
    expect(body.activities).toEqual([]);
  });
});
