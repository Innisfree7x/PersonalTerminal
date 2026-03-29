import { z } from 'zod';

export const kitSyncSourceSchema = z.enum(['campus_webcal']);

export const saveKitWebcalSchema = z.object({
  url: z.string().trim().min(1, 'WebCal-URL ist erforderlich.').max(2048, 'WebCal-URL ist zu lang.'),
});

export const triggerKitSyncSchema = z.object({
  source: kitSyncSourceSchema.default('campus_webcal'),
});

export type KitSyncSource = z.infer<typeof kitSyncSourceSchema>;
export type SaveKitWebcalInput = z.infer<typeof saveKitWebcalSchema>;
export type TriggerKitSyncInput = z.infer<typeof triggerKitSyncSchema>;
