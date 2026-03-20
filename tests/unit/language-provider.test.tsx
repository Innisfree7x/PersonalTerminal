import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { LanguageProvider, useAppLanguage } from '@/components/providers/LanguageProvider';
import { APP_LANGUAGE_STORAGE_KEY } from '@/lib/i18n/appLanguage';

// jsdom may ship a minimal localStorage stub without methods — polyfill if needed
beforeAll(() => {
  if (typeof window.localStorage.getItem !== 'function') {
    const store: Record<string, string> = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
        get length() { return Object.keys(store).length; },
        key: (i: number) => Object.keys(store)[i] ?? null,
      },
      writable: true,
    });
  }
});

function Probe() {
  const { language, setLanguage, copy } = useAppLanguage();

  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="label">{copy.settings.title}</span>
      <button type="button" onClick={() => setLanguage('en')}>
        set-en
      </button>
      <button type="button" onClick={() => setLanguage('de')}>
        set-de
      </button>
    </div>
  );
}

describe('LanguageProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = 'de';
    delete document.documentElement.dataset.language;
  });

  test('defaults to german when no preference exists', async () => {
    // Ensure navigator.language reports German so detectBrowserLanguage picks 'de'
    Object.defineProperty(window.navigator, 'language', { value: 'de-DE', configurable: true });

    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );

    expect(screen.getByTestId('language')).toHaveTextContent('de');
    expect(screen.getByTestId('label')).toHaveTextContent('Einstellungen');

    await act(async () => {
      await Promise.resolve();
    });

    expect(document.documentElement.lang).toBe('de');
    expect(document.documentElement.dataset.language).toBe('de');
  });

  test('persists english selection to document and localStorage', async () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByText('set-en'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('language')).toHaveTextContent('en');
    expect(screen.getByTestId('label')).toHaveTextContent('Settings');
    expect(window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dataset.language).toBe('en');
  });
});
