import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/supabase/courses', () => ({
  fetchCoursesWithExercises: vi.fn(),
  createCourse: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
  captureServerError: vi.fn(),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { fetchCoursesWithExercises, createCourse } from '@/lib/supabase/courses';
import { GET, POST } from '@/app/api/courses/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedFetchCourses = vi.mocked(fetchCoursesWithExercises);
const mockedCreateCourse = vi.mocked(createCourse);

function authOk() {
  return { user: { id: 'user-123' } as any, errorResponse: null };
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

describe('GET /api/courses', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(authFail() as any);

    const response = await GET(new NextRequest('http://localhost:3000/api/courses'));
    expect(response.status).toBe(401);
  });

  it('returns courses with exercises when authenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    const courses = [
      {
        id: 'c1',
        name: 'Mathematik I',
        ects: 6,
        exercises: [{ id: 'ex1', exerciseNumber: 1, completed: false }],
      },
    ];
    mockedFetchCourses.mockResolvedValue(courses as any);

    const response = await GET(new NextRequest('http://localhost:3000/api/courses'));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(courses);
    expect(mockedFetchCourses).toHaveBeenCalledWith('user-123');
  });

  it('returns empty array when no courses', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedFetchCourses.mockResolvedValue([] as any);

    const response = await GET(new NextRequest('http://localhost:3000/api/courses'));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([]);
  });

  it('returns 500 on server error', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedFetchCourses.mockRejectedValue(new Error('DB error'));

    const response = await GET(new NextRequest('http://localhost:3000/api/courses'));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error?.message).toBe('Failed to fetch courses');
  });
});

describe('POST /api/courses', () => {
  beforeEach(() => vi.clearAllMocks());

  const validBody = {
    name: 'Algorithmen und Datenstrukturen',
    ects: 6,
    numExercises: 12,
    semester: 'WS 2025/26',
  };

  it('returns 401 when not authenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(authFail() as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(validBody),
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(response.status).toBe(401);
  });

  it('creates course with valid data', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    const created = { id: 'c1', ...validBody };
    mockedCreateCourse.mockResolvedValue(created as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(validBody),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.name).toBe('Algorithmen und Datenstrukturen');
    expect(mockedCreateCourse).toHaveBeenCalledWith(
      'user-123',
      expect.objectContaining({ name: 'Algorithmen und Datenstrukturen', ects: 6 })
    );
  });

  it('creates course with optional exam date', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    const bodyWithExam = { ...validBody, examDate: '2026-07-15' };
    mockedCreateCourse.mockResolvedValue({ id: 'c1', ...bodyWithExam } as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(bodyWithExam),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(201);
    expect(mockedCreateCourse).toHaveBeenCalledWith(
      'user-123',
      expect.objectContaining({ examDate: expect.any(Date) })
    );
  });

  it('returns 400 for missing name', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify({ ects: 6, numExercises: 10, semester: 'WS 2025/26' }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error?.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for ECTS out of range', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify({ ...validBody, ects: 0 }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(400);
  });

  it('returns 400 for numExercises out of range', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify({ ...validBody, numExercises: 25 }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(400);
  });
});
