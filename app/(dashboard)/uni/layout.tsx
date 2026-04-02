'use client';

import SpaceTabBar from '@/components/layout/SpaceTabBar';
import { useAppLanguage } from '@/components/providers/LanguageProvider';

export default function UniLayout({ children }: { children: React.ReactNode }) {
  const { copy } = useAppLanguage();

  const tabs = [
    { label: copy.nav.courses, href: '/uni/courses' },
    { label: copy.nav.grades, href: '/uni/grades' },
    { label: copy.nav.sync, href: '/uni/sync' },
  ];

  return (
    <>
      <SpaceTabBar tabs={tabs} />
      {children}
    </>
  );
}
