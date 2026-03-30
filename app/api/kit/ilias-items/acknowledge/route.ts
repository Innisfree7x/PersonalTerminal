import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { enforceTrustedMutationOrigin } from '@/lib/api/csrf';
import { applyRateLimitHeaders, consumeRateLimit, readForwardedIpFromRequest } from '@/lib/api/rateLimit';
import { handleRouteError } from '@/lib/api/server-errors';
import { acknowledgeKitIliasItemsSchema } from '@/lib/schemas/kit-sync.schema';
import { acknowledgeIliasItemsForUser } from '@/lib/kit-sync/service';

export async function POST(request: NextRequest) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = acknowledgeKitIliasItemsSchema.parse(await request.json());
    const rateLimit = consumeRateLimit({
      key: `kit_ilias_ack:${user.id}:${readForwardedIpFromRequest(request)}`,
      limit: 20,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { error: { code: 'RATE_LIMITED', message: 'Bitte warte kurz, bevor du weitere ILIAS-Signale bestätigst.' } },
          { status: 429 }
        ),
        rateLimit
      );
    }

    const result = await acknowledgeIliasItemsForUser(user.id, body.ids);
    return applyRateLimitHeaders(NextResponse.json(result), rateLimit);
  } catch (error) {
    return handleRouteError(error, 'ILIAS-Signale konnten nicht bestätigt werden.', 'Error acknowledging ILIAS items');
  }
}
