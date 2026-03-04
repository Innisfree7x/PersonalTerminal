import { PricingSection } from '@/components/features/marketing/PricingSection';
import { CTASection } from '@/components/features/marketing/CTASection';
import { FAQSection } from '@/components/features/marketing/FAQSection';

export const metadata = {
  title: 'Pricing — INNIS',
  description: 'Kostenlos starten, später auf Pro upgraden: Trajectory, Analytics und strategische Planung für Studenten.',
};

export default function PricingPage() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 md:py-28">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-red-400">Pricing</p>
        <h1 className="premium-heading mb-6 text-4xl font-semibold text-[#FAF0E6] md:text-6xl">
          Kein Abo-Chaos.
          <br />
          <span className="bg-gradient-to-r from-yellow-300 to-yellow-600 bg-clip-text text-transparent">
            Kostenlos starten.
          </span>
        </h1>
        <p className="premium-subtext">
          Free deckt deinen täglichen Workflow ab.
          Pro erweitert vor allem die strategische Trajectory-Planung.
        </p>
      </section>
      <PricingSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
