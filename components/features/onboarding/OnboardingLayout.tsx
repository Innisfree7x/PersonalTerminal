'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { BrandMark } from '@/components/shared/BrandLogo';
import { OnboardingProgressBar } from '@/components/features/onboarding/OnboardingProgressBar';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  canGoBack?: boolean;
  onBack?: () => void;
}

export function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  canGoBack = false,
  onBack,
}: OnboardingLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08080c] px-4 py-6 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(232,185,48,0.12),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(220,50,50,0.08),_transparent_32%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E8B930]/30 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
          <div className="hidden flex-col justify-between rounded-[36px] border border-white/[0.06] bg-[#0C0B10] p-8 lg:flex">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <BrandMark sizeClassName="h-10 w-10" className="shadow-none" />
                <div>
                  <p className="text-sm font-semibold text-[#FAF0E6]">INNIS</p>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#8F8577]">Trajectory-first setup</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#8F8577]">Warum dieses Setup?</p>
                <h2 className="text-4xl font-semibold leading-tight tracking-tight text-[#FAF0E6]">
                  Du sollst in unter drei Minuten sehen, ob dein Plan realistisch ist.
                </h2>
                <p className="max-w-md text-sm leading-7 text-[#C5B9A8]">
                  Erst das Ziel. Dann deine reale Kapazität. Danach rechnet INNIS rückwärts und zeigt dir sofort,
                  wann dein Prep-Block starten muss.
                </p>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-[#C5B9A8]">
              <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#8F8577]">1 · Ziel</p>
                <p className="mt-2">Leit-Meilenstein mit Deadline, Aufwand und Puffer festlegen.</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#8F8577]">2 · Realität</p>
                <p className="mt-2">Semesterstand, Fokusstunden und Studienlast sauber erfassen.</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#8F8577]">3 · Status</p>
                <p className="mt-2">On track, tight oder at risk, inklusive empfohlenem Prep-Start.</p>
              </div>
            </div>
          </div>

          <div className="w-full rounded-[32px] border border-white/[0.08] bg-[#111015]/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
            <div className="mb-8 flex items-center justify-between">
              <div className="w-10">
            {canGoBack && (
              <motion.button
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                onClick={onBack}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-[#FAF0E6] hover:bg-white/[0.05] transition-all"
                aria-label="Zurück"
              >
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
            )}
              </div>

              <div className="flex items-center gap-2.5">
                <BrandMark sizeClassName="h-7 w-7" className="shadow-none" />
                <span className="text-base font-semibold text-[#FAF0E6]">INNIS</span>
              </div>

              <div className="text-right">
                <span className="text-xs tabular-nums text-[#8F8577]">{currentStep}/{totalSteps}</span>
              </div>
            </div>

            <div className="mb-8">
              <OnboardingProgressBar currentStep={currentStep} totalSteps={totalSteps} />
            </div>

            <div>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
