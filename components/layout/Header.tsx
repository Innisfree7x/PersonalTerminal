'use client';

import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Bell, Plus, Command } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useCommandPalette } from '@/components/shared/CommandPaletteProvider';
import { useFocusTimer } from '@/components/providers/FocusTimerProvider';
import { format } from 'date-fns';
import { fetchDashboardStatsAction } from '@/app/actions/dashboard';

const routeTitles: Record<string, string> = {
  '/today': 'Today',
  '/calendar': 'Calendar',
  '/goals': 'Goals',
  '/university': 'University',
  '/career': 'Career',
  '/analytics': 'Analytics',
  '/trajectory': 'Trajectory',
  '/focus': 'Focus',
};

function HeaderClock() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden md:flex items-center gap-3 rounded-lg border border-primary/24 bg-surface/70 px-4 py-1.5 relative overflow-hidden shadow-[0_0_0_1px_rgb(var(--primary)/0.05)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/28 to-transparent" />
      <div className="flex flex-col">
        <span className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary" suppressHydrationWarning>
          {currentTime ? format(currentTime, 'EEEE, MMMM d') : '\u00A0'}
        </span>
        <span className="text-base font-bold text-text-primary font-mono tabular-nums tracking-tight leading-tight" suppressHydrationWarning>
          {currentTime ? format(currentTime, 'HH:mm:ss') : '--:--:--'}
        </span>
      </div>
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const { open: openCommandPalette } = useCommandPalette();
  const { status: timerStatus, timeLeft: timerTimeLeft, sessionType, setIsExpanded: setTimerExpanded } = useFocusTimer();
  
  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStatsAction,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const todayCompletion = stats?.metrics.todayCompletion || 0;
  
  // Check for urgent items (notification badge)
  const hasUrgent =
    (stats?.career.nextInterview &&
      new Date(stats.career.nextInterview.date) <= new Date(Date.now() + 24 * 60 * 60 * 1000)) ||
    (stats?.goals.overdue !== undefined && stats.goals.overdue > 0) ||
    false;

  const currentTitle = routeTitles[pathname] || 'Dashboard';

  useEffect(() => {
    if (!notificationsOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!notificationsRef.current) return;
      if (!notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [notificationsOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/82 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left: Page Title + Date & Time */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-[1.06rem] font-semibold tracking-tight text-text-primary">
              {currentTitle}
            </h1>
            
            {todayCompletion > 0 && pathname === '/today' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/[0.1] border border-primary/[0.18]">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                  animate={{ opacity: [1, 0.35, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  style={{ boxShadow: '0 0 5px currentColor' }}
                />
                <span className="text-[11px] font-semibold text-primary tabular-nums">
                  {todayCompletion}%
                </span>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <HeaderClock />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Search / Command Palette Trigger */}
          <motion.button
            className="flex h-9 items-center gap-2 rounded-lg border border-border/80 bg-surface/65 px-3 text-text-secondary transition-colors hover:border-primary/35 hover:bg-primary/[0.08] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCommandPalette}
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px] font-medium">Search</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-surface-hover px-1.5 py-0.5 text-[10px]">
              <Command className="w-2.5 h-2.5" />
              K
            </kbd>
          </motion.button>

          {/* Timer Indicator */}
          {timerStatus !== 'idle' && (
            <motion.button
              className={`flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-mono font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                sessionType === 'break'
                  ? 'bg-success/10 border-success/30 text-success'
                  : 'bg-primary/10 border-primary/30 text-primary'
              }`}
              onClick={() => setTimerExpanded(true)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className={`w-1.5 h-1.5 rounded-full ${sessionType === 'break' ? 'bg-success' : 'bg-primary'}`}
                animate={timerStatus === 'running' || timerStatus === 'break' ? { opacity: [1, 0.3, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              {`${Math.floor(timerTimeLeft / 60).toString().padStart(2, '0')}:${(timerTimeLeft % 60).toString().padStart(2, '0')}`}
            </motion.button>
          )}

          {/* Quick Add Button */}
          <motion.button
            className="rounded-lg border border-primary/28 bg-primary/[0.2] p-2 text-primary transition-colors shadow-[0_0_16px_rgb(var(--primary)/0.2)] hover:bg-primary/[0.28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openCommandPalette}
            aria-label="Quick add"
          >
            <Plus className="w-4 h-4" />
          </motion.button>

          {/* Notifications */}
          <div ref={notificationsRef} className="relative">
            <motion.button
              className="relative rounded-lg border border-border/80 bg-surface/65 p-2 text-text-secondary transition-colors hover:border-primary/35 hover:bg-primary/[0.08] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
              <div className="absolute top-full right-0 mt-2 w-80 card-surface dashboard-premium-card-soft rounded-lg p-3">
                <div className="text-xs text-text-tertiary text-center py-4">
                  No new notifications
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar (for Today page) — glowing */}
      {pathname === '/today' && todayCompletion > 0 && (
        <div className="h-[2px] bg-surface">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${todayCompletion}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary to-primary-light"
            style={{ boxShadow: '0 0 10px var(--color-primary, #6366f1), 0 0 4px var(--color-primary, #6366f1)' }}
          />
        </div>
      )}
    </header>
  );
}
