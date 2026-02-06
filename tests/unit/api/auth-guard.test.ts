import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth module
vi.mock('@/lib/auth/server', () => ({
  getCurrentUser: vi.fn(),
}));

// Mock supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
    })),
  },
}));

// Mock supabase goals/applications
vi.mock('@/lib/supabase/goals', () => ({
  fetchGoals: vi.fn().mockResolvedValue({ goals: [] }),
  createGoal: vi.fn(),
}));

vi.mock('@/lib/supabase/applications', () => ({
  fetchApplications: vi.fn().mockResolvedValue({ applications: [] }),
}));

vi.mock('@/lib/supabase/courses', () => ({
  fetchCoursesWithExercises: vi.fn().mockResolvedValue([]),
}));

import { getCurrentUser } from '@/lib/auth/server';

const mockedGetCurrentUser = vi.mocked(getCurrentUser);

describe('API Auth Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const protectedRoutes = [
    { name: 'goals', path: '@/app/api/goals/route', method: 'GET' },
    { name: 'daily-tasks', path: '@/app/api/daily-tasks/route', method: 'GET' },
    { name: 'applications', path: '@/app/api/applications/route', method: 'GET' },
    { name: 'courses', path: '@/app/api/courses/route', method: 'GET' },
    { name: 'notes', path: '@/app/api/notes/route', method: 'GET' },
    { name: 'dashboard/stats', path: '@/app/api/dashboard/stats/route', method: 'GET' },
    { name: 'dashboard/today', path: '@/app/api/dashboard/today/route', method: 'GET' },
    { name: 'activity/recent', path: '@/app/api/activity/recent/route', method: 'GET' },
    { name: 'user/streak', path: '@/app/api/user/streak/route', method: 'GET' },
  ];

  for (const route of protectedRoutes) {
    it(`${route.name} GET returns 401 when unauthenticated`, async () => {
      mockedGetCurrentUser.mockResolvedValue(null);

      const mod = await import(route.path);
      const request = new NextRequest(`http://localhost:3000/api/${route.name}`);
      const response = await mod.GET(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });
  }

  it('goals POST returns 401 when unauthenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const mod = await import('@/app/api/goals/route');
    const request = new NextRequest('http://localhost:3000/api/goals', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', category: 'fitness', targetDate: '2025-12-31' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await mod.POST(request);

    expect(response.status).toBe(401);
  });

  it('daily-tasks POST returns 401 when unauthenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const mod = await import('@/app/api/daily-tasks/route');
    const request = new NextRequest('http://localhost:3000/api/daily-tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Task', date: '2025-01-01' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await mod.POST(request);

    expect(response.status).toBe(401);
  });

  it('notes POST returns 401 when unauthenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const mod = await import('@/app/api/notes/route');
    const request = new NextRequest('http://localhost:3000/api/notes', {
      method: 'POST',
      body: JSON.stringify({ date: '2025-01-01', content: 'Test note' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await mod.POST(request);

    expect(response.status).toBe(401);
  });
});
