'use client';

import { AppSearchBar } from '@/components/common/AppSearchBar';
import PageLayout from '@/components/layout/PageLayout';
import { TournamentCardsGridSkeleton } from '@/components/tournament/skeletons';
import TournamentCard from '@/components/tournament/TournamentCard';
import TournamentFilterDrawer, {
  ITournamentBrowseFilters,
  TTournamentPeriod,
} from '@/components/tournament/TournamentFilterDrawer';
import TournamentSortMenu from '@/components/tournament/TournamentSortMenu';
import { TournamentStatusSelect } from '@/components/tournament/TournamentStatusSelect';
import AppEmptyState from '@/components/ui/AppEmptyState';
import AppErrorState from '@/components/ui/AppErrorState';
import { useDisclosure } from '@/components/ui/ChakraHooks';
import { Button, SimpleGrid } from '@/components/ui/chakra-compat';
import { FilterChip } from '@/components/ui/FilterChip';
import { TOP_BAR_HEIGHT_MOBILE } from '@/constants';
import {
  normalizeCityForApi,
  VIETNAM_CITIES,
} from '@/constants/vietnam-locations';
import { useRegisterTopBarSearch } from '@/contexts/TopBarSearchContext';
import {
  booleanField,
  stringArrayField,
  stringField,
  type UrlFilterField,
  useUrlFilters,
} from '@/hooks/useUrlFilters';
import { useRouter } from '@/i18n/config';
import {
  classifyApiError,
  getUserFacingErrorMessage,
  logApiError,
  type ApiErrorKind,
} from '@/lib/api/apiError';
import { TournamentService } from '@/lib/api/tournament.service';
import { SportType, Tournament, TournamentStatus } from '@/lib/api/types';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { Box, Flex, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import { Plus, Swords } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Suspense, useEffect, useState } from 'react';

const statusArrayField = stringArrayField();
const TOURNAMENT_STATUS_FIELD: UrlFilterField<string[]> = {
  fromQuery: (raw) => {
    if (raw === 'all') return [];
    if (raw === null) return [TournamentStatus.PREPARING];
    return statusArrayField.fromQuery(raw);
  },
  toQuery: (value) =>
    value.length === 0 ? 'all' : statusArrayField.toQuery(value),
};

const TOURNAMENT_FILTERS_SCHEMA = {
  q: stringField(''),
  status: TOURNAMENT_STATUS_FIELD,
  period: stringField('all'),
  from: stringField(''),
  to: stringField(''),
  city: stringArrayField(),
  district: stringArrayField(),
  sport: stringArrayField(),
  sort: stringField('start_asc'),
  favorite: booleanField(false),
};

const PERIODS: TTournamentPeriod[] = [
  'all',
  'today',
  'next7',
  'next30',
  'custom',
];

const formatDateForQuery = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDateBounds = (
  period: TTournamentPeriod,
  dateFrom: string,
  dateTo: string
) => {
  if (period === 'custom') {
    return { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined };
  }
  if (period === 'all') return {};

  const start = new Date();
  const end = new Date(start);
  if (period === 'next7') end.setDate(start.getDate() + 6);
  if (period === 'next30') end.setDate(start.getDate() + 29);
  return {
    dateFrom: formatDateForQuery(start),
    dateTo: formatDateForQuery(end),
  };
};

function TournamentsContent() {
  const t = useTranslations('pages.tournaments');
  const router = useRouter();
  const { preferredCity } = usePreferenceStore();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    kind: ApiErrorKind;
    message: string;
  } | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [filters, setFilters] = useUrlFilters(TOURNAMENT_FILTERS_SCHEMA);
  const [keyword, setKeyword] = useState(filters.q);
  const { isOpen: showFilters, onToggle: toggleFilters } = useDisclosure(false);

  const statuses = filters.status.filter((status): status is TournamentStatus =>
    Object.values(TournamentStatus).includes(status as TournamentStatus)
  );
  const sports = filters.sport.filter((sport): sport is SportType =>
    Object.values(SportType).includes(sport as SportType)
  );
  const period = PERIODS.includes(filters.period as TTournamentPeriod)
    ? (filters.period as TTournamentPeriod)
    : 'all';
  const appliedDrawerFilters: ITournamentBrowseFilters = {
    statuses,
    period,
    dateFrom: filters.from,
    dateTo: filters.to,
    cities: filters.city,
    districts: filters.district,
    sports,
  };
  const isDefaultStatus =
    statuses.length === 1 && statuses[0] === TournamentStatus.PREPARING;
  const statusFilterCount = isDefaultStatus ? 0 : statuses.length;
  const activeFilterCount =
    statusFilterCount +
    (period !== 'all' ? 1 : 0) +
    filters.city.length +
    filters.district.length +
    sports.length;
  // favoriteOnly is excluded from filter count as it's now in the tab nav

  useRegisterTopBarSearch({
    placeholder: t('searchEvents'),
    value: keyword,
    onChange: setKeyword,
    onFilterClick: toggleFilters,
    activeFilterCount,
    showFilter: true,
  });

  useEffect(() => {
    const timer = setTimeout(() => setFilters({ q: keyword }), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  useEffect(() => setKeyword(filters.q), [filters.q]);

  const statusesKey = statuses.join(',');
  const sportsKey = sports.join(',');
  const citiesKey = filters.city.join(',');
  const districtsKey = filters.district.join(',');

  useEffect(() => {
    let isActive = true;
    const loadTournaments = async () => {
      try {
        setLoading(true);
        setError(null);
        const dateBounds = getDateBounds(period, filters.from, filters.to);
        const selectedCities =
          filters.city.length > 0
            ? filters.city
            : preferredCity
              ? [preferredCity]
              : [];
        const city = selectedCities
          .map((cityCode) => {
            const cityName =
              VIETNAM_CITIES.find((item) => item.code === cityCode)?.name ??
              cityCode;
            return normalizeCityForApi(cityName);
          })
          .join(',');
        const sortMap = {
          start_asc: { sortBy: 'startDate', sortOrder: 'asc' },
          newest: { sortBy: 'createdAt', sortOrder: 'desc' },
          name_asc: { sortBy: 'name', sortOrder: 'asc' },
          name_desc: { sortBy: 'name', sortOrder: 'desc' },
        } as const;
        const sort =
          sortMap[filters.sort as keyof typeof sortMap] ?? sortMap.start_asc;
        const data = await TournamentService.getAllTournaments({
          keyword: filters.q || undefined,
          status: statuses.length ? statuses : undefined,
          sportType: sports.length ? sports : undefined,
          city: city || undefined,
          district: filters.district.join(',') || undefined,
          ...dateBounds,
          ...sort,
          favoriteOnly: filters.favorite || undefined,
          publishedOnly: true,
        });
        if (isActive) setTournaments(data);
      } catch (caught) {
        logApiError(caught);
        // A failed fetch used to fall through to the "no tournaments found"
        // empty state, which reads as "none exist" rather than "try again".
        if (isActive) {
          setTournaments([]);
          setError({
            kind: classifyApiError(caught),
            message: getUserFacingErrorMessage(caught),
          });
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };
    loadTournaments();
    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.q,
    statusesKey,
    sportsKey,
    citiesKey,
    districtsKey,
    period,
    filters.from,
    filters.to,
    filters.sort,
    filters.favorite,
    preferredCity,
    reloadToken,
  ]);

  const handleFavoriteChange = (tournamentId: string, isFavorite: boolean) =>
    setTournaments((current) =>
      current.map((item) =>
        item.id === tournamentId ? { ...item, isFavorite } : item
      )
    );

  const handleApplyFilters = (nextFilters: ITournamentBrowseFilters) => {
    setFilters({
      status: nextFilters.statuses,
      period: nextFilters.period,
      from: nextFilters.dateFrom,
      to: nextFilters.dateTo,
      city: nextFilters.cities,
      district: nextFilters.districts,
      sport: nextFilters.sports,
    });
    toggleFilters();
  };

  const handleResetFilters = () => {
    setFilters({
      status: [],
      period: 'all',
      from: '',
      to: '',
      city: [],
      district: [],
      sport: [],
    });
    toggleFilters();
  };

  const handleRemoveCity = (cityCode: string) => {
    const cities = filters.city.filter((value) => value !== cityCode);
    const validDistricts = new Set(
      VIETNAM_CITIES.filter((city) => cities.includes(city.code)).flatMap(
        (city) => city.districts.map((district) => district.name)
      )
    );
    setFilters({
      city: cities,
      district: filters.district.filter((district) =>
        validDistricts.has(district)
      ),
    });
  };

  return (
    <PageLayout
      title={t('title')}
      maxW="7xl"
      bg="green.50"
      _dark={{ bg: 'gray.900' }}
      minH="100vh"
    >
      <VStack gap={{ base: 3, md: 4 }} alignItems="stretch">
        <Box
          position="fixed"
          top={`calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`}
          left={0}
          right={0}
          width="100vw"
          zIndex={1100}
          bg="bg"
          pt={2}
          display={{ base: 'block', md: 'none' }}
        >
          <Box w="100%" maxW="650px" mx="auto">
            <AppSearchBar
              placeholder={t('searchEvents')}
              value={keyword}
              onChange={setKeyword}
              onFilterClick={toggleFilters}
              activeFilterCount={activeFilterCount}
              showFilter={true}
              showCitySelector={true}
            />
          </Box>
        </Box>

        {/* Top action row: Create tournament button on desktop (matching Find Sessions layout) */}
        <Flex justify="flex-end" display={{ base: 'none', md: 'flex' }}>
          <Button
            colorPalette="green"
            borderRadius="xl"
            px={4}
            py={2}
            h="40px"
            fontWeight="semibold"
            aria-label={t('createTournament')}
            onClick={() => router.push('/host/tournaments/new')}
          >
            <Plus size={18} />
            <Text>{t('createTournament')}</Text>
          </Button>
        </Flex>

        {/* Results header row: Result count on left, status select & sort menu on right */}
        <Flex justify="space-between" align="center" gap={3} flexWrap="wrap">
          <Box minW={0} display={{ base: 'none', md: 'block' }}>
            {!loading && !error && (
              <Text fontSize="sm" color="fg.muted">
                {t('resultCount', { count: tournaments.length })}
              </Text>
            )}
          </Box>

          <HStack gap={2} ml="auto" flexShrink={0}>
            <TournamentStatusSelect
              value={statuses}
              onChange={(nextStatuses) => setFilters({ status: nextStatuses })}
            />

            <TournamentSortMenu
              value={filters.sort}
              onChange={(nextSort) => setFilters({ sort: nextSort })}
            />
          </HStack>
        </Flex>

        {/* Status is represented by the select above, so it is not repeated here. */}
        {activeFilterCount - statusFilterCount > 0 && (
          <Flex gap={2} flexWrap="wrap">
            {period !== 'all' && (
              <FilterChip
                label={t(`filters.period.${period}`)}
                colorPalette="blue"
                onRemove={() => setFilters({ period: 'all', from: '', to: '' })}
              />
            )}
            {filters.city.map((cityCode) => (
              <FilterChip
                key={cityCode}
                label={
                  VIETNAM_CITIES.find((city) => city.code === cityCode)?.name ??
                  cityCode
                }
                colorPalette="teal"
                onRemove={() => handleRemoveCity(cityCode)}
              />
            ))}
            {filters.district.map((district) => (
              <FilterChip
                key={district}
                label={district}
                colorPalette="cyan"
                onRemove={() =>
                  setFilters({
                    district: filters.district.filter(
                      (value) => value !== district
                    ),
                  })
                }
              />
            ))}
            {sports.map((sport) => (
              <FilterChip
                key={sport}
                label={t(`filters.sport.${sport}`)}
                colorPalette="orange"
                onRemove={() =>
                  setFilters({
                    sport: sports.filter((value) => value !== sport),
                  })
                }
              />
            ))}
          </Flex>
        )}

        {loading ? (
          <TournamentCardsGridSkeleton />
        ) : error ? (
          <AppErrorState
            minH={{ base: '300px', md: '340px' }}
            type={error.kind === 'client' ? 'generic' : error.kind}
            title={t('loadError')}
            description={error.message}
            retryLabel={t('retry')}
            onRetry={() => setReloadToken((token) => token + 1)}
          />
        ) : tournaments.length === 0 ? (
          <AppEmptyState
            minH={{ base: '300px', md: '340px' }}
            bg="bg"
            borderColor="green.100"
            icon={<Swords size={40} color="var(--chakra-colors-green-400)" />}
            title={t('noTournamentsFound')}
            description={
              filters.q || activeFilterCount ? t('noResultsDescription') : null
            }
            actions={
              <Button
                colorPalette="green"
                size="sm"
                borderRadius="full"
                onClick={() => router.push('/host/tournaments/new')}
              >
                <Plus size={16} />
                {t('createTournament')}
              </Button>
            }
          />
        ) : (
          <SimpleGrid
            columns={{ base: 1, md: 2, lg: 3, xl: 4 }}
            spacing={{ base: 3, md: 5 }}
          >
            {tournaments.map((tournament, index) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                imagePriority={index < 4}
                onFavoriteChange={handleFavoriteChange}
              />
            ))}
          </SimpleGrid>
        )}
      </VStack>

      <TournamentFilterDrawer
        isOpen={showFilters}
        filters={appliedDrawerFilters}
        onClose={toggleFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />
    </PageLayout>
  );
}

export default function BrowseTournamentsContent() {
  return (
    <Suspense
      fallback={
        <Box p={4}>
          <TournamentCardsGridSkeleton />
        </Box>
      }
    >
      <TournamentsContent />
    </Suspense>
  );
}
