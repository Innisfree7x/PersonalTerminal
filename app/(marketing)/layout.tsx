'use client';

import { usePathname } from 'next/navigation';
import { MarketingNavbar } from '@/components/features/marketing/MarketingNavbar';
import { MarketingFooter } from '@/components/features/marketing/MarketingFooter';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  return (
    <div className="marketing-shell premium-grid-bg min-h-screen text-white">
      {!isLanding ? <MarketingNavbar /> : null}
      {children}
      {!isLanding ? <MarketingFooter /> : null}
    </div>
  );
}
