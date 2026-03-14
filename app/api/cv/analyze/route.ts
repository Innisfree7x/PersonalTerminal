import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { enforceTrustedMutationOrigin } from '@/lib/api/csrf';
import { CvAnalyzeInputSchema } from '@/lib/schemas/cv-analysis.schema';
import { analyzeCvText } from '@/lib/career/cvAnalysis';
import { upsertCareerCvProfile } from '@/lib/supabase/careerCvProfiles';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const input = CvAnalyzeInputSchema.parse({
      cvText: body?.cvText,
      targetTracks: body?.targetTracks,
    });

    const analysis = analyzeCvText(input.cvText, input.targetTracks);
    const { persisted } = await upsertCareerCvProfile(user.id, input.cvText, analysis);

    return NextResponse.json({
      analysis,
      meta: {
        persisted,
      },
    });
  } catch (error) {
    return handleRouteError(error, 'CV konnte nicht analysiert werden.', 'Error analyzing CV');
  }
}
