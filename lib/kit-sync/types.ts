export interface KitSyncStatus {
  campusWebcalConfigured: boolean;
  campusWebcalMaskedUrl: string | null;
  campusWebcalCalendarName: string | null;
  campusWebcalLastValidatedAt: string | null;
  campusWebcalLastSyncedAt: string | null;
  campusWebcalLastError: string | null;
  connectorVersion: string | null;
  totalCampusEvents: number;
  totalCampusModules: number;
  totalCampusGrades: number;
  totalIliasFavorites: number;
  totalIliasItems: number;
  freshIliasItems: number;
  nextCampusEvent: { title: string; startsAt: string; kind: string } | null;
  nextCampusExam: { title: string; startsAt: string; location: string | null } | null;
  latestCampusGrade: { moduleTitle: string; gradeLabel: string; publishedAt: string | null } | null;
  latestIliasItem: {
    favoriteTitle: string;
    title: string;
    itemType: string;
    publishedAt: string | null;
    itemUrl: string | null;
  } | null;
  freshIliasPreview: Array<{
    id: string;
    favoriteTitle: string;
    title: string;
    itemType: string;
    publishedAt: string | null;
    itemUrl: string | null;
    firstSeenAt: string;
  }>;
  iliasFavoritePreview: Array<{
    title: string;
    semesterLabel: string | null;
    courseUrl: string | null;
  }>;
  lastRun: {
    source: string;
    trigger: string;
    status: string;
    itemsRead: number;
    itemsWritten: number;
    finishedAt: string | null;
    errorCode: string | null;
    errorMessage: string | null;
  } | null;
}

export function createEmptyKitSyncStatus(): KitSyncStatus {
  return {
    campusWebcalConfigured: false,
    campusWebcalMaskedUrl: null,
    campusWebcalCalendarName: null,
    campusWebcalLastValidatedAt: null,
    campusWebcalLastSyncedAt: null,
    campusWebcalLastError: null,
    connectorVersion: null,
    totalCampusEvents: 0,
    totalCampusModules: 0,
    totalCampusGrades: 0,
    totalIliasFavorites: 0,
    totalIliasItems: 0,
    freshIliasItems: 0,
    nextCampusEvent: null,
    nextCampusExam: null,
    latestCampusGrade: null,
    latestIliasItem: null,
    freshIliasPreview: [],
    iliasFavoritePreview: [],
    lastRun: null,
  };
}
