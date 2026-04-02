'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import Link from 'next/link';
import { Sparkles, CheckCircle2, GraduationCap, Flame } from 'lucide-react';
import toast from 'react-hot-toast';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import FocusTasks from '@/components/features/dashboard/FocusTasks';
import NBAHeroZone from '@/components/features/dashboard/NBAHeroZone';
import { parseOAuthCallbackParams } from '@/lib/hooks/useNotifications';
import type { DashboardNextTasksResponse } from '@/lib/dashboard/queries';
import { dispatchChampionEvent } from '@/lib/champion/championEvents';
import { buildTrajectoryMorningBriefing } from '@/lib/dashboard/trajectoryBriefing';
import { useAppSound } from '@/lib/hooks/useAppSound';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { getTodayKey } from '@/lib/dashboard/nbaDismissals';
import { getRiskStatusTone } from '@/lib/design-system/statusTone';
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

  // Check URL params for OAuth callback messages
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

  // Fetch next-tasks data (powers stats, study progress, NBA)
  const { data: nextTasksData, isFetched: isNextTasksFetched, isLoading, isError, error } = useQuery<DashboardNextTasksResponse>({
    queryKey: ['dashboard', 'next-tasks', 'today-bundle'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/next-tasks?include=trajectory_morning,week_events');
      if (!response.ok) throw new Error('Failed to fetch next tasks');
      return response.json();
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const stats = nextTasksData?.stats;
  const studyProgress = nextTasksData?.studyProgress || [];
  const trajectorySnapshot = nextTasksData?.trajectoryMorning;
  const trajectoryBriefing = buildTrajectoryMorningBriefing(trajectorySnapshot?.overview);
  const momentum = trajectorySnapshot?.momentum ?? null;
  const trajectoryTone = trajectoryBriefing ? getRiskStatusTone(trajectoryBriefing.status) : null;
  const kitSignals = nextTasksData?.kitSignals ?? null;
  const weeklyKitEventsCount = kitSignals?.upcomingEventsCount ?? 0;
  const showWeeklyKitLoadChip = weeklyKitEventsCount > 0 && (!kitSignals?.nextCampusEvent || weeklyKitEventsCount > 1);
  const weeklyKitLoadLabel =
    weeklyKitEventsCount <= 1
      ? '1 KIT-Termin diese Woche'
      : kitSignals?.nextCampusEvent
        ? `+${weeklyKitEventsCount - 1} weitere KIT-Termine diese Woche`
        : `${weeklyKitEventsCount} KIT-Termine diese Woche`;

  const tasksTodayCount = stats?.tasksToday ?? 0;
  const tasksCompletedCount = stats?.tasksCompleted ?? 0;

  // Champion events
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

  // Momentum sound
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

  const handleChanged = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'next-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['courses'] });
  };

  const trajectoryBriefingHref = trajectoryBriefing
    ? `/trajectory?goalId=${encodeURIComponent(trajectoryBriefing.goalId)}&source=morning_briefing`
    : '/trajectory?source=morning_briefing';

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-5" data-testid="today-page-root">
        <div className="card-warm-accent rounded-xl px-4 py-3 animate-pulse">
          <div className="h-4 w-48 rounded bg-white/10" />
          <div className="mt-2 h-3 w-80 rounded bg-white/10" />
        </div>
        <div className="card-warm-accent rounded-xl p-6 animate-pulse">
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="mt-3 h-6 w-64 rounded bg-white/10" />
          <div className="mt-4 flex gap-2">
            <div className="h-9 w-32 rounded-lg bg-white/10" />
            <div className="h-9 w-20 rounded-lg bg-white/10" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          <div className="card-warm p-6 animate-pulse">
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
      <div className="space-y-4 md:space-y-5" data-testid="today-page-root">
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
              onClick={() => queryClient.invalidateQueries({ queryKey: ['dashboard', 'next-tasks', 'today-bundle'] })}
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
    <div className="space-y-4 md:space-y-5" data-testid="today-page-root">
      {/* ── 1. Morning Briefing — single compact line ── */}
      <ErrorBoundary fallbackTitle="Morning Briefing Error">
        <div className="card-warm-accent relative overflow-hidden rounded-xl px-4 py-2.5">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-r-full bg-primary/70 shadow-[0_0_10px_rgb(var(--primary)/0.3)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-primary/30 bg-primary/[0.14] text-primary">
                  <Sparkles className="h-3 w-3" />
                </span>
                <p className="truncate text-[13px] text-text-secondary">
                  {trajectoryBriefing ? (
                    <>
                      <span className="font-semibold text-text-primary">{trajectoryBriefing.title}</span>
                      <span className="mx-1.5 text-border">·</span>
                      <span className={trajectoryTone ? trajectoryTone.text : ''}>
                        {trajectoryBriefing.statusLabel}
                      </span>
                      <span className="mx-1.5 text-border">·</span>
                      <span className="tabular-nums">{trajectoryBriefing.daysUntil}d bis Deadline</span>
                    </>
                  ) : (
                    <span>Kein aktives Trajectory-Ziel.</span>
                  )}
                </p>
              </div>
              <Link
                href={trajectoryBriefingHref}
                className="shrink-0 rounded-full border border-primary/20 bg-primary/[0.06] px-2.5 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/[0.12]"
              >
                {trajectoryBriefing ? 'Trajectory →' : 'Einrichten →'}
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {momentum ? (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/[0.08] px-2.5 py-1 text-[11px] font-medium text-text-primary">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Momentum
                    <span className="tabular-nums text-primary">{momentum.score}</span>
                  </span>
                  {typeof momentum.delta === 'number' && momentum.delta !== 0 ? (
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium tabular-nums ${
                        momentum.delta > 0
                          ? 'border-emerald-500/30 bg-emerald-500/12 text-emerald-300'
                          : 'border-red-500/30 bg-red-500/12 text-red-300'
                      }`}
                    >
                      {momentum.delta > 0 ? '▲' : '▼'}
                      {Math.abs(momentum.delta)} vs letzte Woche
                    </span>
                  ) : null}
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-text-secondary">
                    Fokus-Load {momentum.stats.last7DaysHours.toFixed(1)}h / {momentum.stats.plannedHoursPerWeek}h
                  </span>
                </>
              ) : null}
              {trajectoryBriefing?.startDateLabel ? (
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-text-secondary">
                  Prep startet {trajectoryBriefing.startDateLabel}
                </span>
              ) : null}
              {tasksTodayCount > 0 ? (
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-text-secondary">
                  {tasksCompletedCount}/{tasksTodayCount} Tasks heute
                </span>
              ) : null}
              {kitSignals?.nextCampusEvent ? (
                <Link
                  href="/calendar?source=today_kit"
                  className="inline-flex items-center rounded-full border border-sky-500/25 bg-sky-500/[0.08] px-2.5 py-1 text-[11px] font-medium text-sky-100 transition-colors hover:bg-sky-500/[0.14]"
                >
                  KIT {format(new Date(kitSignals.nextCampusEvent.startsAt), 'dd.MM. HH:mm')}
                  <span className="mx-1.5 text-sky-200/40">·</span>
                  {kitSignals.nextCampusEvent.title}
                  {kitSignals.nextCampusEvent.location ? (
                    <>
                      <span className="mx-1.5 text-sky-200/40">·</span>
                      {kitSignals.nextCampusEvent.location}
                    </>
                  ) : null}
                </Link>
              ) : null}
              {showWeeklyKitLoadChip ? (
                <Link
                  href="/calendar?source=today_kit_week"
                  className="inline-flex items-center rounded-full border border-sky-500/20 bg-sky-500/[0.05] px-2.5 py-1 text-[11px] font-medium text-sky-100/90 transition-colors hover:bg-sky-500/[0.11]"
                >
                  {weeklyKitLoadLabel}
                </Link>
              ) : null}
              {kitSignals?.nextCampusExam ? (
                <Link
                  href="/university?source=today_kit_exam"
                  className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/[0.09] px-2.5 py-1 text-[11px] font-medium text-amber-100 transition-colors hover:bg-amber-500/[0.15]"
                >
                  Prüfung {format(new Date(kitSignals.nextCampusExam.startsAt), 'dd.MM. HH:mm')}
                  <span className="mx-1.5 text-amber-200/40">·</span>
                  {kitSignals.nextCampusExam.title}
                </Link>
              ) : null}
              {kitSignals?.freshIliasItems ? (
                <Link
                  href="/university?source=today_ilias"
                  className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] px-2.5 py-1 text-[11px] font-medium text-emerald-100 transition-colors hover:bg-emerald-500/[0.14]"
                >
                  {kitSignals.freshIliasItems} neue ILIAS-Signale
                  {kitSignals.latestIliasItem ? (
                    <>
                      <span className="mx-1.5 text-emerald-200/40">·</span>
                      {kitSignals.latestIliasItem.favoriteTitle}
                    </>
                  ) : null}
                </Link>
              ) : kitSignals?.latestIliasItem ? (
                <Link
                  href="/university?source=today_ilias"
                  className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] px-2.5 py-1 text-[11px] font-medium text-emerald-100 transition-colors hover:bg-emerald-500/[0.14]"
                >
                  {kitSignals.latestIliasItem.favoriteTitle}
                  <span className="mx-1.5 text-emerald-200/40">·</span>
                  {kitSignals.latestIliasItem.title}
                </Link>
              ) : null}
              {kitSignals?.latestCampusGrade ? (
                <Link
                  href="/university?source=today_grade"
                  className="inline-flex items-center rounded-full border border-violet-500/25 bg-violet-500/[0.1] px-2.5 py-1 text-[11px] font-medium text-violet-100 transition-colors hover:bg-violet-500/[0.16]"
                >
                  Neue Note {kitSignals.latestCampusGrade.gradeLabel}
                  <span className="mx-1.5 text-violet-200/40">·</span>
                  {kitSignals.latestCampusGrade.moduleTitle}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </ErrorBoundary>

      {/* ── 2. NBA Hero Zone — next best action + focus start ── */}
      <ErrorBoundary fallbackTitle="NBA Error">
        <NBAHeroZone
          nextBestAction={nextTasksData?.nextBestAction ?? null}
          alternatives={nextTasksData?.nextBestAlternatives ?? []}
          riskSignals={nextTasksData?.riskSignals ?? []}
          onChanged={handleChanged}
          isLoading={isLoading}
        />
      </ErrorBoundary>

      {/* ── 3. Two-column grid: Tasks + Semester ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        {/* LEFT: Tasks */}
        <div>
          <ErrorBoundary fallbackTitle="Tasks Error">
            <FocusTasks
              nextTasksData={{
                homeworks: nextTasksData?.homeworks ?? [],
                goals: nextTasksData?.goals ?? [],
                interviews: nextTasksData?.interviews ?? [],
              }}
            />
          </ErrorBoundary>
        </div>

        {/* RIGHT: Semester Overview */}
        <div>
          <ErrorBoundary fallbackTitle="Study Progress Error">
            <LazyStudyProgress courses={studyProgress} />
          </ErrorBoundary>
        </div>
      </div>

      {/* ── 4. Bottom Stats Line ── */}
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

        {/* 4-color identity gradient */}
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background:
              'linear-gradient(to right, rgba(248,113,113,0.45) 0%, rgba(251,191,36,0.45) 33%, rgba(251,146,60,0.45) 66%, rgba(56,189,248,0.42) 100%)',
          }}
        />
      </div>
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
