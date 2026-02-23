import { act, cleanup, fireEvent, renderWithProviders, screen } from '@/tests/utils/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LucianBubbleProvider } from '@/components/providers/LucianBubbleProvider';
import type { ChampionEvent } from '@/lib/champion/championEvents';

let mockedPathname = '/today';
let championListener: ((event: ChampionEvent) => void) | null = null;
const originalFetch = globalThis.fetch;

vi.mock('next/navigation', () => ({
  usePathname: () => mockedPathname,
}));

vi.mock('@/lib/champion/championEvents', () => ({
  subscribeChampionEvent: (cb: (event: ChampionEvent) => void) => {
    championListener = cb;
    return () => {
      championListener = null;
    };
  },
}));

vi.mock('@/components/features/lucian/LucianBubble', () => ({
  LucianBubble: (props: {
    text: string;
    visible: boolean;
    actionLabel?: string;
    onAction?: () => void;
  }) => {
    if (!props.visible) return null;
    return (
      <div data-testid="lucian-bubble">
        <p>{props.text}</p>
        {props.actionLabel && props.onAction ? (
          <button onClick={props.onAction}>{props.actionLabel}</button>
        ) : null}
      </div>
    );
  },
}));

vi.mock('@/components/features/lucian/LucianBreakOverlay', () => ({
  LucianBreakOverlay: (props: {
    open: boolean;
    onClose: () => void;
    onComplete: (result: {
      score: number;
      hits: number;
      misses: number;
      maxCombo: number;
      elapsedMs: number;
    }) => void;
  }) => {
    if (!props.open) return null;
    return (
      <div data-testid="break-overlay">
        <button
          onClick={() =>
            props.onComplete({
              score: 2300,
              hits: 19,
              misses: 3,
              maxCombo: 9,
              elapsedMs: 60000,
            })
          }
        >
          complete-break
        </button>
        <button onClick={props.onClose}>close-break</button>
      </div>
    );
  },
}));

describe('LucianBubbleProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-23T12:00:00'));
    const keys = [
      'innis_lucian_muted',
      'innis_lucian_cooldown',
      'innis_lucian_daily_mute',
      'innis_lucian_seen',
      'innis_lucian_shown_at',
      'innis_lucian_session_id',
    ];
    keys.forEach((key) => {
      try {
        window.localStorage?.removeItem?.(key);
      } catch {
        // no-op in test envs without full Storage API
      }
      try {
        window.sessionStorage?.removeItem?.(key);
      } catch {
        // no-op in test envs without full Storage API
      }
    });
    mockedPathname = '/today';
    championListener = null;
    globalThis.fetch = vi.fn(async () => ({
        ok: false,
        json: async () => null,
      })) as unknown as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  test('shows break invite after 7 minutes inactivity', () => {
    renderWithProviders(
      <LucianBubbleProvider>
        <div>child</div>
      </LucianBubbleProvider>,
    );

    expect(screen.queryByTestId('lucian-bubble')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(7 * 60 * 1000);
    });

    expect(screen.getByTestId('lucian-bubble')).toBeInTheDocument();
    expect(screen.getByText('Kurze Pause erkannt. 60 Sekunden Target Drill?')).toBeInTheDocument();
  });

  test('does not show queued messages while break mode is active', () => {
    renderWithProviders(
      <LucianBubbleProvider>
        <div>child</div>
      </LucianBubbleProvider>,
    );

    act(() => {
      vi.advanceTimersByTime(7 * 60 * 1000);
    });

    expect(screen.getByText('Start 60s Drill')).toBeInTheDocument();
    expect(championListener).toBeTruthy();

    act(() => {
      championListener?.({ type: 'TASK_COMPLETED' });
    });

    fireEvent.click(screen.getByText('Start 60s Drill'));

    act(() => {
      vi.advanceTimersByTime(260);
    });

    expect(screen.getByTestId('break-overlay')).toBeInTheDocument();
    expect(screen.queryByTestId('lucian-bubble')).toBeNull();
  });

  test('emits break result message only after closing break overlay', () => {
    renderWithProviders(
      <LucianBubbleProvider>
        <div>child</div>
      </LucianBubbleProvider>,
    );

    act(() => {
      vi.advanceTimersByTime(7 * 60 * 1000);
    });

    fireEvent.click(screen.getByText('Start 60s Drill'));
    act(() => {
      vi.advanceTimersByTime(260);
    });
    expect(screen.getByTestId('break-overlay')).toBeInTheDocument();

    fireEvent.click(screen.getByText('complete-break'));
    expect(screen.queryByText(/Stark\./)).toBeNull();

    fireEvent.click(screen.getByText('close-break'));
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.getByText('Stark. 2300 Punkte in 60 Sekunden. Momentum halten.')).toBeInTheDocument();
  });
});
