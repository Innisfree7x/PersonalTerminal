import { ACHIEVEMENTS } from './registry';
import type { AchievementCheckInput, AchievementDef } from './registry';

export function checkNewAchievements(
  input: AchievementCheckInput,
  alreadyUnlocked: string[]
): AchievementDef[] {
  const unlocked = new Set(alreadyUnlocked);
  return ACHIEVEMENTS.filter((a) => !unlocked.has(a.key) && a.condition(input));
}
