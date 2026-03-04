export const DEMO_COURSES = [
  {
    name: 'Lineare Algebra II',
    ects: 6,
    numExercises: 12,
    examDate: '2026-03-15',
    semester: 'WS 2025/26',
  },
  {
    name: 'Theoretische Informatik',
    ects: 9,
    numExercises: 10,
    examDate: null as null,
    semester: 'WS 2025/26',
  },
] as const;

export const DEMO_GOALS = [
  {
    title: 'Alle Übungsblätter einreichen',
    category: 'learning' as const,
    targetDate: '2026-03-31',
  },
] as const;

export const DEMO_TASKS = [
  { title: 'Übungsblatt 8 lösen', timeEstimate: '2h' },
  { title: 'Klausurvorbereitung Kapitel 5', timeEstimate: '1h' },
  { title: 'Bewerbung für Praktikum vorbereiten', timeEstimate: '45m' },
] as const;

export const DEMO_TRAJECTORY_GOAL = {
  title: 'GMAT 680+ vorbereiten',
  category: 'gmat' as const,
  dueDate: '2026-11-30',
  effortHours: 180,
  bufferWeeks: 4,
  priority: 4,
  status: 'active' as const,
};

export const DEMO_TRAJECTORY_SETTINGS = {
  hoursPerWeek: 10,
  horizonMonths: 18,
} as const;
