'use client';

import { Badge, Flex } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { defaultRules } from '@/lib/scoring/badminton';
import type { Category, CategoryMatch, SportType } from '@/lib/api/types';

interface Props {
  match: CategoryMatch;
  /** Category fallback when `match.category` is not embedded (carries format overrides). */
  category?: Category | null;
  /** Tournament sport, so scoring defaults match the sport (e.g. pickleball 11). */
  sportType?: SportType | null;
  /** Chakra size token forwarded to both badges. */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Renders the match format summary as two badges — the number of sets
 * (e.g. "Đấu 1 set") and the scoring rule (e.g. "Tới 21 điểm / 30").
 * Shared by the referee score board, the manual score modal, and the match
 * detail modal so the format is described consistently everywhere.
 */
export default function MatchFormatBadges({
  match,
  category,
  sportType,
  size,
}: Props) {
  const t = useTranslations('pages.tournaments.scoreEntry');
  const rules = defaultRules(
    {
      matchFormat: match.matchFormat,
      round: match.round,
      pointsToWin: match.pointsToWin,
      winByTwo: match.winByTwo,
      pointCap: match.pointCap,
      category: match.category ?? category ?? null,
    },
    sportType
  );

  const bestOfLabel =
    rules.bestOf === 5
      ? t('bestOf5')
      : rules.bestOf === 3
        ? t('bestOf3')
        : t('bestOf1');

  return (
    <Flex align="center" gap={2} flexWrap="wrap">
      <Badge colorPalette="purple" size={size}>
        {bestOfLabel}
      </Badge>
      <Badge colorPalette="blue" variant="subtle" size={size}>
        {t('ruleSummary', {
          points: rules.pointsToWin,
          cap:
            rules.cap != null && rules.cap > rules.pointsToWin
              ? ` / ${rules.cap}`
              : '',
        })}
      </Badge>
    </Flex>
  );
}
