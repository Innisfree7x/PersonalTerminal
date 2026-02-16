import { redirect } from 'next/navigation';
import OpsHealthClient from '@/components/features/analytics/OpsHealthClient';
import { requireAuth } from '@/lib/auth/server';
import { isAdminUser } from '@/lib/auth/authorization';

export default async function OpsHealthPage() {
  const user = await requireAuth();
  if (!isAdminUser(user)) {
    redirect('/analytics');
  }

  return <OpsHealthClient />;
}
