'use client';

import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import FloatingTimer from '@/components/features/focus/FloatingTimer';
import { SidebarProvider, useSidebar } from '@/components/layout/SidebarProvider';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { usePathname } from 'next/navigation';
import PowerHotkeysProvider from '@/components/providers/PowerHotkeysProvider';
import { ChampionProvider } from '@/components/providers/ChampionProvider';
import { useAppLanguage } from '@/components/providers/LanguageProvider';

function DashboardLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const { copy } = useAppLanguage();
  const isFocusRoute = pathname === '/focus';

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
            <div className="max-w-[1600px] mx-auto px-6 pt-5 pb-8">
              <div key={pathname} className="animate-dashboard-page-in">
                {children}
              </div>
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <PowerHotkeysProvider>
        <ChampionProvider>
          <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </ChampionProvider>
      </PowerHotkeysProvider>
    </SidebarProvider>
  );
}
