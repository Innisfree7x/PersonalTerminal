import {
  addDays,
  differenceInCalendarDays,
  endOfWeek,
  format,
  startOfDay,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/auth/admin';
import { requireCronAuth } from '@/lib/api/cron';
import { handleRouteError } from '@/lib/api/server-errors';
import { buildWeeklyReportEmail } from '@/lib/email/templates';
import { sendEmail } from '@/lib/email/resend';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface NotifiableUser {
  id: string;
  email: string;
  fullName: string | null;
}

interface WeeklyMetrics {
  focusMinutes: number;
  sessionsCount: number;
  focusDeltaMinutes: number | null;
  completedTasks: number;
  openTasks: number;
  upcomingDeadlines: Array<{ title: string; dueDate: string; daysUntil: number }>;
}

function resolveBaseUrl() {
  return (
    serverEnv.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
}

function toNotifiableUser(user: User): NotifiableUser | null {
  if (!user.email) return null;
  if (user.user_metadata?.email_notifications === false) return null;
  const fullNameRaw =
    user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.fullName || null;
  return {
    id: user.id,
    email: user.email,
    fullName: typeof fullNameRaw === 'string' ? fullNameRaw : null,
  };
}

async function listNotifiableUsers(): Promise<NotifiableUser[]> {
  const admin = createAdminClient();
  const users: NotifiableUser[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`Failed to list users: ${error.message}`);

    users.push(...data.users.map(toNotifiableUser).filter((user): user is NotifiableUser => user !== null));
    if (data.users.length < 200) break;
    page += 1;
  }

  return users;
}

async function computeWeeklyMetrics(userId: string, referenceDate: Date): Promise<WeeklyMetrics> {
  const admin = createAdminClient();
  const thisWeekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekStart = subWeeks(thisWeekStart, 1);
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const prevWeekStart = subWeeks(weekStart, 1);
  const prevWeekEnd = endOfWeek(prevWeekStart, { weekStartsOn: 1 });

  const [
    { data: focusWeek, error: focusWeekError },
    { data: focusPrevWeek, error: focusPrevWeekError },
    { data: tasksWeek, error: tasksWeekError },
    { data: upcomingCourses, error: upcomingCoursesError },
  ] = await Promise.all([
    admin
      .from('focus_sessions')
      .select('duration_seconds')
      .eq('user_id', userId)
      .eq('session_type', 'focus')
      .gte('started_at', weekStart.toISOString())
      .lte('started_at', weekEnd.toISOString()),
    admin
      .from('focus_sessions')
      .select('duration_seconds')
      .eq('user_id', userId)
      .eq('session_type', 'focus')
      .gte('started_at', prevWeekStart.toISOString())
      .lte('started_at', prevWeekEnd.toISOString()),
    admin
      .from('daily_tasks')
      .select('completed')
      .eq('user_id', userId)
      .gte('date', format(weekStart, 'yyyy-MM-dd'))
      .lte('date', format(weekEnd, 'yyyy-MM-dd')),
    admin
      .from('courses')
      .select('name, exam_date')
      .eq('user_id', userId)
      .not('exam_date', 'is', null)
      .gte('exam_date', format(startOfDay(referenceDate), 'yyyy-MM-dd'))
      .lte('exam_date', format(addDays(startOfDay(referenceDate), 21), 'yyyy-MM-dd'))
      .order('exam_date', { ascending: true })
      .limit(3),
  ]);

  if (focusWeekError) throw new Error(`Failed to fetch weekly focus sessions: ${focusWeekError.message}`);
  if (focusPrevWeekError) {
    throw new Error(`Failed to fetch previous-week focus sessions: ${focusPrevWeekError.message}`);
  }
  if (tasksWeekError) throw new Error(`Failed to fetch weekly tasks: ${tasksWeekError.message}`);
  if (upcomingCoursesError) throw new Error(`Failed to fetch upcoming courses: ${upcomingCoursesError.message}`);

  const focusSeconds = (focusWeek || []).reduce((sum, session) => sum + session.duration_seconds, 0);
  const prevFocusSeconds = (focusPrevWeek || []).reduce((sum, session) => sum + session.duration_seconds, 0);
  const focusMinutes = Math.round(focusSeconds / 60);
  const prevFocusMinutes = Math.round(prevFocusSeconds / 60);

  const completedTasks = (tasksWeek || []).filter((task) => task.completed).length;
  const openTasks = Math.max((tasksWeek || []).length - completedTasks, 0);

  const upcomingDeadlines = (upcomingCourses || [])
    .filter((course) => course.exam_date)
    .map((course) => ({
      title: `Prüfung ${course.name}`,
      dueDate: course.exam_date as string,
      daysUntil: differenceInCalendarDays(startOfDay(new Date(course.exam_date as string)), startOfDay(referenceDate)),
    }));

  return {
    focusMinutes,
    sessionsCount: (focusWeek || []).length,
    focusDeltaMinutes:
      (focusPrevWeek || []).length > 0 || focusMinutes > 0 ? focusMinutes - prevFocusMinutes : null,
    completedTasks,
    openTasks,
    upcomingDeadlines,
  };
}

export async function GET(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  try {
    const users = await listNotifiableUsers();
    const baseUrl = resolveBaseUrl();
    const now = new Date();
    const reportWeekStart = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 1);
    const reportWeekEnd = endOfWeek(reportWeekStart, { weekStartsOn: 1 });
    const weekLabel = `${format(reportWeekStart, 'dd.MM')}–${format(reportWeekEnd, 'dd.MM.yyyy')}`;

    let processedUsers = 0;
    let emailsSent = 0;

    for (const user of users) {
      const metrics = await computeWeeklyMetrics(user.id, now);
      const template = buildWeeklyReportEmail({
        fullName: user.fullName,
        weekLabel,
        focusMinutes: metrics.focusMinutes,
        focusDeltaMinutes: metrics.focusDeltaMinutes,
        sessionsCount: metrics.sessionsCount,
        completedTasks: metrics.completedTasks,
        openTasks: metrics.openTasks,
        upcomingDeadlines: metrics.upcomingDeadlines,
        dashboardUrl: `${baseUrl}/today`,
        settingsUrl: `${baseUrl}/settings`,
      });

      const result = await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      processedUsers += 1;
      if (result.sent) emailsSent += 1;
    }

    return NextResponse.json({
      ok: true,
      weekLabel,
      usersScanned: users.length,
      processedUsers,
      emailsSent,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return handleRouteError(error, 'Failed to run weekly report', 'Error running weekly-report cron');
  }
}
