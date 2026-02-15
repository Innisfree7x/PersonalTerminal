'use client';

import { CalendarEvent } from '@/lib/data/mockEvents';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import FocusTasks from '@/components/features/dashboard/FocusTasks';
import ScheduleColumn from '@/components/features/dashboard/ScheduleColumn';
import DashboardStats from '@/components/features/dashboard/DashboardStats';
import QuickActionsWidget from '@/components/features/dashboard/QuickActionsWidget';
import StudyProgress from '@/components/features/dashboard/StudyProgress';
import UpcomingDeadlines from '@/components/features/dashboard/UpcomingDeadlines';
import WeekOverview from '@/components/features/dashboard/WeekOverview';
import PomodoroTimer from '@/components/features/dashboard/PomodoroTimer';
import {
  checkGoogleCalendarConnection,
  fetchTodayCalendarEvents,
  disconnectGoogleCalendar,
  connectGoogleCalendar,
} from '@/lib/api/calendar';
import { useNotifications, parseOAuthCallbackParams } from '@/lib/hooks/useNotifications';

export default function TodayPage() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const { error, success, setError, setSuccess } = useNotifications();

  // Check URL params for OAuth callback messages
  useEffect(() => {
    const messages = parseOAuthCallbackParams();

    if (messages.error) {
      setError(messages.error);
    }

    if (messages.success) {
      setSuccess(messages.success);
      window.history.replaceState({}, '', '/today');
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['calendar', 'today'] });
        checkGoogleCalendarConnection().then(setIsConnected);
      }, 1000);
    }
  }, [queryClient, setError, setSuccess]);

  // Check connection status on mount
  useEffect(() => {
    checkGoogleCalendarConnection().then(setIsConnected);
  }, []);

  // Fetch events if connected
  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar', 'today'],
    queryFn: fetchTodayCalendarEvents,
    enabled: isConnected === true,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Fetch next-tasks data (powers stats, study progress, deadlines)
  const { data: nextTasksData } = useQuery({
    queryKey: ['dashboard', 'next-tasks'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/next-tasks');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: disconnectGoogleCalendar,
    onSuccess: () => {
      setIsConnected(false);
      queryClient.setQueryData(['calendar', 'today'], []);
      setSuccess('Successfully disconnected from Google Calendar.');
    },
    onError: () => {
      setError('Failed to disconnect. Please try again.');
    },
  });

  const handleConnect = () => connectGoogleCalendar();
  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect Google Calendar?')) {
      disconnectMutation.mutate();
    }
  };
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['calendar', 'today'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'next-tasks'] });
    setSuccess('Refreshed!');
  };

  const stats = nextTasksData?.stats;
  const studyProgress = nextTasksData?.studyProgress || [];

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
        >
          {error}
        </motion.div>
      )}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
        >
          {success}
        </motion.div>
      )}

      {/* Stats Bar - Real Data */}
      {stats && (
        <DashboardStats
          tasksToday={stats.tasksToday}
          tasksCompleted={stats.tasksCompleted}
          exercisesCompleted={stats.exercisesThisWeek}
          exercisesTotal={stats.exercisesTotal}
          nextExam={stats.nextExam}
          goalsDueSoon={stats.goalsDueSoon}
          interviewsUpcoming={stats.interviewsUpcoming}
        />
      )}

      {/* MAIN 3-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT - Tasks (with homework integration) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <ErrorBoundary fallbackTitle="Tasks Error">
            <FocusTasks />
          </ErrorBoundary>
        </motion.div>

        {/* MIDDLE - Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <ErrorBoundary fallbackTitle="Schedule Error">
            <ScheduleColumn
              events={events}
              currentTime={new Date()}
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
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <ErrorBoundary fallbackTitle="Widgets Error">
            {/* Quick Actions */}
            <QuickActionsWidget />

            {/* Study Progress */}
            <StudyProgress courses={studyProgress} />

            {/* Upcoming Deadlines */}
            <UpcomingDeadlines
              goals={nextTasksData?.goals || []}
              interviews={nextTasksData?.interviews || []}
              exams={studyProgress}
            />

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
          transition={{ delay: 0.4 }}
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
