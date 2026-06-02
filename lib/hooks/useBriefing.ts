'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDayBriefing,
  createCommitmentRequest,
  setCommitmentStatusRequest,
  deleteCommitmentRequest,
  fetchCheckin,
  upsertCheckinRequest,
  type DayBriefing,
  type UpsertCheckinRequest,
} from '@/lib/api/briefing';
import type {
  Commitment,
  CommitmentStatus,
  DailyCheckin,
  CheckinType,
} from '@/lib/supabase/dailyBriefing';

export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const briefingKey = (date: string) => ['briefing', 'day', date] as const;
const checkinKey = (date: string, type: CheckinType) =>
  ['briefing', 'checkin', date, type] as const;

export function useDayBriefing(date: string) {
  return useQuery<DayBriefing>({
    queryKey: briefingKey(date),
    queryFn: () => fetchDayBriefing(date),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCheckin(date: string, type: CheckinType) {
  return useQuery<DailyCheckin | null>({
    queryKey: checkinKey(date, type),
    queryFn: () => fetchCheckin(date, type),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateCommitment(date: string) {
  const qc = useQueryClient();
  return useMutation<Commitment, Error, string>({
    mutationFn: (title: string) => createCommitmentRequest(date, title),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: briefingKey(date) });
    },
  });
}

export function useSetCommitmentStatus(date: string) {
  const qc = useQueryClient();
  return useMutation<
    Commitment,
    Error,
    { id: string; status: CommitmentStatus; missedReason?: string | null }
  >({
    mutationFn: ({ id, status, missedReason }) =>
      setCommitmentStatusRequest(id, status, missedReason ?? null),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: briefingKey(date) });
    },
  });
}

export function useDeleteCommitment(date: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteCommitmentRequest(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: briefingKey(date) });
    },
  });
}

export function useUpsertCheckin() {
  const qc = useQueryClient();
  return useMutation<DailyCheckin, Error, UpsertCheckinRequest>({
    mutationFn: (input) => upsertCheckinRequest(input),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: checkinKey(data.date, data.type) });
    },
  });
}
