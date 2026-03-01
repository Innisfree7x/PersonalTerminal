'use client';

import type { CalendarEvent } from '@/lib/types/calendar';
import EventCard from '@/components/features/calendar/EventCard';
import { format, startOfDay, endOfDay } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, RefreshCw, X, Clock, Zap, Sunrise, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

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
    return [{ startTime: todayStart, endTime: todayEnd, duration: 1440 }];
  }

  const sortedEvents = [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  const freeSlots: FreeSlot[] = [];

  const firstEvent = sortedEvents[0];
  if (firstEvent && firstEvent.startTime > todayStart) {
    const duration = Math.round((firstEvent.startTime.getTime() - todayStart.getTime()) / (1000 * 60));
    if (duration >= 60) {
      freeSlots.push({ startTime: todayStart, endTime: firstEvent.startTime, duration });
    }
  }

  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const current = sortedEvents[i];
    const next = sortedEvents[i + 1];
    if (!current || !next) continue;
    const gapStart = current.endTime;
    const gapEnd = next.startTime;

    if (gapEnd > gapStart) {
      const duration = Math.round((gapEnd.getTime() - gapStart.getTime()) / (1000 * 60));
      if (duration >= 60) {
        freeSlots.push({ startTime: gapStart, endTime: gapEnd, duration });
      }
    }
  }

  const lastEvent = sortedEvents[sortedEvents.length - 1];
  if (lastEvent && lastEvent.endTime < todayEnd) {
    const duration = Math.round((todayEnd.getTime() - lastEvent.endTime.getTime()) / (1000 * 60));
    if (duration >= 60) {
      freeSlots.push({ startTime: lastEvent.endTime, endTime: todayEnd, duration });
    }
  }

  return freeSlots;
}

function getFreeSlotSuggestion(slot: FreeSlot): string {
  const hour = slot.startTime.getHours();
  if (hour >= 9 && hour < 12) return '☕ Deep work, Important calls';
  if (hour >= 14 && hour < 17) return '🏋️ Gym, Errands';
  if (hour >= 20) return '📚 Study, Side projects';
  return 'Free time available';
}

interface ScheduleColumnProps {
  events: CalendarEvent[];
  currentTime?: Date | null;
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
  const [localTime, setLocalTime] = useState<Date | null>(null);

  useEffect(() => {
    setLocalTime(new Date());
    const timer = setInterval(() => {
      setLocalTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const activeTime = currentTime ?? localTime ?? new Date();

  const groupedEvents = useMemo(() => groupEventsByTime(events), [events]);

  const currentEvent = useMemo(() => {
    return events.find((event) => isCurrentEvent(event, activeTime)) || null;
  }, [events, activeTime]);

  const freeSlots = useMemo(() => {
    if (events.length === 0) return [];
    return calculateFreeSlots(events, activeTime);
  }, [events, activeTime]);

  const freeSlotsByGroup = useMemo(() => {
    const grouped: Record<TimeGroup, FreeSlot[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };

    freeSlots.forEach((slot) => {
      grouped[getTimeGroup(slot.startTime.getHours())].push(slot);
    });

    return grouped;
  }, [freeSlots]);

  const timeGroupLabels: Record<TimeGroup, { label: string; Icon: React.ElementType }> = {
    morning: { label: 'Morning', Icon: Sunrise },
    afternoon: { label: 'Afternoon', Icon: Sun },
    evening: { label: 'Evening', Icon: Moon },
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  if (isConnected === false) {
    return (
      <div className="card-surface p-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="p-4 rounded-2xl bg-primary/[0.08] border border-primary/20">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">Connect Calendar</h3>
        <p className="text-sm text-text-secondary mb-6">
          Sync with Google Calendar to see your schedule
        </p>
        <Button onClick={onConnect} variant="primary">
          <Calendar className="w-4 h-4 mr-2" />
          Connect Google Calendar
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card-surface p-8 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
        <p className="text-sm text-text-tertiary">Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className="card-surface p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Schedule
        </h2>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDisconnect}
            disabled={isDisconnecting}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Current Event Banner */}
      {currentEvent && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="primary" size="sm">NOW</Badge>
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div className="text-sm font-semibold text-text-primary mb-1">
              {currentEvent.title}
            </div>
            <div className="text-xs text-text-secondary font-mono">
              {format(currentEvent.startTime, 'HH:mm')} - {format(currentEvent.endTime, 'HH:mm')}
            </div>
          </div>
        </motion.div>
      )}

      {/* Events Timeline */}
      <div className="space-y-6">
        {(Object.keys(groupedEvents) as TimeGroup[]).map((group) => {
          const groupEvents = groupedEvents[group];
          const groupFreeSlots = freeSlotsByGroup[group];

          if (groupEvents.length === 0 && groupFreeSlots.length === 0) return null;

          return (
            <motion.div
              key={group}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Time Group Header */}
              <div className="flex items-center gap-2 mb-3">
                {React.createElement(timeGroupLabels[group].Icon, { className: 'w-3.5 h-3.5 text-text-tertiary' })}
                <h3 className="text-sm font-semibold text-text-secondary">
                  {timeGroupLabels[group].label}
                </h3>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Timeline Items */}
              <div className="space-y-3 pl-4 border-l-2 border-border">
                {/* Events */}
                {groupEvents.map((event, index) => {
                  const isCurrent = isCurrentEvent(event, activeTime);
                  const firstGroupEvent = groupEvents[0];
                  const isNext = index === 0 && firstGroupEvent && firstGroupEvent.startTime > activeTime;

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative -ml-[9px]"
                    >
                      {/* Timeline dot */}
                      <div className={`absolute -left-[7px] top-3 w-4 h-4 rounded-full border-2 ${isCurrent
                          ? 'bg-primary border-primary shadow-glow'
                          : isNext
                            ? 'bg-warning border-warning'
                            : 'bg-surface border-border'
                        }`} />

                      <div className="pl-6">
                        {isNext && (
                          <Badge variant="warning" size="sm" className="mb-2">
                            Up Next
                          </Badge>
                        )}
                        <EventCard event={event} isCurrent={isCurrent} />
                      </div>
                    </motion.div>
                  );
                })}

                {/* Free Slots */}
                {groupFreeSlots.map((slot, slotIndex) => (
                  <motion.div
                    key={`free-${group}-${slotIndex}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (groupEvents.length + slotIndex) * 0.05 }}
                    className="relative -ml-[9px]"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-[7px] top-3 w-4 h-4 rounded-full border-2 border-dashed border-border bg-transparent" />

                    <div className="pl-6">
                      <div className="p-3 bg-surface-hover/50 border border-dashed border-border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-3 h-3 text-success" />
                          <div className="text-xs font-medium text-text-secondary font-mono">
                            {format(slot.startTime, 'HH:mm')} - {format(slot.endTime, 'HH:mm')}
                            <span className="text-text-tertiary ml-1">({formatDuration(slot.duration)})</span>
                          </div>
                        </div>
                        <div className="text-xs text-text-tertiary">
                          {getFreeSlotSuggestion(slot)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {events.length === 0 && freeSlots.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="mb-3 flex justify-center">
            <div className="p-3 rounded-xl bg-surface border border-border">
              <Calendar className="w-6 h-6 text-text-tertiary" />
            </div>
          </div>
          <p className="text-sm font-medium text-text-secondary mb-1">Free day</p>
          <p className="text-xs text-text-tertiary">No events scheduled today</p>
        </motion.div>
      )}
    </div>
  );
}
