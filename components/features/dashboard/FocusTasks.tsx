'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { Plus, Clock, Target, Briefcase, GraduationCap, BookOpen } from 'lucide-react';
import { createTask, updateTask, toggleExercise } from '@/lib/api/daily-tasks';
import { useAppSound } from '@/lib/hooks/useAppSound';

interface DailyTask {
  id: string;
  date: string;
  title: string;
  completed: boolean;
  source: string | null;
  sourceId: string | null;
  timeEstimate: string | null;
  createdAt: string;
}

interface NextHomework {
  type: 'homework';
  id: string;
  courseId: string;
  courseName: string;
  exerciseNumber: number;
  totalExercises: number;
  completedExercises: number;
  daysUntilExam?: number;
}

interface NextGoal {
  type: 'goal';
  id: string;
  title: string;
  category: string;
  daysUntil: number;
}

interface NextInterview {
  type: 'interview';
  id: string;
  company: string;
  position: string;
  daysUntil: number;
}

async function fetchDailyTasks(date: string): Promise<DailyTask[]> {
  const response = await fetch(`/api/daily-tasks?date=${date}`);
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}

async function fetchNextTasks() {
  const response = await fetch('/api/dashboard/next-tasks');
  if (!response.ok) throw new Error('Failed to fetch next tasks');
  return response.json();
}

export default function FocusTasks() {
  const queryClient = useQueryClient();
  const { play } = useAppSound();
  const today = new Date().toISOString().split('T')[0] ?? '';
  const [showAddInput, setShowAddInput] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const { data: dailyTasks = [] } = useQuery({
    queryKey: ['daily-tasks', today],
    queryFn: () => fetchDailyTasks(today),
    staleTime: 30 * 1000,
  });

  const { data: nextTasksData } = useQuery({
    queryKey: ['dashboard', 'next-tasks'],
    queryFn: fetchNextTasks,
    staleTime: 15 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'next-tasks'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      updateTask(id, completed),
    onSuccess: () => {
      play('pop');
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'next-tasks'] });
    },
    onError: (_error, variables) => {
      setHiddenIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(variables.id);
        return newSet;
      });
    },
  });

  const exerciseMutation = useMutation({
    mutationFn: ({ courseId, exerciseNumber }: { courseId: string; exerciseNumber: number }) =>
      toggleExercise(courseId, exerciseNumber, true),
    onSuccess: () => {
      play('pop');
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'next-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (_error, variables) => {
      const taskId = `hw-${variables.courseId}-${variables.exerciseNumber}`;
      setHiddenIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    },
  });

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    createMutation.mutate({
      title: newTaskTitle.trim(),
      date: today,
      ...(newTaskTime.trim() ? { timeEstimate: newTaskTime.trim() } : {}),
    });
    setNewTaskTitle('');
    setNewTaskTime('');
    setShowAddInput(false);
  };

  // Build unified task list
  type TaskItem = {
    id: string;
    title: string;
    subtitle?: string;
    completed: boolean;
    source: 'manual' | 'homework' | 'goal' | 'interview';
    urgency: 'urgent' | 'important' | 'normal';
    timeEstimate?: string | undefined;
    // For homework completion
    courseId?: string | undefined;
    exerciseNumber?: number | undefined;
  };

  const { sortedTasks, completedTasks } = useMemo(() => {
    const allTasks: TaskItem[] = [];

    const homeworks: NextHomework[] = nextTasksData?.homeworks || [];
    homeworks.forEach((hw) => {
      const urgency: TaskItem['urgency'] =
        hw.daysUntilExam !== undefined && hw.daysUntilExam < 30
          ? 'urgent'
          : hw.daysUntilExam !== undefined && hw.daysUntilExam < 60
            ? 'important'
            : 'normal';

      allTasks.push({
        id: hw.id,
        title: `${hw.courseName} - Blatt ${hw.exerciseNumber}`,
        subtitle: `${hw.completedExercises}/${hw.totalExercises} done${hw.daysUntilExam !== undefined ? ` · Exam in ${hw.daysUntilExam}d` : ''}`,
        completed: false,
        source: 'homework',
        urgency,
        courseId: hw.courseId,
        exerciseNumber: hw.exerciseNumber,
      });
    });

    const goals: NextGoal[] = nextTasksData?.goals || [];
    goals.forEach((goal) => {
      allTasks.push({
        id: `goal-${goal.id}`,
        title: goal.title,
        subtitle: goal.daysUntil === 0 ? 'Due today' : `Due in ${goal.daysUntil}d`,
        completed: false,
        source: 'goal',
        urgency: goal.daysUntil <= 1 ? 'urgent' : goal.daysUntil <= 3 ? 'important' : 'normal',
      });
    });

    const interviews: NextInterview[] = nextTasksData?.interviews || [];
    interviews.forEach((interview) => {
      allTasks.push({
        id: `interview-${interview.id}`,
        title: `Interview: ${interview.company}`,
        subtitle: `${interview.position}${interview.daysUntil === 0 ? ' · Today!' : ` · In ${interview.daysUntil}d`}`,
        completed: false,
        source: 'interview',
        urgency: interview.daysUntil === 0 ? 'urgent' : 'important',
      });
    });

    dailyTasks.forEach((task) => {
      allTasks.push({
        id: task.id,
        title: task.title,
        completed: task.completed,
        source: 'manual',
        urgency: 'normal',
        timeEstimate: task.timeEstimate || undefined,
      });
    });

    const visible = allTasks.filter((task) => !hiddenIds.has(task.id) && !task.completed);
    const done = allTasks.filter((task) => task.completed && !hiddenIds.has(task.id));

    const sorted = [...visible].sort((a, b) => {
      const urgencyOrder = { urgent: 0, important: 1, normal: 2 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      const sourceOrder = { interview: 0, homework: 1, goal: 2, manual: 3 };
      return sourceOrder[a.source] - sourceOrder[b.source];
    });

    return { sortedTasks: sorted, completedTasks: done };
  }, [nextTasksData, dailyTasks, hiddenIds]);

  const getSourceIcon = (source: TaskItem['source']) => {
    switch (source) {
      case 'homework': return <GraduationCap className="w-4 h-4" />;
      case 'goal': return <Target className="w-4 h-4" />;
      case 'interview': return <Briefcase className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getSourceColor = (source: TaskItem['source']) => {
    switch (source) {
      case 'homework': return 'text-university-accent';
      case 'goal': return 'text-goals-accent';
      case 'interview': return 'text-career-accent';
      default: return 'text-text-tertiary';
    }
  };

  const handleCheck = (task: TaskItem) => {
    setHiddenIds((prev) => new Set(prev).add(task.id));

    if (task.source === 'homework' && task.courseId && task.exerciseNumber) {
      exerciseMutation.mutate({
        courseId: task.courseId,
        exerciseNumber: task.exerciseNumber,
      });
    } else if (task.source === 'manual') {
      updateMutation.mutate({ id: task.id, completed: true });
    }
    // Goals and interviews: just hide for now (they're reminders, not completable here)
  };

  const renderTaskRow = (task: TaskItem, index: number) => (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.03 }}
      className="group"
    >
      <div className="flex items-start gap-3 p-3 rounded-lg bg-surface border border-border hover:border-primary/50 transition-all">
        <Checkbox
          checked={hiddenIds.has(task.id)}
          onCheckedChange={() => handleCheck(task)}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`${getSourceColor(task.source)}`}>
              {getSourceIcon(task.source)}
            </span>
            <span className="text-sm font-medium text-text-primary truncate">
              {task.title}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-6">
            {task.subtitle && (
              <span className="text-xs text-text-tertiary">{task.subtitle}</span>
            )}
            {task.urgency !== 'normal' && (
              <Badge
                variant={task.urgency === 'urgent' ? 'error' : 'warning'}
                size="sm"
              >
                {task.urgency}
              </Badge>
            )}
            {task.timeEstimate && (
              <span className="text-xs text-text-tertiary font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {task.timeEstimate}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="card-surface p-6 h-fit sticky top-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Today
        </h2>
        <div className="flex items-center gap-2">
          {completedTasks.length > 0 && (
            <span className="text-xs text-text-tertiary">
              {completedTasks.length} done
            </span>
          )}
          <Badge variant="primary" size="sm">
            {sortedTasks.length}
          </Badge>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {sortedTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <div className="text-3xl mb-2">🎉</div>
            <p className="text-sm text-text-tertiary">All caught up!</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {sortedTasks.map((task, index) => renderTaskRow(task, index))}
          </div>
        )}
      </AnimatePresence>

      {/* Add Task */}
      <div className="mt-4 pt-4 border-t border-border">
        <AnimatePresence mode="wait">
          {showAddInput ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <input
                type="text"
                placeholder="Task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full text-sm input-field"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTask();
                  if (e.key === 'Escape') setShowAddInput(false);
                }}
                autoFocus
              />
              <input
                type="text"
                placeholder="Time (e.g. 2h, 30m)"
                value={newTaskTime}
                onChange={(e) => setNewTaskTime(e.target.value)}
                className="w-full text-sm input-field font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTask();
                  if (e.key === 'Escape') setShowAddInput(false);
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddTask}
                  className="flex-1 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddInput(false)}
                  className="px-3 py-2 text-sm bg-surface-hover text-text-secondary rounded-lg hover:bg-border transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddInput(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm bg-surface-hover text-text-secondary rounded-lg hover:bg-border hover:text-text-primary transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
