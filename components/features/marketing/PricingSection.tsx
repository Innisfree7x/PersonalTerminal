'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { TrackedCtaLink } from './TrackedCtaLink';

const FREE_FEATURES = [
  'Trajectory-Grundlage fuer ein aktives Ziel',
  'Today, Tasks und Fokus-Timer',
  'University Tracking und Calendar',
  'Career Board im selben System',
  'Onboarding mit direkter Activation',
];

const PRO_FEATURES = [
  'Alles aus Free',
  'Mehrere Trajectory-Ziele und tiefere Planung',
  'Task-Pakete direkt aus Trajectory',
  'Erweiterte Analytics und Exporte',
  'Strategische Reports und Bridges',
  'Fast Feature Access fuer Power User',
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
            Free muss schon nuetzlich sein.
            <span className="block text-zinc-500">Pro vertieft die Strategie.</span>
          </h2>
          <p className="premium-subtext mx-auto max-w-md">
            Keine kuenstliche Abo-Dramatik. Du sollst zuerst merken, ob das System fuer dich funktioniert.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="premium-card relative overflow-hidden rounded-2xl p-8"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-300/45 to-transparent" />
            <div className="mb-7">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Free</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-bold text-[#FAF0E6]">0€</span>
                <span className="text-sm text-zinc-500">/ fuer immer</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                Alles, was du brauchst, um aus Ambition tatsaechliche Tagesausfuehrung zu machen.
              </p>
            </div>

            <ul className="mb-8 space-y-3">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                  {feature}
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.18 }}
            className="premium-card relative overflow-hidden rounded-2xl border-yellow-500/30 bg-gradient-to-b from-yellow-500/8 to-[#111111] p-8"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-300/60 to-transparent" />
            <div className="absolute right-5 top-5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/25 bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-400">
                <Sparkles className="h-3 w-3" />
                Demnaechst
              </span>
            </div>

            <div className="mb-7">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-yellow-500">Pro</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-bold text-[#FAF0E6]">Bald</span>
                <span className="text-sm text-zinc-500">/ verfuegbar</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                Fuer Nutzer, die aus INNIS ihre eigentliche Karriere-Konsole machen wollen.
              </p>
            </div>

            <ul className="mb-8 space-y-3">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-400" />
                  {feature}
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

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.22 }}
          className="mx-auto mt-6 max-w-4xl rounded-[1.5rem] border border-white/8 bg-white/[0.02] px-5 py-4"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Pricing Haltung
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            INNIS soll sich nicht durch kuenstliche Sperren teuer anfuehlen.
            Free loest das Kernproblem. Pro macht die Planung tiefer, nicht die Basis erst benutzbar.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
