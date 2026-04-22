'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { CheckCircle2, GraduationCap, Flame, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import FocusTasks from '@/components/features/dashboard/FocusTasks';
import AchievementUnlockOverlay from '@/components/features/room/AchievementUnlockOverlay';
import TrajectoryCollisionHero from '@/components/features/today/TrajectoryCollisionHero';
import MomentumPulse from '@/components/features/today/MomentumPulse';
import NextMovesStack from '@/components/features/today/NextMovesStack';
import AmbientRoomPanel from '@/components/features/today/AmbientRoomPanel';
import { useRoomState } from '@/lib/hooks/useRoomState';
import { useRoomItems } from '@/lib/hooks/useRoomItems';
import { useLucianOutfit } from '@/lib/hooks/useLucianOutfit';
import { useAchievements } from '@/lib/hooks/useAchievements';
import { useRoomStyle } from '@/lib/hooks/useRoomStyle';
import {
  DASHBOARD_NEXT_TASKS_QUERY_KEY,
  fetchDashboardNextTasks,
} from '@/lib/dashboard/nextTasksClient';
import { checkNewAchievements } from '@/lib/achievements/checker';
import type { AchievementCheckInput } from '@/lib/achievements/registry';
import { getLinesForMood } from '@/lib/lucian/copy';
import { parseOAuthCallbackParams } from '@/lib/hooks/useNotifications';
import type { DashboardNextTasksResponse } from '@/lib/dashboard/queries';
import { dispatchChampionEvent } from '@/lib/champion/championEvents';
import { buildTrajectoryMorningBriefing } from '@/lib/dashboard/trajectoryBriefing';
import { useAppSound } from '@/lib/hooks/useAppSound';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { getTodayKey } from '@/lib/dashboard/nbaDismissals';
import { useStreak } from '@/lib/hooks/useStreak';

const LAST_MOMENTUM_SCORE_KEY = 'innis:last-momentum-score:v1';

const widgetSkeleton = (
  <div className="card-warm h-[160px] animate-pulse p-5">
    <div className="h-4 w-28 rounded bg-white/10" />
    <div className="mt-3 h-3 w-2/3 rounded bg-white/10" />
    <div className="mt-2 h-3 w-1/2 rounded bg-white/10" />
  </div>
);

const LazyStudyProgress = dynamic(
  () => import('@/components/features/dashboard/StudyProgress'),
  { ssr: false, loading: () => widgetSkeleton }
);

export default function TodayPage() {
  const queryClient = useQueryClient();
  const { play } = useAppSound();
  const { streak } = useStreak();
  const { style: roomStyle } = useRoomStyle();
  const { unlockedKeys, unlock } = useAchievements();
  const roomItems = useRoomItems();
  const { outfit } = useLucianOutfit();
  const [pendingAchievementKey, setPendingAchievementKey] = useState<string | null>(null);
  const achievementCheckedRef = useRef(false);

  useEffect(() => {
    const messages = parseOAuthCallbackParams();
    if (messages.error) {
      play('error');
      toast.error(messages.error);
    }
    if (messages.success) {
      toast.success(messages.success);
      window.history.replaceState({}, '', '/today');
    }
  }, [play]);

  const { data: nextTasksData, isFetched: isNextTasksFetched, isLoading, isError, error } = useQuery<DashboardNextTasksResponse>({
    queryKey: DASHBOARD_NEXT_TASKS_QUERY_KEY,
    queryFn: fetchDashboardNextTasks,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const roomState = useRoomState(nextTasksData);
  const momentumScore = nextTasksData?.trajectoryMorning?.momentum?.score ?? 40;
  const morningMood = momentumScore >= 70 ? 'hype' : momentumScore >= 40 ? 'chill' : 'comfort';
  const morningLines = getLinesForMood(morningMood);
  const morningMessage = morningLines[0]?.text ?? 'Bereit für einen produktiven Tag!';

  const stats = nextTasksData?.stats;
  const studyProgress = nextTasksData?.studyProgress || [];
  const trajectorySnapshot = nextTasksData?.trajectoryMorning;
  const trajectoryBriefing = buildTrajectoryMorningBriefing(trajectorySnapshot?.overview);
  const momentum = trajectorySnapshot?.momentum ?? null;
  const kitSignals = nextTasksData?.kitSignals ?? null;

  const tasksTodayCount = stats?.tasksToday ?? 0;
  const tasksCompletedCount = stats?.tasksCompleted ?? 0;

  useEffect(() => {
    const days = stats?.nextExam?.daysUntilExam;
    if (typeof days === 'number' && days <= 1) {
      dispatchChampionEvent({ type: 'DEADLINE_WARNING', hoursLeft: Math.max(1, days * 24) });
    }
  }, [stats?.nextExam?.daysUntilExam]);

  useEffect(() => {
    if (!isNextTasksFetched || !trajectorySnapshot) return;
    if (typeof window === 'undefined') return;
    const today = getTodayKey();
    const alreadySent = window.localStorage.getItem(STORAGE_KEYS.todayMorningCheckinDate) === today;
    if (alreadySent) return;

    dispatchChampionEvent({
      type: 'MORNING_CHECKIN',
      ...(trajectoryBriefing?.status ? { status: trajectoryBriefing.status } : {}),
      ...(typeof trajectoryBriefing?.daysUntil === 'number' ? { daysUntil: trajectoryBriefing.daysUntil } : {}),
      ...(trajectoryBriefing?.title ? { title: trajectoryBriefing.title } : {}),
    });
    window.localStorage.setItem(STORAGE_KEYS.todayMorningCheckinDate, today);
  }, [isNextTasksFetched, trajectoryBriefing, trajectorySnapshot]);

  useEffect(() => {
    if (!momentum || momentum.trend !== 'up') return;
    if (typeof window === 'undefined') return;

    const previousRaw = window.localStorage.getItem(LAST_MOMENTUM_SCORE_KEY);
    const previousScore = previousRaw ? Number(previousRaw) : null;
    if (previousScore === null || Number.isNaN(previousScore)) {
      window.localStorage.setItem(LAST_MOMENTUM_SCORE_KEY, String(momentum.score));
      return;
    }

    const increasedBy = momentum.score - previousScore;
    if (increasedBy >= 2) {
      play('momentum-up');
    }
    window.localStorage.setItem(LAST_MOMENTUM_SCORE_KEY, String(momentum.score));
  }, [momentum, play]);

  useEffect(() => {
    if (achievementCheckedRef.current || !isNextTasksFetched || !nextTasksData) return;
    achievementCheckedRef.current = true;

    const momentum = nextTasksData.trajectoryMorning?.momentum;
    const input: AchievementCheckInput = {
      streakDays: streak,
      tasksCompletedAllTime: nextTasksData.stats?.tasksCompleted ?? 0,
      passedModulesCount: nextTasksData.studyProgress?.filter((c) => c.percentage >= 100).length ?? 0,
      trajectoryScore: momentum?.score ?? 0,
      focusMinutesAllTime: 0,
    };

    const newAchievements = checkNewAchievements(input, unlockedKeys);
    if (newAchievements.length > 0) {
      for (const a of newAchievements) {
        unlock(a.key);
      }
      setPendingAchievementKey(newAchievements[0]?.key ?? null);
    }
  }, [isNextTasksFetched, nextTasksData, streak, unlockedKeys, unlock]);

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-5" data-testid="today-page-loading">
        <div className="card-warm-accent rounded-2xl p-6 animate-pulse">
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="mt-3 h-6 w-64 rounded bg-white/10" />
          <div className="mt-4 h-16 rounded-lg bg-white/[0.06]" />
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[200px,1fr]">
          <div className="card-warm h-[220px] animate-pulse rounded-2xl" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-warm h-[140px] animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="card-warm p-6 animate-pulse rounded-2xl">
            <div className="h-5 w-20 rounded bg-white/10" />
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-white/[0.06]" />
              ))}
            </div>
          </div>
          {widgetSkeleton}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4 md:space-y-5" data-testid="today-page-error">
        <div className="card-warm rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-error shrink-0" />
            <div>
              <p className="text-sm font-medium text-text-primary">Dashboard konnte nicht geladen werden</p>
              <p className="text-xs text-text-tertiary mt-0.5">
                {error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.'}
              </p>
            </div>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: DASHBOARD_NEXT_TASKS_QUERY_KEY })}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Erneut versuchen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="today-page-root">
      <ErrorBoundary fallbackTitle="Trajectory Hero Error">
        <TrajectoryCollisionHero snapshot={trajectorySnapshot ?? null} />
      </ErrorBoundary>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px,1fr]">
        <div className="flex justify-center lg:justify-start">
          <MomentumPulse
            score={momentum?.score ?? 40}
            trend={momentum?.trend ?? 'flat'}
          />
        </div>
        <NextMovesStack
          nextKitEvent={
            kitSignals?.nextCampusEvent
              ? {
                  title: kitSignals.nextCampusEvent.title,
                  startsAt: kitSignals.nextCampusEvent.startsAt,
                  location: kitSignals.nextCampusEvent.location,
                }
              : null
          }
          nextDeadline={
            stats?.nextExam?.examDate
              ? {
                  courseName: stats.nextExam.name,
                  examDate: stats.nextExam.examDate,
                  courseCode: null,
                }
              : null
          }
          nextTask={nextTasksData?.nextBestAction ?? null}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ErrorBoundary fallbackTitle="Focus Tasks Error">
          <FocusTasks
            nextTasksData={{
              homeworks: nextTasksData?.homeworks ?? [],
              goals: nextTasksData?.goals ?? [],
              interviews: nextTasksData?.interviews ?? [],
            }}
          />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Study Progress Error">
          <LazyStudyProgress courses={studyProgress} />
        </ErrorBoundary>
      </div>

      <ErrorBoundary fallbackTitle="Room Error">
        <AmbientRoomPanel
          roomState={roomState}
          roomStyle={roomStyle}
          roomItems={roomItems}
          outfit={outfit}
          morningMessage={morningMessage}
        />
      </ErrorBoundary>

      <div className="card-warm relative overflow-hidden rounded-xl">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4 py-2.5">
          <StatItem
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-red-300/70" />}
            label="Tasks"
            value={`${tasksCompletedCount}/${tasksTodayCount}`}
          />
          <StatItem
            icon={<GraduationCap className="h-3.5 w-3.5 text-amber-300/70" />}
            label="Exercises"
            value={`${stats?.exercisesThisWeek ?? 0}/${stats?.exercisesTotal ?? 0}`}
          />
          <StatItem
            icon={<Flame className="h-3.5 w-3.5 text-orange-300/70" />}
            label="Streak"
            value={`${streak}d`}
          />
        </div>
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background:
              'linear-gradient(to right, rgba(248,113,113,0.45) 0%, rgba(251,191,36,0.45) 33%, rgba(251,146,60,0.45) 66%, rgba(56,189,248,0.42) 100%)',
          }}
        />
      </div>

      <AchievementUnlockOverlay
        achievementKey={pendingAchievementKey}
        onDismiss={() => setPendingAchievementKey(null)}
      />
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
  delta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-[11px] text-text-secondary">{label}</span>
      <span className="text-[13px] font-semibold tabular-nums text-text-primary">{value}</span>
      {typeof delta === 'number' && delta !== 0 && (
        <span
          className={`text-[11px] font-medium tabular-nums ${
            delta > 0 ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {delta > 0 ? `▲${delta}` : `▼${Math.abs(delta)}`}
        </span>
      )}
    </div>
  );
}
