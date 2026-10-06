import { getValidAccessToken } from './calendar';

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  isUnread: boolean;
}

interface GmailRawMessageHeader {
  name: string;
  value: string;
}

interface GmailRawMessage {
  id: string;
  threadId: string;
  snippet: string;
  labelIds?: string[];
  payload?: {
    headers?: GmailRawMessageHeader[];
  };
}

/**
 * Fetch recent unread or important messages from Gmail
 */
export async function fetchRecentGmailMessages(
  accessToken: string | undefined,
  refreshToken?: string,
  expiresAt?: string,
  maxResults = 8
): Promise<{ connected: boolean; messages: GmailMessageSummary[]; error?: string }> {
  if (!accessToken && !refreshToken) {
    return { connected: false, messages: [] };
  }

  const validToken = await getValidAccessToken(accessToken, refreshToken, expiresAt);
  if (!validToken) {
    return { connected: false, messages: [], error: 'Token refresh failed' };
  }

  try {
    const listUrl = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
    listUrl.searchParams.set('q', 'label:INBOX');
    listUrl.searchParams.set('maxResults', String(maxResults));

    const listRes = await fetch(listUrl.toString(), {
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!listRes.ok) {
      if (listRes.status === 401) {
        return {
          connected: false,
          messages: [],
          error: 'Google-Sitzung abgelaufen. Bitte neu verbinden.',
        };
      }
      if (listRes.status === 403) {
        const errText = await listRes.text();
        const isApiDisabled =
          errText.toLowerCase().includes('disabled') ||
          errText.toLowerCase().includes('not been used');
        return {
          connected: true,
          messages: [],
          error: isApiDisabled
            ? 'Gmail API im Google Cloud Projekt nicht aktiviert (Kalender ist aktiv).'
            : 'Gmail-Berechtigung nicht erteilt (Kalender ist aktiv).',
        };
      }
      const errText = await listRes.text();
      return { connected: true, messages: [], error: `Gmail error: ${errText}` };
    }

    const listData = await listRes.json();
    const messageRefs: Array<{ id: string; threadId: string }> = listData.messages || [];

    if (messageRefs.length === 0) {
      return { connected: true, messages: [] };
    }

    // Fetch message metadata in parallel
    const detailPromises = messageRefs.slice(0, maxResults).map(async (ref) => {
      try {
        const detailUrl = new URL(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(ref.id)}`
        );
        detailUrl.searchParams.set('format', 'metadata');
        detailUrl.searchParams.append('metadataHeaders', 'Subject');
        detailUrl.searchParams.append('metadataHeaders', 'From');
        detailUrl.searchParams.append('metadataHeaders', 'Date');

        const detailRes = await fetch(detailUrl.toString(), {
          headers: {
            Authorization: `Bearer ${validToken}`,
          },
          signal: AbortSignal.timeout(6000),
        });

        if (!detailRes.ok) return null;
        const msg: GmailRawMessage = await detailRes.json();

        const headers = msg.payload?.headers || [];
        const subject =
          headers.find((h) => h.name.toLowerCase() === 'subject')?.value || '(Kein Betreff)';
        const from =
          headers.find((h) => h.name.toLowerCase() === 'from')?.value || 'Unbekannt';
        const date =
          headers.find((h) => h.name.toLowerCase() === 'date')?.value || new Date().toISOString();

        return {
          id: msg.id,
          threadId: msg.threadId,
          subject,
          from,
          date,
          snippet: msg.snippet || '',
          isUnread: Boolean(msg.labelIds?.includes('UNREAD')),
        };
      } catch {
        return null;
      }
    });

    const results = await Promise.all(detailPromises);
    const validMessages = results.filter((m): m is GmailMessageSummary => m !== null);

    return { connected: true, messages: validMessages };
  } catch (error) {
    console.error('Failed to fetch Gmail messages:', error);
    return {
      connected: true,
      messages: [],
      error: error instanceof Error ? error.message : 'Unknown Gmail error',
    };
  }
}
