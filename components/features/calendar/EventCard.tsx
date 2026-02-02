'use client';

import { CalendarEvent } from '@/lib/data/mockEvents';
import { format } from 'date-fns';

interface EventCardProps {
  event: CalendarEvent;
  isCurrent?: boolean;
}

const eventTypeConfig: Record<CalendarEvent['type'], { icon: string; color: string; bgColor: string }> = {
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

function getDuration(startTime: Date, endTime: Date): string {
  const minutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export default function EventCard({ event, isCurrent = false }: EventCardProps) {
  const config = eventTypeConfig[event.type];
  const duration = getDuration(event.startTime, event.endTime);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 p-4 transition-all hover:shadow-md ${
        isCurrent
          ? 'border-blue-500 dark:border-blue-400 shadow-lg ring-2 ring-blue-200 dark:ring-blue-900/50'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Time Column */}
        <div className="flex-shrink-0 text-right min-w-[80px]">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {format(event.startTime, 'HH:mm')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {format(event.endTime, 'HH:mm')}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {duration}
          </div>
        </div>

        {/* Event Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{config.icon}</span>
            <h3 className={`text-base font-semibold ${isCurrent ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
              {event.title}
            </h3>
          </div>
          
          <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${config.bgColor} ${config.color}`}>
            {event.type}
          </span>

          {event.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {event.description}
            </p>
          )}

          {isCurrent && (
            <div className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">
              ● Current
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
