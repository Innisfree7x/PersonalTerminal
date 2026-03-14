import type { Application, CreateApplicationInput } from '@/lib/schemas/application.schema';
import type { OpportunitySearchInput, OpportunitySearchItem } from '@/lib/schemas/opportunity-radar.schema';

export interface CareerRepository {
  createApplication(userId: string, data: CreateApplicationInput): Promise<Application>;
  updateApplication(userId: string, id: string, data: CreateApplicationInput): Promise<Application>;
  deleteApplication(userId: string, id: string): Promise<void>;
  searchOpportunities(input: OpportunitySearchInput): Promise<{
    items: OpportunitySearchItem[];
    sourcesQueried: number;
    liveSourceConfigured: boolean;
    liveSourceHealthy: boolean;
    liveSourceContributed: boolean;
  }>;
}
