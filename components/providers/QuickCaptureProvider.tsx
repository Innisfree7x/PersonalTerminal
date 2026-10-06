'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import QuickCaptureModal, { CaptureMode } from '@/components/features/terminal/QuickCaptureModal';

interface QuickCaptureContextType {
  openCapture: (mode?: CaptureMode) => void;
  closeCapture: () => void;
  isOpen: boolean;
}

const QuickCaptureContext = createContext<QuickCaptureContextType>({
  openCapture: () => {},
  closeCapture: () => {},
  isOpen: false,
});

export function useQuickCapture() {
  return useContext(QuickCaptureContext);
}

export default function QuickCaptureProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<CaptureMode>('task');

  const openCapture = useCallback((targetMode?: CaptureMode) => {
    if (targetMode) setMode(targetMode);
    setIsOpen(true);
  }, []);

  const closeCapture = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Global Keyboard Listener: 'c' or 'q' or Cmd+Shift+C
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, select, or contenteditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Check for Cmd+Shift+C or 'c' or 'q'
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        openCapture('task');
      } else if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          openCapture('task');
        } else if (e.key === 'q' || e.key === 'Q') {
          e.preventDefault();
          openCapture('task');
        }
      }
    };

    const handleCustomOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{ mode?: CaptureMode }>;
      openCapture(customEvent.detail?.mode ?? 'task');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('terminal:quick-capture:open', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('terminal:quick-capture:open', handleCustomOpen);
    };
  }, [openCapture]);

  return (
    <QuickCaptureContext.Provider value={{ openCapture, closeCapture, isOpen }}>
      {children}
      <QuickCaptureModal
        isOpen={isOpen}
        onClose={closeCapture}
        defaultMode={mode}
      />
    </QuickCaptureContext.Provider>
  );
}
