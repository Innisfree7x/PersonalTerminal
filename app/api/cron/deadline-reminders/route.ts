import { differenceInCalendarDays, startOfDay } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/auth/admin';
import { requireCronAuth } from '@/lib/api/cron';
import { handleRouteError } from '@/lib/api/server-errors';
import { buildDeadlineReminderEmail } from '@/lib/email/templates';
import { sendEmail } from '@/lib/email/resend';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface NotifiableUser {
  id: string;
  email: string;
  fullName: string | null;
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
    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    const chunk = data.users
      .map(toNotifiableUser)
      .filter((user): user is NotifiableUser => user !== null);
    users.push(...chunk);

    if (data.users.length < 200) break;
    page += 1;
  }

  return users;
}

export async function GET(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  try {
    const admin = createAdminClient();
    const users = await listNotifiableUsers();
    const today = startOfDay(new Date());
    const baseUrl = resolveBaseUrl();

    let emailsSent = 0;
    let remindersFound = 0;
    let skippedUsers = 0;

    for (const user of users) {
      const { data: courses, error } = await admin
        .from('courses')
        .select('name, exam_date')
        .eq('user_id', user.id)
        .not('exam_date', 'is', null);

      if (error) {
        throw new Error(`Failed to load courses for user ${user.id}: ${error.message}`);
      }

      const dueCourses = (courses || []).filter((course) => {
        if (!course.exam_date) return false;
        const daysUntil = differenceInCalendarDays(startOfDay(new Date(course.exam_date)), today);
        return daysUntil === 14 || daysUntil === 7 || daysUntil === 3;
      });

      if (dueCourses.length === 0) {
        skippedUsers += 1;
        continue;
      }

      for (const course of dueCourses) {
        if (!course.exam_date) continue;
        const daysUntil = differenceInCalendarDays(startOfDay(new Date(course.exam_date)), today);
        remindersFound += 1;
        const template = buildDeadlineReminderEmail({
          fullName: user.fullName,
          courseName: course.name,
          examDate: course.exam_date,
          daysUntil,
          dashboardUrl: `${baseUrl}/today`,
          settingsUrl: `${baseUrl}/settings`,
        });

        const result = await sendEmail({
          to: user.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        });

        if (result.sent) {
          emailsSent += 1;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      usersScanned: users.length,
      remindersFound,
      emailsSent,
      skippedUsers,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return handleRouteError(error, 'Failed to run deadline reminders', 'Error running deadline-reminders cron');
  }
}
