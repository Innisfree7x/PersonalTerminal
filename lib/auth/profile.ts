import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  fullName: string;
  onboardingCompleted: boolean;
  onboardingCompletedAt: string | null;
}

export function isOnboardingComplete(user: Pick<User, 'user_metadata'> | null | undefined): boolean {
  if (!user?.user_metadata) return false;
  return user.user_metadata.onboarding_completed === true;
}

export function getUserFullName(user: Pick<User, 'user_metadata' | 'email'> | null | undefined): string {
  if (!user?.user_metadata) return '';

  const metadata = user.user_metadata;
  const fromMetadata =
    (typeof metadata.full_name === 'string' && metadata.full_name) ||
    (typeof metadata.fullName === 'string' && metadata.fullName) ||
    (typeof metadata.name === 'string' && metadata.name) ||
    '';

  if (fromMetadata) return fromMetadata;
  return user.email?.split('@')[0] || '';
}

export function toUserProfile(user: Pick<User, 'user_metadata' | 'email'>): UserProfile {
  const onboardingCompletedAtRaw = user.user_metadata?.onboarding_completed_at;
  return {
    fullName: getUserFullName(user),
    onboardingCompleted: isOnboardingComplete(user),
    onboardingCompletedAt: typeof onboardingCompletedAtRaw === 'string' ? onboardingCompletedAtRaw : null,
  };
}
