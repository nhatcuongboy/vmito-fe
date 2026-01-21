import { PlayerLevel } from '@/lib/api/types';

export const LEVELS = PlayerLevel;

export const VALID_LEVELS = Object.values(LEVELS).filter(
  (value) => typeof value === 'number'
) as number[];

export type LevelType = PlayerLevel;

// LEVEL_LABELS removed as we use translations
