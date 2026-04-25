'use client';

import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import FloatingTimer from '@/components/features/focus/FloatingTimer';
import { SidebarProvider, useSidebar } from '@/components/layout/SidebarProvider';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import PowerHotkeysProvider from '@/components/providers/PowerHotkeysProvider';
import { ChampionProvider } from '@/components/providers/ChampionProvider';
import { LucianBubbleProvider } from '@/components/providers/LucianBubbleProvider';
import { useAppLanguage } from '@/components/providers/LanguageProvider';

function useDeferredMount(delay = 0): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const idle = (cb: () => void) => {
      const ric = (window as unknown as {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      }).requestIdleCallback;
      if (ric) {
        ric(cb, { timeout: 1500 });
      } else {
        window.setTimeout(cb, delay);
      }
    };
    idle(() => setReady(true));
  }, [delay]);
  return ready;
}

function DashboardLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const { copy } = useAppLanguage();
  const isFocusRoute = pathname === '/focus';
  const isWorkspaceRoute = pathname.startsWith('/workspace');

  if (isFocusRoute) {
    return (
      <ErrorBoundary
        fallbackTitle={copy.header.focusScreenErrorTitle}
        fallbackMessage={copy.header.focusScreenErrorMessage}
      >
        <div className="min-h-screen bg-[#05080f]">{children}</div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary
      fallbackTitle={copy.header.dashboardErrorTitle}
      fallbackMessage={copy.header.dashboardErrorMessage}
    >
      <div className="min-h-screen">
        <Sidebar />

        {/* Main content area - dynamically adjusted for sidebar */}
        <div
          className={`min-h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:pl-20' : 'lg:pl-60'
            }`}
        >
          <Header />

          {/* Main content with max-width and centered */}
          <main className="relative">
            {/* Content container */}
            <div className={`max-w-[1600px] mx-auto px-6 pb-8 ${isWorkspaceRoute ? 'pt-0' : 'pt-5'}`}>
              <div className="animate-dashboard-page-in">{children}</div>
            </div>
          </main>
        </div>

        {/* Floating Focus Timer */}
        <ErrorBoundary fallbackTitle="Timer Error">
          <FloatingTimer />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}

const CHAMPION_DISABLED_PREFIXES = ['/focus', '/settings', '/reflect', '/analytics'] as const;

function isChampionDisabled(pathname: string): boolean {
  return CHAMPION_DISABLED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function DashboardRuntimeProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ready = useDeferredMount();
  const enableLucianBubble = pathname === '/today' || pathname.startsWith('/today/');
  const disableChampion = isChampionDisabled(pathname);

  const bubbleWrapped = enableLucianBubble && ready ? (
    <LucianBubbleProvider>{children}</LucianBubbleProvider>
  ) : children;

  if (disableChampion || !ready) {
    return <>{bubbleWrapped}</>;
  }

  return <ChampionProvider>{bubbleWrapped}</ChampionProvider>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <SidebarProvider>
        <PowerHotkeysProvider>
          <DashboardRuntimeProviders>
            <DashboardLayoutInner>{children}</DashboardLayoutInner>
          </DashboardRuntimeProviders>
        </PowerHotkeysProvider>
      </SidebarProvider>
    </MotionConfig>
  );
}
