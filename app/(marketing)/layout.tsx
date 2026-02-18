import { MarketingNavbar } from '@/components/features/marketing/MarketingNavbar';
import { MarketingFooter } from '@/components/features/marketing/MarketingFooter';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-shell min-h-screen text-[#FAF0E6]">
      <div className="pointer-events-none fixed inset-0 marketing-grid-overlay" />
      <div className="pointer-events-none fixed inset-0 marketing-noise" />
      <MarketingNavbar />
      <main className="relative z-10">{children}</main>
      <MarketingFooter />
    </div>
  );
}
