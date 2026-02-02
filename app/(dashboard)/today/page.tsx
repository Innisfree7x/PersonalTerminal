'use client';

import { CalendarEvent } from '@/lib/data/mockEvents';
import { format } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import FocusTasks from '@/components/features/dashboard/FocusTasks';
import ScheduleColumn from '@/components/features/dashboard/ScheduleColumn';
import StatusDashboard from '@/components/features/dashboard/StatusDashboard';
import QuickNotes from '@/components/features/dashboard/QuickNotes';
import QuickStatsBar from '@/components/features/dashboard/QuickStatsBar';
import CircularProgress from '@/components/features/dashboard/CircularProgress';
import QuickActionsWidget from '@/components/features/dashboard/QuickActionsWidget';
import ActivityFeed from '@/components/features/dashboard/ActivityFeed';
import TimeBlockVisualizer from '@/components/features/dashboard/TimeBlockVisualizer';
import MoodTracker from '@/components/features/dashboard/MoodTracker';
import PomodoroTimer from '@/components/features/dashboard/PomodoroTimer';
import WeekOverview from '@/components/features/dashboard/WeekOverview';
import { Clock } from 'lucide-react';

/**
 * Check if user is connected to Google Calendar
 */
async function checkConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/calendar/today');
    return response.status !== 401;
  } catch {
    return false;
  }
}

/**
 * Fetch today's events from Google Calendar
 */
async function fetchTodayEvents(): Promise<CalendarEvent[]> {
  const response = await fetch('/api/calendar/today');

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error('Failed to fetch events');
  }

  const data = await response.json();
  return data.map((event: any) => ({
    ...event,
    startTime: new Date(event.startTime),
    endTime: new Date(event.endTime),
  }));
}

/**
 * Disconnect Google Calendar
 */
async function disconnectGoogle(): Promise<void> {
  const response = await fetch('/api/auth/google/disconnect', { method: 'POST' });
  if (!response.ok) {
    throw new Error('Failed to disconnect');
  }
}

export default function TodayPage() {
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check URL params for error/success messages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    const successParam = params.get('success');

    if (errorParam) {
      setError(
        errorParam === 'oauth_not_configured'
          ? 'Google OAuth is not configured. Please check your environment variables.'
          : errorParam === 'token_exchange_failed'
          ? 'Failed to exchange authorization code. Please try again.'
          : errorParam === 'missing_code'
          ? 'Authorization code missing. Please try again.'
          : 'An error occurred during authentication.'
      );
    }

    if (successParam === 'connected') {
      setSuccess('Successfully connected to Google Calendar!');
      window.history.replaceState({}, '', '/today');
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['calendar', 'today'] });
        checkConnection().then(setIsConnected);
      }, 1000);
    }
  }, [queryClient]);

  // Check connection status on mount
  useEffect(() => {
    checkConnection().then(setIsConnected);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch events if connected
  const {
    data: events = [],
    isLoading,
    error: fetchError,
  } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar', 'today'],
    queryFn: fetchTodayEvents,
    enabled: isConnected === true,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: disconnectGoogle,
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
    window.location.href = '/api/auth/google';
  };

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect Google Calendar?')) {
      disconnectMutation.mutate();
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['calendar', 'today'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    setError(null);
    setSuccess('Events refreshed!');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Clear error/success after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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

      {/* QUICK STATS BAR - Horizontal Top */}
      <QuickStatsBar
        eventsToday={events.length}
        productivity={85}
        focusTime={6}
        streak={7}
        goalsThisWeek={{ completed: 2, total: 5 }}
        exercisesThisWeek={12}
      />

      {/* Hero Section - Compact Clock */}
      {isMounted && currentTime && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
          
          <div className="relative z-10 flex items-center gap-4">
            <Clock className="w-10 h-10 text-primary" />
            <div>
              <motion.div 
                className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {format(currentTime, 'HH:mm:ss')}
              </motion.div>
              <div className="text-sm text-text-secondary">
                {format(currentTime, 'EEEE, MMMM d, yyyy')}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* SMART GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Focus Tasks */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <FocusTasks />
        </motion.div>

        {/* MIDDLE COLUMN - Schedule OR Widgets (if empty) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <ScheduleColumn
            events={events}
            currentTime={currentTime}
            isConnected={isConnected}
            isLoading={isLoading}
            onConnect={handleConnect}
            onRefresh={handleRefresh}
            onDisconnect={handleDisconnect}
            isRefreshing={false}
            isDisconnecting={disconnectMutation.isPending}
          />

          {/* Show widgets here if schedule is empty */}
          {!hasEvents && (
            <>
              <TimeBlockVisualizer
                morningProgress={50}
                afternoonProgress={0}
                eveningProgress={0}
              />
              <WeekOverview />
            </>
          )}
        </motion.div>

        {/* RIGHT COLUMN - Status + New Widgets */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
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
