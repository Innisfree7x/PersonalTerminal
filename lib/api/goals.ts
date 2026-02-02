import { Goal, CreateGoalInput } from '@/lib/schemas/goal.schema';

const API_BASE = '/api/goals';

/** Raw goal shape from API (dates as strings) */
interface GoalApiResponse {
  id: string;
  title: string;
  description?: string;
  targetDate: string;
  category: Goal['category'];
  metrics?: Goal['metrics'];
  createdAt: string;
}

/**
 * Fetch all goals from the API
 */
export async function fetchGoals(): Promise<Goal[]> {
  const response = await fetch(API_BASE, {
    cache: 'no-store', // Always fetch fresh data
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch goals: ${response.statusText}`);
  }
  
  const data: GoalApiResponse[] = await response.json();
  return data.map((goal) => ({
    ...goal,
    targetDate: new Date(goal.targetDate),
    createdAt: new Date(goal.createdAt),
  }));
}

/**
 * Create a new goal via the API
 */
export async function createGoal(goal: CreateGoalInput): Promise<Goal> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(goal),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to create goal: ${response.statusText}`);
  }
  
  const data: GoalApiResponse = await response.json();
  return {
    ...data,
    targetDate: new Date(data.targetDate),
    createdAt: new Date(data.createdAt),
  };
}

/**
 * Update an existing goal via the API
 */
export async function updateGoal(goalId: string, goal: CreateGoalInput): Promise<Goal> {
  const response = await fetch(`${API_BASE}/${goalId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(goal),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to update goal: ${response.statusText}`);
  }
  
  const data: GoalApiResponse = await response.json();
  return {
    ...data,
    targetDate: new Date(data.targetDate),
    createdAt: new Date(data.createdAt),
  };
}

/**
 * Delete a goal via the API
 */
export async function deleteGoal(goalId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${goalId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to delete goal: ${response.statusText}`);
  }
}
