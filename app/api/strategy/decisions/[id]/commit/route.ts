import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { enforceTrustedMutationOrigin } from '@/lib/api/csrf';
import { createClient } from '@/lib/auth/server';
import type { Database } from '@/lib/supabase/types';
import { commitStrategyDecisionSchema } from '@/lib/schemas/strategy.schema';
import {
  createStrategyDecisionCommit,
  getStrategyDecisionById,
  getStrategyOptionById,
  listStrategyOptionsByDecision,
  markStrategyDecisionCommitted,
  updateStrategyDecisionScore,
} from '@/lib/supabase/strategy';
import { scoreStrategyOptions } from '@/lib/strategy/scoring';

interface Params {
  params: {
    id: string;
  };
}

type DailyTaskInsert = Database['public']['Tables']['daily_tasks']['Insert'];

type DailyTaskRow = {
  id: string;
  date: string;
  title: string;
  completed: boolean;
  source: string | null;
  source_id: string | null;
  time_estimate: string | null;
  created_at: string;
};

function toDailyTaskResponse(task: DailyTaskRow) {
  return {
    id: task.id,
    date: task.date,
    title: task.title,
    completed: task.completed,
    source: task.source,
    sourceId: task.source_id,
    timeEstimate: task.time_estimate,
    createdAt: task.created_at,
  };
}

function plusDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0] ?? isoDate;
}

export async function POST(request: NextRequest, { params }: Params) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const parsed = commitStrategyDecisionSchema.parse(body);
    const taskDate = parsed.taskDate ?? (new Date().toISOString().split('T')[0] ?? '');

    const decision = await getStrategyDecisionById(user.id, params.id);
    if (!decision) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Strategy decision not found' } }, { status: 404 });
    }

    const option = await getStrategyOptionById(user.id, parsed.optionId);
    if (!option) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Strategy option not found' } }, { status: 404 });
    }

    if (option.decisionId !== decision.id) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Option does not belong to decision' } },
        { status: 400 }
      );
    }

    const allOptions = await listStrategyOptionsByDecision(user.id, decision.id);
    const scored = scoreStrategyOptions(
      allOptions.map((item) => ({
        id: item.id,
        title: item.title,
        impactPotential: item.impactPotential,
        confidenceLevel: item.confidenceLevel,
        strategicFit: item.strategicFit,
        effortCost: item.effortCost,
        downsideRisk: item.downsideRisk,
        timeToValueWeeks: item.timeToValueWeeks,
      })),
      parsed.scoreMode
    );

    const selectedScore = scored.scoredOptions.find((entry) => entry.optionId === option.id);
    await updateStrategyDecisionScore(user.id, decision.id, selectedScore?.total ?? 0, scored.winner?.optionId ?? null);
    const committedDecision = await markStrategyDecisionCommitted(user.id, decision.id, option.id);

    const taskSourceKey = `strategy:${decision.id}:${option.id}:${taskDate}`;
    const commit = await createStrategyDecisionCommit(user.id, decision.id, {
      ...parsed,
      taskDate,
      taskSourceKey,
    });

    const supabase = createClient();
    const { data: existingTask, error: existingTaskError } = await supabase
      .from('daily_tasks')
      .select('id, date, title, completed, source, source_id, time_estimate, created_at')
      .eq('user_id', user.id)
      .eq('date', taskDate)
      .eq('source', 'strategy')
      .eq('source_id', taskSourceKey)
      .maybeSingle();

    if (existingTaskError) {
      throw new Error(`Failed to verify strategy task idempotency: ${existingTaskError.message}`);
    }

    let taskPayload: DailyTaskRow | null = existingTask as DailyTaskRow | null;
    let skippedExistingTask = false;

    if (!existingTask) {
      const insertData: DailyTaskInsert = {
        user_id: user.id,
        date: taskDate,
        title: parsed.taskTitle?.trim().length ? parsed.taskTitle.trim() : `Strategy: ${option.title}`,
        completed: false,
        source: 'strategy',
        source_id: taskSourceKey,
        time_estimate: parsed.timeEstimate ?? null,
      };

      const { data: createdTask, error: createTaskError } = await supabase
        .from('daily_tasks')
        .insert(insertData)
        .select('id, date, title, completed, source, source_id, time_estimate, created_at')
        .single();

      if (createTaskError) {
        throw new Error(`Failed to create strategy daily task: ${createTaskError.message}`);
      }

      taskPayload = createdTask as DailyTaskRow;
    } else {
      skippedExistingTask = true;
    }

    let followUpTaskPayload: DailyTaskRow | null = null;
    let skippedExistingFollowUpTask = false;

    if (parsed.followUpEnabled) {
      const followUpDate = parsed.followUpDate ?? plusDays(taskDate, 1);
      const followUpSourceKey = `strategy-followup:${decision.id}:${option.id}:${followUpDate}`;

      const { data: existingFollowUpTask, error: existingFollowUpTaskError } = await supabase
        .from('daily_tasks')
        .select('id, date, title, completed, source, source_id, time_estimate, created_at')
        .eq('user_id', user.id)
        .eq('date', followUpDate)
        .eq('source', 'strategy_follow_up')
        .eq('source_id', followUpSourceKey)
        .maybeSingle();

      if (existingFollowUpTaskError) {
        throw new Error(`Failed to verify strategy follow-up idempotency: ${existingFollowUpTaskError.message}`);
      }

      if (!existingFollowUpTask) {
        const followUpInsert: DailyTaskInsert = {
          user_id: user.id,
          date: followUpDate,
          title: parsed.followUpTitle?.trim().length
            ? parsed.followUpTitle.trim()
            : `Follow-up: Next step zu ${option.title}`,
          completed: false,
          source: 'strategy_follow_up',
          source_id: followUpSourceKey,
          time_estimate: '20m',
        };

        const { data: createdFollowUpTask, error: createFollowUpTaskError } = await supabase
          .from('daily_tasks')
          .insert(followUpInsert)
          .select('id, date, title, completed, source, source_id, time_estimate, created_at')
          .single();

        if (createFollowUpTaskError) {
          throw new Error(`Failed to create strategy follow-up task: ${createFollowUpTaskError.message}`);
        }

        followUpTaskPayload = createdFollowUpTask as DailyTaskRow;
      } else {
        skippedExistingFollowUpTask = true;
        followUpTaskPayload = existingFollowUpTask as DailyTaskRow;
      }
    }

    return NextResponse.json({
      decision: committedDecision,
      commit,
      selectedScore,
      winner: scored.winner,
      scoreMode: parsed.scoreMode,
      skippedExistingTask,
      skippedExistingFollowUpTask,
      task: taskPayload ? toDailyTaskResponse(taskPayload) : null,
      followUpTask: followUpTaskPayload ? toDailyTaskResponse(followUpTaskPayload) : null,
    });
  } catch (error) {
    return handleRouteError(error, 'Failed to commit strategy decision', 'Error committing strategy decision');
  }
}
