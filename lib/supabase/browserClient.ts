import { createClient } from '@supabase/supabase-js';
import { Database } from './types';
import { clientEnv } from '@/lib/env';

// Use centralized env validation from lib/env.ts
// Validation happens on import, so we're guaranteed these exist
const { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl, NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey } = clientEnv;

// This client is intended for usage in the browser (Client Components).
// It must NOT import node-only modules like `fs`.
export const supabaseBrowser = createClient<Database>(supabaseUrl, supabaseAnonKey);

