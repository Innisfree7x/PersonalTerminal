import type { CareerRepository } from '@/lib/application/ports/career-repository';
import {
  createApplication,
  updateApplication,
  deleteApplication,
} from '@/lib/supabase/applications';

export const careerRepository: CareerRepository = {
  createApplication,
  updateApplication,
  deleteApplication,
};
