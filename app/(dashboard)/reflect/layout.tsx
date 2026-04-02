'use client';

import SpaceTabBar from '@/components/layout/SpaceTabBar';
import { useAppLanguage } from '@/components/providers/LanguageProvider';

export default function ReflectLayout({ children }: { children: React.ReactNode }) {
  const { copy } = useAppLanguage();

  const tabs = [
    { label: copy.nav.analytics, href: '/reflect/analytics' },
    { label: copy.nav.momentum, href: '/reflect/momentum' },
  ];

  return (
    <>
      <SpaceTabBar tabs={tabs} />
      {children}
    </>
  );
}
