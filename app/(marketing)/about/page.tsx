import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'About — Prism',
  description: 'Warum Prism? Ein persönliches Dashboard für Studenten, das wirklich funktioniert.',
};

export default function AboutPage() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-4">About</p>
        <h1 className="text-4xl md:text-5xl font-bold text-[#FAF0E6] tracking-tight mb-8 leading-[1.1]">
          Gebaut aus{' '}
          <span className="bg-gradient-to-r from-yellow-300 to-yellow-600 bg-clip-text text-transparent">
            Frustration.
          </span>
        </h1>

        <div className="space-y-6 text-zinc-400 leading-relaxed">
          <p>
            Prism entstand aus einem einfachen Problem: zu viele Apps, zu viel Kontext-Wechsel,
            zu wenig Überblick. Notion für Notizen, Trello für Bewerbungen, Google Sheets für Kurse,
            eine separate App für den Timer — und am Ende des Tages weiß man trotzdem nicht, was wirklich
            Priorität hat.
          </p>
          <p>
            Prism bringt alles an einen Ort: Kursplanung, Aufgaben, Ziele, Karriere und Analytics —
            designed für den Studienalltag, nicht für Enterprise-Teams.
          </p>
          <p>
            Das Projekt ist persönlich, kostenlos und wird aktiv weiterentwickelt. Feedback und
            Ideen sind willkommen.
          </p>

          <div className="pt-4 border-t border-white/5">
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
