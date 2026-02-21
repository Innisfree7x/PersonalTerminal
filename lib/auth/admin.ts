import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { clientEnv, serverEnv } from '@/lib/env';
import type { Database } from '@/lib/supabase/types';

let cachedAdminClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createAdminClient() {
  const serviceRoleKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  if (cachedAdminClient) {
    return cachedAdminClient;
  }

  cachedAdminClient = createSupabaseClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return cachedAdminClient;
}
