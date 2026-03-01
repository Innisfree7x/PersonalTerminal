'use client';

import { motion } from 'framer-motion';
import { AlertCircle, Target, Briefcase, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';

interface Deadline {
  id: string;
  title: string;
  subtitle?: string;
  date: Date;
  daysUntil: number;
  type: 'exam' | 'goal' | 'interview';
}

interface UpcomingDeadlinesProps {
  goals: Array<{
    id: string;
    title: string;
    targetDate: string;
    daysUntil: number;
  }>;
  interviews: Array<{
    id: string;
    company: string;
    position: string;
    interviewDate: string;
    daysUntil: number;
  }>;
  exams: Array<{
    name: string;
    examDate?: string;
    daysUntilExam?: number;
  }>;
}

export default function UpcomingDeadlines({ goals, interviews, exams }: UpcomingDeadlinesProps) {
  // Build unified deadline list
  const deadlines: Deadline[] = [];

  exams.forEach((exam) => {
    if (exam.examDate && exam.daysUntilExam !== undefined && exam.daysUntilExam >= 0) {
      deadlines.push({
        id: `exam-${exam.name}`,
        title: exam.name,
        subtitle: 'Exam',
        date: new Date(exam.examDate),
        daysUntil: exam.daysUntilExam,
        type: 'exam',
      });
    }
  });

  goals.forEach((goal) => {
    deadlines.push({
      id: `goal-${goal.id}`,
      title: goal.title,
      date: new Date(goal.targetDate),
      daysUntil: goal.daysUntil,
      type: 'goal',
    });
  });

  interviews.forEach((interview) => {
    deadlines.push({
      id: `interview-${interview.id}`,
      title: interview.company,
      subtitle: interview.position,
      date: new Date(interview.interviewDate),
      daysUntil: interview.daysUntil,
      type: 'interview',
    });
  });

  // Sort by date
  deadlines.sort((a, b) => a.daysUntil - b.daysUntil);

  if (deadlines.length === 0) return null;

  const getIcon = (type: Deadline['type']) => {
    switch (type) {
      case 'exam': return GraduationCap;
      case 'goal': return Target;
      case 'interview': return Briefcase;
    }
  };

  const getColor = (type: Deadline['type']) => {
    switch (type) {
      case 'exam': return 'text-university-accent';
      case 'goal': return 'text-goals-accent';
      case 'interview': return 'text-career-accent';
    }
  };

  const getBgColor = (type: Deadline['type']) => {
    switch (type) {
      case 'exam': return 'bg-university-accent/10';
      case 'goal': return 'bg-goals-accent/10';
      case 'interview': return 'bg-career-accent/10';
    }
  };

  return (
    <div className="card-surface rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-warning" />
        <h3 className="text-base font-semibold text-text-primary">Upcoming</h3>
      </div>

      <div className="space-y-2">
        {deadlines.slice(0, 6).map((deadline, index) => {
          const Icon = getIcon(deadline.type);
          const isUrgent = deadline.daysUntil <= 3;

          return (
            <motion.div
              key={deadline.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                isUrgent
                  ? 'border-error/30 bg-error/5'
                  : 'border-border bg-surface-hover/50'
              }`}
            >
              <div className={`p-1.5 rounded-md ${getBgColor(deadline.type)}`}>
                <Icon className={`w-3.5 h-3.5 ${getColor(deadline.type)}`} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {deadline.title}
                </p>
                {deadline.subtitle && (
                  <p className="text-xs text-text-tertiary truncate">{deadline.subtitle}</p>
                )}
              </div>

              <div className="flex flex-col items-end flex-shrink-0">
                {isUrgent ? (
                  <Badge variant="error" size="sm">
                    {deadline.daysUntil === 0 ? 'Today' : `${deadline.daysUntil}d`}
                  </Badge>
                ) : (
                  <span className="text-xs font-mono text-text-tertiary">
                    {format(deadline.date, 'MMM d')}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
