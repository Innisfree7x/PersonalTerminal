'use client';

import { motion } from 'framer-motion';
import { Layers, ArrowLeft } from 'lucide-react';

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
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4">
      <div className="w-full max-w-lg">
        {/* Header row: back button + logo */}
        <div className="flex items-center justify-between mb-8">
          <div className="w-8">
            {canGoBack && (
              <motion.button
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                onClick={onBack}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-all"
                aria-label="Zurück"
              >
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-base font-semibold text-text-primary">Prism</span>
          </div>

          <div className="w-8">
            <span className="text-xs text-text-tertiary tabular-nums">
              {currentStep}/{totalSteps}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-3">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <motion.div
                key={i}
                className={`h-1 rounded-full ${i < currentStep ? 'bg-primary' : 'bg-border'}`}
                animate={{ width: i < currentStep ? 32 : 16 }}
                transition={{ duration: 0.35 }}
              />
            ))}
          </div>
          <div className="h-px bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-surface/85 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
