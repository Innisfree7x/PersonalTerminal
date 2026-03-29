import { createHash } from 'node:crypto';
import type {
  CampusConnectorExamInput,
  CampusConnectorGradeInput,
  CampusConnectorModuleInput,
  CampusConnectorPayloadInput,
} from '@/lib/schemas/kit-sync.schema';

function dedupeByKey<T>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(getKey(item), item);
  }
  return Array.from(map.values());
}

function createContentHash(parts: Array<string | number | boolean | null | undefined>) {
  return createHash('sha256')
    .update(parts.map((part) => String(part ?? '')).join('|'))
    .digest('hex');
}

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function normalizeCampusConnectorPayload(payload: CampusConnectorPayloadInput) {
  const modules = dedupeByKey(payload.modules, (item) => item.externalId);
  const grades = dedupeByKey(payload.grades, (item) => item.externalGradeId);
  const exams = dedupeByKey(payload.exams, (item) => item.externalId);

  const referencedModuleExternalIds = Array.from(
    new Set([
      ...modules.map((item) => item.externalId),
      ...grades.map((item) => item.moduleExternalId),
      ...exams.map((item) => item.moduleExternalId).filter(isNonEmptyString),
    ])
  );

  return {
    modules,
    grades,
    exams,
    referencedModuleExternalIds,
    itemsRead: modules.length + grades.length + exams.length,
  };
}

export function buildCampusModuleUpsertRows(userId: string, modules: CampusConnectorModuleInput[]) {
  return modules.map((module) => ({
    user_id: userId,
    external_id: module.externalId,
    module_code: module.moduleCode ?? null,
    title: module.title,
    status: module.status,
    semester_label: module.semesterLabel ?? null,
    credits: module.credits ?? null,
    source_updated_at: module.sourceUpdatedAt ?? null,
  }));
}

export function buildCampusGradeUpsertRows(
  userId: string,
  gradeModuleIds: Array<{ grade: CampusConnectorGradeInput; moduleId: string }>
) {
  return gradeModuleIds.map(({ grade, moduleId }) => ({
    user_id: userId,
    module_id: moduleId,
    external_grade_id: grade.externalGradeId,
    grade_value: grade.gradeValue ?? null,
    grade_label: grade.gradeLabel,
    exam_date: grade.examDate ?? null,
    published_at: grade.publishedAt ?? null,
    source_updated_at: grade.sourceUpdatedAt ?? null,
  }));
}

export function buildCampusExamEventUpsertRows(
  userId: string,
  profileId: string,
  exams: CampusConnectorExamInput[]
) {
  return exams.map((exam) => ({
    user_id: userId,
    profile_id: profileId,
    external_id: exam.externalId,
    source: 'campus_connector' as const,
    title: exam.title,
    description: exam.description ?? null,
    location: exam.location ?? null,
    starts_at: exam.startsAt,
    ends_at: exam.endsAt ?? null,
    all_day: exam.allDay ?? false,
    kind: 'exam' as const,
    source_updated_at: exam.sourceUpdatedAt ?? null,
    content_hash: createContentHash([
      exam.externalId,
      exam.title,
      exam.description,
      exam.location,
      exam.startsAt,
      exam.endsAt,
      exam.allDay,
      exam.sourceUpdatedAt,
    ]),
  }));
}
