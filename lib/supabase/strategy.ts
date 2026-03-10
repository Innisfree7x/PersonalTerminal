import { createClient } from '@/lib/auth/server';
import type {
  CommitStrategyDecisionInput,
  CreateStrategyDecisionInput,
  CreateStrategyOptionInput,
  UpdateStrategyDecisionInput,
  UpdateStrategyOptionInput,
} from '@/lib/schemas/strategy.schema';
import type { Database } from '@/lib/supabase/types';

type StrategyDecisionRow = Database['public']['Tables']['strategy_decisions']['Row'];
type StrategyDecisionInsert = Database['public']['Tables']['strategy_decisions']['Insert'];
type StrategyDecisionUpdate = Database['public']['Tables']['strategy_decisions']['Update'];

type StrategyOptionRow = Database['public']['Tables']['strategy_options']['Row'];
type StrategyOptionInsert = Database['public']['Tables']['strategy_options']['Insert'];
type StrategyOptionUpdate = Database['public']['Tables']['strategy_options']['Update'];

type StrategyCommitRow = Database['public']['Tables']['strategy_decision_commits']['Row'];
type StrategyCommitInsert = Database['public']['Tables']['strategy_decision_commits']['Insert'];

export interface StrategyDecisionRecord {
  id: string;
  title: string;
  context: string | null;
  targetDate: string | null;
  status: 'draft' | 'committed' | 'archived';
  lastScoreTotal: number | null;
  lastScoredAt: string | null;
  lastWinnerOptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StrategyOptionRecord {
  id: string;
  decisionId: string;
  title: string;
  summary: string | null;
  impactPotential: number;
  confidenceLevel: number;
  strategicFit: number;
  effortCost: number;
  downsideRisk: number;
  timeToValueWeeks: number;
  createdAt: string;
  updatedAt: string;
}

export interface StrategyDecisionCommitRecord {
  id: string;
  decisionId: string;
  optionId: string;
  taskSourceKey: string;
  note: string | null;
  snoozeUntil: string | null;
  createdAt: string;
}

export interface StrategyDecisionBundle extends StrategyDecisionRecord {
  options: StrategyOptionRecord[];
  latestCommit: StrategyDecisionCommitRecord | null;
}

function toDecisionRecord(row: StrategyDecisionRow): StrategyDecisionRecord {
  return {
    id: row.id,
    title: row.title,
    context: row.context,
    targetDate: row.target_date,
    status: row.status,
    lastScoreTotal: row.last_score_total,
    lastScoredAt: row.last_scored_at,
    lastWinnerOptionId: row.last_winner_option_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toOptionRecord(row: StrategyOptionRow): StrategyOptionRecord {
  return {
    id: row.id,
    decisionId: row.decision_id,
    title: row.title,
    summary: row.summary,
    impactPotential: row.impact_potential,
    confidenceLevel: row.confidence_level,
    strategicFit: row.strategic_fit,
    effortCost: row.effort_cost,
    downsideRisk: row.downside_risk,
    timeToValueWeeks: row.time_to_value_weeks,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCommitRecord(row: StrategyCommitRow): StrategyDecisionCommitRecord {
  return {
    id: row.id,
    decisionId: row.decision_id,
    optionId: row.option_id,
    taskSourceKey: row.task_source_key,
    note: row.note,
    snoozeUntil: row.snooze_until,
    createdAt: row.created_at,
  };
}

export async function listStrategyDecisionBundles(userId: string): Promise<StrategyDecisionBundle[]> {
  const supabase = createClient();

  const [decisionsResult, optionsResult, commitsResult] = await Promise.all([
    supabase.from('strategy_decisions').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
    supabase.from('strategy_options').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase
      .from('strategy_decision_commits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(300),
  ]);

  if (decisionsResult.error) {
    throw new Error(`Failed to list strategy decisions: ${decisionsResult.error.message}`);
  }
  if (optionsResult.error) {
    throw new Error(`Failed to list strategy options: ${optionsResult.error.message}`);
  }
  if (commitsResult.error) {
    throw new Error(`Failed to list strategy commits: ${commitsResult.error.message}`);
  }

  const optionsByDecision = new Map<string, StrategyOptionRecord[]>();
  for (const row of optionsResult.data ?? []) {
    const option = toOptionRecord(row);
    const list = optionsByDecision.get(option.decisionId) ?? [];
    list.push(option);
    optionsByDecision.set(option.decisionId, list);
  }

  const latestCommitByDecision = new Map<string, StrategyDecisionCommitRecord>();
  for (const row of commitsResult.data ?? []) {
    const commit = toCommitRecord(row);
    if (!latestCommitByDecision.has(commit.decisionId)) {
      latestCommitByDecision.set(commit.decisionId, commit);
    }
  }

  return (decisionsResult.data ?? []).map((row) => {
    const decision = toDecisionRecord(row);
    return {
      ...decision,
      options: optionsByDecision.get(decision.id) ?? [],
      latestCommit: latestCommitByDecision.get(decision.id) ?? null,
    };
  });
}

export async function createStrategyDecision(
  userId: string,
  input: CreateStrategyDecisionInput
): Promise<StrategyDecisionRecord> {
  const supabase = createClient();
  const insertData: StrategyDecisionInsert = {
    user_id: userId,
    title: input.title,
    context: input.context ?? null,
    target_date: input.targetDate ?? null,
    status: input.status,
  };

  const { data, error } = await supabase.from('strategy_decisions').insert(insertData).select('*').single();
  if (error) throw new Error(`Failed to create strategy decision: ${error.message}`);

  return toDecisionRecord(data);
}

export async function updateStrategyDecision(
  userId: string,
  decisionId: string,
  input: UpdateStrategyDecisionInput
): Promise<StrategyDecisionRecord> {
  const supabase = createClient();

  const updateData: StrategyDecisionUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) updateData.title = input.title;
  if (input.context !== undefined) updateData.context = input.context;
  if (input.targetDate !== undefined) updateData.target_date = input.targetDate;
  if (input.status !== undefined) updateData.status = input.status;

  const { data, error } = await supabase
    .from('strategy_decisions')
    .update(updateData)
    .eq('id', decisionId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw new Error(`Failed to update strategy decision: ${error.message}`);
  return toDecisionRecord(data);
}

export async function deleteStrategyDecision(userId: string, decisionId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('strategy_decisions').delete().eq('id', decisionId).eq('user_id', userId);
  if (error) throw new Error(`Failed to delete strategy decision: ${error.message}`);
}

export async function createStrategyOption(
  userId: string,
  input: CreateStrategyOptionInput
): Promise<StrategyOptionRecord> {
  const supabase = createClient();

  const insertData: StrategyOptionInsert = {
    user_id: userId,
    decision_id: input.decisionId,
    title: input.title,
    summary: input.summary ?? null,
    impact_potential: input.impactPotential,
    confidence_level: input.confidenceLevel,
    strategic_fit: input.strategicFit,
    effort_cost: input.effortCost,
    downside_risk: input.downsideRisk,
    time_to_value_weeks: input.timeToValueWeeks,
  };

  const { data, error } = await supabase.from('strategy_options').insert(insertData).select('*').single();
  if (error) throw new Error(`Failed to create strategy option: ${error.message}`);

  return toOptionRecord(data);
}

export async function updateStrategyOption(
  userId: string,
  optionId: string,
  input: UpdateStrategyOptionInput
): Promise<StrategyOptionRecord> {
  const supabase = createClient();
  const updateData: StrategyOptionUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) updateData.title = input.title;
  if (input.summary !== undefined) updateData.summary = input.summary;
  if (input.impactPotential !== undefined) updateData.impact_potential = input.impactPotential;
  if (input.confidenceLevel !== undefined) updateData.confidence_level = input.confidenceLevel;
  if (input.strategicFit !== undefined) updateData.strategic_fit = input.strategicFit;
  if (input.effortCost !== undefined) updateData.effort_cost = input.effortCost;
  if (input.downsideRisk !== undefined) updateData.downside_risk = input.downsideRisk;
  if (input.timeToValueWeeks !== undefined) updateData.time_to_value_weeks = input.timeToValueWeeks;

  const { data, error } = await supabase
    .from('strategy_options')
    .update(updateData)
    .eq('id', optionId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw new Error(`Failed to update strategy option: ${error.message}`);
  return toOptionRecord(data);
}

export async function deleteStrategyOption(userId: string, optionId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('strategy_options').delete().eq('id', optionId).eq('user_id', userId);
  if (error) throw new Error(`Failed to delete strategy option: ${error.message}`);
}

export async function getStrategyDecisionById(userId: string, decisionId: string): Promise<StrategyDecisionRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('strategy_decisions')
    .select('*')
    .eq('id', decisionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch strategy decision: ${error.message}`);
  return data ? toDecisionRecord(data) : null;
}

export async function getStrategyOptionById(userId: string, optionId: string): Promise<StrategyOptionRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('strategy_options')
    .select('*')
    .eq('id', optionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch strategy option: ${error.message}`);
  return data ? toOptionRecord(data) : null;
}

export async function listStrategyOptionsByDecision(
  userId: string,
  decisionId: string
): Promise<StrategyOptionRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('strategy_options')
    .select('*')
    .eq('user_id', userId)
    .eq('decision_id', decisionId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to list strategy options: ${error.message}`);
  return (data ?? []).map(toOptionRecord);
}

export async function updateStrategyDecisionScore(
  userId: string,
  decisionId: string,
  scoreTotal: number,
  winnerOptionId: string | null
): Promise<StrategyDecisionRecord> {
  const supabase = createClient();

  const updateData: StrategyDecisionUpdate = {
    updated_at: new Date().toISOString(),
    last_score_total: scoreTotal,
    last_scored_at: new Date().toISOString(),
    last_winner_option_id: winnerOptionId,
  };

  const { data, error } = await supabase
    .from('strategy_decisions')
    .update(updateData)
    .eq('id', decisionId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw new Error(`Failed to persist strategy score: ${error.message}`);
  return toDecisionRecord(data);
}

export async function createStrategyDecisionCommit(
  userId: string,
  decisionId: string,
  input: CommitStrategyDecisionInput & { taskSourceKey: string }
): Promise<StrategyDecisionCommitRecord> {
  const supabase = createClient();

  const insertData: StrategyCommitInsert = {
    user_id: userId,
    decision_id: decisionId,
    option_id: input.optionId,
    task_source_key: input.taskSourceKey,
    note: input.note ?? null,
    snooze_until: input.snoozeUntil ?? null,
  };

  const { data, error } = await supabase
    .from('strategy_decision_commits')
    .insert(insertData)
    .select('*')
    .single();

  if (error) throw new Error(`Failed to commit strategy decision: ${error.message}`);
  return toCommitRecord(data);
}

export async function markStrategyDecisionCommitted(
  userId: string,
  decisionId: string,
  winnerOptionId: string
): Promise<StrategyDecisionRecord> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('strategy_decisions')
    .update({
      status: 'committed',
      last_winner_option_id: winnerOptionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', decisionId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw new Error(`Failed to update strategy decision status: ${error.message}`);
  return toDecisionRecord(data);
}
