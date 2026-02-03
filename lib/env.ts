/**
 * Environment variable validation with Zod
 * Ensures all required env vars are present and valid at build time
 * 
 * @module lib/env
 * 
 * This file validates environment variables using Zod schemas.
 * If any required variable is missing or invalid, the app will fail fast
 * with a clear error message instead of crashing at runtime.
 */

import { z } from 'zod';

/**
 * Server-side environment variables schema
 * These are only available on the server (API routes, server components)
 */
const serverSchema = z.object({
  // Google OAuth credentials
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  GOOGLE_REDIRECT_URI: z.string().url('GOOGLE_REDIRECT_URI must be a valid URL'),
  
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
if (typeof window === 'undefined') {
  // Server-side validation
  console.log('✅ Server environment variables validated');
}

// Client-side validation happens automatically when imported
console.log('✅ Client environment variables validated');
