import { z } from 'zod';

export const ApplicationStatus = z.enum(['applied', 'interview', 'offer', 'rejected']);

export type ApplicationStatus = z.infer<typeof ApplicationStatus>;

export const createApplicationSchema = z.object({
  company: z.string().min(1, 'Company name is required').max(200),
  position: z.string().min(1, 'Position is required').max(200),
  status: ApplicationStatus,
  applicationDate: z.preprocess(
    (arg) => {
      if (typeof arg === 'string' || arg instanceof Date) {
        return new Date(arg);
      }
      return arg;
    },
    z.date()
  ),
  interviewDate: z
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
  notes: z.string().optional(),
  salaryRange: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  jobUrl: z.string().url().optional().or(z.literal('')),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export const ApplicationSchema = createApplicationSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Application = z.infer<typeof ApplicationSchema>;
