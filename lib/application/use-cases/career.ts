import type { Application, CreateApplicationInput } from '@/lib/schemas/application.schema';
import type { CareerRepository } from '@/lib/application/ports/career-repository';

export async function createCareerApplication(
  repository: CareerRepository,
  userId: string,
  data: CreateApplicationInput
): Promise<Application> {
  return repository.createApplication(userId, data);
}

export async function updateCareerApplication(
  repository: CareerRepository,
  userId: string,
  id: string,
  data: CreateApplicationInput
): Promise<Application> {
  return repository.updateApplication(userId, id, data);
}

export async function deleteCareerApplication(
  repository: CareerRepository,
  userId: string,
  id: string
): Promise<void> {
  return repository.deleteApplication(userId, id);
}
