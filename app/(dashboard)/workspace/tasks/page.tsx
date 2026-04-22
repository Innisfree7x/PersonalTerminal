import { redirect } from 'next/navigation';
import { createClient } from '@/lib/auth/server';
import { getDailyTasksByDate } from '@/lib/supabase/dailyTasks';
import TasksClient from './TasksClient';

function todayDateKey(): string {
  return new Date().toISOString().split('T')[0]!;
}

export default async function WorkspaceTasksPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const today = todayDateKey();
  let initialTasks: Awaited<ReturnType<typeof getDailyTasksByDate>> = [];
  try {
    initialTasks = await getDailyTasksByDate(user.id, today);
  } catch {
    initialTasks = [];
  }

  return <TasksClient initialDate={today} initialTasks={initialTasks} />;
}
