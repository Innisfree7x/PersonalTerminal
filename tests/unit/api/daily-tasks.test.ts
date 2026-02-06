import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth
vi.mock('@/lib/auth/server', () => ({
  getCurrentUser: vi.fn(),
}));

// Mock supabase client
const mockSelect = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockOrder = vi.fn().mockReturnThis();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
    })),
  },
}));

import { getCurrentUser } from '@/lib/auth/server';
import { GET, POST } from '@/app/api/daily-tasks/route';

const mockedGetCurrentUser = vi.mocked(getCurrentUser);

const mockUser = { id: 'user-123', email: 'test@example.com' };

describe('GET /api/daily-tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: successful query returning empty array
    mockOrder.mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
  });

  it('returns 401 when not authenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/daily-tasks');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns tasks when authenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(mockUser as any);
    const mockTasks = [
      { id: '1', title: 'Task 1', completed: false, date: '2025-01-01' },
    ];
    mockOrder.mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
    });

    const request = new NextRequest('http://localhost:3000/api/daily-tasks?date=2025-01-01');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
  });

  it('defaults to today when no date param', async () => {
    mockedGetCurrentUser.mockResolvedValue(mockUser as any);
    mockOrder.mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    const request = new NextRequest('http://localhost:3000/api/daily-tasks');
    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it('returns 500 on database error', async () => {
    mockedGetCurrentUser.mockResolvedValue(mockUser as any);
    mockOrder.mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
    });

    const request = new NextRequest('http://localhost:3000/api/daily-tasks');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});

describe('POST /api/daily-tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/daily-tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', date: '2025-01-01' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('creates task with valid data', async () => {
    mockedGetCurrentUser.mockResolvedValue(mockUser as any);
    const mockCreated = { id: '1', title: 'New Task', date: '2025-01-01', completed: false };
    mockSingle.mockResolvedValue({ data: mockCreated, error: null });

    const request = new NextRequest('http://localhost:3000/api/daily-tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'New Task', date: '2025-01-01' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.title).toBe('New Task');
  });

  it('returns 400 for invalid input (missing title)', async () => {
    mockedGetCurrentUser.mockResolvedValue(mockUser as any);
    // Suppress console.error for expected validation errors
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const request = new NextRequest('http://localhost:3000/api/daily-tasks', {
      method: 'POST',
      body: JSON.stringify({ title: '', date: '2025-01-01' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toBe('Validation error');

    consoleSpy.mockRestore();
  });
});
