'use client';

import { motion } from 'framer-motion';

const diagnosisRows = [
  {
    label: 'Planung',
    before: 'Deadline irgendwo im Kopf, Aufwand irgendwo in Notion.',
    after: 'Eine Timeline mit Startfenster, Buffer und klarer Risikologik.',
  },
  {
    label: 'Daily',
    before: 'Jeder Morgen beginnt mit Neu-Sortieren und Kontextwechsel.',
    after: 'Today uebernimmt den naechsten sinnvollen Move direkt aus Trajectory.',
  },
  {
    label: 'Signal',
    before: 'Du merkst zu spaet, dass Thesis, GMAT und Bewerbungen kollidieren.',
    after: 'INNIS zeigt die Kollision frueh genug, damit du noch reagieren kannst.',
  },
];

export function ProblemStrip() {
  return (
    <section className="relative py-16 md:py-20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/5 blur-3xl" />

      <div className="marketing-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <p className="premium-kicker">Die eigentliche Spannung</p>
          <p className="text-[1.45rem] font-semibold leading-snug tracking-tight text-[#FAF0E6] md:text-3xl">
            Die meisten Tools verwalten Aufgaben.
            <br />
            <span className="text-zinc-500">INNIS verwaltet Konflikte.</span>
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
            Thesis, GMAT, Praktikum und Master-Apps scheitern selten an fehlenden To-do-Listen.
            Sie scheitern daran, dass niemand die Kollisionen frueh genug sichtbar macht.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.35 }}
          className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[0.82fr_1.18fr]"
        >
          <div className="premium-card rounded-[1.75rem] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Ohne INNIS</p>
            <p className="mt-4 text-2xl font-semibold leading-tight text-[#FAF0E6]">
              Fuenf Tools. Viele Listen.
              <span className="block text-zinc-500">Trotzdem zu spaet dran.</span>
            </p>
            <div className="mt-6 space-y-3 text-sm leading-relaxed text-zinc-400">
              <p>Notion fuer Notizen. Kalender fuer Termine. Excel fuer Bewerbungen. Ein extra Timer. Irgendwo noch Goals.</p>
              <p>Das Problem ist nicht fehlende Aktivitaet, sondern fehlende Prioritaetswahrheit.</p>
            </div>
          </div>

          <div className="premium-card-soft rounded-[1.75rem] p-6">
            <div className="grid gap-4">
              {diagnosisRows.map((row) => (
                <div key={row.label} className="grid gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4 md:grid-cols-[110px_1fr_1fr]">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{row.label}</p>
                  </div>
                  <div className="rounded-xl border border-red-500/18 bg-red-500/[0.05] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-red-300">Vorher</p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">{row.before}</p>
                  </div>
                  <div className="rounded-xl border border-yellow-500/16 bg-yellow-500/[0.05] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-yellow-300">Mit INNIS</p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-300">{row.after}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
