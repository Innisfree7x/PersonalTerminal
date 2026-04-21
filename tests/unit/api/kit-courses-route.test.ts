import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/kitCourses', () => ({
  listAvailableSemesters: vi.fn(),
  listKitCoursesForSemesters: vi.fn(),
}));

vi.mock('@/lib/api/server-errors', () => ({
  handleRouteError: vi.fn((error, userMessage) =>
    NextResponse.json({ error: userMessage }, { status: 500 })
  ),
}));

import { requireApiAuth } from '@/lib/api/auth';
import {
  listAvailableSemesters,
  listKitCoursesForSemesters,
} from '@/lib/supabase/kitCourses';
import { GET } from '@/app/api/university/kit-courses/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedListAvailable = vi.mocked(listAvailableSemesters);
const mockedListCourses = vi.mocked(listKitCoursesForSemesters);

describe('GET /api/university/kit-courses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when auth fails', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({
      user: null,
      errorResponse: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    } as any);

    const response = await GET(
      new NextRequest('http://localhost:3000/api/university/kit-courses')
    );
    expect(response.status).toBe(401);
  });

  it('falls back to most recent semester when no query param given', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({
      user: { id: 'user-1' },
      errorResponse: null,
    } as any);
    mockedListAvailable.mockResolvedValueOnce(['SS 2026', 'WS 2025/26']);
    mockedListCourses.mockResolvedValueOnce({
      semesters: ['SS 2026'],
      modules: [],
      totalCredits: 0,
    });

    const response = await GET(
      new NextRequest('http://localhost:3000/api/university/kit-courses')
    );
    expect(response.status).toBe(200);

    expect(mockedListCourses).toHaveBeenCalledWith(
      undefined,
      'user-1',
      ['SS 2026']
    );

    const body = await response.json();
    expect(body.availableSemesters).toEqual(['SS 2026', 'WS 2025/26']);
  });

  it('uses requested semesters when provided', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({
      user: { id: 'user-1' },
      errorResponse: null,
    } as any);
    mockedListAvailable.mockResolvedValueOnce(['SS 2026', 'WS 2025/26']);
    mockedListCourses.mockResolvedValueOnce({
      semesters: ['WS 2025/26'],
      modules: [
        {
          id: 'm1',
          title: 'Investments',
          moduleCode: 'WI-INV',
          credits: 4.5,
          status: 'active',
          semesterLabel: 'WS 2025/26',
          matchedExamDate: '2026-08-13T08:00:00.000Z',
          matchedExamTitle: 'Investments Klausur',
        },
      ],
      totalCredits: 4.5,
    });

    const response = await GET(
      new NextRequest(
        'http://localhost:3000/api/university/kit-courses?semester=WS%202025%2F26'
      )
    );
    expect(response.status).toBe(200);

    expect(mockedListCourses).toHaveBeenCalledWith(
      undefined,
      'user-1',
      ['WS 2025/26']
    );

    const body = await response.json();
    expect(body.modules).toHaveLength(1);
    expect(body.totalCredits).toBe(4.5);
  });
});
