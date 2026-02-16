'use client';

import { motion } from 'framer-motion';
import { Clock, Sunrise, Sun, Moon } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { memo, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fetchDashboardFocusTimeAction } from '@/app/actions/dashboard';

/**
 * Time block configuration for a period of the day
 */
interface TimeBlock {
  period: 'morning' | 'afternoon' | 'evening';
  label: string;
  hours: string;
  progress: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

/**
 * Visualizes focus time across morning, afternoon, and evening periods
 * Shows progress bars for each time block with "NOW" indicator
 * 
 * @component
 * @example
 * <TimeBlockVisualizer 
 *   morningProgress={75}
 *   afternoonProgress={30}
 *   eveningProgress={0}
 * />
 */
interface TimeBlockVisualizerProps {
  /** Morning focus time progress (0-100) */
  morningProgress?: number;
  /** Afternoon focus time progress (0-100) */
  afternoonProgress?: number;
  /** Evening focus time progress (0-100) */
  eveningProgress?: number;
  /** Show loading skeleton (default: false) */
  isLoading?: boolean;
}

const TimeBlockVisualizer = memo(function TimeBlockVisualizer({
  morningProgress: propMorningProgress,
  afternoonProgress: propAfternoonProgress,
  eveningProgress: propEveningProgress,
  isLoading: propIsLoading = false,
}: TimeBlockVisualizerProps) {
  const [morningProgress, setMorningProgress] = useState(propMorningProgress || 0);
  const [afternoonProgress, setAfternoonProgress] = useState(propAfternoonProgress || 0);
  const [eveningProgress, setEveningProgress] = useState(propEveningProgress || 0);
  const [isLoading, setIsLoading] = useState(propIsLoading);

  // Fetch focus time from API if not provided via props
  useEffect(() => {
    if (propMorningProgress !== undefined || propAfternoonProgress !== undefined || propEveningProgress !== undefined) {
      // Use prop values if provided
      setMorningProgress(propMorningProgress || 0);
      setAfternoonProgress(propAfternoonProgress || 0);
      setEveningProgress(propEveningProgress || 0);
      return;
    }

    // Fetch from API
    const fetchFocusTime = async () => {
      try {
        setIsLoading(true);
        const today = format(new Date(), 'yyyy-MM-dd');
        const data = await fetchDashboardFocusTimeAction(today);
        setMorningProgress(data.morning || 0);
        setAfternoonProgress(data.afternoon || 0);
        setEveningProgress(data.evening || 0);
      } catch (err) {
        console.error('TimeBlock fetch error:', err);
        // Keep default values (0) on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchFocusTime();
  }, [propMorningProgress, propAfternoonProgress, propEveningProgress]);

  // Define time blocks (ALWAYS, not conditionally!)
  const timeBlocks: TimeBlock[] = [
    {
      period: 'morning',
      label: 'Morning',
      hours: '6AM - 12PM',
      progress: morningProgress,
      icon: Sunrise,
      color: 'text-warning',
      bgColor: 'bg-warning',
    },
    {
      period: 'afternoon',
      label: 'Afternoon',
      hours: '12PM - 6PM',
      progress: afternoonProgress,
      icon: Sun,
      color: 'text-calendar-accent',
      bgColor: 'bg-calendar-accent',
    },
    {
      period: 'evening',
      label: 'Evening',
      hours: '6PM - 12AM',
      progress: eveningProgress,
      icon: Moon,
      color: 'text-info',
      bgColor: 'bg-info',
    },
  ];

  // Determine current period
  const getCurrentPeriod = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  };

  const currentPeriod = getCurrentPeriod();

  return (
    <div className="card-surface rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-info" />
        <h3 className="text-base font-semibold text-text-primary">Focus Time Today</h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3 bg-surface-hover rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="mt-1 text-right">
                <Skeleton className="h-3 w-8 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
        {timeBlocks.map((block, index) => {
          const Icon = block.icon;
          const isCurrent = block.period === currentPeriod;

          return (
            <motion.div
              key={block.period}
              className={`relative overflow-hidden rounded-lg border ${
                isCurrent ? 'border-primary ring-2 ring-primary/20' : 'border-border'
              } bg-surface-hover p-3 transition-all`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              role="listitem"
              aria-label={`${block.label} (${block.hours})${isCurrent ? ' - Current period' : ''}: ${block.progress}% complete`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${block.color}`} />
                  <span className="text-sm font-medium text-text-primary">{block.label}</span>
                  {isCurrent && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                      NOW
                    </span>
                  )}
                </div>
                <span className="text-xs text-text-tertiary">{block.hours}</span>
              </div>

              {/* Progress bar */}
              <div 
                className="relative h-2 bg-background rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={block.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${block.label} progress`}
              >
                <motion.div
                  className={`absolute inset-y-0 left-0 ${block.bgColor} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${block.progress}%` }}
                  transition={{ duration: 1, delay: index * 0.1 + 0.3, ease: 'easeOut' }}
                />
              </div>

              {/* Percentage */}
              <div className="mt-1 text-right">
                <motion.span
                  className={`text-xs font-bold ${block.color}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                >
                  {block.progress}%
                </motion.span>
              </div>
            </motion.div>
          );
        })}
        </div>
      )}

      {/* Summary */}
      {!isLoading && (
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Total Focus Time:</span>
          <span className="font-bold text-text-primary">
            {Math.round((morningProgress + afternoonProgress + eveningProgress) / 3)}%
          </span>
        </div>
      </div>
      )}
    </div>
  );
});

export default TimeBlockVisualizer;
