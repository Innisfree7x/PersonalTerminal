import { MarketingNavbar } from '@/components/features/marketing/MarketingNavbar';
import { MarketingFooter } from '@/components/features/marketing/MarketingFooter';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-shell premium-grid-bg min-h-screen text-white">
      <MarketingNavbar />
      {children}
      <MarketingFooter />
    </div>
  );
}
