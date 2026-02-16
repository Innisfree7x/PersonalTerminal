import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import { isOnboardingComplete } from '@/lib/auth/profile';

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }
  redirect(isOnboardingComplete(user) ? '/today' : '/onboarding');
}
