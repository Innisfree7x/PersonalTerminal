'use server';

import { requireAuth, createClient } from '@/lib/auth/server';
import { toUserProfile, type UserProfile } from '@/lib/auth/profile';

export interface DemoDataIds {
  courseIds: string[];
  goalIds: string[];
  taskIds: string[];
}

function sanitizeDemoDataIds(raw: unknown): DemoDataIds | null {
  if (!raw || typeof raw !== 'object') return null;

  const source = raw as {
    courseIds?: unknown;
    goalIds?: unknown;
    taskIds?: unknown;
  };

  const toStringArray = (value: unknown) =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

  const next = {
    courseIds: toStringArray(source.courseIds),
    goalIds: toStringArray(source.goalIds),
    taskIds: toStringArray(source.taskIds),
  };

  if (next.courseIds.length === 0 && next.goalIds.length === 0 && next.taskIds.length === 0) {
    return null;
  }

  return next;
}

export async function fetchProfileAction(): Promise<UserProfile> {
  const user = await requireAuth();
  return toUserProfile(user);
}

export async function fetchDemoDataIdsAction(): Promise<DemoDataIds | null> {
  const user = await requireAuth();
  return sanitizeDemoDataIds(user.user_metadata?.demo_data_ids);
}

export async function updateProfileAction(input: {
  fullName?: string;
  onboardingCompleted?: boolean;
  demoDataIds?: DemoDataIds | null;
  emailNotifications?: boolean;
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
    ...(input.demoDataIds !== undefined
      ? {
          demo_data_ids: input.demoDataIds,
        }
      : {}),
    ...(input.emailNotifications !== undefined
      ? { email_notifications: input.emailNotifications }
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
