'use client';

import type { CalendarEvent } from '@/lib/types/calendar';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, Sparkles, Target, ArrowRight, Gauge, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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
import { buildTrajectoryMorningBriefing, type TrajectoryBriefOverview } from '@/lib/dashboard/trajectoryBriefing';
import { trackAppEvent } from '@/lib/analytics/client';
import type { RankedExecutionCandidate } from '@/lib/application/use-cases/execution-engine';
import { useAppSound } from '@/lib/hooks/useAppSound';

const WELCOME_KEY = 'innis_welcomed_v1';
const LAST_MOMENTUM_SCORE_KEY = 'innis:last-momentum-score:v1';

type TrajectoryMomentumResponse = {
  generatedAt: string;
  momentum: {
    score: number;
    delta: number;
    trend: 'up' | 'flat' | 'down';
    stats: {
      onTrack: number;
      tight: number;
      atRisk: number;
      activeGoals: number;
      plannedHoursPerWeek: number;
      last7DaysHours: number;
      previous7DaysHours: number;
      capacityRatio: number;
    };
  };
};

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

export default function TodayPage() {
  const queryClient = useQueryClient();
  const { play } = useAppSound();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!hasWelcomedUser()) {
      setShowWelcome(true);
    }
  }, []);

  const dismissWelcome = () => {
    markUserWelcomed();
    setShowWelcome(false);
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
  const { data: nextTasksData } = useQuery<DashboardNextTasksResponse>({
    queryKey: ['dashboard', 'next-tasks'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/next-tasks');
      if (!response.ok) throw new Error('Failed to fetch next tasks');
      return response.json();
    },
    staleTime: 15 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: trajectoryOverview } = useQuery<TrajectoryBriefOverview>({
    queryKey: ['trajectory', 'overview', 'briefing'],
    queryFn: async () => {
      const response = await fetch('/api/trajectory/overview');
      if (!response.ok) {
        throw new Error('Failed to fetch trajectory overview');
      }
      return response.json();
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: momentumData } = useQuery<TrajectoryMomentumResponse>({
    queryKey: ['trajectory', 'momentum'],
    queryFn: async () => {
      const response = await fetch('/api/trajectory/momentum');
      if (!response.ok) {
        throw new Error('Failed to fetch trajectory momentum');
      }
      return response.json();
    },
    staleTime: 60 * 1000,
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
  const trajectoryBriefing = buildTrajectoryMorningBriefing(trajectoryOverview);
  const momentum = momentumData?.momentum ?? null;
  const trajectoryBriefingHref = trajectoryBriefing
    ? `/trajectory?goalId=${encodeURIComponent(trajectoryBriefing.goalId)}&source=morning_briefing`
    : '/trajectory?source=morning_briefing';

  useEffect(() => {
    const days = stats?.nextExam?.daysUntilExam;
    if (typeof days === 'number' && days <= 1) {
      dispatchChampionEvent({ type: 'DEADLINE_WARNING', hoursLeft: Math.max(1, days * 24) });
    }
  }, [stats?.nextExam?.daysUntilExam]);

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

  const prioritizedMoves = useMemo(() => {
    const pool = [nextTasksData?.nextBestAction, ...(nextTasksData?.nextBestAlternatives ?? [])]
      .filter((item): item is RankedExecutionCandidate => item != null);
    const seen = new Set<string>();
    const deduped: RankedExecutionCandidate[] = [];
    for (const item of pool) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      deduped.push(item);
      if (deduped.length >= 3) break;
    }
    return deduped;
  }, [nextTasksData?.nextBestAction, nextTasksData?.nextBestAlternatives]);

  return (
    <div className="space-y-6" data-testid="today-page-root">
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
        className="relative overflow-hidden rounded-xl border border-border bg-surface/70 p-3.5"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        {trajectoryBriefing ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">Morning briefing:</span>{' '}
              {trajectoryBriefing.title} · {trajectoryBriefing.daysUntil}d until deadline ·{' '}
              <span
                className={
                  trajectoryBriefing.status === 'on_track'
                    ? 'text-emerald-400'
                    : trajectoryBriefing.status === 'tight'
                      ? 'text-amber-300'
                      : 'text-red-400'
                }
              >
                {trajectoryBriefing.statusLabel}
              </span>
              {' · '}
              prep starts {trajectoryBriefing.startDateLabel}
            </p>
            <Link
              href={trajectoryBriefingHref}
              onClick={() => {
                void trackAppEvent('trajectory_briefing_opened', {
                  source: 'today_morning_briefing',
                  route: '/today',
                  trajectory_goal_id: trajectoryBriefing.goalId,
                  status: trajectoryBriefing.status,
                });
              }}
              className="inline-flex items-center text-xs font-medium text-primary hover:text-primary-hover transition-colors"
            >
              Open linked trajectory →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">Morning briefing:</span>{' '}
              No active trajectory milestone yet.
            </p>
            <Link
              href={trajectoryBriefingHref}
              onClick={() => {
                void trackAppEvent('trajectory_briefing_opened', {
                  source: 'today_morning_briefing',
                  route: '/today',
                });
              }}
              className="inline-flex items-center text-xs font-medium text-primary hover:text-primary-hover transition-colors"
            >
              Set up trajectory →
            </Link>
          </div>
        )}
      </motion.div>

      {momentum ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16, delay: 0.01 }}
          className="relative overflow-hidden rounded-xl border border-border bg-surface/70 p-4"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
                <Gauge className="h-4 w-4 text-primary" />
                Momentum score
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Weekly trajectory heartbeat based on risk status + capacity trend.
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-text-primary">{momentum.score}</p>
              <p
                className={`inline-flex items-center gap-1 text-xs font-medium ${
                  momentum.delta > 0
                    ? 'text-emerald-400'
                    : momentum.delta < 0
                      ? 'text-red-400'
                      : 'text-text-tertiary'
                }`}
              >
                {momentum.delta > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : momentum.delta < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5" />
                ) : (
                  <Minus className="h-3.5 w-3.5" />
                )}
                {momentum.delta > 0 ? `+${momentum.delta}` : momentum.delta} vs last week
              </p>
            </div>
          </div>
          {momentum.stats.activeGoals > 0 ? (
            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-4">
              <div className="rounded-lg border border-white/10 bg-background/40 px-3 py-2">
                <p className="text-text-tertiary">On track</p>
                <p className="mt-0.5 text-sm font-semibold text-emerald-400">{momentum.stats.onTrack}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-background/40 px-3 py-2">
                <p className="text-text-tertiary">Tight</p>
                <p className="mt-0.5 text-sm font-semibold text-amber-300">{momentum.stats.tight}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-background/40 px-3 py-2">
                <p className="text-text-tertiary">At risk</p>
                <p className="mt-0.5 text-sm font-semibold text-red-400">{momentum.stats.atRisk}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-background/40 px-3 py-2">
                <p className="text-text-tertiary">Focus load</p>
                <p className="mt-0.5 text-sm font-semibold text-text-primary">
                  {momentum.stats.last7DaysHours.toFixed(1)}h / {momentum.stats.plannedHoursPerWeek}h
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-white/10 bg-background/40 px-3 py-2 text-xs text-text-secondary">
              No active milestones yet. Add your first goal in trajectory to activate a real momentum score.
            </div>
          )}
        </motion.div>
      ) : null}

      {prioritizedMoves.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.03 }}
          className="rounded-xl border border-border bg-surface/70 p-3.5"
        >
          <div className="mb-2.5 flex items-center justify-between">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Target className="h-4 w-4 text-primary" />
              Heute kritisch: Top 3 Moves
            </p>
            <span className="text-[11px] text-text-tertiary">
              priorisiert nach Impact + Deadline
            </span>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {prioritizedMoves.map((move, index) => (
              <div key={move.id} className="rounded-lg border border-border bg-background/50 px-3 py-2.5">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary">Move {index + 1}</span>
                  <span
                    className={
                      move.urgencyLabel === 'overdue'
                        ? 'text-[10px] font-semibold uppercase tracking-wide text-red-400'
                        : move.urgencyLabel === 'today'
                          ? 'text-[10px] font-semibold uppercase tracking-wide text-amber-300'
                          : move.urgencyLabel === 'soon'
                            ? 'text-[10px] font-semibold uppercase tracking-wide text-sky-300'
                            : 'text-[10px] font-semibold uppercase tracking-wide text-text-tertiary'
                    }
                  >
                    {move.urgencyLabel}
                  </span>
                </div>
                <p className="truncate text-sm font-medium text-text-primary">{move.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">
                  {move.subtitle || move.reasons[0] || 'High-impact action'}
                </p>
                <p className="mt-1.5 text-[11px] text-text-tertiary">
                  Score {Math.round(move.score)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end">
            <Link href="/trajectory" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover">
              Strategie öffnen
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>
      ) : null}

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

      {/* MAIN 3-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT - Tasks (with homework integration) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.12 }}
          className="space-y-6"
        >
          <ErrorBoundary fallbackTitle="Tasks Error">
            <FocusTasks />
            <div className="mt-6">
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
          className="space-y-6"
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
          className="space-y-6"
        >
          <ErrorBoundary fallbackTitle="Widgets Error">
            {/* Quick Actions */}
            <QuickActionsWidget />

            {/* Study Progress */}
            <StudyProgress courses={studyProgress} />

            {/* Week Overview */}
            <WeekOverview />
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
