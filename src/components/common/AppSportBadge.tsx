'use client';

import { Badge, type BadgeProps } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

import { SportType } from '@/lib/api/types';
import {
  SPORT_COLOR_PALETTE,
  SPORT_EMOJI,
  normalizeSportType,
} from '@/constants/sports';

interface AppSportBadgeProps extends Omit<BadgeProps, 'colorPalette'> {
  sportType?: SportType | null;
  /** Icon only — for tight spots like compact card overlays. */
  iconOnly?: boolean;
}

export const AppSportBadge = ({
  sportType,
  size = 'sm',
  variant = 'subtle',
  iconOnly = false,
  ...rest
}: AppSportBadgeProps) => {
  const t = useTranslations('sport');
  const sport = normalizeSportType(sportType);
  const label = t(sport);

  return (
    <Badge
      size={size}
      variant={variant}
      colorPalette={SPORT_COLOR_PALETTE[sport]}
      borderRadius="md"
      whiteSpace="nowrap"
      gap={1}
      px={iconOnly ? 1.5 : undefined}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
      {...rest}
    >
      <span aria-hidden={!iconOnly}>{SPORT_EMOJI[sport]}</span>
      {!iconOnly && label}
    </Badge>
  );
};
