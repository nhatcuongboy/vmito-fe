'use client';

import { TournamentStatus } from '@/lib/api/types';
import { Box, chakra, Flex, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

/**
 * The statuses worth one tap. CANCELLED is intentionally left to the filter
 * drawer — nobody browses for cancelled tournaments.
 */
const QUICK_STATUSES: TournamentStatus[] = [
  TournamentStatus.IN_PROGRESS,
  TournamentStatus.PREPARING,
  TournamentStatus.FINISHED,
];

interface TournamentStatusTabsProps {
  /** The status filter currently applied, straight from the URL filters. */
  value: TournamentStatus[];
  onChange: (statuses: TournamentStatus[]) => void;
}

/**
 * Single-tap status filter above the results grid. Drives the same
 * `filters.status` state as the filter drawer, so the two stay in sync and
 * reaching "in progress" no longer means opening a drawer.
 */
export function TournamentStatusTabs({
  value,
  onChange,
}: TournamentStatusTabsProps) {
  const t = useTranslations('pages.tournaments');

  // A drawer selection of several statuses matches no single chip, which is
  // the honest state: neither "all" nor one status is active.
  const activeStatus = value.length === 1 ? value[0] : null;
  const isAllActive = value.length === 0;

  const chips: {
    key: string;
    label: string;
    isActive: boolean;
    next: TournamentStatus[];
  }[] = [
    {
      // Short label deliberately: "Tất cả trạng thái" ate most of the scroll
      // rail on a 390px viewport, pushing two of the three statuses offscreen.
      key: 'all',
      label: t('filters.status.all'),
      isActive: isAllActive,
      next: [],
    },
    ...QUICK_STATUSES.map((status) => ({
      key: status,
      label: t(`filters.status.${status}`),
      isActive: activeStatus === status,
      // Tapping the active chip clears it rather than being a dead end.
      next: activeStatus === status ? [] : [status],
    })),
  ];

  return (
    <Flex
      gap={2}
      overflowX="auto"
      pb={1}
      css={{
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {chips.map((chip) => (
        <chakra.button
          key={chip.key}
          type="button"
          display="flex"
          alignItems="center"
          gap={1.5}
          flexShrink={0}
          px={3.5}
          py={1.5}
          borderRadius="full"
          borderWidth="1px"
          fontSize="sm"
          fontWeight="medium"
          cursor="pointer"
          transition="background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease"
          aria-pressed={chip.isActive}
          onClick={() => onChange(chip.next)}
          {...(chip.isActive
            ? {
                bg: 'green.500',
                borderColor: 'green.500',
                color: 'white',
                boxShadow: '0 2px 8px rgba(23, 154, 59, 0.25)',
                _hover: { bg: 'green.600', borderColor: 'green.600' },
              }
            : {
                bg: 'white',
                borderColor: 'border.subtle',
                color: 'fg.muted',
                _dark: { bg: 'gray.800' },
                _hover: { borderColor: 'green.300', color: 'fg' },
              })}
        >
          {chip.key === TournamentStatus.IN_PROGRESS && (
            <Box
              w="6px"
              h="6px"
              borderRadius="full"
              bg={chip.isActive ? 'white' : 'green.500'}
              flexShrink={0}
              className="tournament-live-dot"
            />
          )}
          <Text as="span">{chip.label}</Text>
        </chakra.button>
      ))}
    </Flex>
  );
}

export default TournamentStatusTabs;
