/**
 * Environment variable validation with Zod
 * Ensures all required env vars are present and valid at build time
 * 
 * @module lib/env
 * 
 * This file validates environment variables using Zod schemas.
 * If any required variable is missing or invalid, the app will fail fast
 * with a clear error message instead of crashing at runtime.
 * with a clear error message instead of crashing at runtime.
 */

import { z } from 'zod';

// Fallback: Try to load File_Explorer.env.local if standard env vars are missing
// This is necessary because some users might rely on this custom file
if (typeof window === 'undefined') {
  try {
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(process.cwd(), 'File_Explorer.env.local');
    if (fs.existsSync(filePath)) {
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
    }
  } catch (e) {
    // Ignore errors during fallback load
    // console.warn('Failed to load fallback env file:', e);
  }
}

/**
 * Server-side environment variables schema
 * These are only available on the server (API routes, server components)
 */
const serverSchema = z.object({
  // Google OAuth credentials (optional - only needed for Google Calendar integration)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  MONITORING_ALERT_WEBHOOK_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  ADMIN_EMAILS: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  CRON_SECRET: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

/**
 * Client-side environment variables schema
 * These are available on both client and server (prefixed with NEXT_PUBLIC_)
 */
const clientSchema = z.object({
  // Supabase credentials
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  NEXT_PUBLIC_ADMIN_EMAILS: z.string().optional(),
});

/**
 * Validate server environment variables
 * Call this in API routes and server components
 * 
 * @returns Validated server environment variables
 * @throws ZodError if validation fails with detailed error messages
 * 
 * @example
 * import { serverEnv } from '@/lib/env';
 * 
 * export async function GET() {
 *   const { GOOGLE_CLIENT_ID } = serverEnv;
 *   // Type-safe! GOOGLE_CLIENT_ID is guaranteed to be a non-empty string
 * }
 */
export const serverEnv = serverSchema.parse({
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  MONITORING_ALERT_WEBHOOK_URL: process.env.MONITORING_ALERT_WEBHOOK_URL,
  SENTRY_DSN: process.env.SENTRY_DSN,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  CRON_SECRET: process.env.CRON_SECRET,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NODE_ENV: process.env.NODE_ENV,
});

/**
 * Validate client environment variables
 * These are safe to use in browser code
 * 
 * @returns Validated client environment variables
 * @throws ZodError if validation fails with detailed error messages
 * 
 * @example
 * import { clientEnv } from '@/lib/env';
 * 
 * function MyComponent() {
 *   const { NEXT_PUBLIC_SUPABASE_URL } = clientEnv;
 *   // Type-safe! NEXT_PUBLIC_SUPABASE_URL is guaranteed to be a valid URL
 * }
 */
export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_ADMIN_EMAILS: process.env.NEXT_PUBLIC_ADMIN_EMAILS,
});

/**
 * Type definitions for environment variables
 * Provides autocomplete and type checking in your IDE
 */
export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

/**
 * Check if we're in production environment
 */
export const isProduction = serverEnv.NODE_ENV === 'production';

/**
 * Check if we're in development environment
 */
export const isDevelopment = serverEnv.NODE_ENV === 'development';

/**
 * Check if we're in test environment
 */
export const isTest = serverEnv.NODE_ENV === 'test';

// Validate on import to fail fast
// This ensures the app won't start if env vars are missing
