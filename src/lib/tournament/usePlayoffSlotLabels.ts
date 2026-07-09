import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { SlotLabels } from './bracketSlots';

/**
 * Localized {@link SlotLabels} for playoff/elimination slot placeholders,
 * shared by the bracket, the schedule views, and the match list/detail so they
 * all read identically ("Nhất Bảng A", "Thắng trận 21", "Thua trận 21").
 */
export function usePlayoffSlotLabels(): SlotLabels {
  const t = useTranslations('pages.tournaments.playoffSlot');
  return useMemo<SlotLabels>(
    () => ({
      winnerOf: (match) => t('winnerOf', { match }),
      loserOf: (match) => t('loserOf', { match }),
      nthPoolLabel: (rank, pool) => t('nthPoolLabel', { rank, pool }),
      ordinal: (rankZeroBased) => {
        const oneBased = rankZeroBased + 1;
        const key = oneBased >= 1 && oneBased <= 8 ? String(oneBased) : 'other';
        return t(`ordinals.${key}`, { rank: oneBased });
      },
      bye: () => t('bye'),
      tbd: () => t('tbd'),
    }),
    [t]
  );
}
