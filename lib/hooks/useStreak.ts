import { useQuery } from '@tanstack/react-query';

interface StreakResponse {
  streak: number;
  lastActivityDate: string | null;
  activeDaysLast30?: number;
}

export function useStreak() {
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

  return {
    streak: data?.streak ?? 0,
    activeDaysLast30: data?.activeDaysLast30 ?? 0,
    isLoading,
  };
}
