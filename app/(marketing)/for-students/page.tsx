import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock, Target, TrendingUp } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GMAT & Thesis parallel planen — INNIS für Studenten',
  description:
    'INNIS zeigt dir in 2 Minuten ob dein GMAT-Plan realistisch ist. Backplanning von der Deadline rückwärts. Kein Signup für die Demo.',
  openGraph: {
    title: 'Plane GMAT, Thesis und Praktikum in einer Timeline',
    description: 'INNIS — Strategic Planning for Students',
  },
};

type RiskStatus = 'on_track' | 'tight' | 'at_risk';

const STATUS_CONFIG: Record<RiskStatus, { label: string; color: string; bg: string }> = {
  on_track: { label: 'On Track', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25' },
  tight: { label: 'Tight', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/25' },
  at_risk: { label: 'At Risk', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/25' },
};

const WALKTHROUGH_STEPS = [
  {
    step: '01',
    title: 'Goal anlegen — in 2 Minuten',
    description:
      'Du gibst dein Ziel ein (GMAT, Thesis, Praktikum), die Deadline und wie viele Stunden pro Woche du realistisch hast.',
    detail: 'INNIS berechnet sofort: reicht das? Bist du on track oder musst du früher anfangen?',
    icon: Target,
    status: 'on_track' as RiskStatus,
  },
  {
    step: '02',
    title: 'Risk-Status — dein täglicher Kompass',
    description: 'Jeden Morgen siehst du auf Today: bist du on track, tight oder at risk?',
    detail: 'Kein Rätselraten mehr. INNIS rechnet rückwärts von deiner Deadline.',
    icon: TrendingUp,
    status: 'tight' as RiskStatus,
  },
  {
    step: '03',
    title: 'Focus Sessions — Stunden die zählen',
    description: 'Jede Focus Session trägt zu deinem Wochenplan bei.',
    detail: 'Der Momentum Score zeigt dir wöchentlich ob du aufholst oder abdriftest.',
    icon: Clock,
    status: 'on_track' as RiskStatus,
  },
  {
    step: '04',
    title: 'Career parallel — kein Chaos',
    description: 'Bewerbungen, Interviews und Angebote im selben System.',
    detail: 'Keine separaten Notion-Tabellen mehr.',
    icon: CheckCircle2,
    status: 'on_track' as RiskStatus,
  },
];

const PAIN_POINTS = [
  {
    quote: '"Ich weiß nicht ob ich noch genug Zeit habe für den GMAT."',
    context: 'Masterstudent, 5. Semester, Prüfungsphase läuft parallel',
  },
  {
    quote: '"Meine Thesis-Deadline und die Internship-Deadlines kollidieren irgendwie immer."',
    context: 'BWL-Student, sucht gleichzeitig Praktikum und schreibt Bachelor',
  },
  {
    quote: '"Ich habe alles in Notion, aber ich plane eigentlich nicht — ich liste nur."',
    context: 'Master-Bewerber, kein System für die 6-Monats-Vorbereitung',
  },
];

export default function ForStudentsPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32 text-center">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-transparent to-transparent" />
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-primary">
            Für Studenten
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Wie Viet seinen GMAT in 6 Monaten geplant hat
          </h1>
          <p className="mt-6 text-lg text-text-secondary max-w-xl mx-auto">
            5. Semester. Parallele Bewerbungen. Kein System. INNIS hat ihm in 2 Minuten gezeigt ob sein Plan realistisch ist.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              Meinen Plan starten
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="text-xs text-text-tertiary">Kein Kreditkartencode. Kostenlos starten.</span>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-center text-xl font-semibold text-text-primary mb-2">Das Problem das wir alle kennen</h2>
        <p className="text-center text-sm text-text-tertiary mb-10">Echte Aussagen. Fiktiv aber realistisch.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {PAIN_POINTS.map((point, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5"
            >
              <p className="text-sm text-text-primary leading-relaxed mb-3">{point.quote}</p>
              <p className="text-[11px] text-text-tertiary">{point.context}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Step-by-Step Walkthrough */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-center text-xl font-semibold text-text-primary mb-2">So funktioniert es</h2>
        <p className="text-center text-sm text-text-tertiary mb-12">4 Schritte. Kein Overhead.</p>
        <div className="space-y-6">
          {WALKTHROUGH_STEPS.map((step) => {
            const Icon = step.icon;
            const status = STATUS_CONFIG[step.status];
            return (
              <div
                key={step.step}
                className="flex gap-6 rounded-xl border border-white/[0.08] bg-white/[0.02] p-6"
              >
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-text-tertiary">{step.step}</span>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-semibold text-text-primary">{step.title}</h3>
                    <span className={`text-xs font-semibold uppercase tracking-[0.1em] rounded-full border px-2 py-0.5 shrink-0 ${status.color} ${status.bg}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mb-1">{step.description}</p>
                  <p className="text-xs text-text-tertiary">{step.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Starte deinen Plan</h2>
        <p className="text-sm text-text-secondary mb-8">
          In 2 Minuten siehst du ob dein GMAT-Plan, deine Thesis oder deine Bewerbungen realistisch sind. Kein Signup benötigt für die Demo.
        </p>
        <Link
          href="/auth/signup"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          Kostenlos starten
          <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-4 text-xs text-text-tertiary">Keine Kreditkarte. Kein Abo-Lock-in.</p>
      </section>

      {/* Bottom stripe */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, #f87171, #fbbf24, #fb923c, #38bdf8)' }} />
    </div>
  );
}
