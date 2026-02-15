'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth/server';
import {
    createApplication as dbCreate,
    updateApplication as dbUpdate,
    deleteApplication as dbDelete
} from '@/lib/supabase/applications';
import { CreateApplicationInput } from '@/lib/schemas/application.schema';

/**
 * Server Action to create a new job application
 */
export async function createApplicationAction(data: CreateApplicationInput) {
    const user = await requireAuth();
    const result = await dbCreate(user.id, data);
    revalidatePath('/career');
    return result;
}

/**
 * Server Action to update an existing job application
 */
export async function updateApplicationAction(id: string, data: CreateApplicationInput) {
    const user = await requireAuth();
    const result = await dbUpdate(user.id, id, data);
    revalidatePath('/career');
    return result;
}

/**
 * Server Action to delete a job application
 */
export async function deleteApplicationAction(id: string) {
    const user = await requireAuth();
    await dbDelete(user.id, id);
    revalidatePath('/career');
}
