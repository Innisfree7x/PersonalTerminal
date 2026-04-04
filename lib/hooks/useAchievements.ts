'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface AchievementRecord {
  key: string;
  unlocked_at: string;
}

interface AchievementsResponse {
  achievements: AchievementRecord[];
}

function normalizeAchievementsResponse(value: unknown): AchievementsResponse {
  if (!value || typeof value !== 'object') {
    return { achievements: [] };
  }

  const achievements = Array.isArray((value as { achievements?: unknown }).achievements)
    ? (value as { achievements: AchievementRecord[] }).achievements.filter(
        (achievement): achievement is AchievementRecord =>
          !!achievement &&
          typeof achievement === 'object' &&
          typeof achievement.key === 'string' &&
          typeof achievement.unlocked_at === 'string'
      )
    : [];

  return { achievements };
}

export function useAchievements() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<AchievementsResponse>({
    queryKey: ['achievements'],
    queryFn: async () => {
      const res = await fetch('/api/achievements');
      if (!res.ok) throw new Error('Failed to fetch achievements');
      return normalizeAchievementsResponse(await res.json());
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const unlockMutation = useMutation({
    mutationFn: async (key: string) => {
      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) throw new Error('Failed to unlock achievement');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
  });

  const unlockedKeys = data?.achievements.map((a) => a.key) ?? [];

  return {
    unlockedKeys,
    unlock: (key: string) => unlockMutation.mutate(key),
    isLoading,
  };
}
