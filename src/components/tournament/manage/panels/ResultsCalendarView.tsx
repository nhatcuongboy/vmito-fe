'use client';

import { Fragment, useMemo } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { VStack } from '@/components/ui/chakra-compat';
import { useLocale, useTranslations } from 'next-intl';

import { Category, CategoryMatch, TournamentCourt } from '@/lib/api/types';
import { formatCourtLabel } from '@/lib/tournament/court';
import { ResultMatchCard } from './ResultMatchCard';
import { toDateInputValue } from './resultsFilters';

const CALENDAR_ROW_HEIGHT = 152;
const CALENDAR_TIME_COL_WIDTH = 78;

export function ResultsCalendarView({
  matches,
  courts,
  categoryById,
  onSelect,
  resolveRoundOrGroupLabel,
  courtAbbreviation,
  allMatches,
  labelContextVersion,
  showPlayerNames,
  getMatchCardDomId,
}: {
  matches: CategoryMatch[];
  courts: TournamentCourt[];
  categoryById: Map<string, Category>;
  onSelect: (match: CategoryMatch) => void;
  resolveRoundOrGroupLabel: (match: CategoryMatch) => string;
  courtAbbreviation?: string;
  allMatches: CategoryMatch[];
  labelContextVersion?: string;
  showPlayerNames?: boolean;
  getMatchCardDomId?: (match: CategoryMatch) => string;
}) {
  const t = useTranslations('pages.tournaments.manualScore');
  const locale = useLocale();
  const scheduledMatches = matches.filter(
    (match) => match.startTime && match.courtId
  );

  const days = useMemo(() => {
    const daySet = new Set<string>();
    scheduledMatches.forEach((match) => {
      if (!match.startTime) return;
      daySet.add(toDateInputValue(match.startTime));
    });
    return Array.from(daySet).sort();
  }, [scheduledMatches]);

  const visibleCourts = useMemo(() => {
    const used = new Set(scheduledMatches.map((match) => match.courtId));
    return courts
      .filter((court) => used.has(court.id))
      .sort((a, b) => a.courtNumber - b.courtNumber);
  }, [courts, scheduledMatches]);

  const hours = useMemo(() => {
    const rawHours = scheduledMatches.map((match) =>
      match.startTime ? new Date(match.startTime).getHours() : 0
    );
    if (rawHours.length === 0) return [];
    const min = Math.max(0, Math.min(...rawHours) - 1);
    const max = Math.min(23, Math.max(...rawHours) + 1);
    return Array.from({ length: max - min + 1 }, (_, index) => min + index);
  }, [scheduledMatches]);

  const grid = useMemo(() => {
    const map = new Map<string, CategoryMatch[]>();
    scheduledMatches.forEach((match) => {
      if (!match.startTime || !match.courtId) return;
      const day = toDateInputValue(match.startTime);
      const hour = new Date(match.startTime).getHours();
      const key = `${day}-${match.courtId}-${hour}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(match);
    });
    map.forEach((items) =>
      items.sort((a, b) => {
        const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
        const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
        return aTime - bTime;
      })
    );
    return map;
  }, [scheduledMatches]);

  if (scheduledMatches.length === 0) {
    return (
      <Box
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        p={8}
        textAlign="center"
        color="gray.500"
        bg="white"
        _dark={{
          bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
          borderColor:
            'var(--tournament-border, var(--chakra-colors-gray-700))',
          color: 'var(--tournament-text-muted, var(--chakra-colors-gray-400))',
          boxShadow: 'var(--tournament-shadow-soft)',
        }}
      >
        {t('calendar.empty')}
      </Box>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      {days.map((day) => (
        <Box key={day} overflowX="auto">
          <Box
            mx="auto"
            mb={3}
            px={6}
            py={2}
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="full"
            bg="white"
            _dark={{
              bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
              borderColor:
                'var(--tournament-border, var(--chakra-colors-gray-700))',
              boxShadow: 'var(--tournament-shadow-soft)',
            }}
            w="fit-content"
            boxShadow="0 4px 16px rgba(15, 23, 42, 0.08)"
          >
            <Text fontWeight="semibold">
              {new Date(`${day}T00:00:00`).toLocaleDateString(locale, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </Box>

          <Box
            display="grid"
            gridTemplateColumns={`${CALENDAR_TIME_COL_WIDTH}px repeat(${visibleCourts.length}, minmax(260px, 1fr))`}
            minW={`${CALENDAR_TIME_COL_WIDTH + visibleCourts.length * 260}px`}
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="xl"
            overflow="hidden"
            bg="white"
            _dark={{
              bg: 'var(--tournament-surface-muted, var(--chakra-colors-gray-900))',
              borderColor:
                'var(--tournament-border, var(--chakra-colors-gray-700))',
            }}
          >
            <CalendarHeaderCell>{t('calendar.time')}</CalendarHeaderCell>
            {visibleCourts.map((court) => (
              <CalendarHeaderCell key={court.id}>
                {formatCourtLabel(court, t('court'))}
              </CalendarHeaderCell>
            ))}

            {hours.map((hour) => (
              <Fragment key={`${day}-${hour}`}>
                <Box
                  minH={`${CALENDAR_ROW_HEIGHT}px`}
                  borderTopWidth="1px"
                  borderColor="gray.100"
                  p={3}
                  color="gray.500"
                  _dark={{ borderColor: 'gray.800', color: 'gray.400' }}
                >
                  <Text fontSize="sm">{formatHourLabel(hour)}</Text>
                </Box>
                {visibleCourts.map((court) => {
                  const key = `${day}-${court.id}-${hour}`;
                  const cellMatches = grid.get(key) ?? [];
                  return (
                    <Box
                      key={key}
                      minH={`${CALENDAR_ROW_HEIGHT}px`}
                      borderTopWidth="1px"
                      borderLeftWidth="1px"
                      borderColor="gray.100"
                      p={2}
                      _dark={{ borderColor: 'gray.800' }}
                    >
                      <VStack align="stretch" gap={2}>
                        {cellMatches.map((match) => (
                          <ResultMatchCard
                            key={match.id}
                            match={match}
                            categoryName={
                              categoryById.get(match.categoryId)?.name ?? ''
                            }
                            onSelect={onSelect}
                            roundOrGroupLabel={resolveRoundOrGroupLabel(match)}
                            courtAbbreviation={courtAbbreviation}
                            allMatches={allMatches}
                            labelContextVersion={labelContextVersion}
                            category={categoryById.get(match.categoryId)}
                            showPlayerNames={showPlayerNames}
                            domId={getMatchCardDomId?.(match)}
                            compact
                          />
                        ))}
                      </VStack>
                    </Box>
                  );
                })}
              </Fragment>
            ))}
          </Box>
        </Box>
      ))}
    </VStack>
  );
}

function CalendarHeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <Box
      p={3}
      borderLeftWidth="1px"
      borderColor="gray.100"
      bg="gray.50"
      _dark={{
        bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
        borderColor: 'var(--tournament-border, var(--chakra-colors-gray-700))',
        boxShadow: 'var(--tournament-shadow-soft)',
      }}
      textAlign="center"
    >
      <Text fontWeight="bold">{children}</Text>
    </Box>
  );
}

function formatHourLabel(hour: number) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const normalized = hour % 12 || 12;
  return `${normalized}:00${suffix}`;
}
