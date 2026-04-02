'use client';

import SpaceTabBar from '@/components/layout/SpaceTabBar';
import { useAppLanguage } from '@/components/providers/LanguageProvider';

export default function CareerLayout({ children }: { children: React.ReactNode }) {
  const { copy } = useAppLanguage();

  const tabs = [
    { label: copy.nav.applications, href: '/career/applications' },
    { label: copy.nav.strategy, href: '/career/strategy' },
    { label: copy.nav.trajectory, href: '/career/trajectory' },
  ];

  return (
    <>
      <SpaceTabBar tabs={tabs} />
      {children}
    </>
  );
}
