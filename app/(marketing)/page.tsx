import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import { isOnboardingComplete } from '@/lib/auth/profile';
import { HeroSection } from '@/components/features/marketing/HeroSection';
import { ProblemStrip } from '@/components/features/marketing/ProblemStrip';
import { FeatureSection } from '@/components/features/marketing/FeatureSection';
import { HowItWorksSection } from '@/components/features/marketing/HowItWorksSection';
import { PricingSection } from '@/components/features/marketing/PricingSection';
import { FAQSection } from '@/components/features/marketing/FAQSection';
import { CTASection } from '@/components/features/marketing/CTASection';
import { FeatureMarquee } from '@/components/features/marketing/FeatureMarquee';

export const metadata: Metadata = {
  title: 'Start',
  description:
    'INNIS zeigt dir Kollisionen in deinem Karriereplan, bevor sie passieren: Thesis, GMAT, Praktika und Today Execution in einem System.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'INNIS — Strategie und Daily Execution fuer Studenten',
    description:
      'Trajectory, Today und Focus in einem System fuer Studenten mit parallelen High-Stakes-Zielen.',
    url: '/',
  },
};

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(isOnboardingComplete(user) ? '/today' : '/onboarding');
  }

  return (
    <>
      <HeroSection />
      <FeatureMarquee />
      <ProblemStrip />
      <FeatureSection />
      <HowItWorksSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
