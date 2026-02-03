'use client';

import { motion } from 'framer-motion';
import { Activity, CheckCircle2, Target, GraduationCap, Briefcase, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui';
import { memo, useEffect, useState } from 'react';
import { getCategoryColorClasses, CategoryType } from '@/lib/utils/colors';

/**
 * Activity item structure for recent user actions
 */
interface ActivityItem {
  /** Unique identifier */
  id: string;
  /** Type of activity */
  type: 'task' | 'goal' | 'exercise' | 'application' | 'note';
  /** Description of the action */
  action: string;
  /** When the activity occurred */
  timestamp: Date;
}

/**
 * Displays recent user activity with icons and timestamps
 * Shows tasks completed, goals added, exercises finished, etc.
 * 
 * @component
 * @example
 * <ActivityFeed 
 *   activities={recentActivities}
 *   maxItems={5}
 * />
 */
interface ActivityFeedProps {
  /** List of activities to display */
  activities?: ActivityItem[];
  /** Maximum number of items to show (default: 5) */
  maxItems?: number;
  /** Show loading skeleton (default: false) */
  isLoading?: boolean;
}

const ActivityFeed = memo(function ActivityFeed({ activities: propActivities, maxItems = 5, isLoading: propIsLoading = false }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>(propActivities || []);
  const [isLoading, setIsLoading] = useState(propIsLoading);

  // Fetch activities from API if not provided via props
  useEffect(() => {
    if (propActivities && propActivities.length > 0) {
      // Use prop activities if provided
      setActivities(propActivities);
      return;
    }

    // Fetch from API
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/activity/recent?limit=${maxItems}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch activities');
        }

        const data = await response.json();
        const parsedActivities = data.activities.map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp),
        }));
        
        setActivities(parsedActivities);
      } catch (err) {
        console.error('ActivityFeed fetch error:', err);
        // Fallback to mock data on error
        setActivities([
          { id: '1', type: 'exercise', action: 'Completed Exercise 3 for GDI 2', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
          { id: '2', type: 'goal', action: 'Added new goal: Learn TypeScript', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
          { id: '3', type: 'task', action: 'Completed task: Review PRs', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        ] as ActivityItem[]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [propActivities, maxItems]);

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'task':
        return CheckCircle2;
      case 'goal':
        return Target;
      case 'exercise':
        return GraduationCap;
      case 'application':
        return Briefcase;
      case 'note':
        return FileText;
      default:
        return Activity;
    }
  };

  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-info" />
        <h3 className="text-base font-semibold text-text-primary">Recent Activity</h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
        {displayActivities.map((activity, index) => {
          const Icon = getIcon(activity.type);
          const colorClasses = getCategoryColorClasses(activity.type as CategoryType);

          return (
            <motion.div
              key={activity.id}
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Icon */}
              <div className={`p-2 rounded-lg ${colorClasses} flex-shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">{activity.action}</p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </p>
              </div>
            </motion.div>
          );
        })}

        {displayActivities.length === 0 && (
          <p className="text-sm text-text-tertiary text-center py-4">No recent activity</p>
        )}
      </div>
      )}
    </div>
  );
});

export default ActivityFeed;
