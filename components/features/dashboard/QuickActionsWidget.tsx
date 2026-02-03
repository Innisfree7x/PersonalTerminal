'use client';

import { motion } from 'framer-motion';
import { Plus, FileText, Target, GraduationCap, Briefcase, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { memo, useCallback } from 'react';

/**
 * Quick action button configuration
 */
interface QuickAction {
  /** Icon component to display */
  icon: React.ElementType;
  /** Button label text */
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
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-text-primary">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  /**
   * Handle quick action clicks with proper error handling
   * Shows toast notifications for success/error states
   */
  const handleAction = useCallback(async (actionType: string) => {
    try {
      // TODO: Implement actual API calls when endpoints are ready
      // For now, just show a success message
      console.log(`Action: ${actionType}`);
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // TODO: Replace with actual toast notification system (react-hot-toast)
      // For now, log success
      console.log(`✅ ${actionType} action completed successfully`);
    } catch (error) {
      // Proper error handling - never let action handlers crash silently
      console.error(`❌ Failed to ${actionType}:`, error);
      
      // TODO: Show error toast to user
      // toast.error(`Failed to ${actionType}. Please try again.`);
    }
  }, []);

  const actions: QuickAction[] = [
    {
      icon: FileText,
      label: 'Add Task',
      color: 'text-primary',
      bgColor: 'bg-primary/10 hover:bg-primary/20',
      onClick: () => handleAction('add task'),
    },
    {
      icon: Target,
      label: 'New Goal',
      color: 'text-goals-accent',
      bgColor: 'bg-goals-accent/10 hover:bg-goals-accent/20',
      onClick: () => handleAction('create goal'),
    },
    {
      icon: Briefcase,
      label: 'Job App',
      color: 'text-career-accent',
      bgColor: 'bg-career-accent/10 hover:bg-career-accent/20',
      onClick: () => handleAction('add job application'),
    },
    {
      icon: GraduationCap,
      label: 'Course',
      color: 'text-university-accent',
      bgColor: 'bg-university-accent/10 hover:bg-university-accent/20',
      onClick: () => handleAction('add course'),
    },
    {
      icon: Calendar,
      label: 'Event',
      color: 'text-calendar-accent',
      bgColor: 'bg-calendar-accent/10 hover:bg-calendar-accent/20',
      onClick: () => handleAction('add event'),
    },
  ];

  return (
    <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Plus className="w-5 h-5 text-primary" />
        <h3 className="text-base font-semibold text-text-primary">Quick Actions</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={index}
              onClick={action.onClick}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border border-border ${action.bgColor} transition-all`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Icon className={`w-5 h-5 ${action.color}`} />
              <span className="text-xs font-medium text-text-secondary">{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});

export default QuickActionsWidget;
