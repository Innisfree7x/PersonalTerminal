'use client';

import { CalendarEvent } from '@/lib/data/mockEvents';
import { format, startOfWeek, addWeeks, subWeeks, isSameDay, getWeek } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sunday = 0, Monday = 1, etc.

/**
 * Get Monday of the week for a given date
 */
function getWeekStart(date: Date): Date {
  const monday = startOfWeek(date, { weekStartsOn: 1 }); // 1 = Monday
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get all days of the week (Monday to Sunday)
 */
function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    days.push(day);
  }
  return days;
}

/**
 * Group events by day
 */
function groupEventsByDay(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const groups: Record<string, CalendarEvent[]> = {};

  events.forEach((event) => {
    const dayKey = format(event.startTime, 'yyyy-MM-dd');
    if (!groups[dayKey]) {
      groups[dayKey] = [];
    }
    groups[dayKey].push(event);
  });

  // Sort events within each day by start time
  Object.keys(groups).forEach((key) => {
    groups[key].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  });

  return groups;
}

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
 * Fetch week's events from Google Calendar
 */
async function fetchWeekEvents(weekStart: Date): Promise<CalendarEvent[]> {
  const response = await fetch(
    `/api/calendar/week?weekStart=${weekStart.toISOString()}`
  );

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

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [selectedWeek, setSelectedWeek] = useState<Date>(() => getWeekStart(new Date()));
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check URL params for error/success messages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    const successParam = params.get('success');

    if (errorParam) {
      setError('An error occurred during authentication.');
    }

    if (successParam === 'connected') {
      setSuccess('Successfully connected to Google Calendar!');
      window.history.replaceState({}, '', '/calendar');
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['calendar', 'week'] });
        checkConnection().then(setIsConnected);
      }, 1000);
    }
  }, [queryClient]);

  // Check connection status on mount
  useEffect(() => {
    checkConnection().then(setIsConnected);
  }, []);

  const weekDays = useMemo(() => getWeekDays(selectedWeek), [selectedWeek]);
  const today = new Date();

  // Fetch events for selected week
  const {
    data: events = [],
    isLoading,
    error: fetchError,
  } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar', 'week', selectedWeek.toISOString()],
    queryFn: () => fetchWeekEvents(selectedWeek),
    enabled: isConnected === true,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: disconnectGoogle,
    onSuccess: () => {
      setIsConnected(false);
      queryClient.setQueryData(['calendar', 'week'], []);
      setSuccess('Successfully disconnected from Google Calendar.');
    },
    onError: () => {
      setError('Failed to disconnect. Please try again.');
    },
  });

  const handlePreviousWeek = () => {
    setSelectedWeek(subWeeks(selectedWeek, 1));
  };

  const handleNextWeek = () => {
    setSelectedWeek(addWeeks(selectedWeek, 1));
  };

  const handleToday = () => {
    setSelectedWeek(getWeekStart(new Date()));
  };

  const handleConnect = () => {
    window.location.href = '/api/auth/google';
  };

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect Google Calendar?')) {
      disconnectMutation.mutate();
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['calendar', 'week'] });
    setError(null);
    setSuccess('Events refreshed!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const groupedEvents = useMemo(() => groupEventsByDay(events), [events]);

  // Calculate week info for display
  const weekNumber = getWeek(selectedWeek, { weekStartsOn: 1 });
  const weekYear = selectedWeek.getFullYear();

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

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayNamesShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Calendar</h1>
        <div className="flex items-center gap-3">
          {isConnected === true && (
            <>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
                className="px-4 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
              >
                {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </>
          )}
          {isConnected === false && (
            <button
              onClick={handleConnect}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect Google Calendar
            </button>
          )}
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <button
          onClick={handlePreviousWeek}
          className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          ← Previous Week
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={handleToday}
            className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            Today
          </button>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
            Week {weekNumber}, {weekYear}
          </div>
        </div>

        <button
          onClick={handleNextWeek}
          className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Next Week →
        </button>
      </div>

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

      {/* Not Connected State */}
      {isConnected === false && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-6 py-8 text-center dark:border-blue-900/50 dark:bg-blue-900/20">
          <div className="text-4xl mb-4">📅</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Connect Google Calendar
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Connect your Google Calendar to see your weekly schedule.
          </p>
          <button
            onClick={handleConnect}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Connect Google Calendar
          </button>
        </div>
      )}

      {/* Loading State */}
      {isConnected === true && isLoading && (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          Loading events...
        </div>
      )}

      {/* Fetch Error State */}
      {isConnected === true &&
        fetchError &&
        (fetchError as Error).message === 'UNAUTHORIZED' && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-300">
            Your Google Calendar connection has expired. Please{' '}
            <button onClick={handleConnect} className="underline font-medium">
              reconnect
            </button>
            .
          </div>
        )}

      {/* Week Grid */}
      {isConnected === true && !isLoading && (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-4 px-4 sm:px-0">
              {weekDays.map((day, index) => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayEvents = groupedEvents[dayKey] || [];
                const isToday = isSameDay(day, today);

                return (
                  <div
                    key={dayKey}
                    className={`rounded-lg border-2 p-4 min-h-[200px] ${
                      isToday
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Day Header */}
                    <div className="mb-3">
                      <div
                        className={`text-xs font-medium uppercase mb-1 ${
                          isToday
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {dayNamesShort[index]}
                      </div>
                      <div
                        className={`text-lg font-semibold ${
                          isToday
                            ? 'text-blue-900 dark:text-blue-100'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {format(day, 'd')}
                      </div>
                    </div>

                    {/* Events List */}
                    <div className="space-y-1.5">
                      {dayEvents.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-gray-500">No events</p>
                      ) : (
                        dayEvents.map((event) => {
                          const eventTypeConfig: Record<
                            CalendarEvent['type'],
                            { icon: string; color: string; bgColor: string }
                          > = {
                            meeting: {
                              icon: '📅',
                              color: 'text-blue-700 dark:text-blue-400',
                              bgColor: 'bg-blue-100 dark:bg-blue-900/30',
                            },
                            task: {
                              icon: '✓',
                              color: 'text-purple-700 dark:text-purple-400',
                              bgColor: 'bg-purple-100 dark:bg-purple-900/30',
                            },
                            break: {
                              icon: '☕',
                              color: 'text-green-700 dark:text-green-400',
                              bgColor: 'bg-green-100 dark:bg-green-900/30',
                            },
                          };
                          const config = eventTypeConfig[event.type];

                          return (
                            <div
                              key={event.id}
                              className={`rounded p-2 text-xs border ${config.bgColor} ${config.color} border-current/20 hover:opacity-80 transition-opacity cursor-pointer`}
                              title={event.title}
                            >
                              <div className="font-medium truncate mb-0.5">
                                <span className="mr-1">{config.icon}</span>
                                {format(event.startTime, 'HH:mm')} {event.title}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {isConnected === true &&
        !isLoading &&
        events.length === 0 &&
        Object.keys(groupedEvents).length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No events scheduled this week</p>
          </div>
        )}
    </div>
  );
}
