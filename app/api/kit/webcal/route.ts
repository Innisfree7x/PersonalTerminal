import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { enforceTrustedMutationOrigin } from '@/lib/api/csrf';
import { applyRateLimitHeaders, consumeRateLimit, readForwardedIpFromRequest } from '@/lib/api/rateLimit';
import { handleRouteError } from '@/lib/api/server-errors';
import { saveKitWebcalSchema } from '@/lib/schemas/kit-sync.schema';
import { saveCampusWebcalForUser } from '@/lib/kit-sync/service';

export async function POST(request: NextRequest) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const rateLimit = consumeRateLimit({
      key: `kit_webcal_save:${user.id}:${readForwardedIpFromRequest(request)}`,
      limit: 6,
      windowMs: 300_000,
    });

    if (!rateLimit.allowed) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { error: { code: 'RATE_LIMITED', message: 'Zu viele WebCal-Änderungen in kurzer Zeit.' } },
          { status: 429 }
        ),
        rateLimit
      );
    }

    const body = saveKitWebcalSchema.parse(await request.json());
    const saved = await saveCampusWebcalForUser(user.id, body.url);
    return applyRateLimitHeaders(NextResponse.json(saved, { status: 200 }), rateLimit);
  } catch (error) {
    return handleRouteError(error, 'CAMPUS WebCal konnte nicht gespeichert werden.', 'Error saving CAMPUS WebCal');
  }
}
