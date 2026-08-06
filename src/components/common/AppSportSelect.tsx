'use client';

import { Badge, Flex } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

import { SportType } from '@/lib/api/types';
import { SPORT_COLOR_PALETTE, SPORT_TYPES } from '@/constants/sports';

interface AppSportSelectProps {
  value: SportType;
  onChange: (sportType: SportType) => void;
  isDisabled?: boolean;
}

/** Segmented sport picker. Sports come from SPORT_TYPES so new sports appear automatically. */
export const AppSportSelect = ({
  value,
  onChange,
  isDisabled = false,
}: AppSportSelectProps) => {
  const t = useTranslations('sport');

  return (
    <Flex gap={2} flexWrap="wrap" role="radiogroup" aria-label={t('title')}>
      {SPORT_TYPES.map((sport) => {
        const isSelected = sport === value;
        const select = () => {
          if (!isDisabled) onChange(sport);
        };
        return (
          <Badge
            key={sport}
            role="radio"
            aria-checked={isSelected}
            aria-disabled={isDisabled}
            tabIndex={isDisabled ? -1 : 0}
            onClick={select}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                select();
              }
            }}
            px={4}
            py={2}
            borderRadius="lg"
            fontSize="sm"
            fontWeight="medium"
            cursor={isDisabled ? 'not-allowed' : 'pointer'}
            opacity={isDisabled ? 0.6 : 1}
            variant={isSelected ? 'solid' : 'outline'}
            colorPalette={isSelected ? SPORT_COLOR_PALETTE[sport] : 'gray'}
            borderWidth={isSelected ? '0' : '2px'}
            transition="all 0.2s"
            _hover={isDisabled ? undefined : { transform: 'scale(1.03)' }}
          >
            {t(sport)}
          </Badge>
        );
      })}
    </Flex>
  );
};
