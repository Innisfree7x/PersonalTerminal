import type { Application, CreateApplicationInput } from '@/lib/schemas/application.schema';
import type {
  OpportunitySearchContext,
  OpportunitySearchInput,
  OpportunitySearchItem,
} from '@/lib/schemas/opportunity-radar.schema';
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

export async function searchCareerOpportunities(
  repository: CareerRepository,
  input: OpportunitySearchInput,
  context?: OpportunitySearchContext
): Promise<{
  items: OpportunitySearchItem[];
  sourcesQueried: number;
  liveSourceConfigured: boolean;
  liveSourceHealthy: boolean;
  liveSourceContributed: boolean;
  queryRelaxedUsed: boolean;
  bandRelaxedUsed: boolean;
  llmEnrichedCount: number;
}> {
  return repository.searchOpportunities(input, context);
}
