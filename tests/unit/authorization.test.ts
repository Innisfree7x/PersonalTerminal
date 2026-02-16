import { describe, expect, test } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { isAdminUser } from '@/lib/auth/authorization';

function mockUser(overrides: Partial<User>): User {
  return {
    id: 'user-1',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    ...overrides,
  } as User;
}

describe('authorization', () => {
  test('detects admin via role in app_metadata', () => {
    const user = mockUser({ app_metadata: { role: 'admin' } });
    expect(isAdminUser(user)).toBe(true);
  });

  test('detects admin via configured email list', () => {
    process.env.ADMIN_EMAILS = 'owner@example.com,admin@example.com';
    const user = mockUser({ email: 'admin@example.com' });
    expect(isAdminUser(user)).toBe(true);
  });

  test('returns false for non-admin user', () => {
    process.env.ADMIN_EMAILS = 'owner@example.com';
    const user = mockUser({ email: 'member@example.com' });
    expect(isAdminUser(user)).toBe(false);
  });
});
