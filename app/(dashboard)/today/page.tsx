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
import { Zap, TrendingUp, Clock } from 'lucide-react';

/**
 * Check if user is connected to Google Calendar
 */
async function checkConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/calendar/today');
    return response.status !== 401; // 401 = not authenticated
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
  // Convert date strings to Date objects
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
      // Clear URL params
      window.history.replaceState({}, '', '/today');
      // Refresh connection status
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
    }, 1000); // Update every second

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

      {/* Hero Section - Current Time Display */}
      {isMounted && currentTime && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8"
        >
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <motion.div 
                  className="text-5xl font-bold bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {format(currentTime, 'HH:mm:ss')}
                </motion.div>
                <div className="text-lg text-text-secondary">
                  {format(currentTime, 'EEEE, MMMM d, yyyy')}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="hidden md:flex items-center gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <Zap className="w-5 h-5" />
                    <span className="text-2xl font-bold">{events.length}</span>
                  </div>
                  <div className="text-xs text-text-tertiary">Events Today</div>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="text-center">
                  <div className="flex items-center gap-2 text-success mb-1">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-2xl font-bold">85%</span>
                  </div>
                  <div className="text-xs text-text-tertiary">Productivity</div>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="text-center">
                  <div className="flex items-center gap-2 text-warning mb-1">
                    <Clock className="w-5 h-5" />
                    <span className="text-2xl font-bold">6h</span>
                  </div>
                  <div className="text-xs text-text-tertiary">Focus Time</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Focus Tasks */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="order-1 lg:order-1"
        >
          <FocusTasks />
        </motion.div>

        {/* MIDDLE COLUMN - Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="order-2 lg:order-2"
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
        </motion.div>

        {/* RIGHT COLUMN - Status Dashboard */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="order-3 lg:order-3"
        >
          <StatusDashboard />
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
