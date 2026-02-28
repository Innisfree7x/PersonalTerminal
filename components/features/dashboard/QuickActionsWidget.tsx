'use client';

import { motion } from 'framer-motion';
import { FileText, Target, GraduationCap, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Quick action button configuration
 */
interface QuickAction {
  /** Icon component to display */
  icon: React.ElementType;
  /** Accessible label text */
  label: string;
  /** Text color class */
  color: string;
  /** Background color class */
  bgColor: string;
  /** Click handler */
  onClick: () => void;
}

/**
 * Quick action buttons for common tasks
 * Provides easy access to add tasks, goals, applications, courses, and events
 * 
 * @component
 * @example
 * <QuickActionsWidget />
 */
interface QuickActionsWidgetProps {
  /** Show loading skeleton (default: false) */
  isLoading?: boolean;
}

const QuickActionsWidget = memo(function QuickActionsWidget({ isLoading = false }: QuickActionsWidgetProps) {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS!
  const router = useRouter();

  /**
   * Navigate to the appropriate page for each action
   */
  const handleAction = useCallback((page: string) => {
    router.push(page);
  }, [router]);

  // Loading state - conditional RENDERING after all hooks!
  if (isLoading) {
    return (
      <div className="rounded-xl bg-surface/25 p-3 backdrop-blur-sm">
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const actions: QuickAction[] = [
    {
      icon: FileText,
      label: 'Add Task',
      color: 'text-red-300',
      bgColor: 'bg-red-500/10 hover:bg-red-500/20',
      onClick: () => handleAction('/today'), // Navigate to Today page
    },
    {
      icon: Target,
      label: 'New Goal',
      color: 'text-orange-300',
      bgColor: 'bg-orange-500/10 hover:bg-orange-500/20',
      onClick: () => handleAction('/goals'), // Navigate to Goals page
    },
    {
      icon: Briefcase,
      label: 'Job App',
      color: 'text-sky-300',
      bgColor: 'bg-sky-500/10 hover:bg-sky-500/20',
      onClick: () => handleAction('/career'), // Navigate to Career page
    },
    {
      icon: GraduationCap,
      label: 'Course',
      color: 'text-amber-300',
      bgColor: 'bg-amber-500/10 hover:bg-amber-500/20',
      onClick: () => handleAction('/university'), // Navigate to University page
    },
  ];

  return (
    <div className="rounded-xl bg-surface/25 p-3 backdrop-blur-sm">
      <div className="grid grid-cols-4 gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={index}
              onClick={action.onClick}
              className={`flex h-10 items-center justify-center rounded-lg ${action.bgColor} transition-colors`}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.16 }}
              aria-label={action.label}
              title={action.label}
            >
              <Icon className={`h-4 w-4 ${action.color}`} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});

export default QuickActionsWidget;
