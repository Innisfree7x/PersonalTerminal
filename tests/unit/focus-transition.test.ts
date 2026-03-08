import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const OVERLAY_ID = 'innis-focus-transition-overlay';

function createRouterMock() {
  return {
    push: vi.fn<(href: string) => void>(),
  };
}

function createMatchMedia(matches: boolean) {
  return vi.fn().mockImplementation(() => ({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

async function loadHelper() {
  vi.resetModules();
  return import('@/lib/navigation/focusTransition');
}

describe('navigateToFocusWithTransition', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    vi.stubGlobal(
      'requestAnimationFrame',
      ((cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      }) as typeof requestAnimationFrame
    );
    vi.stubGlobal('matchMedia', createMatchMedia(false));
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('falls back to immediate navigation when reduced motion is enabled', async () => {
    vi.stubGlobal('matchMedia', createMatchMedia(true));
    const { navigateToFocusWithTransition } = await loadHelper();
    const router = createRouterMock();

    navigateToFocusWithTransition(router);

    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith('/focus');
    expect(document.getElementById(OVERLAY_ID)).toBeNull();
  });

  it('creates overlay, delays push and cleans up after transition', async () => {
    const { navigateToFocusWithTransition } = await loadHelper();
    const router = createRouterMock();

    navigateToFocusWithTransition(router, '/focus');

    const overlay = document.getElementById(OVERLAY_ID);
    expect(overlay).not.toBeNull();
    expect(router.push).not.toHaveBeenCalled();

    vi.advanceTimersByTime(119);
    expect(router.push).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith('/focus');
    expect(document.getElementById(OVERLAY_ID)).not.toBeNull();

    vi.advanceTimersByTime(940);
    expect(document.getElementById(OVERLAY_ID)).toBeNull();
  });

  it('uses direct push for subsequent calls while transition is in-flight', async () => {
    const { navigateToFocusWithTransition } = await loadHelper();
    const router = createRouterMock();

    navigateToFocusWithTransition(router, '/focus');
    navigateToFocusWithTransition(router, '/focus?source=fast-click');

    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenLastCalledWith('/focus?source=fast-click');

    vi.advanceTimersByTime(120);
    expect(router.push).toHaveBeenCalledTimes(2);
    expect(router.push).toHaveBeenLastCalledWith('/focus');
  });
});
