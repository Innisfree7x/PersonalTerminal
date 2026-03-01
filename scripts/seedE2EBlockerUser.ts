import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient, type User } from '@supabase/supabase-js';

function loadEnvFromLocalFiles(): void {
  const candidateFiles = ['.env.local', 'File_Explorer.env.local'];

  for (const file of candidateFiles) {
    const filePath = join(process.cwd(), file);
    if (!existsSync(filePath)) continue;
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const separator = trimmed.indexOf('=');
      if (separator <= 0) continue;
      const key = trimmed.slice(0, separator).trim();
      const rawValue = trimmed.slice(separator + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function normalizeSupabaseUrl(rawUrl: string): string {
  const sanitized = rawUrl.trim().replace(/^['"]|['"]$/g, '');
  let parsed: URL;
  try {
    parsed = new URL(sanitized);
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL format: "${rawUrl}". Expected format: https://<project-ref>.supabase.co`
    );
  }

  if (parsed.protocol !== 'https:') {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL protocol: "${rawUrl}". HTTPS is required.`
    );
  }

  if (/supabase\.com$/i.test(parsed.hostname)) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL points to Supabase dashboard URL: "${rawUrl}". Use project API URL instead.`
    );
  }

  if (!/supabase\.co$/i.test(parsed.hostname)) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL host: "${rawUrl}". Expected a *.supabase.co project URL.`
    );
  }

  return `${parsed.protocol}//${parsed.host}`;
}

function assertLikelySupabaseKey(
  label: string,
  value: string,
  options?: { allowSecret?: boolean }
): void {
  const trimmed = value.trim().replace(/^['"]|['"]$/g, '');
  const isJwt = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(trimmed);
  const isSecret = options?.allowSecret === true && /^sb_secret_[A-Za-z0-9_-]+$/.test(trimmed);

  if (!isJwt && !isSecret) {
    throw new Error(
      `${label} does not look like a valid Supabase key. Verify you copied the full key value.`
    );
  }
}

async function findUserByEmail(
  client: any,
  email: string
): Promise<User | null> {
  const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  const normalized = email.toLowerCase();
  const user = data.users.find((entry: User) => (entry.email || '').toLowerCase() === normalized);
  return user ?? null;
}

async function resetBlockerData(client: any, userId: string): Promise<void> {
  const cleanupSteps: Array<() => Promise<void>> = [
    async () => {
      const { error } = await client
        .from('daily_tasks')
        .delete()
        .eq('user_id', userId)
        .ilike('title', 'E2E %');
      if (error) throw new Error(`daily_tasks cleanup failed: ${error.message}`);
    },
    async () => {
      const { error } = await client
        .from('exercise_progress')
        .delete()
        .eq('user_id', userId);
      if (error) throw new Error(`exercise_progress cleanup failed: ${error.message}`);
    },
    async () => {
      const { error } = await client
        .from('courses')
        .delete()
        .eq('user_id', userId)
        .ilike('name', 'E2E %');
      if (error) throw new Error(`courses cleanup failed: ${error.message}`);
    },
    async () => {
      const { error } = await client
        .from('goals')
        .delete()
        .eq('user_id', userId)
        .ilike('title', 'E2E %');
      if (error) throw new Error(`goals cleanup failed: ${error.message}`);
    },
    async () => {
      const { error } = await client
        .from('job_applications')
        .delete()
        .eq('user_id', userId)
        .ilike('company', 'E2E %');
      if (error) throw new Error(`job_applications cleanup failed: ${error.message}`);
    },
  ];

  for (const step of cleanupSteps) {
    await step();
  }
}

async function main(): Promise<void> {
  loadEnvFromLocalFiles();

  const supabaseUrl = normalizeSupabaseUrl(requireEnv('NEXT_PUBLIC_SUPABASE_URL'));
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY').replace(/^['"]|['"]$/g, '');
  const blockerEmail = requireEnv('E2E_BLOCKER_EMAIL');
  const blockerPassword = requireEnv('E2E_BLOCKER_PASSWORD');

  assertLikelySupabaseKey('SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey, { allowSecret: true });

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const existing = await findUserByEmail(admin, blockerEmail);
  let userId = existing?.id || null;

  if (!existing) {
    const { data, error } = await admin.auth.admin.createUser({
      email: blockerEmail,
      password: blockerPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'E2E Blocker User',
        onboarding_completed: true,
      },
      app_metadata: {
        role: 'user',
      },
    });
    if (error || !data.user) {
      throw new Error(`Failed to create blocker user: ${error?.message || 'Unknown error'}`);
    }
    userId = data.user.id;
    console.log(`Created blocker user ${blockerEmail}`);
  } else {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: blockerPassword,
      email_confirm: true,
      user_metadata: {
        ...(existing.user_metadata || {}),
        onboarding_completed: true,
      },
    });
    if (error) {
      throw new Error(`Failed to update blocker user: ${error.message}`);
    }
    console.log(`Updated blocker user ${blockerEmail}`);
  }

  if (!userId) {
    throw new Error('Blocker user id is missing after create/update');
  }

  await resetBlockerData(admin, userId);

  console.log(`Reset blocker datasets for user ${userId}`);
  console.log('Done. Blocker E2E user is ready.');
}

main().catch((error: unknown) => {
  console.error('seedE2EBlockerUser failed:', error);
  process.exitCode = 1;
});
