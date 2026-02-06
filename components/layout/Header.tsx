'use client';

import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Bell, Plus, Command } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCommandPalette } from '@/components/shared/CommandPaletteProvider';
import { format } from 'date-fns';

interface DashboardStats {
  career: {
    activeInterviews: number;
    nextInterview?: { company: string; position: string; date: string };
    applicationsPending: number;
    pendingDays: number;
    followUpNeeded: number;
  };
  goals: {
    weeklyProgress: { onTrack: number; total: number };
    byCategory: Record<string, number>;
    overdue: number;
  };
  metrics: {
    todayCompletion: number;
    weekProgress: { day: number; total: number };
    focusTime: string;
  };
}

async function fetchStats(): Promise<DashboardStats> {
  const response = await fetch('/api/dashboard/stats');
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}

const routeTitles: Record<string, string> = {
  '/today': 'Today',
  '/calendar': 'Calendar',
  '/goals': 'Goals',
  '/university': 'University',
  '/career': 'Career',
};

export default function Header() {
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { open: openCommandPalette } = useCommandPalette();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  
  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchStats,
    refetchInterval: 60000, // Refetch every minute
  });

  // Update time every second
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayCompletion = stats?.metrics.todayCompletion || 0;
  
  // Check for urgent items (notification badge)
  const hasUrgent =
    (stats?.career.nextInterview &&
      new Date(stats.career.nextInterview.date) <= new Date(Date.now() + 24 * 60 * 60 * 1000)) ||
    (stats?.goals.overdue !== undefined && stats.goals.overdue > 0) ||
    false;

  const currentTitle = routeTitles[pathname] || 'Dashboard';

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left: Page Title + Date & Time */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-text-primary">
              {currentTitle}
            </h1>
            
            {todayCompletion > 0 && pathname === '/today' && (
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-primary/10">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-primary">
                  {todayCompletion}% complete
                </span>
              </div>
            )}
          </div>

          {/* Date & Time */}
          {currentTime && (
            <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-lg bg-surface/50 border border-border">
              <div className="flex flex-col">
                <span className="text-xs text-text-tertiary">
                  {format(currentTime, 'EEEE, MMMM d, yyyy')}
                </span>
                <span className="text-lg font-bold text-text-primary font-mono">
                  {format(currentTime, 'HH:mm:ss')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Search / Command Palette Trigger */}
          <motion.button
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border text-text-tertiary hover:text-text-primary hover:border-primary transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCommandPalette}
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Search</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-surface-hover border border-border">
              <Command className="w-2.5 h-2.5" />
              K
            </kbd>
          </motion.button>

          {/* Quick Add Button */}
          <motion.button
            className="p-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors shadow-glow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              // TODO: Open quick add modal
            }}
            aria-label="Quick add"
          >
            <Plus className="w-4 h-4" />
          </motion.button>

          {/* Notifications */}
          <div className="relative">
            <motion.button
              className="p-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary transition-colors relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {hasUrgent && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full ring-2 ring-background" />
              )}
            </motion.button>

            {/* Notification Dropdown (placeholder) */}
            {notificationsOpen && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-surface border border-border rounded-lg shadow-lg p-3">
                <div className="text-xs text-text-tertiary text-center py-4">
                  No new notifications
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar (for Today page) */}
      {pathname === '/today' && todayCompletion > 0 && (
        <div className="h-0.5 bg-surface">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${todayCompletion}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary to-primary-light"
          />
        </div>
      )}
    </header>
  );
}
