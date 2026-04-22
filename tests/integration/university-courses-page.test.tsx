import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/tests/utils/test-utils';

const hoisted = vi.hoisted(() => ({
  router: {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  },
  fetchCoursesAction: vi.fn(),
}));

vi.mock('framer-motion', () => {
  const create = (tag: string) => ({ children, ...props }: any) => {
    const sanitized = { ...props };
    delete sanitized.animate;
    delete sanitized.exit;
    delete sanitized.initial;
    delete sanitized.layout;
    delete sanitized.transition;
    delete sanitized.variants;
    delete sanitized.whileHover;
    delete sanitized.whileTap;
    delete sanitized.whileInView;
    delete sanitized.viewport;
    return <>{React.createElement(tag, sanitized, children)}</>;
  };

  return {
    motion: {
      div: create('div'),
      section: create('section'),
      span: create('span'),
      button: create('button'),
    },
    LayoutGroup: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useInView: () => true,
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => hoisted.router,
  usePathname: () => '/uni/courses',
}));

vi.mock('@/app/actions/university', () => ({
  fetchCoursesAction: hoisted.fetchCoursesAction,
  updateCourseAction: vi.fn(),
  deleteCourseAction: vi.fn(),
}));

vi.mock('@/lib/hooks/useSoundToast', () => ({
  useSoundToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    plain: { success: vi.fn(), error: vi.fn() },
  }),
}));

vi.mock('@/lib/hooks/useCommandActions', () => ({
  usePrismCommandAction: vi.fn(),
}));

vi.mock('@/lib/hooks/useListNavigation', () => ({
  useListNavigation: () => ({
    focusedId: null,
    setFocusedId: vi.fn(),
  }),
}));

vi.mock('@/components/features/university/CourseCard', () => ({
  default: ({ course }: { course: { name: string } }) => <div>{course.name}</div>,
}));

vi.mock('@/components/features/university/CourseModal', () => ({
  default: () => null,
}));

vi.mock('@/components/ui/AnimatedCounter', () => ({
  default: ({ to, suffix = '' }: { to: number; suffix?: string }) => <span>{`${to}${suffix}`}</span>,
}));

import UniversityPage from '@/app/(dashboard)/uni/courses/page';

describe('/uni/courses integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.fetchCoursesAction.mockResolvedValue([]);
  });

  test('stays focused on the local course hub instead of rendering KIT semester modules', async () => {
    renderWithProviders(<UniversityPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dein KIT-Hub' })).toBeInTheDocument();
      expect(screen.getByText('Noch keine Kurse angelegt')).toBeInTheDocument();
    });

    expect(screen.queryByText('KIT Semester')).not.toBeInTheDocument();
    expect(screen.queryByText(/Kurse aus .*Semester/i)).not.toBeInTheDocument();
    expect(screen.getByText('Sync und Noten sind jetzt in eigenen Bereichen')).toBeInTheDocument();
  });
});
