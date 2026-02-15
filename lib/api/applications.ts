import { Application, CreateApplicationInput } from '@/lib/schemas/application.schema';

const API_BASE = '/api/applications';

interface ApiErrorResponse {
  message?: string;
  error?: { message?: string };
}

/**
 * Fetch all applications from the API
 */
export async function fetchApplications(): Promise<Application[]> {
  const response = await fetch(API_BASE);

  if (!response.ok) {
    throw new Error(`Failed to fetch applications: ${response.statusText}`);
  }

  const data = await response.json();
  return data.map((app: any) => ({
    ...app,
    applicationDate: new Date(app.applicationDate),
    interviewDate: app.interviewDate ? new Date(app.interviewDate) : undefined,
    createdAt: new Date(app.createdAt),
    updatedAt: new Date(app.updatedAt),
  }));
}

/**
 * Create a new application via the API
 */
export async function createApplication(
  application: CreateApplicationInput
): Promise<Application> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(application),
  });

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();
    throw new Error(error.message || error.error?.message || `Failed to create application: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    ...data,
    applicationDate: new Date(data.applicationDate),
    interviewDate: data.interviewDate ? new Date(data.interviewDate) : undefined,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

/**
 * Update an existing application via the API
 */
export async function updateApplication(
  applicationId: string,
  application: CreateApplicationInput
): Promise<Application> {
  const response = await fetch(`${API_BASE}/${applicationId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(application),
  });

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();
    throw new Error(error.message || error.error?.message || `Failed to update application: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    ...data,
    applicationDate: new Date(data.applicationDate),
    interviewDate: data.interviewDate ? new Date(data.interviewDate) : undefined,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

/**
 * Delete an application via the API
 */
export async function deleteApplication(applicationId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${applicationId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();
    throw new Error(error.message || error.error?.message || `Failed to delete application: ${response.statusText}`);
  }
}
