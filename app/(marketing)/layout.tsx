import { MarketingNavbar } from '@/components/features/marketing/MarketingNavbar';
import { MarketingFooter } from '@/components/features/marketing/MarketingFooter';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0A', color: '#FAF0E6' }}>
      <MarketingNavbar />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
