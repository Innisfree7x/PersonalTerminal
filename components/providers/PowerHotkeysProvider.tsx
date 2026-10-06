'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Keyboard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCommandPalette } from '@/components/shared/CommandPaletteProvider';
import { hasFocusedListNavigationItem, hasHotkeyBlocker, isTypingTarget } from '@/lib/hotkeys/guards';
import {
  useFocusTimerActions,
  useFocusTimerSession,
} from '@/components/providers/FocusTimerProvider';
import { useAppSound } from '@/lib/hooks/useAppSound';
import { dispatchPrismCommandAction, queuePrismCommandAction, type PrismCommandAction } from '@/lib/hooks/useCommandActions';
import { dispatchListNavigationAction } from '@/lib/hooks/useListNavigation';
import { dispatchPingAction, type PingAction } from '@/lib/hotkeys/ping';
import { LEGACY_STORAGE_KEYS, readStorageValueWithLegacy, STORAGE_KEYS } from '@/lib/storage/keys';
import {
  DASHBOARD_NEXT_TASKS_QUERY_KEY,
  fetchDashboardNextTasksSafe,
} from '@/lib/dashboard/nextTasksClient';

interface PowerHotkeysContextValue {
  overlayOpen: boolean;
  openOverlay: () => void;
  closeOverlay: () => void;
  summonerSpells: SummonerSpells;
  setSummonerSpell: (slot: 'd' | 'f', action: SummonerSpellAction) => void;
}

const PAGE_HOTKEYS: Record<string, string> = {
  '1': '/today',
  '2': '/workspace/calendar',
  '3': '/workspace/tasks',
  '4': '/workspace/inbox',
  '5': '/workspace/goals',
  '6': '/focus',
};

export type SummonerSpellAction =
  | 'quick-capture'
  | 'focus-toggle'
  | 'command-bar'
  | 'go-today'
  | 'new-task'
  | 'new-goal'
  | 'start-next-best';

interface SummonerSpells {
  d: SummonerSpellAction;
  f: SummonerSpellAction;
}

const DEFAULT_SUMMONER_SPELLS: SummonerSpells = {
  d: 'quick-capture',
  f: 'focus-toggle',
};

const SUMMONER_STORAGE_KEY = STORAGE_KEYS.summonerSpells;

function normalizeSummonerSpells(value: unknown): SummonerSpells {
  if (!value || typeof value !== 'object') return DEFAULT_SUMMONER_SPELLS;
  const record = value as Partial<Record<'d' | 'f', unknown>>;
  const valid: SummonerSpellAction[] = [
    'quick-capture',
    'focus-toggle',
    'command-bar',
    'go-today',
    'new-task',
    'new-goal',
    'start-next-best',
  ];
  const d = valid.includes(record.d as SummonerSpellAction)
    ? (record.d as SummonerSpellAction)
    : DEFAULT_SUMMONER_SPELLS.d;
  const f = valid.includes(record.f as SummonerSpellAction)
    ? (record.f as SummonerSpellAction)
    : DEFAULT_SUMMONER_SPELLS.f;
  return { d, f };
}

function getPageKey(pathname: string): 'today' | 'goals' | 'career' | 'university' | 'analytics' | 'calendar' | 'settings' | 'other' {
  if (pathname.startsWith('/today')) return 'today';
  if (pathname.startsWith('/workspace/goals')) return 'goals';
  if (pathname.startsWith('/workspace/calendar')) return 'calendar';
  if (pathname.startsWith('/workspace')) return 'today';
  if (pathname.startsWith('/career')) return 'career';
  if (pathname.startsWith('/uni')) return 'university';
  if (pathname.startsWith('/reflect')) return 'analytics';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'other';
}

const PowerHotkeysContext = createContext<PowerHotkeysContextValue>({
  overlayOpen: false,
  openOverlay: () => {},
  closeOverlay: () => {},
  summonerSpells: DEFAULT_SUMMONER_SPELLS,
  setSummonerSpell: () => {},
});

export function usePowerHotkeys() {
  return useContext(PowerHotkeysContext);
}

interface DashboardStatsResponse {
  goals?: { overdue?: number };
  metrics?: {
    weekProgress?: { day?: number; total?: number };
  };
}

interface NextTasksResponse {
  homeworks?: Array<{ daysUntilExam?: number }>;
  goals?: Array<{ daysUntil: number }>;
  interviews?: Array<{ daysUntil: number }>;
  stats?: {
    tasksToday?: number;
    tasksCompleted?: number;
    exercisesThisWeek?: number;
    goalsDueSoon?: number;
    interviewsUpcoming?: number;
  };
}

function ShortcutOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div
        data-hotkeys-disabled="true"
        className="w-[min(800px,95vw)] rounded-2xl border border-white/10 bg-[#0B0F19] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
                Terminal Tastaturkürzel
              </h2>
              <p className="text-xs text-white/50 font-mono">
                Linear & Bloomberg-Style Power Navigation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-mono text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            Esc Schließen
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3 font-mono">
            <div className="text-[11px] uppercase tracking-wider text-cyan-400 font-semibold border-b border-white/5 pb-2">
              Schnell-Aktionen & Navigation
            </div>
            <ul className="space-y-2 text-xs text-white/80">
              <li className="flex items-center justify-between">
                <span>Befehlsmenü (Palette)</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-semibold">Cmd + K</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Schnellerfassung (Task/Zeit/Idee)</span>
                <kbd className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">C / Q</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Heute / Terminal</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-white">1</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Kalender (Google 2-Way)</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-white">2</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Aufgaben</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-white">3</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Inbox (Gmail Triage)</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-white">4</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Ziele & Startup Hub</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-white">5</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Fokus-Modus</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-white">6</kbd>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3 font-mono">
            <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold border-b border-white/5 pb-2">
              Listen & Terminal Steuerung
            </div>
            <ul className="space-y-2 text-xs text-white/80">
              <li className="flex items-center justify-between">
                <span>Element auswählen (hoch/runter)</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-semibold">J / K</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Ausführen / Öffnen</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-semibold">Enter</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Task abhaken / Status wechseln</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-semibold">Space</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Google Sync aktualisieren</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-white">Cmd + R</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Abbrechen / Zurück</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-white">Esc</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Dieses Hilfefenster öffnen</span>
                <kbd className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">?</kbd>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreboardOverlay({
  open,
  stats,
  nextTasks,
}: {
  open: boolean;
  stats: DashboardStatsResponse | null;
  nextTasks: NextTasksResponse | null;
}) {
  if (!open) return null;

  const weekDay = stats?.metrics?.weekProgress?.day ?? 0;
  const weekTotal = stats?.metrics?.weekProgress?.total ?? 7;
  const tasksCompleted = nextTasks?.stats?.tasksCompleted ?? 0;
  const tasksToday = nextTasks?.stats?.tasksToday ?? 0;
  const goalsDueSoon = nextTasks?.stats?.goalsDueSoon ?? 0;
  const overdueGoals = stats?.goals?.overdue ?? 0;

  const taskScore = tasksToday > 0 ? Math.round((tasksCompleted / tasksToday) * 100) : 100;
  const weekScore = weekTotal > 0 ? Math.round((weekDay / weekTotal) * 100) : 0;
  const executionStatus =
    taskScore >= 80 ? 'Optimale Velocity (High Flow)' : taskScore >= 60 ? 'Auf Kurs' : 'Fokus erforderlich';

  return (
    <div className="fixed inset-0 z-[68] pointer-events-none flex items-start justify-center pt-20">
      <div data-hotkeys-disabled="true" className="w-[min(860px,95vw)] rounded-2xl border border-white/10 bg-[#0B0F19]/95 backdrop-blur-xl shadow-2xl p-5 font-mono">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Terminal Executive Scorecard
          </div>
          <div className="text-[11px] text-white/40">
            Hold [Tab] to view · Release to dismiss
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 space-y-1">
            <div className="text-[10px] uppercase text-white/40">Heutige Aufgaben</div>
            <div className="text-xl font-bold text-white">{tasksCompleted} / {tasksToday || 0}</div>
            <div className="text-xs text-emerald-400">{taskScore}% Erledigungsquote</div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 space-y-1">
            <div className="text-[10px] uppercase text-white/40">Wochenverlauf</div>
            <div className="text-xl font-bold text-white">Tag {weekDay} / {weekTotal}</div>
            <div className="text-xs text-cyan-400">{weekScore}% der Woche absolviert</div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 space-y-1">
            <div className="text-[10px] uppercase text-white/40">Strategische Ziele</div>
            <div className="text-sm font-semibold text-white">
              {goalsDueSoon} fällig demnächst · {overdueGoals} im Verzug
            </div>
            <div className="text-xs text-white/40">Top-Down Roadmap Tracking</div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 space-y-1">
            <div className="text-[10px] uppercase text-white/40">Execution Momentum</div>
            <div className="text-sm font-semibold text-emerald-400">{executionStatus}</div>
            <div className="text-xs text-white/40">Linear & Bloomberg Standard</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PowerHotkeysProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { open: openCommandPalette, isOpen: isCommandPaletteOpen } = useCommandPalette();
  const { status: timerStatus } = useFocusTimerSession();
  const { startTimer, pauseTimer, resumeTimer, setIsExpanded: setTimerExpanded } = useFocusTimerActions();
  const { play } = useAppSound();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [scoreboardOpen, setScoreboardOpen] = useState(false);
  const [pingArmed, setPingArmed] = useState(false);
  const pingTimeoutRef = useRef<number | null>(null);
  const [summonerSpells, setSummonerSpells] = useState<SummonerSpells>(() => {
    if (typeof window === 'undefined') return DEFAULT_SUMMONER_SPELLS;
    try {
      const raw = readStorageValueWithLegacy(
        window.localStorage,
        SUMMONER_STORAGE_KEY,
        LEGACY_STORAGE_KEYS.summonerSpells
      );
      return normalizeSummonerSpells(JSON.parse(raw ?? 'null'));
    } catch {
      return DEFAULT_SUMMONER_SPELLS;
    }
  });

  const hotkeyDataEnabled = overlayOpen || scoreboardOpen;

  const { data: statsData } = useQuery<DashboardStatsResponse | null>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) return null;
        return (await response.json()) as DashboardStatsResponse;
      } catch {
        return null;
      }
    },
    enabled: hotkeyDataEnabled,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: nextTasksData } = useQuery<NextTasksResponse | null>({
    queryKey: DASHBOARD_NEXT_TASKS_QUERY_KEY,
    queryFn: fetchDashboardNextTasksSafe,
    enabled: hotkeyDataEnabled,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const triggerPageAction = useCallback(
    (targetPath: string, action: PrismCommandAction) => {
      if (pathname === targetPath) {
        dispatchPrismCommandAction(action);
        return;
      }
      queuePrismCommandAction(action);
      router.push(targetPath);
    },
    [pathname, router]
  );

  const setSummonerSpell = useCallback((slot: 'd' | 'f', action: SummonerSpellAction) => {
    setSummonerSpells((prev) => {
      const next = { ...prev, [slot]: action };
      try {
        window.localStorage.setItem(SUMMONER_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage failure
      }
      return next;
    });
  }, []);

  const runFocusToggle = useCallback(() => {
    if (timerStatus === 'idle') {
      startTimer();
      setTimerExpanded(true);
      return;
    }
    if (timerStatus === 'running' || timerStatus === 'break') {
      pauseTimer();
      return;
    }
    resumeTimer();
  }, [pauseTimer, resumeTimer, setTimerExpanded, startTimer, timerStatus]);

  const runSummonerSpell = useCallback(
    (spell: SummonerSpellAction) => {
      switch (spell) {
        case 'quick-capture':
        case 'new-task':
          triggerPageAction('/today', 'open-new-task');
          return;
        case 'focus-toggle':
          runFocusToggle();
          return;
        case 'command-bar':
          openCommandPalette();
          return;
        case 'go-today':
          if (pathname !== '/today') router.push('/today');
          return;
        case 'new-goal':
          triggerPageAction('/workspace/goals', 'open-new-goal');
          return;
        case 'start-next-best':
          triggerPageAction('/today', 'start-next-best-action');
          return;
        default:
          return;
      }
    },
    [openCommandPalette, pathname, router, runFocusToggle, triggerPageAction]
  );

  const runAbility = useCallback(
    (key: 'q' | 'w' | 'e' | 'r') => {
      const page = getPageKey(pathname);
      if (page === 'today') {
        if (key === 'q') {
          triggerPageAction('/today', 'open-new-task');
          return true;
        }
        if (key === 'w') {
          dispatchListNavigationAction('space');
          return true;
        }
        if (key === 'e') {
          dispatchListNavigationAction('enter');
          return true;
        }
        if (key === 'r') {
          startTimer();
          setTimerExpanded(true);
          return true;
        }
      }

      if (page === 'goals') {
        if (key === 'q') {
          triggerPageAction('/workspace/goals', 'open-new-goal');
          return true;
        }
        if (key === 'e') {
          dispatchListNavigationAction('enter');
          return true;
        }
        if (key === 'r') {
          router.push('/workspace/goals');
          return true;
        }
      }

      if (page === 'career') {
        if (key === 'q') {
          triggerPageAction('/career/applications', 'open-new-application');
          return true;
        }
        if (key === 'e') {
          dispatchListNavigationAction('enter');
          return true;
        }
        if (key === 'r') {
          router.push('/career/applications');
          return true;
        }
      }

      if (page === 'university') {
        if (key === 'q') {
          triggerPageAction('/uni/courses', 'open-new-course');
          return true;
        }
        if (key === 'e') {
          dispatchListNavigationAction('enter');
          return true;
        }
        if (key === 'r') {
          router.push('/uni/courses');
          return true;
        }
      }

      if (page === 'analytics') {
        if (key === 'q' || key === 'r') {
          router.push('/reflect/analytics');
          return true;
        }
      }

      if (page === 'calendar') {
        if (key === 'q' || key === 'r') {
          router.push('/workspace/calendar');
          return true;
        }
      }

      return false;
    },
    [pathname, router, setTimerExpanded, startTimer, triggerPageAction]
  );

  const runUrgentJump = useCallback(() => {
    const urgentExam = (nextTasksData?.homeworks ?? [])
      .filter((item) => item.daysUntilExam !== undefined && item.daysUntilExam <= 7)
      .sort((a, b) => (a.daysUntilExam ?? 999) - (b.daysUntilExam ?? 999))[0];
    if (urgentExam) {
      router.push('/uni/courses');
      play('swoosh');
      return;
    }

    const urgentInterview = (nextTasksData?.interviews ?? [])
      .filter((item) => item.daysUntil <= 1)
      .sort((a, b) => a.daysUntil - b.daysUntil)[0];
    if (urgentInterview) {
      router.push('/career/applications');
      play('swoosh');
      return;
    }

    if ((statsData?.goals?.overdue ?? 0) > 0) {
      router.push('/today');
      play('click');
      return;
    }

    const goalToday = (nextTasksData?.goals ?? [])
      .filter((item) => item.daysUntil <= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil)[0];
    if (goalToday) {
      router.push('/workspace/goals');
      play('click');
      return;
    }

    router.push('/today');
    play('click');
  }, [nextTasksData?.goals, nextTasksData?.homeworks, nextTasksData?.interviews, play, router, statsData?.goals?.overdue]);

  const startPingMode = useCallback(() => {
    setPingArmed(true);
    if (pingTimeoutRef.current) {
      window.clearTimeout(pingTimeoutRef.current);
      pingTimeoutRef.current = null;
    }
    pingTimeoutRef.current = window.setTimeout(() => {
      setPingArmed(false);
      pingTimeoutRef.current = null;
    }, 1200);
  }, []);

  const runPingAction = useCallback((action: PingAction) => {
    dispatchPingAction(action);
    play('click');
    setPingArmed(false);
    if (pingTimeoutRef.current) {
      window.clearTimeout(pingTimeoutRef.current);
      pingTimeoutRef.current = null;
    }
  }, [play]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      if (overlayOpen) {
        if (event.key === 'Escape') {
          event.preventDefault();
          setOverlayOpen(false);
        }
        return;
      }

      if (isCommandPaletteOpen || hasHotkeyBlocker()) return;

      if (event.key === 'Tab') {
        event.preventDefault();
        setScoreboardOpen(true);
        return;
      }

      if (pingArmed) {
        const pingKey = event.key.toLowerCase();
        if (pingKey === 'g') {
          event.preventDefault();
          runPingAction('critical');
          return;
        }
        if (pingKey === 'v') {
          event.preventDefault();
          runPingAction('in-progress');
          return;
        }
        if (pingKey === 'e') {
          event.preventDefault();
          runPingAction('snooze');
          return;
        }
        if (pingKey === 'f') {
          event.preventDefault();
          runPingAction('done');
          return;
        }
        setPingArmed(false);
        if (pingTimeoutRef.current) {
          window.clearTimeout(pingTimeoutRef.current);
          pingTimeoutRef.current = null;
        }
        return;
      }

      if (event.shiftKey && event.key === '?') {
        event.preventDefault();
        setOverlayOpen(true);
        return;
      }

      if (event.key === 'g' || event.key === 'G') {
        event.preventDefault();
        startPingMode();
        return;
      }

      if (event.key === 'p' || event.key === 'P') {
        event.preventDefault();
        openCommandPalette();
        play('click');
        return;
      }

      if (event.key === 'b' || event.key === 'B') {
        event.preventDefault();
        if (pathname !== '/today') {
          router.push('/today');
        }
        play('click');
        return;
      }

      if (event.key === 'd' || event.key === 'D') {
        event.preventDefault();
        runSummonerSpell(summonerSpells.d);
        play('swoosh');
        return;
      }

      if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        runSummonerSpell(summonerSpells.f);
        play('swoosh');
        return;
      }

      if (
        event.key === 'q' ||
        event.key === 'Q' ||
        event.key === 'w' ||
        event.key === 'W' ||
        event.key === 'e' ||
        event.key === 'E' ||
        event.key === 'r' ||
        event.key === 'R'
      ) {
        const handled = runAbility(event.key.toLowerCase() as 'q' | 'w' | 'e' | 'r');
        if (handled) {
          event.preventDefault();
          play('click');
        }
        return;
      }

      if (event.key === ' ') {
        if (hasFocusedListNavigationItem()) return;
        event.preventDefault();
        runUrgentJump();
        return;
      }

      const destination = PAGE_HOTKEYS[event.key];
      if (!destination) return;
      event.preventDefault();
      if (pathname !== destination) {
        router.push(destination);
      }
      play('click');
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isCommandPaletteOpen,
    openCommandPalette,
    overlayOpen,
    pathname,
    play,
    router,
    runAbility,
    runPingAction,
    runUrgentJump,
    runSummonerSpell,
    pingArmed,
    startPingMode,
    summonerSpells.d,
    summonerSpells.f,
  ]);

  useEffect(() => {
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setScoreboardOpen(false);
      }
    };
    window.addEventListener('keyup', onKeyUp);
    return () => window.removeEventListener('keyup', onKeyUp);
  }, []);

  useEffect(() => {
    return () => {
      if (pingTimeoutRef.current) {
        window.clearTimeout(pingTimeoutRef.current);
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      overlayOpen,
      openOverlay: () => setOverlayOpen(true),
      closeOverlay: () => setOverlayOpen(false),
      summonerSpells,
      setSummonerSpell,
    }),
    [overlayOpen, setSummonerSpell, summonerSpells]
  );

  return (
    <PowerHotkeysContext.Provider value={value}>
      {children}
      <ShortcutOverlay open={overlayOpen} onClose={() => setOverlayOpen(false)} />
      <ScoreboardOverlay open={scoreboardOpen} stats={statsData ?? null} nextTasks={nextTasksData ?? null} />
      {pingArmed && (
        <div className="fixed bottom-6 right-6 z-[69] rounded-lg border border-primary/40 bg-surface/90 px-3 py-2 text-xs text-text-primary shadow-lg">
          Ping mode: <span className="font-mono text-primary">G</span> critical ·{' '}
          <span className="font-mono text-primary">V</span> progress ·{' '}
          <span className="font-mono text-primary">E</span> snooze ·{' '}
          <span className="font-mono text-primary">F</span> done
        </div>
      )}
    </PowerHotkeysContext.Provider>
  );
}
