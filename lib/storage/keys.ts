export const STORAGE_KEYS = {
  theme: 'innis:theme:v1',
  accent: 'innis:accent:v1',
  commandPendingAction: 'innis:pending-command-action:v1',
  summonerSpells: 'innis:summoner-spells:v1',
  championSettings: 'innis:champion:settings:v1',
  championStats: 'innis:champion:stats:v1',
  championPosition: 'innis:champion:position:v1',
  focusTimerSession: 'innis:focus-timer:session:v1',
  focusTimerSettings: 'innis:focus-timer:settings:v1',
  focusScreenVisualPrefs: 'innis:focus-screen:visual-prefs:v1',
  calendarShowTrajectoryGhostEvents: 'innis:calendar:show-trajectory-ghost-events:v1',
  nbaDismissed: 'innis:nba:dismissed:v1',
  todayDoneSignalDate: 'innis:today:done-signal-date:v1',
  todayMorningCheckinDate: 'innis:today:morning-checkin-date:v1',
  weeklyCheckinWeekKey: 'innis:today:weekly-checkin-week-key:v1',
} as const;

export const LEGACY_STORAGE_KEYS = {
  theme: ['prism-theme'],
  accent: ['prism-accent'],
  commandPendingAction: ['prism:pending-command-action'],
  summonerSpells: ['prism:summoner-spells'],
  championSettings: ['prism-champion-settings'],
  championStats: ['prism-champion-stats'],
  championPosition: ['prism-champion-position'],
  focusTimerSession: ['prism-focus-timer'],
  focusTimerSettings: ['prism-timer-settings'],
  focusScreenVisualPrefs: ['prism:focus-screen:visual-prefs:v1'],
  nbaDismissed: ['prism:nba:dismissed'],
} as const;

export function readStorageValueWithLegacy(
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>,
  key: string,
  legacyKeys: readonly string[] = []
): string | null {
  const direct = storage.getItem(key);
  if (direct !== null) return direct;

  for (const legacyKey of legacyKeys) {
    const legacy = storage.getItem(legacyKey);
    if (legacy === null) continue;
    storage.setItem(key, legacy);
    storage.removeItem(legacyKey);
    return legacy;
  }

  return null;
}
