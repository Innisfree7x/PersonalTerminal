import { createClient } from '@/lib/auth/server';
import type { CvAnalyzeResult } from '@/lib/schemas/cv-analysis.schema';

type StoredCareerCvProfile = {
  id: string;
  user_id: string;
  cv_text: string;
  cv_rank: number;
  rank_tier: 'top' | 'strong' | 'developing' | 'early';
  strengths: string[];
  gaps: string[];
  skills: string[];
  target_tracks: string[];
  updated_at: string;
  created_at: string;
};

function isUndefinedTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === '42P01' || error.message?.toLowerCase().includes('career_cv_profiles') === true;
}

export async function upsertCareerCvProfile(
  userId: string,
  cvText: string,
  analysis: CvAnalyzeResult
): Promise<{ profile: StoredCareerCvProfile | null; persisted: boolean }> {
  const supabase = createClient();

  const payload = {
    user_id: userId,
    cv_text: cvText,
    cv_rank: analysis.cvRank,
    rank_tier: analysis.rankTier,
    strengths: analysis.topStrengths,
    gaps: analysis.topGaps,
    skills: analysis.detectedSkills,
    target_tracks: analysis.targetTracks,
  };

  const { data, error } = await supabase
    .from('career_cv_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) {
    if (isUndefinedTableError(error)) {
      return { profile: null, persisted: false };
    }
    throw new Error(`Failed to persist CV profile: ${error.message}`);
  }

  return { profile: data as StoredCareerCvProfile, persisted: true };
}

export async function fetchCareerCvProfile(userId: string): Promise<StoredCareerCvProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('career_cv_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (isUndefinedTableError(error)) return null;
    throw new Error(`Failed to fetch CV profile: ${error.message}`);
  }

  return (data as StoredCareerCvProfile | null) ?? null;
}
