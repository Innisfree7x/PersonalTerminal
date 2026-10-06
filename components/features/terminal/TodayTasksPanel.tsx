'use client';

import { useState } from 'react';
import { CheckSquare, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';

export interface DailyTaskItem {
  id: string;
  date: string;
  title: string;
  completed: boolean;
  timeEstimate?: number | null;
  source?: string | null;
}

interface TodayTasksPanelProps {
  tasks: DailyTaskItem[];
  isLoading: boolean;
  onAddTask: (title: string, timeEstimate?: number) => Promise<void>;
  onToggleTask: (id: string, completed: boolean) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

export default function TodayTasksPanel({
  tasks,
  isLoading,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: TodayTasksPanelProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newEstimate, setNewEstimate] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddTask(newTitle.trim(), newEstimate);
      setNewTitle('');
      setNewEstimate(undefined);
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/[0.08] bg-[#0D1017]/90 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.06)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 bg-white/[0.015]">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
          <h2 className="text-xs font-semibold tracking-wider text-white uppercase font-mono">
            Fokus-Aufgaben
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono border border-cyan-500/20">
            {completedCount}/{tasks.length}
          </span>
        </div>

        {/* Mini progress bar */}
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-white/40">{progressPercent}%</span>
        </div>
      </div>

      {/* Quick Add Bar */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 p-3 border-b border-white/[0.06] bg-white/[0.01]"
      >
        <input
          type="text"
          placeholder="+ Neue Priorität für heute (Enter drücken)..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 text-xs bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/60 font-mono"
        />
        <select
          value={newEstimate ?? ''}
          onChange={(e) => setNewEstimate(e.target.value ? Number(e.target.value) : undefined)}
          className="text-xs bg-[#090C14] border border-white/[0.08] rounded-xl px-2 py-2 text-white/70 focus:outline-none focus:border-cyan-400/60 font-mono"
        >
          <option value="">Dauer</option>
          <option value="15">15m</option>
          <option value="30">30m</option>
          <option value="45">45m</option>
          <option value="60">60m</option>
          <option value="90">90m</option>
        </select>
        <button
          type="submit"
          disabled={!newTitle.trim() || isSubmitting}
          className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-cyan-300 border border-white/[0.08] hover:border-cyan-500/30 disabled:opacity-30 transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[470px]">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-white/[0.03]" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-white/40 space-y-2">
            <CheckCircle2 className="w-8 h-8 opacity-30 text-cyan-400" />
            <p className="text-xs font-mono">Alle Aufgaben für heute erledigt oder noch keine angelegt.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-150 ${
                task.completed
                  ? 'border-white/[0.03] bg-white/[0.01] opacity-40'
                  : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onToggleTask(task.id, !task.completed)}
                  className="flex-shrink-0 text-white/40 hover:text-cyan-400 transition-colors"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-white/30" />
                  )}
                </button>

                <span
                  className={`text-xs truncate font-medium ${
                    task.completed ? 'line-through text-white/40' : 'text-white'
                  }`}
                >
                  {task.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {task.timeEstimate && (
                  <span className="text-[10px] font-mono text-white/40 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                    {task.timeEstimate}m
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  title="Aufgabe löschen"
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
