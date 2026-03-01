'use client';

import type { CalendarEvent } from '@/lib/types/calendar';
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, Sparkles } from 'lucide-react';
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

const WELCOME_KEY = 'innis_welcomed_v1';

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

  useEffect(() => {
    const days = stats?.nextExam?.daysUntilExam;
    if (typeof days === 'number' && days <= 1) {
      dispatchChampionEvent({ type: 'DEADLINE_WARNING', hoursLeft: Math.max(1, days * 24) });
    }
  }, [stats?.nextExam?.daysUntilExam]);

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
