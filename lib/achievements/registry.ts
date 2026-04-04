export interface AchievementCheckInput {
  streakDays: number;
  tasksCompletedAllTime: number;
  passedModulesCount: number;
  trajectoryScore: number;
  focusMinutesAllTime: number;
}

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  roomItemReward?: string;
  condition: (data: AchievementCheckInput) => boolean;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  {
    key: 'first_task',
    title: 'Erste Aufgabe erledigt',
    description: 'Du hast deine allererste Aufgabe abgeschlossen.',
    condition: (d) => d.tasksCompletedAllTime >= 1,
  },
  {
    key: 'week_streak',
    title: '7-Tage-Streak',
    description: '7 Tage in Folge aktiv gewesen.',
    condition: (d) => d.streakDays >= 7,
  },
  {
    key: 'month_streak',
    title: '30-Tage-Streak',
    description: 'Ein ganzer Monat ohne Pause — beeindruckend.',
    condition: (d) => d.streakDays >= 30,
  },
  {
    key: 'hundred_streak',
    title: '100-Tage-Legende',
    description: '100 Tage durchgehend aktiv. Legendär.',
    roomItemReward: 'legendary_flame_stand',
    condition: (d) => d.streakDays >= 100,
  },
  {
    key: 'first_module',
    title: 'Erstes Modul bestanden',
    description: 'Dein erstes Uni-Modul mit Note abgeschlossen.',
    condition: (d) => d.passedModulesCount >= 1,
  },
  {
    key: 'five_modules',
    title: '5 Module bestanden',
    description: '5 Module geschafft — das Regal füllt sich.',
    roomItemReward: 'full_bookshelf',
    condition: (d) => d.passedModulesCount >= 5,
  },
  {
    key: 'focus_hour',
    title: '1 Stunde fokussiert',
    description: 'Insgesamt 60 Minuten in Fokus-Sessions verbracht.',
    condition: (d) => d.focusMinutesAllTime >= 60,
  },
  {
    key: 'trajectory_green',
    title: 'Trajectory im grünen Bereich',
    description: 'Dein Trajectory-Score hat 80+ erreicht.',
    roomItemReward: 'desk_plant_large',
    condition: (d) => d.trajectoryScore >= 80,
  },
] as const;

export const ACHIEVEMENT_KEYS = new Set(ACHIEVEMENTS.map((a) => a.key));
