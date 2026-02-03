'use client';

import { CalendarEvent } from '@/lib/data/mockEvents';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import FocusTasks from '@/components/features/dashboard/FocusTasks';
import ScheduleColumn from '@/components/features/dashboard/ScheduleColumn';
import QuickNotes from '@/components/features/dashboard/QuickNotes';
import QuickStatsBar from '@/components/features/dashboard/QuickStatsBar';
import CircularProgress from '@/components/features/dashboard/CircularProgress';
import QuickActionsWidget from '@/components/features/dashboard/QuickActionsWidget';
import ActivityFeed from '@/components/features/dashboard/ActivityFeed';
import TimeBlockVisualizer from '@/components/features/dashboard/TimeBlockVisualizer';
import MoodTracker from '@/components/features/dashboard/MoodTracker';
import PomodoroTimer from '@/components/features/dashboard/PomodoroTimer';
import WeekOverview from '@/components/features/dashboard/WeekOverview';
import { 
  checkGoogleCalendarConnection, 
  fetchTodayCalendarEvents, 
  disconnectGoogleCalendar,
  connectGoogleCalendar
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
  const {
    data: events = [],
    isLoading,
  } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar', 'today'],
    queryFn: fetchTodayCalendarEvents,
    enabled: isConnected === true,
    retry: false,
    refetchOnWindowFocus: false,
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

  const handleConnect = () => {
    connectGoogleCalendar();
  };

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect Google Calendar?')) {
      disconnectMutation.mutate();
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['calendar', 'today'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['user', 'streak'] });
    setSuccess('Events refreshed!');
  };

  // Fetch user streak
  const { data: streakData } = useQuery({
    queryKey: ['user', 'streak'],
    queryFn: async () => {
      const response = await fetch('/api/user/streak');
      if (!response.ok) throw new Error('Failed to fetch streak');
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Check if schedule is empty (no events or not connected)
  const hasEvents = events.length > 0;

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

      {/* QUICK STATS BAR - With Purple Background */}
      <QuickStatsBar
        eventsToday={events.length}
        productivity={85}
        focusTime={6}
        streak={streakData?.streak || 0}
        goalsThisWeek={{ completed: 2, total: 5 }}
        exercisesThisWeek={12}
      />

      {/* SMART GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Focus Tasks */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <ErrorBoundary fallbackTitle="Focus Tasks Error">
            <FocusTasks />
          </ErrorBoundary>
        </motion.div>

        {/* MIDDLE COLUMN - Schedule OR Widgets (if empty) */}
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

          {/* Show widgets here if schedule is empty */}
          {!hasEvents && (
            <ErrorBoundary fallbackTitle="Widgets Error">
              <>
                <TimeBlockVisualizer
                  morningProgress={50}
                  afternoonProgress={0}
                  eveningProgress={0}
                />
                <WeekOverview />
              </>
            </ErrorBoundary>
          )}
        </motion.div>

        {/* RIGHT COLUMN - Status + New Widgets */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <ErrorBoundary fallbackTitle="Widgets Error">
            <>
              {/* Circular Progress instead of old StatusDashboard */}
              <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-6 flex flex-col items-center">
                <CircularProgress percentage={85} label="Today's Completion" />
              </div>

              {/* Quick Actions */}
              <QuickActionsWidget />

              {/* Pomodoro Timer */}
              <PomodoroTimer />

              {/* Mood Tracker */}
              <MoodTracker />

              {/* Activity Feed */}
              <ActivityFeed />

              {/* Show TimeBlock & Week here if schedule HAS events */}
              {hasEvents && (
                <>
                  <TimeBlockVisualizer
                    morningProgress={50}
                    afternoonProgress={0}
                    eveningProgress={0}
                  />
                  <WeekOverview />
                </>
              )}
            </>
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

      {/* Quick Notes Floating Input */}
      <QuickNotes />
    </div>
  );
}
