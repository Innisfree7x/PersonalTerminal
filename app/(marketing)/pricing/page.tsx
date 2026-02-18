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
      <section className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 md:py-28">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-red-400">Pricing</p>
        <h1 className="premium-heading mb-6 text-4xl font-semibold text-[#FAF0E6] md:text-6xl">
          Kein Abo-Chaos.
          <br />
          <span className="bg-gradient-to-r from-yellow-300 to-yellow-600 bg-clip-text text-transparent">
            Einfach kostenlos.
          </span>
        </h1>
        <p className="premium-subtext">
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
