import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/supabase/types';

type AppSupabaseClient = SupabaseClient<Database>;

export type CommitmentStatus = 'pending' | 'done' | 'missed';

export interface Commitment {
  id: string;
  date: string;
  title: string;
  status: CommitmentStatus;
  missedReason: string | null;
  sortOrder: number;
  createdAt: string;
  resolvedAt: string | null;
}

export interface CreateCommitmentInput {
  date: string;
  title: string;
  sortOrder?: number;
}

export type CheckinType = 'morning' | 'evening';

/**
 * Per-station check-in answers, stored as JSONB. Flexible so stations can grow
 * without a migration. Feeds the risk traffic light (Phase B).
 */
export interface CheckinResponses {
  // 🎓 Studium
  studied?: boolean | undefined;
  // 💰 Finanzen & Anti-Gambling
  clean?: boolean | undefined;
  gamblingRisk?: number | undefined; // 1 (kein Drang) – 5 (stark)
  // 💪 Körper
  gym?: boolean | undefined;
  sleep?: number | undefined; // 1–3
  // 🧠 Fokus & Disziplin
  focus?: number | undefined; // 1–3
  // 🌅 Morgens
  morningIntent?: string | undefined;
}

export interface DailyCheckin {
  id: string;
  date: string;
  type: CheckinType;
  energy: number | null;
  journalText: string | null;
  responses: CheckinResponses;
}

export interface UpsertCheckinInput {
  date: string;
  type: CheckinType;
  energy?: number | null;
  journalText?: string | null;
  responses?: CheckinResponses;
}

const COMMITMENT_COLUMNS =
  'id, date, title, status, missed_reason, sort_order, created_at, resolved_at';
const CHECKIN_COLUMNS = 'id, date, type, energy, journal_text, responses';

type CommitmentRow = {
  id: string;
  date: string;
  title: string;
  status: CommitmentStatus;
  missed_reason: string | null;
  sort_order: number;
  created_at: string;
  resolved_at: string | null;
};

type CheckinRow = {
  id: string;
  date: string;
  type: CheckinType;
  energy: number | null;
  journal_text: string | null;
  responses: unknown;
};

function mapCommitment(row: CommitmentRow): Commitment {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    status: row.status,
    missedReason: row.missed_reason ?? null,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at ?? null,
  };
}

function mapCheckin(row: CheckinRow): DailyCheckin {
  return {
    id: row.id,
    date: row.date,
    type: row.type,
    energy: row.energy ?? null,
    journalText: row.journal_text ?? null,
    responses:
      row.responses && typeof row.responses === 'object'
        ? (row.responses as CheckinResponses)
        : {},
  };
}

export async function listCommitments(
  supabase: AppSupabaseClient,
  userId: string,
  date: string
): Promise<Commitment[]> {
  const { data, error } = await supabase
    .from('commitments')
    .select(COMMITMENT_COLUMNS)
    .eq('user_id', userId)
    .eq('date', date)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch commitments: ${error.message}`);
  }

  return (data ?? []).map((row) => mapCommitment(row as CommitmentRow));
}

export async function getCommitmentsInRange(
  supabase: AppSupabaseClient,
  userId: string,
  fromDate: string,
  toDate: string
): Promise<Commitment[]> {
  const { data, error } = await supabase
    .from('commitments')
    .select(COMMITMENT_COLUMNS)
    .eq('user_id', userId)
    .gte('date', fromDate)
    .lte('date', toDate)
    .order('date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch commitment history: ${error.message}`);
  }

  return (data ?? []).map((row) => mapCommitment(row as CommitmentRow));
}

export async function countCommitmentsForDate(
  supabase: AppSupabaseClient,
  userId: string,
  date: string
): Promise<number> {
  const { count, error } = await supabase
    .from('commitments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('date', date);

  if (error) {
    throw new Error(`Failed to count commitments: ${error.message}`);
  }

  return count ?? 0;
}

export async function createCommitment(
  supabase: AppSupabaseClient,
  userId: string,
  input: CreateCommitmentInput
): Promise<Commitment> {
  const { data, error } = await supabase
    .from('commitments')
    .insert({
      user_id: userId,
      date: input.date,
      title: input.title,
      sort_order: input.sortOrder ?? 0,
    })
    .select(COMMITMENT_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(`Failed to create commitment: ${error?.message ?? 'no data'}`);
  }

  return mapCommitment(data as CommitmentRow);
}

export async function setCommitmentStatus(
  supabase: AppSupabaseClient,
  userId: string,
  id: string,
  status: CommitmentStatus,
  missedReason?: string | null
): Promise<Commitment> {
  const patch: Record<string, unknown> = {
    status,
    resolved_at: status === 'pending' ? null : new Date().toISOString(),
    missed_reason: status === 'missed' ? (missedReason ?? null) : null,
  };

  const { data, error } = await supabase
    .from('commitments')
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId)
    .select(COMMITMENT_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(`Failed to update commitment: ${error?.message ?? 'no data'}`);
  }

  return mapCommitment(data as CommitmentRow);
}

export async function deleteCommitment(
  supabase: AppSupabaseClient,
  userId: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('commitments')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete commitment: ${error.message}`);
  }
}

export async function getCheckin(
  supabase: AppSupabaseClient,
  userId: string,
  date: string,
  type: CheckinType
): Promise<DailyCheckin | null> {
  const { data, error } = await supabase
    .from('daily_checkins')
    .select(CHECKIN_COLUMNS)
    .eq('user_id', userId)
    .eq('date', date)
    .eq('type', type)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch check-in: ${error.message}`);
  }

  return data ? mapCheckin(data as CheckinRow) : null;
}

export async function upsertCheckin(
  supabase: AppSupabaseClient,
  userId: string,
  input: UpsertCheckinInput
): Promise<DailyCheckin> {
  const { data, error } = await supabase
    .from('daily_checkins')
    .upsert(
      {
        user_id: userId,
        date: input.date,
        type: input.type,
        energy: input.energy ?? null,
        journal_text: input.journalText ?? null,
        responses: (input.responses ?? {}) as unknown as Json,
      },
      { onConflict: 'user_id,date,type' }
    )
    .select(CHECKIN_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(`Failed to save check-in: ${error?.message ?? 'no data'}`);
  }

  return mapCheckin(data as CheckinRow);
}
