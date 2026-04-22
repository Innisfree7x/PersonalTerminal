import { redirect } from 'next/navigation';
import { createClient } from '@/lib/auth/server';
import { getDashboardNextTasks } from '@/lib/dashboard/queries';
import TodayClient from './TodayClient';

export default async function TodayPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  let initialNextTasksData: Awaited<ReturnType<typeof getDashboardNextTasks>> | null = null;
  try {
    initialNextTasksData = await getDashboardNextTasks(user.id);
  } catch {
    initialNextTasksData = null;
  }

  return <TodayClient initialNextTasksData={initialNextTasksData} />;
}
