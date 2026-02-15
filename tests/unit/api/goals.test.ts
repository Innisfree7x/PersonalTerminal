import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth
vi.mock('@/lib/auth/server', () => ({
  getCurrentUser: vi.fn(),
}));

// Mock goals supabase functions
vi.mock('@/lib/supabase/goals', () => ({
  fetchGoals: vi.fn(),
  createGoal: vi.fn(),
}));

import { getCurrentUser } from '@/lib/auth/server';
import { fetchGoals, createGoal } from '@/lib/supabase/goals';
import { GET, POST } from '@/app/api/goals/route';

const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedFetchGoals = vi.mocked(fetchGoals);
const mockedCreateGoal = vi.mocked(createGoal);

const mockUser = { id: 'user-123', email: 'test@example.com' };

describe('GET /api/goals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/goals');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns goals when authenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(mockUser as any);
    const mockGoals = [
      { id: '1', title: 'Test Goal', category: 'fitness', targetDate: new Date() },
    ];
    mockedFetchGoals.mockResolvedValue({ goals: mockGoals } as any);

    const request = new NextRequest('http://localhost:3000/api/goals');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe('Test Goal');
  });

  it('returns empty array when no goals', async () => {
    mockedGetCurrentUser.mockResolvedValue(mockUser as any);
    mockedFetchGoals.mockResolvedValue({ goals: [] } as any);

    const request = new NextRequest('http://localhost:3000/api/goals');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([]);
  });

  it('returns 500 on server error', async () => {
    mockedGetCurrentUser.mockResolvedValue(mockUser as any);
    mockedFetchGoals.mockRejectedValue(new Error('Database error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const request = new NextRequest('http://localhost:3000/api/goals');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error?.message).toBe('Database error');
    consoleSpy.mockRestore();
  });

  it('passes pagination params', async () => {
    mockedGetCurrentUser.mockResolvedValue(mockUser as any);
    mockedFetchGoals.mockResolvedValue({ goals: [] } as any);

    const request = new NextRequest('http://localhost:3000/api/goals?page=2&limit=10&status=active&category=fitness');
    await GET(request);

    expect(mockedFetchGoals).toHaveBeenCalledWith({
      userId: 'user-123',
      page: 2,
      limit: 10,
      status: 'active',
      category: 'fitness',
    });
  });
});

describe('POST /api/goals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/goals', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', category: 'fitness', targetDate: '2025-12-31' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('creates a goal when authenticated with valid data', async () => {
    mockedGetCurrentUser.mockResolvedValue(mockUser as any);
    const createdGoal = { id: '1', title: 'New Goal', category: 'fitness' };
    mockedCreateGoal.mockResolvedValue(createdGoal as any);

    const request = new NextRequest('http://localhost:3000/api/goals', {
      method: 'POST',
      body: JSON.stringify({
        title: 'New Goal',
        category: 'fitness',
        targetDate: '2025-12-31',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.title).toBe('New Goal');
    expect(mockedCreateGoal).toHaveBeenCalledWith(
      'user-123',
      expect.objectContaining({
        title: 'New Goal',
        category: 'fitness',
      })
    );
  });

  it('returns 400 for invalid input', async () => {
    mockedGetCurrentUser.mockResolvedValue(mockUser as any);
    // Suppress console.error for expected validation errors
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const request = new NextRequest('http://localhost:3000/api/goals', {
      method: 'POST',
      body: JSON.stringify({
        title: 'AB', // too short (min 3)
        category: 'fitness',
        targetDate: '2025-12-31',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error?.message).toBe('Validation error');

    consoleSpy.mockRestore();
  });
});
