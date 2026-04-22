'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { computeRoomState, DEFAULT_ROOM_STATE } from '@/lib/room/roomState';
import type { RoomState } from '@/lib/room/roomState';
import { useStreak } from '@/lib/hooks/useStreak';
import {
  DASHBOARD_NEXT_TASKS_QUERY_KEY,
  fetchDashboardNextTasks,
} from '@/lib/dashboard/nextTasksClient';
import type { DashboardNextTasksResponse } from '@/lib/dashboard/queries';

export function useRoomState(nextTasksData?: DashboardNextTasksResponse | undefined): RoomState {
  const { streak } = useStreak();

  const { data: fallbackData } = useQuery<DashboardNextTasksResponse>({
    queryKey: DASHBOARD_NEXT_TASKS_QUERY_KEY,
    queryFn: fetchDashboardNextTasks,
    enabled: !nextTasksData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const data = nextTasksData ?? fallbackData;

  return useMemo(() => {
    if (!data) return DEFAULT_ROOM_STATE;

    const stats = data.stats;
    const momentum = data.trajectoryMorning?.momentum;

    return computeRoomState({
      momentumScore: momentum?.score ?? 40,
      streakDays: streak,
      tasksCompletedToday: stats?.tasksCompleted ?? 0,
      tasksTotalToday: stats?.tasksToday ?? 0,
      passedModulesCount: data.studyProgress?.filter((c) => c.percentage >= 100).length ?? 0,
    });
  }, [data, streak]);
}
