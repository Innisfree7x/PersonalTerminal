import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { Database } from './types';

function loadFallbackEnvFromFileExplorerEnvLocal(): void {
  // Fallback for when Next.js doesn't load env files because the user created a custom filename.
  // Recommended fix is still to rename the file to `.env.local`.
  try {
    const filePath = path.join(process.cwd(), 'File_Explorer.env.local');
    if (!fs.existsSync(filePath)) return;

    const raw = fs.readFileSync(filePath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Ignore fallback failures; we'll throw a clear error below if still missing.
  }
}

// Try fallback load first (server-only).
loadFallbackEnvFromFileExplorerEnvLocal();

// Use centralized env validation from lib/env.ts
// This ensures type safety and consistent validation across the app
import { clientEnv } from '@/lib/env';

const { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl, NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey } = clientEnv;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
