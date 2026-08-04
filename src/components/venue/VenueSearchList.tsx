'use client';

import { LocationFilterFields } from '@/components/common/LocationFilterFields';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { useDisclosure } from '@/components/ui/ChakraHooks';
import AppEmptyState from '@/components/ui/AppEmptyState';
import { toaster } from '@/components/ui/toaster';
import { VIETNAM_CITIES } from '@/constants/vietnam-locations';
import { cityCodeToApiName } from '@/lib/preferred-city';
import { buildBrowseSeedKey } from '@/lib/browse-seed-key';
import {
  clearUserLocationCookie,
  locationKey,
  normalizeUserLocation,
  readUserLocationCookie,
  writeUserLocationCookie,
} from '@/lib/user-location';
import {
  TOP_BAR_HEIGHT_MOBILE,
  TOP_BAR_HEIGHT_DESKTOP,
  BOTTOM_TAB_HEIGHT,
} from '@/constants';
import { VenueService } from '@/lib/api/venue.service';
import { Venue, VenueRequestType } from '@/lib/api/types';
import { getUserLocation } from '@/lib/utils/geolocation.utils';
import {
  Badge,
  Box,
  Flex,
  Grid,
  Heading,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  ArrowDownAZ,
  CalendarArrowDown,
  Check,
  ChevronDown,
  Filter,
  Grid2X2,
  MapPin,
  Plus,
  TrendingUp,
  X,
  Star,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import VenueCard from './VenueCard';
import VenueCardSkeleton from './VenueCardSkeleton';
import VenueMap from './VenueMap';
import AppViewModeToggle from '@/components/common/AppViewModeToggle';
import { useViewMode, type ViewMode } from '@/hooks/useViewMode';
import {
  useUrlFilters,
  stringField,
  stringArrayField,
  booleanField,
} from '@/hooks/useUrlFilters';
import { AppSearchBar } from '@/components/common/AppSearchBar';
import VenueRequestModal from './VenueRequestModal';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { usePathname, useRouter } from '@/i18n/config';
import { useRegisterTopBarSearch } from '@/contexts/TopBarSearchContext';
import { getFullRowSkeletonDisplay } from '@/components/common/infinite-loading-layout';
import MapLoadingSkeleton from '@/components/common/MapLoadingSkeleton';

const LoginPromptModal = dynamic(
  () => import('@/components/auth/LoginPromptModal'),
  { ssr: false }
);

const OPEN_VENUE_CREATE_REQUEST_ACTION = 'openVenueCreateRequest';

const PAGE_SIZE = 12;
const MAP_PAGE_SIZE = 500; // fetch all for map view
const VENUE_RESULT_GRID_COLUMNS = {
  base: '1fr',
  md: 'repeat(2, 1fr)',
  lg: 'repeat(3, 1fr)',
};
const VENUE_RESULT_COLUMN_COUNTS = { base: 1, md: 2, lg: 3 };
const VENUE_LOAD_MORE_SKELETON_DISPLAYS = [
  { base: 'flex', md: 'flex', lg: 'flex' },
  { base: 'none', md: 'flex', lg: 'flex' },
  { base: 'none', md: 'none', lg: 'flex' },
];

// Sort option definition
interface ISortOption {
  value: string;
  label: string;
  sortBy:
    | 'name'
    | 'createdAt'
    | 'numberOfCourts'
    | 'hourlyRateFixed'
    | 'relevance'
    | 'distance';
  sortOrder: 'asc' | 'desc';
  icon: React.ComponentType<{ size?: number }>;
}

const SORT_OPTIONS: ISortOption[] = [
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
  {
    value: 'price_asc',
    label: 'Giá thấp nhất',
    sortBy: 'hourlyRateFixed',
    sortOrder: 'asc',
    icon: TrendingUp,
  },
  {
    value: 'courts_desc',
    label: 'Nhiều sân nhất',
    sortBy: 'numberOfCourts',
    sortOrder: 'desc',
    icon: Grid2X2,
  },
];

// URL filter schema for the venue search page.
// q        → keyword (string)
// city     → comma-separated city codes  (e.g. "HCM,HN")
// district → comma-separated district names (e.g. "Bình Thạnh,Quận 1")
// near     → sort by distance flag       ("1" = true)
// sort     → active sort option value    (e.g. "distance", "newest", "name_asc")
const VENUE_FILTERS_SCHEMA = {
  q: stringField(''),
  city: stringArrayField(),
  district: stringArrayField(),
  near: booleanField(false),
  sort: stringField('distance'),
  favorite: booleanField(false),
};

interface VenueSearchListProps {
  initialVenues?: Venue[];
  initialSeedKey?: string | null;
  serverViewMode?: ViewMode;
}

export default function VenueSearchList({
  initialVenues = [],
  initialSeedKey = null,
  serverViewMode,
}: VenueSearchListProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const { preferredCity, _hasHydrated: preferencesHydrated } =
    usePreferenceStore();
  const [venues, setVenues] = useState<Venue[]>(initialVenues);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(initialVenues.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URL-synced applied filters
  const [filters, setFilters, resetFilters] =
    useUrlFilters(VENUE_FILTERS_SCHEMA);

  // Use URL-synced view mode
  const [viewMode, _setViewMode] = useViewMode(
    'venues',
    'list',
    serverViewMode
  );
  const venueCardVariant = viewMode === 'list' ? 'list' : 'grid';
  const loadMoreSkeletonDisplay = getFullRowSkeletonDisplay(
    venues.length,
    VENUE_RESULT_COLUMN_COUNTS
  );

  // Local keyword state drives the search input; synced to URL with debounce.
  const [keyword, setKeyword] = useState(filters.q);

  // User location is never stored in URL (privacy).
  const [userLocation, setUserLocation] = useState(readUserLocationCookie);
  const userLocationKey = locationKey(userLocation);
  const silentRevalidateRef = useRef(initialVenues.length > 0);
  const isFirstFetchRef = useRef(true);
  const refreshedLocationModeRef = useRef<string | null>(null);

  const requiresUserLocation = filters.sort === 'distance' || filters.near;

  // Use the previous rounded location immediately, then refresh it once in
  // the background. A changed rounded value triggers the one necessary refetch.
  useEffect(() => {
    const locationMode = `${filters.sort}:${filters.near}`;
    if (
      !requiresUserLocation ||
      refreshedLocationModeRef.current === locationMode
    ) {
      return;
    }

    refreshedLocationModeRef.current = locationMode;

    let cancelled = false;
    getUserLocation()
      .then((location) => {
        const normalizedLocation = normalizeUserLocation(location);
        if (!cancelled && locationKey(normalizedLocation) !== userLocationKey) {
          writeUserLocationCookie(normalizedLocation);
          setUserLocation(normalizedLocation);
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearUserLocationCookie();
          setUserLocation(null);
          setFilters({ sort: 'relevance', near: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    filters.near,
    filters.sort,
    requiresUserLocation,
    setFilters,
    userLocationKey,
  ]);

  const latestVenueRequestRef = useRef(0);

  // Pending filters (for drawer)
  const [pendingCities, setPendingCities] = useState<string[]>([]);
  const [pendingDistricts, setPendingDistricts] = useState<string[]>([]);
  const [pendingSortByDistance, setPendingSortByDistance] = useState(false);
  const [pendingUserLocation, setPendingUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const { isOpen: showFilters, onToggle: toggleFilters } = useDisclosure(false);
  const {
    isOpen: isCreateRequestOpen,
    onOpen: openCreateRequest,
    onClose: closeCreateRequest,
  } = useDisclosure(false);
  const {
    isOpen: isLoginModalOpen,
    onOpen: openLoginModal,
    onClose: closeLoginModal,
  } = useDisclosure(false);

  const loadingMoreRef = useRef(false);

  const { ref, inView } = useInView({
    threshold: 0.1,
    // Load before reaching the absolute bottom to minimize visible loading.
    rootMargin: '400px 0px',
  });

  // Stable string keys for array filters — used in useEffect dependency arrays.
  const citiesKey = filters.city.join(',');
  const districtsKey = filters.district.join(',');
  const effectiveCity = useMemo(() => {
    if (filters.city.length > 0) {
      return filters.city.map(cityCodeToApiName).filter(Boolean).join(',');
    }
    return cityCodeToApiName(preferredCity) ?? '';
  }, [filters.city, preferredCity]);
  const activeSortOption =
    SORT_OPTIONS.find((option) => option.value === filters.sort) ??
    SORT_OPTIONS[0];
  const activeSeedKey = buildBrowseSeedKey({
    city: effectiveCity,
    sortBy: requiresUserLocation ? 'distance' : activeSortOption.sortBy,
    sortOrder: requiresUserLocation ? 'asc' : activeSortOption.sortOrder,
    location: requiresUserLocation ? userLocation : null,
  });

  // Sync pending filters when drawer opens.
  useEffect(() => {
    if (showFilters) {
      setPendingCities(filters.city);
      setPendingDistricts(filters.district);
      setPendingSortByDistance(filters.near);
      setPendingUserLocation(userLocation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFilters]);

  // Plain function (not useCallback) to always read the latest `page` state
  const fetchVenues = async (isLoadMore = false) => {
    if (isLoadMore && loadingMoreRef.current) return;

    const requestId = ++latestVenueRequestRef.current;
    try {
      if (isLoadMore) {
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        loadingMoreRef.current = false;
        setLoadingMore(false);
        if (
          isFirstFetchRef.current &&
          activeSeedKey !== (initialSeedKey ?? '')
        ) {
          silentRevalidateRef.current = false;
          setVenues([]);
        }
        isFirstFetchRef.current = false;
        if (!silentRevalidateRef.current) {
          setLoading(true);
        }
        setPage(1);
        if (!silentRevalidateRef.current && typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
      setError(null);

      const isMapMode = viewMode === 'map';
      const effectiveLimit = isMapMode ? MAP_PAGE_SIZE : PAGE_SIZE;
      const currentPage = isLoadMore && !isMapMode ? page + 1 : 1;

      // Resolve the active sort option
      const apiFilters: Record<string, string | number | boolean | undefined> =
        {
          keyword: filters.q || undefined,
          city: effectiveCity || undefined,
          district:
            filters.district.length > 0
              ? filters.district.join(',')
              : undefined,
          closureStatus: 'OPERATING',
          favoriteOnly: filters.favorite ? true : undefined,
          page: currentPage,
          limit: effectiveLimit,
        };

      if (filters.near && userLocation) {
        // Distance sort overrides the sort bar when "Near me" is active
        apiFilters.lat = userLocation.lat;
        apiFilters.lng = userLocation.lng;
        apiFilters.sortBy = 'distance';
        apiFilters.sortOrder = 'asc';
      } else if (filters.sort === 'distance' && userLocation) {
        // Default distance sort (without the "near me" filter badge)
        apiFilters.lat = userLocation.lat;
        apiFilters.lng = userLocation.lng;
        apiFilters.sortBy = 'distance';
        apiFilters.sortOrder = 'asc';
      } else {
        apiFilters.sortBy = activeSortOption.sortBy;
        apiFilters.sortOrder = activeSortOption.sortOrder;
      }

      const result = await VenueService.searchVenues(apiFilters);
      if (requestId !== latestVenueRequestRef.current) return;

      setTotalCount(result.pagination.total);
      const venueData = result.data;

      if (isLoadMore && !isMapMode) {
        setVenues((prev) => {
          const existingIds = new Set(prev.map((v) => v.id));
          const newVenues = venueData.filter((v) => !existingIds.has(v.id));
          return [...prev, ...newVenues];
        });
        setPage(currentPage);
      } else {
        setVenues(venueData);
      }

      // In map mode: no infinite scroll — all data already fetched
      setHasMore(!isMapMode && currentPage < result.pagination.totalPages);
    } catch (err) {
      if (requestId !== latestVenueRequestRef.current) return;
      setError('Không thể tải danh sách sân. Vui lòng thử lại.');
      console.error(err);
    } finally {
      if (requestId !== latestVenueRequestRef.current) return;
      if (isLoadMore) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      } else {
        setLoading(false);
        silentRevalidateRef.current = false;
      }
    }
  };

  // Sync keyword input → URL with 500 ms debounce (avoids polluting history on every keystroke).
  // When user starts searching, auto-switch from 'distance' to 'relevance'.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword && filters.sort === 'distance') {
        setFilters({ q: keyword, sort: 'relevance' });
      } else if (!keyword && filters.sort === 'relevance' && !filters.q) {
        // If user clears the search and was on relevance (having come from distance), stay on relevance
        setFilters({ q: keyword });
      } else {
        setFilters({ q: keyword });
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  // Keep the input display in sync when the URL changes externally (browser back/forward).
  useEffect(() => {
    setKeyword(filters.q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q]);

  // Fetch whenever URL-applied filters, sort, or user location change.
  useEffect(() => {
    if (!preferencesHydrated) return;
    if (requiresUserLocation && !userLocation) {
      // Invalidate an earlier request so its response cannot replace the
      // distance-sorted list while browser geolocation is still resolving.
      latestVenueRequestRef.current += 1;
      loadingMoreRef.current = false;
      setLoadingMore(false);
      setLoading(true);
      return;
    }

    fetchVenues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.q,
    citiesKey,
    districtsKey,
    filters.near,
    filters.sort,
    userLocationKey,
    viewMode, // re-fetch with larger limit when switching to/from map mode
    preferredCity,
    filters.favorite,
    requiresUserLocation,
    preferencesHydrated,
    activeSeedKey,
  ]);

  // Trigger load more when in view
  useEffect(() => {
    if (
      inView &&
      hasMore &&
      !loading &&
      !loadingMore &&
      !loadingMoreRef.current
    ) {
      fetchVenues(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasMore, loading, loadingMore]);

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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toaster.error({
        title: 'Không thể lấy vị trí',
        description: message,
      });
    }
  };

  const handleSubmitFilters = () => {
    setFilters({
      city: pendingCities,
      district: pendingDistricts,
      near: pendingSortByDistance,
    });
    setUserLocation(pendingUserLocation ?? null);
    toggleFilters();
  };

  const handleResetFilters = () => {
    setPendingCities([]);
    setPendingDistricts([]);
    setPendingSortByDistance(false);
    setPendingUserLocation(null);
    setFilters({
      city: [],
      district: [],
      near: false,
    });
    setUserLocation(null);
    toggleFilters();
  };

  const clearAllFilters = () => {
    setKeyword('');
    resetFilters();
    setUserLocation(null);
  };

  // Handle sort chip click — clear "near" if it was active
  const handleSortChange = async (value: string) => {
    if (value === 'distance') {
      // Auto-fetch location when user picks "Gần nhất"
      if (!userLocation) {
        try {
          const loc = await getUserLocation();
          setUserLocation(loc);
          setFilters({ sort: 'distance', near: false });
        } catch {
          toaster.error({
            title: 'Không thể lấy vị trí',
            description:
              'Vui lòng cho phép truy cập vị trí để sắp xếp theo khoảng cách.',
          });
          setFilters({ sort: 'relevance', near: false });
        }
      } else {
        setFilters({ sort: 'distance', near: false });
      }
    } else if (filters.near) {
      setFilters({ sort: value, near: false });
      setUserLocation(null);
    } else {
      setFilters({ sort: value });
    }
  };

  const removeCity = (cityCode: string) => {
    const nextCities = filters.city.filter((c) => c !== cityCode);
    setFilters({
      city: nextCities,
      ...(nextCities.length === 0 ? { district: [] } : {}),
    });
  };

  const removeDistrict = (districtName: string) => {
    setFilters({
      district: filters.district.filter((d) => d !== districtName),
    });
  };

  const activeFilterCount =
    filters.city.length + filters.district.length + (filters.near ? 1 : 0);
  // favoriteOnly is excluded from filter count as it's now in the tab nav
  const hasVenueSearch = filters.q.trim().length > 0;

  // Register desktop search bar in the top bar
  useRegisterTopBarSearch({
    value: keyword,
    onChange: setKeyword,
    placeholder: t('venue.searchPlaceholder'),
    onFilterClick: toggleFilters,
    activeFilterCount: activeFilterCount,
    showFilter: true,
  });

  // Sort dropdown state
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const selectedSortOption =
    SORT_OPTIONS.find((opt) => opt.value === filters.sort) ?? SORT_OPTIONS[0];

  // When "near me" is active, distance sort overrides; show MapPin label
  const sortButtonLabel = filters.near ? 'Gần tôi' : selectedSortOption.label;
  const SortButtonIcon = filters.near ? MapPin : selectedSortOption.icon;

  useEffect(() => {
    if (
      !isAuthenticated ||
      searchParams.get('action') !== OPEN_VENUE_CREATE_REQUEST_ACTION
    ) {
      return;
    }

    openCreateRequest();
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('action');
    const nextUrl = nextParams.toString()
      ? `${pathname}?${nextParams.toString()}`
      : pathname;
    router.replace(nextUrl);
  }, [isAuthenticated, openCreateRequest, pathname, router, searchParams]);

  const getCreateRequestReturnUrl = () => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('action', OPEN_VENUE_CREATE_REQUEST_ACTION);
    return nextParams.toString()
      ? `${pathname}?${nextParams.toString()}`
      : pathname;
  };

  const handleOpenCreateRequest = () => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    openCreateRequest();
  };

  // On mobile, always show icon-only in the sort button (no label text)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(e.target as Node)
      ) {
        setIsSortOpen(false);
      }
    };
    if (isSortOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortOpen]);

  return (
    <Box>
      {/* Search Bar - Sticky */}
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
        <Flex align="center" gap={2} w="100%" maxW="650px" mx="auto">
          <Box flex={1} w="100%">
            <AppSearchBar
              value={keyword}
              onChange={setKeyword}
              placeholder={t('venue.searchPlaceholder')}
              onFilterClick={toggleFilters}
              activeFilterCount={activeFilterCount}
              showFilter={true}
              showCitySelector={true}
            />
          </Box>
        </Flex>
      </Box>

      {/* Results bar: count + sort dropdown */}
      {!loading && (
        <Flex
          justify="flex-end"
          align="center"
          mb={
            filters.city.length > 0 ||
            filters.district.length > 0 ||
            filters.near
              ? 2
              : 4
          }
          minH="28px"
        >
          {/* Count */}
          {totalCount !== null && (
            <Text
              fontSize="sm"
              color="fg.muted"
              flex={1}
              display={{ base: 'none', md: 'block' }}
            >
              {t('common.resultsCount', { count: totalCount })}
            </Text>
          )}

          <Flex align="center" gap={2}>
            {/* Sort dropdown */}
            <Box position="relative" ref={sortDropdownRef}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsSortOpen((v) => !v)}
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
                  {SORT_OPTIONS.map((opt) => {
                    const OptionIcon = opt.icon;
                    const isActive =
                      !filters.near && opt.value === filters.sort;
                    return (
                      <Flex
                        key={opt.value}
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
                          handleSortChange(opt.value);
                          setIsSortOpen(false);
                        }}
                      >
                        <OptionIcon size={14} />
                        <Text flex={1}>{opt.label}</Text>
                        {isActive && <Check size={13} />}
                      </Flex>
                    );
                  })}
                </Box>
              )}
            </Box>

            {/* View Mode Toggle */}
            <AppViewModeToggle
              scope="venues"
              defaultMode="list"
              serverViewMode={serverViewMode}
              listFirst
            />
          </Flex>
        </Flex>
      )}

      {/* Active filter chips */}
      {!loading &&
        (filters.city.length > 0 ||
          filters.district.length > 0 ||
          filters.near) && (
          <Flex align="center" flexWrap="wrap" gap={2} mb={4} minH="28px">
            {filters.near && (
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
                    setFilters({ near: false });
                    setUserLocation(null);
                  }}
                  _hover={{ color: 'blue.700' }}
                >
                  <X size={12} />
                </Box>
              </Badge>
            )}

            {filters.city.map((cityCode) => {
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

            {filters.district.map((districtName) => (
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
        bg="white"
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
          borderColor="gray.200"
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
                color="gray.500"
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
          borderColor="gray.200"
          bg="gray.50"
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

      {/* Results */}
      {loading ? (
        viewMode === 'map' ? (
          <Box paddingBottom={`${BOTTOM_TAB_HEIGHT}px`}>
            <MapLoadingSkeleton />
          </Box>
        ) : (
          <Grid templateColumns={VENUE_RESULT_GRID_COLUMNS} gap={4}>
            {Array.from({ length: 6 }).map((_, i) => (
              <VenueCardSkeleton key={i} variant={venueCardVariant} />
            ))}
          </Grid>
        )
      ) : error ? (
        <Box
          p={4}
          bg="red.50"
          color="red.600"
          borderRadius="md"
          borderWidth="1px"
          borderColor="red.200"
        >
          <Text fontWeight="medium">{error}</Text>
        </Box>
      ) : venues.length === 0 && viewMode !== 'map' ? (
        <AppEmptyState
          minH={{ base: '300px', md: '340px' }}
          icon={<MapPin size={40} color="var(--chakra-colors-gray-400)" />}
          title="Không tìm thấy sân nào"
          actions={
            <VStack gap={3} width="100%" align="center">
              {hasVenueSearch && (
                <Button
                  colorPalette="green"
                  onClick={handleOpenCreateRequest}
                  leftIcon={<Plus size={16} />}
                >
                  {t('venueRequests.suggestNewVenue')}
                </Button>
              )}
              {activeFilterCount > 0 && (
                <Button onClick={clearAllFilters} variant="outline" size="sm">
                  Xóa bộ lọc
                </Button>
              )}
            </VStack>
          }
        />
      ) : viewMode === 'map' ? (
        <Box paddingBottom={`${BOTTOM_TAB_HEIGHT}px`}>
          <VenueMap venues={venues} userLocation={userLocation} />
        </Box>
      ) : (
        <>
          <Grid templateColumns={VENUE_RESULT_GRID_COLUMNS} gap={4}>
            {venues.map((venue, index) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                variant={venueCardVariant}
                showVerifiedBadge={false}
                imagePriority={index === 0}
                onFavoriteChange={(venueId, isFavorite) => {
                  setVenues((prev) =>
                    prev
                      .map((item) =>
                        item.id === venueId ? { ...item, isFavorite } : item
                      )
                      .filter((item) => !filters.favorite || item.isFavorite)
                  );
                }}
              />
            ))}
          </Grid>

          {/* Load-more skeletons always begin in their own complete row. */}
          {loadingMore && (
            <Grid
              mt={8}
              display={loadMoreSkeletonDisplay}
              templateColumns={VENUE_RESULT_GRID_COLUMNS}
              gap={4}
              aria-busy="true"
              overflowAnchor="none"
            >
              {VENUE_LOAD_MORE_SKELETON_DISPLAYS.map((display, index) => (
                <Box
                  key={`venue-load-more-skeleton-${index}`}
                  display={display}
                  width="100%"
                >
                  <VenueCardSkeleton variant={venueCardVariant} />
                </Box>
              ))}
            </Grid>
          )}

          {/* Infinite Scroll Trigger */}
          {hasMore && (
            <Box
              ref={ref}
              mt={loadingMore ? 4 : 8}
              mb={10}
              width="full"
              overflowAnchor="none"
            >
              {loadingMore && (
                <Flex justify="center" role="status" aria-live="polite">
                  <Text color="gray.500" fontSize="sm">
                    {t('session.loadingMore')}
                  </Text>
                </Flex>
              )}
            </Box>
          )}
          {!hasMore && !loadingMore && venues.length > 0 && (
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
      <VenueRequestModal
        isOpen={isCreateRequestOpen}
        onClose={closeCreateRequest}
        type={VenueRequestType.CREATE}
        defaultKeyword={filters.q}
      />
      {isLoginModalOpen && (
        <LoginPromptModal
          isOpen={isLoginModalOpen}
          onClose={closeLoginModal}
          featureName={t('venueRequests.suggestNewVenue')}
          returnUrl={getCreateRequestReturnUrl()}
        />
      )}
    </Box>
  );
}
