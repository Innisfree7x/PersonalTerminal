'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Hammer,
  GraduationCap,
  Briefcase,
  LineChart,
  Timer,
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
import { BrandLockup, BrandMark } from '@/components/shared/BrandLogo';
import { useAppLanguage } from '@/components/providers/LanguageProvider';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { user, signOut } = useAuth();
  const { copy, language } = useAppLanguage();
  const isAdmin = isAdminUser(user);
  const navigation = useMemo(
    () =>
      [
        { name: copy.nav.today, href: '/today', icon: LayoutDashboard, shortcut: '1' },
        { name: copy.nav.workspace, href: '/workspace/tasks', icon: Hammer, shortcut: '2', matchPrefix: '/workspace' },
        { name: copy.nav.uni, href: '/uni/courses', icon: GraduationCap, shortcut: '3', matchPrefix: '/uni' },
        { name: copy.nav.career, href: '/career/applications', icon: Briefcase, shortcut: '4', matchPrefix: '/career' },
        { name: copy.nav.reflect, href: '/reflect/analytics', icon: LineChart, shortcut: '5', matchPrefix: '/reflect' },
        { name: copy.nav.focus, href: '/focus', icon: Timer, shortcut: 'F' },
        ...(isAdmin
          ? [{ name: copy.nav.opsHealth, href: '/analytics/ops', icon: ShieldCheck, shortcut: 'O' }]
          : []),
      ],
    [copy.nav, isAdmin]
  );

  // Extract display name from user metadata or email
  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || (language === 'de' ? 'Nutzer' : 'User');
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

      if (href === '/workspace/goals') {
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

      if (href === '/uni/courses') {
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
        return;
      }

      if (href === '/career/trajectory') {
        prefetchIfStale(['trajectory', 'overview'], 20 * 1000, async () => {
          const response = await fetch('/api/trajectory/overview');
          if (!response.ok) throw new Error('Failed to fetch trajectory overview');
          return response.json();
        });
        return;
      }

      if (href === '/career/strategy') {
        prefetchIfStale(['strategy', 'decisions'], 20 * 1000, async () => {
          const response = await fetch('/api/strategy/decisions');
          if (!response.ok) throw new Error('Failed to fetch strategy decisions');
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
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg border border-border bg-surface p-2.5 text-text-primary transition-colors hover:border-primary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={copy.header.toggleMenu}
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
        </button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/55 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`dashboard-sidebar-surface fixed top-0 left-0 z-40 h-screen border-r transition-[width,transform] duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-60'} w-60 lg:translate-x-0`}
      >
        <div className="h-full flex flex-col relative">
          {/* Ambient top glow — ties sidebar to the primary colour */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/[0.05] to-transparent" />
          {/* Logo / Brand */}
          <div className="flex h-16 items-center justify-between border-b border-border px-5">
            {!isCollapsed ? (
              <div className="flex items-center gap-2">
                <BrandLockup
                  sizeClassName="h-8 w-8"
                  className="gap-2"
                  wordmarkClassName="font-semibold text-text-primary tracking-tight"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <BrandMark sizeClassName="h-8 w-8" />
              </div>
            )}

            {/* Collapse button (desktop only) */}
            {!isCollapsed && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:inline-flex"
                aria-label={copy.header.collapseSidebar}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Expand button when collapsed */}
          {isCollapsed && (
            <div className="hidden lg:flex justify-center py-2 border-b border-border">
              <button
                onClick={() => setIsCollapsed(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={copy.header.expandSidebar}
              >
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const matchPrefix = (item as { matchPrefix?: string }).matchPrefix;
              const isActive = matchPrefix
                ? pathname.startsWith(matchPrefix)
                : pathname === item.href;
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
                  {/* Active indicator — animated flowing light */}
                  {isActive && (
                    <div className="absolute left-0 top-[5px] bottom-[5px] w-[3px] rounded-full bg-gradient-to-b from-primary/40 via-primary to-primary/40 shadow-[0_0_10px_rgb(var(--primary)/0.35)]" />
                  )}

                  <div
                    className={`relative flex min-h-[42px] items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${isActive
                        ? 'border border-primary/25 bg-primary/[0.14] text-primary shadow-[0_0_18px_rgb(var(--primary)/0.14)]'
                        : 'border border-transparent text-text-secondary hover:border-border/70 hover:bg-surface-hover/70 hover:text-text-primary'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                  >
                    {/* Active item subtle inner glow */}
                    {isActive && (
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/[0.08] to-transparent" />
                    )}
                    <Icon
                      className="h-[18px] w-[18px] flex-shrink-0"
                      style={isActive ? { filter: 'drop-shadow(0 0 5px currentColor)' } : undefined}
                    />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 truncate">{item.name}</span>
                        <kbd className="hidden rounded border border-border bg-surface-hover px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100 sm:inline-flex">
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
                    ? 'border border-primary/25 bg-primary/[0.14] text-primary shadow-[0_0_14px_rgb(var(--primary)/0.12)]'
                    : 'border border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover/70 hover:border-border/70'
                  } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <Settings className={`w-4 h-4 flex-shrink-0 ${pathname === '/settings' ? 'text-primary' : ''}`} />
                {!isCollapsed && <span className="truncate">{copy.nav.settings}</span>}
              </div>
              {isCollapsed && (
                <div className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  {copy.nav.settings}
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
                    className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label={copy.settings.signOut}
                    title={copy.settings.signOut}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
