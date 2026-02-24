'use client';

import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import FloatingTimer from '@/components/features/focus/FloatingTimer';
import { SidebarProvider, useSidebar } from '@/components/layout/SidebarProvider';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import PowerHotkeysProvider from '@/components/providers/PowerHotkeysProvider';
import { ChampionProvider } from '@/components/providers/ChampionProvider';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -8,
  },
};

const pageTransition = {
  type: "spring" as const,
  stiffness: 380,
  damping: 30,
};

function DashboardLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const isFocusRoute = pathname === '/focus';

  if (isFocusRoute) {
    return (
      <ErrorBoundary
        fallbackTitle="Focus Screen Error"
        fallbackMessage="The focus screen failed to load. Please return to your dashboard."
      >
        <div className="min-h-screen bg-[#05080f]">{children}</div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary
      fallbackTitle="Dashboard Error"
      fallbackMessage="Something went wrong while loading the dashboard. Don't worry, your data is safe."
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
            {/* Atmospheric background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            {/* Subtle dot grid — adds premium depth */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />

            {/* Content container */}
            <div className="relative max-w-[1600px] mx-auto px-6 pt-5 pb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* Floating Focus Timer */}
        <FloatingTimer />
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
