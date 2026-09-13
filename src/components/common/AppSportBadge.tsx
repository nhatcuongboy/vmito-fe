'use client';

import { Badge, Icon, type BadgeProps } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { FaTableTennisPaddleBall } from 'react-icons/fa6';
import { GiShuttlecock } from 'react-icons/gi';

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
  /** Soft is intended for icons that sit inline with text on light surfaces. */
  iconOnlyVariant?: 'glass' | 'soft';
}

const SPORT_ICON = {
  [SportType.BADMINTON]: GiShuttlecock,
  [SportType.PICKLEBALL]: FaTableTennisPaddleBall,
} as const;

const SOFT_ICON_STYLE = {
  [SportType.BADMINTON]: {
    bg: 'green.50',
    borderColor: 'green.200',
    color: 'green.600',
    dark: {
      bg: 'green.950',
      borderColor: 'green.800',
      color: 'green.300',
    },
  },
  [SportType.PICKLEBALL]: {
    bg: 'purple.50',
    borderColor: 'purple.200',
    color: 'purple.600',
    dark: {
      bg: 'purple.950',
      borderColor: 'purple.800',
      color: 'purple.300',
    },
  },
} as const;

export const AppSportBadge = ({
  sportType,
  size = 'sm',
  variant = 'subtle',
  iconOnly = false,
  iconOnlyVariant = 'glass',
  ...rest
}: AppSportBadgeProps) => {
  const t = useTranslations('sport');
  const sport = normalizeSportType(sportType);
  const label = t(sport);

  // Icon-only overlays use the glassmorphism pill from the "Tìm kèo" cards
  // instead of the colored badge used in filters/selects.
  if (iconOnly) {
    if (iconOnlyVariant === 'soft') {
      const SportIcon = SPORT_ICON[sport];
      const style = SOFT_ICON_STYLE[sport];

      return (
        <Badge
          variant="plain"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          boxSize={6}
          minW={6}
          p={0}
          bg={style.bg}
          color={style.color}
          borderWidth="1px"
          borderColor={style.borderColor}
          borderRadius="full"
          boxShadow="0 1px 2px rgba(15, 23, 42, 0.04)"
          flexShrink={0}
          aria-label={label}
          title={label}
          _dark={style.dark}
          {...rest}
        >
          <Icon as={SportIcon} boxSize={3.5} aria-hidden="true" />
        </Badge>
      );
    }

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
