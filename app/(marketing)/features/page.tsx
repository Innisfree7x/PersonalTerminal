import { FeatureSection } from '@/components/features/marketing/FeatureSection';
import { CTASection } from '@/components/features/marketing/CTASection';
import { Route, CalendarDays, Command, Timer, Sparkles, ShieldCheck, Check } from 'lucide-react';

export const metadata = {
  title: 'Features — INNIS',
  description:
    'Trajectory Planner, Command Rail, Focus Screen, Lucian und Reliability Layer: alle Kernmodule von INNIS im Überblick.',
};

const DETAILED_FEATURES = [
  {
    icon: Route,
    title: 'Trajectory Planner',
    tagline: 'Strategie mit echten Deadlines.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/8',
    border: 'border-blue-500/15',
    points: [
      'Milestone-Planung für Thesis, GMAT, Master-Apps und Praktika',
      'Horizon-Simulation mit Stunden/Woche oder Monatsplanung',
      'Risk Console: on track / tight / at risk',
      'Opportunity Windows mit Prioritätsstufen',
      'Task-Package Generation für konkrete Execution-Blöcke',
      'Trajectory-Status als täglicher Briefing-Input',
    ],
  },
  {
    icon: CalendarDays,
    title: 'Today Command Center',
    tagline: 'Daily Execution ohne Kontextwechsel.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/8',
    border: 'border-violet-500/15',
    points: [
      'Task-Panel, Kalender, Focus-Timer und Study Progress in einem Screen',
      'Morning Briefing zeigt nächsten strategischen Meilenstein',
      'Urgency-orientierte Priorisierung für Exam-nahe Aufgaben',
      'Quick Actions für Task/Goal/Course/Event',
      'Direct handoff in den Vollbild-Focus-Screen',
      'Live-Daten statt statischer Tagesplanung',
    ],
  },
  {
    icon: Command,
    title: 'Command Rail',
    tagline: 'Tippen statt klicken.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/8',
    border: 'border-emerald-500/15',
    points: [
      'Deterministischer Parser für Tasks, Goals und Navigation',
      'Intent Preview vor Ausführung (keine Blind-Commands)',
      'Syntax-Feedback bei fehlerhaften Eingaben',
      'Enter-to-confirm mit klarer Aktionstransparenz',
      'Hookfähig für Execution-Events und Audit-Logs',
      'Schneller als menübasierte CRUD-Flows',
    ],
  },
  {
    icon: Timer,
    title: 'Focus System',
    tagline: 'Timer + Fullscreen + Sound.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/8',
    border: 'border-orange-500/15',
    points: [
      'Globaler Fokus-Timer inklusive Custom-Duration',
      'Vollbild Focus Screen mit visuellen Presets',
      'Overlay- und Theme-Auswahl für unterschiedliche Lernmodi',
      'Notification-Kit mit Teams-style Soundset',
      'Session-Persistenz über Seitenwechsel und Reload',
      'Streak- und Fokuszeit-Metriken automatisch erfasst',
    ],
  },
  {
    icon: Sparkles,
    title: 'Lucian Companion',
    tagline: 'Optional. Kontextuell. Charakterstark.',
    color: 'text-red-400',
    bg: 'bg-red-500/8',
    border: 'border-red-500/15',
    points: [
      'Mood-gesteuerte Hinweise je nach Workload und Deadlines',
      'Speech-Bubble Interaktion statt starrer Notification-Boxen',
      'Sprite/Spell-VFX für visuelles Feedback bei Fokus-Events',
      'Cooldown-Logik gegen Over-Notification',
      'Ein-/Ausschaltbar für personalisierte Intensität',
      'Kompatibel mit Focus Screen und Dashboard-Flows',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Reliability Layer',
    tagline: 'Build- und Runtime-Sicherheit.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/8',
    border: 'border-yellow-500/15',
    points: [
      'Ops-Flow-Metriken mit p95 und Error-Budget Tracking',
      'Cron Health Sichtbarkeit für Reminder/Reports',
      'CI-Gates: type-check, lint, build, blocker E2E',
      'OAuth Redirect-Härtung für stabile Google-Integrationen',
      'Incident Templates + CODEOWNERS für schnelle Eskalation',
      'Dokumentierte Release-Audits für agentenübergreifende Sicherheit',
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
          Alles was ein ambitionierter Student braucht.
          <br />
          <span className="bg-gradient-to-r from-yellow-300 to-yellow-600 bg-clip-text text-transparent">
            Von Strategie bis Execution.
          </span>
        </h1>
        <p className="premium-subtext mx-auto max-w-2xl">
          INNIS ist kein generisches Productivity-Tool. Es ist ein System für Studenten,
          die Karriereplanung und tägliche Leistung in einem einzigen Workflow verbinden wollen.
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
