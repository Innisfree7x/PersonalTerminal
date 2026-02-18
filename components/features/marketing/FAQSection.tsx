'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

const FAQS = [
  {
    q: 'Ist Prism wirklich kostenlos?',
    a: 'Ja, vollständig. Prism ist ein persönliches Projekt und für alle Studenten kostenlos. Pro-Features werden in Zukunft optional gegen eine kleine Gebühr angeboten — das Kernprodukt bleibt frei.',
  },
  {
    q: 'Brauche ich ein Google-Konto?',
    a: 'Nein. Google Calendar ist vollständig optional. Du kannst Prism ohne jede Google-Integration nutzen — die Verbindung kann jederzeit in den Einstellungen aktiviert oder deaktiviert werden.',
  },
  {
    q: 'Wie sicher sind meine Daten?',
    a: 'Alle Daten werden verschlüsselt in Supabase (PostgreSQL) gespeichert. Keine Daten werden an Dritte weitergegeben. Du hast jederzeit die volle Kontrolle über deine Daten.',
  },
  {
    q: 'Für wen ist Prism gemacht?',
    a: 'Prism wurde für Studenten entwickelt, die Kurse, Aufgaben, Ziele und Karriere an einem Ort verwalten wollen — ohne zwischen fünf verschiedenen Apps zu wechseln.',
  },
  {
    q: 'Gibt es eine mobile App?',
    a: 'Noch nicht. Die Web-App ist responsiv und auf mobilen Geräten nutzbar. Eine native App ist für eine spätere Phase geplant.',
  },
  {
    q: 'Kann ich Demo-Daten ausprobieren?',
    a: 'Ja. Im Onboarding-Wizard kannst du mit einem Klick Beispieldaten laden — Kurse, Ziele und Aufgaben werden automatisch angelegt, damit du Prism sofort erkunden kannst. Demo-Daten lassen sich jederzeit in den Einstellungen wieder entfernen.',
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 md:py-32 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-4">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#FAF0E6] tracking-tight">
            Häufige Fragen
          </h2>
        </motion.div>

        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="border border-white/5 rounded-xl bg-[#111111] overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/2 transition-colors"
              >
                <span className="text-sm font-medium text-[#FAF0E6] pr-4">{faq.q}</span>
                <motion.div
                  animate={{ rotate: open === i ? 45 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <Plus className="w-4 h-4 text-zinc-500" />
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
                    <p className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-3">
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
