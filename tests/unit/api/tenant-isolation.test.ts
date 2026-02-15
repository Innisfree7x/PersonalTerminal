import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/supabase/goals', () => ({
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
}));

vi.mock('@/lib/supabase/applications', () => ({
  updateApplication: vi.fn(),
  deleteApplication: vi.fn(),
}));

vi.mock('@/lib/supabase/courses', () => ({
  updateCourse: vi.fn(),
  deleteCourse: vi.fn(),
  supabaseCoursetoCourse: vi.fn(),
  supabaseExerciseProgressToExerciseProgress: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  createClient: vi.fn(),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { updateGoal, deleteGoal } from '@/lib/supabase/goals';
import { updateApplication, deleteApplication } from '@/lib/supabase/applications';
import { updateCourse, deleteCourse } from '@/lib/supabase/courses';
import { createClient } from '@/lib/auth/server';
import { PATCH as patchGoal, DELETE as deleteGoalRoute } from '@/app/api/goals/[id]/route';
import { PATCH as patchApplication, DELETE as deleteApplicationRoute } from '@/app/api/applications/[id]/route';
import { PATCH as patchCourse, DELETE as deleteCourseRoute } from '@/app/api/courses/[id]/route';
import { PATCH as patchTask, DELETE as deleteTaskRoute } from '@/app/api/daily-tasks/[id]/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedUpdateGoal = vi.mocked(updateGoal);
const mockedDeleteGoal = vi.mocked(deleteGoal);
const mockedUpdateApplication = vi.mocked(updateApplication);
const mockedDeleteApplication = vi.mocked(deleteApplication);
const mockedUpdateCourse = vi.mocked(updateCourse);
const mockedDeleteCourse = vi.mocked(deleteCourse);
const mockedCreateClient = vi.mocked(createClient);

const mockUserId = 'user-tenant-a';

function authOk() {
  return { user: { id: mockUserId } as any, errorResponse: null };
}

function authFail() {
  return {
    user: null,
    errorResponse: NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401 }
    ),
  };
}

describe('Tenant Isolation: ID Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('PATCH /api/goals/[id] uses authenticated user id in update call', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedUpdateGoal.mockResolvedValue({ id: 'goal-1', title: 'Updated Goal' } as any);

    const request = new NextRequest('http://localhost:3000/api/goals/goal-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Goal' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await patchGoal(request, { params: { id: 'goal-1' } });

    expect(response.status).toBe(200);
    expect(mockedUpdateGoal).toHaveBeenCalledWith(
      mockUserId,
      'goal-1',
      expect.objectContaining({ title: 'Updated Goal' })
    );
  });

  it('DELETE /api/goals/[id] uses authenticated user id in delete call', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedDeleteGoal.mockResolvedValue(undefined);

    const response = await deleteGoalRoute(
      new NextRequest('http://localhost:3000/api/goals/goal-1', { method: 'DELETE' }),
      { params: { id: 'goal-1' } }
    );

    expect(response.status).toBe(200);
    expect(mockedDeleteGoal).toHaveBeenCalledWith(mockUserId, 'goal-1');
  });

  it('PATCH /api/applications/[id] uses authenticated user id in update call', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedUpdateApplication.mockResolvedValue({ id: 'app-1' } as any);

    const request = new NextRequest('http://localhost:3000/api/applications/app-1', {
      method: 'PATCH',
      body: JSON.stringify({
        company: 'Bloomberg',
        position: 'Engineer',
        status: 'applied',
        applicationDate: '2026-02-15',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await patchApplication(request, { params: { id: 'app-1' } });

    expect(response.status).toBe(200);
    expect(mockedUpdateApplication).toHaveBeenCalledWith(
      mockUserId,
      'app-1',
      expect.objectContaining({
        company: 'Bloomberg',
        position: 'Engineer',
      })
    );
  });

  it('DELETE /api/applications/[id] uses authenticated user id in delete call', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedDeleteApplication.mockResolvedValue(undefined);

    const response = await deleteApplicationRoute(
      new NextRequest('http://localhost:3000/api/applications/app-1', { method: 'DELETE' }),
      { params: { id: 'app-1' } }
    );

    expect(response.status).toBe(204);
    expect(mockedDeleteApplication).toHaveBeenCalledWith(mockUserId, 'app-1');
  });

  it('PATCH /api/courses/[id] uses authenticated user id in update call', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedUpdateCourse.mockResolvedValue({ id: 'course-1', name: 'Math' } as any);

    const request = new NextRequest('http://localhost:3000/api/courses/course-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Math' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await patchCourse(request, { params: { id: 'course-1' } });

    expect(response.status).toBe(200);
    expect(mockedUpdateCourse).toHaveBeenCalledWith(
      mockUserId,
      'course-1',
      expect.objectContaining({ name: 'Math' })
    );
  });

  it('DELETE /api/courses/[id] uses authenticated user id in delete call', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedDeleteCourse.mockResolvedValue(undefined);

    const response = await deleteCourseRoute(
      new NextRequest('http://localhost:3000/api/courses/course-1', { method: 'DELETE' }),
      { params: { id: 'course-1' } }
    );

    expect(response.status).toBe(204);
    expect(mockedDeleteCourse).toHaveBeenCalledWith(mockUserId, 'course-1');
  });

  it('PATCH /api/daily-tasks/[id] scopes update query by authenticated user id', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);

    const select = vi.fn(() => ({
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'task-1',
          date: '2026-02-15',
          title: 'Task',
          completed: true,
          source: null,
          source_id: null,
          time_estimate: null,
          created_at: '2026-02-15T12:00:00.000Z',
        },
        error: null,
      }),
    }));
    const eq = vi.fn();
    const updateChain = { eq, select } as any;
    eq.mockReturnValue(updateChain);

    mockedCreateClient.mockReturnValue({
      from: vi.fn(() => ({
        update: vi.fn(() => updateChain),
      })),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/daily-tasks/task-1', {
      method: 'PATCH',
      body: JSON.stringify({ completed: true }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await patchTask(request, { params: { id: 'task-1' } });

    expect(response.status).toBe(200);
    expect(eq).toHaveBeenCalledWith('id', 'task-1');
    expect(eq).toHaveBeenCalledWith('user_id', mockUserId);
  });

  it('DELETE /api/daily-tasks/[id] scopes delete query by authenticated user id', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);

    const deleteEq = vi.fn();
    const deleteChain = { eq: deleteEq } as any;
    deleteEq.mockImplementation(() => {
      if (deleteEq.mock.calls.length === 1) return deleteChain;
      return Promise.resolve({ error: null });
    });

    mockedCreateClient.mockReturnValue({
      from: vi.fn(() => ({
        delete: vi.fn(() => deleteChain),
      })),
    } as any);

    const response = await deleteTaskRoute(
      new NextRequest('http://localhost:3000/api/daily-tasks/task-1', { method: 'DELETE' }),
      { params: { id: 'task-1' } }
    );

    expect(response.status).toBe(204);
    expect(deleteEq).toHaveBeenCalledWith('id', 'task-1');
    expect(deleteEq).toHaveBeenCalledWith('user_id', mockUserId);
  });

  it('returns 401 when auth fails before route mutation', async () => {
    mockedRequireApiAuth.mockResolvedValue(authFail() as any);

    const response = await deleteGoalRoute(
      new NextRequest('http://localhost:3000/api/goals/goal-1', { method: 'DELETE' }),
      { params: { id: 'goal-1' } }
    );

    expect(response.status).toBe(401);
    expect(mockedDeleteGoal).not.toHaveBeenCalled();
  });
});
