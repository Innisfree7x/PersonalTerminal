import type { Application, CreateApplicationInput } from '@/lib/schemas/application.schema';

export interface CareerRepository {
  createApplication(userId: string, data: CreateApplicationInput): Promise<Application>;
  updateApplication(userId: string, id: string, data: CreateApplicationInput): Promise<Application>;
  deleteApplication(userId: string, id: string): Promise<void>;
}
