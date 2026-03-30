import { z } from 'zod';

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum muss als YYYY-MM-DD vorliegen.');

const isoDateTimeSchema = z.string().datetime({ offset: true });

export const campusModuleStatusSchema = z.enum(['active', 'completed', 'dropped', 'planned', 'unknown']);

export const campusConnectorModuleSchema = z.object({
  externalId: z.string().trim().min(1, 'Modulexternal-ID ist erforderlich.').max(191),
  moduleCode: z.string().trim().min(1).max(64).optional().nullable(),
  title: z.string().trim().min(1, 'Modultitel ist erforderlich.').max(255),
  status: campusModuleStatusSchema.default('active'),
  semesterLabel: z.string().trim().min(1).max(64).optional().nullable(),
  credits: z.number().min(0).max(60).optional().nullable(),
  sourceUpdatedAt: isoDateTimeSchema.optional().nullable(),
});

export const campusConnectorGradeSchema = z.object({
  externalGradeId: z.string().trim().min(1, 'Grade-ID ist erforderlich.').max(191),
  moduleExternalId: z.string().trim().min(1, 'Modulexternal-ID ist erforderlich.').max(191),
  gradeValue: z.number().min(1).max(5).optional().nullable(),
  gradeLabel: z.string().trim().min(1, 'Notenlabel ist erforderlich.').max(64),
  examDate: isoDateSchema.optional().nullable(),
  publishedAt: isoDateTimeSchema.optional().nullable(),
  sourceUpdatedAt: isoDateTimeSchema.optional().nullable(),
});

export const campusConnectorExamSchema = z.object({
  externalId: z.string().trim().min(1, 'Event-ID ist erforderlich.').max(191),
  moduleExternalId: z.string().trim().min(1).max(191).optional().nullable(),
  title: z.string().trim().min(1, 'Prüfungstitel ist erforderlich.').max(255),
  description: z.string().trim().max(4000).optional().nullable(),
  location: z.string().trim().max(255).optional().nullable(),
  startsAt: isoDateTimeSchema,
  endsAt: isoDateTimeSchema.optional().nullable(),
  allDay: z.boolean().optional().default(false),
  sourceUpdatedAt: isoDateTimeSchema.optional().nullable(),
});

export const campusConnectorPayloadSchema = z.object({
  modules: z.array(campusConnectorModuleSchema).max(200),
  grades: z.array(campusConnectorGradeSchema).max(500),
  exams: z.array(campusConnectorExamSchema).max(200).default([]),
});

export const iliasItemTypeSchema = z.enum(['announcement', 'document', 'folder', 'link', 'other']);

export const iliasConnectorFavoriteSchema = z.object({
  externalId: z.string().trim().min(1, 'Favoriten-ID ist erforderlich.').max(191),
  title: z.string().trim().min(1, 'Kurstitel ist erforderlich.').max(255),
  semesterLabel: z.string().trim().min(1).max(64).optional().nullable(),
  courseUrl: z.string().trim().url().max(2048).optional().nullable(),
  sourceUpdatedAt: isoDateTimeSchema.optional().nullable(),
});

export const iliasConnectorItemSchema = z.object({
  externalId: z.string().trim().min(1, 'Item-ID ist erforderlich.').max(191),
  favoriteExternalId: z.string().trim().min(1, 'Favoriten-Referenz ist erforderlich.').max(191),
  title: z.string().trim().min(1, 'Item-Titel ist erforderlich.').max(255),
  itemType: iliasItemTypeSchema.default('other'),
  itemUrl: z.string().trim().url().max(2048).optional().nullable(),
  summary: z.string().trim().max(4000).optional().nullable(),
  publishedAt: isoDateTimeSchema.optional().nullable(),
  sourceUpdatedAt: isoDateTimeSchema.optional().nullable(),
});

export const iliasConnectorPayloadSchema = z.object({
  favorites: z.array(iliasConnectorFavoriteSchema).max(200),
  items: z.array(iliasConnectorItemSchema).max(1000),
});

export const kitSyncSourceSchema = z.enum(['campus_webcal', 'campus_connector', 'ilias_connector']);
export const kitSyncResetScopeSchema = z.enum(['campus_webcal', 'campus_connector', 'ilias_dashboard', 'ilias_items']);
export const acknowledgeKitIliasItemsSchema = z.object({
  ids: z.array(z.string().uuid('Ungültige ILIAS-Item-ID.')).min(1, 'Mindestens ein ILIAS-Item ist erforderlich.').max(20),
});

export const saveKitWebcalSchema = z.object({
  url: z.string().trim().min(1, 'WebCal-URL ist erforderlich.').max(2048, 'WebCal-URL ist zu lang.'),
});

export const triggerKitSyncSchema = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('campus_webcal'),
  }),
  z.object({
    source: z.literal('campus_connector'),
    connectorVersion: z.string().trim().min(1, 'Connector-Version ist erforderlich.').max(32),
    payload: campusConnectorPayloadSchema,
  }),
  z.object({
    source: z.literal('ilias_connector'),
    connectorVersion: z.string().trim().min(1, 'Connector-Version ist erforderlich.').max(32),
    payload: iliasConnectorPayloadSchema,
  }),
]);

export type KitSyncSource = z.infer<typeof kitSyncSourceSchema>;
export type KitSyncResetScope = z.infer<typeof kitSyncResetScopeSchema>;
export type SaveKitWebcalInput = z.infer<typeof saveKitWebcalSchema>;
export type CampusConnectorModuleInput = z.infer<typeof campusConnectorModuleSchema>;
export type CampusConnectorGradeInput = z.infer<typeof campusConnectorGradeSchema>;
export type CampusConnectorExamInput = z.infer<typeof campusConnectorExamSchema>;
export type CampusConnectorPayloadInput = z.infer<typeof campusConnectorPayloadSchema>;
export type IliasConnectorFavoriteInput = z.infer<typeof iliasConnectorFavoriteSchema>;
export type IliasConnectorItemInput = z.infer<typeof iliasConnectorItemSchema>;
export type IliasConnectorPayloadInput = z.infer<typeof iliasConnectorPayloadSchema>;
export type TriggerKitSyncInput = z.infer<typeof triggerKitSyncSchema>;
export type AcknowledgeKitIliasItemsInput = z.infer<typeof acknowledgeKitIliasItemsSchema>;
