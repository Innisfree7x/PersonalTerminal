import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { enforceTrustedMutationOrigin } from '@/lib/api/csrf';
import { applyRateLimitHeaders, consumeRateLimit, readForwardedIpFromRequest } from '@/lib/api/rateLimit';
import { handleRouteError } from '@/lib/api/server-errors';
import { deleteKitIliasFavoriteParamsSchema } from '@/lib/schemas/kit-sync.schema';
import { removeIliasFavoriteForUser } from '@/lib/kit-sync/service';

interface Params {
  params: {
    id: string;
  };
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const { id } = deleteKitIliasFavoriteParamsSchema.parse(params);
    const rateLimit = consumeRateLimit({
      key: `kit_ilias_favorite_delete:${user.id}:${readForwardedIpFromRequest(request)}`,
      limit: 20,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { error: { code: 'RATE_LIMITED', message: 'Bitte warte kurz, bevor du weitere ILIAS-Favoriten entfernst.' } },
          { status: 429 }
        ),
        rateLimit
      );
    }

    const result = await removeIliasFavoriteForUser(user.id, id);
    return applyRateLimitHeaders(NextResponse.json(result), rateLimit);
  } catch (error) {
    return handleRouteError(error, 'ILIAS-Favorit konnte nicht entfernt werden.', 'Error deleting ILIAS favorite');
  }
}
