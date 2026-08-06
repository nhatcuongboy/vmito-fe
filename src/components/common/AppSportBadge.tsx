'use client';

import { Badge } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

import { SportType } from '@/lib/api/types';
import { SPORT_COLOR_PALETTE, normalizeSportType } from '@/constants/sports';

interface AppSportBadgeProps {
  sportType?: SportType | null;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'subtle' | 'outline';
}

export const AppSportBadge = ({
  sportType,
  size = 'sm',
  variant = 'subtle',
}: AppSportBadgeProps) => {
  const t = useTranslations('sport');
  const sport = normalizeSportType(sportType);

  return (
    <Badge
      size={size}
      variant={variant}
      colorPalette={SPORT_COLOR_PALETTE[sport]}
      borderRadius="md"
      whiteSpace="nowrap"
    >
      {t(sport)}
    </Badge>
  );
};
