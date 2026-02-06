import { NextRequest, NextResponse } from 'next/server';
import { fetchGoals } from '@/lib/supabase/goals';
import { fetchApplications } from '@/lib/supabase/applications';
import { supabase } from '@/lib/supabase/client';
import { startOfWeek, endOfWeek, startOfDay, differenceInDays } from 'date-fns';
import { requireApiAuth } from '@/lib/api/auth';

interface DashboardStats {
  career: {
    activeInterviews: number;
    nextInterview?: { company: string; position: string; date: string };
    applicationsPending: number;
    pendingDays: number;
    followUpNeeded: number;
  };
  goals: {
    weeklyProgress: { onTrack: number; total: number };
    byCategory: Record<string, number>;
    overdue: number;
  };
  study: {
    weekCompleted: number;
    semesterPercent: number;
    nextExam?: { courseName: string; daysUntil: number };
  };
  metrics: {
    todayCompletion: number; // percentage
    weekProgress: { day: number; total: number }; // e.g. day 3/7
    focusTime: string; // e.g. "Peak hours - good for deep work"
  };
}

/**
 * GET /api/dashboard/stats - Fetch dashboard statistics
 */
export async function GET(_request: NextRequest) {
  const { errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

    // Fetch all goals and applications
    const { goals: allGoals } = await fetchGoals();
    const { applications: allApplications } = await fetchApplications();

    // Career stats
    const interviews = allApplications.filter((app: any) => app.status === 'interview');
    const upcomingInterviews = interviews
      .filter((app: any) => app.interviewDate && new Date(app.interviewDate) >= today)
      .sort((a: any, b: any) => {
        if (!a.interviewDate || !b.interviewDate) return 0;
        return new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime();
      });
    const firstUpcoming = upcomingInterviews[0];
    const nextInterview = firstUpcoming && firstUpcoming.interviewDate
      ? {
          company: firstUpcoming.company,
          position: firstUpcoming.position,
          date: new Date(firstUpcoming.interviewDate).toISOString(),
        }
      : undefined;

    const applicationsPending = allApplications.filter((app: any) => app.status === 'applied').length;
    const oldestPending =
      applicationsPending > 0
        ? allApplications
            .filter((app: any) => app.status === 'applied')
            .sort(
              (a: any, b: any) => a.applicationDate.getTime() - b.applicationDate.getTime()
            )[0]
        : null;
    const pendingDays = oldestPending
      ? differenceInDays(today, startOfDay(oldestPending.applicationDate))
      : 0;

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const followUpNeeded = allApplications.filter(
      (app: any) =>
        app.status === 'applied' && app.applicationDate < sevenDaysAgo
    ).length;

    // Goals stats
    const weekGoals = allGoals.filter((goal: any) => {
      const goalDate = startOfDay(goal.targetDate);
      return goalDate >= weekStart && goalDate <= weekEnd;
    });
    const onTrackGoals = weekGoals.filter((goal: any) => {
      if (!goal.metrics) return false;
      const progress = goal.metrics.current / goal.metrics.target;
      return progress >= 0.5; // 50% or more = on track
    });

    const goalsByCategory: Record<string, number> = {};
    allGoals.forEach((goal: any) => {
      const cat = goal.category as string;
      if (goalsByCategory[cat] === undefined) {
        goalsByCategory[cat] = 0;
      }
      goalsByCategory[cat] = (goalsByCategory[cat] ?? 0) + 1;
    });

    const overdueGoals = allGoals.filter((goal: any) => {
      const goalDate = startOfDay(goal.targetDate);
      return goalDate < startOfDay(today);
    }).length;

    // Metrics
    // Today completion would need daily_tasks table, for now use goals
    const todayGoals = allGoals.filter((goal: any) => {
      const goalDate = startOfDay(goal.targetDate);
      return goalDate.getTime() === startOfDay(today).getTime();
    }).length;
    const todayCompletion = todayGoals > 0 ? 50 : 0; // Placeholder, needs daily_tasks

    // Week progress (day of week: Monday = 1, Sunday = 7)
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // Convert Sunday from 0 to 7
    const weekProgress = { day: dayOfWeek, total: 7 };

    // Focus time based on hour
    const hour = today.getHours();
    let focusTime = 'Standard hours';
    if (hour >= 9 && hour < 12) {
      focusTime = 'Peak hours - good for deep work';
    } else if (hour >= 14 && hour < 17) {
      focusTime = 'Afternoon focus - good for meetings';
    } else if (hour >= 20 && hour < 23) {
      focusTime = 'Evening - time for side projects';
    }

    // Study stats
    const { data: coursesData } = await supabase.from('courses').select('id, name, exam_date');
    const { data: exercisesData } = await supabase.from('exercise_progress').select('*');

    const weekStartDate = startOfWeek(today, { weekStartsOn: 1 });
    const weekCompletedExercises = (exercisesData || []).filter((ex) => {
      if (!ex.completed || !ex.completed_at) return false;
      const completedDate = new Date(ex.completed_at);
      return completedDate >= weekStartDate && completedDate <= today;
    }).length;

    const totalExercises = (exercisesData || []).length;
    const completedExercises = (exercisesData || []).filter((ex) => ex.completed).length;
    const semesterPercent = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

    let nextExamCourse: { courseName: string; daysUntil: number } | undefined;
    if (coursesData && coursesData.length > 0) {
      const upcomingCourses = coursesData
        .filter((c) => c.exam_date && new Date(c.exam_date) >= today)
        .sort((a, b) => {
          if (!a.exam_date || !b.exam_date) return 0;
          return new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime();
        });
      if (upcomingCourses[0] && upcomingCourses[0].exam_date) {
        const examDate = startOfDay(new Date(upcomingCourses[0].exam_date));
        nextExamCourse = {
          courseName: upcomingCourses[0].name,
          daysUntil: differenceInDays(examDate, startOfDay(today)),
        };
      }
    }

    const stats: DashboardStats = {
      career: {
        activeInterviews: interviews.length,
        ...(nextInterview ? { nextInterview } : {}),
        applicationsPending,
        pendingDays,
        followUpNeeded,
      },
      goals: {
        weeklyProgress: { onTrack: onTrackGoals.length, total: weekGoals.length },
        byCategory: goalsByCategory,
        overdue: overdueGoals,
      },
      study: {
        weekCompleted: weekCompletedExercises,
        semesterPercent,
        ...(nextExamCourse ? { nextExam: nextExamCourse } : {}),
      },
      metrics: {
        todayCompletion,
        weekProgress,
        focusTime,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
