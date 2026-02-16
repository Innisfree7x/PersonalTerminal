export function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;

  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'SELECT' ||
    element.isContentEditable
  );
}

export function hasHotkeyBlocker(): boolean {
  if (typeof document === 'undefined') return false;
  return Boolean(document.querySelector('[data-hotkeys-disabled="true"]'));
}

export function hasFocusedListNavigationItem(): boolean {
  if (typeof document === 'undefined') return false;
  return Boolean(document.querySelector('[data-list-nav-focused="true"]'));
}
