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
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

            {/* Content container */}
            <div className="relative max-w-[1600px] mx-auto px-6 py-8">
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
