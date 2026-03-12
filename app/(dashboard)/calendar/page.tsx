'use client';

import type { CalendarEvent } from '@/lib/types/calendar';
import { format, startOfWeek, addWeeks, subWeeks, isSameDay, getWeek } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { parseOAuthCallbackParams } from '@/lib/hooks/useNotifications';
import {
  checkGoogleCalendarConnectionAction,
  disconnectGoogleCalendarAction,
  fetchWeekCalendarEventsAction,
} from '@/app/actions/calendar';
import {
  buildTrajectoryGhostEventsForWeek,
  type TrajectoryGhostEvent,
} from '@/lib/calendar/trajectoryGhostEvents';
import { STORAGE_KEYS } from '@/lib/storage/keys';

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
    const dayEvents = groups[key];
    if (dayEvents) {
      dayEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }
  });

  return groups;
}

interface CalendarTrajectoryGoal {
  id: string;
  title: string;
  dueDate: string;
  status: 'active' | 'done' | 'archived';
}

interface CalendarTrajectoryWindow {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  confidence: 'low' | 'medium' | 'high';
}

interface CalendarTrajectoryGeneratedBlock {
  goalId: string;
  title: string;
  startDate: string;
  endDate: string;
  status: 'on_track' | 'tight' | 'at_risk';
}

interface CalendarTrajectoryOverviewResponse {
  goals: CalendarTrajectoryGoal[];
  windows: CalendarTrajectoryWindow[];
  computed: {
    generatedBlocks: CalendarTrajectoryGeneratedBlock[];
  };
}

interface GoogleOAuthRedirectInfo {
  redirectUri: string;
  source: 'cookie' | 'configured' | 'site_url' | 'request_origin' | 'fallback';
  normalized: boolean;
  requestOrigin: string;
  configuredRedirectUri: string | null;
  configuredOrigin: string | null;
  configuredMatchesRequestOrigin: boolean | null;
}

const ghostEventClassMap: Record<TrajectoryGhostEvent['kind'], string> = {
  milestone: 'border-success/45 bg-success/10 text-success',
  prep_block: 'border-warning/45 bg-warning/10 text-warning',
  window: 'border-info/45 bg-info/10 text-info',
};

export default function CalendarPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedWeek, setSelectedWeek] = useState<Date>(() => getWeekStart(new Date()));
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showTrajectoryGhostEvents, setShowTrajectoryGhostEvents] = useState(true);
  const [isCopyingRedirect, setIsCopyingRedirect] = useState(false);

  // Check URL params for error/success messages
  useEffect(() => {
    const messages = parseOAuthCallbackParams();
    if (messages.error) {
      setError(messages.error);
      window.history.replaceState({}, '', '/calendar');
      return;
    }

    if (messages.success) {
      setSuccess(messages.success);
      window.history.replaceState({}, '', '/calendar');
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['calendar', 'week'] });
        checkGoogleCalendarConnectionAction().then(setIsConnected);
      }, 1000);
    }
  }, [queryClient]);

  // Check connection status on mount
  useEffect(() => {
    checkGoogleCalendarConnectionAction().then(setIsConnected);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(STORAGE_KEYS.calendarShowTrajectoryGhostEvents);
    if (raw === null) return;
    setShowTrajectoryGhostEvents(raw !== '0');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      STORAGE_KEYS.calendarShowTrajectoryGhostEvents,
      showTrajectoryGhostEvents ? '1' : '0'
    );
  }, [showTrajectoryGhostEvents]);

  const weekDays = useMemo(() => getWeekDays(selectedWeek), [selectedWeek]);
  const today = new Date();

  // Fetch events for selected week
  const {
    data: events = [],
    isLoading,
    error: fetchError,
  } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar', 'week', selectedWeek.toISOString()],
    queryFn: async () => {
      const data = await fetchWeekCalendarEventsAction(selectedWeek.toISOString());
      return data.map((event) => ({
        ...event,
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
      }));
    },
    enabled: isConnected === true,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: trajectoryOverview } = useQuery<CalendarTrajectoryOverviewResponse>({
    queryKey: ['trajectory', 'calendar-overview'],
    queryFn: async () => {
      const response = await fetch('/api/trajectory/overview');
      if (!response.ok) {
        throw new Error('Failed to fetch trajectory overview');
      }
      return response.json() as Promise<CalendarTrajectoryOverviewResponse>;
    },
    enabled: isConnected === true && showTrajectoryGhostEvents,
    staleTime: 20 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  const { data: oauthRedirectInfo } = useQuery<GoogleOAuthRedirectInfo>({
    queryKey: ['calendar', 'google-redirect-uri'],
    queryFn: async () => {
      const response = await fetch('/api/auth/google/redirect-uri');
      if (!response.ok) {
        throw new Error('Failed to resolve Google OAuth redirect URI');
      }
      return response.json() as Promise<GoogleOAuthRedirectInfo>;
    },
    enabled: isConnected === false,
    staleTime: 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: disconnectGoogleCalendarAction,
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

  const handleCopyRedirectUri = async () => {
    if (!oauthRedirectInfo?.redirectUri || typeof navigator === 'undefined') return;
    try {
      setIsCopyingRedirect(true);
      await navigator.clipboard.writeText(oauthRedirectInfo.redirectUri);
      setSuccess('Redirect URI copied. Paste it into Google Cloud OAuth client.');
    } catch {
      setError('Could not copy redirect URI. Copy it manually from the field.');
    } finally {
      setIsCopyingRedirect(false);
    }
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
  const groupedGhostEvents = useMemo(() => {
    if (!showTrajectoryGhostEvents) return {};
    if (!trajectoryOverview) return {};
    return buildTrajectoryGhostEventsForWeek({
      weekDays,
      goals: trajectoryOverview.goals,
      generatedBlocks: trajectoryOverview.computed.generatedBlocks,
      windows: trajectoryOverview.windows,
    });
  }, [showTrajectoryGhostEvents, trajectoryOverview, weekDays]);
  const totalGhostEvents = useMemo(
    () => Object.values(groupedGhostEvents).reduce((sum, dayEvents) => sum + dayEvents.length, 0),
    [groupedGhostEvents]
  );

  // Calculate week info for display
  const weekNumber = getWeek(selectedWeek, { weekStartsOn: 1 });
  const weekYear = selectedWeek.getFullYear();

  // Clear error/success after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [success]);

  const dayNamesShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleOpenGhostEvent = (ghostEvent: TrajectoryGhostEvent) => {
    const params = new URLSearchParams();
    if (ghostEvent.goalId) params.set('goalId', ghostEvent.goalId);
    if (ghostEvent.windowId) params.set('windowId', ghostEvent.windowId);
    const suffix = params.toString();
    router.push(suffix ? `/trajectory?${suffix}` : '/trajectory');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-text-primary">Calendar</h1>
        <div className="flex items-center gap-3">
          {isConnected === true && (
            <button
              onClick={() => setShowTrajectoryGhostEvents((current) => !current)}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                showTrajectoryGhostEvents
                  ? 'border-info/40 bg-info/10 text-info'
                  : 'border-border bg-surface/70 text-text-secondary hover:bg-surface-hover/70 hover:text-text-primary'
              }`}
            >
              {showTrajectoryGhostEvents ? 'Hide Trajectory Ghosts' : 'Show Trajectory Ghosts'}
            </button>
          )}
          {isConnected === true && (
            <>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-4 py-2 text-sm rounded-lg border border-border bg-surface/70 text-text-secondary hover:bg-surface-hover/70 hover:text-text-primary transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
                className="px-4 py-2 text-sm rounded-lg border border-error/30 bg-error/10 text-error hover:bg-error/20 transition-colors disabled:opacity-50"
              >
                {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </>
          )}
          {isConnected === false && (
            <button
              onClick={handleConnect}
              className="px-4 py-2 text-sm rounded-lg border border-primary/30 bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
            >
              Connect Google Calendar
            </button>
          )}
        </div>
      </div>

      {/* Week Navigation */}
      <div className="card-surface dashboard-premium-card-soft flex items-center justify-between rounded-lg p-4">
        <button
          onClick={handlePreviousWeek}
          className="px-4 py-2 text-sm rounded-lg border border-border bg-surface/70 text-text-secondary hover:bg-surface-hover/70 hover:text-text-primary transition-colors"
        >
          ← Previous Week
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={handleToday}
            className="px-4 py-2 text-sm rounded-lg border border-primary/30 bg-primary/12 text-primary hover:bg-primary/20 transition-colors"
          >
            Today
          </button>
          <div className="text-lg font-semibold text-text-primary text-center">
            Week {weekNumber}, {weekYear}
          </div>
        </div>

        <button
          onClick={handleNextWeek}
          className="px-4 py-2 text-sm rounded-lg border border-border bg-surface/70 text-text-secondary hover:bg-surface-hover/70 hover:text-text-primary transition-colors"
        >
          Next Week →
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {success}
        </div>
      )}

      {/* Ghost Legend */}
      {isConnected === true && showTrajectoryGhostEvents && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-xs text-text-secondary">
          <span className="font-semibold text-text-primary">Legend</span>
          <span className="rounded-full border border-info/40 bg-info/10 px-2 py-1 text-info">
            ◌ Trajectory Milestone
          </span>
          <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-1 text-warning">
            ◌ Prep Block
          </span>
          <span className="rounded-full border border-success/40 bg-success/10 px-2 py-1 text-success">
            ◌ Opportunity Window
          </span>
          <span className="ml-auto rounded-full border border-border px-2 py-1 text-text-secondary">
            {totalGhostEvents} ghost events this week
          </span>
        </div>
      )}

      {/* Not Connected State */}
      {isConnected === false && (
        <div className="card-surface dashboard-premium-card-soft rounded-lg border px-6 py-8 text-center">
          <div className="text-4xl mb-4">📅</div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Connect Google Calendar
          </h2>
          <p className="text-text-secondary mb-4">
            Connect your Google Calendar to see your weekly schedule.
          </p>
          <button
            onClick={handleConnect}
            className="px-6 py-2 rounded-lg border border-primary/30 bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
          >
            Connect Google Calendar
          </button>
          {oauthRedirectInfo ? (
            <div className="mt-5 rounded-lg border border-primary/20 bg-primary/[0.07] p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                OAuth Redirect URI (Google Cloud)
              </p>
              <p className="mt-1 text-xs text-text-tertiary">
                Add this exact URI in Google Cloud OAuth Client → Authorized redirect URIs.
              </p>
              <code className="mt-2 block overflow-x-auto rounded-md border border-border/70 bg-surface/80 px-3 py-2 font-mono text-[11px] text-text-primary">
                {oauthRedirectInfo.redirectUri}
              </code>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={handleCopyRedirectUri}
                  disabled={isCopyingRedirect}
                  className="px-3 py-1.5 rounded-md border border-primary/30 bg-primary/12 text-xs text-primary hover:bg-primary/20 transition-colors disabled:opacity-60"
                >
                  {isCopyingRedirect ? 'Copying…' : 'Copy URI'}
                </button>
                <span className="rounded-full border border-border/70 bg-surface/60 px-2 py-1 text-[11px] text-text-secondary">
                  source: {oauthRedirectInfo.source}
                </span>
                {oauthRedirectInfo.normalized ? (
                  <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-1 text-[11px] text-warning">
                    normalized
                  </span>
                ) : null}
                {oauthRedirectInfo.configuredMatchesRequestOrigin === false ? (
                  <span className="rounded-full border border-error/35 bg-error/10 px-2 py-1 text-[11px] text-error">
                    env origin mismatch
                  </span>
                ) : null}
              </div>
              {oauthRedirectInfo.configuredMatchesRequestOrigin === false ? (
                <p className="mt-3 text-xs text-error">
                  GOOGLE_REDIRECT_URI origin ({oauthRedirectInfo.configuredOrigin}) weicht von der aktuellen App-Origin ({oauthRedirectInfo.requestOrigin}) ab.
                  Das verursacht typischerweise <span className="font-semibold">redirect_uri_mismatch</span>.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {/* Loading State */}
      {isConnected === true && isLoading && (
        <div className="text-center py-12 text-text-secondary">
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
                const dayGhostEvents = groupedGhostEvents[dayKey] || [];
                const isToday = isSameDay(day, today);

                return (
                  <div
                    key={dayKey}
                    className={`rounded-lg border-2 p-4 min-h-[200px] ${isToday
                        ? 'border-primary/45 bg-primary/[0.08]'
                        : 'border-border bg-surface/40'
                      }`}
                  >
                    {/* Day Header */}
                    <div className="mb-3">
                      <div
                        className={`text-xs font-medium uppercase mb-1 ${isToday
                            ? 'text-primary'
                            : 'text-text-tertiary'
                          }`}
                      >
                        {dayNamesShort[index]}
                      </div>
                      <div
                        className={`text-lg font-semibold ${isToday
                            ? 'text-text-primary'
                            : 'text-text-primary'
                          }`}
                      >
                        {format(day, 'd')}
                      </div>
                    </div>

                    {/* Events List */}
                    <div className="space-y-1.5">
                      {dayEvents.length === 0 && dayGhostEvents.length === 0 ? (
                        <p className="text-xs text-text-tertiary">No events</p>
                      ) : (
                        <>
                          {dayEvents.map((event) => {
                            const eventTypeConfig: Record<
                              CalendarEvent['type'],
                              { icon: string; color: string; bgColor: string }
                            > = {
                              meeting: {
                                icon: '📅',
                                color: 'text-info',
                                bgColor: 'bg-info/10',
                              },
                              task: {
                                icon: '✓',
                                color: 'text-primary',
                                bgColor: 'bg-primary/12',
                              },
                              break: {
                                icon: '☕',
                                color: 'text-success',
                                bgColor: 'bg-success/10',
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
                          })}

                          {dayGhostEvents.map((ghostEvent) => (
                            <button
                              key={ghostEvent.id}
                              type="button"
                              onClick={() => handleOpenGhostEvent(ghostEvent)}
                              className={`w-full rounded border border-dashed p-2 text-left text-[11px] transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${ghostEventClassMap[ghostEvent.kind] ?? 'border-primary/40 bg-primary/10 text-primary'} opacity-90`}
                              title={`${ghostEvent.title} · ${ghostEvent.subtitle}`}
                            >
                              <div className="mb-0.5 flex items-center justify-between gap-2">
                                <span className="font-semibold truncate">
                                  ◌ {ghostEvent.title}
                                </span>
                                <span className="text-[9px] uppercase tracking-wide opacity-80">
                                  trajectory
                                </span>
                              </div>
                              <div className="truncate text-[10px] opacity-80">
                                {ghostEvent.subtitle} · open
                              </div>
                            </button>
                          ))}
                        </>
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
        Object.values(groupedGhostEvents).flat().length === 0 &&
        Object.keys(groupedEvents).length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-secondary">No events scheduled this week</p>
          </div>
        )}
    </div>
  );
}
