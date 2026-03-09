'use client';

import type { CalendarEvent } from '@/lib/types/calendar';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, Sparkles, TrendingUp, TrendingDown, Minus, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import FocusTasks from '@/components/features/dashboard/FocusTasks';
import CommandBar from '@/components/features/dashboard/CommandBar';
import ScheduleColumn from '@/components/features/dashboard/ScheduleColumn';
import QuickActionsWidget from '@/components/features/dashboard/QuickActionsWidget';
import StudyProgress from '@/components/features/dashboard/StudyProgress';
import UpcomingDeadlines from '@/components/features/dashboard/UpcomingDeadlines';
import WeekOverview from '@/components/features/dashboard/WeekOverview';
import PomodoroTimer from '@/components/features/dashboard/PomodoroTimer';
import {
  connectGoogleCalendar,
} from '@/lib/api/calendar';
import { parseOAuthCallbackParams } from '@/lib/hooks/useNotifications';
import {
  checkGoogleCalendarConnectionAction,
  disconnectGoogleCalendarAction,
  fetchTodayCalendarEventsAction,
} from '@/app/actions/calendar';
import type { DashboardNextTasksResponse } from '@/lib/dashboard/queries';
import { dispatchChampionEvent } from '@/lib/champion/championEvents';
import { buildTrajectoryMorningBriefing } from '@/lib/dashboard/trajectoryBriefing';
import { trackAppEvent } from '@/lib/analytics/client';
import { useAppSound } from '@/lib/hooks/useAppSound';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { getTodayKey } from '@/lib/dashboard/nbaDismissals';
import { getRiskStatusTone } from '@/lib/design-system/statusTone';

const WELCOME_KEY = 'innis_welcomed_v1';
const LAST_MOMENTUM_SCORE_KEY = 'innis:last-momentum-score:v1';

function hasWelcomedUser(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage?.getItem?.(WELCOME_KEY) === '1';
  } catch {
    return true;
  }
}

function markUserWelcomed(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem?.(WELCOME_KEY, '1');
  } catch {
    // Ignore storage access errors in restricted environments/tests.
  }
}

function getIsoWeekKey(date: Date): string {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export default function TodayPage() {
  const queryClient = useQueryClient();
  const { play } = useAppSound();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showWeeklyCheckin, setShowWeeklyCheckin] = useState(false);

  useEffect(() => {
    if (!hasWelcomedUser()) {
      setShowWelcome(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const thisWeek = getIsoWeekKey(new Date());
      const seenWeek =
        typeof window.localStorage?.getItem === 'function'
          ? window.localStorage.getItem(STORAGE_KEYS.weeklyCheckinWeekKey)
          : null;
      setShowWeeklyCheckin(seenWeek !== thisWeek);
    } catch {
      setShowWeeklyCheckin(true);
    }
  }, []);

  const dismissWelcome = () => {
    markUserWelcomed();
    setShowWelcome(false);
  };

  const dismissWeeklyCheckin = () => {
    if (typeof window === 'undefined') return;
    try {
      if (typeof window.localStorage?.setItem === 'function') {
        window.localStorage.setItem(STORAGE_KEYS.weeklyCheckinWeekKey, getIsoWeekKey(new Date()));
      }
    } catch {
      // Ignore storage errors in restricted environments/tests.
    }
    setShowWeeklyCheckin(false);
  };

  // Check URL params for OAuth callback messages
  useEffect(() => {
    const messages = parseOAuthCallbackParams();

    if (messages.error) {
      toast.error(messages.error);
    }

    if (messages.success) {
      toast.success(messages.success);
      window.history.replaceState({}, '', '/today');
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['calendar', 'today'] });
        checkGoogleCalendarConnectionAction().then(setIsConnected);
      }, 1000);
    }
  }, [queryClient]);

  // Check connection status on mount
  useEffect(() => {
    checkGoogleCalendarConnectionAction().then(setIsConnected);
  }, []);

  // Fetch events if connected
  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar', 'today'],
    queryFn: async () => {
      const events = await fetchTodayCalendarEventsAction();
      return events.map((event) => ({
        ...event,
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
      }));
    },
    enabled: isConnected === true,
    retry: false,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Fetch next-tasks data (powers stats, study progress, deadlines)
  const { data: nextTasksData, isFetched: isNextTasksFetched } = useQuery<DashboardNextTasksResponse>({
    queryKey: ['dashboard', 'next-tasks', 'today-bundle'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/next-tasks?include=trajectory_morning,week_events');
      if (!response.ok) throw new Error('Failed to fetch next tasks');
      return response.json();
    },
    staleTime: 15 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: disconnectGoogleCalendarAction,
    onSuccess: () => {
      setIsConnected(false);
      queryClient.setQueryData(['calendar', 'today'], []);
      toast.success('Successfully disconnected from Google Calendar.');
    },
    onError: () => {
      toast.error('Verbindung konnte nicht getrennt werden. Bitte erneut versuchen.');
    },
  });

  const handleConnect = useCallback(() => connectGoogleCalendar(), []);
  const handleDisconnect = useCallback(() => {
    if (confirm('Google Calendar wirklich trennen?')) {
      disconnectMutation.mutate();
    }
  }, [disconnectMutation]);
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['calendar', 'today'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'next-tasks'] });
    toast.success('Refreshed!');
  }, [queryClient]);

  const stats = nextTasksData?.stats;
  const studyProgress = nextTasksData?.studyProgress || [];
  const trajectorySnapshot = nextTasksData?.trajectoryMorning;
  const prefetchedWeekEvents = useMemo(
    () =>
      nextTasksData?.weekEvents?.events.map((event) => ({
        ...event,
        date: new Date(event.date),
      })),
    [nextTasksData?.weekEvents?.events]
  );
  const trajectoryBriefing = buildTrajectoryMorningBriefing(trajectorySnapshot?.overview);
  const momentum = trajectorySnapshot?.momentum ?? null;
  const trajectoryBriefingHref = trajectoryBriefing
    ? `/trajectory?goalId=${encodeURIComponent(trajectoryBriefing.goalId)}&source=morning_briefing`
    : '/trajectory?source=morning_briefing';
  const tasksTodayCount = stats?.tasksToday ?? 0;
  const tasksCompletedCount = stats?.tasksCompleted ?? 0;
  const allDoneToday = tasksTodayCount > 0 && tasksCompletedCount >= tasksTodayCount;
  const taskCompletionPct =
    tasksTodayCount > 0
      ? Math.min(100, Math.round((tasksCompletedCount / tasksTodayCount) * 100))
      : 0;
  const trajectoryTone = trajectoryBriefing ? getRiskStatusTone(trajectoryBriefing.status) : null;

  useEffect(() => {
    const days = stats?.nextExam?.daysUntilExam;
    if (typeof days === 'number' && days <= 1) {
      dispatchChampionEvent({ type: 'DEADLINE_WARNING', hoursLeft: Math.max(1, days * 24) });
    }
  }, [stats?.nextExam?.daysUntilExam]);

  useEffect(() => {
    if (!isNextTasksFetched) return;
    if (!trajectorySnapshot) return;
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

  return (
    <div className="space-y-4 md:space-y-5" data-testid="today-page-root">
      {/* First-visit welcome orientation */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            key="welcome-banner"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="relative flex items-start gap-3 p-4 rounded-xl bg-primary/[0.08] border border-primary/20 overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ boxShadow: '0 0 14px rgba(var(--color-primary-rgb, 99 102 241) / 0.25)' }}>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary mb-0.5">
                Willkommen in deinem Dashboard
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Links navigierst du zwischen <span className="font-medium text-text-primary">Heute</span>,{' '}
                <span className="font-medium text-text-primary">Uni</span>,{' '}
                <span className="font-medium text-text-primary">Ziele</span> und{' '}
                <span className="font-medium text-text-primary">Karriere</span>.
                Der Fokus-Timer läuft global — er bleibt aktiv wenn du die Seite wechselst.
              </p>
            </div>
            <button
              onClick={dismissWelcome}
              className="text-text-tertiary hover:text-text-secondary transition-colors flex-shrink-0 p-1 -mr-1 -mt-1 rounded"
              aria-label="Schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.16 }}
        className="card-surface dashboard-premium-card relative overflow-hidden p-2.5"
      >
        <div className="pointer-events-none absolute inset-y-2.5 left-0 w-1 rounded-r-full bg-primary/80 shadow-[0_0_14px_rgb(var(--primary)/0.48)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent" />
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-md border border-primary/30 bg-primary/[0.16] text-primary shadow-[0_0_12px_rgb(var(--primary)/0.2)]">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <p className="truncate text-[12.5px] leading-[1.25] sm:text-[13px] text-[rgb(var(--text-primary)/0.92)]">
                <span className="font-semibold text-text-primary">Morning briefing:</span>{' '}
                {trajectoryBriefing ? (
                  <>
                    <span className="font-semibold text-text-primary">{trajectoryBriefing.title}</span>
                    {' · '}
                    {trajectoryBriefing.daysUntil}d until deadline
                    {' · '}
                    <span
                      className={trajectoryTone ? trajectoryTone.text : 'text-text-secondary'}
                    >
                      {trajectoryBriefing.statusLabel}
                    </span>
                  </>
                ) : (
                  <span>No active trajectory milestone yet.</span>
                )}
              </p>
            </div>
            <Link
              href={trajectoryBriefingHref}
              onClick={() => {
                void trackAppEvent('trajectory_briefing_opened', {
                  source: 'today_morning_briefing',
                  route: '/today',
                  ...(trajectoryBriefing?.goalId ? { trajectory_goal_id: trajectoryBriefing.goalId } : {}),
                  ...(trajectoryBriefing?.status ? { status: trajectoryBriefing.status } : {}),
                });
              }}
              className="inline-flex items-center rounded-full border border-primary/24 bg-primary/[0.08] px-2.5 py-1 text-[10.5px] sm:text-[11px] font-semibold tracking-[0.02em] text-primary hover:border-primary/38 hover:bg-primary/[0.14] hover:text-primary-hover transition-colors"
            >
              {trajectoryBriefing ? 'Open linked trajectory →' : 'Set up trajectory →'}
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] sm:text-[11px]">
            {momentum ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/34 bg-primary/14 px-2.5 py-0.5 font-semibold tabular-nums text-text-primary">
                  Momentum {momentum.score}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-medium tabular-nums ${
                    momentum.delta > 0
                      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                      : momentum.delta < 0
                        ? 'border-red-400/30 bg-red-500/10 text-red-300'
                        : 'border-border/80 bg-surface/55 text-text-tertiary'
                  }`}
                >
                  {momentum.delta > 0 ? <TrendingUp className="h-3 w-3" /> : momentum.delta < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  {momentum.delta > 0 ? `+${momentum.delta}` : momentum.delta} vs last week
                </span>
                {momentum.stats.atRisk > 0 ? (
                  <span className="rounded-full border border-red-400/20 bg-red-500/10 px-2 py-0.5 tabular-nums text-red-300">
                    At risk {momentum.stats.atRisk}
                  </span>
                ) : momentum.stats.tight > 0 ? (
                  <span className="rounded-full border border-amber-300/20 bg-amber-500/10 px-2 py-0.5 tabular-nums text-amber-300">
                    Tight {momentum.stats.tight}
                  </span>
                ) : (
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 tabular-nums text-emerald-300">
                    On track {momentum.stats.onTrack}
                  </span>
                )}
                <span className="rounded-full border border-primary/24 bg-primary/10 px-2 py-0.5 tabular-nums text-text-secondary">
                  Focus load {momentum.stats.last7DaysHours.toFixed(1)}h / {momentum.stats.plannedHoursPerWeek}h
                </span>
              </>
            ) : (
              <span className="rounded-full border border-border/85 bg-surface/55 px-2 py-0.5 text-text-secondary">
                Momentum activates after your first active trajectory milestone.
              </span>
            )}

            {trajectoryBriefing ? (
              <span className="rounded-full border border-border/95 bg-surface/70 px-2 py-0.5 text-text-secondary">
                Prep starts {trajectoryBriefing.startDateLabel}
              </span>
            ) : null}
            {allDoneToday ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/12 px-2 py-0.5 font-medium text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                Done for today ({tasksCompletedCount}/{tasksTodayCount})
              </span>
            ) : tasksTodayCount > 0 ? (
              <span className="rounded-full border border-border/85 bg-surface/55 px-2 py-0.5 text-text-secondary tabular-nums">
                {tasksCompletedCount}/{tasksTodayCount} tasks done
              </span>
            ) : null}
          </div>

          {tasksTodayCount > 0 ? (
            <div className="rounded-md border border-primary/15 bg-primary/[0.06] px-2 py-1.5">
              <div className="mb-1 flex items-center justify-between text-[10px] text-text-secondary">
                <span>Today execution</span>
                <span className="tabular-nums">{taskCompletionPct}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-primary/75 transition-all"
                  style={{ width: `${taskCompletionPct}%` }}
                />
              </div>
            </div>
          ) : null}

          {showWeeklyCheckin && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/[0.07] px-2.5 py-1">
              <p className="text-[10.5px] text-text-secondary">
                Weekly check-in: verify risks and lock this week&apos;s next move.
              </p>
              <div className="ml-auto flex items-center gap-1.5">
                <Link
                  href="/trajectory?source=weekly_checkin"
                  onClick={dismissWeeklyCheckin}
                  className="inline-flex items-center rounded-md border border-primary/35 bg-primary/14 px-2 py-1 text-[10.5px] font-medium text-primary transition-colors hover:bg-primary/24"
                >
                  Review now
                </Link>
                <button
                  type="button"
                  onClick={dismissWeeklyCheckin}
                  className="inline-flex items-center rounded-md border border-border bg-surface/45 px-2 py-1 text-[10.5px] text-text-tertiary transition-colors hover:bg-surface-hover/70"
                >
                  Later
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <div className="mt-4">
        <CommandBar
          tasksToday={stats?.tasksToday ?? 0}
          tasksCompleted={stats?.tasksCompleted ?? 0}
          exercisesCompleted={stats?.exercisesThisWeek ?? 0}
          exercisesTotal={stats?.exercisesTotal ?? 0}
          nextExam={
            stats?.nextExam && typeof stats.nextExam.daysUntilExam === 'number'
              ? { name: stats.nextExam.name, daysUntilExam: stats.nextExam.daysUntilExam }
              : null
          }
          goalsDueSoon={stats?.goalsDueSoon ?? 0}
          interviewsUpcoming={stats?.interviewsUpcoming ?? 0}
          executionScore={nextTasksData?.executionScore ?? 0}
          nextBestAction={nextTasksData?.nextBestAction ?? null}
          alternatives={nextTasksData?.nextBestAlternatives ?? []}
          riskSignals={nextTasksData?.riskSignals ?? []}
          onChanged={() => {
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'next-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['courses'] });
          }}
        />
      </div>

      {/* MAIN 3-COLUMN GRID */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        {/* LEFT - Tasks (with homework integration) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.12 }}
          className="space-y-5"
        >
          <ErrorBoundary fallbackTitle="Tasks Error">
            <FocusTasks
              nextTasksData={{
                homeworks: nextTasksData?.homeworks ?? [],
                goals: nextTasksData?.goals ?? [],
                interviews: nextTasksData?.interviews ?? [],
              }}
            />
            <div className="mt-5">
              <UpcomingDeadlines
                goals={nextTasksData?.goals || []}
                interviews={nextTasksData?.interviews || []}
                exams={studyProgress}
              />
            </div>
          </ErrorBoundary>
        </motion.div>

        {/* MIDDLE - Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          className="space-y-5"
        >
          <ErrorBoundary fallbackTitle="Schedule Error">
            <ScheduleColumn
              events={events}
              isConnected={isConnected}
              isLoading={isLoading}
              onConnect={handleConnect}
              onRefresh={handleRefresh}
              onDisconnect={handleDisconnect}
              isRefreshing={false}
              isDisconnecting={disconnectMutation.isPending}
            />
          </ErrorBoundary>

          {/* Pomodoro below schedule */}
          <ErrorBoundary fallbackTitle="Timer Error">
            <PomodoroTimer />
          </ErrorBoundary>
        </motion.div>

        {/* RIGHT - Widgets */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.12 }}
          className="space-y-5"
        >
          <ErrorBoundary fallbackTitle="Widgets Error">
            {/* Quick Actions */}
            <QuickActionsWidget />

            {/* Study Progress */}
            <StudyProgress courses={studyProgress} />

            {/* Week Overview */}
            <WeekOverview {...(prefetchedWeekEvents ? { events: prefetchedWeekEvents } : {})} />
          </ErrorBoundary>
        </motion.div>
      </div>

      {/* Footer: Link to Calendar Page */}
      {isConnected === true && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
          className="text-center pt-4 border-t border-border"
        >
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-hover transition-colors"
          >
            View full week →
          </Link>
        </motion.div>
      )}

    </div>
  );
}
