import { ArrowRight, CalendarDays, Command, Route, ShieldCheck } from 'lucide-react';
import { CTASection } from '@/components/features/marketing/CTASection';
import { FeatureSection } from '@/components/features/marketing/FeatureSection';

export const metadata = {
  title: 'Features — INNIS',
  description:
    'Trajectory, Today, Command Rail und Reliability: die vier Ebenen von INNIS für Studenten mit parallelen High-Stakes-Zielen.',
};

const FEATURE_GROUPS = [
  {
    icon: Route,
    title: 'Strategische Ebene',
    tagline: 'Trajectory statt Bauchgefühl.',
    points: [
      'Milestone-Planung für Thesis, GMAT, Master-Apps und Praktika',
      'Horizon-Simulation mit Stunden/Woche oder Monatsplanung',
      'Risk Console mit on track, tight und at risk',
      'Opportunity Windows mit Prioritätsstufen',
      'Task-Package Generation für konkrete Execution-Blöcke',
      'Trajectory-Status als täglicher Briefing-Input',
    ],
  },
  {
    icon: CalendarDays,
    title: 'Taktische Ebene',
    tagline: 'Today verdichtet den Tag.',
    points: [
      'Task-Panel, Kalender, Fokus-Timer und Study Progress in einem Screen',
      'Morning Briefing zeigt den nächsten strategischen Meilenstein',
      'Urgency-orientierte Priorisierung für exam-nahe Aufgaben',
      'Quick Actions für Task, Goal, Course und Event',
      'Direct handoff in den Vollbild-Focus-Screen',
      'Live-Daten statt statischer Tagesplanung',
    ],
  },
  {
    icon: Command,
    title: 'Execution Ebene',
    tagline: 'Commands, Fokus und Career greifen ineinander.',
    points: [
      'Deterministischer Parser für Tasks, Goals und Navigation',
      'Intent Preview vor Ausführung statt Blind-Commands',
      'Syntax-Feedback bei fehlerhaften Eingaben',
      'Enter-to-confirm mit klarer Aktionstransparenz',
      'Fokus-Sessions und Career-Board im selben Workflow',
      'Schneller als menübasierte CRUD-Flows',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Vertrauens Ebene',
    tagline: 'Premium heißt auch verlässlich.',
    points: [
      'Ops-Flow-Metriken mit p95 und Error-Budget Tracking',
      'Cron-Health-Sichtbarkeit für Reminder und Reports',
      'CI-Gates für type-check, lint, build und blocker E2E',
      'OAuth Redirect-Härtung für stabile Google-Integrationen',
      'Incident Templates plus CODEOWNERS für schnelle Eskalation',
      'Dokumentierte Release-Audits für agentenübergreifende Sicherheit',
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 md:py-28">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-red-400">Features</p>
        <h1 className="premium-heading mb-6 text-4xl font-semibold text-[#FAF0E6] md:text-6xl">
          INNIS ist kein Feature-Bündel.
          <span className="block text-zinc-500">Es ist ein System in vier Ebenen.</span>
        </h1>
        <p className="premium-subtext mx-auto max-w-2xl text-lg">
          Genau deshalb fühlt es sich anders an als ein klassisches Productivity-Tool:
          Strategie, Day-to-day und Reliability greifen hier bewusst ineinander.
        </p>
      </section>

      <section className="pb-12">
        <div className="marketing-container space-y-6">
          {FEATURE_GROUPS.map((group, index) => (
            <div
              key={group.title}
              className="premium-card-soft grid gap-6 rounded-[1.75rem] p-7 md:grid-cols-[220px_1fr]"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Ebene {index + 1}
                </p>
                <div className="mb-4 mt-4 flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/18 bg-red-500/[0.06]">
                  <group.icon className="h-5 w-5 text-red-300" />
                </div>
                <p className="mb-1 font-semibold text-[#FAF0E6]">{group.title}</p>
                <p className="text-xs text-zinc-500">{group.tagline}</p>
              </div>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {group.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-zinc-400">
                    <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-300" />
                    {point}
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
