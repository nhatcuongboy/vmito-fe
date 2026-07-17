'use client';

import { AppSearchBar } from '@/components/common/AppSearchBar';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { FavoriteFilterButton } from '@/components/favorites/FavoriteFilterButton';
import PageLayout from '@/components/layout/PageLayout';
import { TournamentCardsGridSkeleton } from '@/components/tournament/skeletons';
import TournamentFilterDrawer, {
  ITournamentBrowseFilters,
  TTournamentPeriod,
} from '@/components/tournament/TournamentFilterDrawer';
import AppEmptyState from '@/components/ui/AppEmptyState';
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
  useUrlFilters,
} from '@/hooks/useUrlFilters';
import { useRouter } from '@/i18n/config';
import { TournamentService } from '@/lib/api/tournament.service';
import { SportType, Tournament, TournamentStatus } from '@/lib/api/types';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { getPrimaryVenueDisplay } from '@/utils';
import {
  Badge,
  Box,
  Flex,
  Heading,
  Image,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  ArrowDownAZ,
  CalendarArrowDown,
  Check,
  ChevronDown,
  Plus,
  Swords,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Suspense, useEffect, useRef, useState } from 'react';

const BADMINTON_PLACEHOLDER = '/icons/app-logo.png';

const TOURNAMENT_FILTERS_SCHEMA = {
  q: stringField(''),
  status: stringArrayField(),
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

const isSameCalendarDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

function TournamentsContent() {
  const t = useTranslations('pages.tournaments');
  const locale = useLocale();
  const router = useRouter();
  const { preferredCity } = usePreferenceStore();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useUrlFilters(TOURNAMENT_FILTERS_SCHEMA);
  const [keyword, setKeyword] = useState(filters.q);
  const { isOpen: showFilters, onToggle: toggleFilters } = useDisclosure(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

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
  const activeFilterCount =
    statuses.length +
    (period !== 'all' ? 1 : 0) +
    filters.city.length +
    filters.district.length +
    sports.length +
    (filters.favorite ? 1 : 0);

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
      } catch (error) {
        console.error('Error loading tournaments:', error);
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
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    if (isSortOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortOpen]);

  const getStatusBadgeLabel = (status: TournamentStatus): string | null => {
    if (status === TournamentStatus.PREPARING) return null;
    return t(`filters.status.${status}`);
  };

  const getStatusBadgeColor = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.PREPARING:
        return { bg: 'green.600', color: 'white' };
      case TournamentStatus.IN_PROGRESS:
        return { bg: 'blue.600', color: 'white' };
      case TournamentStatus.FINISHED:
        return { bg: 'gray.900', color: 'white' };
      case TournamentStatus.CANCELLED:
        return { bg: 'red.600', color: 'white' };
    }
  };

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const fullFormatter = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const shortFormatter = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    if (isSameCalendarDay(start, end)) return fullFormatter.format(start);
    if (
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear()
    ) {
      return `${shortFormatter.format(start)} - ${fullFormatter.format(end)}`;
    }
    return `${fullFormatter.format(start)} - ${fullFormatter.format(end)}`;
  };

  const getLocationText = (tournament: Tournament) => {
    const venue = getPrimaryVenueDisplay(tournament);
    if (!venue) return null;
    const parts: string[] = [];
    if (venue.name) {
      parts.push(venue.name);
      const district = venue.newDistrict || venue.district;
      const city = venue.newCity || venue.city;
      if (district) parts.push(district);
      if (city && city !== district) parts.push(city);
    } else if (venue.address) {
      parts.push(venue.address);
    }
    return parts.filter(Boolean).join(', ') || null;
  };

  const getCoverImage = (tournament: Tournament) => {
    if (tournament.coverPhoto) return tournament.coverPhoto;
    const venue = getPrimaryVenueDisplay(tournament);
    if (venue?.coverPhoto) return venue.coverPhoto;
    if (venue?.images?.length) return venue.images[0];
    return BADMINTON_PLACEHOLDER;
  };

  const sortOptions = [
    { value: 'start_asc', label: t('sort.startDate'), icon: CalendarArrowDown },
    { value: 'newest', label: t('sort.newest'), icon: CalendarArrowDown },
    { value: 'name_asc', label: t('sort.nameAsc'), icon: ArrowDownAZ },
    { value: 'name_desc', label: t('sort.nameDesc'), icon: ArrowDownAZ },
  ];
  const activeSort =
    sortOptions.find((option) => option.value === filters.sort) ??
    sortOptions[0];
  const ActiveSortIcon = activeSort.icon;

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
      <VStack gap={6} alignItems="stretch">
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

        <Flex
          justify="flex-end"
          mt={2}
          mb={3}
          display={{ base: 'none', md: 'flex' }}
        >
          <Button
            colorPalette="green"
            size="sm"
            onClick={() => router.push('/host/tournaments/new')}
          >
            <Plus size={16} />
            {t('createTournament')}
          </Button>
        </Flex>

        <Flex justify="flex-end" align="center" gap={2} minH="32px">
          <FavoriteFilterButton
            isActive={filters.favorite}
            onToggle={() => setFilters({ favorite: !filters.favorite })}
          />
          <Box position="relative" ref={sortRef}>
            <Button
              variant="outline"
              size="sm"
              borderRadius="full"
              onClick={() => setIsSortOpen((value) => !value)}
            >
              <ActiveSortIcon size={14} />
              <Text display={{ base: 'none', md: 'inline' }}>
                {activeSort.label}
              </Text>
              <ChevronDown size={14} />
            </Button>
            {isSortOpen && (
              <Box
                position="absolute"
                right={0}
                top="calc(100% + 6px)"
                bg="bg"
                border="1px solid"
                borderColor="border"
                borderRadius="md"
                boxShadow="lg"
                minW="190px"
                py={1}
                zIndex={20}
              >
                {sortOptions.map((option) => {
                  const OptionIcon = option.icon;
                  const isSelected = option.value === activeSort.value;
                  return (
                    <Flex
                      key={option.value}
                      align="center"
                      gap={2}
                      px={3}
                      py={2}
                      cursor="pointer"
                      color={isSelected ? 'green.600' : 'fg'}
                      bg={isSelected ? 'green.50' : 'transparent'}
                      _dark={{ bg: isSelected ? 'green.900' : 'transparent' }}
                      onClick={() => {
                        setFilters({ sort: option.value });
                        setIsSortOpen(false);
                      }}
                    >
                      <OptionIcon size={14} />
                      <Text flex={1} fontSize="sm">
                        {option.label}
                      </Text>
                      {isSelected && <Check size={14} />}
                    </Flex>
                  );
                })}
              </Box>
            )}
          </Box>
        </Flex>

        {activeFilterCount > (filters.favorite ? 1 : 0) && (
          <Flex gap={2} flexWrap="wrap">
            {statuses.map((status) => (
              <FilterChip
                key={status}
                label={t(`filters.status.${status}`)}
                colorPalette="green"
                onRemove={() =>
                  setFilters({
                    status: statuses.filter((value) => value !== status),
                  })
                }
              />
            ))}
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
        ) : tournaments.length === 0 ? (
          <AppEmptyState
            minH={{ base: '300px', md: '340px' }}
            icon={<Swords size={40} color="var(--chakra-colors-gray-400)" />}
            title={t('noTournamentsFound')}
            description={
              filters.q || activeFilterCount ? t('noResultsDescription') : null
            }
          />
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
            {tournaments.map((tournament) => {
              const coverImage = getCoverImage(tournament);
              const isPlaceholder = coverImage === BADMINTON_PLACEHOLDER;
              const badgeLabel = getStatusBadgeLabel(tournament.status);
              const badgeColor = getStatusBadgeColor(tournament.status);
              const locationText = getLocationText(tournament);
              return (
                <Box
                  key={tournament.id}
                  bg="bg"
                  borderRadius="xl"
                  overflow="hidden"
                  border="1px solid"
                  borderColor="border"
                  cursor="pointer"
                  transition="all 0.25s ease"
                  _hover={{
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
                    transform: 'translateY(-3px)',
                  }}
                  onClick={() =>
                    router.push(
                      `/tournament/${tournament.slug ?? tournament.id}`
                    )
                  }
                >
                  <Box
                    position="relative"
                    h="180px"
                    bg="bg.muted"
                    overflow="hidden"
                  >
                    <Image
                      src={coverImage}
                      alt={tournament.name}
                      w="100%"
                      h="100%"
                      objectFit={isPlaceholder ? 'contain' : 'cover'}
                      objectPosition="center"
                      p={isPlaceholder ? 8 : 0}
                      opacity={isPlaceholder ? 0.6 : 1}
                    />
                    {badgeLabel && (
                      <Badge
                        position="absolute"
                        top={3}
                        right={3}
                        bg={badgeColor.bg}
                        color={badgeColor.color}
                        fontSize="xs"
                        fontWeight="bold"
                        px={3}
                        py={1.5}
                        borderRadius="md"
                        shadow="md"
                      >
                        {badgeLabel}
                      </Badge>
                    )}
                    <Box position="absolute" bottom={3} right={3} zIndex={3}>
                      <FavoriteButton
                        type="TOURNAMENT"
                        targetId={tournament.id}
                        isFavorite={tournament.isFavorite}
                        returnUrl={`/tournament/${tournament.slug ?? tournament.id}`}
                        onChange={(nextValue) =>
                          setTournaments((current) =>
                            current.map((item) =>
                              item.id === tournament.id
                                ? { ...item, isFavorite: nextValue }
                                : item
                            )
                          )
                        }
                      />
                    </Box>
                  </Box>
                  <Box p={4}>
                    <VStack align="stretch" gap={2}>
                      <Text fontSize="xs" color="fg.muted" fontWeight="medium">
                        {formatDateRange(
                          tournament.startDate,
                          tournament.endDate
                        )}
                      </Text>
                      <Heading
                        size="sm"
                        color="fg"
                        fontWeight="bold"
                        lineClamp={2}
                      >
                        {tournament.name}
                      </Heading>
                      {locationText && (
                        <Text fontSize="xs" color="blue.600" lineClamp={2}>
                          {locationText}
                        </Text>
                      )}
                    </VStack>
                  </Box>
                </Box>
              );
            })}
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
