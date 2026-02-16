'use server';

import { requireAuth, createClient } from '@/lib/auth/server';
import { toUserProfile, type UserProfile } from '@/lib/auth/profile';

export async function fetchProfileAction(): Promise<UserProfile> {
  const user = await requireAuth();
  return toUserProfile(user);
}

export async function updateProfileAction(input: {
  fullName?: string;
  onboardingCompleted?: boolean;
}): Promise<UserProfile> {
  const user = await requireAuth();
  const supabase = createClient();

  const nextMetadata = {
    ...user.user_metadata,
    ...(input.fullName !== undefined ? { full_name: input.fullName } : {}),
    ...(input.onboardingCompleted !== undefined
      ? {
          onboarding_completed: input.onboardingCompleted,
          onboarding_completed_at: input.onboardingCompleted ? new Date().toISOString() : null,
        }
      : {}),
  };

  const { data, error } = await supabase.auth.updateUser({
    data: nextMetadata,
  });

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  if (!data.user) {
    throw new Error('Failed to update profile: user not returned');
  }

  return toUserProfile(data.user);
}
