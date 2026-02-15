import type { FocusSession } from '@/lib/schemas/focusSession.schema';

const API_BASE = '/api/focus-sessions';

interface FocusSessionApiResponse {
  id: string;
  sessionType: 'focus' | 'break';
  durationSeconds: number;
  plannedDurationSeconds: number;
  startedAt: string;
  endedAt: string;
  completed: boolean;
  label: string | null;
  category: string | null;
  createdAt: string;
}

function mapSession(data: FocusSessionApiResponse): FocusSession {
  return {
    ...data,
    category: data.category as FocusSession['category'],
    startedAt: new Date(data.startedAt),
    endedAt: new Date(data.endedAt),
    createdAt: new Date(data.createdAt),
  };
}

export async function fetchFocusSessions(params?: {
  from?: string;
  to?: string;
  category?: string;
  limit?: number;
}): Promise<FocusSession[]> {
  const url = new URL(API_BASE, window.location.origin);
  if (params?.from) url.searchParams.set('from', params.from);
  if (params?.to) url.searchParams.set('to', params.to);
  if (params?.category) url.searchParams.set('category', params.category);
  if (params?.limit) url.searchParams.set('limit', String(params.limit));

  const response = await fetch(url.toString(), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to fetch focus sessions');
  }

  const data: FocusSessionApiResponse[] = await response.json();
  return data.map(mapSession);
}

export interface CreateFocusSessionPayload {
  sessionType: 'focus' | 'break';
  durationSeconds: number;
  plannedDurationSeconds: number;
  startedAt: string;
  endedAt: string;
  completed: boolean;
  label?: string | null;
  category?: string | null;
}

export async function createFocusSession(
  payload: CreateFocusSessionPayload
): Promise<FocusSession> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to save focus session');
  }

  const data: FocusSessionApiResponse = await response.json();
  return mapSession(data);
}

export interface TodayFocusSummary {
  todayMinutes: number;
  todaySessions: number;
  todayCompletedSessions: number;
  currentStreak: number;
}

export async function fetchTodayFocusSummary(): Promise<TodayFocusSummary> {
  const response = await fetch(`${API_BASE}/today`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to fetch today focus summary');
  }
  return response.json();
}

export interface FocusAnalytics {
  totalMinutes: number;
  totalSessions: number;
  completedSessions: number;
  averageSessionMinutes: number;
  longestSessionMinutes: number;
  currentStreak: number;
  longestStreak: number;
  dailyData: Array<{
    date: string;
    totalMinutes: number;
    sessions: number;
    completedSessions: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    totalMinutes: number;
    sessions: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    totalMinutes: number;
    sessions: number;
  }>;
  weekdayDistribution: Array<{
    day: number;
    totalMinutes: number;
    sessions: number;
  }>;
}

export async function fetchFocusAnalytics(days: number = 30): Promise<FocusAnalytics> {
  const response = await fetch(`${API_BASE}/analytics?days=${days}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to fetch focus analytics');
  }
  return response.json();
}
