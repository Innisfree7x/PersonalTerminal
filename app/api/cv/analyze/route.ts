import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { enforceTrustedMutationOrigin } from '@/lib/api/csrf';
import { CvAnalyzeInputSchema } from '@/lib/schemas/cv-analysis.schema';
import { analyzeCvText } from '@/lib/career/cvAnalysis';
import { upsertCareerCvProfile } from '@/lib/supabase/careerCvProfiles';
import { applyRateLimitHeaders, consumeRateLimit, readForwardedIpFromRequest } from '@/lib/api/rateLimit';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const rateLimit = consumeRateLimit({
      key: `cv_analyze:${user.id}:${readForwardedIpFromRequest(request)}`,
      limit: 10,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return applyRateLimitHeaders(
        NextResponse.json(
          {
            error: {
              code: 'RATE_LIMITED',
              message: 'Zu viele CV-Analysen in kurzer Zeit. Bitte warte kurz.',
            },
          },
          { status: 429 }
        ),
        rateLimit
      );
    }

    const body = await request.json();
    const input = CvAnalyzeInputSchema.parse({
      cvText: body?.cvText,
      targetTracks: body?.targetTracks,
    });

    const analysis = analyzeCvText(input.cvText, input.targetTracks);
    const { persisted } = await upsertCareerCvProfile(user.id, input.cvText, analysis);

    return applyRateLimitHeaders(
      NextResponse.json({
        analysis,
        meta: {
          persisted,
        },
      }),
      rateLimit
    );
  } catch (error) {
    return handleRouteError(error, 'CV konnte nicht analysiert werden.', 'Error analyzing CV');
  }
}
