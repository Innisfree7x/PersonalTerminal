'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Calendar,
  Target,
  GraduationCap,
  Briefcase,
  BarChart3,
  ShieldCheck,
  ChevronLeft,
  Settings,
  LogOut
} from 'lucide-react';
import { useSidebar } from './SidebarProvider';
import { useAuth } from '@/lib/auth/AuthProvider';
import { isAdminUser } from '@/lib/auth/authorization';
import { fetchGoalsAction } from '@/app/actions/goals';
import { fetchCoursesAction } from '@/app/actions/university';
import type { DashboardNextTasksResponse } from '@/lib/dashboard/queries';

const baseNavigation = [
  { name: 'Today', href: '/today', icon: LayoutDashboard, shortcut: '1' },
  { name: 'Calendar', href: '/calendar', icon: Calendar, shortcut: '2' },
  { name: 'Goals', href: '/goals', icon: Target, shortcut: '3' },
  { name: 'University', href: '/university', icon: GraduationCap, shortcut: '4' },
  { name: 'Career', href: '/career', icon: Briefcase, shortcut: '5' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, shortcut: '6' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { user, signOut } = useAuth();
  const isAdmin = isAdminUser(user);
  const navigation = useMemo(
    () =>
      isAdmin
        ? [...baseNavigation, { name: 'Ops Health', href: '/analytics/ops', icon: ShieldCheck, shortcut: '7' }]
        : baseNavigation,
    [isAdmin]
  );

  // Extract display name from user metadata or email
  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || 'User';
  const displayEmail = user?.email || '';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  const prefetchIfStale = useCallback(
    (
      queryKey: ReadonlyArray<string>,
      staleTime: number,
      queryFn: () => Promise<unknown>
    ) => {
      const state = queryClient.getQueryState(queryKey);
      const isFresh =
        typeof state?.dataUpdatedAt === 'number' &&
        Date.now() - state.dataUpdatedAt < staleTime;
      const isFetching = state?.fetchStatus === 'fetching';

      if (isFresh || isFetching) return;

      void queryClient.prefetchQuery({ queryKey, queryFn, staleTime });
    },
    [queryClient]
  );

  const handleNavIntent = useCallback(
    (href: string) => {
      router.prefetch(href);

      if (href === '/goals') {
        prefetchIfStale(['goals'], 5 * 60 * 1000, async () => {
          const goals = await fetchGoalsAction();
          return goals.map((goal) => ({
            ...goal,
            targetDate: new Date(goal.targetDate),
            createdAt: new Date(goal.createdAt),
          }));
        });
        return;
      }

      if (href === '/university') {
        prefetchIfStale(['courses'], 5 * 60 * 1000, async () => {
          const courses = await fetchCoursesAction();
          return courses.map((course) => ({
            ...course,
            examDate: course.examDate ? new Date(course.examDate) : undefined,
            createdAt: new Date(course.createdAt),
            exercises: (course.exercises || []).map((ex) => ({
              ...ex,
              completedAt: ex.completedAt ? new Date(ex.completedAt) : undefined,
              createdAt: new Date(ex.createdAt),
            })),
          }));
        });
        return;
      }

      if (href === '/today') {
        const today = new Date().toISOString().split('T')[0] ?? '';

        prefetchIfStale(['dashboard', 'next-tasks'], 15 * 1000, async () => {
          const response = await fetch('/api/dashboard/next-tasks');
          if (!response.ok) throw new Error('Failed to fetch next tasks');
          return (await response.json()) as DashboardNextTasksResponse;
        });

        prefetchIfStale(['daily-tasks', today], 30 * 1000, async () => {
          const response = await fetch(`/api/daily-tasks?date=${today}`);
          if (!response.ok) throw new Error('Failed to fetch tasks');
          return response.json();
        });
      }
    },
    [prefetchIfStale, router]
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 rounded-lg bg-surface border border-border text-text-primary hover:bg-surface-hover hover:border-primary transition-colors"
          aria-label="Toggle menu"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </motion.button>
      </div>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? '80px' : '240px',
        }}
        className={`fixed top-0 left-0 z-40 h-screen transition-all ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 bg-surface/80 backdrop-blur-xl border-r border-border`}
      >
        <div className="h-full flex flex-col">
          {/* Logo / Brand */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-border">
            {!isCollapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                  <span className="text-white font-bold text-base">P</span>
                </div>
                <span className="font-semibold text-text-primary">Prism</span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center w-full"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                  <span className="text-white font-bold text-base">P</span>
                </div>
              </motion.div>
            )}

            {/* Collapse button (desktop only) */}
            {!isCollapsed && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-1.5 rounded-md hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Expand button when collapsed */}
          {isCollapsed && (
            <div className="hidden lg:flex justify-center py-2 border-b border-border">
              <button
                onClick={() => setIsCollapsed(false)}
                className="p-1.5 rounded-md hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Expand sidebar"
              >
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  onMouseEnter={() => handleNavIntent(item.href)}
                  onFocus={() => handleNavIntent(item.href)}
                  onTouchStart={() => handleNavIntent(item.href)}
                  className="relative block group"
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r-full"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}

                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 truncate">{item.name}</span>
                        <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-hover border border-border text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.shortcut}
                        </kbd>
                      </>
                    )}
                  </div>

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-surface border border-border rounded-md text-xs text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      {item.name}
                      <span className="ml-2 text-text-tertiary font-mono">{item.shortcut}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile section */}
          <div className="p-3 border-t border-border space-y-1">
            {/* Settings link */}
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="relative block group"
            >
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/settings'
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <Settings className={`w-4 h-4 flex-shrink-0 ${pathname === '/settings' ? 'text-primary' : ''}`} />
                {!isCollapsed && <span className="truncate">Settings</span>}
              </div>
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-surface border border-border rounded-md text-xs text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  Settings
                </div>
              )}
            </Link>

            {/* User profile */}
            <div
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${isCollapsed ? 'justify-center' : ''
                }`}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20">
                <span className="text-white font-bold text-sm">{avatarInitial}</span>
              </div>

              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-text-tertiary truncate">
                      {displayEmail}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      signOut();
                    }}
                    className="p-1.5 rounded-md text-text-tertiary hover:text-error hover:bg-error/10 transition-colors"
                    aria-label="Sign out"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
