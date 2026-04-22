import { redirect } from 'next/navigation';
import { createClient } from '@/lib/auth/server';
import { fetchCoursesWithExercises } from '@/lib/supabase/courses';
import CoursesClient from './CoursesClient';

export default async function UniversityCoursesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  let initialCourses: Awaited<ReturnType<typeof fetchCoursesWithExercises>> = [];
  try {
    initialCourses = await fetchCoursesWithExercises(user.id);
  } catch {
    initialCourses = [];
  }

  return <CoursesClient initialCourses={initialCourses} />;
}
