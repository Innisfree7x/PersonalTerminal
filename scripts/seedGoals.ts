import { mockGoals } from '@/lib/data/mockGoals';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type GoalInsert = Database['public']['Tables']['goals']['Insert'];

function goalToInsertRow(goal: (typeof mockGoals)[number]): GoalInsert {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description ?? null,
    target_date: goal.targetDate.toISOString().split('T')[0]!,
    category: goal.category,
    metrics_current: goal.metrics?.current ?? null,
    metrics_target: goal.metrics?.target ?? null,
    metrics_unit: goal.metrics?.unit ?? null,
    created_at: goal.createdAt.toISOString(),
    updated_at: null,
  };
}

async function main(): Promise<void> {
  let ok = 0;
  let failed = 0;

  for (const goal of mockGoals) {
    const row = goalToInsertRow(goal);

    // Upsert each goal; ignore duplicates so reruns are safe.
    const { error } = await supabase
      .from('goals')
      .upsert(row, { onConflict: 'id', ignoreDuplicates: true });

    if (error) {
      failed += 1;
      console.error(`❌ Failed: ${goal.title} (${goal.id})`, error);
      continue;
    }

    ok += 1;
    console.log(`✅ Seeded (or already existed): ${goal.title}`);
  }

  console.log(`\nDone. Total: ${mockGoals.length}, OK: ${ok}, Failed: ${failed}`);
}

main().catch((err: unknown) => {
  console.error('Seed script crashed:', err);
  process.exitCode = 1;
});