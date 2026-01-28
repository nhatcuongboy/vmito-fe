/**
 * Skill level color coding utility
 * Maps session required levels to color schemes for visual indication
 */

export interface SkillLevelColor {
  color: string;
  colorPalette: string;
  label: string;
  emoji: string;
  borderColor: string;
}

/**
 * Get skill level color based on session required levels
 * @param requiredLevels Array of required level numbers (1-7)
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

  // Calculate average level to determine category
  const avgLevel =
    requiredLevels.reduce((sum, level) => sum + level, 0) /
    requiredLevels.length;

  // Beginner: Levels 1-2 (Green)
  if (avgLevel <= 2) {
    return {
      color: 'green.600',
      colorPalette: 'green',
      label: 'beginner',
      emoji: '🟢',
      borderColor: 'green.400',
    };
  }

  // Intermediate: Levels 3-5 (Yellow) - includes TB-, TB, TB+
  if (avgLevel <= 5) {
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
 * @param requiredLevels Array of required level numbers
 * @returns Human-readable description
 */
export const getSkillLevelDescription = (
  requiredLevels: number[] | undefined
): string => {
  if (!requiredLevels || requiredLevels.length === 0) {
    return 'All levels welcome';
  }

  const min = Math.min(...requiredLevels);
  const max = Math.max(...requiredLevels);

  if (min === max) {
    return `Level ${min}`;
  }

  return `Levels ${min}-${max}`;
};
