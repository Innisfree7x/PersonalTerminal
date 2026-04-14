import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, test } from 'vitest';
import { useRoomStyle } from '@/lib/hooks/useRoomStyle';

beforeAll(() => {
  if (typeof window.localStorage.getItem !== 'function') {
    const store: Record<string, string> = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { Object.keys(store).forEach((key) => delete store[key]); },
        get length() { return Object.keys(store).length; },
        key: (index: number) => Object.keys(store)[index] ?? null,
      },
      writable: true,
    });
  }
});

function TestRoomStyleHarness() {
  const { style, setStyle } = useRoomStyle();

  return (
    <div>
      <span data-testid="current-style">{style}</span>
      <button onClick={() => setStyle('neon')}>set-neon</button>
      <button onClick={() => setStyle('cozy')}>set-cozy</button>
    </div>
  );
}

describe('useRoomStyle', () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.style.removeProperty('--room-wall');
    document.documentElement.style.removeProperty('--room-floor');
    document.documentElement.style.removeProperty('--room-accent');
  });

  test('defaults to minimal and applies matching css vars', () => {
    render(<TestRoomStyleHarness />);

    expect(screen.getByTestId('current-style')).toHaveTextContent('minimal');
    expect(document.documentElement.style.getPropertyValue('--room-wall')).toBe('#0c0c14');
    expect(document.documentElement.style.getPropertyValue('--room-floor')).toBe('#09090f');
    expect(document.documentElement.style.getPropertyValue('--room-accent')).toBe('#6366f1');
  });

  test('restores a valid stored room style', () => {
    window.localStorage.setItem('innis:room-style:v1', 'library');

    render(<TestRoomStyleHarness />);

    expect(screen.getByTestId('current-style')).toHaveTextContent('library');
    expect(document.documentElement.style.getPropertyValue('--room-wall')).toBe('#0a0c0a');
    expect(document.documentElement.style.getPropertyValue('--room-floor')).toBe('#080a06');
    expect(document.documentElement.style.getPropertyValue('--room-accent')).toBe('#047857');
  });

  test('falls back to minimal when stored room style is invalid', () => {
    window.localStorage.setItem('innis:room-style:v1', 'unknown-style');

    render(<TestRoomStyleHarness />);

    expect(screen.getByTestId('current-style')).toHaveTextContent('minimal');
    expect(document.documentElement.style.getPropertyValue('--room-wall')).toBe('#0c0c14');
    expect(document.documentElement.style.getPropertyValue('--room-floor')).toBe('#09090f');
    expect(document.documentElement.style.getPropertyValue('--room-accent')).toBe('#6366f1');
  });

  test('persists and reapplies a newly selected room style', () => {
    render(<TestRoomStyleHarness />);

    act(() => {
      screen.getByText('set-neon').click();
    });

    expect(screen.getByTestId('current-style')).toHaveTextContent('neon');
    expect(window.localStorage.getItem('innis:room-style:v1')).toBe('neon');
    expect(document.documentElement.style.getPropertyValue('--room-wall')).toBe('#04040f');
    expect(document.documentElement.style.getPropertyValue('--room-floor')).toBe('#020208');
    expect(document.documentElement.style.getPropertyValue('--room-accent')).toBe('#06b6d4');
  });
});
