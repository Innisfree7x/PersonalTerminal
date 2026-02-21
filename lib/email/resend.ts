import { serverEnv } from '@/lib/env';

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface SendEmailResult {
  sent: boolean;
  id?: string;
  skippedReason?: string;
}

const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = serverEnv.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, skippedReason: 'missing_resend_api_key' };
  }

  const from = serverEnv.RESEND_FROM_EMAIL || 'INNIS <onboarding@resend.dev>';
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend request failed: ${response.status} ${detail}`);
  }

  const payload = (await response.json()) as { id?: string };
  if (payload.id) {
    return { sent: true, id: payload.id };
  }
  return { sent: true };
}
