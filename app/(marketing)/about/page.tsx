import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'About — INNIS',
  description: 'Warum INNIS gebaut wurde: aus echter Frustration ueber zu viele Tools und zu wenig Prioritaetsklarheit im Studienalltag.',
};

export default function AboutPage() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-red-400">About</p>
        <h1 className="premium-heading mb-8 text-4xl font-semibold text-[#FAF0E6] md:text-6xl">
          Gebaut aus echter Ueberforderung.
          <span className="block text-zinc-500">Nicht aus Marktanalyse.</span>
        </h1>

        <div className="space-y-6">
          <p className="premium-card-soft rounded-[1.75rem] p-6 text-base leading-relaxed text-zinc-300">
            INNIS ist aus einem sehr konkreten Problem entstanden:
            wenn Bachelor, GMAT, Praktikum und Master-Bewerbungen parallel laufen,
            helfen dir mehr Listen nicht automatisch weiter. Du brauchst eine ehrliche Antwort auf die Frage:
            <span className="text-[#FAF0E6]"> Wo kollidiert mein Plan wirklich?</span>
          </p>

          <p className="premium-card-soft rounded-[1.75rem] p-6 text-base leading-relaxed text-zinc-300">
            Deshalb ist INNIS nicht als generisches Productivity-Tool gedacht.
            Es ist ein System fuer Studenten mit parallelen High-Stakes-Zielen:
            zuerst Trajectory, dann Today, dann Fokus und Career.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="premium-card-soft rounded-[1.75rem] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Wofuer INNIS steht</p>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-300">
                <li>Strategische Klarheit vor dekorativer Produktivitaet.</li>
                <li>Echte Priorisierung statt Dashboard-Lautstaerke.</li>
                <li>Ein bewusstes Produkt fuer Studenten, nicht fuer Enterprise-Teams.</li>
              </ul>
            </div>

            <div className="premium-card-soft rounded-[1.75rem] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Wofuer INNIS nicht gebaut ist</p>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-300">
                <li>Nicht fuer beliebige Team-Workflows.</li>
                <li>Nicht als another pretty to-do app.</li>
                <li>Nicht als Featuresammlung ohne Haltung.</li>
              </ul>
            </div>
          </div>

          <p className="premium-card-soft rounded-[1.75rem] p-6 text-base leading-relaxed text-zinc-300">
            Das Projekt ist persoenlich, kostenlos startbar und wird aktiv weiterentwickelt.
            Feedback ist willkommen, aber die Richtung bleibt bewusst klar:
            weniger Tool-Chaos, mehr strategische Wahrheit.
          </p>

          <div className="border-t border-white/10 pt-4">
            <p className="mb-6 text-sm text-zinc-500">
              INNIS ist kein VC-getriebenes Storytelling-Produkt. Es ist ein ernst gemeintes Werkzeug
              fuer den echten Studienalltag.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-red-600"
              >
                Kostenlos starten
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/for-students"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-zinc-300 transition-all hover:border-white/20 hover:text-[#FAF0E6]"
              >
                Studenten-Story ansehen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
