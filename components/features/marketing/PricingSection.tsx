'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { TrackedCtaLink } from './TrackedCtaLink';

const FREE_FEATURES = [
  'Unbegrenzte Aufgaben & Kurse',
  'Ziel-Tracking mit Fortschritt',
  'Bewerbungs-Kanban (Karriere)',
  'Globaler Fokus-Timer & Streak',
  'Google Calendar Integration',
  'Analytics Dashboard',
  'Onboarding-Wizard mit Demo-Daten',
];

const PRO_FEATURES = [
  'Alles aus Free',
  'KI-gestützte Aufgabenplanung',
  'Erweiterte Analytics & Exports',
  'Kollaboration mit Kommilitonen',
  'Prioritäts-Support',
  'Früher Zugang zu neuen Features',
];

export function PricingSection() {
  return (
    <section className="py-24 md:py-32 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-4">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#FAF0E6] tracking-tight mb-4">
            Einfach. Transparent.
          </h2>
          <p className="text-zinc-500 max-w-md mx-auto">
            Prism ist kostenlos — und bleibt es für alles Wesentliche.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-8 rounded-2xl border border-white/8 bg-[#111111]"
          >
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
              className="block text-center bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-red-500/20 text-sm"
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
            className="relative p-8 rounded-2xl border border-yellow-500/25 bg-gradient-to-b from-yellow-500/5 to-[#111111] overflow-hidden"
          >
            {/* Coming Soon badge */}
            <div className="absolute top-5 right-5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/25 text-xs font-medium text-yellow-400">
                <Sparkles className="w-3 h-3" />
                Coming Soon
              </span>
            </div>

            <div className="mb-7">
              <p className="text-xs font-semibold text-yellow-500 uppercase tracking-wider mb-3">Pro</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-bold text-[#FAF0E6]">Bald</span>
                <span className="text-zinc-500 text-sm">/ verfügbar</span>
              </div>
              <p className="text-sm text-zinc-500 mt-3 leading-relaxed">
                Erweiterte Features für Power-User.
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
              className="block text-center border border-yellow-500/30 hover:border-yellow-500/60 text-yellow-400 hover:text-yellow-300 font-semibold py-3 rounded-xl transition-all text-sm"
            >
              Auf Warteliste eintragen
            </TrackedCtaLink>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
