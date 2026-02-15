import { differenceInDays, endOfWeek, startOfDay, startOfWeek } from 'date-fns';
import { createClient } from '@/lib/auth/server';
import { fetchCoursesWithExercises } from '@/lib/supabase/courses';
import { fetchGoals } from '@/lib/supabase/goals';
import { fetchApplications } from '@/lib/supabase/applications';

export interface DashboardStats {
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
    todayCompletion: number;
    weekProgress: { day: number; total: number };
    focusTime: string;
  };
}

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
  progress?: { current: number; target: number; unit: string };
}

interface NextInterview {
  type: 'interview';
  id: string;
  company: string;
  position: string;
  interviewDate: string;
  daysUntil: number;
}

interface StudyProgressCourse {
  id: string;
  name: string;
  completed: number;
  total: number;
  percentage: number;
  examDate?: string;
  daysUntilExam?: number;
}

interface DashboardTaskStats {
  tasksToday: number;
  tasksCompleted: number;
  exercisesThisWeek: number;
  exercisesTotal: number;
  nextExam: StudyProgressCourse | null;
  goalsActive: number;
  goalsDueSoon: number;
  interviewsUpcoming: number;
}

export interface DashboardNextTasksResponse {
  homeworks: NextHomework[];
  goals: NextGoal[];
  interviews: NextInterview[];
  studyProgress: StudyProgressCourse[];
  stats: DashboardTaskStats;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const { goals: allGoals } = await fetchGoals({ userId });
  const { applications: allApplications } = await fetchApplications({ userId });

  const interviews = allApplications.filter((app) => app.status === 'interview');
  const upcomingInterviews = interviews
    .filter((app) => app.interviewDate && new Date(app.interviewDate) >= today)
    .sort((a, b) => {
      if (!a.interviewDate || !b.interviewDate) return 0;
      return new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime();
    });

  const firstUpcoming = upcomingInterviews[0];
  const nextInterview = firstUpcoming?.interviewDate
    ? {
        company: firstUpcoming.company,
        position: firstUpcoming.position,
        date: new Date(firstUpcoming.interviewDate).toISOString(),
      }
    : undefined;

  const applicationsPending = allApplications.filter((app) => app.status === 'applied').length;
  const oldestPending =
    applicationsPending > 0
      ? allApplications
          .filter((app) => app.status === 'applied')
          .sort((a, b) => a.applicationDate.getTime() - b.applicationDate.getTime())[0]
      : null;
  const pendingDays = oldestPending
    ? differenceInDays(today, startOfDay(oldestPending.applicationDate))
    : 0;

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const followUpNeeded = allApplications.filter(
    (app) => app.status === 'applied' && app.applicationDate < sevenDaysAgo
  ).length;

  const weekGoals = allGoals.filter((goal) => {
    const goalDate = startOfDay(goal.targetDate);
    return goalDate >= weekStart && goalDate <= weekEnd;
  });

  const onTrackGoals = weekGoals.filter((goal) => {
    if (!goal.metrics) return false;
    const progress = goal.metrics.current / goal.metrics.target;
    return progress >= 0.5;
  });

  const goalsByCategory: Record<string, number> = {};
  allGoals.forEach((goal) => {
    const cat = goal.category;
    goalsByCategory[cat] = (goalsByCategory[cat] ?? 0) + 1;
  });

  const overdueGoals = allGoals.filter((goal) => {
    const goalDate = startOfDay(goal.targetDate);
    return goalDate < startOfDay(today);
  }).length;

  const todayGoals = allGoals.filter((goal) => {
    const goalDate = startOfDay(goal.targetDate);
    return goalDate.getTime() === startOfDay(today).getTime();
  }).length;
  const todayCompletion = todayGoals > 0 ? 50 : 0;

  const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
  const weekProgress = { day: dayOfWeek, total: 7 };

  const hour = today.getHours();
  let focusTime = 'Standard hours';
  if (hour >= 9 && hour < 12) focusTime = 'Peak hours - good for deep work';
  else if (hour >= 14 && hour < 17) focusTime = 'Afternoon focus - good for meetings';
  else if (hour >= 20 && hour < 23) focusTime = 'Evening - time for side projects';

  const supabase = createClient();
  const { data: coursesData } = await supabase
    .from('courses')
    .select('id, name, exam_date')
    .eq('user_id', userId);

  const { data: exercisesData } = await supabase
    .from('exercise_progress')
    .select('*')
    .eq('user_id', userId);

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

    if (upcomingCourses[0]?.exam_date) {
      const examDate = startOfDay(new Date(upcomingCourses[0].exam_date));
      nextExamCourse = {
        courseName: upcomingCourses[0].name,
        daysUntil: differenceInDays(examDate, startOfDay(today)),
      };
    }
  }

  return {
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
}

export async function getDashboardNextTasks(userId: string): Promise<DashboardNextTasksResponse> {
  const today = new Date();
  const todayStart = startOfDay(today);

  const courses = await fetchCoursesWithExercises(userId);
  const homeworks: NextHomework[] = [];

  for (const course of courses) {
    const completedCount = course.exercises.filter((ex) => ex.completed).length;
    const nextExercise = course.exercises
      .filter((ex) => !ex.completed)
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

  homeworks.sort((a, b) => {
    if (a.daysUntilExam !== undefined && b.daysUntilExam !== undefined) return a.daysUntilExam - b.daysUntilExam;
    if (a.daysUntilExam !== undefined) return -1;
    if (b.daysUntilExam !== undefined) return 1;
    return 0;
  });

  const { goals: allGoals } = await fetchGoals({ userId });
  const upcomingGoals: NextGoal[] = allGoals
    .filter((goal) => {
      const goalDate = startOfDay(goal.targetDate);
      const daysUntil = differenceInDays(goalDate, todayStart);
      return daysUntil >= 0 && daysUntil <= 7;
    })
    .map((goal) => ({
      type: 'goal' as const,
      id: goal.id,
      title: goal.title,
      category: goal.category,
      targetDate: goal.targetDate.toISOString(),
      daysUntil: differenceInDays(startOfDay(goal.targetDate), todayStart),
      ...(goal.metrics
        ? {
            progress: {
              current: goal.metrics.current,
              target: goal.metrics.target,
              unit: goal.metrics.unit,
            },
          }
        : {}),
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const { applications } = await fetchApplications({ userId });
  const upcomingInterviews: NextInterview[] = applications
    .filter((app) => {
      if (!app.interviewDate || app.status !== 'interview') return false;
      const daysUntil = differenceInDays(startOfDay(app.interviewDate), todayStart);
      return daysUntil >= 0 && daysUntil <= 7;
    })
    .map((app) => {
      if (!app.interviewDate) return null;
      return {
        type: 'interview' as const,
        id: app.id,
        company: app.company,
        position: app.position,
        interviewDate: app.interviewDate.toISOString(),
        daysUntil: differenceInDays(startOfDay(app.interviewDate), todayStart),
      };
    })
    .filter((item): item is NextInterview => item !== null)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const studyProgress: StudyProgressCourse[] = courses.map((course) => {
    const completed = course.exercises.filter((ex) => ex.completed).length;
    return {
      id: course.id,
      name: course.name,
      completed,
      total: course.numExercises,
      percentage: course.numExercises > 0 ? Math.round((completed / course.numExercises) * 100) : 0,
      ...(course.examDate ? { examDate: course.examDate.toISOString() } : {}),
      ...(course.examDate
        ? { daysUntilExam: differenceInDays(startOfDay(course.examDate), todayStart) }
        : {}),
    };
  });

  const supabase = createClient();
  const { data: dailyTasksData } = await supabase
    .from('daily_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today.toISOString().split('T')[0] ?? '');

  const dailyTasks = dailyTasksData || [];
  const tasksCompleted = dailyTasks.filter((t) => t.completed).length;
  const tasksTotal = dailyTasks.length + homeworks.length;

  return {
    homeworks,
    goals: upcomingGoals,
    interviews: upcomingInterviews,
    studyProgress,
    stats: {
      tasksToday: tasksTotal,
      tasksCompleted,
      exercisesThisWeek: studyProgress.reduce((sum, c) => sum + c.completed, 0),
      exercisesTotal: studyProgress.reduce((sum, c) => sum + c.total, 0),
      nextExam:
        studyProgress
          .filter((c) => c.daysUntilExam !== undefined && c.daysUntilExam >= 0)
          .sort((a, b) => (a.daysUntilExam ?? 999) - (b.daysUntilExam ?? 999))[0] || null,
      goalsActive: allGoals.length,
      goalsDueSoon: upcomingGoals.length,
      interviewsUpcoming: upcomingInterviews.length,
    },
  };
}
