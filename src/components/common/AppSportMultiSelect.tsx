'use client';

import { Badge, Flex } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

import { SportType } from '@/lib/api/types';
import {
  SPORT_COLOR_PALETTE,
  SPORT_EMOJI,
  SPORT_TYPES,
} from '@/constants/sports';

interface AppSportMultiSelectProps {
  value: SportType[];
  onChange: (sportTypes: SportType[]) => void;
  /** Keeps at least one sport selected (used by venue forms). */
  allowEmpty?: boolean;
}

export const AppSportMultiSelect = ({
  value,
  onChange,
  allowEmpty = false,
}: AppSportMultiSelectProps) => {
  const t = useTranslations('sport');

  const toggle = (sport: SportType) => {
    const isSelected = value.includes(sport);
    if (isSelected && !allowEmpty && value.length === 1) return;
    onChange(isSelected ? value.filter((s) => s !== sport) : [...value, sport]);
  };

  return (
    <Flex gap={2} flexWrap="wrap">
      {SPORT_TYPES.map((sport) => {
        const isSelected = value.includes(sport);
        return (
          <Badge
            key={sport}
            role="checkbox"
            aria-checked={isSelected}
            tabIndex={0}
            onClick={() => toggle(sport)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggle(sport);
              }
            }}
            px={4}
            py={2}
            borderRadius="lg"
            fontSize="sm"
            fontWeight="medium"
            gap={1.5}
            cursor="pointer"
            variant={isSelected ? 'solid' : 'outline'}
            colorPalette={isSelected ? SPORT_COLOR_PALETTE[sport] : 'gray'}
            borderWidth={isSelected ? '0' : '2px'}
            transition="all 0.2s"
            _hover={{ transform: 'scale(1.03)' }}
          >
            <span aria-hidden>{SPORT_EMOJI[sport]}</span>
            {t(sport)}
          </Badge>
        );
      })}
    </Flex>
  );
};
