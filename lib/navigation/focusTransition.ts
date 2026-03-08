export interface RouterLike {
  push: (href: string) => void;
}

const FOCUS_OVERLAY_ID = 'innis-focus-transition-overlay';
const FOCUS_TRANSITION_DURATION_MS = 240;
const FOCUS_TRANSITION_PUSH_DELAY_MS = 120;

let transitionInFlight = false;

function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function buildOverlayElement(): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.id = FOCUS_OVERLAY_ID;
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '9999';
  overlay.style.pointerEvents = 'none';
  overlay.style.opacity = '0';
  overlay.style.backdropFilter = 'blur(10px)';
  overlay.style.setProperty('-webkit-backdrop-filter', 'blur(10px)');
  overlay.style.background =
    'radial-gradient(120% 130% at 20% 15%, rgba(56,189,248,0.20) 0%, rgba(0,0,0,0) 50%), radial-gradient(100% 120% at 85% 20%, rgba(251,191,36,0.18) 0%, rgba(0,0,0,0) 50%), rgba(3,7,18,0.72)';
  overlay.style.transition = `opacity ${FOCUS_TRANSITION_DURATION_MS}ms ease`;
  return overlay;
}

export function navigateToFocusWithTransition(
  router: RouterLike,
  href: string = '/focus'
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    router.push(href);
    return;
  }

  if (shouldReduceMotion()) {
    router.push(href);
    return;
  }

  if (transitionInFlight) {
    router.push(href);
    return;
  }
  transitionInFlight = true;

  const previousOverlay = document.getElementById(FOCUS_OVERLAY_ID);
  if (previousOverlay) previousOverlay.remove();

  const overlay = buildOverlayElement();
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  });

  window.setTimeout(() => {
    router.push(href);
  }, FOCUS_TRANSITION_PUSH_DELAY_MS);

  window.setTimeout(() => {
    overlay.remove();
    transitionInFlight = false;
  }, FOCUS_TRANSITION_DURATION_MS + 700);
}
