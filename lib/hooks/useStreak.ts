import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppSound } from '@/lib/hooks/useAppSound';
import { dispatchChampionEvent } from '@/lib/champion/championEvents';

interface StreakResponse {
  streak: number;
  lastActivityDate: string | null;
  activeDaysLast30?: number;
}

const STREAK_MILESTONES = [7, 14, 21, 30, 50, 100];

export function useStreak() {
  const { play } = useAppSound();
  const prevStreakRef = useRef<number | null>(null);

  const { data, isLoading } = useQuery<StreakResponse>({
    queryKey: ['user', 'streak'],
    queryFn: async () => {
      const res = await fetch('/api/user/streak');
      if (!res.ok) throw new Error('Failed to fetch streak');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const streak = data?.streak ?? 0;

  useEffect(() => {
    if (isLoading || prevStreakRef.current === null) {
      prevStreakRef.current = streak;
      return;
    }
    if (streak > prevStreakRef.current && STREAK_MILESTONES.includes(streak)) {
      play('streak-milestone');
      dispatchChampionEvent({ type: 'STREAK_MILESTONE', streak });
    }
    prevStreakRef.current = streak;
  }, [streak, isLoading, play]);

  return {
    streak,
    activeDaysLast30: data?.activeDaysLast30 ?? 0,
    isLoading,
  };
}
