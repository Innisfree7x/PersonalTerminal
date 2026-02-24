import { NextRequest, NextResponse } from 'next/server';
import { fetchCoursesWithExercises } from '@/lib/supabase/courses';
import { startOfDay, differenceInDays } from 'date-fns';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { createApiTraceContext, withApiTraceHeaders } from '@/lib/api/observability';

interface StudyTask {
  id: string;
  courseId: string;
  courseName: string;
  exerciseNumber: number;
  examDate: string | null;
  daysUntilExam: number | null;
  urgency: 'urgent' | 'important' | 'normal';
}

/**
 * GET /api/dashboard/study-tasks - Fetch incomplete exercises prioritized by exam date
 */
export async function GET(request: NextRequest) {
  const trace = createApiTraceContext(request, '/api/dashboard/study-tasks');
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) {
    return withApiTraceHeaders(errorResponse, trace, { metricName: 'dash_study_tasks' });
  }

  try {
    const today = startOfDay(new Date());

    const coursesWithExercises = await fetchCoursesWithExercises(user.id);

    if (coursesWithExercises.length === 0) {
      const emptyResponse = NextResponse.json([]);
      return withApiTraceHeaders(emptyResponse, trace, { metricName: 'dash_study_tasks' });
    }

    // Find first incomplete exercise per course
    const studyTasks: StudyTask[] = [];

    for (const course of coursesWithExercises) {
      // Find first incomplete exercise
      const firstIncomplete = course.exercises.find(ex => ex.completed !== true);
      
      if (!firstIncomplete) continue; // Skip courses with all exercises complete

      let daysUntilExam: number | null = null;
      let urgency: 'urgent' | 'important' | 'normal' = 'normal';

      if (course.examDate) {
        const examDate = startOfDay(new Date(course.examDate));
        daysUntilExam = differenceInDays(examDate, today);

        if (daysUntilExam < 45) {
          urgency = 'urgent';
        } else if (daysUntilExam <= 60) {
          urgency = 'important';
        }
      }

      studyTasks.push({
        id: firstIncomplete.id,
        courseId: course.id,
        courseName: course.name,
        exerciseNumber: firstIncomplete.exerciseNumber,
        examDate: course.examDate ? (course.examDate.toISOString().split('T')[0] ?? '') : null,
        daysUntilExam,
        urgency,
      });
    }

    // Sort by exam date asc (nulls last), then urgency
    studyTasks.sort((a, b) => {
      const urgencyOrder = { urgent: 0, important: 1, normal: 2 };
      // primary: exam date
      if (a.examDate && b.examDate) {
        const diff = new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
        if (diff !== 0) return diff;
      } else if (a.examDate && !b.examDate) {
        return -1;
      } else if (!a.examDate && b.examDate) {
        return 1;
      }
      // secondary: urgency
      if (a.urgency !== b.urgency) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      // tertiary: exercise number
      return a.exerciseNumber - b.exerciseNumber;
    });

    const response = NextResponse.json(studyTasks.slice(0, 5));
    return withApiTraceHeaders(response, trace, { metricName: 'dash_study_tasks' });
  } catch (error) {
    const response = handleRouteError(
      error,
      'Failed to fetch study tasks',
      'Error fetching study tasks'
    );
    return withApiTraceHeaders(response, trace, { metricName: 'dash_study_tasks' });
  }
}
