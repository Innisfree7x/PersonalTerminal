import type { User } from '@supabase/supabase-js';

function parseAdminEmails(raw: string | undefined): Set<string> {
  if (!raw) return new Set<string>();
  return new Set(
    raw
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );
}

function resolveRole(user: User | null): string | null {
  if (!user) return null;
  const appRole = user.app_metadata?.role;
  if (typeof appRole === 'string' && appRole.length > 0) return appRole;
  const userRole = user.user_metadata?.role;
  if (typeof userRole === 'string' && userRole.length > 0) return userRole;
  return null;
}

export function isAdminUser(user: User | null): boolean {
  if (!user) return false;

  const role = resolveRole(user);
  if (role?.toLowerCase() === 'admin') return true;

  const email = user.email?.toLowerCase();
  if (!email) return false;

  const serverConfiguredAdmins = parseAdminEmails(process.env.ADMIN_EMAILS);
  if (serverConfiguredAdmins.has(email)) return true;

  const clientConfiguredAdmins = parseAdminEmails(process.env.NEXT_PUBLIC_ADMIN_EMAILS);
  if (clientConfiguredAdmins.has(email)) return true;

  return false;
}
