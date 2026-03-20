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
  Route,
  Palette,
  Settings,
  Moon,
  ShieldCheck,
  Terminal,
  Timer,
  CheckCircle2,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { useFocusTimer } from '@/components/providers/FocusTimerProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAppLanguage } from '@/components/providers/LanguageProvider';
import {
  dispatchPrismCommandAction,
  dispatchIntentExecute,
  queuePrismCommandAction,
  type PrismCommandAction,
} from '@/lib/hooks/useCommandActions';
import { parseCommand, type ParsedIntent } from '@/lib/command/parser';
import { useAppSound } from '@/lib/hooks/useAppSound';
import { navigateToFocusWithTransition } from '@/lib/navigation/focusTransition';

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

const THEME_CYCLE = ['gold', 'platinum', 'sapphire', 'copper', 'amethyst', 'midnight'] as const;

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
  const { copy } = useAppLanguage();
  const { play } = useAppSound();
  const intentMeta: Record<
    ParsedIntent['kind'],
    { label: string; accent: string; border: string; bg: string }
  > = {
    'create-task': {
      label: copy.command.addDailyTask,
      accent: 'text-cyan-300',
      border: 'border-cyan-300/25',
      bg: 'bg-cyan-500/10',
    },
    'plan-focus': {
      label: copy.command.startFocusTimer,
      accent: 'text-amber-300',
      border: 'border-amber-300/25',
      bg: 'bg-amber-500/10',
    },
    'create-goal': {
      label: copy.command.addNewGoal,
      accent: 'text-emerald-300',
      border: 'border-emerald-300/25',
      bg: 'bg-emerald-500/10',
    },
    'open-page': {
      label: copy.command.navigate,
      accent: 'text-violet-300',
      border: 'border-violet-300/25',
      bg: 'bg-violet-500/10',
    },
  };

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
      label: copy.command.dashboard,
      icon: Home,
      action: () => router.push('/today'),
      keywords: ['dashboard', 'today', 'heute', 'home', 'overview'],
    },
    {
      id: 'nav-goals',
      label: copy.command.goals,
      icon: Target,
      action: () => router.push('/goals'),
      keywords: ['goals', 'ziele', 'objectives', 'targets'],
    },
    {
      id: 'nav-career',
      label: copy.command.career,
      icon: Briefcase,
      action: () => router.push('/career'),
      keywords: ['career', 'karriere', 'jobs', 'applications', 'bewerbungen', 'interviews'],
    },
    {
      id: 'nav-university',
      label: copy.command.university,
      icon: GraduationCap,
      action: () => router.push('/university'),
      keywords: ['university', 'uni', 'courses', 'kurse', 'studies', 'exercises'],
    },
    {
      id: 'nav-calendar',
      label: copy.command.calendar,
      icon: Calendar,
      action: () => router.push('/calendar'),
      keywords: ['calendar', 'kalender', 'schedule', 'events'],
    },
    {
      id: 'nav-analytics',
      label: copy.command.analytics,
      icon: BarChart3,
      action: () => router.push('/analytics'),
      keywords: ['analytics', 'analysen', 'stats', 'focus', 'charts', 'productivity'],
    },
    {
      id: 'nav-focus',
      label: copy.command.focusMode,
      icon: Timer,
      action: () => navigateToFocusWithTransition(router),
      keywords: ['focus', 'fokus', 'deep work', 'zen', 'study mode', 'timer screen'],
    },
    {
      id: 'nav-trajectory',
      label: copy.command.trajectory,
      icon: Route,
      action: () => router.push('/trajectory'),
      keywords: ['trajectory', 'timeline', 'career plan', 'karriereplan', 'milestone', 'roadmap'],
    },
    {
      id: 'nav-ops-health',
      label: copy.command.opsHealth,
      icon: ShieldCheck,
      action: () => router.push('/analytics/ops'),
      keywords: ['ops', 'health', 'monitoring', 'incidents', 'admin'],
    },
    {
      id: 'nav-settings',
      label: copy.command.settings,
      icon: Settings,
      action: () => router.push('/settings'),
      keywords: ['settings', 'einstellungen', 'preferences', 'config', 'account'],
    },
  ];

  // ── Theme commands ──────────────────────────────────────────────────────────
  const themeCommands: CommandItem[] = [
    { id: 'theme-midnight', label: copy.command.themeMidnight, icon: Moon, action: () => setTheme('midnight'), keywords: ['theme', 'dark', 'midnight'] },
    { id: 'theme-nord', label: copy.command.themeNord, icon: Palette, action: () => setTheme('nord'), keywords: ['theme', 'nord', 'blue', 'gray'] },
    { id: 'theme-gold', label: copy.command.themeGold, icon: Palette, action: () => setTheme('gold'), keywords: ['theme', 'gold', 'premium', 'warm'] },
    { id: 'theme-platinum', label: copy.command.themePlatinum, icon: Palette, action: () => setTheme('platinum'), keywords: ['theme', 'platinum', 'premium', 'silver', 'metal'] },
    { id: 'theme-sapphire', label: copy.command.themeSapphire, icon: Palette, action: () => setTheme('sapphire'), keywords: ['theme', 'sapphire', 'premium', 'blue', 'metal'] },
    { id: 'theme-copper', label: copy.command.themeCopper, icon: Palette, action: () => setTheme('copper'), keywords: ['theme', 'copper', 'premium', 'bronze', 'warm'] },
    { id: 'theme-amethyst', label: copy.command.themeAmethyst, icon: Palette, action: () => setTheme('amethyst'), keywords: ['theme', 'amethyst', 'premium', 'violet'] },
    { id: 'theme-dracula', label: copy.command.themeDracula, icon: Palette, action: () => setTheme('dracula'), keywords: ['theme', 'dracula', 'purple', 'vampire'] },
    { id: 'theme-ocean', label: copy.command.themeOcean, icon: Palette, action: () => setTheme('ocean'), keywords: ['theme', 'ocean', 'blue', 'deep'] },
    { id: 'theme-emerald', label: copy.command.themeEmerald, icon: Palette, action: () => setTheme('emerald'), keywords: ['theme', 'emerald', 'green', 'nature'] },
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
      label: copy.command.addDailyTask,
      icon: Plus,
      action: () => triggerPageAction('/today', 'open-new-task'),
      keywords: ['add', 'new', 'create', 'task', 'todo', 'today', 'aufgabe', 'heute'],
      shortcut: 'D',
    },
    {
      id: 'action-add-goal',
      label: copy.command.addNewGoal,
      icon: Plus,
      action: () => triggerPageAction('/goals', 'open-new-goal'),
      keywords: ['add', 'new', 'create', 'goal', 'ziel'],
      shortcut: 'G',
    },
    {
      id: 'action-add-application',
      label: copy.command.addJobApplication,
      icon: Plus,
      action: () => triggerPageAction('/career', 'open-new-application'),
      keywords: ['add', 'new', 'create', 'job', 'application', 'bewerbung'],
      shortcut: 'A',
    },
    {
      id: 'action-add-course',
      label: copy.command.addCourse,
      icon: Plus,
      action: () => triggerPageAction('/university', 'open-new-course'),
      keywords: ['add', 'new', 'create', 'course', 'kurs'],
      shortcut: 'C',
    },
    {
      id: 'action-next-best',
      label: copy.command.startNextBestAction,
      icon: Zap,
      action: () => triggerPageAction('/today', 'start-next-best-action'),
      keywords: ['next', 'best', 'action', 'execute', 'priority', 'today', 'nächste', 'beste', 'aktion'],
      shortcut: 'N',
    },
    {
      id: 'action-theme-cycle',
      label: copy.command.cyclePremiumThemes,
      icon: Palette,
      action: () => {
        const currentIndex = THEME_CYCLE.indexOf(theme as (typeof THEME_CYCLE)[number]);
        const nextTheme = THEME_CYCLE[(currentIndex + 1) % THEME_CYCLE.length] ?? 'midnight';
        setTheme(nextTheme);
      },
      keywords: ['theme', 'toggle', 'switch', 'cycle', 'premium', 'gold', 'platinum', 'sapphire', 'copper', 'amethyst'],
      shortcut: 'T',
    },
    {
      id: 'action-focus-25',
      label: copy.command.startFocus25,
      icon: Play,
      action: () => { startTimer(); setTimerExpanded(true); },
      keywords: ['focus', 'fokus', 'start', 'pomodoro', '25', 'study'],
      shortcut: 'F',
    },
    {
      id: 'action-focus-50',
      label: copy.command.startFocus50,
      icon: Zap,
      action: () => { startTimer({ duration: 50 }); setTimerExpanded(true); },
      keywords: ['focus', 'fokus', 'start', 'deep', '50', 'work'],
    },
  ];

  // ── Focus timer commands ────────────────────────────────────────────────────
  const focusCommands: CommandItem[] = [
    ...(timerStatus === 'idle'
      ? [{
          id: 'focus-start',
          label: copy.command.startFocusTimer,
          icon: Play,
          action: () => { startTimer(); setTimerExpanded(true); },
          keywords: ['focus', 'fokus', 'timer', 'start', 'pomodoro', 'study'],
          shortcut: 'Alt+F',
        }]
      : []),
    ...(timerStatus === 'running' || timerStatus === 'break'
      ? [{
          id: 'focus-pause',
          label: copy.command.pauseTimer,
          icon: Pause,
          action: () => pauseTimer(),
          keywords: ['focus', 'fokus', 'timer', 'pause', 'pausieren'],
        }]
      : []),
    ...(timerStatus === 'paused' || timerStatus === 'break_paused'
      ? [{
          id: 'focus-resume',
          label: copy.command.resumeTimer,
          icon: Play,
          action: () => resumeTimer(),
          keywords: ['focus', 'fokus', 'timer', 'resume', 'continue', 'fortsetzen'],
        }]
      : []),
    ...(timerStatus !== 'idle'
      ? [{
          id: 'focus-stop',
          label: copy.command.stopTimer,
          icon: Square,
          action: () => stopTimer(),
          keywords: ['focus', 'fokus', 'timer', 'stop', 'end', 'beenden'],
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
                    placeholder={copy.command.placeholder}
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
                            <span>{copy.command.confirm}</span>
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
                  <Command.Empty className="flex flex-col items-center gap-2 py-10 text-center text-sm text-text-tertiary">
                    <Search className="h-7 w-7 opacity-20" />
                    <span>{copy.command.noResults}</span>
                  </Command.Empty>

                  {/* Navigation */}
                  <Command.Group
                    heading={copy.command.navigation}
                    className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-tertiary"
                  >
                    {navigationCommands.map((cmd) => {
                      const Icon = cmd.icon;
                      return (
                        <Command.Item
                          key={cmd.id}
                          value={`${cmd.label} ${cmd.keywords.join(' ')}`}
                          onSelect={() => handleSelect(cmd)}
                          className="command-item mb-0.5 flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 pl-3.5 text-sm font-medium text-text-secondary transition-colors aria-selected:border-primary/30 aria-selected:bg-primary/[0.2] aria-selected:text-text-primary"
                        >
                          <Icon className="command-item-icon h-4 w-4 flex-shrink-0" />
                          <span className="flex-1">{cmd.label}</span>
                        </Command.Item>
                      );
                    })}
                  </Command.Group>

                  {/* Themes */}
                  <Command.Group
                    heading={copy.command.themes}
                    className="mt-1 px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-tertiary"
                  >
                    {themeCommands.map((cmd) => {
                      const Icon = cmd.icon;
                      const isActive = theme === cmd.id.replace('theme-', '');
                      return (
                        <Command.Item
                          key={cmd.id}
                          value={`${cmd.label} ${cmd.keywords.join(' ')}`}
                          onSelect={() => handleSelect(cmd)}
                          className="command-item mb-0.5 flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 pl-3.5 text-sm font-medium text-text-secondary transition-colors aria-selected:border-primary/30 aria-selected:bg-primary/[0.2] aria-selected:text-text-primary"
                        >
                          <Icon className="command-item-icon h-4 w-4 flex-shrink-0" />
                          <span className="flex-1">{cmd.label}</span>
                          {isActive && (
                            <span className="rounded-full border border-primary/25 bg-primary/15 px-2 py-0.5 text-[10px] text-primary">
                              {copy.command.active}
                            </span>
                          )}
                        </Command.Item>
                      );
                    })}
                  </Command.Group>

                  {/* Focus Timer (context-sensitive) */}
                  {focusCommands.length > 0 && (
                    <Command.Group
                      heading={copy.command.focusTimer}
                      className="mt-1 px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-tertiary"
                    >
                      {focusCommands.map((cmd) => {
                        const Icon = cmd.icon;
                        return (
                          <Command.Item
                            key={cmd.id}
                            value={`${cmd.label} ${cmd.keywords.join(' ')}`}
                            onSelect={() => handleSelect(cmd)}
                            className="command-item mb-0.5 flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 pl-3.5 text-sm font-medium text-text-secondary transition-colors aria-selected:border-primary/30 aria-selected:bg-primary/[0.2] aria-selected:text-text-primary"
                          >
                            <Icon className="command-item-icon h-4 w-4 flex-shrink-0" />
                            <span className="flex-1">{cmd.label}</span>
                            {'shortcut' in cmd && cmd.shortcut && (
                              <kbd className="rounded border border-border bg-surface-hover px-1.5 py-0.5 text-[10px] text-text-tertiary">
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
                    heading={copy.command.quickActions}
                    className="mt-1 px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-tertiary"
                  >
                    {quickActions.map((cmd) => {
                      const Icon = cmd.icon;
                      return (
                        <Command.Item
                          key={cmd.id}
                          value={`${cmd.label} ${cmd.keywords.join(' ')}`}
                          onSelect={() => handleSelect(cmd)}
                          className="command-item mb-0.5 flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 pl-3.5 text-sm font-medium text-text-secondary transition-colors aria-selected:border-primary/30 aria-selected:bg-primary/[0.2] aria-selected:text-text-primary"
                        >
                          <Icon className="command-item-icon h-4 w-4 flex-shrink-0" />
                          <span className="flex-1">{cmd.label}</span>
                          {cmd.shortcut && (
                            <kbd className="rounded border border-border bg-surface-hover px-1.5 py-0.5 text-[10px] text-text-tertiary">
                              ⌘{cmd.shortcut}
                            </kbd>
                          )}
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                </Command.List>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border/70 bg-surface/35 px-4 py-2.5">
                  <div className="flex items-center gap-4 text-[10px] text-text-tertiary">
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-border bg-surface-hover px-1 py-0.5 text-[9px]">↑↓</kbd>
                      {copy.command.navigate}
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-border bg-surface-hover px-1 py-0.5 text-[9px]">↵</kbd>
                      {copy.command.execute}
                    </span>
                    {isIntentMode && (
                      <span className="flex items-center gap-1 text-amber-500/70">
                        <Terminal className="h-3 w-3" />
                        {copy.command.intentMode}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-text-tertiary">
                    <Zap className="h-3 w-3" />
                    {copy.command.commandBrand}
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
