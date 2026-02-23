'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth/server';
import { createFocusSession } from '@/lib/supabase/focusSessions';
import { createFocusSessionSchema } from '@/lib/schemas/focusSession.schema';
import { ZodError } from 'zod';

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
  let user;
  try {
    user = await requireAuth();
  } catch {
    throw new Error('Nicht eingeloggt — bitte Seite neu laden.');
  }

  let validated;
  try {
    validated = createFocusSessionSchema.parse(payload);
  } catch (err) {
    if (err instanceof ZodError) {
      const fields = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Validierungsfehler: ${fields}`);
    }
    throw err;
  }

  await createFocusSession(user.id, validated);
  revalidatePath('/today');
  revalidatePath('/analytics');
}
