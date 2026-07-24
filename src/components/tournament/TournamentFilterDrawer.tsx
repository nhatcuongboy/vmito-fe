'use client';

import { LocationFilterFields } from '@/components/common/LocationFilterFields';
import { FilterDrawer } from '@/components/ui/FilterDrawer';
import { Input } from '@/components/ui/Input';
import { SportType, TournamentStatus } from '@/lib/api/types';
import { Badge, Box, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { CalendarDays, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export type TTournamentPeriod = 'all' | 'today' | 'next7' | 'next30' | 'custom';

export interface ITournamentBrowseFilters {
  statuses: TournamentStatus[];
  period: TTournamentPeriod;
  dateFrom: string;
  dateTo: string;
  cities: string[];
  districts: string[];
  sports: SportType[];
}

interface ITournamentFilterDrawerProps {
  isOpen: boolean;
  filters: ITournamentBrowseFilters;
  onClose: () => void;
  onApply: (filters: ITournamentBrowseFilters) => void;
  onReset: () => void;
}

const toggleValue = <T,>(values: T[], value: T): T[] =>
  values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];

export default function TournamentFilterDrawer({
  isOpen,
  filters,
  onClose,
  onApply,
  onReset,
}: ITournamentFilterDrawerProps) {
  const t = useTranslations('pages.tournaments.filters');
  const [pendingFilters, setPendingFilters] =
    useState<ITournamentBrowseFilters>(filters);
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPendingFilters(filters);
      setDateError('');
    }
  }, [filters, isOpen]);

  const handlePeriodChange = (period: TTournamentPeriod) => {
    setDateError('');
    setPendingFilters((current) => ({
      ...current,
      period,
      dateFrom: period === 'custom' ? current.dateFrom : '',
      dateTo: period === 'custom' ? current.dateTo : '',
    }));
  };

  const handleSubmit = () => {
    if (
      pendingFilters.period === 'custom' &&
      pendingFilters.dateFrom &&
      pendingFilters.dateTo &&
      pendingFilters.dateFrom > pendingFilters.dateTo
    ) {
      setDateError(t('invalidDateRange'));
      return;
    }
    onApply(pendingFilters);
  };

  const handleReset = () => {
    setDateError('');
    onReset();
  };

  const statuses = Object.values(TournamentStatus);
  const sports = Object.values(SportType);
  const periods: TTournamentPeriod[] = [
    'all',
    'today',
    'next7',
    'next30',
    'custom',
  ];

  return (
    <FilterDrawer
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      onReset={handleReset}
      title={t('title')}
      submitLabel={t('apply')}
      resetLabel={t('reset')}
    >
      <VStack align="stretch" gap={6}>
        <Box>
          <HStack gap={2} mb={3}>
            <CalendarDays size={17} />
            <Text fontSize="sm" fontWeight="bold">
              {t('status.title')}
            </Text>
          </HStack>
          <Flex gap={2} flexWrap="wrap">
            {statuses.map((status) => {
              const isSelected = pendingFilters.statuses.includes(status);
              return (
                <Badge
                  key={status}
                  px={4}
                  py={2}
                  borderRadius="lg"
                  cursor="pointer"
                  variant={isSelected ? 'solid' : 'outline'}
                  colorPalette={isSelected ? 'green' : 'gray'}
                  onClick={() =>
                    setPendingFilters((current) => ({
                      ...current,
                      statuses: toggleValue(current.statuses, status),
                    }))
                  }
                  fontSize="sm"
                  fontWeight="medium"
                  transition="all 0.2s"
                  _hover={{ transform: 'scale(1.05)' }}
                  borderWidth={isSelected ? '0' : '2px'}
                >
                  {t(`status.${status}`)}
                </Badge>
              );
            })}
          </Flex>
        </Box>

        <Box h="1px" bg="border" />

        <Box>
          <HStack gap={2} mb={3}>
            <CalendarDays size={17} />
            <Text fontSize="sm" fontWeight="bold">
              {t('period.title')}
            </Text>
          </HStack>
          <Flex gap={2} flexWrap="wrap">
            {periods.map((period) => {
              const isSelected = pendingFilters.period === period;
              return (
                <Badge
                  key={period}
                  px={4}
                  py={2}
                  borderRadius="lg"
                  cursor="pointer"
                  variant={isSelected ? 'solid' : 'outline'}
                  colorPalette={isSelected ? 'green' : 'gray'}
                  onClick={() => handlePeriodChange(period)}
                  fontSize="sm"
                  fontWeight="medium"
                  transition="all 0.2s"
                  _hover={{ transform: 'scale(1.05)' }}
                  borderWidth={isSelected ? '0' : '2px'}
                >
                  {t(`period.${period}`)}
                </Badge>
              );
            })}
          </Flex>
          {pendingFilters.period === 'custom' && (
            <HStack align="start" gap={3} mt={3}>
              <Box flex={1}>
                <Text fontSize="sm" mb={1} color="fg.muted">
                  {t('period.dateFrom')}
                </Text>
                <Input
                  type="date"
                  value={pendingFilters.dateFrom}
                  onChange={(event) => {
                    setDateError('');
                    setPendingFilters((current) => ({
                      ...current,
                      dateFrom: event.target.value,
                    }));
                  }}
                />
              </Box>
              <Box flex={1}>
                <Text fontSize="sm" mb={1} color="fg.muted">
                  {t('period.dateTo')}
                </Text>
                <Input
                  type="date"
                  value={pendingFilters.dateTo}
                  onChange={(event) => {
                    setDateError('');
                    setPendingFilters((current) => ({
                      ...current,
                      dateTo: event.target.value,
                    }));
                  }}
                />
              </Box>
            </HStack>
          )}
          {dateError && (
            <Text color="red.500" fontSize="sm" mt={2}>
              {dateError}
            </Text>
          )}
        </Box>

        <Box h="1px" bg="border" />

        <LocationFilterFields
          title={t('location.title')}
          selectedCities={pendingFilters.cities}
          selectedDistricts={pendingFilters.districts}
          onCitiesChange={(cities) =>
            setPendingFilters((current) => ({ ...current, cities }))
          }
          onDistrictsChange={(districts) =>
            setPendingFilters((current) => ({ ...current, districts }))
          }
        />

        <Box h="1px" bg="border" />

        <Box>
          <HStack gap={2} mb={3}>
            <Trophy size={17} />
            <Text fontSize="sm" fontWeight="bold">
              {t('sport.title')}
            </Text>
          </HStack>
          <Flex gap={2} flexWrap="wrap">
            {sports.map((sport) => {
              const isSelected = pendingFilters.sports.includes(sport);
              return (
                <Badge
                  key={sport}
                  px={4}
                  py={2}
                  borderRadius="lg"
                  cursor="pointer"
                  variant={isSelected ? 'solid' : 'outline'}
                  colorPalette={isSelected ? 'green' : 'gray'}
                  onClick={() =>
                    setPendingFilters((current) => ({
                      ...current,
                      sports: toggleValue(current.sports, sport),
                    }))
                  }
                  fontSize="sm"
                  fontWeight="medium"
                  transition="all 0.2s"
                  _hover={{ transform: 'scale(1.05)' }}
                  borderWidth={isSelected ? '0' : '2px'}
                >
                  {t(`sport.${sport}`)}
                </Badge>
              );
            })}
          </Flex>
        </Box>
      </VStack>
    </FilterDrawer>
  );
}
