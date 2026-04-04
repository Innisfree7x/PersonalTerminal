export interface RoomInput {
  momentumScore: number;
  streakDays: number;
  tasksCompletedToday: number;
  tasksTotalToday: number;
  passedModulesCount: number;
}

export interface RoomState {
  lightLevel: 0 | 1 | 2 | 3 | 4 | 5;
  lucianPose: 'sleeping' | 'idle' | 'working' | 'celebrating';
  streakFlameLevel: 'none' | 'small' | 'medium' | 'large' | 'legendary';
  timeOfDay: 'morning' | 'day' | 'evening' | 'night';
  plantStage: 0 | 1 | 2 | 3;
  bookCount: 0 | 1 | 2 | 3 | 4 | 5;
  windowGlow: 'dawn' | 'day' | 'dusk' | 'night';
}

/** Achievement-driven room decorations (LucianRoom rendering). */
export interface ActiveRoomItems {
  hasLegendaryFlameStand: boolean;
  hasFullBookshelf: boolean;
  hasDeskPlantLarge: boolean;
}

function computeLightLevel(momentumScore: number): RoomState['lightLevel'] {
  return Math.min(5, Math.round(momentumScore / 20)) as RoomState['lightLevel'];
}

function computeLucianPose(momentumScore: number): RoomState['lucianPose'] {
  if (momentumScore < 20) return 'sleeping';
  if (momentumScore < 50) return 'idle';
  if (momentumScore < 80) return 'working';
  return 'celebrating';
}

function computeStreakFlameLevel(streakDays: number): RoomState['streakFlameLevel'] {
  if (streakDays <= 0) return 'none';
  if (streakDays <= 6) return 'small';
  if (streakDays <= 29) return 'medium';
  if (streakDays <= 99) return 'large';
  return 'legendary';
}

function computeTimeOfDay(hour: number): RoomState['timeOfDay'] {
  if (hour >= 5 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 18) return 'day';
  if (hour >= 18 && hour < 21) return 'evening';
  return 'night';
}

function computeWindowGlow(timeOfDay: RoomState['timeOfDay']): RoomState['windowGlow'] {
  switch (timeOfDay) {
    case 'morning': return 'dawn';
    case 'day': return 'day';
    case 'evening': return 'dusk';
    case 'night': return 'night';
  }
}

function computePlantStage(completed: number, total: number): RoomState['plantStage'] {
  if (total <= 0) return 0;
  const ratio = completed / total;
  if (ratio >= 1) return 3;
  if (ratio >= 0.75) return 2;
  if (ratio >= 0.25) return 1;
  return 0;
}

export function computeRoomState(input: RoomInput, now?: Date): RoomState {
  const currentHour = (now ?? new Date()).getHours();
  const timeOfDay = computeTimeOfDay(currentHour);

  return {
    lightLevel: computeLightLevel(input.momentumScore),
    lucianPose: computeLucianPose(input.momentumScore),
    streakFlameLevel: computeStreakFlameLevel(input.streakDays),
    timeOfDay,
    plantStage: computePlantStage(input.tasksCompletedToday, input.tasksTotalToday),
    bookCount: Math.min(input.passedModulesCount, 5) as RoomState['bookCount'],
    windowGlow: computeWindowGlow(timeOfDay),
  };
}

export const DEFAULT_ROOM_STATE: RoomState = {
  lightLevel: 1,
  lucianPose: 'idle',
  streakFlameLevel: 'none',
  timeOfDay: 'day',
  plantStage: 0,
  bookCount: 0,
  windowGlow: 'day',
};
