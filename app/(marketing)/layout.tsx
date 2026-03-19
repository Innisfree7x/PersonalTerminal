import { MarketingNavbar } from '@/components/features/marketing/MarketingNavbar';
import { MarketingFooter } from '@/components/features/marketing/MarketingFooter';
import { ScrollProgress } from '@/components/features/marketing/ScrollProgress';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-shell min-h-screen overflow-x-clip text-[#FAF0E6]">
      <div className="pointer-events-none fixed inset-0 marketing-spotlight" />
      <div className="pointer-events-none fixed inset-0 marketing-grid-overlay" />
      <div className="pointer-events-none fixed inset-0 marketing-vignette" />
      <div className="pointer-events-none fixed inset-0 marketing-noise" />
      <ScrollProgress />
      <MarketingNavbar />
      <main className="relative z-10">{children}</main>
      <MarketingFooter />
    </div>
  );
}
