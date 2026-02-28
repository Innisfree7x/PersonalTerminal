'use client';

import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { useState, memo, useCallback, useEffect } from 'react';
import { Skeleton } from '@/components/ui';
import { getEventDensityColor, EventDensity } from '@/lib/utils/colors';
import { fetchDashboardWeekEventsAction } from '@/app/actions/dashboard';

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
        const data = await fetchDashboardWeekEventsAction(weekOffset);
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

  const getDensityDot = (type: EventDensity): string => {
    switch (type) {
      case 'low':
        return 'bg-emerald-400/80';
      case 'medium':
        return 'bg-amber-400/80';
      case 'high':
        return 'bg-red-400/80';
      default:
        return 'bg-transparent';
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl bg-surface/25 p-4 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-sky-300" />
          <h3 className="text-sm font-semibold text-text-primary">Week Overview</h3>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            onClick={handlePrevWeek}
            className="rounded p-1 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.9 }}
            aria-label="View previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={handleNextWeek}
            className="rounded p-1 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.9 }}
            aria-label="View next week"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {isLoading ? (
        <>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-md" />
            ))}
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <Skeleton className="h-3 w-full" />
          </div>
        </>
      ) : (
        <>
          {/* Week grid */}
          <div 
            className="grid grid-cols-7 gap-1.5"
            role="list"
            aria-label="Week overview calendar"
          >
        {weekDays.map((day, index) => {
          const eventType = getEventType(day);
          const today = isToday(day);

          return (
            <motion.div
              key={day.toISOString()}
              className={`relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-md border transition-colors ${
                today
                  ? 'border-primary/60 bg-primary/[0.12]'
                  : getEventDensityColor(eventType)
              }`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.18 }}
              whileHover={{ y: -1 }}
              role="listitem"
              aria-label={`${format(day, 'EEEE, MMMM d')}${today ? ' (Today)' : ''}: ${getEventCount(day)} event${getEventCount(day) !== 1 ? 's' : ''}`}
            >
              {/* Day name */}
              <span className="text-[9px] font-medium uppercase text-text-tertiary">
                {format(day, 'EEE')}
              </span>

              {/* Date */}
              <span
                className={`text-sm font-semibold ${
                  today ? 'text-primary' : 'text-text-primary'
                }`}
              >
                {format(day, 'd')}
              </span>

              {/* Event indicator */}
              {eventType !== 'none' && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${getDensityDot(eventType)}`}
                  title={`${getEventCount(day)} event(s)`}
                />
              )}

              {/* Today label */}
              {today && (
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </motion.div>
          );
        })}
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[10px] text-text-tertiary">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-surface-hover"></span> 0
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400/80"></span> 1
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-400/80"></span> 2
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-400/80"></span> 3+
        </span>
          </div>
        </>
      )}
    </div>
  );
});

export default WeekOverview;
