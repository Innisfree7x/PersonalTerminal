import type { CareerRepository } from '@/lib/application/ports/career-repository';
import {
  createApplication,
  updateApplication,
  deleteApplication,
} from '@/lib/supabase/applications';
import { searchRadarOpportunities } from '@/lib/career/opportunityRadar';

export const careerRepository: CareerRepository = {
  createApplication,
  updateApplication,
  deleteApplication,
  searchOpportunities: (input, context) => searchRadarOpportunities(input, context),
};
