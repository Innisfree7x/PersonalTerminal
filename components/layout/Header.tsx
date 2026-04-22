'use client';

import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Bell, Plus, Command } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useCommandPalette } from '@/components/shared/CommandPaletteProvider';
import {
  useFocusTimerActions,
  useFocusTimerClock,
  useFocusTimerSession,
} from '@/components/providers/FocusTimerProvider';
import { format } from 'date-fns';
import { de as deLocale, enUS } from 'date-fns/locale';
import { fetchDashboardStatsAction } from '@/app/actions/dashboard';
import { useAppLanguage } from '@/components/providers/LanguageProvider';

function HeaderClock({ language }: { language: 'de' | 'en' }) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const locale = language === 'de' ? deLocale : enUS;
  const datePattern = language === 'de' ? 'EEEE, d. MMMM' : 'EEEE, MMMM d';

  return (
    <div className="hidden md:flex items-center gap-3 rounded-lg border border-primary/24 bg-surface/70 px-4 py-1.5 relative overflow-hidden shadow-[0_0_0_1px_rgb(var(--primary)/0.05)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/28 to-transparent" />
      <div className="flex flex-col">
        <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary" suppressHydrationWarning>
          {currentTime ? format(currentTime, datePattern, { locale }) : '\u00A0'}
        </span>
        <span className="text-base font-bold text-text-primary font-mono tabular-nums tracking-tight leading-tight" suppressHydrationWarning>
          {currentTime ? format(currentTime, 'HH:mm:ss') : '--:--:--'}
        </span>
      </div>
    </div>
  );
}

function FocusTimerButton() {
  const { status: timerStatus, sessionType } = useFocusTimerSession();
  const { timeLeft: timerTimeLeft } = useFocusTimerClock();
  const { setIsExpanded: setTimerExpanded } = useFocusTimerActions();

  if (timerStatus === 'idle') return null;

  return (
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
  );
}

export default function Header() {
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const { open: openCommandPalette } = useCommandPalette();
  const { copy, language } = useAppLanguage();
  
  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStatsAction,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
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

  const routeTitles: Record<string, string> = {
    '/today': copy.header.today,
    '/workspace/tasks': copy.header.today,
    '/workspace/goals': copy.header.goals,
    '/workspace/calendar': copy.header.calendar,
    '/uni/courses': copy.header.university,
    '/uni/grades': copy.header.university,
    '/uni/sync': copy.header.university,
    '/career/applications': copy.header.career,
    '/career/strategy': copy.header.strategy,
    '/career/trajectory': copy.header.trajectory,
    '/reflect/analytics': copy.header.analytics,
    '/reflect/momentum': copy.header.analytics,
    '/focus': copy.header.focus,
    '/settings': copy.header.settings,
  };

  const currentTitle = routeTitles[pathname] || copy.header.dashboard;

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
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95">
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
          <HeaderClock language={language} />
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
            <span className="hidden sm:inline text-[11px] font-medium">{copy.header.search}</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-surface-hover px-1.5 py-0.5 text-xs">
              <Command className="w-2.5 h-2.5" />
              K
            </kbd>
          </motion.button>

          {/* Timer Indicator */}
          <FocusTimerButton />

          {/* Quick Add Button */}
          <motion.button
            className="rounded-lg border border-primary/28 bg-primary/[0.2] p-2 text-primary transition-colors shadow-[0_0_16px_rgb(var(--primary)/0.2)] hover:bg-primary/[0.28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openCommandPalette}
            aria-label={copy.header.quickAdd}
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
              aria-label={copy.header.notifications}
            >
              <Bell className="w-4 h-4" />
              {hasUrgent && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full ring-2 ring-background" />
              )}
            </motion.button>

            {/* Notification Dropdown (placeholder) */}
            {notificationsOpen && (
              <div className="absolute top-full right-0 mt-2 w-80 card-warm rounded-lg p-3">
                <div className="text-xs text-text-tertiary text-center py-4">
                  {copy.header.noNotifications}
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
