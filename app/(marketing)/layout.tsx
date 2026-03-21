import { MarketingNavbar } from '@/components/features/marketing/MarketingNavbar';
import { MarketingFooter } from '@/components/features/marketing/MarketingFooter';
import { ScrollLine } from '@/components/features/marketing/ScrollLine';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-shell min-h-screen overflow-x-clip text-white">
      <ScrollLine />
      <MarketingNavbar />
      <main className="relative z-10">{children}</main>
      <MarketingFooter />
    </div>
  );
}
