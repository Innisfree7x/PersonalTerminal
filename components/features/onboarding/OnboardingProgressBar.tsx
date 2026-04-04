'use client';

import { motion } from 'framer-motion';

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgressBar({ currentStep, totalSteps }: OnboardingProgressBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-[#8F8577]">
        <span>Setup</span>
        <span className="tabular-nums text-[#C6B598]">{currentStep}/{totalSteps}</span>
      </div>
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <motion.div
              key={stepNumber}
              layout
              className="relative h-2 flex-1 overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.04]"
            >
              <motion.div
                className={isActive ? 'h-full rounded-full bg-gradient-to-r from-[#E8B930] to-[#F5D565]' : 'h-full rounded-full bg-[#E8B930]/70'}
                initial={false}
                animate={{
                  width: isComplete || isActive ? '100%' : '0%',
                  opacity: isComplete || isActive ? 1 : 0,
                  y: 0,
                }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
