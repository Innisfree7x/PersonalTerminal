import { supabase } from './client';
import { Application, CreateApplicationInput } from '@/lib/schemas/application.schema';
import { SupabaseApplication, Database } from './types';

type ApplicationInsert = Database['public']['Tables']['job_applications']['Insert'];
type ApplicationUpdate = Database['public']['Tables']['job_applications']['Update'];

/**
 * Converts Supabase Application Row to our Application type
 */
export function supabaseApplicationToApplication(row: SupabaseApplication): Application {
  return {
    id: row.id,
    company: row.company,
    position: row.position,
    status: row.status,
    applicationDate: new Date(row.application_date),
    interviewDate: row.interview_date ? new Date(row.interview_date) : undefined,
    notes: row.notes || undefined,
    salaryRange: row.salary_range || undefined,
    location: row.location || undefined,
    jobUrl: row.job_url || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Converts our Application type to Supabase Insert format
 */
export function applicationToSupabaseInsert(
  application: CreateApplicationInput
): ApplicationInsert {
  return {
    company: application.company,
    position: application.position,
    status: application.status,
    application_date: application.applicationDate.toISOString().split('T')[0], // YYYY-MM-DD
    interview_date: application.interviewDate
      ? application.interviewDate.toISOString().split('T')[0]
      : null,
    notes: application.notes || null,
    salary_range: application.salaryRange || null,
    location: application.location || null,
    job_url: application.jobUrl || null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fetch all applications from Supabase
 */
export async function fetchApplications(): Promise<Application[]> {
  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .order('application_date', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }

  return data.map(supabaseApplicationToApplication);
}

/**
 * Create a new application in Supabase
 */
export async function createApplication(
  application: CreateApplicationInput
): Promise<Application> {
  const insertData = applicationToSupabaseInsert(application);

  const { data, error } = await supabase
    .from('job_applications')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create application: ${error.message}`);
  }

  return supabaseApplicationToApplication(data);
}

/**
 * Update an existing application in Supabase
 */
export async function updateApplication(
  applicationId: string,
  application: CreateApplicationInput
): Promise<Application> {
  const updateData: ApplicationUpdate = {
    ...applicationToSupabaseInsert(application),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('job_applications')
    .update(updateData)
    .eq('id', applicationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update application: ${error.message}`);
  }

  return supabaseApplicationToApplication(data);
}

/**
 * Delete an application from Supabase
 */
export async function deleteApplication(applicationId: string): Promise<void> {
  const { error } = await supabase.from('job_applications').delete().eq('id', applicationId);

  if (error) {
    throw new Error(`Failed to delete application: ${error.message}`);
  }
}
