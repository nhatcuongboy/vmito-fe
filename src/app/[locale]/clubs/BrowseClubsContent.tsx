'use client';
import { Suspense, useState, useEffect, useRef } from 'react';
import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  ArrowDownAZ,
  CalendarArrowDown,
  Check,
  ChevronDown,
  Filter,
  MapPin,
  Plus,
  Star,
  Users,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useInView } from 'react-intersection-observer';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { useDisclosure } from '@/components/ui/ChakraHooks';
import { toaster } from '@/components/ui/toaster';
import { LocationFilterFields } from '@/components/common/LocationFilterFields';
import {
  VIETNAM_CITIES,
  normalizeCityForApi,
} from '@/constants/vietnam-locations';
import {
  TOP_BAR_HEIGHT_MOBILE,
  TOP_BAR_HEIGHT_DESKTOP,
  ROUTES,
  BOTTOM_TAB_HEIGHT,
} from '@/constants';
import { getUserLocation } from '@/lib/utils/geolocation.utils';
import { usePathname, useRouter } from '@/i18n/config';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { ClubsService } from '@/lib/api/clubs.service';
import { VenueService } from '@/lib/api/venue.service';
import { Venue } from '@/lib/api/types';
import ClubCard from '@/components/clubs/ClubCard';
import ClubCardSkeleton from '@/components/clubs/ClubCardSkeleton';
import ClubMap from '@/components/clubs/ClubMap';
import AppViewModeToggle from '@/components/common/AppViewModeToggle';
import AppEmptyState from '@/components/ui/AppEmptyState';
import { useViewMode } from '@/hooks/useViewMode';
import { IClubListItem, IClub, IClubVenue } from '@/types/club';
import PageLayout from '@/components/layout/PageLayout';
import { useDebounce } from '@/hooks/useDebounce';
import { AppSearchBar } from '@/components/common/AppSearchBar';
import { useRegisterTopBarSearch } from '@/contexts/TopBarSearchContext';
import { useSearchParams } from 'next/navigation';
import { getFullRowSkeletonDisplay } from '@/components/common/infinite-loading-layout';

const LoginPromptModal = dynamic(
  () => import('@/components/auth/LoginPromptModal'),
  { ssr: false }
);

const CLUB_SKELETON_COUNT = 6;
const CLUB_MAP_PAGE_SIZE = 500;
const CLUB_RESULT_GRID_COLUMNS = { base: 1, md: 2, lg: 3 };
const CLUB_RESULT_COLUMN_COUNTS = { base: 1, md: 2, lg: 3 };
const CLUB_LOAD_MORE_SKELETON_DISPLAYS = [
  { base: 'flex', md: 'flex', lg: 'flex' },
  { base: 'none', md: 'flex', lg: 'flex' },
  { base: 'none', md: 'none', lg: 'flex' },
];

type ClubMapClub = (IClub | IClubListItem) & {
  scheduleVenues?: IClubVenue[];
};

const normalizeVenueLookupText = (value?: string | null) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const parseVenueFromScheduleNote = (note?: string | null) => {
  if (!note) return null;

  const [rawName, ...rawAddressParts] = note
    .split('|')
    .map((part) => part.trim());
  const name = rawName || '';
  if (!name) return null;

  return {
    name,
    address: rawAddressParts.join(' | ').trim(),
    note,
  };
};

const hasVenueCoordinates = (venue?: Pick<IClubVenue, 'lat' | 'lng'> | null) =>
  typeof venue?.lat === 'number' && typeof venue?.lng === 'number';

const toClubVenue = (venue: Venue): IClubVenue => ({
  id: venue.id,
  name: venue.name,
  address: venue.address,
  district: venue.district,
  city: venue.city,
  newAddress: venue.newAddress,
  newDistrict: venue.newDistrict,
  newCity: venue.newCity,
  lat: venue.lat,
  lng: venue.lng,
});

const findBestVenueMatch = (
  candidates: Venue[],
  target: { name: string; address?: string }
) => {
  const targetName = normalizeVenueLookupText(target.name);
  const targetAddress = normalizeVenueLookupText(target.address);

  return (
    candidates.find((venue) => {
      const venueName = normalizeVenueLookupText(venue.name);
      const venueAddress = normalizeVenueLookupText(venue.address);

      if (venueName !== targetName) return false;
      if (!targetAddress) return true;

      return (
        venueAddress.includes(targetAddress) ||
        targetAddress.includes(venueAddress)
      );
    }) ||
    candidates.find(
      (venue) => normalizeVenueLookupText(venue.name) === targetName
    ) ||
    null
  );
};

interface IClubSortOption {
  value: string;
  label: string;
  sortBy: 'distance' | 'relevance' | 'createdAt' | 'name';
  sortOrder: 'asc' | 'desc';
  icon: React.ComponentType<{ size?: number }>;
}

const CLUB_SORT_OPTIONS: IClubSortOption[] = [
  {
    value: 'distance',
    label: 'Gần nhất',
    sortBy: 'distance',
    sortOrder: 'asc',
    icon: MapPin,
  },
  {
    value: 'relevance',
    label: 'Phù hợp nhất',
    sortBy: 'relevance',
    sortOrder: 'desc',
    icon: Star,
  },
  {
    value: 'newest',
    label: 'Mới nhất',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    icon: CalendarArrowDown,
  },
  {
    value: 'name_asc',
    label: 'Tên A→Z',
    sortBy: 'name',
    sortOrder: 'asc',
    icon: ArrowDownAZ,
  },
];

function BrowseClubsContent() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const preferredCity = usePreferenceStore((s) => s.preferredCity);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [viewMode] = useViewMode('clubs', 'list');

  const [clubs, setClubs] = useState<IClubListItem[]>([]);
  const [fullClubs, setFullClubs] = useState<ClubMapClub[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingFullDetails, setIsLoadingFullDetails] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Active filters
  const [search, setSearch] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [sort, setSort] = useState('distance');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Pending filters (for drawer)
  const [pendingCities, setPendingCities] = useState<string[]>([]);
  const [pendingDistricts, setPendingDistricts] = useState<string[]>([]);
  const [pendingSortByDistance, setPendingSortByDistance] = useState(false);
  const [pendingUserLocation, setPendingUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const { isOpen: showFilters, onToggle: toggleFilters } = useDisclosure(false);
  const debouncedSearch = useDebounce(search, 500);
  const loadingMoreRef = useRef(false);
  const favoriteFromUrl = searchParams.get('favorite') === '1';

  const { ref, inView } = useInView({
    threshold: 0.1,
    // Load before reaching the absolute bottom to minimize visible loading.
    rootMargin: '400px 0px',
  });

  // Sync pending filters when drawer opens
  useEffect(() => {
    if (showFilters) {
      setPendingCities(cities);
      setPendingDistricts(districts);
      setPendingSortByDistance(sortByDistance);
      setPendingUserLocation(userLocation);
    }
  }, [showFilters, cities, districts, sortByDistance, userLocation]);

  useEffect(() => {
    setFavoriteOnly(favoriteFromUrl);
  }, [favoriteFromUrl]);

  const updateFavoriteFilter = (nextValue: boolean) => {
    setFavoriteOnly(nextValue);

    const params = new URLSearchParams(searchParams.toString());
    if (nextValue) {
      params.set('favorite', '1');
    } else {
      params.delete('favorite');
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  useEffect(() => {
    if (sort === 'distance' && !userLocation) {
      getUserLocation()
        .then((location) => setUserLocation(location))
        .catch(() => setSort('relevance'));
    }
  }, [sort, userLocation]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSortOpen(false);
      }
    };

    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortOpen]);

  const fetchClubs = async (pageNum: number, append = false) => {
    try {
      const isMapMode = viewMode === 'map';
      const currentPage = append && !isMapMode ? pageNum : 1;

      if (append) {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const activeSortOption =
        CLUB_SORT_OPTIONS.find((option) => option.value === sort) ??
        CLUB_SORT_OPTIONS[0];

      // Fall back to the global CitySelector city when no explicit city
      // filter is picked in the drawer.
      const effectiveCities =
        cities.length > 0 ? cities : preferredCity ? [preferredCity] : [];

      const params: Record<string, string | number | boolean | undefined> = {
        page: currentPage,
        limit: isMapMode ? CLUB_MAP_PAGE_SIZE : 12,
        search: debouncedSearch || undefined,
        city:
          effectiveCities.length === 1
            ? normalizeCityForApi(
                VIETNAM_CITIES.find((c) => c.code === effectiveCities[0])
                  ?.name ?? effectiveCities[0]
              )
            : undefined,
        district: districts.length === 1 ? districts[0] : undefined,
        sortBy: activeSortOption.sortBy,
        sortOrder: activeSortOption.sortOrder,
        favoriteOnly: favoriteOnly || undefined,
      };

      if (sortByDistance && userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        params.sortBy = 'distance';
        params.sortOrder = 'asc';
      } else if (activeSortOption.sortBy === 'distance' && userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
      } else if (activeSortOption.sortBy === 'distance') {
        params.sortBy = 'relevance';
        params.sortOrder = 'desc';
      }

      const response = await ClubsService.browseClubs(params);
      let items = response.items || [];

      // Client-side multi-city filter
      if (cities.length > 1) {
        items = items.filter((club) => {
          const venueCity = club.defaultVenue
            ? `${club.defaultVenue.name} ${club.location || ''}`.toLowerCase()
            : (club.location || '').toLowerCase();
          return cities.some((cityCode) => {
            const cityName =
              VIETNAM_CITIES.find((c) => c.code === cityCode)?.name ?? cityCode;
            return venueCity.includes(cityName.toLowerCase());
          });
        });
      }

      // Client-side multi-district filter
      if (districts.length > 1) {
        items = items.filter((club) => {
          const venueDistrict =
            (club.defaultVenue as { district?: string } | undefined)
              ?.district ?? '';
          return districts.some(
            (d) => venueDistrict.toLowerCase() === d.toLowerCase()
          );
        });
      }

      if (append && !isMapMode) {
        setClubs((prev) => {
          const existingIds = new Set(prev.map((club) => club.id));
          const newClubs = items.filter((club) => !existingIds.has(club.id));
          return [...prev, ...newClubs];
        });
        setPage(currentPage);
      } else {
        setClubs(items);
        setPage(1);
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }

      setTotalCount(response.total);
      setHasMore(!isMapMode && currentPage < (response.totalPages || 0));
    } catch (error) {
      console.error('Failed to fetch clubs:', error);
      if (!append) {
        setClubs([]);
      }
    } finally {
      if (append) {
        loadingMoreRef.current = false;
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    setPage(1);
    fetchClubs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    cities,
    districts,
    favoriteOnly,
    sortByDistance,
    sort,
    userLocation,
    preferredCity,
    viewMode,
  ]);

  // Trigger load more when the sentinel is close to the viewport.
  useEffect(() => {
    if (
      inView &&
      hasMore &&
      !isLoading &&
      !isLoadingMore &&
      !loadingMoreRef.current
    ) {
      fetchClubs(page + 1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasMore, isLoading, isLoadingMore, page]);

  // Fetch full club details and resolve schedule venues when in map mode.
  useEffect(() => {
    if (viewMode === 'map' && clubs.length > 0) {
      setFullClubs(clubs);

      const fetchFullDetails = async () => {
        setIsLoadingFullDetails(true);
        try {
          const detailsPromises = clubs.map(async (club) =>
            ClubsService.getClubDetails(club.id)
              .then((detail) => ({
                ...detail,
                defaultVenue: detail.defaultVenue || club.defaultVenue,
              }))
              .catch((error) => {
                console.error('Failed to fetch club details:', club.id, error);
                return club;
              })
          );
          const details = await Promise.all(detailsPromises);
          const venueSearchCache = new Map<string, Promise<Venue[]>>();

          const searchVenuesByName = (name: string) => {
            const key = normalizeVenueLookupText(name);
            if (!venueSearchCache.has(key)) {
              venueSearchCache.set(
                key,
                VenueService.searchVenues({
                  keyword: name,
                  limit: 10,
                  sortBy: 'relevance',
                })
                  .then((result) => result.data ?? [])
                  .catch((error) => {
                    console.error('Failed to resolve club venue:', name, error);
                    return [];
                  })
              );
            }

            return venueSearchCache.get(key)!;
          };

          const enrichedDetails = await Promise.all(
            details.map(async (club): Promise<ClubMapClub> => {
              const venuesById = new Map<string, IClubVenue>();
              const addVenue = (venue?: IClubVenue | null) => {
                if (!venue || !hasVenueCoordinates(venue)) return;
                venuesById.set(venue.id, venue);
              };

              addVenue(club.defaultVenue);

              if ('scheduleVenues' in club) {
                club.scheduleVenues?.forEach(addVenue);
              }

              const scheduleVenueNotes = Array.from(
                new Map(
                  (club.schedules || [])
                    .map((schedule) =>
                      parseVenueFromScheduleNote(schedule.notes)
                    )
                    .filter(
                      (
                        item
                      ): item is {
                        name: string;
                        address: string;
                        note: string;
                      } => Boolean(item)
                    )
                    .map((item) => [item.note, item] as const)
                ).values()
              );

              const resolvedVenues = await Promise.all(
                scheduleVenueNotes.map(async (venueNote) => {
                  const candidates = await searchVenuesByName(venueNote.name);
                  const match = findBestVenueMatch(candidates, venueNote);
                  return match && hasVenueCoordinates(match)
                    ? toClubVenue(match)
                    : null;
                })
              );

              resolvedVenues.forEach(addVenue);

              return {
                ...club,
                scheduleVenues: Array.from(venuesById.values()),
              };
            })
          );

          setFullClubs(enrichedDetails);
        } catch (error) {
          console.error('Failed to fetch full club details:', error);
        } finally {
          setIsLoadingFullDetails(false);
        }
      };
      fetchFullDetails();
    } else if (viewMode === 'map') {
      setFullClubs([]);
    }
  }, [viewMode, clubs]);

  // Near me handler
  const handleNearMe = async () => {
    if (pendingSortByDistance) {
      setPendingSortByDistance(false);
      setPendingUserLocation(null);
      return;
    }
    try {
      const location = await getUserLocation();
      setPendingUserLocation(location);
      setPendingSortByDistance(true);
    } catch (err: unknown) {
      toaster.error({
        title: 'Không thể lấy vị trí',
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const handleSubmitFilters = () => {
    setCities(pendingCities);
    setDistricts(pendingDistricts);
    setSortByDistance(pendingSortByDistance);
    setUserLocation(
      pendingSortByDistance ? (pendingUserLocation ?? null) : null
    );
    toggleFilters();
  };

  const handleResetFilters = () => {
    setPendingCities([]);
    setPendingDistricts([]);
    setPendingSortByDistance(false);
    setPendingUserLocation(null);
    setCities([]);
    setDistricts([]);
    setSortByDistance(false);
    updateFavoriteFilter(false);
    setUserLocation(null);
    toggleFilters();
  };

  const removeCity = (cityCode: string) => {
    const next = cities.filter((c) => c !== cityCode);
    setCities(next);
    if (next.length === 0) setDistricts([]);
  };

  const removeDistrict = (districtName: string) => {
    setDistricts((prev) => prev.filter((d) => d !== districtName));
  };

  const handleSortChange = async (value: string) => {
    if (value === 'distance') {
      if (!userLocation) {
        try {
          const location = await getUserLocation();
          setUserLocation(location);
          setSort('distance');
          setSortByDistance(false);
        } catch {
          toaster.error({
            title: 'Không thể lấy vị trí',
            description:
              'Vui lòng cho phép truy cập vị trí để sắp xếp theo khoảng cách.',
          });
          setSort('relevance');
          setSortByDistance(false);
        }
      } else {
        setSort('distance');
        setSortByDistance(false);
      }
      return;
    }

    setSort(value);
    if (sortByDistance) {
      setSortByDistance(false);
      setUserLocation(null);
    }
  };

  const activeFilterCount =
    cities.length + districts.length + (sortByDistance ? 1 : 0);
  // favoriteOnly is excluded from filter count as it's now in the tab nav
  const activeSortOption =
    CLUB_SORT_OPTIONS.find((option) => option.value === sort) ??
    CLUB_SORT_OPTIONS[0];
  const sortButtonLabel = sortByDistance ? 'Gần tôi' : activeSortOption.label;
  const SortButtonIcon = sortByDistance ? MapPin : activeSortOption.icon;
  const skeletonVariant = viewMode === 'list' ? 'list' : 'grid';
  const loadMoreSkeletonDisplay = getFullRowSkeletonDisplay(
    clubs.length,
    CLUB_RESULT_COLUMN_COUNTS
  );

  // Register desktop search bar in the top bar
  useRegisterTopBarSearch({
    value: search,
    onChange: setSearch,
    placeholder: t('clubs.searchPlaceholder'),
    onFilterClick: toggleFilters,
    activeFilterCount: activeFilterCount,
    showFilter: true,
  });

  return (
    <Box>
      {/* Search Bar - Fixed on mobile, sticky on desktop */}
      <Box
        position={{ base: 'fixed', md: 'sticky' }}
        top={{
          base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
          md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
        }}
        left={0}
        right={0}
        width="100vw"
        marginLeft={{ base: 0, md: 'calc(50% - 50vw)' }}
        zIndex={1100}
        bg={{ base: 'bg', md: 'transparent' }}
        pt={2}
        pb={{ base: 0, md: 2 }}
        display={{ base: 'block', md: 'none' }}
      >
        <Box w="100%" maxW="650px" mx="auto">
          <AppSearchBar
            value={search}
            onChange={setSearch}
            placeholder={t('clubs.searchPlaceholder')}
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
          onClick={() => {
            if (user) {
              router.push(ROUTES.HOST.CLUBS.CREATE);
            } else {
              setIsLoginModalOpen(true);
            }
          }}
        >
          <Plus size={16} />
          {t('navigation.createClub')}
        </Button>
      </Flex>

      {/* Results info + view mode */}
      {!isLoading && (
        <VStack align="stretch" gap={2} mb={4}>
          <Flex align="center" gap={2} minH="28px">
            {totalCount !== null && (
              <Text
                fontSize="sm"
                color="fg.muted"
                display={{ base: 'none', md: 'block' }}
              >
                {t('common.resultsCount', { count: totalCount })}
              </Text>
            )}

            <Flex align="center" gap={2} ml="auto">
              <Box position="relative" ref={sortDropdownRef}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsSortOpen((value) => !value)}
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  h="32px"
                  px={{ base: 2, md: 3 }}
                  borderRadius="full"
                  borderColor="gray.200"
                  bg={{ base: 'white', _dark: 'gray.800' }}
                  color={{ base: 'gray.700', _dark: 'gray.200' }}
                  fontWeight="normal"
                  fontSize="sm"
                  _hover={{ bg: { base: 'gray.50', _dark: 'gray.700' } }}
                  _active={{ bg: { base: 'gray.100', _dark: 'gray.600' } }}
                >
                  <SortButtonIcon size={14} />
                  <Text
                    as="span"
                    maxW="110px"
                    truncate
                    display={{ base: 'none', md: 'inline' }}
                  >
                    {sortButtonLabel}
                  </Text>
                  <ChevronDown
                    size={13}
                    style={{
                      transition: 'transform 0.2s',
                      transform: isSortOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </Button>

                {isSortOpen && (
                  <Box
                    position="absolute"
                    top="calc(100% + 6px)"
                    right={0}
                    zIndex={200}
                    bg={{ base: 'white', _dark: 'gray.800' }}
                    border="1px solid"
                    borderColor={{ base: 'gray.200', _dark: 'gray.600' }}
                    borderRadius="xl"
                    boxShadow="lg"
                    minW="180px"
                    overflow="hidden"
                    py={1}
                  >
                    {CLUB_SORT_OPTIONS.map((option) => {
                      const OptionIcon = option.icon;
                      const isActive = !sortByDistance && option.value === sort;
                      return (
                        <Flex
                          key={option.value}
                          align="center"
                          gap={2.5}
                          px={3}
                          py={2}
                          cursor="pointer"
                          bg={
                            isActive
                              ? { base: 'green.50', _dark: 'green.900' }
                              : 'transparent'
                          }
                          color={
                            isActive
                              ? 'green.600'
                              : { base: 'gray.700', _dark: 'gray.200' }
                          }
                          fontWeight={isActive ? 'semibold' : 'normal'}
                          fontSize="sm"
                          _hover={{
                            bg: isActive
                              ? { base: 'green.100', _dark: 'green.800' }
                              : { base: 'gray.50', _dark: 'gray.700' },
                          }}
                          onClick={() => {
                            handleSortChange(option.value);
                            setIsSortOpen(false);
                          }}
                        >
                          <OptionIcon size={14} />
                          <Text flex={1}>{option.label}</Text>
                          {isActive && <Check size={13} />}
                        </Flex>
                      );
                    })}
                  </Box>
                )}
              </Box>

              <AppViewModeToggle
                scope="clubs"
                defaultMode="list"
                listFirst={true}
              />
            </Flex>
          </Flex>

          {activeFilterCount > 0 && (
            <Flex align="center" flexWrap="wrap" gap={2}>
              {sortByDistance && (
                <Badge
                  colorPalette="blue"
                  variant="subtle"
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontSize="xs"
                  fontWeight="semibold"
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                >
                  <MapPin size={11} />
                  Gần tôi
                  <Box
                    as="span"
                    cursor="pointer"
                    display="inline-flex"
                    alignItems="center"
                    onClick={() => {
                      setSortByDistance(false);
                      setUserLocation(null);
                    }}
                    _hover={{ color: 'blue.700' }}
                  >
                    <X size={12} />
                  </Box>
                </Badge>
              )}

              {cities.map((cityCode) => {
                const cityName =
                  VIETNAM_CITIES.find((c) => c.code === cityCode)?.name ??
                  cityCode;
                return (
                  <Badge
                    key={cityCode}
                    colorPalette="green"
                    variant="subtle"
                    borderRadius="full"
                    px={3}
                    py={1}
                    fontSize="xs"
                    fontWeight="semibold"
                    display="flex"
                    alignItems="center"
                    gap={1.5}
                  >
                    {cityName}
                    <Box
                      as="span"
                      cursor="pointer"
                      display="inline-flex"
                      alignItems="center"
                      onClick={() => removeCity(cityCode)}
                      _hover={{ color: 'green.700' }}
                    >
                      <X size={12} />
                    </Box>
                  </Badge>
                );
              })}

              {districts.map((districtName) => (
                <Badge
                  key={districtName}
                  colorPalette="purple"
                  variant="subtle"
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontSize="xs"
                  fontWeight="semibold"
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                >
                  {districtName}
                  <Box
                    as="span"
                    cursor="pointer"
                    display="inline-flex"
                    alignItems="center"
                    onClick={() => removeDistrict(districtName)}
                    _hover={{ color: 'purple.700' }}
                  >
                    <X size={12} />
                  </Box>
                </Badge>
              ))}
            </Flex>
          )}
        </VStack>
      )}

      {/* Filter Drawer Overlay */}
      {showFilters && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          zIndex={2000}
          onClick={toggleFilters}
        />
      )}

      {/* Filter Drawer */}
      <Box
        position="fixed"
        top={0}
        right={0}
        bottom={0}
        width={{ base: '90%', md: '480px', lg: '520px' }}
        bg="bg"
        _dark={{ bg: 'gray.800' }}
        shadow="2xl"
        zIndex={2100}
        transform={showFilters ? 'translateX(0)' : 'translateX(100%)'}
        transition="transform 0.3s ease-in-out"
        display="flex"
        flexDirection="column"
      >
        {/* Drawer Header */}
        <Box
          px={4}
          height={{
            base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
            md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
          }}
          pt="env(safe-area-inset-top)"
          display="flex"
          alignItems="center"
          borderBottomWidth="1px"
          borderColor="border"
          _dark={{ borderColor: 'gray.700' }}
        >
          <Flex justify="space-between" align="center" width="full">
            <HStack gap={2}>
              <Filter size={20} />
              <Heading size="md">Bộ lọc</Heading>
            </HStack>
            <IconButton
              variant="ghost"
              onClick={toggleFilters}
              aria-label="Đóng"
              icon={<X size={20} />}
            />
          </Flex>
        </Box>

        {/* Drawer Body */}
        <Box flex="1" overflowY="auto" p={5}>
          <VStack align="stretch" gap={5}>
            {/* Near Me */}
            <Box>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="fg.muted"
                mb={2}
                textTransform="uppercase"
              >
                Lọc nhanh
              </Text>
              <Badge
                px={5}
                py={2}
                borderRadius="full"
                cursor="pointer"
                variant={pendingSortByDistance ? 'solid' : 'outline'}
                colorPalette={pendingSortByDistance ? 'green' : 'gray'}
                onClick={handleNearMe}
                fontSize="sm"
                fontWeight="semibold"
                display="flex"
                alignItems="center"
                gap={2}
                width="fit-content"
                transition="all 0.2s"
                _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                borderWidth={pendingSortByDistance ? '0' : '2px'}
              >
                <MapPin size={16} />
                Gần tôi
              </Badge>
            </Box>

            <Box h="1px" bg="gray.200" _dark={{ bg: 'gray.700' }} />

            {/* City + District / Ward Selection */}
            <LocationFilterFields
              selectedCities={pendingCities}
              selectedDistricts={pendingDistricts}
              onCitiesChange={setPendingCities}
              onDistrictsChange={setPendingDistricts}
            />
          </VStack>
        </Box>

        {/* Drawer Footer */}
        <Box
          p={4}
          pb={{ base: 'calc(16px + env(safe-area-inset-bottom))', md: 4 }}
          borderTopWidth="1px"
          borderColor="border"
          bg="bg.muted"
          _dark={{ borderColor: 'gray.700', bg: 'gray.900' }}
        >
          <Flex gap={3}>
            <Button
              flex="1"
              variant="solid"
              colorPalette="green"
              onClick={handleSubmitFilters}
              leftIcon={<Check size={18} />}
            >
              Tìm kiếm
            </Button>
            <Button
              flex="1"
              variant="outline"
              colorPalette="gray"
              onClick={handleResetFilters}
              leftIcon={<X size={18} />}
            >
              Đặt lại
            </Button>
          </Flex>
        </Box>
      </Box>

      {/* Content */}
      {isLoading && clubs.length === 0 ? (
        viewMode === 'map' ? (
          <Box paddingBottom={`${BOTTOM_TAB_HEIGHT}px`}>
            <Skeleton
              height={{ base: '360px', md: '520px' }}
              borderRadius="2xl"
            />
          </Box>
        ) : (
          <SimpleGrid columns={CLUB_RESULT_GRID_COLUMNS} gap={4}>
            {Array.from({ length: CLUB_SKELETON_COUNT }).map((_, index) => (
              <ClubCardSkeleton
                key={`club-skeleton-${index}`}
                variant={skeletonVariant}
              />
            ))}
          </SimpleGrid>
        )
      ) : clubs.length === 0 && viewMode !== 'map' ? (
        <AppEmptyState
          minH={{ base: '300px', md: '340px' }}
          icon={<Users size={40} color="var(--chakra-colors-gray-400)" />}
          title={t('clubs.noClubsFound')}
          actions={
            activeFilterCount > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setCities([]);
                  setDistricts([]);
                  setSortByDistance(false);
                  updateFavoriteFilter(false);
                  setUserLocation(null);
                }}
              >
                Xóa bộ lọc
              </Button>
            ) : undefined
          }
        />
      ) : viewMode === 'map' ? (
        isLoadingFullDetails && fullClubs.length === 0 ? (
          <Box paddingBottom={`${BOTTOM_TAB_HEIGHT}px`}>
            <Skeleton
              height={{ base: '360px', md: '520px' }}
              borderRadius="2xl"
            />
          </Box>
        ) : (
          <Box paddingBottom={`${BOTTOM_TAB_HEIGHT}px`}>
            <ClubMap clubs={fullClubs} userLocation={userLocation} />
          </Box>
        )
      ) : (
        <>
          <SimpleGrid columns={CLUB_RESULT_GRID_COLUMNS} gap={4}>
            {clubs.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                variant={viewMode === 'list' ? 'list' : 'grid'}
                onFavoriteChange={(clubId, isFavorite) => {
                  setClubs((prev) =>
                    prev
                      .map((item) =>
                        item.id === clubId ? { ...item, isFavorite } : item
                      )
                      .filter((item) => !favoriteOnly || item.isFavorite)
                  );
                }}
              />
            ))}
          </SimpleGrid>

          {isLoadingMore && (
            <SimpleGrid
              mt={8}
              display={loadMoreSkeletonDisplay}
              columns={CLUB_RESULT_GRID_COLUMNS}
              gap={4}
              aria-busy="true"
              overflowAnchor="none"
            >
              {CLUB_LOAD_MORE_SKELETON_DISPLAYS.map((display, index) => (
                <Box
                  key={`club-load-more-skeleton-${index}`}
                  display={display}
                  width="100%"
                >
                  <ClubCardSkeleton variant={skeletonVariant} />
                </Box>
              ))}
            </SimpleGrid>
          )}

          {hasMore && (
            <Box
              ref={ref}
              mt={isLoadingMore ? 4 : 8}
              mb={10}
              width="full"
              overflowAnchor="none"
            >
              {isLoadingMore && (
                <Flex justify="center" role="status" aria-live="polite">
                  <Text color="gray.500" fontSize="sm">
                    {t('session.loadingMore')}
                  </Text>
                </Flex>
              )}
            </Box>
          )}
          {!hasMore && !isLoading && !isLoadingMore && clubs.length > 0 && (
            <Flex
              justify="center"
              mt={6}
              mb={10}
              overflowAnchor="none"
              role="status"
            >
              <Text color="gray.500" fontSize="sm">
                {t('session.endOfResults')}
              </Text>
            </Flex>
          )}
        </>
      )}
      {isLoginModalOpen && (
        <LoginPromptModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          featureName={t('navigation.createClub')}
          returnUrl={ROUTES.HOST.CLUBS.CREATE}
        />
      )}
    </Box>
  );
}

export default function BrowseClubsPage() {
  const t = useTranslations();
  return (
    <PageLayout title={t('clubs.browseClubs')}>
      <Suspense
        fallback={
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
            {Array.from({ length: CLUB_SKELETON_COUNT }).map((_, index) => (
              <ClubCardSkeleton key={`club-suspense-${index}`} variant="list" />
            ))}
          </SimpleGrid>
        }
      >
        <BrowseClubsContent />
      </Suspense>
    </PageLayout>
  );
}
