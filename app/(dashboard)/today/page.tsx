'use client';

import { CalendarEvent } from '@/lib/data/mockEvents';
import { format } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import FocusTasks from '@/components/features/dashboard/FocusTasks';
import ScheduleColumn from '@/components/features/dashboard/ScheduleColumn';
import StatusDashboard from '@/components/features/dashboard/StatusDashboard';
import QuickNotes from '@/components/features/dashboard/QuickNotes';

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
    <div className="space-y-4">
      {/* Error/Success Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-300">
          {success}
        </div>
      )}

      {/* Current Time Display - Compact */}
      {isMounted && currentTime && (
        <div className="flex items-center gap-4 text-sm text-gray-400 dark:text-gray-400">
          <div className="font-mono font-semibold">
            {format(currentTime, 'HH:mm:ss')}
          </div>
          <div className="text-gray-500 dark:text-gray-500">
            {format(currentTime, 'EEEE, MMMM d, yyyy')}
          </div>
        </div>
      )}

      {/* 3-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT COLUMN - Focus Tasks */}
        <div className="order-1 lg:order-1">
          <FocusTasks />
        </div>

        {/* MIDDLE COLUMN - Schedule */}
        <div className="order-2 lg:order-2">
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
        </div>

        {/* RIGHT COLUMN - Status Dashboard */}
        <div className="order-3 lg:order-3">
          <StatusDashboard />
        </div>
      </div>

      {/* Footer: Link to Calendar Page */}
      {isConnected === true && !isLoading && (
        <div className="text-center pt-4 border-t border-gray-800 dark:border-gray-700">
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 text-xs text-blue-400 dark:text-blue-400 hover:text-blue-300 dark:hover:text-blue-300 transition-colors"
          >
            View full week →
          </Link>
        </div>
      )}

      {/* Quick Notes Floating Input */}
      <QuickNotes />
    </div>
  );
}
