'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Keyboard } from 'lucide-react';
import { useCommandPalette } from '@/components/shared/CommandPaletteProvider';
import { hasHotkeyBlocker, isTypingTarget } from '@/lib/hotkeys/guards';

interface PowerHotkeysContextValue {
  overlayOpen: boolean;
  openOverlay: () => void;
  closeOverlay: () => void;
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

const PowerHotkeysContext = createContext<PowerHotkeysContextValue>({
  overlayOpen: false,
  openOverlay: () => {},
  closeOverlay: () => {},
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
  const [overlayOpen, setOverlayOpen] = useState(false);

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
        return;
      }

      if (event.key === 'b' || event.key === 'B') {
        event.preventDefault();
        if (pathname !== '/today') {
          router.push('/today');
        }
        return;
      }

      const destination = PAGE_HOTKEYS[event.key];
      if (!destination) return;
      event.preventDefault();
      if (pathname !== destination) {
        router.push(destination);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCommandPaletteOpen, openCommandPalette, overlayOpen, pathname, router]);

  const value = useMemo(
    () => ({
      overlayOpen,
      openOverlay: () => setOverlayOpen(true),
      closeOverlay: () => setOverlayOpen(false),
    }),
    [overlayOpen]
  );

  return (
    <PowerHotkeysContext.Provider value={value}>
      {children}
      <ShortcutOverlay open={overlayOpen} onClose={() => setOverlayOpen(false)} />
    </PowerHotkeysContext.Provider>
  );
}

