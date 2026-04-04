'use client';

import { ArrowRight } from 'lucide-react';
import { MarketingNavbar } from './MarketingNavbar';
import { TrackedCtaLink } from './TrackedCtaLink';
import { TerminalFrame } from './TerminalFrame';
import { InteractiveDemo } from './InteractiveDemo';
import { HeroProofTeaser } from './HeroProofTeaser';
import { TrajectoryMockup } from './mockups/TrajectoryMockup';
import { TodayMockup } from './mockups/TodayMockup';
import { CareerMockup } from './mockups/CareerMockup';
import { landingThemeStyle } from './landingTheme';

const featureSections = [
  {
    id: 'trajectory',
    kicker: 'Trajectory',
    headline: 'Ziele kollidieren.',
    highlight: 'INNIS klärt.',
    description:
      'Backward Planning berechnet Startfenster, Buffer und Risiko. Wenn Thesis, GMAT und Praktikum aufeinandertreffen, siehst du die Lösung, nicht das Problem.',
    terminal: <TrajectoryMockup />,
    url: 'innis.io/trajectory',
    reverse: false,
  },
  {
    id: 'today',
    kicker: 'Daily Core',
    headline: 'Execution',
    highlight: 'ohne Reibung.',
    description:
      'Today Morning Briefing zieht den Kontext aus deinen Langzeitzielen und liefert den nächsten Move, bevor du in Aufgabenrauschen versinkst.',
    terminal: <TodayMockup />,
    url: 'innis.io/today',
    reverse: true,
  },
  {
    id: 'career',
    kicker: 'Intelligence',
    headline: 'Dein Profil,',
    highlight: 'automatisiert.',
    description:
      'Gap-Analyse und Opportunity Radar zeigen dir nicht nur Passung, sondern den direkten Pfad zum nächsten sinnvollen Karriereschritt.',
    terminal: <CareerMockup />,
    url: 'innis.io/career',
    reverse: false,
  },
] as const;

export function CinematicLandingStacked() {
  return (
    <div className="relative min-h-screen bg-[#020204] text-white" style={landingThemeStyle}>
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px),
            radial-gradient(ellipse 72% 52% at 50% -10%, rgba(232,185,48,0.13) 0%, transparent 70%),
            radial-gradient(ellipse 52% 42% at 10% 80%, rgba(220,56,56,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 42% 36% at 90% 40%, rgba(245,158,11,0.07) 0%, transparent 60%)
          `,
          backgroundSize: '80px 80px, 80px 80px, 100% 100%, 100% 100%, 100% 100%',
        }}
      />

      <div className="relative z-40">
        <MarketingNavbar />
      </div>

      <main className="relative z-10">
        <section className="px-6 pb-16 pt-28 sm:px-10 md:pt-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">System stable</span>
              <span className="h-3 w-px bg-primary/20" />
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary/70">Public Beta v4.4</span>
            </div>

            <h1 className="premium-heading mt-8 text-[clamp(2.6rem,8vw,4.8rem)] font-semibold text-white">
              Sieh den Konflikt,
              <br />
              <span className="bg-gradient-to-r from-[#FAF0E6] via-[#E8B930] to-[#DC3232] bg-clip-text text-transparent">
                bevor er dich trifft.
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-[17px] leading-[1.75] text-zinc-500">
              Thesis, GMAT und Praktikum laufen parallel — und keiner weiß vom anderen.
              INNIS zeigt dir die Kollision, bevor sie passiert.
            </p>

            <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <TrackedCtaLink
                href="/auth/signup"
                eventName="landing_cta_primary_clicked"
                eventPayload={{ source: 'hero_stacked', variant: 'primary' }}
                className="premium-cta-primary bg-primary text-black hover:shadow-[0_0_30px_rgba(232,185,48,0.28)]"
              >
                System starten <ArrowRight className="h-4 w-4" />
              </TrackedCtaLink>
              <TrackedCtaLink
                href="/auth/login"
                eventName="landing_cta_secondary_clicked"
                eventPayload={{ source: 'hero_stacked', variant: 'login' }}
                className="premium-cta-secondary border-white/5 bg-white/[0.02]"
              >
                Login
              </TrackedCtaLink>
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-4xl">
            <HeroProofTeaser source="hero_stacked_proof" />
          </div>

          <div className="mx-auto mt-12 max-w-5xl">
            <TerminalFrame url="innis.io/trajectory">
              <TrajectoryMockup />
            </TerminalFrame>
          </div>
        </section>

        {featureSections.map((section) => (
          <section key={section.id} id={`landing-${section.id}`} className="px-6 py-16 sm:px-10">
            <div className="mx-auto max-w-7xl">
              <div
                className={`grid items-center gap-10 lg:gap-16 ${
                  section.reverse ? 'lg:grid-cols-[1.1fr_0.9fr]' : 'lg:grid-cols-[0.9fr_1.1fr]'
                }`}
              >
                <div className={section.reverse ? 'lg:order-2' : undefined}>
                  <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.35em] text-primary">
                    {section.kicker}
                  </p>
                  <h2 className="premium-heading text-[clamp(1.8rem,5vw,3.2rem)] font-semibold text-white">
                    {section.headline}
                    <br />
                    <span className="bg-gradient-to-r from-[#FAF0E6] via-[#E8B930] to-[#DC3232] bg-clip-text text-transparent">
                      {section.highlight}
                    </span>
                  </h2>
                  <p className="mt-6 max-w-xl text-[16px] leading-[1.8] text-zinc-500">{section.description}</p>
                </div>

                <div className={section.reverse ? 'lg:order-1' : undefined}>
                  <TerminalFrame url={section.url}>{section.terminal}</TerminalFrame>
                </div>
              </div>
            </div>
          </section>
        ))}

        <section id="landing-demo" className="px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-3xl">
            <p className="mb-4 text-center font-mono text-[11px] uppercase tracking-[0.35em] text-primary">
              Live Engine
            </p>
            <h2 className="premium-heading mb-10 text-center text-[clamp(1.9rem,5vw,3rem)] font-semibold text-white">
              Verschieb eine Variable.
              <br />
              <span className="text-zinc-500">Sieh, wie der Plan atmet.</span>
            </h2>
            <InteractiveDemo />
          </div>
        </section>

        <section className="px-6 pb-20 pt-16 text-center sm:px-10">
          <div className="mx-auto max-w-3xl">
            <h2 className="premium-heading text-[clamp(2.2rem,6vw,4.8rem)] font-semibold text-white">
              Wann kollidieren
              <br />
              <span className="bg-gradient-to-r from-[#FAF0E6] via-[#E8B930] to-[#DC3232] bg-clip-text text-transparent">
                deine nächsten Ziele?
              </span>
            </h2>
            <p className="mx-auto mt-8 max-w-lg text-[17px] leading-[1.7] text-zinc-500">
              Trajectory, Today und Career Intelligence vereint. Die Antwort bekommst du in unter 2 Minuten.
            </p>
            <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <TrackedCtaLink
                href="/auth/signup"
                eventName="landing_cta_primary_clicked"
                eventPayload={{ source: 'footer_stacked', variant: 'primary' }}
                className="premium-cta-primary bg-primary text-black hover:shadow-[0_0_40px_rgba(232,185,48,0.34)]"
              >
                System starten <ArrowRight className="h-4 w-4" />
              </TrackedCtaLink>
              <TrackedCtaLink
                href="/auth/login"
                eventName="landing_cta_secondary_clicked"
                eventPayload={{ source: 'footer_stacked', variant: 'login' }}
                className="premium-cta-secondary border-white/5 bg-white/[0.02]"
              >
                Login
              </TrackedCtaLink>
            </div>
            <div className="mt-8 flex items-center justify-center gap-3">
              {[
                { value: '847', label: 'Studenten' },
                { value: 'Ø 23 min', label: 'täglich' },
                { value: 'seit WS 24/25', label: '' },
              ].map((chip) => (
                <div key={chip.value} className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1">
                  <span className="font-mono text-[11px] font-medium text-white/70">{chip.value}</span>
                  {chip.label && <span className="font-mono text-[11px] text-zinc-600">{chip.label}</span>}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
