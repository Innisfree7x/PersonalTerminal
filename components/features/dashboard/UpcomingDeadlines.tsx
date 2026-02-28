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
      case 'exam': return 'text-amber-300';
      case 'goal': return 'text-red-300';
      case 'interview': return 'text-sky-300';
    }
  };

  const getBgColor = (type: Deadline['type']) => {
    switch (type) {
      case 'exam': return 'bg-amber-400/15';
      case 'goal': return 'bg-red-400/15';
      case 'interview': return 'bg-sky-400/15';
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl bg-surface/35 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-300" />
          <h3 className="text-sm font-semibold text-text-primary">Upcoming</h3>
        </div>
        <p className="text-4xl font-black tabular-nums leading-none text-orange-300">
          {deadlines.length}
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {deadlines.slice(0, 6).map((deadline, index) => {
          const Icon = getIcon(deadline.type);
          const isUrgent = deadline.daysUntil <= 3;

          return (
            <motion.div
              key={deadline.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04, duration: 0.2 }}
              className={`flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors ${
                isUrgent
                  ? 'bg-red-500/[0.08]'
                  : 'bg-surface/55'
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
                  <span className="text-xs font-mono text-text-tertiary/90">
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
