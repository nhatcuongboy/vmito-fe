import { useTranslations } from 'next-intl';

export function useLevelLabel() {
  const t = useTranslations('common.levels');
  const ts = useTranslations('common.levelShorts');
  const tCommon = useTranslations('common');

  /**
   * Get the translated label for a numeric level.
   * @param level - The numeric level (1-8)
   * @returns The translated label string
   */
  const getLevelLabel = (level?: number | string | null) => {
    if (level === undefined || level === null || level === '')
      return tCommon('notAvailable');
    return t(`${level}`);
  };

  /**
   * Get the abbreviated translated label for a numeric level.
   * @param level - The numeric level (1-8)
   * @returns The abbreviated translated label string
   */
  const getLevelShortLabel = (level?: number | string | null) => {
    if (level === undefined || level === null || level === '')
      return tCommon('notAvailable');
    return ts(`${level}`);
  };

  return { getLevelLabel, getLevelShortLabel };
}
