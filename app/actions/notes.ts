'use server';

import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server';

const createNoteSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  content: z.string().min(1).max(1000),
});

/**
 * Save a note for a given date.
 *
 * @todo Implement notes persistence (database table + repository).
 * Currently validates input and authenticates the user but does NOT persist.
 */
export async function saveNoteAction(input: { date: string; content: string }): Promise<void> {
  await requireAuth();
  createNoteSchema.parse(input);

  if (process.env.NODE_ENV === 'development') {
    console.warn('[saveNoteAction] Notes persistence is not yet implemented — call was validated but not saved.');
  }
}
