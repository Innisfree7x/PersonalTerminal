import { createAdminClient } from '@/lib/auth/admin';

const CAREER_LLM_ROUTE = '/api/career/opportunities';
const CAREER_LLM_MODEL = 'claude-3-5-haiku-latest';

function isMissingTable(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  const message = String((error as { message?: string } | null)?.message ?? '').toLowerCase();
  return code === '42P01' || message.includes('llm_usage_logs');
}

export interface CareerLlmBudgetSnapshot {
  enabled: boolean;
  maxDailyUnits: number;
  usedUnits: number;
  remainingUnits: number;
}

export async function getCareerLlmBudgetSnapshot(userId: string, maxDailyUnits = 50): Promise<CareerLlmBudgetSnapshot> {
  const supabase = createAdminClient();
  const usageDate = new Date().toISOString().split('T')[0] ?? '';

  const { data, error } = await supabase
    .from('llm_usage_logs')
    .select('units')
    .eq('user_id', userId)
    .eq('route', CAREER_LLM_ROUTE)
    .eq('usage_date', usageDate);

  if (error) {
    if (isMissingTable(error)) {
      return {
        enabled: false,
        maxDailyUnits,
        usedUnits: 0,
        remainingUnits: maxDailyUnits,
      };
    }
    throw new Error(`Failed to read LLM usage budget: ${error.message}`);
  }

  const usedUnits = (data ?? []).reduce((sum, row) => sum + Number(row.units ?? 0), 0);
  const remainingUnits = Math.max(0, maxDailyUnits - usedUnits);
  return {
    enabled: true,
    maxDailyUnits,
    usedUnits,
    remainingUnits,
  };
}

export async function recordCareerLlmUsage(userId: string, units: number): Promise<boolean> {
  if (!Number.isFinite(units) || units <= 0) return false;

  const supabase = createAdminClient();
  const usageDate = new Date().toISOString().split('T')[0] ?? '';
  const { error } = await supabase.from('llm_usage_logs').insert({
    user_id: userId,
    route: CAREER_LLM_ROUTE,
    model: CAREER_LLM_MODEL,
    units: Math.round(units),
    usage_date: usageDate,
  });

  if (error) {
    if (isMissingTable(error)) return false;
    throw new Error(`Failed to persist LLM usage log: ${error.message}`);
  }
  return true;
}
