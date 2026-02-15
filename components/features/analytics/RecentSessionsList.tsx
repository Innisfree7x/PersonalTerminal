'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { FocusSession } from '@/lib/schemas/focusSession.schema';

interface RecentSessionsListProps {
  sessions: FocusSession[];
}

const CATEGORY_EMOJIS: Record<string, string> = {
  study: '📚',
  work: '💼',
  exercise: '💪',
  reading: '📖',
  other: '✨',
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const RecentSessionsList = memo(function RecentSessionsList({
  sessions,
}: RecentSessionsListProps) {
  if (sessions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card-surface rounded-xl p-8 text-center"
      >
        <Clock className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
        <p className="text-sm text-text-tertiary">No focus sessions yet. Start your first timer!</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="card-surface rounded-xl overflow-hidden"
    >
      <div className="px-5 py-3 border-b border-border/50">
        <h3 className="text-sm font-medium text-text-primary">Recent Sessions</h3>
      </div>
      <div className="divide-y divide-border/30">
        {sessions.slice(0, 10).map((session, i) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.03 }}
            className="flex items-center gap-3 px-5 py-3 hover:bg-surface-hover/50 transition-colors"
          >
            <div className="text-base">
              {CATEGORY_EMOJIS[session.category || 'other'] || '✨'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-primary truncate">
                  {session.label || (session.category ? session.category.charAt(0).toUpperCase() + session.category.slice(1) : 'Focus Session')}
                </span>
                {session.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-text-tertiary">
                {format(session.startedAt, 'MMM d, HH:mm')}
              </p>
            </div>
            <div className="text-sm font-mono text-text-secondary">
              {formatDuration(session.durationSeconds)}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});

export default RecentSessionsList;
