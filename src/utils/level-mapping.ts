import { Level } from '@/lib/api/types';
import { LevelLabel } from '@/types/session';

/**
 * Helper function to map Level enum to LevelLabel for display
 * @param level - The Level enum value
 * @param fallback - Custom fallback text when level is undefined (defaults to "N/A")
 * @returns The corresponding LevelLabel for display, or fallback if level is undefined
 */
export const getLevelLabel = (
  level?: Level,
  fallback: string = 'N/A'
): string => {
  if (!level) return fallback;

  const levelMap: Record<Level, LevelLabel> = {
    [Level.Y_MINUS]: LevelLabel.Y_MINUS,
    [Level.Y]: LevelLabel.Y,
    [Level.Y_PLUS]: LevelLabel.Y_PLUS,
    [Level.TBY]: LevelLabel.TBY,
    [Level.TB_MINUS]: LevelLabel.TB_MINUS,
    [Level.TB]: LevelLabel.TB,
    [Level.TB_PLUS]: LevelLabel.TB_PLUS,
    [Level.K]: LevelLabel.K,
  };

  return levelMap[level] || fallback;
};

/**
 * Helper function to get a user-friendly description of the level
 * @param level - The Level enum value
 * @returns A user-friendly description of the level
 */
export const getLevelDescription = (level?: Level): string => {
  if (!level) return 'No level specified';

  const descriptions: Record<Level, string> = {
    [Level.Y_MINUS]: 'Beginner (Y-)',
    [Level.Y]: 'Beginner (Y)',
    [Level.Y_PLUS]: 'Beginner Plus (Y+)',
    [Level.TBY]: 'Transition to Basic (TBY)',
    [Level.TB_MINUS]: 'Basic Minus (TB-)',
    [Level.TB]: 'Basic (TB)',
    [Level.TB_PLUS]: 'Basic Plus (TB+)',
    [Level.K]: 'Advanced (K)',
  };

  return descriptions[level] || 'Unknown level';
};
