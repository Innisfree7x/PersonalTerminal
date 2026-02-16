'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth/server';
import { createFocusSession } from '@/lib/supabase/focusSessions';
import { createFocusSessionSchema } from '@/lib/schemas/focusSession.schema';

export interface CreateFocusSessionActionPayload {
  sessionType: 'focus' | 'break';
  durationSeconds: number;
  plannedDurationSeconds: number;
  startedAt: string | Date;
  endedAt: string | Date;
  completed: boolean;
  label?: string | null;
  category?: 'study' | 'work' | 'exercise' | 'reading' | 'other' | null;
}

export async function createFocusSessionAction(payload: CreateFocusSessionActionPayload): Promise<void> {
  const user = await requireAuth();
  const validated = createFocusSessionSchema.parse(payload);
  await createFocusSession(user.id, validated);
  revalidatePath('/today');
  revalidatePath('/analytics');
}
