import { useTranslations } from 'next-intl';

export function useLevelLabel() {
  const t = useTranslations('common.levels');

  /**
   * Get the translated label for a numeric level.
   * @param level - The numeric level (1-7)
   * @returns The translated label string
   */
  const getLevelLabel = (level?: number | null) => {
    if (level === undefined || level === null) return '';
    // Assuming keys "1", "2", etc. exist in common.levels
    return t(`${level}`);
  };

  return getLevelLabel;
}
