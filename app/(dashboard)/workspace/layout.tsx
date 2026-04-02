'use client';

import SpaceTabBar from '@/components/layout/SpaceTabBar';
import { useAppLanguage } from '@/components/providers/LanguageProvider';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { copy } = useAppLanguage();

  const tabs = [
    { label: copy.nav.tasks, href: '/workspace/tasks' },
    { label: copy.nav.goals, href: '/workspace/goals' },
    { label: copy.nav.calendar, href: '/workspace/calendar' },
  ];

  return (
    <>
      <SpaceTabBar tabs={tabs} />
      {children}
    </>
  );
}
