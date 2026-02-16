'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Keyboard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCommandPalette } from '@/components/shared/CommandPaletteProvider';
import { hasFocusedListNavigationItem, hasHotkeyBlocker, isTypingTarget } from '@/lib/hotkeys/guards';
import { useFocusTimer } from '@/components/providers/FocusTimerProvider';
import { useAppSound } from '@/lib/hooks/useAppSound';
import { dispatchPrismCommandAction, queuePrismCommandAction, type PrismCommandAction } from '@/lib/hooks/useCommandActions';
import { dispatchListNavigationAction } from '@/lib/hooks/useListNavigation';
import { dispatchPingAction, type PingAction } from '@/lib/hotkeys/ping';

interface PowerHotkeysContextValue {
  overlayOpen: boolean;
  openOverlay: () => void;
  closeOverlay: () => void;
  summonerSpells: SummonerSpells;
  setSummonerSpell: (slot: 'd' | 'f', action: SummonerSpellAction) => void;
}

const PAGE_HOTKEYS: Record<string, string> = {
  '1': '/today',
  '2': '/goals',
  '3': '/career',
  '4': '/university',
  '5': '/analytics',
  '6': '/calendar',
  '7': '/settings',
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

const SUMMONER_STORAGE_KEY = 'prism:summoner-spells';

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
  if (pathname.startsWith('/goals')) return 'goals';
  if (pathname.startsWith('/career')) return 'career';
  if (pathname.startsWith('/university')) return 'university';
  if (pathname.startsWith('/analytics')) return 'analytics';
  if (pathname.startsWith('/calendar')) return 'calendar';
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        data-hotkeys-disabled="true"
        className="w-[min(900px,95vw)] rounded-xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <Keyboard className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-text-primary">Prism Hotkeys</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary"
          >
            Esc
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-background/40 p-4">
            <div className="mb-2 text-xs uppercase tracking-wider text-text-tertiary">Navigation</div>
            <ul className="space-y-1.5 text-sm text-text-primary">
              <li><span className="font-mono text-primary">1-7</span> switch pages</li>
              <li><span className="font-mono text-primary">B</span> back to Today</li>
              <li><span className="font-mono text-primary">P</span> open command bar</li>
              <li><span className="font-mono text-primary">Q/W/E/R</span> page abilities</li>
              <li><span className="font-mono text-primary">D/F</span> summoner spells</li>
              <li><span className="font-mono text-primary">Tab (hold)</span> scoreboard</li>
              <li><span className="font-mono text-primary">Space</span> urgent jump</li>
              <li><span className="font-mono text-primary">?</span> open this overlay</li>
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-background/40 p-4">
            <div className="mb-2 text-xs uppercase tracking-wider text-text-tertiary">List Control</div>
            <ul className="space-y-1.5 text-sm text-text-primary">
              <li><span className="font-mono text-primary">J / K</span> move focus</li>
              <li><span className="font-mono text-primary">Enter</span> trigger focused item</li>
              <li><span className="font-mono text-primary">Space</span> toggle focused item</li>
              <li><span className="font-mono text-primary">G + G/V/E/F</span> ping action</li>
              <li><span className="font-mono text-primary">Esc</span> clear focus / close overlays</li>
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
  const exercisesThisWeek = nextTasks?.stats?.exercisesThisWeek ?? 0;
  const goalsDueSoon = nextTasks?.stats?.goalsDueSoon ?? 0;
  const interviewsUpcoming = nextTasks?.stats?.interviewsUpcoming ?? 0;
  const overdueGoals = stats?.goals?.overdue ?? 0;

  const taskScore = tasksToday > 0 ? Math.round((tasksCompleted / tasksToday) * 100) : 100;
  const weekScore = weekTotal > 0 ? Math.round((weekDay / weekTotal) * 100) : 0;
  const kda = `${tasksCompleted}/${Math.max(overdueGoals, 0)}/${Math.max(goalsDueSoon, 0)}`;
  const grade = taskScore >= 85 ? 'S-' : taskScore >= 70 ? 'A-' : taskScore >= 55 ? 'B' : 'C';

  return (
    <div className="fixed inset-0 z-[68] pointer-events-none flex items-start justify-center pt-20">
      <div data-hotkeys-disabled="true" className="w-[min(860px,95vw)] rounded-xl border border-border bg-surface/95 backdrop-blur-xl shadow-2xl p-5">
        <div className="mb-3 text-sm uppercase tracking-wider text-text-tertiary">Weekly Scoreboard</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-background/40 p-3">
            <div className="text-xs text-text-tertiary mb-1">Tasks</div>
            <div className="text-lg font-semibold text-text-primary">{tasksCompleted}/{tasksToday || 0}</div>
            <div className="text-xs text-text-tertiary">{taskScore}% completion</div>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-3">
            <div className="text-xs text-text-tertiary mb-1">Week Progress</div>
            <div className="text-lg font-semibold text-text-primary">Day {weekDay}/{weekTotal}</div>
            <div className="text-xs text-text-tertiary">{weekScore}% through week</div>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-3">
            <div className="text-xs text-text-tertiary mb-1">Execution Signals</div>
            <div className="text-sm text-text-primary">Exercises: {exercisesThisWeek} · Interviews: {interviewsUpcoming}</div>
            <div className="text-xs text-text-tertiary">Goals due soon: {goalsDueSoon}</div>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-3">
            <div className="text-xs text-text-tertiary mb-1">KDA / Grade</div>
            <div className="text-lg font-semibold text-text-primary">{kda}</div>
            <div className="text-xs text-text-tertiary">Grade: {grade}</div>
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
  const { status: timerStatus, startTimer, pauseTimer, resumeTimer, setIsExpanded: setTimerExpanded } = useFocusTimer();
  const { play } = useAppSound();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [scoreboardOpen, setScoreboardOpen] = useState(false);
  const [pingArmed, setPingArmed] = useState(false);
  const pingTimeoutRef = useRef<number | null>(null);
  const [summonerSpells, setSummonerSpells] = useState<SummonerSpells>(() => {
    if (typeof window === 'undefined') return DEFAULT_SUMMONER_SPELLS;
    try {
      return normalizeSummonerSpells(JSON.parse(window.localStorage.getItem(SUMMONER_STORAGE_KEY) ?? 'null'));
    } catch {
      return DEFAULT_SUMMONER_SPELLS;
    }
  });

  const { data: statsData } = useQuery<DashboardStatsResponse | null>({
    queryKey: ['power-hotkeys', 'dashboard-stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) return null;
        return (await response.json()) as DashboardStatsResponse;
      } catch {
        return null;
      }
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: nextTasksData } = useQuery<NextTasksResponse | null>({
    queryKey: ['power-hotkeys', 'next-tasks'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/dashboard/next-tasks');
        if (!response.ok) return null;
        return (await response.json()) as NextTasksResponse;
      } catch {
        return null;
      }
    },
    staleTime: 15 * 1000,
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
          triggerPageAction('/goals', 'open-new-goal');
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
          triggerPageAction('/goals', 'open-new-goal');
          return true;
        }
        if (key === 'e') {
          dispatchListNavigationAction('enter');
          return true;
        }
        if (key === 'r') {
          router.push('/goals');
          return true;
        }
      }

      if (page === 'career') {
        if (key === 'q') {
          triggerPageAction('/career', 'open-new-application');
          return true;
        }
        if (key === 'e') {
          dispatchListNavigationAction('enter');
          return true;
        }
        if (key === 'r') {
          router.push('/career');
          return true;
        }
      }

      if (page === 'university') {
        if (key === 'q') {
          triggerPageAction('/university', 'open-new-course');
          return true;
        }
        if (key === 'e') {
          dispatchListNavigationAction('enter');
          return true;
        }
        if (key === 'r') {
          router.push('/university');
          return true;
        }
      }

      if (page === 'analytics') {
        if (key === 'q' || key === 'r') {
          router.push('/analytics');
          return true;
        }
      }

      if (page === 'calendar') {
        if (key === 'q' || key === 'r') {
          router.push('/calendar');
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
      router.push('/university');
      play('swoosh');
      return;
    }

    const urgentInterview = (nextTasksData?.interviews ?? [])
      .filter((item) => item.daysUntil <= 1)
      .sort((a, b) => a.daysUntil - b.daysUntil)[0];
    if (urgentInterview) {
      router.push('/career');
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
      router.push('/goals');
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
