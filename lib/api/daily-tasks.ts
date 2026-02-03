/**
 * API helper functions for daily tasks
 */

export interface DailyTask {
  id: string;
  title: string;
  completed: boolean;
  date: Date;
  timeEstimate?: string;
  source?: string;
  sourceId?: string;
  createdAt: Date;
}

export interface CreateTaskInput {
  title: string;
  date: string; // ISO date string (YYYY-MM-DD)
  timeEstimate?: string;
  source?: string;
  sourceId?: string;
}

const API_BASE = '/api/daily-tasks';

/**
 * Fetch daily tasks for a specific date
 */
export async function fetchDailyTasks(date: string): Promise<DailyTask[]> {
  const response = await fetch(`${API_BASE}?date=${date}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch daily tasks: ${response.statusText}`);
  }

  const data = await response.json();
  return data.map((task: any) => ({
    ...task,
    date: new Date(task.date),
    createdAt: new Date(task.createdAt),
  }));
}

/**
 * Create a new daily task
 */
export async function createTask(task: CreateTaskInput): Promise<DailyTask> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...task,
      source: task.source || 'manual',
      completed: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to create task: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    ...data,
    date: new Date(data.date),
    createdAt: new Date(data.createdAt),
  };
}

/**
 * Update a daily task (mark as completed/uncompleted)
 */
export async function updateTask(id: string, completed: boolean): Promise<DailyTask> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ completed }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to update task: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    ...data,
    date: new Date(data.date),
    createdAt: new Date(data.createdAt),
  };
}

/**
 * Delete a daily task
 */
export async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to delete task: ${response.statusText}`);
  }
}

/**
 * Toggle exercise completion (for study tasks from courses)
 */
export async function toggleExercise(
  courseId: string,
  exerciseNumber: number,
  completed: boolean
): Promise<void> {
  const response = await fetch(`/api/courses/${courseId}/exercises/${exerciseNumber}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ completed }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to toggle exercise: ${response.statusText}`);
  }
}
