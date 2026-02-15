import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { fetchCoursesWithExercises } from '@/lib/supabase/courses';
import { fetchGoals } from '@/lib/supabase/goals';
import { fetchApplications } from '@/lib/supabase/applications';
import { createClient } from '@/lib/auth/server';
import { differenceInDays, startOfDay } from 'date-fns';

interface NextHomework {
  type: 'homework';
  id: string;
  courseId: string;
  courseName: string;
  exerciseNumber: number;
  totalExercises: number;
  completedExercises: number;
  examDate?: string;
  daysUntilExam?: number;
}

interface NextGoal {
  type: 'goal';
  id: string;
  title: string;
  category: string;
  targetDate: string;
  daysUntil: number;
  progress?: { current: number; target: number; unit: string } | undefined;
}

interface NextInterview {
  type: 'interview';
  id: string;
  company: string;
  position: string;
  interviewDate: string;
  daysUntil: number;
}

export type NextTask = NextHomework | NextGoal | NextInterview;

/**
 * GET /api/dashboard/next-tasks
 * Returns actionable next tasks: next homework per course, upcoming goals, upcoming interviews
 */
export async function GET(_request: NextRequest) {
  const { errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const today = new Date();
    const todayStart = startOfDay(today);

    // Fetch courses with exercises - find next incomplete homework per course
    const courses = await fetchCoursesWithExercises();
    const homeworks: NextHomework[] = [];

    for (const course of courses) {
      const completedCount = course.exercises.filter(ex => ex.completed).length;
      const nextExercise = course.exercises
        .filter(ex => !ex.completed)
        .sort((a, b) => a.exerciseNumber - b.exerciseNumber)[0];

      if (nextExercise) {
        const hw: NextHomework = {
          type: 'homework',
          id: `hw-${course.id}-${nextExercise.exerciseNumber}`,
          courseId: course.id,
          courseName: course.name,
          exerciseNumber: nextExercise.exerciseNumber,
          totalExercises: course.numExercises,
          completedExercises: completedCount,
        };

        if (course.examDate) {
          hw.examDate = course.examDate.toISOString();
          hw.daysUntilExam = differenceInDays(startOfDay(course.examDate), todayStart);
        }

        homeworks.push(hw);
      }
    }

    // Sort homeworks: closest exam first
    homeworks.sort((a, b) => {
      if (a.daysUntilExam !== undefined && b.daysUntilExam !== undefined) {
        return a.daysUntilExam - b.daysUntilExam;
      }
      if (a.daysUntilExam !== undefined) return -1;
      if (b.daysUntilExam !== undefined) return 1;
      return 0;
    });

    // Fetch goals due in next 7 days
    const { goals: allGoals } = await fetchGoals();
    const upcomingGoals: NextGoal[] = allGoals
      .filter((goal: any) => {
        const goalDate = startOfDay(goal.targetDate);
        const daysUntil = differenceInDays(goalDate, todayStart);
        return daysUntil >= 0 && daysUntil <= 7;
      })
      .map((goal: any) => ({
        type: 'goal' as const,
        id: goal.id,
        title: goal.title,
        category: goal.category,
        targetDate: goal.targetDate.toISOString(),
        daysUntil: differenceInDays(startOfDay(goal.targetDate), todayStart),
        progress: goal.metrics ? {
          current: goal.metrics.current,
          target: goal.metrics.target,
          unit: goal.metrics.unit,
        } : undefined,
      }))
      .sort((a: NextGoal, b: NextGoal) => a.daysUntil - b.daysUntil);

    // Fetch upcoming interviews (next 7 days)
    const { applications } = await fetchApplications();
    const upcomingInterviews: NextInterview[] = applications
      .filter((app: any) => {
        if (!app.interviewDate || app.status !== 'interview') return false;
        const daysUntil = differenceInDays(startOfDay(app.interviewDate), todayStart);
        return daysUntil >= 0 && daysUntil <= 7;
      })
      .map((app: any) => ({
        type: 'interview' as const,
        id: app.id,
        company: app.company,
        position: app.position,
        interviewDate: app.interviewDate.toISOString(),
        daysUntil: differenceInDays(startOfDay(app.interviewDate), todayStart),
      }))
      .sort((a: NextInterview, b: NextInterview) => a.daysUntil - b.daysUntil);

    // Study progress summary for the widget
    const studyProgress = courses.map(course => {
      const completed = course.exercises.filter(ex => ex.completed).length;
      return {
        id: course.id,
        name: course.name,
        completed,
        total: course.numExercises,
        percentage: course.numExercises > 0 ? Math.round((completed / course.numExercises) * 100) : 0,
        examDate: course.examDate?.toISOString(),
        daysUntilExam: course.examDate
          ? differenceInDays(startOfDay(course.examDate), todayStart)
          : undefined,
      };
    });

    // Real stats for the stats bar
    const supabase = createClient();
    const { data: dailyTasksData } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('date', today.toISOString().split('T')[0] ?? '');

    const dailyTasks = dailyTasksData || [];
    const tasksCompleted = dailyTasks.filter(t => t.completed).length;
    const tasksTotal = dailyTasks.length + homeworks.length;

    return NextResponse.json({
      homeworks,
      goals: upcomingGoals,
      interviews: upcomingInterviews,
      studyProgress,
      stats: {
        tasksToday: tasksTotal,
        tasksCompleted,
        exercisesThisWeek: studyProgress.reduce((sum, c) => sum + c.completed, 0),
        exercisesTotal: studyProgress.reduce((sum, c) => sum + c.total, 0),
        nextExam: studyProgress
          .filter(c => c.daysUntilExam !== undefined && c.daysUntilExam >= 0)
          .sort((a, b) => (a.daysUntilExam ?? 999) - (b.daysUntilExam ?? 999))[0] || null,
        goalsActive: allGoals.length,
        goalsDueSoon: upcomingGoals.length,
        interviewsUpcoming: upcomingInterviews.length,
      },
    });
  } catch (error) {
    console.error('Error fetching next tasks:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch next tasks' },
      { status: 500 }
    );
  }
}
