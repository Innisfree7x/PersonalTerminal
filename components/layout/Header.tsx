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
import { useAnimationSuspended, usePageVisibility } from '@/lib/hooks/usePageVisibility';
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
    <div className="hidden md:flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/40 px-3.5 py-1.5 relative overflow-hidden shadow-inner">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
      <div className="flex flex-col">
        <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-white/40" suppressHydrationWarning>
          {currentTime ? format(currentTime, datePattern, { locale }) : '\u00A0'}
        </span>
        <span className="text-sm font-bold text-white font-mono tabular-nums tracking-tight leading-tight" suppressHydrationWarning>
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
  const animationsSuspended = useAnimationSuspended();

  if (timerStatus === 'idle') return null;
  const dotPulsing = !animationsSuspended && (timerStatus === 'running' || timerStatus === 'break');

  return (
    <motion.button
      className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-mono font-medium transition-all ${
        sessionType === 'break'
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
      }`}
      onClick={() => setTimerExpanded(true)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className={`w-1.5 h-1.5 rounded-full ${sessionType === 'break' ? 'bg-emerald-400' : 'bg-amber-400'}`}
        animate={dotPulsing ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
        transition={dotPulsing ? { duration: 1.5, repeat: Infinity } : { duration: 0 }}
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
  const isPageVisible = usePageVisibility();
  const animationsSuspended = useAnimationSuspended();

  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStatsAction,
    refetchInterval: isPageVisible ? 5 * 60 * 1000 : false,
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
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#0A0D14]/85 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left: Page Title + Date & Time */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-[1.06rem] font-semibold tracking-tight text-white font-sans">
              {currentTitle}
            </h1>
            
            {todayCompletion > 0 && pathname === '/today' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-amber-400"
                  animate={animationsSuspended ? { opacity: 1 } : { opacity: [1, 0.35, 1] }}
                  transition={animationsSuspended ? { duration: 0 } : { duration: 1.6, repeat: Infinity }}
                  style={{ boxShadow: '0 0 6px rgba(245, 158, 11, 0.6)' }}
                />
                <span className="text-[11px] font-mono font-semibold text-amber-300 tabular-nums">
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
            className="flex h-9 items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.16] px-3.5 text-white/60 hover:text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCommandPalette}
          >
            <Search className="w-4 h-4 text-white/40" />
            <span className="hidden sm:inline text-xs font-sans font-medium">{copy.header.search}</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-white/[0.1] bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-mono text-white/50">
              <Command className="w-2.5 h-2.5" />
              K
            </kbd>
          </motion.button>

          {/* Timer Indicator */}
          <FocusTimerButton />

          {/* Quick Add Button */}
          <motion.button
            className="rounded-xl border border-amber-500/30 bg-amber-500/15 p-2 text-amber-300 transition-all hover:bg-amber-500/25 hover:border-amber-500/50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
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
              className="relative rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.16] p-2 text-white/60 hover:text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label={copy.header.notifications}
            >
              <Bell className="w-4 h-4" />
              {hasUrgent && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-black" />
              )}
            </motion.button>

            {/* Notification Dropdown (placeholder) */}
            {notificationsOpen && (
              <div className="absolute top-full right-0 mt-2 w-80 rounded-2xl border border-white/[0.08] bg-[#0D1017]/95 backdrop-blur-xl p-4 shadow-2xl">
                <div className="text-xs font-mono text-white/40 text-center py-4">
                  {copy.header.noNotifications}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar (for Today page) — glowing */}
      {pathname === '/today' && todayCompletion > 0 && (
        <div className="h-[2px] bg-black/40">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${todayCompletion}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400"
            style={{ boxShadow: '0 0 10px rgba(245, 158, 11, 0.5), 0 0 4px rgba(245, 158, 11, 0.3)' }}
          />
        </div>
      )}
    </header>
  );
}
