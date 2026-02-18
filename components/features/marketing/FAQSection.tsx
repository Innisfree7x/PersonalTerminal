'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

const FAQS = [
  {
    q: 'Ist INNIS wirklich kostenlos?',
    a: 'Ja, vollständig. INNIS ist ein persönliches Projekt und für alle Studenten kostenlos. Pro-Features werden in Zukunft optional gegen eine kleine Gebühr angeboten — das Kernprodukt bleibt frei.',
  },
  {
    q: 'Brauche ich ein Google-Konto?',
    a: 'Nein. Google Calendar ist vollständig optional. Du kannst INNIS ohne jede Google-Integration nutzen — die Verbindung kann jederzeit in den Einstellungen aktiviert oder deaktiviert werden.',
  },
  {
    q: 'Wie sicher sind meine Daten?',
    a: 'Alle Daten werden verschlüsselt in Supabase (PostgreSQL) gespeichert. Keine Daten werden an Dritte weitergegeben. Du hast jederzeit die volle Kontrolle über deine Daten.',
  },
  {
    q: 'Für wen ist INNIS gemacht?',
    a: 'INNIS wurde für Studenten entwickelt, die Kurse, Aufgaben, Ziele und Karriere an einem Ort verwalten wollen — ohne zwischen fünf verschiedenen Apps zu wechseln.',
  },
  {
    q: 'Gibt es eine mobile App?',
    a: 'Noch nicht. Die Web-App ist responsiv und auf mobilen Geräten nutzbar. Eine native App ist für eine spätere Phase geplant.',
  },
  {
    q: 'Kann ich Demo-Daten ausprobieren?',
    a: 'Ja. Im Onboarding-Wizard kannst du mit einem Klick Beispieldaten laden — Kurse, Ziele und Aufgaben werden automatisch angelegt, damit du INNIS sofort erkunden kannst. Demo-Daten lassen sich jederzeit in den Einstellungen wieder entfernen.',
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="relative py-24 md:py-32">
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="marketing-container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-red-400">FAQ</p>
          <h2 className="premium-heading text-3xl font-semibold text-[#FAF0E6] md:text-5xl">
            Häufige Fragen
          </h2>
        </motion.div>

        <div className="mx-auto max-w-3xl space-y-2">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="premium-card-soft overflow-hidden rounded-xl"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.04]"
              >
                <span className="pr-4 text-sm font-medium text-[#FAF0E6]">{faq.q}</span>
                <motion.div
                  animate={{ rotate: open === i ? 45 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]"
                >
                  <Plus className="h-4 w-4 text-zinc-400" />
                </motion.div>
              </button>

              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <p className="premium-subtext border-t border-white/10 px-5 pb-5 pt-3 text-sm">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
