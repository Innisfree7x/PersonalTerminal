'use client';

import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

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
  type: "spring",
  stiffness: 380,
  damping: 30,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Main content area - adjusted for sidebar */}
      <div className="lg:pl-[240px] min-h-screen">
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
    </div>
  );
}
