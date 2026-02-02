'use client';

import { useState } from 'react';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

async function toggleExercise(courseId: string, exerciseNumber: number, completed: boolean): Promise<void> {
  const response = await fetch(`/api/courses/${courseId}/exercises/${exerciseNumber}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  });
  if (!response.ok) throw new Error('Failed to toggle exercise');
}

async function createTask(task: {
  title: string;
  date: string;
  source?: string;
  sourceId?: string;
  timeEstimate?: string | null;
}): Promise<DailyTask> {
  const response = await fetch('/api/daily-tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...task,
      source: task.source || 'manual',
      completed: false,
      timeEstimate: task.timeEstimate || null,
    }),
  });
  if (!response.ok) throw new Error('Failed to create task');
  return response.json();
}

async function updateTask(id: string, completed: boolean): Promise<DailyTask> {
  const response = await fetch(`/api/daily-tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  });
  if (!response.ok) throw new Error('Failed to update task');
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

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
      setNewTaskTitle('');
      setNewTaskTime('');
      setShowAddInput(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      updateTask(id, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
    },
  });

  const toggleExerciseMutation = useMutation({
    mutationFn: ({ courseId, exerciseNumber, completed }: { courseId: string; exerciseNumber: number; completed: boolean }) =>
      toggleExercise(courseId, exerciseNumber, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
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

  // Add goals due today
  priorities?.goalsDueToday.forEach((goal) => {
    allTasks.push({
      id: `goal-${goal.id}`,
      title: goal.title,
      completed: false,
      timeEstimate: undefined,
      urgency: 'urgent',
      source: 'goal',
    });
  });

  // Add upcoming interviews
  priorities?.upcomingInterviews.forEach((interview) => {
    const urgency = interview.daysUntil === 0 ? 'urgent' : interview.daysUntil <= 1 ? 'important' : 'normal';
    allTasks.push({
      id: `interview-${interview.id}`,
      title: `${interview.company} - ${interview.position}`,
      completed: false,
      timeEstimate: '2h',
      urgency,
      source: 'application',
    });
  });

  // Add study tasks (one per course, ordered by exam_date in backend)
  studyTasks.forEach((studyTask) => {
    const countdown = studyTask.daysUntilExam !== null ? `Exam in ${studyTask.daysUntilExam}d` : 'No exam date';
    allTasks.push({
      id: `study-${studyTask.id}`,
      title: `${studyTask.courseName}: Blatt ${studyTask.exerciseNumber}`,
      completed: false,
      timeEstimate: countdown,
      urgency: studyTask.urgency,
      source: 'study',
      examDays: studyTask.daysUntilExam,
    });
  });

  // Sort: uncompleted first, then by urgency, then completed at bottom
  // Only show tasks that are not already hidden (optimistic completed)
  const visibleTasks = allTasks.filter((task) => !hiddenIds.has(task.id) && !task.completed);

  const sortedTasks = [...visibleTasks].sort((a, b) => {
    // keep completed at bottom but still visible
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.completed) return 0;
    // order by type: career -> study -> goal -> daily/manual
    const typeOrder: Record<string, number> = { career: 0, study: 1, goal: 2, daily: 3 };
    const orderA = typeOrder[a.source || 'daily'] ?? 3;
    const orderB = typeOrder[b.source || 'daily'] ?? 3;
    if (orderA !== orderB) return orderA - orderB;
    // then by urgency
    const urgencyOrder = { urgent: 0, important: 1, normal: 2 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });

  const urgencyColors = {
    urgent: 'text-red-400',
    important: 'text-yellow-400',
    normal: 'text-gray-400 dark:text-gray-500',
  };

  const urgencyIcons = {
    urgent: '🔴',
    important: '🟡',
    normal: '',
  };

  const getExamColor = (days: number | null | undefined) => {
    if (days === null || days === undefined) return 'text-gray-400';
    if (days < 45) return 'text-red-400';
    if (days <= 60) return 'text-yellow-400';
    return 'text-blue-400';
  };

  const renderTaskRow = (task: (typeof sortedTasks)[number]) => {
    const isStudy = task.source === 'study';
    const studyColor = isStudy ? getExamColor(task.examDays) : '';
    return (
      <div
        key={task.id}
        className="flex items-start gap-2 p-2 rounded border border-gray-800 dark:border-gray-700 hover:bg-gray-800/50 dark:hover:bg-gray-700/30 transition-colors"
      >
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(e) => {
            // optimistic hide
            setHiddenIds((prev) => new Set(prev).add(task.id));

            if (task.id.startsWith('study-')) {
              const studyTaskId = task.id.replace(/^study-/, '');
              const studyTask = studyTasks.find((st) => st.id === studyTaskId);
              if (studyTask) {
                toggleExerciseMutation.mutate({
                  courseId: studyTask.courseId,
                  exerciseNumber: studyTask.exerciseNumber,
                  completed: e.target.checked,
                });
              }
            } else if (task.id.startsWith('goal-') || task.id.startsWith('interview-')) {
              const sourceId = task.id.replace(/^(goal|interview)-/, '');
              const existingTask = dailyTasks.find((dt) => dt.sourceId === sourceId && dt.source === task.source);

              if (existingTask) {
                updateMutation.mutate({ id: existingTask.id, completed: true });
              } else if (e.target.checked) {
                // create once as completed to persist, but avoid duplicates
                createMutation.mutate({
                  title: task.title,
                  date: today,
                  source: task.source || 'manual',
                  sourceId,
                  timeEstimate: task.timeEstimate,
                  completed: true,
                } as any);
              }
            } else {
              updateMutation.mutate({ id: task.id, completed: true });
            }
          }}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div
            className={`text-sm font-medium ${
              task.completed ? 'line-through text-gray-500 dark:text-gray-500' : `text-gray-200 dark:text-gray-200 ${studyColor}`
            }`}
          >
            <span className="mr-1">{urgencyIcons[task.urgency]}</span>
            {task.title}
          </div>
          {task.timeEstimate && (
            <div
              className={`text-xs mt-0.5 font-mono ${
                isStudy ? `${studyColor} font-semibold` : 'text-gray-500 dark:text-gray-500'
              }`}
            >
              {task.timeEstimate}
            </div>
          )}
        </div>
        <button className="text-xs text-gray-500 dark:text-gray-500 hover:text-gray-400 dark:hover:text-gray-400">⏰</button>
      </div>
    );
  };

  const studyTaskRows = sortedTasks.filter((t) => t.source === 'study');
  const otherTaskRows = sortedTasks.filter((t) => t.source !== 'study');

  return (
    <div className="bg-gray-900/50 dark:bg-gray-800/50 rounded-lg border border-gray-700 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-100 dark:text-gray-100">
          🎯 Focus Today
        </h2>
      </div>

      {/* Study Tasks Section */}
      {studyTaskRows.length > 0 && (
        <div className="space-y-2 mb-3">
          <div className="text-sm font-semibold text-gray-100 dark:text-gray-100 flex items-center gap-2">
            🎓 Study Tasks
          </div>
          {studyTaskRows.map((task) => renderTaskRow(task))}
        </div>
      )}

      {/* Other Tasks */}
      <div className="space-y-2">
        {otherTaskRows.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-500 py-4 text-center">No tasks for today</p>
        ) : (
          otherTaskRows.map((task) => renderTaskRow(task))
        )}
      </div>

      {showAddInput ? (
        <div className="mt-4 p-2 border border-gray-700 dark:border-gray-700 rounded">
          <input
            type="text"
            placeholder="Task title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="w-full px-2 py-1 text-sm bg-gray-800 dark:bg-gray-900 text-gray-100 dark:text-gray-100 border border-gray-700 dark:border-gray-600 rounded mb-2"
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
            className="w-full px-2 py-1 text-sm bg-gray-800 dark:bg-gray-900 text-gray-100 dark:text-gray-100 border border-gray-700 dark:border-gray-600 rounded mb-2 font-mono"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTask();
              if (e.key === 'Escape') setShowAddInput(false);
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddTask}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddInput(false)}
              className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddInput(true)}
          className="mt-4 w-full px-3 py-2 text-sm bg-gray-800 dark:bg-gray-700 text-gray-300 dark:text-gray-300 rounded hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
        >
          + Add Quick Task
        </button>
      )}
    </div>
  );
}
