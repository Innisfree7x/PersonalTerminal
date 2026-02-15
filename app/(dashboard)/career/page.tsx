import { requireAuth } from '@/lib/auth/server';
import { fetchApplications } from '@/lib/supabase/applications';
import CareerBoard from '@/components/features/career/CareerBoard';

export const metadata = {
  title: 'Career - Prism',
  description: 'Track your job applications and manage your CV',
};

export default async function CareerPage() {
  const user = await requireAuth();

  // Fetch initial data on the server
  // We can increase the limit to ensure we get most active applications
  const { applications } = await fetchApplications({
    userId: user.id,
    limit: 100
  });

  return (
    <CareerBoard initialApplications={applications} />
  );
}

