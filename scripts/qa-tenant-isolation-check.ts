import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type CheckResult = { name: string; ok: boolean; detail?: string };

const requiredEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'TENANT_A_EMAIL',
  'TENANT_A_PASSWORD',
  'TENANT_B_EMAIL',
  'TENANT_B_PASSWORD',
] as const;

function readEnv(name: (typeof requiredEnv)[number]): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

async function login(client: SupabaseClient, email: string, password: string) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    throw new Error(`Login failed for ${email}: ${error?.message ?? 'unknown error'}`);
  }
  return data.user.id;
}

async function assertNoAccessToTask(client: SupabaseClient, foreignTaskId: string): Promise<CheckResult> {
  const { data, error } = await client
    .from('daily_tasks')
    .select('id,title')
    .eq('id', foreignTaskId)
    .maybeSingle();

  if (error) {
    return { name: 'A cannot read B daily_task (error path)', ok: true, detail: error.message };
  }
  return {
    name: 'A cannot read B daily_task',
    ok: data === null,
    detail: data ? `Unexpected task id visible: ${data.id}` : 'no row returned',
  };
}

async function assertNoAccessToGoal(client: SupabaseClient, foreignGoalId: string): Promise<CheckResult> {
  const { data, error } = await client
    .from('trajectory_goals')
    .select('id,title')
    .eq('id', foreignGoalId)
    .maybeSingle();

  if (error) {
    return { name: 'A cannot read B trajectory_goal (error path)', ok: true, detail: error.message };
  }
  return {
    name: 'A cannot read B trajectory_goal',
    ok: data === null,
    detail: data ? `Unexpected goal id visible: ${data.id}` : 'no row returned',
  };
}

async function main() {
  for (const key of requiredEnv) {
    readEnv(key);
  }

  const url = readEnv('NEXT_PUBLIC_SUPABASE_URL');
  const anon = readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const aEmail = readEnv('TENANT_A_EMAIL');
  const aPassword = readEnv('TENANT_A_PASSWORD');
  const bEmail = readEnv('TENANT_B_EMAIL');
  const bPassword = readEnv('TENANT_B_PASSWORD');

  const clientA = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const clientB = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const aUserId = await login(clientA, aEmail, aPassword);
  const bUserId = await login(clientB, bEmail, bPassword);

  if (aUserId === bUserId) {
    throw new Error('TENANT_A and TENANT_B resolved to same user id');
  }

  const marker = `qa-tenant-${Date.now()}`;
  const today = new Date().toISOString().slice(0, 10);
  const dueDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Seed isolated rows per tenant
  const { data: taskA, error: taskAError } = await clientA
    .from('daily_tasks')
    .insert({
      user_id: aUserId,
      date: today,
      title: `${marker}-task-a`,
      completed: false,
    })
    .select('id')
    .single();
  if (taskAError || !taskA) {
    throw new Error(`Failed to seed tenant A task: ${taskAError?.message ?? 'unknown error'}`);
  }

  const { data: taskB, error: taskBError } = await clientB
    .from('daily_tasks')
    .insert({
      user_id: bUserId,
      date: today,
      title: `${marker}-task-b`,
      completed: false,
    })
    .select('id')
    .single();
  if (taskBError || !taskB) {
    throw new Error(`Failed to seed tenant B task: ${taskBError?.message ?? 'unknown error'}`);
  }

  const { data: goalB, error: goalBError } = await clientB
    .from('trajectory_goals')
    .insert({
      user_id: bUserId,
      title: `${marker}-goal-b`,
      category: 'gmat',
      due_date: dueDate,
      effort_hours: 120,
      buffer_weeks: 2,
      priority: 3,
      status: 'active',
    })
    .select('id')
    .single();
  if (goalBError || !goalB) {
    throw new Error(`Failed to seed tenant B trajectory goal: ${goalBError?.message ?? 'unknown error'}`);
  }

  const checks: CheckResult[] = [];

  checks.push(await assertNoAccessToTask(clientA, taskB.id));
  checks.push(await assertNoAccessToGoal(clientA, goalB.id));

  const { data: ownTaskVisible } = await clientA
    .from('daily_tasks')
    .select('id')
    .eq('id', taskA.id)
    .maybeSingle();
  checks.push({
    name: 'A can read own daily_task',
    ok: Boolean(ownTaskVisible?.id),
  });

  // Cleanup own rows only (RLS-enforced)
  await clientA.from('daily_tasks').delete().like('title', `${marker}%`);
  await clientB.from('daily_tasks').delete().like('title', `${marker}%`);
  await clientB.from('trajectory_goals').delete().like('title', `${marker}%`);

  const failed = checks.filter((check) => !check.ok);
  // eslint-disable-next-line no-console
  console.table(
    checks.map((check) => ({
      check: check.name,
      ok: check.ok ? 'yes' : 'no',
      detail: check.detail ?? '',
    }))
  );

  if (failed.length > 0) {
    throw new Error(`Tenant isolation failed: ${failed.map((f) => f.name).join(', ')}`);
  }

  // eslint-disable-next-line no-console
  console.log('Tenant isolation checks passed.');
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Tenant isolation QA failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
