'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { BrandMark } from '@/components/shared/BrandLogo';

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
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#0A0A0C] p-4 overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute left-1/2 top-[30%] h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8B930]/[0.06] blur-[150px]" />
      <div className="pointer-events-none absolute left-[20%] top-[20%] h-[300px] w-[300px] rounded-full bg-[#DC3232]/[0.05] blur-[120px]" />
      <div className="pointer-events-none absolute right-[15%] bottom-[20%] h-[250px] w-[300px] rounded-full bg-[#FF7832]/[0.04] blur-[100px]" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <div className="w-8">
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

          <div className="w-8 text-right">
            <span className="text-xs text-zinc-600 tabular-nums">
              {currentStep}/{totalSteps}
            </span>
          </div>
        </div>

        {/* Step indicators */}
        <div className="mb-8 flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.div
              key={i}
              className="h-0.5 flex-1 rounded-full overflow-hidden bg-white/[0.06]"
            >
              <motion.div
                className="h-full rounded-full bg-[#E8B930]"
                initial={{ width: '0%' }}
                animate={{ width: i < currentStep ? '100%' : '0%' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </motion.div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-8 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
