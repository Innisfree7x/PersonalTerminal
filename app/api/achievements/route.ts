import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { createClient } from '@/lib/auth/server';
import { ACHIEVEMENT_KEYS } from '@/lib/achievements/registry';

export async function GET() {
  const auth = await requireApiAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_achievements')
    .select('achievement_key, unlocked_at')
    .eq('user_id', auth.user.id)
    .order('unlocked_at', { ascending: true });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    achievements: (data ?? []).map((row) => ({
      key: row.achievement_key,
      unlocked_at: row.unlocked_at,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth.errorResponse) return auth.errorResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const key = typeof body === 'object' && body !== null && 'key' in body
    ? (body as { key: unknown }).key
    : undefined;

  if (typeof key !== 'string' || !ACHIEVEMENT_KEYS.has(key)) {
    return NextResponse.json({ message: 'Invalid achievement key' }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_achievements')
    .upsert(
      { user_id: auth.user.id, achievement_key: key },
      { onConflict: 'user_id,achievement_key' }
    )
    .select('achievement_key, unlocked_at')
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    achievement: { key: data.achievement_key, unlocked_at: data.unlocked_at },
  });
}
