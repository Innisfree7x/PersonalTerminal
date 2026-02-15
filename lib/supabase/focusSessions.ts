import { createClient } from '@/lib/auth/server';
import type { FocusSession, CreateFocusSessionInput } from '../schemas/focusSession.schema';
import type { SupabaseFocusSession, Database } from './types';

type FocusSessionInsert = Database['public']['Tables']['focus_sessions']['Insert'];

export function supabaseFocusSessionToFocusSession(row: SupabaseFocusSession): FocusSession {
  return {
    id: row.id,
    sessionType: row.session_type,
    durationSeconds: row.duration_seconds,
    plannedDurationSeconds: row.planned_duration_seconds,
    startedAt: new Date(row.started_at),
    endedAt: new Date(row.ended_at),
    completed: row.completed,
    label: row.label,
    category: row.category,
    createdAt: new Date(row.created_at),
  };
}

export function focusSessionToSupabaseInsert(
  session: CreateFocusSessionInput
): Omit<FocusSessionInsert, 'user_id'> {
  return {
    session_type: session.sessionType,
    duration_seconds: session.durationSeconds,
    planned_duration_seconds: session.plannedDurationSeconds,
    started_at: session.startedAt.toISOString(),
    ended_at: session.endedAt.toISOString(),
    completed: session.completed,
    label: session.label ?? null,
    category: session.category ?? null,
  };
}

export async function createFocusSession(userId: string, session: CreateFocusSessionInput): Promise<FocusSession> {
  const supabase = createClient();
  const insertData = focusSessionToSupabaseInsert(session);

  const { data, error } = await supabase
    .from('focus_sessions')
    .insert({ ...insertData, user_id: userId })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create focus session: ${error.message}`);
  }

  return supabaseFocusSessionToFocusSession(data);
}

export async function fetchFocusSessions(options?: {
  userId: string;
  from?: string;
  to?: string;
  category?: string;
  limit?: number;
}): Promise<FocusSession[]> {
  const { userId, from, to, category, limit } = options || {};
  if (!userId) throw new Error('Missing user id');
  const supabase = createClient();
  let query = supabase.from('focus_sessions').select('*').eq('user_id', userId);

  if (from) query = query.gte('started_at', from);
  if (to) query = query.lte('started_at', to);
  if (category) query = query.eq('category', category as 'study' | 'work' | 'exercise' | 'reading' | 'other');
  if (limit) query = query.limit(limit);

  query = query.order('started_at', { ascending: false });

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch focus sessions: ${error.message}`);
  }

  return (data || []).map(supabaseFocusSessionToFocusSession);
}

export async function fetchTodayFocusSummary(userId: string): Promise<{
  todayMinutes: number;
  todaySessions: number;
  todayCompletedSessions: number;
}> {
  const supabase = createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('session_type', 'focus')
    .gte('started_at', todayStart.toISOString());

  if (error) {
    throw new Error(`Failed to fetch today's focus summary: ${error.message}`);
  }

  const sessions = data || [];
  const totalSeconds = sessions.reduce((sum, s) => sum + s.duration_seconds, 0);

  return {
    todayMinutes: Math.round(totalSeconds / 60),
    todaySessions: sessions.length,
    todayCompletedSessions: sessions.filter((s) => s.completed).length,
  };
}

export async function fetchFocusAnalytics(userId: string, days: number = 30) {
  const supabase = createClient();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('session_type', 'focus')
    .gte('started_at', fromDate.toISOString())
    .order('started_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch focus analytics: ${error.message}`);
  }

  return data || [];
}
