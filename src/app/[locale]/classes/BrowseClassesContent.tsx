'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  CalendarArrowDown,
  Check,
  ChevronDown,
  Filter,
  Heart,
  MapPin,
  Plus,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useTranslations } from 'next-intl';
import PageLayout from '@/components/layout/PageLayout';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { ClassesService } from '@/lib/api/classes.service';
import { FavoriteService } from '@/lib/api/favorite.service';
import type { IClass, IBrowseClassesParams } from '@/types/class';
import { ClassCard } from '@/components/classes/ClassCard';
import ClassCardSkeleton from '@/components/classes/ClassCardSkeleton';
import FeatureFlagGuard from '@/components/guards/FeatureFlagGuard';
import { CLASSES_FEATURE_ENABLED } from '@/constants/feature-flags';
import AppEmptyState from '@/components/ui/AppEmptyState';
import { AppSearchBar } from '@/components/common/AppSearchBar';
import AppViewModeToggle from '@/components/common/AppViewModeToggle';
import { LocationFilterFields } from '@/components/common/LocationFilterFields';
import { useRegisterTopBarSearch } from '@/contexts/TopBarSearchContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useViewMode } from '@/hooks/useViewMode';
import { useDisclosure } from '@/components/ui/ChakraHooks';
import { getUserLocation } from '@/lib/utils/geolocation.utils';
import {
  normalizeUserLocation,
  readUserLocationCookie,
  writeUserLocationCookie,
} from '@/lib/user-location';
import { VALID_LEVELS } from '@/constants/levels';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { TOP_BAR_HEIGHT_DESKTOP, TOP_BAR_HEIGHT_MOBILE } from '@/constants';
import { Link } from '@/i18n/config';

const PAGE_SIZE = 12;
const DAYS = [0, 1, 2, 3, 4, 5, 6];

type Filters = {
  sportType: string;
  cities: string[];
  districts: string[];
  level: string;
  dayOfWeek: string;
  timeFrom: string;
  timeTo: string;
  minTuition: string;
  maxTuition: string;
  nearMe: boolean;
  favoriteOnly: boolean;
};
const EMPTY_FILTERS: Filters = {
  sportType: '',
  cities: [],
  districts: [],
  level: '',
  dayOfWeek: '',
  timeFrom: '',
  timeTo: '',
  minTuition: '',
  maxTuition: '',
  nearMe: false,
  favoriteOnly: false,
};

export default function BrowseClassesContent() {
  const t = useTranslations('classes');
  const { getLevelShortLabel } = useLevelLabel();
  const [items, setItems] = useState<IClass[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true),
    [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState(''),
    [filters, setFilters] = useState<Filters>(EMPTY_FILTERS),
    [pending, setPending] = useState<Filters>(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState<'newest' | 'distance'>('newest'),
    [sortOpen, setSortOpen] = useState(false),
    [page, setPage] = useState(1),
    [hasMore, setHasMore] = useState(false);
  const [location, setLocation] = useState(readUserLocationCookie);
  const { isOpen, onToggle } = useDisclosure(false);
  const [viewMode] = useViewMode('classes', 'list');
  const debouncedSearch = useDebounce(search, 500);
  const { ref, inView } = useInView({ rootMargin: '400px 0px' });
  const loadingMoreRef = useRef(false),
    sortRef = useRef<HTMLDivElement>(null);
  const activeCount =
    Number(!!filters.sportType) +
    filters.cities.length +
    filters.districts.length +
    Number(!!filters.level) +
    Number(!!filters.dayOfWeek) +
    Number(!!filters.timeFrom || !!filters.timeTo) +
    Number(!!filters.minTuition || !!filters.maxTuition) +
    Number(filters.nearMe) +
    Number(filters.favoriteOnly);

  const fetchItems = useCallback(
    async (nextPage: number, append = false) => {
      if (append && loadingMoreRef.current) return;
      if (append) {
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const params: IBrowseClassesParams = {
        page: nextPage,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        sportType:
          (filters.sportType as IBrowseClassesParams['sportType']) || undefined,
        city: filters.cities[0],
        district: filters.districts[0],
        level: filters.level || undefined,
        dayOfWeek: filters.dayOfWeek ? Number(filters.dayOfWeek) : undefined,
        timeFrom: filters.timeFrom || undefined,
        timeTo: filters.timeTo || undefined,
        minTuition: filters.minTuition ? Number(filters.minTuition) : undefined,
        maxTuition: filters.maxTuition ? Number(filters.maxTuition) : undefined,
        favoriteOnly: filters.favoriteOnly || undefined,
        sortBy,
      };
      if ((filters.nearMe || sortBy === 'distance') && location) {
        params.lat = location.lat;
        params.lng = location.lng;
        params.sortBy = 'distance';
      }
      try {
        const result = await ClassesService.browse(params);
        setItems((prev) =>
          append
            ? [
                ...prev,
                ...result.items.filter((x) => !prev.some((p) => p.id === x.id)),
              ]
            : result.items
        );
        setTotal(result.total);
        setPage(nextPage);
        setHasMore(nextPage < result.totalPages);
      } catch {
        if (!append) setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    },
    [debouncedSearch, filters, location, sortBy]
  );
  useEffect(() => {
    void fetchItems(1);
  }, [fetchItems]);
  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore)
      void fetchItems(page + 1, true);
  }, [fetchItems, hasMore, inView, loading, loadingMore, page]);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setSortOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  useRegisterTopBarSearch({
    value: search,
    onChange: setSearch,
    placeholder: t('searchPlaceholder'),
    onFilterClick: onToggle,
    activeFilterCount: activeCount,
    showFilter: true,
  });
  const favorite = async (item: IClass) => {
    try {
      if (item.isFavorite) {
        await FavoriteService.removeFavorite('CLASS', item.id);
      } else {
        await FavoriteService.addFavorite('CLASS', item.id);
      }
      setItems((current) =>
        current
          .map((value) =>
            value.id === item.id
              ? { ...value, isFavorite: !value.isFavorite }
              : value
          )
          .filter((value) => !filters.favoriteOnly || value.isFavorite)
      );
    } catch {}
  };
  const apply = () => {
    setFilters(pending);
    onToggle();
  };
  const reset = () => {
    setPending(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setLocation(null);
    onToggle();
  };
  const enableNearMe = async () => {
    if (pending.nearMe) {
      setPending({ ...pending, nearMe: false });
      return;
    }
    try {
      const next = normalizeUserLocation(await getUserLocation());
      writeUserLocationCookie(next);
      setLocation(next);
      setPending({ ...pending, nearMe: true });
    } catch {
      setPending({ ...pending, nearMe: false });
    }
  };
  const remove = (key: keyof Filters) =>
    setFilters((current) => ({
      ...current,
      [key]: Array.isArray(current[key])
        ? []
        : typeof current[key] === 'boolean'
          ? false
          : '',
    }));
  const sortLabel = sortBy === 'distance' ? t('nearest') : t('newest');
  return (
    <FeatureFlagGuard enabled={CLASSES_FEATURE_ENABLED}>
      <PageLayout title={t('browseClasses')}>
        <Box>
          <Box
            position={{ base: 'fixed', md: 'sticky' }}
            top={{
              base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
              md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
            }}
            left={0}
            right={0}
            zIndex={1100}
            bg={{ base: 'bg', md: 'transparent' }}
            pt={2}
            display={{ base: 'block', md: 'none' }}
          >
            <AppSearchBar
              value={search}
              onChange={setSearch}
              placeholder={t('searchPlaceholder')}
              onFilterClick={onToggle}
              activeFilterCount={activeCount}
              showCitySelector
            />
          </Box>
          <Flex
            justify="flex-end"
            mt={2}
            mb={3}
            display={{ base: 'none', md: 'flex' }}
          >
            <Link href="/classes/create">
              <Button colorPalette="green" size="sm">
                <Plus size={16} />
                {t('createClass')}
              </Button>
            </Link>
          </Flex>
          {!loading && (
            <VStack align="stretch" gap={2} mb={4}>
              <Flex align="center" gap={2}>
                <Text
                  fontSize="sm"
                  color="fg.muted"
                  display={{ base: 'none', md: 'block' }}
                >
                  {t('resultsCount', { count: total ?? 0 })}
                </Text>
                <Flex ml="auto" gap={2}>
                  <Box position="relative" ref={sortRef}>
                    <Button
                      size="sm"
                      variant="outline"
                      borderRadius="full"
                      onClick={() => setSortOpen(!sortOpen)}
                    >
                      <SlidersHorizontal size={14} />
                      {sortLabel}
                      <ChevronDown size={14} />
                    </Button>
                    {sortOpen && (
                      <Box
                        position="absolute"
                        right={0}
                        top="calc(100% + 6px)"
                        zIndex={20}
                        bg="bg"
                        borderWidth="1px"
                        borderRadius="xl"
                        overflow="hidden"
                        minW="160px"
                      >
                        {(['newest', 'distance'] as const).map((value) => (
                          <Flex
                            key={value}
                            px={3}
                            py={2}
                            gap={2}
                            cursor="pointer"
                            bg={sortBy === value ? 'green.50' : undefined}
                            onClick={() => {
                              setSortBy(value);
                              setSortOpen(false);
                            }}
                          >
                            <CalendarArrowDown size={15} />
                            <Text>
                              {value === 'distance'
                                ? t('nearest')
                                : t('newest')}
                            </Text>
                            {sortBy === value && <Check size={14} />}
                          </Flex>
                        ))}
                      </Box>
                    )}
                  </Box>
                  <AppViewModeToggle
                    scope="classes"
                    defaultMode="list"
                    listFirst
                    showMap={false}
                  />
                </Flex>
              </Flex>
              {activeCount > 0 && (
                <Flex gap={2} wrap="wrap">
                  {filters.nearMe && (
                    <FilterChip
                      label={t('nearMe')}
                      onRemove={() => remove('nearMe')}
                    />
                  )}
                  {filters.favoriteOnly && (
                    <FilterChip
                      label={t('savedClasses')}
                      onRemove={() => remove('favoriteOnly')}
                    />
                  )}
                  {filters.sportType && (
                    <FilterChip
                      label={
                        filters.sportType === 'PICKLEBALL'
                          ? t('pickleball')
                          : t('badminton')
                      }
                      onRemove={() => remove('sportType')}
                    />
                  )}
                  {filters.cities.map((x) => (
                    <FilterChip
                      key={x}
                      label={x}
                      onRemove={() => remove('cities')}
                    />
                  ))}
                  {filters.level && (
                    <FilterChip
                      label={getLevelShortLabel(Number(filters.level))}
                      onRemove={() => remove('level')}
                    />
                  )}
                </Flex>
              )}
            </VStack>
          )}
          {loading && !items.length ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
              {Array.from({ length: 6 }).map((_, i) => (
                <ClassCardSkeleton
                  key={i}
                  variant={viewMode === 'list' ? 'list' : 'grid'}
                />
              ))}
            </SimpleGrid>
          ) : !items.length ? (
            <AppEmptyState
              minH="320px"
              icon={<Heart size={40} />}
              title={t('noClassesFound')}
              actions={
                activeCount ? (
                  <Button onClick={reset}>{t('clearFilters')}</Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                {items.map((item, i) => (
                  <ClassCard
                    key={item.id}
                    item={item}
                    onFavorite={favorite}
                    variant={viewMode === 'list' ? 'list' : 'grid'}
                    imagePriority={i === 0}
                  />
                ))}
              </SimpleGrid>
              {loadingMore && (
                <SimpleGrid mt={8} columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <ClassCardSkeleton
                      key={i}
                      variant={viewMode === 'list' ? 'list' : 'grid'}
                    />
                  ))}
                </SimpleGrid>
              )}
              {hasMore && <Box ref={ref} h="24px" mt={8} />}
            </>
          )}
          {isOpen && (
            <>
              <Box
                position="fixed"
                inset={0}
                bg="blackAlpha.600"
                zIndex={2000}
                onClick={onToggle}
              />
              <Box
                position="fixed"
                top={0}
                right={0}
                bottom={0}
                width={{ base: '90%', md: '500px' }}
                bg="bg"
                zIndex={2100}
                display="flex"
                flexDirection="column"
              >
                <Flex
                  px={4}
                  h={{
                    base: `${TOP_BAR_HEIGHT_MOBILE}px`,
                    md: `${TOP_BAR_HEIGHT_DESKTOP}px`,
                  }}
                  align="center"
                  justify="space-between"
                  borderBottomWidth="1px"
                >
                  <HStack>
                    <Filter size={20} />
                    <Heading size="md">{t('filters')}</Heading>
                  </HStack>
                  <IconButton
                    aria-label={t('close')}
                    variant="ghost"
                    icon={<X size={20} />}
                    onClick={onToggle}
                  />
                </Flex>
                <Box flex="1" overflowY="auto" p={5}>
                  <VStack align="stretch" gap={5}>
                    <Button
                      variant={pending.nearMe ? 'solid' : 'outline'}
                      colorPalette="green"
                      onClick={() => void enableNearMe()}
                    >
                      <MapPin size={16} />
                      {t('nearMe')}
                    </Button>
                    <label>
                      {t('sport')}
                      <select
                        value={pending.sportType}
                        onChange={(e) =>
                          setPending({ ...pending, sportType: e.target.value })
                        }
                      >
                        <option value="">{t('allSports')}</option>
                        <option value="BADMINTON">{t('badminton')}</option>
                        <option value="PICKLEBALL">{t('pickleball')}</option>
                      </select>
                    </label>
                    <LocationFilterFields
                      selectedCities={pending.cities}
                      selectedDistricts={pending.districts}
                      onCitiesChange={(cities) =>
                        setPending({ ...pending, cities })
                      }
                      onDistrictsChange={(districts) =>
                        setPending({ ...pending, districts })
                      }
                    />
                    <label>
                      {t('level')}
                      <select
                        value={pending.level}
                        onChange={(e) =>
                          setPending({ ...pending, level: e.target.value })
                        }
                      >
                        <option value="">{t('allLevels')}</option>
                        {VALID_LEVELS.map((l) => (
                          <option key={l} value={l}>
                            {getLevelShortLabel(l)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {t('day')}
                      <select
                        value={pending.dayOfWeek}
                        onChange={(e) =>
                          setPending({ ...pending, dayOfWeek: e.target.value })
                        }
                      >
                        <option value="">{t('allDays')}</option>
                        {DAYS.map((d) => (
                          <option key={d} value={d}>
                            {t(`dayNames.${d}`)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <HStack>
                      <label>
                        {t('from')}
                        <input
                          type="time"
                          value={pending.timeFrom}
                          onChange={(e) =>
                            setPending({ ...pending, timeFrom: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        {t('to')}
                        <input
                          type="time"
                          value={pending.timeTo}
                          onChange={(e) =>
                            setPending({ ...pending, timeTo: e.target.value })
                          }
                        />
                      </label>
                    </HStack>
                    <HStack>
                      <label>
                        {t('minTuition')}
                        <input
                          type="number"
                          value={pending.minTuition}
                          onChange={(e) =>
                            setPending({
                              ...pending,
                              minTuition: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        {t('maxTuition')}
                        <input
                          type="number"
                          value={pending.maxTuition}
                          onChange={(e) =>
                            setPending({
                              ...pending,
                              maxTuition: e.target.value,
                            })
                          }
                        />
                      </label>
                    </HStack>
                    <Button
                      variant={pending.favoriteOnly ? 'solid' : 'outline'}
                      onClick={() =>
                        setPending({
                          ...pending,
                          favoriteOnly: !pending.favoriteOnly,
                        })
                      }
                    >
                      <Star size={16} />
                      {t('savedClasses')}
                    </Button>
                  </VStack>
                </Box>
                <Flex p={4} gap={3} borderTopWidth="1px">
                  <Button flex="1" colorPalette="green" onClick={apply}>
                    {t('apply')}
                  </Button>
                  <Button flex="1" variant="outline" onClick={reset}>
                    {t('reset')}
                  </Button>
                </Flex>
              </Box>
            </>
          )}
        </Box>
      </PageLayout>
    </FeatureFlagGuard>
  );
}
function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Badge
      colorPalette="green"
      variant="subtle"
      borderRadius="full"
      px={3}
      py={1}
    >
      {label}
      <Box as="button" ml={1} onClick={onRemove}>
        <X size={12} />
      </Box>
    </Badge>
  );
}
