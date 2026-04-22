'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Trash2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  createDailyTaskAction,
  updateDailyTaskAction,
  deleteDailyTaskAction,
} from '@/app/actions/daily-tasks';
import { useAppSound } from '@/lib/hooks/useAppSound';
import { useAppLanguage } from '@/components/providers/LanguageProvider';
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

interface TasksClientProps {
  initialDate: string;
  initialTasks: DailyTask[];
}

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0]!;
}

function formatDisplayDate(dateStr: string, lang: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function isToday(dateStr: string): boolean {
  return dateStr === toDateString(new Date());
}

const sourceConfig: Record<string, { label: string; color: string }> = {
  manual: { label: 'Manuell', color: 'default' },
  goal: { label: 'Ziel', color: 'primary' },
  application: { label: 'Bewerbung', color: 'info' },
};

export default function TasksClient({ initialDate, initialTasks }: TasksClientProps) {
  const queryClient = useQueryClient();
  const { play: playSound } = useAppSound();
  const { language } = useAppLanguage();

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskEstimate, setNewTaskEstimate] = useState('');

  const { data: tasks = [], isLoading } = useQuery<DailyTask[]>({
    queryKey: ['daily-tasks', selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/daily-tasks?date=${selectedDate}`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
    ...(selectedDate === initialDate ? { initialData: initialTasks } : {}),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; date: string; timeEstimate?: string }) =>
      createDailyTaskAction({
        title: data.title,
        date: data.date,
        source: 'manual',
        ...(data.timeEstimate ? { timeEstimate: data.timeEstimate } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-tasks', selectedDate] });
      setNewTaskTitle('');
      setNewTaskEstimate('');
      playSound?.('click');
    },
    onError: () => toast.error('Aufgabe konnte nicht erstellt werden'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      updateDailyTaskAction(id, { completed }),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['daily-tasks', selectedDate] });
      const prev = queryClient.getQueryData<DailyTask[]>(['daily-tasks', selectedDate]);
      queryClient.setQueryData<DailyTask[]>(['daily-tasks', selectedDate], (old) =>
        old?.map((t) => (t.id === id ? { ...t, completed } : t))
      );
      if (completed) playSound?.('task-completed');
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['daily-tasks', selectedDate], ctx.prev);
      toast.error('Update fehlgeschlagen');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['daily-tasks', selectedDate] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDailyTaskAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['daily-tasks', selectedDate] });
      const prev = queryClient.getQueryData<DailyTask[]>(['daily-tasks', selectedDate]);
      queryClient.setQueryData<DailyTask[]>(['daily-tasks', selectedDate], (old) =>
        old?.filter((t) => t.id !== id)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['daily-tasks', selectedDate], ctx.prev);
      toast.error('Löschen fehlgeschlagen');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['daily-tasks', selectedDate] }),
  });

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(toDateString(d));
  };

  const handleAddTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    createMutation.mutate({
      title,
      date: selectedDate,
      ...(newTaskEstimate.trim() ? { timeEstimate: newTaskEstimate.trim() } : {}),
    });
  };

  const { pending, completed } = useMemo(() => {
    const p: DailyTask[] = [];
    const c: DailyTask[] = [];
    for (const t of tasks) {
      (t.completed ? c : p).push(t);
    }
    return { pending: p, completed: c };
  }, [tasks]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => shiftDate(-1)}
            aria-label={language === 'de' ? 'Vorheriger Tag' : 'Previous day'}
            className="rounded-lg border border-border p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-text-primary">
              {formatDisplayDate(selectedDate, language)}
            </h1>
            {isToday(selectedDate) && (
              <Badge variant="primary" size="sm">Heute</Badge>
            )}
          </div>
          <button
            onClick={() => shiftDate(1)}
            aria-label={language === 'de' ? 'Nächster Tag' : 'Next day'}
            className="rounded-lg border border-border p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {!isToday(selectedDate) && (
          <Button variant="secondary" size="sm" onClick={() => setSelectedDate(toDateString(new Date()))}>
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            Heute
          </Button>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-warm rounded-xl p-5 animate-pulse">
                <div className="h-7 w-8 rounded bg-white/10" />
                <div className="mt-1.5 h-3 w-14 rounded bg-white/10" />
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="card-warm rounded-xl p-5">
              <div className="text-2xl font-bold text-text-primary">{tasks.length}</div>
              <div className="text-xs uppercase tracking-wider text-text-tertiary">Gesamt</div>
            </div>
            <div className="card-warm rounded-xl p-5">
              <div className="text-2xl font-bold text-success">{completed.length}</div>
              <div className="text-xs uppercase tracking-wider text-text-tertiary">Erledigt</div>
            </div>
            <div className="card-warm rounded-xl p-5">
              <div className="text-2xl font-bold text-primary">{pending.length}</div>
              <div className="text-xs uppercase tracking-wider text-text-tertiary">Offen</div>
            </div>
          </>
        )}
      </div>

      {/* Add task */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAddTask();
        }}
        className="card-warm flex items-center gap-3 rounded-xl p-5"
      >
        <Plus className="h-5 w-5 shrink-0 text-text-tertiary" />
        <Input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder={language === 'de' ? 'Neue Aufgabe…' : 'New task…'}
          inputSize="sm"
          className="flex-1"
        />
        <Input
          value={newTaskEstimate}
          onChange={(e) => setNewTaskEstimate(e.target.value)}
          placeholder="z.B. 30m"
          inputSize="sm"
          className="w-20"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!newTaskTitle.trim() || createMutation.isPending}
          loading={createMutation.isPending}
        >
          {language === 'de' ? 'Hinzufügen' : 'Add'}
        </Button>
      </form>

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-warm h-16 animate-pulse rounded-xl p-5" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card-warm rounded-xl p-5 text-center">
          <Check className="mx-auto mb-2 h-8 w-8 text-success/60" />
          <p className="text-sm font-medium text-text-primary">
            {language === 'de' ? 'Keine Aufgaben für diesen Tag' : 'No tasks for this day'}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            {language === 'de'
              ? 'Füge oben eine Aufgabe hinzu, um loszulegen.'
              : 'Add a task above to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Pending tasks */}
          <AnimatePresence mode="popLayout">
            {pending.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => toggleMutation.mutate({ id: task.id, completed: true })}
                onDelete={() => deleteMutation.mutate(task.id)}
                language={language}
              />
            ))}
          </AnimatePresence>

          {/* Completed tasks */}
          {completed.length > 0 && (
            <>
              <div className="flex items-center gap-2 pt-4">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-xs text-text-tertiary">
                  {completed.length} {language === 'de' ? 'erledigt' : 'completed'}
                </span>
                <div className="h-px flex-1 bg-border/50" />
              </div>
              <AnimatePresence mode="popLayout">
                {completed.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => toggleMutation.mutate({ id: task.id, completed: false })}
                    onDelete={() => deleteMutation.mutate(task.id)}
                    language={language}
                  />
                ))}
              </AnimatePresence>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
  language,
}: {
  task: DailyTask;
  onToggle: () => void;
  onDelete: () => void;
  language: string;
}) {
  const src = task.source ? sourceConfig[task.source] : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
      className={`card-warm group flex items-center gap-3 rounded-xl p-5 transition-opacity ${
        task.completed ? 'opacity-60' : ''
      }`}
    >
      <Checkbox checked={task.completed} onCheckedChange={onToggle} />

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium ${
            task.completed ? 'text-text-tertiary line-through' : 'text-text-primary'
          }`}
        >
          {task.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          {task.timeEstimate && (
            <span className="text-xs text-text-tertiary">{task.timeEstimate}</span>
          )}
          {src && (
            <Badge variant={src.color as BadgeVariant} size="sm">
              {language === 'en' && task.source === 'manual'
                ? 'Manual'
                : language === 'en' && task.source === 'goal'
                  ? 'Goal'
                  : language === 'en' && task.source === 'application'
                    ? 'Application'
                    : src.label}
            </Badge>
          )}
        </div>
      </div>

      <button
        onClick={onDelete}
        className="rounded-md p-1.5 text-text-tertiary opacity-0 transition-all hover:bg-error/10 hover:text-error group-hover:opacity-100"
        aria-label={language === 'de' ? 'Aufgabe löschen' : 'Delete task'}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
