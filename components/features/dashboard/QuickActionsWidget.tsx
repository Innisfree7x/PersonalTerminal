'use client';

import { motion } from 'framer-motion';
import { Plus, FileText, Target, GraduationCap, Briefcase, Calendar } from 'lucide-react';

interface QuickAction {
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
  onClick: () => void;
}

export default function QuickActionsWidget() {
  const actions: QuickAction[] = [
    {
      icon: FileText,
      label: 'Add Task',
      color: 'text-primary',
      bgColor: 'bg-primary/10 hover:bg-primary/20',
      onClick: () => console.log('Add Task'),
    },
    {
      icon: Target,
      label: 'New Goal',
      color: 'text-goals-accent',
      bgColor: 'bg-goals-accent/10 hover:bg-goals-accent/20',
      onClick: () => console.log('New Goal'),
    },
    {
      icon: Briefcase,
      label: 'Job App',
      color: 'text-career-accent',
      bgColor: 'bg-career-accent/10 hover:bg-career-accent/20',
      onClick: () => console.log('Job Application'),
    },
    {
      icon: GraduationCap,
      label: 'Course',
      color: 'text-university-accent',
      bgColor: 'bg-university-accent/10 hover:bg-university-accent/20',
      onClick: () => console.log('Add Course'),
    },
    {
      icon: Calendar,
      label: 'Event',
      color: 'text-calendar-accent',
      bgColor: 'bg-calendar-accent/10 hover:bg-calendar-accent/20',
      onClick: () => console.log('Add Event'),
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
}
