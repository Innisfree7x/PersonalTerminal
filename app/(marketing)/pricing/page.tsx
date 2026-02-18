import { PricingSection } from '@/components/features/marketing/PricingSection';
import { CTASection } from '@/components/features/marketing/CTASection';
import { FAQSection } from '@/components/features/marketing/FAQSection';

export const metadata = {
  title: 'Pricing — Prism',
  description: 'Prism ist kostenlos für Studenten. Alle wesentlichen Features ohne Kreditkarte.',
};

export default function PricingPage() {
  return (
    <>
      <section className="py-20 md:py-28 text-center max-w-2xl mx-auto px-4 sm:px-6">
        <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-4">Pricing</p>
        <h1 className="text-4xl md:text-5xl font-bold text-[#FAF0E6] tracking-tight mb-5">
          Kein Abo-Chaos.
          <br />
          <span className="bg-gradient-to-r from-yellow-300 to-yellow-600 bg-clip-text text-transparent">
            Einfach kostenlos.
          </span>
        </h1>
        <p className="text-zinc-400 leading-relaxed">
          Prism ist kostenlos und bleibt es für alles Wesentliche.
          Pro-Features kommen — ohne das Free-Tier einzuschränken.
        </p>
      </section>
      <PricingSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
