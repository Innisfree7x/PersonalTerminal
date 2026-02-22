'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { TrackedCtaLink } from './TrackedCtaLink';

const FREE_FEATURES = [
  'Unbegrenzte Aufgaben & Kurse',
  'Ziel-Tracking mit Fortschritt',
  'Bewerbungs-Kanban (Karriere)',
  'Globaler Fokus-Timer & Session-Tracking',
  'Google Calendar Integration',
  'Analytics Dashboard',
  'Onboarding-Wizard mit Demo-Daten',
];

const PRO_FEATURES = [
  'Alles aus Free',
  'Erweiterte Analytics & Exporte',
  'Wöchentliche Fokus-Reports per Email',
  'Prioritäts-Support',
  'Früher Zugang zu neuen Features',
  'Und mehr — wird noch bekannt gegeben',
];

export function PricingSection() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="marketing-container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <p className="premium-kicker">Preise</p>
          <h2 className="premium-heading mb-4 text-3xl font-semibold text-[#FAF0E6] md:text-5xl">
            Einfach. Transparent.
          </h2>
          <p className="premium-subtext mx-auto max-w-md">
            INNIS ist kostenlos — und bleibt es für alles Wesentliche.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="premium-card relative overflow-hidden rounded-2xl p-8"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-300/45 to-transparent" />
            <div className="mb-7">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Free</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-bold text-[#FAF0E6]">0€</span>
                <span className="text-zinc-500 text-sm">/ für immer</span>
              </div>
              <p className="text-sm text-zinc-500 mt-3 leading-relaxed">
                Alles was du für ein strukturiertes Studium brauchst.
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-zinc-300">
                  <Check className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <TrackedCtaLink
              href="/auth/signup"
              eventName="pricing_plan_selected"
              eventPayload={{ source: 'pricing', plan: 'free' }}
              className="block rounded-xl bg-red-500 py-3 text-center text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/25"
            >
              Kostenlos starten
            </TrackedCtaLink>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.18 }}
            className="premium-card relative overflow-hidden rounded-2xl border-yellow-500/30 bg-gradient-to-b from-yellow-500/8 to-[#111111] p-8"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-300/60 to-transparent" />
            {/* Coming Soon badge */}
            <div className="absolute top-5 right-5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/25 text-xs font-medium text-yellow-400">
                <Sparkles className="w-3 h-3" />
                Demnächst
              </span>
            </div>

            <div className="mb-7">
              <p className="text-xs font-semibold text-yellow-500 uppercase tracking-wider mb-3">Pro</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-bold text-[#FAF0E6]">Bald</span>
                <span className="text-zinc-500 text-sm">/ verfügbar</span>
              </div>
              <p className="text-sm text-zinc-500 mt-3 leading-relaxed">
                Für alle, die noch mehr aus ihrem Studium rausholen wollen.
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-zinc-300">
                  <Check className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <TrackedCtaLink
              href="/auth/signup"
              eventName="pricing_plan_selected"
              eventPayload={{ source: 'pricing', plan: 'pro_waitlist' }}
              className="block rounded-xl border border-yellow-500/35 py-3 text-center text-sm font-semibold text-yellow-300 transition-all hover:-translate-y-0.5 hover:border-yellow-500/70 hover:bg-yellow-500/10"
            >
              Auf Warteliste eintragen
            </TrackedCtaLink>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
