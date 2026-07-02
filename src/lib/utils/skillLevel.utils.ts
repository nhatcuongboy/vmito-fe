/**
 * Skill level color coding utility
 * Maps session required levels to color schemes for visual indication
 */
import { getLevelRank, sortLevelsByRank } from '@/constants/levels';

export interface SkillLevelColor {
  color: string;
  colorPalette: string;
  label: string;
  emoji: string;
  borderColor: string;
}

/**
 * Get skill level color based on session required levels
 * @param requiredLevels Array of stable level IDs
 * @returns Color scheme object with color, label, and emoji
 */
export const getSkillLevelColor = (
  requiredLevels: number[] | undefined
): SkillLevelColor => {
  // No requirements = All levels welcome
  if (!requiredLevels || requiredLevels.length === 0) {
    return {
      color: 'gray.500',
      colorPalette: 'gray',
      label: 'allLevels',
      emoji: '⚪',
      borderColor: 'gray.300',
    };
  }

  // Calculate average rank to determine category. Level IDs are stable keys,
  // not sortable skill scores.
  const ranks = requiredLevels.map((level) => getLevelRank(level) ?? 0);
  const avgRank = ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length;

  // Beginner band: Y-, Y, Y+, TBY
  if (avgRank <= 3) {
    return {
      color: 'green.600',
      colorPalette: 'green',
      label: 'beginner',
      emoji: '🟢',
      borderColor: 'green.400',
    };
  }

  // Intermediate band: TB-, TB, TB+
  if (avgRank <= 6) {
    return {
      color: 'yellow.600',
      colorPalette: 'yellow',
      label: 'intermediate',
      emoji: '🟡',
      borderColor: 'yellow.400',
    };
  }

  // Advanced: Levels 6-7 (Red)
  return {
    color: 'red.600',
    colorPalette: 'red',
    label: 'advanced',
    emoji: '🔴',
    borderColor: 'red.400',
  };
};

/**
 * Get skill level description for display
 * @param requiredLevels Array of stable level IDs
 * @returns Human-readable description
 */
export const getSkillLevelDescription = (
  requiredLevels: number[] | undefined
): string => {
  if (!requiredLevels || requiredLevels.length === 0) {
    return 'All levels welcome';
  }

  const sorted = sortLevelsByRank(requiredLevels);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  if (min === max) {
    return `Level ${min}`;
  }

  return `Levels ${min}-${max}`;
};
