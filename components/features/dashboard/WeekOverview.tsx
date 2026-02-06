'use client';

import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { useState, memo, useCallback, useEffect } from 'react';
import { Skeleton } from '@/components/ui';
import { getEventDensityColor, getEventDensityEmoji, EventDensity } from '@/lib/utils/colors';

/**
 * Day event data for calendar display
 */
interface DayEvent {
  /** Date of the events */
  date: Date;
  /** Number of events on this day */
  count: number;
  /** Event density classification */
  type: 'none' | 'low' | 'medium' | 'high';
}

/**
 * Mini weekly calendar with event density visualization
 * Shows 7 days with color-coded indicators for event load
 * 
 * @component
 * @example
 * <WeekOverview 
 *   events={weekEvents}
 * />
 */
interface WeekOverviewProps {
  /** Array of day events with counts */
  events?: DayEvent[];
  /** Show loading skeleton (default: false) */
  isLoading?: boolean;
}

const WeekOverview = memo(function WeekOverview({ events: propEvents, isLoading: propIsLoading = false }: WeekOverviewProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [events, setEvents] = useState<DayEvent[]>(propEvents || []);
  const [isLoading, setIsLoading] = useState(propIsLoading);

  // Fetch week events from API if not provided via props
  useEffect(() => {
    if (propEvents && propEvents.length > 0) {
      setEvents(propEvents);
      return;
    }

    const fetchWeekEvents = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/dashboard/week-events?offset=${weekOffset}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch week events');
        }

        const data = await response.json();
        const parsedEvents = data.events.map((event: any) => ({
          ...event,
          date: new Date(event.date),
        }));
        
        setEvents(parsedEvents);
      } catch (err) {
        console.error('WeekOverview fetch error:', err);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeekEvents();
  }, [weekOffset, propEvents]);

  // Define functions (ALWAYS, not conditionally!)
  const getWeekDays = () => {
    const start = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const weekDays = getWeekDays();

  const getEventCount = (date: Date) => {
    const event = events.find((e) => isSameDay(e.date, date));
    return event?.count || 0;
  };

  const getEventType = (date: Date): EventDensity => {
    const count = getEventCount(date);
    if (count === 0) return 'none';
    if (count === 1) return 'low';
    if (count === 2) return 'medium';
    return 'high';
  };

  // Memoized navigation handlers
  const handlePrevWeek = useCallback(() => {
    setWeekOffset((prev) => prev - 1);
  }, []);

  const handleNextWeek = useCallback(() => {
    setWeekOffset((prev) => prev + 1);
  }, []);

  return (
    <div className="card-surface rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-calendar-accent" />
          <h3 className="text-base font-semibold text-text-primary">Week Overview</h3>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            onClick={handlePrevWeek}
            className="p-1 rounded hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="View previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={handleNextWeek}
            className="p-1 rounded hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="View next week"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {isLoading ? (
        <>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <Skeleton className="h-3 w-full" />
          </div>
        </>
      ) : (
        <>
          {/* Week grid */}
          <div 
            className="grid grid-cols-7 gap-2"
            role="list"
            aria-label="Week overview calendar"
          >
        {weekDays.map((day, index) => {
          const eventType = getEventType(day);
          const eventDot = getEventDensityEmoji(eventType);
          const today = isToday(day);

          return (
            <motion.div
              key={day.toISOString()}
              className={`relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                today
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : getEventDensityColor(eventType)
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              role="listitem"
              aria-label={`${format(day, 'EEEE, MMMM d')}${today ? ' (Today)' : ''}: ${getEventCount(day)} event${getEventCount(day) !== 1 ? 's' : ''}`}
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
        </>
      )}
    </div>
  );
});

export default WeekOverview;
