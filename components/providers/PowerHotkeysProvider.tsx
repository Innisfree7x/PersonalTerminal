'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Keyboard } from 'lucide-react';
import { useCommandPalette } from '@/components/shared/CommandPaletteProvider';
import { hasHotkeyBlocker, isTypingTarget } from '@/lib/hotkeys/guards';
import { useFocusTimer } from '@/components/providers/FocusTimerProvider';
import { useAppSound } from '@/lib/hooks/useAppSound';
import { dispatchPrismCommandAction, queuePrismCommandAction, type PrismCommandAction } from '@/lib/hooks/useCommandActions';
import { dispatchListNavigationAction } from '@/lib/hooks/useListNavigation';

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
              <li><span className="font-mono text-primary">?</span> open this overlay</li>
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-background/40 p-4">
            <div className="mb-2 text-xs uppercase tracking-wider text-text-tertiary">List Control</div>
            <ul className="space-y-1.5 text-sm text-text-primary">
              <li><span className="font-mono text-primary">J / K</span> move focus</li>
              <li><span className="font-mono text-primary">Enter</span> trigger focused item</li>
              <li><span className="font-mono text-primary">Space</span> toggle focused item</li>
              <li><span className="font-mono text-primary">Esc</span> clear focus / close overlay</li>
            </ul>
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
  const [summonerSpells, setSummonerSpells] = useState<SummonerSpells>(() => {
    if (typeof window === 'undefined') return DEFAULT_SUMMONER_SPELLS;
    try {
      return normalizeSummonerSpells(JSON.parse(window.localStorage.getItem(SUMMONER_STORAGE_KEY) ?? 'null'));
    } catch {
      return DEFAULT_SUMMONER_SPELLS;
    }
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

      if (event.shiftKey && event.key === '?') {
        event.preventDefault();
        setOverlayOpen(true);
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
    runSummonerSpell,
    summonerSpells.d,
    summonerSpells.f,
  ]);

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
    </PowerHotkeysContext.Provider>
  );
}
