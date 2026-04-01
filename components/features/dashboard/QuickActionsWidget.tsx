'use client';

import { motion } from 'framer-motion';
import { Plus, FileText, Target, GraduationCap, Briefcase, Calendar, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface QuickActionsWidgetProps {
  isLoading?: boolean;
}

const secondaryActions = [
  { icon: Target, label: 'New Goal', href: '/goals' },
  { icon: Briefcase, label: 'Job App', href: '/career' },
  { icon: GraduationCap, label: 'Course', href: '/university' },
  { icon: Calendar, label: 'Event', href: '/calendar' },
] as const;

const QuickActionsWidget = memo(function QuickActionsWidget({ isLoading = false }: QuickActionsWidgetProps) {
  const router = useRouter();

  const handleAction = useCallback((page: string) => {
    router.push(page);
  }, [router]);

  if (isLoading) {
    return (
      <div className="card-warm rounded-xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary/75" />
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-text-tertiary">Quick Actions</h3>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-12 rounded-xl" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-warm rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-primary/75" />
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-text-tertiary">Quick Actions</h3>
      </div>

      <motion.button
        onClick={() => handleAction('/today')}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-primary/[0.08] text-primary transition-all hover:bg-primary/[0.14] hover:border-primary/35"
        whileTap={{ scale: 0.98 }}
        aria-label="Add Task"
      >
        <FileText className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm font-semibold">Add Task</span>
        <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-50" />
      </motion.button>

      <div className="grid grid-cols-2 gap-2">
        {secondaryActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              onClick={() => handleAction(action.href)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/80 bg-surface-hover/45 text-text-secondary transition-colors hover:border-primary/30 hover:bg-primary/[0.08] hover:text-text-primary"
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              aria-label={action.label}
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-xs font-medium">{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});

export default QuickActionsWidget;
