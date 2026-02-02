import { z } from 'zod';

export const createCourseSchema = z.object({
  name: z.string().min(1, 'Course name is required').max(200),
  ects: z.number().min(1, 'ECTS must be at least 1').max(15, 'ECTS cannot exceed 15'),
  numExercises: z.number().min(1, 'At least 1 exercise required').max(20, 'Maximum 20 exercises'),
  examDate: z
    .preprocess(
      (arg) => {
        if (arg === null || arg === undefined || arg === '') return undefined;
        if (typeof arg === 'string' || arg instanceof Date) {
          return new Date(arg);
        }
        return arg;
      },
      z.date().optional()
    )
    .optional(),
  semester: z.string().min(1, 'Semester is required').max(50),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const CourseSchema = createCourseSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
});

export type Course = z.infer<typeof CourseSchema>;

// Exercise Progress Schema
export const ExerciseProgressSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  exerciseNumber: z.number(),
  completed: z.boolean(),
  completedAt: z.date().optional(),
  createdAt: z.date(),
});

export type ExerciseProgress = z.infer<typeof ExerciseProgressSchema>;

// Course with exercises (for display)
export interface CourseWithExercises extends Course {
  exercises: ExerciseProgress[];
}
