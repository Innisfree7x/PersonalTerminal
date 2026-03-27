import { CTASection } from '@/components/features/marketing/CTASection';
import { FAQSection } from '@/components/features/marketing/FAQSection';
import { PricingSection } from '@/components/features/marketing/PricingSection';

export const metadata = {
  title: 'Pricing — INNIS',
  description:
    'Kostenlos starten, später strategisch vertiefen: Pricing für Studenten, die Thesis, GMAT und Career in einem System planen wollen.',
};

export default function PricingPage() {
  return (
    <>
      <section className="relative z-10 mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 md:py-28">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-red-400">Pricing</p>
        <h1 className="premium-heading mb-6 text-4xl font-semibold text-[#FAF0E6] md:text-6xl">
          Kein Abo-Drama.
          <span className="block text-zinc-500">Erst Wert. Dann Upgrade.</span>
        </h1>
        <p className="premium-subtext text-lg">
          Free löst das Kernproblem bereits. Pro erweitert das System für Nutzer,
          die aus INNIS ihre eigentliche Karriere-Konsole machen wollen.
        </p>
      </section>
      <PricingSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
