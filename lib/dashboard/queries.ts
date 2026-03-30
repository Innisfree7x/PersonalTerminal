import { addDays, differenceInDays, endOfWeek, startOfDay, startOfWeek, subDays } from 'date-fns';
import { createClient } from '@/lib/auth/server';
import { fetchCoursesWithExercises } from '@/lib/supabase/courses';
import type { TrajectoryMorningSnapshotPayload } from '@/lib/trajectory/morningSnapshot';
import type { DashboardWeekEventsPayload } from '@/lib/dashboard/weekEvents';
import {
  computeDailyExecutionScore,
  pickNextBestAction,
  type ExecutionCandidate,
  type ExecutionActionType,
  type ExecutionRiskSignal,
  type RankedExecutionCandidate,
} from '@/lib/application/use-cases/execution-engine';

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
  expectedGrade?: number;
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

export interface DashboardKitSignals {
  nextCampusEvent: {
    title: string;
    startsAt: string;
    kind: string;
    location: string | null;
  } | null;
  nextCampusExam: {
    title: string;
    startsAt: string;
    location: string | null;
  } | null;
  latestCampusGrade: {
    moduleTitle: string;
    gradeLabel: string;
    publishedAt: string | null;
  } | null;
  freshIliasItems: number;
  latestIliasItem: {
    favoriteTitle: string;
    title: string;
    itemType: string;
    publishedAt: string | null;
    itemUrl: string | null;
  } | null;
  upcomingEventsCount: number;
}

export interface DashboardNextTasksResponse {
  homeworks: NextHomework[];
  goals: NextGoal[];
  interviews: NextInterview[];
  studyProgress: StudyProgressCourse[];
  nextBestAction: RankedExecutionCandidate | null;
  nextBestAlternatives: RankedExecutionCandidate[];
  riskSignals: ExecutionRiskSignal[];
  executionScore: number;
  meta: {
    generatedAt: string;
    queryDurationMs: number;
  };
  stats: DashboardTaskStats;
  kitSignals: DashboardKitSignals | null;
  trajectoryMorning?: TrajectoryMorningSnapshotPayload;
  weekEvents?: DashboardWeekEventsPayload;
}

interface DashboardDailyTask {
  id: string;
  title: string;
  completed: boolean;
  date: string;
  timeEstimate: string | null;
}

interface DashboardGoalRecord {
  id: string;
  title: string;
  category: string;
  target_date: string;
  metrics_current: number | null;
  metrics_target: number | null;
  metrics_unit: string | null;
}

interface DashboardApplicationRecord {
  id: string;
  company: string;
  position: string;
  status: 'applied' | 'interview' | 'offer' | 'rejected';
  application_date: string;
  interview_date: string | null;
  updated_at: string;
}

function toGoalModel(record: DashboardGoalRecord) {
  return {
    id: record.id,
    title: record.title,
    category: record.category,
    targetDate: new Date(record.target_date),
    metrics:
      record.metrics_current !== null && record.metrics_target !== null && record.metrics_unit
        ? {
            current: record.metrics_current,
            target: record.metrics_target,
            unit: record.metrics_unit,
          }
        : undefined,
  };
}

function toApplicationModel(record: DashboardApplicationRecord) {
  return {
    id: record.id,
    company: record.company,
    position: record.position,
    status: record.status,
    applicationDate: new Date(record.application_date),
    interviewDate: record.interview_date ? new Date(record.interview_date) : undefined,
    updatedAt: new Date(record.updated_at),
  };
}

function isMissingKitRelationError(error: { code?: string } | null | undefined) {
  return error?.code === '42P01' || error?.code === '42703';
}

async function getDashboardKitSignals(
  userId: string,
  supabase: ReturnType<typeof createClient>,
  todayStart: Date
): Promise<DashboardKitSignals | null> {
  const nowIso = todayStart.toISOString();
  const freshIliasThreshold = subDays(todayStart, 7).toISOString();
  const weekEndIso = addDays(todayStart, 7).toISOString();

  const [
    nextCampusEventResult,
    nextCampusExamResult,
    latestCampusGradeResult,
    freshIliasItemsResult,
    latestIliasItemResult,
    upcomingEventsCountResult,
  ] = await Promise.all([
    supabase
      .from('kit_campus_events')
      .select('title, starts_at, kind, location')
      .eq('user_id', userId)
      .gte('starts_at', nowIso)
      .order('starts_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('kit_campus_events')
      .select('title, starts_at, location')
      .eq('user_id', userId)
      .eq('kind', 'exam')
      .gte('starts_at', nowIso)
      .order('starts_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('kit_campus_grades')
      .select('module_id, grade_label, published_at')
      .eq('user_id', userId)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('kit_ilias_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('acknowledged_at', null)
      .gte('first_seen_at', freshIliasThreshold),
    supabase
      .from('kit_ilias_items')
      .select('title, item_type, published_at, item_url, favorite_id')
      .eq('user_id', userId)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('first_seen_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('kit_campus_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('starts_at', nowIso)
      .lt('starts_at', weekEndIso),
  ]);

  const handledErrors = [
    nextCampusEventResult.error,
    nextCampusExamResult.error,
    latestCampusGradeResult.error,
    freshIliasItemsResult.error,
    latestIliasItemResult.error,
    upcomingEventsCountResult.error,
  ];
  const fatalError = handledErrors.find((error) => error && !isMissingKitRelationError(error));
  if (fatalError) {
    throw new Error(`Failed to fetch KIT dashboard signals: ${fatalError.message}`);
  }

  let latestCampusGradeModuleTitle: string | null = null;
  if (latestCampusGradeResult.data?.module_id && !isMissingKitRelationError(latestCampusGradeResult.error)) {
    const { data: moduleRow, error: moduleError } = await supabase
      .from('kit_campus_modules')
      .select('title')
      .eq('id', latestCampusGradeResult.data.module_id)
      .maybeSingle();

    if (moduleError && !isMissingKitRelationError(moduleError)) {
      throw new Error(`Failed to fetch KIT grade module title: ${moduleError.message}`);
    }

    latestCampusGradeModuleTitle = moduleRow?.title ?? null;
  }

  let latestIliasFavoriteTitle: string | null = null;
  if (latestIliasItemResult.data?.favorite_id && !isMissingKitRelationError(latestIliasItemResult.error)) {
    const { data: favoriteRow, error: favoriteError } = await supabase
      .from('kit_ilias_favorites')
      .select('title')
      .eq('id', latestIliasItemResult.data.favorite_id)
      .maybeSingle();

    if (favoriteError && !isMissingKitRelationError(favoriteError)) {
      throw new Error(`Failed to fetch KIT ILIAS favorite title: ${favoriteError.message}`);
    }

    latestIliasFavoriteTitle = favoriteRow?.title ?? null;
  }

  const signals: DashboardKitSignals = {
    nextCampusEvent: nextCampusEventResult.data
      ? {
          title: nextCampusEventResult.data.title,
          startsAt: nextCampusEventResult.data.starts_at,
          kind: nextCampusEventResult.data.kind,
          location: nextCampusEventResult.data.location ?? null,
        }
      : null,
    nextCampusExam: nextCampusExamResult.data
      ? {
          title: nextCampusExamResult.data.title,
          startsAt: nextCampusExamResult.data.starts_at,
          location: nextCampusExamResult.data.location ?? null,
        }
      : null,
    latestCampusGrade:
      latestCampusGradeResult.data && latestCampusGradeModuleTitle
        ? {
            moduleTitle: latestCampusGradeModuleTitle,
            gradeLabel: latestCampusGradeResult.data.grade_label,
            publishedAt: latestCampusGradeResult.data.published_at,
          }
        : null,
    freshIliasItems: freshIliasItemsResult.count ?? 0,
    latestIliasItem:
      latestIliasItemResult.data && latestIliasFavoriteTitle
        ? {
            favoriteTitle: latestIliasFavoriteTitle,
            title: latestIliasItemResult.data.title,
            itemType: latestIliasItemResult.data.item_type,
            publishedAt: latestIliasItemResult.data.published_at,
            itemUrl: latestIliasItemResult.data.item_url,
          }
        : null,
    upcomingEventsCount: upcomingEventsCountResult.count ?? 0,
  };

  return signals.nextCampusEvent ||
    signals.nextCampusExam ||
    signals.latestCampusGrade ||
    signals.latestIliasItem ||
    signals.freshIliasItems > 0 ||
    signals.upcomingEventsCount > 0
    ? signals
    : null;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const supabase = createClient();

  const [
    { data: goalsData, error: goalsError },
    { data: applicationsData, error: applicationsError },
    { data: coursesData, error: coursesError },
    { count: totalExercisesCount, error: totalExercisesError },
    { count: completedExercisesCount, error: completedExercisesError },
    { count: weekCompletedCount, error: weekCompletedError },
  ] = await Promise.all([
    supabase
      .from('goals')
      .select('id, title, category, target_date, metrics_current, metrics_target, metrics_unit')
      .eq('user_id', userId),
    supabase
      .from('job_applications')
      .select('id, company, position, status, application_date, interview_date, updated_at')
      .eq('user_id', userId),
    supabase
      .from('courses')
      .select('id, name, exam_date')
      .eq('user_id', userId),
    supabase
      .from('exercise_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('exercise_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true),
    supabase
      .from('exercise_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('completed_at', weekStart.toISOString())
      .lte('completed_at', today.toISOString()),
  ]);

  if (goalsError) {
    throw new Error(`Failed to fetch dashboard goals: ${goalsError.message}`);
  }
  if (applicationsError) {
    throw new Error(`Failed to fetch dashboard applications: ${applicationsError.message}`);
  }
  if (coursesError) {
    throw new Error(`Failed to fetch dashboard courses: ${coursesError.message}`);
  }
  if (totalExercisesError) {
    throw new Error(`Failed to fetch dashboard total exercises count: ${totalExercisesError.message}`);
  }
  if (completedExercisesError) {
    throw new Error(`Failed to fetch dashboard completed exercises count: ${completedExercisesError.message}`);
  }
  if (weekCompletedError) {
    throw new Error(`Failed to fetch dashboard week-completed exercises count: ${weekCompletedError.message}`);
  }

  const allGoals = (goalsData as DashboardGoalRecord[] | null ?? []).map(toGoalModel);
  const allApplications = (applicationsData as DashboardApplicationRecord[] | null ?? []).map(
    toApplicationModel
  );

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

  const weekCompletedExercises = weekCompletedCount ?? 0;
  const totalExercises = totalExercisesCount ?? 0;
  const completedExercises = completedExercisesCount ?? 0;
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
  const startedAt = Date.now();
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayIsoDate = today.toISOString().split('T')[0] ?? '';
  const goalWindowStart = subDays(todayStart, 14).toISOString().split('T')[0] ?? todayIsoDate;
  const goalWindowEnd = addDays(todayStart, 30).toISOString().split('T')[0] ?? todayIsoDate;
  const supabase = createClient();

  const [
    courses,
    { data: goalsData, error: goalsError },
    { data: applicationsData, error: applicationsError },
  ] = await Promise.all([
    fetchCoursesWithExercises(userId),
    supabase
      .from('goals')
      .select('id, title, category, target_date, metrics_current, metrics_target, metrics_unit')
      .eq('user_id', userId)
      .gte('target_date', goalWindowStart)
      .lte('target_date', goalWindowEnd)
      .order('target_date', { ascending: true })
      .limit(5),
    supabase
      .from('job_applications')
      .select('id, company, position, status, application_date, interview_date, updated_at')
      .eq('user_id', userId)
      .in('status', ['applied', 'interview'])
      .order('interview_date', { ascending: true, nullsFirst: false })
      .order('application_date', { ascending: true })
      .limit(5),
  ]);

  if (goalsError) {
    throw new Error(`Failed to fetch dashboard goals: ${goalsError.message}`);
  }
  if (applicationsError) {
    throw new Error(`Failed to fetch dashboard applications: ${applicationsError.message}`);
  }

  const allGoals = (goalsData as DashboardGoalRecord[] | null ?? []).map(toGoalModel);
  const applications = (applicationsData as DashboardApplicationRecord[] | null ?? []).map(
    toApplicationModel
  );

  const homeworks: NextHomework[] = [];

  for (const course of courses) {
    let completedCount = 0;
    let nextExercise: (typeof course.exercises)[number] | null = null;
    for (const exercise of course.exercises) {
      if (exercise.completed) {
        completedCount += 1;
        continue;
      }
      if (!nextExercise || exercise.exerciseNumber < nextExercise.exerciseNumber) {
        nextExercise = exercise;
      }
    }

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
      ...(course.expectedGrade !== undefined ? { expectedGrade: course.expectedGrade } : {}),
    };
  });

  const [
    { data: dailyTasksData, error: dailyTasksError },
    { data: completedExercisesTodayData, error: completedExercisesTodayError },
    kitSignals,
  ] = await Promise.all([
    supabase
      .from('daily_tasks')
      .select('id, title, completed, date, time_estimate')
      .eq('user_id', userId)
      .eq('date', todayIsoDate),
    supabase
      .from('exercise_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('completed_at', todayStart.toISOString())
      .lt('completed_at', new Date(todayStart.getTime() + 24 * 60 * 60 * 1000).toISOString()),
    getDashboardKitSignals(userId, supabase, todayStart),
  ]);

  if (dailyTasksError) {
    throw new Error(`Failed to fetch daily tasks for dashboard next tasks: ${dailyTasksError.message}`);
  }
  if (completedExercisesTodayError) {
    throw new Error(
      `Failed to fetch completed exercises for dashboard next tasks: ${completedExercisesTodayError.message}`
    );
  }

  const dailyTasks: DashboardDailyTask[] = (dailyTasksData || []).map((task) => ({
    id: task.id,
    title: task.title,
    completed: task.completed,
    date: task.date,
    timeEstimate: task.time_estimate,
  }));

  const executionCandidates: ExecutionCandidate[] = [];

  dailyTasks
    .filter((task) => !task.completed)
    .forEach((task) => {
      executionCandidates.push({
        id: `dt-${task.id}`,
        type: 'daily-task' as ExecutionActionType,
        title: task.title,
        dueDate: todayStart,
        impact: 3,
        effort: task.timeEstimate ? 3 : 2,
        payload: { taskId: task.id },
      });
    });

  homeworks.forEach((homework) => {
    executionCandidates.push({
      id: homework.id,
      type: 'homework' as ExecutionActionType,
      title: `${homework.courseName} - Blatt ${homework.exerciseNumber}`,
      impact: 4,
      effort: 3,
      payload: {
        courseId: homework.courseId,
        exerciseNumber: homework.exerciseNumber,
      },
      ...(homework.daysUntilExam !== undefined
        ? {
            subtitle: `Exam in ${homework.daysUntilExam}d`,
            dueDate: new Date(todayStart.getTime() + homework.daysUntilExam * 24 * 60 * 60 * 1000),
          }
        : {}),
    });
  });

  allGoals.forEach((goal) => {
    const dueDate = startOfDay(goal.targetDate);
    const daysUntilGoal = differenceInDays(dueDate, todayStart);
    const progressRatio =
      goal.metrics && goal.metrics.target > 0 ? goal.metrics.current / goal.metrics.target : null;

    executionCandidates.push({
      id: `goal-${goal.id}`,
      type: 'goal' as ExecutionActionType,
      title: goal.title,
      subtitle: daysUntilGoal < 0 ? `${Math.abs(daysUntilGoal)}d overdue` : `Due in ${daysUntilGoal}d`,
      dueDate,
      impact: goal.category === 'career' || goal.category === 'learning' ? 4 : 3,
      effort:
        progressRatio !== null && progressRatio >= 0.7
          ? 2
          : 3,
      payload: { goalId: goal.id },
    });
  });

  applications
    .filter((app) => app.status === 'interview' && app.interviewDate)
    .forEach((app) => {
      if (!app.interviewDate) return;
      executionCandidates.push({
        id: `interview-${app.id}`,
        type: 'interview' as ExecutionActionType,
        title: `${app.company} Interview Prep`,
        subtitle: app.position,
        dueDate: startOfDay(app.interviewDate),
        impact: 5,
        effort: 2,
        payload: { applicationId: app.id },
      });
    });

  const nextBest = pickNextBestAction(executionCandidates);
  const overdueCandidates = executionCandidates.filter((candidate) => {
    if (!candidate.dueDate) return false;
    return differenceInDays(startOfDay(candidate.dueDate), todayStart) < 0;
  }).length;

  const tasksCompleted = dailyTasks.filter((t) => t.completed).length;
  const completedExercisesToday = completedExercisesTodayData?.length ?? 0;
  const completedToday = tasksCompleted + completedExercisesToday;
  const tasksTotal = dailyTasks.length + homeworks.length;
  const executionScore = computeDailyExecutionScore({
    openCandidates: executionCandidates.length,
    overdueCandidates,
    completedToday,
    plannedToday: tasksTotal,
  });

  const riskSignals: ExecutionRiskSignal[] = [];
  if (studyProgress.some((course) => typeof course.daysUntilExam === 'number' && course.daysUntilExam <= 14)) {
    const criticalExam = studyProgress
      .filter((course) => typeof course.daysUntilExam === 'number')
      .sort((a, b) => (a.daysUntilExam ?? 999) - (b.daysUntilExam ?? 999))[0];
    if (criticalExam) {
      riskSignals.push({
        id: 'exam-window',
        severity: (criticalExam.daysUntilExam ?? 0) <= 7 ? 'critical' : 'high',
        title: 'Exam risk window',
        detail: `${criticalExam.name} in ${criticalExam.daysUntilExam}d`,
      });
    }
  }

  const urgentInterview = upcomingInterviews.find((interview) => interview.daysUntil <= 3);
  if (urgentInterview) {
    riskSignals.push({
      id: `interview-${urgentInterview.id}`,
      severity: urgentInterview.daysUntil <= 1 ? 'critical' : 'high',
      title: 'Interview preparation urgency',
      detail: `${urgentInterview.company} in ${urgentInterview.daysUntil}d`,
    });
  }

  if (overdueCandidates >= 4) {
    riskSignals.push({
      id: 'overdue-backlog',
      severity: overdueCandidates >= 8 ? 'critical' : 'high',
      title: 'Backlog pressure rising',
      detail: `${overdueCandidates} overdue actions detected`,
    });
  }

  if (executionScore < 45) {
    riskSignals.push({
      id: 'execution-score',
      severity: executionScore < 30 ? 'critical' : 'medium',
      title: 'Execution score is low',
      detail: `Current score ${executionScore}/100`,
    });
  }

  return {
    homeworks,
    goals: upcomingGoals,
    interviews: upcomingInterviews,
    studyProgress,
    nextBestAction: nextBest.primary,
    nextBestAlternatives: nextBest.alternatives,
    riskSignals,
    executionScore,
    meta: {
      generatedAt: new Date().toISOString(),
      queryDurationMs: Date.now() - startedAt,
    },
    kitSignals,
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
