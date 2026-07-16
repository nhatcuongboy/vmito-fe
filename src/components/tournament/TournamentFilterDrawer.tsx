'use client';

import { Button } from '@/components/ui/chakra-compat';
import { FilterDrawer } from '@/components/ui/FilterDrawer';
import { Input } from '@/components/ui/Input';
import { VIETNAM_CITIES } from '@/constants/vietnam-locations';
import { SportType, TournamentStatus } from '@/lib/api/types';
import { Badge, Box, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { CalendarDays, MapPin, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

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

  const availableDistricts = useMemo(
    () =>
      VIETNAM_CITIES.filter((city) =>
        pendingFilters.cities.includes(city.code)
      ).flatMap((city) => city.districts),
    [pendingFilters.cities]
  );

  const handleToggleCity = (cityCode: string) => {
    const nextCities = toggleValue(pendingFilters.cities, cityCode);
    const validDistrictNames = new Set(
      VIETNAM_CITIES.filter((city) => nextCities.includes(city.code)).flatMap(
        (city) => city.districts.map((district) => district.name)
      )
    );
    setPendingFilters((current) => ({
      ...current,
      cities: nextCities,
      districts: current.districts.filter((district) =>
        validDistrictNames.has(district)
      ),
    }));
  };

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
            <Text fontWeight="bold">{t('status.title')}</Text>
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
            <Text fontWeight="bold">{t('period.title')}</Text>
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

        <Box>
          <HStack gap={2} mb={3}>
            <MapPin size={17} />
            <Text fontWeight="bold">{t('location.title')}</Text>
          </HStack>
          <Flex gap={2} flexWrap="wrap">
            {VIETNAM_CITIES.map((city) => {
              const isSelected = pendingFilters.cities.includes(city.code);
              return (
                <Badge
                  key={city.code}
                  px={4}
                  py={2}
                  borderRadius="lg"
                  cursor="pointer"
                  variant={isSelected ? 'solid' : 'outline'}
                  colorPalette={isSelected ? 'green' : 'gray'}
                  onClick={() => handleToggleCity(city.code)}
                >
                  {city.name}
                </Badge>
              );
            })}
          </Flex>
          {availableDistricts.length > 0 && (
            <Box mt={4}>
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                {t('location.district')}
              </Text>
              <Flex gap={2} flexWrap="wrap">
                {availableDistricts.map((district) => {
                  const isSelected = pendingFilters.districts.includes(
                    district.name
                  );
                  return (
                    <Button
                      key={`${district.code}-${district.name}`}
                      size="xs"
                      variant={isSelected ? 'solid' : 'outline'}
                      colorPalette={isSelected ? 'green' : 'gray'}
                      onClick={() =>
                        setPendingFilters((current) => ({
                          ...current,
                          districts: toggleValue(
                            current.districts,
                            district.name
                          ),
                        }))
                      }
                    >
                      {district.name}
                    </Button>
                  );
                })}
              </Flex>
            </Box>
          )}
        </Box>

        <Box h="1px" bg="border" />

        <Box>
          <HStack gap={2} mb={3}>
            <Trophy size={17} />
            <Text fontWeight="bold">{t('sport.title')}</Text>
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
