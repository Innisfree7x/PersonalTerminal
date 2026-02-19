'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { Plus, Clock, Target, Briefcase, GraduationCap, BookOpen } from 'lucide-react';
import { useAppSound } from '@/lib/hooks/useAppSound';
import { createDailyTaskAction, deleteDailyTaskAction, updateDailyTaskAction } from '@/app/actions/daily-tasks';
import { toggleExerciseCompletionAction } from '@/app/actions/university';
import { usePrismCommandAction } from '@/lib/hooks/useCommandActions';
import { useListNavigation } from '@/lib/hooks/useListNavigation';
import { subscribePingAction, type PingAction } from '@/lib/hotkeys/ping';
import { dispatchChampionEvent } from '@/lib/champion/championEvents';
import toast from 'react-hot-toast';

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

export default function FocusTasks() {
  const queryClient = useQueryClient();
  const { play } = useAppSound();
  const today = new Date().toISOString().split('T')[0] ?? '';
  const [showAddInput, setShowAddInput] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [criticalIds, setCriticalIds] = useState<Set<string>>(new Set());
  const [inProgressIds, setInProgressIds] = useState<Set<string>>(new Set());

  usePrismCommandAction('open-new-task', () => {
    setShowAddInput(true);
  });

  const { data: dailyTasks = [] } = useQuery({
    queryKey: ['daily-tasks', today],
    queryFn: () => fetchDailyTasks(today),
    staleTime: 30 * 1000,
  });

  const { data: nextTasksData } = useQuery({
    queryKey: ['dashboard', 'next-tasks'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/next-tasks');
      if (!response.ok) throw new Error('Failed to fetch next tasks');
      return response.json();
    },
    staleTime: 15 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createDailyTaskAction,
    onMutate: async (taskInput) => {
      await queryClient.cancelQueries({ queryKey: ['daily-tasks', today] });
      const previousDailyTasks =
        queryClient.getQueryData<DailyTask[]>(['daily-tasks', today]) || [];
      const tempId = crypto.randomUUID();

      const optimisticTask: DailyTask = {
        id: tempId,
        date: taskInput.date,
        title: taskInput.title,
        completed: false,
        source: 'manual',
        sourceId: null,
        timeEstimate: taskInput.timeEstimate ?? null,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<DailyTask[]>(
        ['daily-tasks', today],
        [optimisticTask, ...previousDailyTasks]
      );

      return { previousDailyTasks, tempId };
    },
    onSuccess: (createdTask, _variables, context) => {
      queryClient.setQueryData<DailyTask[]>(['daily-tasks', today], (current = []) => {
        if (!context?.tempId) return [createdTask as DailyTask, ...current];
        return current.map((task) => (task.id === context.tempId ? (createdTask as DailyTask) : task));
      });
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'next-tasks'] });
    },
    onError: (_error, _variables, context) => {
      if (context?.previousDailyTasks) {
        queryClient.setQueryData(['daily-tasks', today], context.previousDailyTasks);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      updateDailyTaskAction(id, { completed }),
    onSuccess: (_data, variables) => {
      play('pop');
      if (variables.completed) {
        dispatchChampionEvent({ type: 'TASK_COMPLETED' });
      }
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
      toggleExerciseCompletionAction(courseId, exerciseNumber, true),
    onSuccess: () => {
      play('pop');
      dispatchChampionEvent({ type: 'EXERCISE_COMPLETED' });
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
    status?: 'in-progress' | undefined;
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

    const withOverrides = allTasks.map((task) => ({
      ...task,
      urgency: criticalIds.has(task.id) ? 'urgent' : task.urgency,
      status: inProgressIds.has(task.id) ? ('in-progress' as const) : undefined,
    }));

    const visible = withOverrides.filter((task) => !hiddenIds.has(task.id) && !task.completed);
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
  }, [nextTasksData, dailyTasks, hiddenIds, criticalIds, inProgressIds]);

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

  const handleCheck = useCallback((task: TaskItem) => {
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
  }, [exerciseMutation, updateMutation]);

  const { focusedId, setFocusedId } = useListNavigation<TaskItem>({
    items: sortedTasks,
    getId: (task) => task.id,
    enabled: sortedTasks.length > 0,
    onEnter: handleCheck,
    onSpace: handleCheck,
  });

  useEffect(() => {
    const executePing = async (action: PingAction) => {
      if (!focusedId) return;
      const focusedTask = sortedTasks.find((task) => task.id === focusedId);
      if (!focusedTask) return;

      if (action === 'done') {
        handleCheck(focusedTask);
        toast.success('Ping: done');
        return;
      }

      if (action === 'critical') {
        setCriticalIds((prev) => new Set(prev).add(focusedTask.id));
        toast.success('Ping: marked critical');
        return;
      }

      if (action === 'in-progress') {
        setInProgressIds((prev) => new Set(prev).add(focusedTask.id));
        toast.success('Ping: in progress');
        return;
      }

      if (action === 'snooze') {
        if (focusedTask.source === 'manual') {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowDate = tomorrow.toISOString().split('T')[0];
          if (!tomorrowDate) return;

          try {
            await createDailyTaskAction({
              title: focusedTask.title,
              date: tomorrowDate,
              ...(focusedTask.timeEstimate ? { timeEstimate: focusedTask.timeEstimate } : {}),
            });
            await deleteDailyTaskAction(focusedTask.id);
            setHiddenIds((prev) => new Set(prev).add(focusedTask.id));
            queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'next-tasks'] });
            toast.success('Ping: snoozed to tomorrow');
          } catch {
            toast.error('Aufgabe konnte nicht verschoben werden. Bitte erneut versuchen.');
          }
          return;
        }

        setHiddenIds((prev) => new Set(prev).add(focusedTask.id));
        toast.success('Ping: snoozed');
      }
    };

    return subscribePingAction((action) => {
      void executePing(action);
    });
  }, [focusedId, handleCheck, queryClient, sortedTasks]);

  const renderTaskRow = (task: TaskItem, index: number) => (
    <motion.div
      key={task.id}
      data-interactive="task"
      data-item-id={task.id}
      data-item-title={task.title}
      data-list-nav-id={task.id}
      data-focused={focusedId === task.id ? 'true' : 'false'}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.03 }}
      className="group relative"
      onMouseEnter={() => setFocusedId(task.id)}
    >
      {focusedId === task.id && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 text-primary/80 text-xs font-mono">▶</div>
      )}
      <div
        className={`flex items-start gap-3 p-3 rounded-lg bg-surface border transition-all ${
          focusedId === task.id ? 'border-primary/70 ring-1 ring-primary/30' : 'border-border hover:border-primary/50'
        }`}
      >
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
            {task.status === 'in-progress' && (
              <Badge variant="info" size="sm">
                in progress
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
    <div className="card-surface p-6">
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
          completedTasks.length === 0 ? (
            // Truly empty — new user or no tasks added yet
            <motion.div
              key="empty-new"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center py-10 gap-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary mb-1">Noch keine Aufgaben heute</p>
                <p className="text-xs text-text-tertiary leading-relaxed max-w-[220px]">
                  Füge deine erste Aufgabe hinzu und starte produktiv in den Tag.
                </p>
              </div>
              <button
                onClick={() => setShowAddInput(true)}
                className="px-4 py-2 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
              >
                + Aufgabe hinzufügen
              </button>
            </motion.div>
          ) : (
            // All tasks completed
            <motion.div
              key="empty-done"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-sm text-text-tertiary">All caught up!</p>
            </motion.div>
          )
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
