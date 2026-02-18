import { FeatureSection } from '@/components/features/marketing/FeatureSection';
import { CTASection } from '@/components/features/marketing/CTASection';
import { Calendar, BookOpen, Target, Briefcase, Timer, BarChart2, Check } from 'lucide-react';

export const metadata = {
  title: 'Features — Prism',
  description: 'Alle Module von Prism: Tagesplanung, Universität, Ziele, Karriere, Fokus-Timer und Analytics.',
};

const DETAILED_FEATURES = [
  {
    icon: Calendar,
    title: 'Tagesplanung',
    tagline: 'Dein Tag. Strukturiert.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/8',
    border: 'border-blue-500/15',
    points: [
      'Smarte Aufgabenliste mit Urgency-Farbkodierung',
      'Google Calendar Integration (optional)',
      'Quick Stats Bar: Streak, Fokuszeit, Fortschritt',
      'Pomodoro-Timer direkt auf dem Dashboard',
      'Mood Tracker und Energielevel-Tracking',
      'Activity Feed: deine letzten Aktionen',
    ],
  },
  {
    icon: BookOpen,
    title: 'Universität',
    tagline: 'Kurse. Übungsblätter. Klausuren.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/8',
    border: 'border-violet-500/15',
    points: [
      'Kursmanagement mit ECTS und Semesterzuordnung',
      'Übungsblatt-Checkboxen (Blatt 1–N) pro Kurs',
      'Animierte Fortschrittsbalken per Kurs',
      'Klausurcountdown mit Urgency-Indikatoren',
      'Automatische Study-Tasks im Tages-Dashboard',
      'Exam-Kalender-Integration',
    ],
  },
  {
    icon: Target,
    title: 'Ziele',
    tagline: 'Fokus auf das, was zählt.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/8',
    border: 'border-emerald-500/15',
    points: [
      'Kategorien: Career, Fitness, Learning, Finance',
      'Prioritätsstufen (Low, Medium, High)',
      'Deadline-Tracking mit Fortschritt',
      'Wöchentliche/monatliche/jährliche Ansicht',
      'Completion-Statistiken',
      'Ziele erscheinen automatisch im Tages-Dashboard',
    ],
  },
  {
    icon: Briefcase,
    title: 'Karriere',
    tagline: 'Von der Bewerbung bis zum Offer.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/8',
    border: 'border-orange-500/15',
    points: [
      'Kanban: Applied → Interview → Offer / Rejected',
      'CV-Upload via Supabase Storage',
      'PDF/DOCX-Extraktion für Auto-Fill',
      'Interview-Termine im Tages-Dashboard',
      'Bewerbungsstatistiken (Rate, Pipeline)',
      'Notizen und Status pro Bewerbung',
    ],
  },
  {
    icon: Timer,
    title: 'Fokus-Timer',
    tagline: 'Immer dabei. Über alle Seiten.',
    color: 'text-red-400',
    bg: 'bg-red-500/8',
    border: 'border-red-500/15',
    points: [
      'Globales Floating-Widget (persistiert bei Seitenwechsel)',
      'Pomodoro: Work/Break-Zyklen konfigurierbar',
      'LocalStorage-Backup (kein Verlust bei Refresh)',
      'Fokuszeit-Tracking pro Tag',
      'Streak-Berechnung über Fokussessions',
      'Sound-Feedback beim Timer-Ende',
    ],
  },
  {
    icon: BarChart2,
    title: 'Analytics',
    tagline: 'Deine Produktivität auf einen Blick.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/8',
    border: 'border-yellow-500/15',
    points: [
      'Fokuszeit-Charts nach Tagesabschnitt (Recharts)',
      'Aufgaben-Completion-Rate pro Woche',
      'Streak-Verlauf und Langzeittrends',
      'Kurs-Fortschritt-Übersicht',
      'Karriere-Pipeline-Statistiken',
      'Exportierbare Daten (Pro, coming soon)',
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 md:py-28">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-red-400">Features</p>
        <h1 className="premium-heading mb-6 text-4xl font-semibold text-[#FAF0E6] md:text-6xl">
          Alles was ein Student braucht.
          <br />
          <span className="bg-gradient-to-r from-yellow-300 to-yellow-600 bg-clip-text text-transparent">
            Nichts was er nicht braucht.
          </span>
        </h1>
        <p className="premium-subtext mx-auto max-w-2xl">
          Prism ist kein Allround-Produktivitätstool. Es wurde von einem Studenten für
          Studenten gebaut — mit genau den Funktionen, die im Studienalltag zählen.
        </p>
      </section>

      {/* Detailed feature breakdown */}
      <section className="pb-24 md:pb-32">
        <div className="marketing-container space-y-6">
          {DETAILED_FEATURES.map((f) => (
            <div
              key={f.title}
              className="premium-card-soft grid gap-6 rounded-2xl p-7 md:grid-cols-[220px_1fr]"
            >
              <div>
                <div className={`w-11 h-11 rounded-xl ${f.bg} border ${f.border} flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <p className="font-semibold text-[#FAF0E6] mb-1">{f.title}</p>
                <p className="text-xs text-zinc-500">{f.tagline}</p>
              </div>
              <ul className="grid sm:grid-cols-2 gap-2.5">
                {f.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-zinc-400">
                    <Check className={`w-4 h-4 ${f.color} flex-shrink-0 mt-0.5`} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <FeatureSection />
      <CTASection />
    </>
  );
}
