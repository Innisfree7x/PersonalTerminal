'use client';

import { CalendarEvent } from '@/lib/data/mockEvents';
import EventCard from '@/components/features/calendar/EventCard';
import { format, startOfDay, endOfDay, addMinutes } from 'date-fns';
import { useMemo } from 'react';

type TimeGroup = 'morning' | 'afternoon' | 'evening';

interface FreeSlot {
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
}

function getTimeGroup(hour: number): TimeGroup {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

function groupEventsByTime(events: CalendarEvent[]): Record<TimeGroup, CalendarEvent[]> {
  const groups: Record<TimeGroup, CalendarEvent[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };

  events.forEach((event) => {
    const hour = event.startTime.getHours();
    const group = getTimeGroup(hour);
    groups[group].push(event);
  });

  Object.keys(groups).forEach((key) => {
    groups[key as TimeGroup].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  });

  return groups;
}

function isCurrentEvent(event: CalendarEvent, currentTime: Date): boolean {
  return currentTime >= event.startTime && currentTime <= event.endTime;
}

function calculateFreeSlots(events: CalendarEvent[], currentTime: Date): FreeSlot[] {
  const todayStart = startOfDay(currentTime);
  const todayEnd = endOfDay(currentTime);

  if (events.length === 0) {
    return [{ startTime: todayStart, endTime: todayEnd, duration: 1440 }]; // Full day
  }

  const sortedEvents = [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  const freeSlots: FreeSlot[] = [];

  // Before first event
  const firstEvent = sortedEvents[0];
  if (firstEvent.startTime > todayStart) {
    const duration = Math.round((firstEvent.startTime.getTime() - todayStart.getTime()) / (1000 * 60));
    if (duration >= 60) {
      freeSlots.push({ startTime: todayStart, endTime: firstEvent.startTime, duration });
    }
  }

  // Between events
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const current = sortedEvents[i];
    const next = sortedEvents[i + 1];
    const gapStart = current.endTime;
    const gapEnd = next.startTime;

    if (gapEnd > gapStart) {
      const duration = Math.round((gapEnd.getTime() - gapStart.getTime()) / (1000 * 60));
      if (duration >= 60) {
        freeSlots.push({ startTime: gapStart, endTime: gapEnd, duration });
      }
    }
  }

  // After last event
  const lastEvent = sortedEvents[sortedEvents.length - 1];
  if (lastEvent.endTime < todayEnd) {
    const duration = Math.round((todayEnd.getTime() - lastEvent.endTime.getTime()) / (1000 * 60));
    if (duration >= 60) {
      freeSlots.push({ startTime: lastEvent.endTime, endTime: todayEnd, duration });
    }
  }

  return freeSlots;
}

function getFreeSlotSuggestion(slot: FreeSlot, currentTime: Date): string {
  const hour = slot.startTime.getHours();
  if (hour >= 9 && hour < 12) {
    return '☕ Good for: Deep work, Important calls';
  } else if (hour >= 14 && hour < 17) {
    return '🏋️ Suggested: Gym, Errands';
  } else if (hour >= 20) {
    return '📚 Time for: Study, Side projects';
  }
  return 'Free time available';
}

interface ScheduleColumnProps {
  events: CalendarEvent[];
  currentTime: Date | null;
  isConnected: boolean | null;
  isLoading: boolean;
  onConnect: () => void;
  onRefresh: () => void;
  onDisconnect: () => void;
  isRefreshing: boolean;
  isDisconnecting: boolean;
}

export default function ScheduleColumn({
  events,
  currentTime,
  isConnected,
  isLoading,
  onConnect,
  onRefresh,
  onDisconnect,
  isRefreshing,
  isDisconnecting,
}: ScheduleColumnProps) {
  const groupedEvents = useMemo(() => groupEventsByTime(events), [events]);

  const currentEvent = useMemo(() => {
    if (!currentTime) return null;
    return events.find((event) => isCurrentEvent(event, currentTime)) || null;
  }, [events, currentTime]);

  const freeSlots = useMemo(() => {
    if (!currentTime || events.length === 0) return [];
    return calculateFreeSlots(events, currentTime);
  }, [events, currentTime]);

  const timeGroupLabels: Record<TimeGroup, string> = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  if (isConnected === false) {
    return (
      <div className="bg-gray-900/50 dark:bg-gray-800/50 rounded-lg border border-gray-700 dark:border-gray-700 p-4 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-400 mb-4">
          Connect Google Calendar to see your schedule
        </p>
        <button
          onClick={onConnect}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Connect
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-900/50 dark:bg-gray-800/50 rounded-lg border border-gray-700 dark:border-gray-700 p-4 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-400">Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 dark:bg-gray-800/50 rounded-lg border border-gray-700 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-100 dark:text-gray-100">Schedule</h2>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-xs text-gray-400 hover:text-gray-300"
            title="Refresh"
          >
            ↻
          </button>
          <button
            onClick={onDisconnect}
            disabled={isDisconnecting}
            className="text-xs text-gray-400 hover:text-red-400"
            title="Disconnect"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Current Event Banner */}
      {currentEvent && (
        <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <div>
              <div className="text-sm font-semibold text-blue-300 dark:text-blue-300">
                Now: {currentEvent.title}
              </div>
              <div className="text-xs text-blue-400 dark:text-blue-400 font-mono">
                {format(currentEvent.startTime, 'HH:mm')} -{' '}
                {format(currentEvent.endTime, 'HH:mm')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Events Timeline */}
      <div className="space-y-6">
        {(Object.keys(groupedEvents) as TimeGroup[]).map((group) => {
          const groupEvents = groupedEvents[group];
          const groupFreeSlots = freeSlots.filter((slot) => {
            const hour = slot.startTime.getHours();
            return getTimeGroup(hour) === group;
          });

          if (groupEvents.length === 0 && groupFreeSlots.length === 0) return null;

          return (
            <div key={group}>
              <h3 className="text-sm font-semibold text-gray-300 dark:text-gray-300 mb-3">
                {timeGroupLabels[group]}
              </h3>
              <div className="space-y-2">
                {/* Events */}
                {groupEvents.map((event, index) => {
                  const isCurrent = currentTime ? isCurrentEvent(event, currentTime) : false;
                  const isNext = index === 0 && groupEvents[0].startTime > (currentTime || new Date());

                  return (
                    <div key={event.id} className="relative">
                      {isNext && (
                        <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[10px] px-1.5 py-0.5 rounded font-bold z-10">
                          Next
                        </div>
                      )}
                      <EventCard event={event} isCurrent={isCurrent} />
                    </div>
                  );
                })}

                {/* Free Slots */}
                {groupFreeSlots.map((slot, slotIndex) => (
                  <div
                    key={`free-${group}-${slotIndex}`}
                    className="p-3 bg-gray-800/50 dark:bg-gray-900/50 border border-gray-700 dark:border-gray-700 rounded-lg border-dashed"
                  >
                    <div className="text-sm font-medium text-gray-400 dark:text-gray-400 font-mono mb-1">
                      Free: {format(slot.startTime, 'HH:mm')} - {format(slot.endTime, 'HH:mm')} (
                      {formatDuration(slot.duration)})
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {getFreeSlotSuggestion(slot, currentTime || new Date())}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {events.length === 0 && freeSlots.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-500">No events scheduled today</p>
        </div>
      )}
    </div>
  );
}
