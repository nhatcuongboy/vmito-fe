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

  // Icon-only overlays use the glassmorphism pill from the "Tìm kèo" cards
  // instead of the colored badge used in filters/selects.
  if (iconOnly) {
    return (
      <Badge
        variant="plain"
        bg="blackAlpha.600"
        color="white"
        borderRadius="full"
        backdropFilter="blur(8px)"
        px={1.5}
        py={1}
        fontSize="sm"
        fontWeight="medium"
        whiteSpace="nowrap"
        aria-label={label}
        title={label}
        {...rest}
      >
        <span aria-hidden>{SPORT_EMOJI[sport]}</span>
      </Badge>
    );
  }

  return (
    <Badge
      size={size}
      variant={variant}
      colorPalette={SPORT_COLOR_PALETTE[sport]}
      borderRadius="md"
      whiteSpace="nowrap"
      gap={1}
      {...rest}
    >
      <span aria-hidden>{SPORT_EMOJI[sport]}</span>
      {label}
    </Badge>
  );
};
