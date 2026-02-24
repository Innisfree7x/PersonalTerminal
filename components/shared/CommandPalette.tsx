'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Home,
  Target,
  Briefcase,
  GraduationCap,
  Calendar,
  BarChart3,
  Plus,
  Play,
  Pause,
  Square,
  Zap,
  Palette,
  Settings,
  Moon,
  ShieldCheck,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { useFocusTimer } from '@/components/providers/FocusTimerProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import {
  dispatchPrismCommandAction,
  dispatchIntentExecute,
  queuePrismCommandAction,
  type PrismCommandAction,
} from '@/lib/hooks/useCommandActions';
import { parseCommand, type ParsedIntent } from '@/lib/command/parser';
import { useAppSound } from '@/lib/hooks/useAppSound';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

type CommandItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void;
  keywords: string[];
  shortcut?: string;
};

const THEME_CYCLE = ['midnight', 'nord', 'gold'] as const;

// ── Intent icon + accent per intent kind ──────────────────────────────────────
const intentMeta: Record<
  ParsedIntent['kind'],
  { label: string; accent: string; border: string; bg: string }
> = {
  'create-task': {
    label: 'Task erstellen',
    accent: 'text-cyan-300',
    border: 'border-cyan-300/25',
    bg: 'bg-cyan-500/10',
  },
  'plan-focus': {
    label: 'Focus starten',
    accent: 'text-amber-300',
    border: 'border-amber-300/25',
    bg: 'bg-amber-500/10',
  },
  'create-goal': {
    label: 'Goal erstellen',
    accent: 'text-emerald-300',
    border: 'border-emerald-300/25',
    bg: 'bg-emerald-500/10',
  },
  'open-page': {
    label: 'Navigieren',
    accent: 'text-violet-300',
    border: 'border-violet-300/25',
    bg: 'bg-violet-500/10',
  },
};

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const [intentConfirmed, setIntentConfirmed] = useState(false);
  const {
    status: timerStatus,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    setIsExpanded: setTimerExpanded,
  } = useFocusTimer();
  const { setTheme, theme } = useTheme();
  const { play } = useAppSound();

  // ── Intent parsing ──────────────────────────────────────────────────────────
  const intentResult = useMemo(() => parseCommand(search), [search]);
  const isIntentMode = intentResult !== null;

  // Reset confirm state when search changes
  useEffect(() => {
    setIntentConfirmed(false);
  }, [search]);

  // ── Execute a confirmed intent ──────────────────────────────────────────────
  const executeIntent = useCallback(
    (intent: ParsedIntent) => {
      play('swoosh');
      switch (intent.kind) {
        case 'open-page':
          router.push(intent.path);
          break;
        case 'plan-focus':
          startTimer({ duration: intent.durationMin });
          setTimerExpanded(true);
          break;
        case 'create-task':
        case 'create-goal':
          // Executor (lib/command/executor.ts — Codex) handles API calls + guards
          dispatchIntentExecute(intent);
          break;
      }
      onClose();
      setSearch('');
      setIntentConfirmed(false);
    },
    [onClose, play, router, setTimerExpanded, startTimer],
  );

  // ── Navigation commands ─────────────────────────────────────────────────────
  const navigationCommands: CommandItem[] = [
    {
      id: 'nav-today',
      label: 'Dashboard',
      icon: Home,
      action: () => router.push('/today'),
      keywords: ['dashboard', 'today', 'home', 'overview'],
    },
    {
      id: 'nav-goals',
      label: 'Goals',
      icon: Target,
      action: () => router.push('/goals'),
      keywords: ['goals', 'objectives', 'targets'],
    },
    {
      id: 'nav-career',
      label: 'Career',
      icon: Briefcase,
      action: () => router.push('/career'),
      keywords: ['career', 'jobs', 'applications', 'interviews'],
    },
    {
      id: 'nav-university',
      label: 'University',
      icon: GraduationCap,
      action: () => router.push('/university'),
      keywords: ['university', 'courses', 'studies', 'exercises'],
    },
    {
      id: 'nav-calendar',
      label: 'Calendar',
      icon: Calendar,
      action: () => router.push('/calendar'),
      keywords: ['calendar', 'schedule', 'events'],
    },
    {
      id: 'nav-analytics',
      label: 'Analytics',
      icon: BarChart3,
      action: () => router.push('/analytics'),
      keywords: ['analytics', 'stats', 'focus', 'charts', 'productivity'],
    },
    {
      id: 'nav-ops-health',
      label: 'Ops Health',
      icon: ShieldCheck,
      action: () => router.push('/analytics/ops'),
      keywords: ['ops', 'health', 'monitoring', 'incidents', 'admin'],
    },
    {
      id: 'nav-settings',
      label: 'Settings',
      icon: Settings,
      action: () => router.push('/settings'),
      keywords: ['settings', 'preferences', 'config', 'account'],
    },
  ];

  // ── Theme commands ──────────────────────────────────────────────────────────
  const themeCommands: CommandItem[] = [
    { id: 'theme-midnight', label: 'Theme: Midnight', icon: Moon, action: () => setTheme('midnight'), keywords: ['theme', 'dark', 'midnight'] },
    { id: 'theme-nord', label: 'Theme: Nord', icon: Palette, action: () => setTheme('nord'), keywords: ['theme', 'nord', 'blue', 'gray'] },
    { id: 'theme-gold', label: 'Theme: Gold', icon: Palette, action: () => setTheme('gold'), keywords: ['theme', 'gold', 'premium', 'warm'] },
    { id: 'theme-dracula', label: 'Theme: Dracula', icon: Palette, action: () => setTheme('dracula'), keywords: ['theme', 'dracula', 'purple', 'vampire'] },
    { id: 'theme-ocean', label: 'Theme: Ocean', icon: Palette, action: () => setTheme('ocean'), keywords: ['theme', 'ocean', 'blue', 'deep'] },
    { id: 'theme-emerald', label: 'Theme: Emerald', icon: Palette, action: () => setTheme('emerald'), keywords: ['theme', 'emerald', 'green', 'nature'] },
  ];

  const triggerPageAction = useCallback(
    (targetPath: string, action: PrismCommandAction) => {
      if (pathname === targetPath) {
        dispatchPrismCommandAction(action);
        return;
      }
      queuePrismCommandAction(action);
      router.push(targetPath);
    },
    [pathname, router],
  );

  // ── Quick action commands ───────────────────────────────────────────────────
  const quickActions: CommandItem[] = [
    {
      id: 'action-add-task',
      label: 'Add Daily Task',
      icon: Plus,
      action: () => triggerPageAction('/today', 'open-new-task'),
      keywords: ['add', 'new', 'create', 'task', 'todo', 'today'],
      shortcut: 'D',
    },
    {
      id: 'action-add-goal',
      label: 'Add New Goal',
      icon: Plus,
      action: () => triggerPageAction('/goals', 'open-new-goal'),
      keywords: ['add', 'new', 'create', 'goal'],
      shortcut: 'G',
    },
    {
      id: 'action-add-application',
      label: 'Add Job Application',
      icon: Plus,
      action: () => triggerPageAction('/career', 'open-new-application'),
      keywords: ['add', 'new', 'create', 'job', 'application'],
      shortcut: 'A',
    },
    {
      id: 'action-add-course',
      label: 'Add Course',
      icon: Plus,
      action: () => triggerPageAction('/university', 'open-new-course'),
      keywords: ['add', 'new', 'create', 'course'],
      shortcut: 'C',
    },
    {
      id: 'action-next-best',
      label: 'Start Next Best Action',
      icon: Zap,
      action: () => triggerPageAction('/today', 'start-next-best-action'),
      keywords: ['next', 'best', 'action', 'execute', 'priority', 'today'],
      shortcut: 'N',
    },
    {
      id: 'action-theme-cycle',
      label: 'Cycle Theme (Midnight → Nord → Gold)',
      icon: Palette,
      action: () => {
        const currentIndex = THEME_CYCLE.indexOf(theme as (typeof THEME_CYCLE)[number]);
        const nextTheme = THEME_CYCLE[(currentIndex + 1) % THEME_CYCLE.length] ?? 'midnight';
        setTheme(nextTheme);
      },
      keywords: ['theme', 'toggle', 'switch', 'cycle', 'midnight', 'nord', 'gold'],
      shortcut: 'T',
    },
    {
      id: 'action-focus-25',
      label: 'Start Focus Session (25m)',
      icon: Play,
      action: () => { startTimer(); setTimerExpanded(true); },
      keywords: ['focus', 'start', 'pomodoro', '25', 'study'],
      shortcut: 'F',
    },
    {
      id: 'action-focus-50',
      label: 'Start Deep Focus (50m)',
      icon: Zap,
      action: () => { startTimer({ duration: 50 }); setTimerExpanded(true); },
      keywords: ['focus', 'start', 'deep', '50', 'work'],
    },
  ];

  // ── Focus timer commands ────────────────────────────────────────────────────
  const focusCommands: CommandItem[] = [
    ...(timerStatus === 'idle'
      ? [{
          id: 'focus-start',
          label: 'Start Focus Timer',
          icon: Play,
          action: () => { startTimer(); setTimerExpanded(true); },
          keywords: ['focus', 'timer', 'start', 'pomodoro', 'study'],
          shortcut: 'Alt+F',
        }]
      : []),
    ...(timerStatus === 'running' || timerStatus === 'break'
      ? [{
          id: 'focus-pause',
          label: 'Pause Timer',
          icon: Pause,
          action: () => pauseTimer(),
          keywords: ['focus', 'timer', 'pause'],
        }]
      : []),
    ...(timerStatus === 'paused' || timerStatus === 'break_paused'
      ? [{
          id: 'focus-resume',
          label: 'Resume Timer',
          icon: Play,
          action: () => resumeTimer(),
          keywords: ['focus', 'timer', 'resume', 'continue'],
        }]
      : []),
    ...(timerStatus !== 'idle'
      ? [{
          id: 'focus-stop',
          label: 'Stop Timer',
          icon: Square,
          action: () => stopTimer(),
          keywords: ['focus', 'timer', 'stop', 'end'],
        }]
      : []),
  ];

  const handleSelect = useCallback(
    (command: { id: string; action: () => void }) => {
      if (command.id.startsWith('theme-')) {
        play('click');
      } else {
        play('swoosh');
      }
      command.action();
      onClose();
      setSearch('');
    },
    [onClose, play],
  );

  // ── Keyboard: Escape closes, Enter confirms intent ──────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isIntentMode && search) {
          // First Escape clears the search back to empty
          setSearch('');
          e.preventDefault();
          return;
        }
        onClose();
        setSearch('');
      }
      // Enter confirms a valid intent when focus is on the input
      if (e.key === 'Enter' && intentResult?.ok === true && !intentConfirmed) {
        e.preventDefault();
        setIntentConfirmed(true);
        executeIntent(intentResult.intent);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [executeIntent, intentConfirmed, intentResult, isIntentMode, onClose, search]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Palette */}
          <div
            data-hotkeys-disabled="true"
            className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center pt-[18vh]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -16 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="pointer-events-auto w-full max-w-2xl px-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Command
                className="overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0d1119]/96 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_24px_64px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
                value={search}
                onValueChange={setSearch}
                loop
              >
                {/* Input row */}
                <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3.5">
                  {isIntentMode ? (
                    <Terminal className="h-4 w-4 flex-shrink-0 text-amber-400" />
                  ) : (
                    <Search className="h-4 w-4 flex-shrink-0 text-zinc-500" />
                  )}
                  <Command.Input
                    placeholder="Suchen oder Befehl eingeben…  (erstelle task, fokus 25, open goals)"
                    className="flex-1 bg-transparent text-[14px] text-zinc-100 placeholder:text-zinc-600 outline-none"
                    autoFocus
                    value={search}
                    onValueChange={setSearch}
                  />
                  <kbd className="hidden rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-zinc-500 sm:inline-flex">
                    ESC
                  </kbd>
                </div>

                {/* Intent Preview — shown above results when a command is detected */}
                <AnimatePresence>
                  {intentResult !== null && (
                    <motion.div
                      key="intent-preview"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.16 }}
                      className="overflow-hidden border-b border-white/[0.06]"
                    >
                      {intentResult.ok ? (
                        // ── Valid intent ──────────────────────────────────────
                        <div className={`flex items-center gap-3 px-4 py-3 ${intentMeta[intentResult.intent.kind].bg}`}>
                          <CheckCircle2
                            className={`h-4 w-4 flex-shrink-0 ${intentMeta[intentResult.intent.kind].accent}`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${intentMeta[intentResult.intent.kind].accent}`}>
                              {intentMeta[intentResult.intent.kind].label}
                            </p>
                            <p className="mt-0.5 truncate text-[13px] text-zinc-200">
                              {intentResult.preview}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => executeIntent(intentResult.intent)}
                            className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${intentMeta[intentResult.intent.kind].border} ${intentMeta[intentResult.intent.kind].bg} ${intentMeta[intentResult.intent.kind].accent} hover:brightness-125`}
                          >
                            <span>↵</span>
                            <span>Bestätigen</span>
                          </button>
                        </div>
                      ) : (
                        // ── Parse error ───────────────────────────────────────
                        <div className="flex items-start gap-3 bg-red-500/10 px-4 py-3">
                          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                          <p className="text-[13px] text-red-300">{intentResult.error}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Command list */}
                <Command.List className="max-h-[360px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  <Command.Empty className="flex flex-col items-center gap-2 py-10 text-center text-sm text-zinc-500">
                    <Search className="h-7 w-7 opacity-20" />
                    <span>Keine Ergebnisse.</span>
                  </Command.Empty>

                  {/* Navigation */}
                  <Command.Group
                    heading="Navigation"
                    className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600"
                  >
                    {navigationCommands.map((cmd) => {
                      const Icon = cmd.icon;
                      return (
                        <Command.Item
                          key={cmd.id}
                          value={`${cmd.label} ${cmd.keywords.join(' ')}`}
                          onSelect={() => handleSelect(cmd)}
                          className="mb-0.5 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors aria-selected:bg-white/[0.06] aria-selected:text-zinc-100"
                        >
                          <Icon className="h-4 w-4 flex-shrink-0 text-zinc-500" />
                          <span className="flex-1">{cmd.label}</span>
                        </Command.Item>
                      );
                    })}
                  </Command.Group>

                  {/* Themes */}
                  <Command.Group
                    heading="Themes"
                    className="mt-1 px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600"
                  >
                    {themeCommands.map((cmd) => {
                      const Icon = cmd.icon;
                      const isActive = theme === cmd.id.replace('theme-', '');
                      return (
                        <Command.Item
                          key={cmd.id}
                          value={`${cmd.label} ${cmd.keywords.join(' ')}`}
                          onSelect={() => handleSelect(cmd)}
                          className="mb-0.5 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors aria-selected:bg-white/[0.06] aria-selected:text-zinc-100"
                        >
                          <Icon className="h-4 w-4 flex-shrink-0 text-zinc-500" />
                          <span className="flex-1">{cmd.label}</span>
                          {isActive && (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-zinc-400">
                              Aktiv
                            </span>
                          )}
                        </Command.Item>
                      );
                    })}
                  </Command.Group>

                  {/* Focus Timer (context-sensitive) */}
                  {focusCommands.length > 0 && (
                    <Command.Group
                      heading="Focus Timer"
                      className="mt-1 px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600"
                    >
                      {focusCommands.map((cmd) => {
                        const Icon = cmd.icon;
                        return (
                          <Command.Item
                            key={cmd.id}
                            value={`${cmd.label} ${cmd.keywords.join(' ')}`}
                            onSelect={() => handleSelect(cmd)}
                            className="mb-0.5 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors aria-selected:bg-white/[0.06] aria-selected:text-zinc-100"
                          >
                            <Icon className="h-4 w-4 flex-shrink-0 text-zinc-500" />
                            <span className="flex-1">{cmd.label}</span>
                            {'shortcut' in cmd && cmd.shortcut && (
                              <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-zinc-500">
                                {cmd.shortcut}
                              </kbd>
                            )}
                          </Command.Item>
                        );
                      })}
                    </Command.Group>
                  )}

                  {/* Quick Actions */}
                  <Command.Group
                    heading="Quick Actions"
                    className="mt-1 px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600"
                  >
                    {quickActions.map((cmd) => {
                      const Icon = cmd.icon;
                      return (
                        <Command.Item
                          key={cmd.id}
                          value={`${cmd.label} ${cmd.keywords.join(' ')}`}
                          onSelect={() => handleSelect(cmd)}
                          className="mb-0.5 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors aria-selected:bg-white/[0.06] aria-selected:text-zinc-100"
                        >
                          <Icon className="h-4 w-4 flex-shrink-0 text-zinc-500" />
                          <span className="flex-1">{cmd.label}</span>
                          {cmd.shortcut && (
                            <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-zinc-500">
                              ⌘{cmd.shortcut}
                            </kbd>
                          )}
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                </Command.List>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.01] px-4 py-2.5">
                  <div className="flex items-center gap-4 text-[10px] text-zinc-600">
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 text-[9px]">↑↓</kbd>
                      Navigieren
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 text-[9px]">↵</kbd>
                      Ausführen
                    </span>
                    {isIntentMode && (
                      <span className="flex items-center gap-1 text-amber-500/70">
                        <Terminal className="h-3 w-3" />
                        Intent-Modus
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                    <Zap className="h-3 w-3" />
                    INNIS Command
                  </div>
                </div>
              </Command>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
