'use client';

import { useState } from 'react';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { Plus, Clock, Target, Briefcase, GraduationCap } from 'lucide-react';
import { createTask, updateTask, toggleExercise } from '@/lib/api/daily-tasks';

interface TodayPriorities {
  goalsDueToday: Array<{
    id: string;
    title: string;
    category: string;
    metrics?: { current: number; target: number; unit: string };
    targetDate: string;
  }>;
  upcomingInterviews: Array<{
    id: string;
    company: string;
    position: string;
    interviewDate: string;
    daysUntil: number;
  }>;
  pendingFollowUps: Array<{
    id: string;
    company: string;
    position: string;
    applicationDate: string;
    daysSince: number;
  }>;
}

interface DailyTask {
  id: string;
  date: string;
  title: string;
  completed: boolean;
  source: string | null;
  sourceId: string | null;
  timeEstimate: string | null;
  createdAt: string;
}

interface StudyTask {
  id: string;
  courseId: string;
  courseName: string;
  exerciseNumber: number;
  examDate: string | null;
  daysUntilExam: number | null;
  urgency: 'urgent' | 'important' | 'normal';
}

interface CourseWithExercises {
  id: string;
  name: string;
  ects: number;
  numExercises: number;
  examDate?: Date;
  semester: string;
  createdAt: Date;
  exercises: Array<{
    id: string;
    courseId: string;
    exerciseNumber: number;
    completed: boolean;
    completedAt?: Date;
    createdAt: Date;
  }>;
}

async function fetchTodayPriorities(): Promise<TodayPriorities> {
  const response = await fetch('/api/dashboard/today');
  if (!response.ok) throw new Error('Failed to fetch priorities');
  return response.json();
}

async function fetchDailyTasks(date: string): Promise<DailyTask[]> {
  const response = await fetch(`/api/daily-tasks?date=${date}`);
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}

async function fetchStudyTasks(): Promise<StudyTask[]> {
  const response = await fetch('/api/dashboard/study-tasks');
  if (!response.ok) throw new Error('Failed to fetch study tasks');
  return response.json();
}

// NEW: Fetch complete course with all exercises
async function fetchCourse(courseId: string): Promise<CourseWithExercises> {
  const response = await fetch(`/api/courses/${courseId}`);
  if (!response.ok) throw new Error('Failed to fetch course');
  return response.json();
}

export default function FocusTasks() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [showAddInput, setShowAddInput] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const { data: priorities } = useQuery({
    queryKey: ['dashboard', 'today'],
    queryFn: fetchTodayPriorities,
  });

  const { data: dailyTasks = [] } = useQuery({
    queryKey: ['daily-tasks', today],
    queryFn: () => fetchDailyTasks(today),
  });

  const { data: studyTasks = [] } = useQuery({
    queryKey: ['study-tasks'],
    queryFn: fetchStudyTasks,
  });

  // NEW: Find E-Tech 1 course ID from studyTasks
  const eTech1Task = studyTasks.find((task) => task.courseName === 'E-Tech 1');
  const eTech1CourseId = eTech1Task?.courseId;
  
  console.log('🔍 [FocusTasks] Debug:', {
    studyTasksCount: studyTasks.length,
    eTech1Task,
    eTech1CourseId,
    enabled: !!eTech1CourseId,
  });

  // NEW: Fetch E-Tech 1 course with ALL exercises for client-side filtering
  const { data: eTech1Course } = useQuery({
    queryKey: ['course', eTech1CourseId],
    queryFn: () => {
      console.log('🔄 [FocusTasks] Fetching course:', eTech1CourseId);
      return fetchCourse(eTech1CourseId!);
    },
    enabled: !!eTech1CourseId, // Only fetch if we have the course ID
  });
  
  console.log('📦 [FocusTasks] eTech1Course:', eTech1Course);

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: async () => {
      // CRITICAL: Use refetchQueries to force immediate refetch
      await queryClient.refetchQueries({ queryKey: ['daily-tasks'] });
      await queryClient.refetchQueries({ queryKey: ['dashboard', 'today'] });
      setNewTaskTitle('');
      setNewTaskTime('');
      setShowAddInput(false);
    },
    onError: (error) => {
      console.error('Failed to create task:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      updateTask(id, completed),
    onSuccess: async () => {
      // CRITICAL: Use refetchQueries to force immediate refetch
      // invalidateQueries only marks as stale, doesn't refetch if component unmounted!
      await queryClient.refetchQueries({ queryKey: ['daily-tasks'] });
      await queryClient.refetchQueries({ queryKey: ['dashboard', 'today'] });
      // Clear hidden IDs after successful refetch
      setHiddenIds(new Set());
    },
    onError: (error, variables) => {
      // Remove from hidden if mutation failed
      setHiddenIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(variables.id);
        return newSet;
      });
      console.error('Failed to update task:', error);
    },
  });

  const toggleExerciseMutation = useMutation({
    mutationFn: ({ courseId, exerciseNumber, completed }: { courseId: string; exerciseNumber: number; completed: boolean }) =>
      toggleExercise(courseId, exerciseNumber, completed),
    onSuccess: async () => {
      // CRITICAL: Refetch E-Tech 1 course to get updated exercises!
      await queryClient.refetchQueries({ queryKey: ['course', 'E-Tech-1'] });
      await queryClient.refetchQueries({ queryKey: ['study-tasks'] });
      await queryClient.refetchQueries({ queryKey: ['courses'] });
      await queryClient.refetchQueries({ queryKey: ['dashboard', 'stats'] });
      await queryClient.refetchQueries({ queryKey: ['dashboard', 'today'] });
      // Clear hidden IDs after successful refetch
      setHiddenIds(new Set());
    },
    onError: (error, variables) => {
      // Remove from hidden if mutation failed
      const taskId = `study-${variables.courseId}-${variables.exerciseNumber}`;
      setHiddenIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
      console.error('Failed to toggle exercise:', error);
    },
  });

  const completeGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      if (!response.ok) throw new Error('Failed to complete goal');
      return response.json();
    },
    onSuccess: async () => {
      // CRITICAL: Wait for refetch to complete BEFORE clearing hiddenIds!
      await queryClient.refetchQueries({ queryKey: ['dashboard', 'today'] });
      await queryClient.refetchQueries({ queryKey: ['goals'] });
      // Clear hidden IDs only after successful refetch
      setHiddenIds(new Set());
    },
    onError: (error, goalId) => {
      // Remove from hidden if mutation failed
      const taskId = `goal-${goalId}`;
      setHiddenIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
      console.error('Failed to complete goal:', error);
    },
  });

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    createMutation.mutate({
      title: newTaskTitle.trim(),
      date: today,
      timeEstimate: newTaskTime.trim() || undefined,
    });
  };

  // Combine all tasks
  const allTasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    timeEstimate: string | undefined;
    urgency: 'urgent' | 'important' | 'normal';
    source?: string;
    examDays?: number | null;
  }> = [];

  // Add daily tasks
  dailyTasks.forEach((task) => {
    allTasks.push({
      id: task.id,
      title: task.title,
      completed: task.completed,
      timeEstimate: task.timeEstimate || undefined,
      urgency: 'normal',
      source: task.source || undefined,
    });
  });

  // REMOVED: Goals due today - user will add manually as daily tasks
  // REMOVED: Upcoming interviews - user will add manually as daily tasks

  // NEW: Add E-Tech 1 study task using CLIENT-SIDE filtering (ROBUST!)
  if (eTech1Course) {
    console.log('📚 [FocusTasks] E-Tech 1 Course:', {
      name: eTech1Course.name,
      totalExercises: eTech1Course.exercises.length,
      exercises: eTech1Course.exercises.map(ex => ({
        number: ex.exerciseNumber,
        completed: ex.completed,
      })),
    });

    // Find FIRST incomplete exercise
    const nextIncompleteExercise = eTech1Course.exercises
      .filter((ex) => !ex.completed)
      .sort((a, b) => a.exerciseNumber - b.exerciseNumber)[0];

    console.log('🎯 [FocusTasks] Next incomplete exercise:', nextIncompleteExercise);

    if (nextIncompleteExercise) {
      const daysUntilExam = eTech1Course.examDate
        ? Math.ceil((new Date(eTech1Course.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      const countdown = daysUntilExam !== null ? `Exam in ${daysUntilExam}d` : 'No exam date';
      
      // Determine urgency based on days until exam
      let urgency: 'urgent' | 'important' | 'normal' = 'normal';
      if (daysUntilExam !== null) {
        if (daysUntilExam < 45) urgency = 'urgent';
        else if (daysUntilExam <= 60) urgency = 'important';
      }

      allTasks.push({
        id: `study-${nextIncompleteExercise.id}`,
        title: `${eTech1Course.name}: Blatt ${nextIncompleteExercise.exerciseNumber}`,
        completed: false,
        timeEstimate: countdown,
        urgency,
        source: 'study',
        examDays: daysUntilExam,
      });

      console.log('✅ [FocusTasks] Added study task:', {
        title: `${eTech1Course.name}: Blatt ${nextIncompleteExercise.exerciseNumber}`,
        urgency,
        daysUntilExam,
      });
    } else {
      console.log('🎉 [FocusTasks] All E-Tech 1 exercises completed!');
    }
  }

  // Filter and sort
  const visibleTasks = allTasks.filter((task) => !hiddenIds.has(task.id) && !task.completed);
  const sortedTasks = [...visibleTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.completed) return 0;
    const typeOrder: Record<string, number> = { career: 0, study: 1, goal: 2, daily: 3 };
    const orderA = typeOrder[a.source || 'daily'] ?? 3;
    const orderB = typeOrder[b.source || 'daily'] ?? 3;
    if (orderA !== orderB) return orderA - orderB;
    const urgencyOrder = { urgent: 0, important: 1, normal: 2 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });

  const getUrgencyVariant = (urgency: string) => {
    if (urgency === 'urgent') return 'error';
    if (urgency === 'important') return 'warning';
    return 'default';
  };

  const getSourceIcon = (source?: string) => {
    if (source === 'goal') return <Target className="w-4 h-4" />;
    if (source === 'application' || source === 'career') return <Briefcase className="w-4 h-4" />;
    if (source === 'study') return <GraduationCap className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getExamColor = (days: number | null | undefined) => {
    if (days === null || days === undefined) return 'text-text-tertiary';
    if (days < 45) return 'text-error';
    if (days <= 60) return 'text-warning';
    return 'text-info';
  };

  const renderTaskRow = (task: (typeof sortedTasks)[number], index: number) => {
    const isStudy = task.source === 'study';
    const studyColor = isStudy ? getExamColor(task.examDays) : '';
    
    return (
      <motion.div
        key={task.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ delay: index * 0.05 }}
        className="group"
      >
        <div className="flex items-start gap-3 p-4 rounded-lg bg-surface border border-border hover:border-primary/50 transition-all">
          <Checkbox
            checked={task.completed || hiddenIds.has(task.id)}
            onCheckedChange={(checked) => {
              // Hide task immediately (optimistic update)
              setHiddenIds((prev) => new Set(prev).add(task.id));

              if (task.id.startsWith('study-')) {
                // NEW: Extract exercise ID from task, find it in eTech1Course
                const exerciseId = task.id.replace(/^study-/, '');
                
                if (eTech1Course) {
                  const exercise = eTech1Course.exercises.find((ex) => ex.id === exerciseId);
                  
                  if (exercise) {
                    console.log('🔄 [FocusTasks] Toggling exercise:', {
                      courseId: exercise.courseId,
                      exerciseNumber: exercise.exerciseNumber,
                      completed: checked,
                    });
                    
                    toggleExerciseMutation.mutate({
                      courseId: exercise.courseId,
                      exerciseNumber: exercise.exerciseNumber,
                      completed: checked,
                    });
                  } else {
                    console.error('❌ [FocusTasks] Exercise not found:', exerciseId);
                  }
                } else {
                  console.error('❌ [FocusTasks] E-Tech 1 course not loaded!');
                }
              } else if (task.id.startsWith('goal-')) {
                // GOAL TASK - Mark the actual goal as completed using mutation!
                const goalId = task.id.replace('goal-', '');
                
                if (checked) {
                  // Use mutation for proper async handling and refetch coordination
                  completeGoalMutation.mutate(goalId);
                }
              } else if (task.id.startsWith('interview-')) {
                // INTERVIEW TASK - Create a daily task (interviews can't be "completed")
                const interviewId = task.id.replace('interview-', '');
                const existingTask = dailyTasks.find((dt) => dt.sourceId === interviewId && dt.source === 'interview');

                if (existingTask) {
                  updateMutation.mutate({ id: existingTask.id, completed: true });
                } else if (checked) {
                  createMutation.mutate({
                    title: task.title,
                    date: today,
                    source: 'interview',
                    sourceId: interviewId,
                    timeEstimate: task.timeEstimate,
                  } as any);
                }
              } else {
                updateMutation.mutate({ id: task.id, completed: true });
              }
            }}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-medium ${studyColor || 'text-text-primary'}`}>
                {task.title}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {task.urgency !== 'normal' && (
                <Badge variant={getUrgencyVariant(task.urgency)} size="sm">
                  {task.urgency}
                </Badge>
              )}
              
              {task.source && (
                <div className="flex items-center gap-1 text-xs text-text-tertiary">
                  {getSourceIcon(task.source)}
                </div>
              )}
              
              {task.timeEstimate && (
                <div className={`flex items-center gap-1 text-xs ${isStudy ? studyColor : 'text-text-tertiary'} font-mono`}>
                  <Clock className="w-3 h-3" />
                  {task.timeEstimate}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="bg-surface/50 backdrop-blur-sm rounded-lg border border-border p-6 h-fit sticky top-20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Focus Today
        </h2>
        <Badge variant="primary" size="sm">
          {sortedTasks.length}
        </Badge>
      </div>

      <AnimatePresence mode="popLayout">
        {sortedTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-sm text-text-tertiary">No tasks for today</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {sortedTasks.map((task, index) => renderTaskRow(task, index))}
          </div>
        )}
      </AnimatePresence>

      {/* Add Task Button/Form */}
      <div className="mt-4 pt-4 border-t border-border">
        <AnimatePresence mode="wait">
          {showAddInput ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <input
                type="text"
                placeholder="Task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface text-text-primary border border-border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTask();
                  if (e.key === 'Escape') setShowAddInput(false);
                }}
                autoFocus
              />
              <input
                type="text"
                placeholder="Time (e.g. 2h, 30m)"
                value={newTaskTime}
                onChange={(e) => setNewTaskTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface text-text-primary border border-border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTask();
                  if (e.key === 'Escape') setShowAddInput(false);
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddTask}
                  className="flex-1 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddInput(false)}
                  className="px-3 py-2 text-sm bg-surface-hover text-text-secondary rounded-lg hover:bg-border transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddInput(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm bg-surface-hover text-text-secondary rounded-lg hover:bg-border hover:text-text-primary transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Quick Task
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
