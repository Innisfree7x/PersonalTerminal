'use client';

import { motion } from 'framer-motion';
import { Briefcase, CalendarDays, Command, Route } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ShowcaseSurface {
  icon: LucideIcon;
  number: string;
  title: string;
  claim: string;
  shift: string;
  proofLabel: string;
  proofValue: string;
  proofDetail: string;
  signals: string[];
}

const surfaces: ShowcaseSurface[] = [
  {
    icon: Route,
    number: '01',
    title: 'Trajectory',
    claim: 'Du siehst nicht nur Deadlines. Du siehst Startfenster, Buffer und Konflikte in derselben Logik.',
    shift: 'Aus verstreuten Semester-Deadlines wird ein strategischer Startplan.',
    proofLabel: 'Sichtbarer Output',
    proofValue: 'Startdatum + Risiko',
    proofDetail: 'Ein Blick reicht, um zu sehen, wann die Vorbereitung wirklich beginnen muss und wo dein Plan kippt.',
    signals: [
      'Milestones fuer Thesis, GMAT, Praktika und Master-Apps',
      'Risk-Ampel statt Bauchgefuehl',
      'Opportunity Windows fuer echte Bewerbungsfenster',
    ],
  },
  {
    icon: CalendarDays,
    number: '02',
    title: 'Today',
    claim: 'INNIS reduziert den Tag nicht auf mehr Widgets, sondern auf den naechsten sinnvollen Move.',
    shift: 'Aus offenem Task-Lärm wird ein taeglicher Operations-Flow.',
    proofLabel: 'Sichtbarer Output',
    proofValue: 'Morning Briefing',
    proofDetail: 'Trajectory-Kontext, Momentum und heutiger Fokus sitzen in einer einzigen Zeile statt in fuenf losen Karten.',
    signals: [
      'Morning Briefing mit Strategie-Kontext',
      'Fokus-Sessions mit klarem Startpunkt',
      'Daily-Flaechen, die wirklich handlungsfaehig bleiben',
    ],
  },
  {
    icon: Briefcase,
    number: '03',
    title: 'Career Intelligence',
    claim: 'Jobs werden nicht blind gesammelt, sondern gegen dein Profil, deine Gaps und deine echte Reach eingeordnet.',
    shift: 'Aus Keyword-Suche wird ein realistischer Bewerbungs-Radar.',
    proofLabel: 'Sichtbarer Output',
    proofValue: 'Fit + Gap + Next Move',
    proofDetail: 'Du bekommst Markt-Passung, Gruende, Luecken und direkt den naechsten sinnvollen Schritt fuer jede Rolle.',
    signals: [
      'CV-Intelligence mit Strengths, Gaps und Rank-Tier',
      'Reach-Bands statt pseudo-präziser 99/100 Scores',
      'Gap direkt als Today-Task oder Prep-Block uebernehmbar',
    ],
  },
  {
    icon: Command,
    number: '04',
    title: 'Command Rail',
    claim: 'Wenn alles parallel laeuft, darf Ausfuehrung nicht an Menues, Tabs und Kontextwechseln haengen.',
    shift: 'Aus Klicken in mehreren Bereichen wird ein gemeinsames Ausfuehrungssystem.',
    proofLabel: 'Sichtbarer Output',
    proofValue: 'Eine Eingabe, ein Move',
    proofDetail: 'Tasks, Goals und Navigation laufen ueber dieselbe Command-Surface und bleiben damit konsistent.',
    signals: [
      'Deterministische Preview vor Ausfuehrung',
      'Career, Uni und Daily im selben Rail',
      'Keyboard-first statt Tab-Switching',
    ],
  },
];

export function ProductShowcase() {
  return (
    <section className="relative py-28 md:py-36">
      <div className="premium-divider" />

      <div className="marketing-container mt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-20 max-w-4xl text-center"
        >
          <p className="premium-kicker">Was INNIS konkret anders macht</p>
          <h2 className="premium-heading text-[clamp(2.2rem,5vw,4rem)] font-semibold text-[#FAF0E6]">
            Vier Flaechen.
            <br />
            Ein sichtbarer Vorteil pro Flaeche.
          </h2>
          <p className="mt-6 text-lg leading-[1.7] text-zinc-500">
            Nicht mehr Features, sondern klarere Outputs: was driftet, was heute zaehlt, welche Rolle realistisch ist und was du als Naechstes ausfuehrst.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          {surfaces.map((surface, index) => (
            <motion.article
              key={surface.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="premium-card rounded-[28px] p-7 md:p-8"
            >
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E8B930]/12 bg-[#E8B930]/[0.05]">
                  <surface.icon className="h-5 w-5 text-[#E8B930]/75" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                    Surface {surface.number}
                  </p>
                  <h3 className="text-xl font-semibold tracking-tight text-[#FAF0E6]">
                    {surface.title}
                  </h3>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-[1.05fr_0.95fr]">
                <div>
                  <p className="text-[16px] leading-[1.7] text-zinc-300">{surface.claim}</p>
                  <p className="mt-3 text-sm leading-[1.7] text-zinc-500">{surface.shift}</p>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                    {surface.proofLabel}
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-[#FAF0E6]">
                    {surface.proofValue}
                  </p>
                  <p className="mt-2 text-sm leading-[1.7] text-zinc-500">{surface.proofDetail}</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {surface.signals.map((signal) => (
                  <div
                    key={signal}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8B930]/55" />
                    <span className="text-sm leading-[1.7] text-zinc-400">{signal}</span>
                  </div>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
