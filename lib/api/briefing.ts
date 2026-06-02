/**
 * Client API helpers for the daily briefing loop (commitments + check-ins).
 */
import type {
  Commitment,
  CommitmentStatus,
  DailyCheckin,
  CheckinType,
} from '@/lib/supabase/dailyBriefing';
import type { Fulfillment } from '@/lib/dashboard/briefing';

export interface DayBriefing {
  commitments: Commitment[];
  fulfillment: Fulfillment;
  streak: number;
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data?.error?.message ?? data?.message ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function fetchDayBriefing(date: string): Promise<DayBriefing> {
  const res = await fetch(`/api/briefing/commitments?date=${encodeURIComponent(date)}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function createCommitmentRequest(date: string, title: string): Promise<Commitment> {
  const res = await fetch('/api/briefing/commitments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, title }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function setCommitmentStatusRequest(
  id: string,
  status: CommitmentStatus,
  missedReason?: string | null
): Promise<Commitment> {
  const res = await fetch(`/api/briefing/commitments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, missedReason: missedReason ?? null }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function deleteCommitmentRequest(id: string): Promise<void> {
  const res = await fetch(`/api/briefing/commitments/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function fetchCheckin(date: string, type: CheckinType): Promise<DailyCheckin | null> {
  const res = await fetch(
    `/api/briefing/checkin?date=${encodeURIComponent(date)}&type=${type}`
  );
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.checkin ?? null;
}

export interface UpsertCheckinRequest {
  date: string;
  type: CheckinType;
  energy?: number | null;
  journalText?: string | null;
}

export async function upsertCheckinRequest(input: UpsertCheckinRequest): Promise<DailyCheckin> {
  const res = await fetch('/api/briefing/checkin', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
