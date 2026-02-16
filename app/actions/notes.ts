'use server';

import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server';

const createNoteSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  content: z.string().min(1).max(1000),
});

export async function saveNoteAction(input: { date: string; content: string }): Promise<void> {
  await requireAuth();
  createNoteSchema.parse(input);

  // Placeholder until notes persistence is implemented.
}
