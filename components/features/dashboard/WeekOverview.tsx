'use client';

import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { useState } from 'react';
import { Skeleton } from '@/components/ui';

interface DayEvent {
  date: Date;
  count: number;
  type: 'none' | 'low' | 'medium' | 'high';
}

interface WeekOverviewProps {
  events?: DayEvent[];
  isLoading?: boolean;
}

export default function WeekOverview({ events = [], isLoading = false }: WeekOverviewProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-calendar-accent" />
            <h3 className="text-base font-semibold text-text-primary">Week Overview</h3>
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="w-6 h-6 rounded" />
            <Skeleton className="w-6 h-6 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    );
  }
  const [weekOffset, setWeekOffset] = useState(0);

  const getWeekDays = () => {
    const start = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const weekDays = getWeekDays();

  const getEventCount = (date: Date) => {
    const event = events.find((e) => isSameDay(e.date, date));
    return event?.count || 0;
  };

  const getEventType = (date: Date): 'none' | 'low' | 'medium' | 'high' => {
    const count = getEventCount(date);
    if (count === 0) return 'none';
    if (count === 1) return 'low';
    if (count === 2) return 'medium';
    return 'high';
  };

  const getEventColor = (type: 'none' | 'low' | 'medium' | 'high') => {
    switch (type) {
      case 'none':
        return 'bg-surface-hover border-border';
      case 'low':
        return 'bg-success/20 border-success/50';
      case 'medium':
        return 'bg-warning/20 border-warning/50';
      case 'high':
        return 'bg-error/20 border-error/50';
    }
  };

  const getEventDot = (type: 'none' | 'low' | 'medium' | 'high') => {
    switch (type) {
      case 'none':
        return null;
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🔴';
    }
  };

  return (
    <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-calendar-accent" />
          <h3 className="text-base font-semibold text-text-primary">Week Overview</h3>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="p-1 rounded hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="p-1 rounded hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, index) => {
          const eventType = getEventType(day);
          const eventDot = getEventDot(eventType);
          const today = isToday(day);

          return (
            <motion.div
              key={day.toISOString()}
              className={`relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                today
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : getEventColor(eventType)
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
            >
              {/* Day name */}
              <span className="text-[10px] font-medium text-text-tertiary uppercase">
                {format(day, 'EEE')}
              </span>

              {/* Date */}
              <span
                className={`text-lg font-bold ${
                  today ? 'text-primary' : 'text-text-primary'
                }`}
              >
                {format(day, 'd')}
              </span>

              {/* Event indicator */}
              {eventDot && (
                <span className="text-xs" title={`${getEventCount(day)} event(s)`}>
                  {eventDot}
                </span>
              )}

              {/* Today label */}
              {today && (
                <div className="absolute -top-1 -right-1">
                  <motion.span
                    className="flex h-3 w-3"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </motion.span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-text-tertiary">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-surface-hover"></span> None
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-success"></span> 1
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-warning"></span> 2
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-error"></span> 3+
        </span>
      </div>
    </div>
  );
}
