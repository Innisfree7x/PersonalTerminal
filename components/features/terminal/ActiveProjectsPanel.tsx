'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FolderKanban, Plus, ExternalLink, ArrowRight, Target, Calendar } from 'lucide-react';

export interface ProjectGoalItem {
  id: string;
  title: string;
  description?: string | null | undefined;
  category?: string | undefined;
  status: 'active' | 'completed' | 'archived';
  targetDate?: string | null | undefined;
  milestones?: Array<{ id: string; title: string; completed: boolean }> | undefined;
  progress?: number | undefined;
}

interface ActiveProjectsPanelProps {
  projects: ProjectGoalItem[];
  isLoading: boolean;
  onAddProject: (project: {
    title: string;
    category?: string | undefined;
    description?: string | undefined;
  }) => Promise<void>;
  onScheduleProject?: ((project: ProjectGoalItem) => Promise<void>) | undefined;
}

export default function ActiveProjectsPanel({
  projects,
  isLoading,
  onAddProject,
  onScheduleProject,
}: ActiveProjectsPanelProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('career');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddProject({
        title: title.trim(),
        category,
        description: description.trim() || undefined,
      });
      setTitle('');
      setDescription('');
      setShowAdd(false);
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case 'career':
      case 'startup':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'finance':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'fitness':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
      case 'learning':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
      default:
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/[0.08] bg-[#0D1017]/90 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.06)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.015] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <FolderKanban className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-semibold tracking-wider text-white uppercase font-mono">
            Aktive Projekte & Initiatives
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono border border-amber-500/20 tabular-nums">
            {projects.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-medium rounded-lg bg-white/[0.04] hover:bg-amber-500/15 text-white/80 hover:text-amber-300 border border-white/[0.08] hover:border-amber-500/30 transition-all duration-150 shadow-sm"
          >
            <Plus className="w-3 h-3" />
            Projekt
          </button>
          <Link
            href="/workspace/goals"
            title="Projekt-Hub öffnen"
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.04] transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Add Project Form Drawer */}
      {showAdd && (
        <form
          onSubmit={handleSubmit}
          className="p-4 border-b border-white/[0.08] bg-black/40 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3"
        >
          <div className="text-[11px] font-mono font-medium text-amber-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Neues Projekt / Initiative anlegen
          </div>
          <input
            type="text"
            placeholder="Projekttitel (z.B. Startup Launch, Financial Model, Q4 Ziele)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full text-xs font-mono bg-[#07090E] border border-white/[0.1] rounded-xl px-3.5 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/20"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-xs font-mono bg-[#07090E] border border-white/[0.1] rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-amber-400/60"
            >
              <option value="career">Startup / Business</option>
              <option value="finance">Finanzen & Models</option>
              <option value="learning">Lernen / Skills</option>
              <option value="fitness">Fitness / Health</option>
            </select>
            <input
              type="text"
              placeholder="Kurzbeschreibung (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs font-mono bg-[#07090E] border border-white/[0.1] rounded-xl px-3 py-1.5 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/60"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-3 py-1 text-xs font-mono text-white/50 hover:text-white"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-3.5 py-1.5 text-xs font-mono font-medium rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold transition-all shadow-md shadow-amber-500/20"
            >
              {isSubmitting ? 'Erstellt...' : 'Projekt erstellen'}
            </button>
          </div>
        </form>
      )}

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[460px] scrollbar-thin">
        {isLoading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-white/40 space-y-2">
            <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10">
              <Target className="w-6 h-6 text-amber-400/60" />
            </div>
            <p className="text-xs font-mono">Noch keine aktiven Projekte hinterlegt.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="text-xs font-mono text-amber-400 hover:text-amber-300 pt-1 transition-colors"
            >
              + Erstes Projekt anlegen
            </button>
          </div>
        ) : (
          projects.map((project) => {
            const completedMilestones =
              project.milestones?.filter((m) => m.completed).length ?? 0;
            const totalMilestones = project.milestones?.length ?? 0;
            const progress =
              totalMilestones > 0
                ? Math.round((completedMilestones / totalMilestones) * 100)
                : project.progress ?? 0;

            return (
              <div
                key={project.id}
                className="group relative p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-150 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-semibold text-white tracking-tight truncate">
                        {project.title}
                      </h3>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${getCategoryColor(
                          project.category
                        )}`}
                      >
                        {project.category || 'Projekt'}
                      </span>
                    </div>

                    {project.description && (
                      <p className="text-[11px] text-white/50 line-clamp-1 mt-0.5 font-sans">
                        {project.description}
                      </p>
                    )}
                  </div>

                  <Link
                    href="/workspace/goals"
                    className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-white transition-opacity"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Progress Bar & Milestone Info */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
                    <span>
                      {totalMilestones > 0
                        ? `${completedMilestones}/${totalMilestones} Meilensteine`
                        : 'Fortschritt'}
                    </span>
                    <span className="text-white/70 font-semibold tabular-nums">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-300"
                      style={{
                        width: `${progress}%`,
                        boxShadow: progress > 0 ? '0 0 8px rgba(245, 158, 11, 0.4)' : 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Auto Schedule Action */}
                {onScheduleProject && (
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                    <span className="text-[10px] font-mono text-white/30">
                      {project.targetDate ? `Fällig: ${new Date(project.targetDate).toLocaleDateString('de-DE')}` : 'Laufend'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onScheduleProject(project)}
                      className="flex items-center gap-1.5 text-[10px] font-mono font-medium px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 hover:border-indigo-500/40 transition-all shadow-sm"
                    >
                      <Calendar className="w-3 h-3" />
                      In Kalender blocken
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
