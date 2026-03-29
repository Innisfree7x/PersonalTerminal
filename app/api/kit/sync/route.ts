import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { enforceTrustedMutationOrigin } from '@/lib/api/csrf';
import { applyRateLimitHeaders, consumeRateLimit, readForwardedIpFromRequest } from '@/lib/api/rateLimit';
import { handleRouteError } from '@/lib/api/server-errors';
import { triggerKitSyncSchema } from '@/lib/schemas/kit-sync.schema';
import { syncCampusConnectorSnapshotForUser, syncCampusWebcalForUser } from '@/lib/kit-sync/service';

const MAX_CONNECTOR_PAYLOAD_BYTES = 500 * 1024;

export async function POST(request: NextRequest) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_CONNECTOR_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: { code: 'PAYLOAD_TOO_LARGE', message: 'KIT Connector Payload ist zu groß. Maximal 500 KB sind erlaubt.' } },
        { status: 413 }
      );
    }

    const body = triggerKitSyncSchema.parse(rawBody ? JSON.parse(rawBody) : {});
    const rateLimit = consumeRateLimit({
      key: `kit_sync:${body.source}:${user.id}:${readForwardedIpFromRequest(request)}`,
      limit: 1,
      windowMs: 300_000,
    });

    if (!rateLimit.allowed) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { error: { code: 'RATE_LIMITED', message: 'Bitte warte kurz, bevor du den KIT-Sync erneut startest.' } },
          { status: 429 }
        ),
        rateLimit
      );
    }

    const result =
      body.source === 'campus_connector'
        ? await syncCampusConnectorSnapshotForUser(user.id, {
            connectorVersion: body.connectorVersion,
            payload: body.payload,
          })
        : await syncCampusWebcalForUser(user.id, 'manual');

    return applyRateLimitHeaders(NextResponse.json(result), rateLimit);
  } catch (error) {
    return handleRouteError(error, 'KIT Sync konnte nicht gestartet werden.', 'Error triggering KIT sync');
  }
}
