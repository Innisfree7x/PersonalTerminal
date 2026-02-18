import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'About — Prism',
  description: 'Warum Prism? Ein persönliches Dashboard für Studenten, das wirklich funktioniert.',
};

export default function AboutPage() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-red-400">About</p>
        <h1 className="premium-heading mb-8 text-4xl font-semibold text-[#FAF0E6] md:text-6xl">
          Gebaut aus{' '}
          <span className="bg-gradient-to-r from-yellow-300 to-yellow-600 bg-clip-text text-transparent">
            Frustration.
          </span>
        </h1>

        <div className="premium-subtext space-y-6">
          <p className="premium-card-soft rounded-2xl p-6">
            Prism entstand aus einem einfachen Problem: zu viele Apps, zu viel Kontext-Wechsel,
            zu wenig Überblick. Notion für Notizen, Trello für Bewerbungen, Google Sheets für Kurse,
            eine separate App für den Timer — und am Ende des Tages weiß man trotzdem nicht, was wirklich
            Priorität hat.
          </p>
          <p className="premium-card-soft rounded-2xl p-6">
            Prism bringt alles an einen Ort: Kursplanung, Aufgaben, Ziele, Karriere und Analytics —
            designed für den Studienalltag, nicht für Enterprise-Teams.
          </p>
          <p className="premium-card-soft rounded-2xl p-6">
            Das Projekt ist persönlich, kostenlos und wird aktiv weiterentwickelt. Feedback und
            Ideen sind willkommen.
          </p>

          <div className="border-t border-white/10 pt-4">
            <p className="text-sm text-zinc-500 mb-6">
              Prism ist kein Startup und kein VC-backed Produkt. Es ist ein ehrliches Tool,
              gebaut für den echten Studienalltag.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-xl transition-all text-sm"
              >
                Kostenlos starten
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-[#FAF0E6] font-medium px-6 py-3 rounded-xl transition-all text-sm"
              >
                Features ansehen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
