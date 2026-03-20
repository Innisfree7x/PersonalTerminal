'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  APP_LANGUAGE_STORAGE_KEY,
  appLanguageCopy,
  detectBrowserLanguage,
  isAppLanguage,
  type AppLanguage,
} from '@/lib/i18n/appLanguage';

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  copy: (typeof appLanguageCopy)[AppLanguage];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('de');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
    if (isAppLanguage(stored)) {
      setLanguageState(stored);
      return;
    }

    setLanguageState(detectBrowserLanguage(window.navigator.language));
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, language);
    }

    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dataset.language = language;
    }
  }, [language]);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      copy: appLanguageCopy[language],
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useAppLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useAppLanguage must be used within LanguageProvider');
  }
  return context;
}
