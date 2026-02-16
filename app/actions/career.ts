'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth/server';
import {
  createApplicationSchema,
  type CreateApplicationInput,
} from '@/lib/schemas/application.schema';
import { careerRepository } from '@/lib/infrastructure/supabase/repositories/careerRepository';
import {
  createCareerApplication,
  updateCareerApplication,
  deleteCareerApplication,
} from '@/lib/application/use-cases/career';

/**
 * Server Action to create a new job application
 */
export async function createApplicationAction(data: CreateApplicationInput) {
  const user = await requireAuth();
  const validated = createApplicationSchema.parse(data);
  const result = await createCareerApplication(careerRepository, user.id, validated);
  revalidatePath('/career');
  return result;
}

/**
 * Server Action to update an existing job application
 */
export async function updateApplicationAction(id: string, data: CreateApplicationInput) {
  const user = await requireAuth();
  const validated = createApplicationSchema.parse(data);
  const result = await updateCareerApplication(careerRepository, user.id, id, validated);
  revalidatePath('/career');
  return result;
}

/**
 * Server Action to delete a job application
 */
export async function deleteApplicationAction(id: string) {
  const user = await requireAuth();
  await deleteCareerApplication(careerRepository, user.id, id);
  revalidatePath('/career');
}
