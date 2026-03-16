import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import { isOnboardingComplete } from '@/lib/auth/profile';
import { HeroSection } from '@/components/features/marketing/HeroSection';
import { ProblemStrip } from '@/components/features/marketing/ProblemStrip';
import { ProductShowcase } from '@/components/features/marketing/ProductShowcase';
import { SocialProof } from '@/components/features/marketing/SocialProof';
import { CTASection } from '@/components/features/marketing/CTASection';

export const metadata: Metadata = {
  title: 'INNIS — Erkenne Kollisionen in deinem Karriereplan',
  description:
    'INNIS zeigt dir Kollisionen in deinem Karriereplan, bevor sie passieren: Thesis, GMAT, Praktika und Today Execution in einem System.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'INNIS — Strategie und Daily Execution für Studenten',
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
      <ProblemStrip />
      <ProductShowcase />
      <SocialProof />
      <CTASection />
    </>
  );
}
