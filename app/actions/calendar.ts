'use server';

import { cookies } from 'next/headers';

export async function disconnectGoogleCalendarAction(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete('google_access_token');
  cookieStore.delete('google_refresh_token');
  cookieStore.delete('google_token_expires_at');
}
