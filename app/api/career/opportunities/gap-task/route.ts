import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuth } from '@/lib/api/auth';
import { enforceTrustedMutationOrigin } from '@/lib/api/csrf';
import { createClient } from '@/lib/auth/server';
import { handleRouteError } from '@/lib/api/server-errors';
import { applyRateLimitHeaders, consumeRateLimit, readForwardedIpFromRequest } from '@/lib/api/rateLimit';

const createCareerGapTaskSchema = z.object({
  opportunityTitle: z.string().trim().min(2).max(180),
  opportunityCompany: z.string().trim().min(2).max(180),
  gap: z.string().trim().min(2).max(220),
  track: z.enum(['M&A', 'TS', 'CorpFin', 'Audit']),
  jobUrl: z.string().trim().url().optional(),
});

function toTodayDate(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

function buildTaskTitle(input: z.infer<typeof createCareerGapTaskSchema>): string {
  return `[Career Gap] ${input.track}: ${input.gap}`;
}

function buildTaskNote(input: z.infer<typeof createCareerGapTaskSchema>): string {
  const lines = [
    'Quelle: Opportunity Radar',
    `${input.opportunityTitle} @ ${input.opportunityCompany}`,
    `Track: ${input.track}`,
    `Gap: ${input.gap}`,
  ];
  if (input.jobUrl) lines.push(`Job URL: ${input.jobUrl}`);
  return lines.join(' · ');
}

export async function POST(request: NextRequest) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const rateLimit = consumeRateLimit({
      key: `career_gap_task:${user.id}:${readForwardedIpFromRequest(request)}`,
      limit: 12,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return applyRateLimitHeaders(
        NextResponse.json(
          {
            error: {
              code: 'RATE_LIMITED',
              message: 'Zu viele Gap-Tasks in kurzer Zeit. Bitte kurz warten.',
            },
          },
          { status: 429 }
        ),
        rateLimit
      );
    }

    const body = await request.json();
    const parsed = createCareerGapTaskSchema.parse(body);

    const today = toTodayDate();
    const title = buildTaskTitle(parsed);
    const note = buildTaskNote(parsed);

    const supabase = createClient();
    const { data: existing, error: existingError } = await supabase
      .from('daily_tasks')
      .select('id, title, date, completed, source, source_id, time_estimate, created_at')
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('title', title)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Failed to check existing gap task: ${existingError.message}`);
    }

    if (existing) {
      return applyRateLimitHeaders(
        NextResponse.json({
          created: false,
          task: {
            id: existing.id,
            date: existing.date,
            title: existing.title,
            completed: existing.completed,
            source: existing.source,
            sourceId: existing.source_id,
            timeEstimate: existing.time_estimate,
            createdAt: existing.created_at,
          },
        }),
        rateLimit
      );
    }

    const { data: created, error: insertError } = await supabase
      .from('daily_tasks')
      .insert({
        user_id: user.id,
        date: today,
        title,
        completed: false,
        source: 'manual',
        source_id: null,
        time_estimate: '45m',
      })
      .select('id, title, date, completed, source, source_id, time_estimate, created_at')
      .single();

    if (insertError) {
      throw new Error(`Failed to create gap task: ${insertError.message}`);
    }

    return applyRateLimitHeaders(
      NextResponse.json({
        created: true,
        note,
        task: {
          id: created.id,
          date: created.date,
          title: created.title,
          completed: created.completed,
          source: created.source,
          sourceId: created.source_id,
          timeEstimate: created.time_estimate,
          createdAt: created.created_at,
        },
      }),
      rateLimit
    );
  } catch (error) {
    return handleRouteError(error, 'Gap-Task konnte nicht erstellt werden.', 'Error creating career gap task');
  }
}
