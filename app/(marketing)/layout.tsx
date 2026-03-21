import { MarketingFooter } from '@/components/features/marketing/MarketingFooter';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-shell min-h-screen text-white">
      {children}
      <MarketingFooter />
    </div>
  );
}
