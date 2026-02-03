/**
 * Server-side auth utilities for Supabase
 * Used in API routes, server components, and middleware
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/lib/supabase/types';
import { clientEnv } from '@/lib/env';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Cookie setting might fail in middleware
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Cookie removal might fail in middleware
          }
        },
      },
    }
  );
}

/**
 * Get current user (server-side)
 * Returns null if not authenticated
 * 
 * @example
 * // In API route
 * const user = await getCurrentUser();
 * if (!user) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 */
export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

/**
 * Require authenticated user (server-side)
 * Throws error if not authenticated
 * 
 * @example
 * // In API route
 * const user = await requireAuth();
 * // user is guaranteed to be defined
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

/**
 * Get user ID (server-side)
 * Returns null if not authenticated
 */
export async function getUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id || null;
}
