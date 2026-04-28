'use client';

import { Button } from '@/components/ui/chakra-compat';
import { useDisclosure } from '@/components/ui/ChakraHooks';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { VModal } from '@/components/ui/VModal';
import { ROUTES, TIME_RANGES } from '@/constants';
import { VIETNAM_CITIES } from '@/constants/vietnam-locations';
import { RatingStatsProvider } from '@/contexts/RatingStatsContext';
import { useRouter } from '@/i18n/config';
import { ExtractedSessionData } from '@/lib/api/ai.service';
import { PlayerService } from '@/lib/api/player.service';
import { SessionService } from '@/lib/api/session.service';
import { VenueService } from '@/lib/api/venue.service';
import { formatVenueName } from '@/utils';
import { ISession } from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  useSessionFilterStore,
  toApiSort,
  SessionSortBy,
  SessionFilters,
} from '@/stores/useSessionFilterStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import {
  useUrlFilters,
  stringField,
  stringArrayField,
  numberField,
  numberArrayField,
  booleanField,
} from '@/hooks/useUrlFilters';
import {
  Badge,
  Box,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Text,
} from '@chakra-ui/react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  useRef,
} from 'react';
import { useInView } from 'react-intersection-observer';
import dynamic from 'next/dynamic';

const AISessionModal = dynamic(
  () => import('./AISessionModal').then((mod) => mod.AISessionModal),
  { ssr: false }
);
const AppHostDetail = dynamic(() => import('./AppHostDetail'), { ssr: false });
const JoinSessionModal = dynamic(() => import('./JoinSessionModal'), {
  ssr: false,
});
const SessionFilterDrawer = dynamic(() => import('./SessionFilterDrawer'), {
  ssr: false,
});
const LoginPromptModal = dynamic(() => import('../auth/LoginPromptModal'), {
  ssr: false,
});

import FindSessionCard from './FindSessionCard';
import { SessionCardSkeleton } from './SessionCardSkeleton';
import SessionSearchBar from './SessionSearchBar';
import ResultsHeader from './ResultsHeader';

const PAGE_SIZE = 12;

// URL filter schema – keeps session filters in sync with query params.
const SESSION_FILTERS_SCHEMA = {
  q: stringField(),
  date: stringField(),
  cities: stringArrayField(),
  districts: stringArrayField(),
  venueId: stringField(),
  levels: numberArrayField(),
  timeRanges: stringArrayField(),
  minFee: numberField(0),
  maxFee: numberField(200000),
  hasSlots: booleanField(false),
  minSlots: numberField(0),
  splitEvenly: booleanField(false),
  near: booleanField(false),
  sort: stringField('date_asc'),
};

export type SessionUrlFilters = ReturnType<
  typeof useUrlFilters<typeof SESSION_FILTERS_SCHEMA>
>[0];

interface FindSessionListProps {
  initialSessions?: ISession[];
  mode?: 'browse' | 'auto';
  onModeChange?: (mode: 'browse' | 'auto') => void;
}

export default function FindSessionList({
  initialSessions = [],
  mode = 'browse',
  onModeChange,
}: FindSessionListProps) {
  const [sessions, setSessions] = useState<ISession[]>(initialSessions);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(initialSessions.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinedSessionIds, setJoinedSessionIds] = useState<Set<string>>(
    new Set()
  );
  const [registrationStatusMap, setRegistrationStatusMap] = useState<
    Record<string, 'PENDING' | 'APPROVED' | 'REJECTED'>
  >({});

  // URL-synced filters
  const [urlFilters, setUrlFilters, resetUrlFilters] = useUrlFilters(
    SESSION_FILTERS_SCHEMA
  );

  // Map URL filters to the shape expected by SessionFilterDrawer / API
  const filters = useMemo(
    () => ({
      searchQuery: urlFilters.q,
      date: urlFilters.date,
      cities: urlFilters.cities,
      districts: urlFilters.districts,
      venueId: urlFilters.venueId,
      levels: urlFilters.levels,
      timeRanges: urlFilters.timeRanges,
      minFee: urlFilters.minFee,
      maxFee: urlFilters.maxFee,
      hasSlots: urlFilters.hasSlots,
      minAvailableSlots: urlFilters.minSlots,
      splitEvenly: urlFilters.splitEvenly,
    }),
    [urlFilters]
  );

  const sortByDistance = urlFilters.near;
  const sortBy = urlFilters.sort as SessionSortBy;

  // Keep viewMode & userLocation in the Zustand store (non-URL state)
  const { viewMode, userLocation, setUserLocation } = useSessionFilterStore();

  const { isOpen: showFilters, onToggle: toggleFilters } = useDisclosure(false);

  // Local state for pending filters (before Submit)
  const [pendingFilters, setPendingFilters] = useState(filters);
  const [pendingSortByDistance, setPendingSortByDistance] =
    useState(sortByDistance);

  // Sync pending filters when drawer opens
  useEffect(() => {
    if (showFilters) {
      setPendingFilters(filters);
      setPendingSortByDistance(sortByDistance);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFilters]);

  const [selectedSession, setSelectedSession] = useState<ISession | null>(null);
  const [selectedSessionForDetail, setSelectedSessionForDetail] =
    useState<ISession | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [pendingUserLocation, setPendingUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(userLocation);
  const [selectedVenueName, setSelectedVenueName] = useState<string | null>(
    null
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const handleRegistrationUpdate = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);
  const router = useRouter();

  const t = useTranslations('session');
  const tVenue = useTranslations('venue');
  const { getLevelShortLabel } = useLevelLabel();
  const { user } = useAuthStore();
  const { useAiForCreation } = usePreferenceStore();

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  const loadingMoreRef = useRef(false);

  // Fetch venue name if filtered by venue
  useEffect(() => {
    const fetchVenueName = async () => {
      if (filters.venueId) {
        try {
          const venue = await VenueService.getVenue(filters.venueId);
          setSelectedVenueName(venue.name);
        } catch (error) {
          console.error('Failed to fetch venue name:', error);
          setSelectedVenueName(null);
        }
      } else {
        setSelectedVenueName(null);
      }
    };
    fetchVenueName();
  }, [filters.venueId]);

  const fetchSessions = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(1); // Reset to first page on filter change
      }
      setError(null);

      // Helper to clean district/city names for searching (remove "Quận", "Huyện", etc.)
      const normalizeLocation = (name: string) =>
        name.replace(/^(Quận|Huyện|Thành phố|Thị xã)\s+/i, '').trim();

      const currentPage = isLoadMore ? page + 1 : 1;

      // Prepare filters for API
      const apiFilters: Parameters<
        typeof SessionService.getAvailableSessions
      >[0] = {
        date: filters.date,
        searchQuery: filters.searchQuery,
        // Send City NAME(s) instead of CODE(s) — comma-separated for multi-select
        city:
          filters.cities.length > 0
            ? filters.cities
                .map(
                  (code) =>
                    VIETNAM_CITIES.find((c) => c.code === code)?.name ?? code
                )
                .join(',')
            : undefined,
        // Send cleaned District name(s) — comma-separated for multi-select
        district:
          filters.districts.length > 0
            ? filters.districts.map(normalizeLocation).join(',')
            : undefined,
        venueId: filters.venueId || undefined,
        hasSlots: filters.hasSlots ? true : undefined,
        minAvailableSlots:
          filters.minAvailableSlots > 0 ? filters.minAvailableSlots : undefined,
        page: currentPage,
        limit: PAGE_SIZE,
      };

      // Fee filter (only if changed from defaults or split evenly is selected)
      if (
        filters.minFee > 0 ||
        filters.maxFee < 200000 ||
        filters.splitEvenly
      ) {
        apiFilters.minFee = filters.minFee;
        apiFilters.maxFee = filters.maxFee;
        // Note: splitEvenly is a frontend-only filter for now
      }

      // Geospatial filter
      if (sortByDistance && userLocation) {
        apiFilters.lat = userLocation.lat;
        apiFilters.lng = userLocation.lng;
        apiFilters.sortByDistance = true;
      }

      // Pass sort params to API
      const apiSortParams = toApiSort(sortBy);
      if (apiSortParams.sortBy) {
        apiFilters.sortBy = apiSortParams.sortBy;
        apiFilters.sortOrder = apiSortParams.sortOrder;
      }

      // Add level filter (basic logic: pass first selected level or handle in client)
      if (filters.levels.length === 1) {
        apiFilters.level = filters.levels[0];
      }

      const response = await SessionService.getAvailableSessions(apiFilters);
      const { data, pagination } = response;

      // Client-side post-filtering for complex logic (time ranges, levels)
      let filteredData = data;
      if (filters.timeRanges.length > 0) {
        filteredData = filteredData.filter((session) => {
          if (!session.startTime) return false;
          const hour = new Date(session.startTime).getHours();
          return filters.timeRanges.some((rangeKey) => {
            const rangeDef = TIME_RANGES.find((r) => r.key === rangeKey);
            if (!rangeDef) return false;
            if (rangeDef.start < rangeDef.end) {
              return hour >= rangeDef.start && hour < rangeDef.end;
            } else {
              // Night wraps around midnight
              return hour >= rangeDef.start || hour < rangeDef.end;
            }
          });
        });
      }

      // 1. Multi-level filter (if backend didn't handle it or multiple selected)
      if (filters.levels.length > 0) {
        filteredData = filteredData.filter((session) => {
          const sessionLevels = session.requiredLevels || [];
          if (sessionLevels.length === 0) return true; // Open to all
          return filters.levels.some((l) => sessionLevels.includes(l));
        });
      }

      // 2. Split evenly filter (filter sessions with split evenly fee type)
      if (filters.splitEvenly) {
        filteredData = filteredData.filter((session) => {
          return session.feeConfig?.feeType === 'SPLIT_EVENLY';
        });
      }

      if (isLoadMore) {
        setSessions((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const newSessions = filteredData.filter(
            (s) => !existingIds.has(s.id)
          );
          return [...prev, ...newSessions];
        });
        setPage(currentPage);
      } else {
        setSessions(filteredData);
        setTotalCount(pagination.total);
      }

      setHasMore(
        currentPage < pagination.totalPages && filteredData.length > 0
      );

      // Fetch user specific data
      if (user) {
        try {
          const mySessionsResponse = await PlayerService.getMySessions();
          setJoinedSessionIds(
            new Set(mySessionsResponse.data.map((s) => s.id))
          );

          const registrations = await PlayerService.getMyRegistrations();
          const statusMap: Record<string, 'PENDING' | 'APPROVED' | 'REJECTED'> =
            {};
          registrations.forEach((reg) => {
            statusMap[reg.sessionId] = reg.status as
              | 'PENDING'
              | 'APPROVED'
              | 'REJECTED';
          });
          setRegistrationStatusMap(statusMap);
        } catch (err) {
          console.error('Failed to fetch user session data', err);
        }
      }
    } catch (err) {
      setError(t('loadingError'));
      console.error(err);
    } finally {
      if (isLoadMore) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Filters from drawer are applied via Submit button (batch update).
    // Search query is debounced at the input level (SessionSearchBar).
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.date,
    filters.cities,
    filters.districts,
    filters.venueId,
    filters.hasSlots,
    filters.minAvailableSlots,
    filters.minFee,
    filters.maxFee,
    filters.levels,
    filters.timeRanges,
    filters.splitEvenly,
    sortByDistance,
    userLocation,
    filters.searchQuery,
    sortBy,
    refreshKey,
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
      fetchSessions(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasMore, loading, loadingMore]);

  // Handler for search query
  const handleSearchQueryChange = (val: string) => {
    setUrlFilters({ q: val });
  };

  const handleSubmitFilters = () => {
    setUrlFilters({
      q: pendingFilters.searchQuery,
      date: pendingFilters.date,
      cities: pendingFilters.cities,
      districts: pendingFilters.districts,
      venueId: pendingFilters.venueId,
      levels: pendingFilters.levels,
      timeRanges: pendingFilters.timeRanges,
      minFee: pendingFilters.minFee,
      maxFee: pendingFilters.maxFee,
      hasSlots: pendingFilters.hasSlots,
      minSlots: pendingFilters.minAvailableSlots,
      splitEvenly: pendingFilters.splitEvenly,
      near: pendingSortByDistance,
    });
    if (pendingUserLocation) {
      setUserLocation(pendingUserLocation);
    }
    toggleFilters(); // Close drawer
  };

  const handleResetFilters = () => {
    resetUrlFilters();
    setPendingFilters({
      date: '',
      searchQuery: '',
      cities: [],
      districts: [],
      venueId: '',
      levels: [],
      timeRanges: [],
      minFee: 0,
      maxFee: 200000,
      hasSlots: false,
      minAvailableSlots: 0,
      splitEvenly: false,
    });
    setPendingSortByDistance(false);
    setPendingUserLocation(null);
    toggleFilters(); // Close drawer after reset
  };

  const handleClearVenueFilter = () => {
    setUrlFilters({ venueId: '' });
  };

  const clearFilters = () => {
    resetUrlFilters();
  };

  const activeFilterCount =
    (filters.date ? 1 : 0) +
    (filters.levels.length > 0 ? 1 : 0) +
    (filters.timeRanges.length > 0 ? 1 : 0) +
    (filters.cities.length > 0 ? 1 : 0) +
    (filters.districts.length > 0 ? 1 : 0) +
    (filters.hasSlots ? 1 : 0) +
    (filters.minAvailableSlots > 0 ? 1 : 0) +
    (filters.minFee > 0 || filters.maxFee < 200000 ? 1 : 0) +
    (filters.splitEvenly ? 1 : 0) +
    (sortByDistance ? 1 : 0);

  // Count of non-search filters for showing the clear-all button
  const nonSearchFilterCount = activeFilterCount;

  // Handle Join Actions
  const handleJoinClick = useCallback(
    (session: ISession) => {
      if (!user) {
        router.push(ROUTES.AUTH.SIGNIN);
        return;
      }
      setSelectedSession(session);
      setIsJoinModalOpen(true);
    },
    [user, router]
  );

  const [isPendingCreate, startCreateTransition] = useTransition();

  const handleCreateSessionClick = useCallback(() => {
    if (!user) {
      setIsLoginPromptOpen(true);
      return;
    }
    if (useAiForCreation) {
      setIsAIModalOpen(true);
    } else {
      router.push(ROUTES.SESSIONS.NEW);
    }
  }, [user, useAiForCreation, router]);

  const handleHostClick = useCallback((session: ISession) => {
    setSelectedSessionForDetail(session);
    setIsDetailModalOpen(true);
  }, []);

  // Sort sessions: API handles most sorts, client-side only for distance and slots
  const sortedSessions = useMemo(() => {
    const sorted = [...sessions];
    switch (sortBy) {
      case 'distance':
        return sorted.sort((a, b) => {
          const distA = a.distance ?? Infinity;
          const distB = b.distance ?? Infinity;
          return distA - distB;
        });
      case 'slots_desc':
        return sorted.sort((a, b) => {
          const maxA = a.numberOfCourts * a.maxPlayersPerCourt;
          const maxB = b.numberOfCourts * b.maxPlayersPerCourt;
          const currentA = a._count?.players ?? a.players?.length ?? 0;
          const currentB = b._count?.players ?? b.players?.length ?? 0;
          return maxB - currentB - (maxA - currentA);
        });
      default:
        // Already sorted by API
        return sorted;
    }
  }, [sessions, sortBy]);

  // Extract unique host IDs for batch rating stats loading
  const hostIds = useMemo(() => {
    const ids = sortedSessions
      .map((s) => s.hostId)
      .filter((id): id is string => id !== null && id !== undefined);
    return [...new Set(ids)];
  }, [sortedSessions]);

  const handleAISuccess = (data: ExtractedSessionData) => {
    // Save data to session storage to be picked up by the form
    sessionStorage.setItem('vmito_pending_session_data', JSON.stringify(data));

    router.push(ROUTES.SESSIONS.NEW);
  };

  return (
    <Box>
      {/* Search Bar & Main Controls */}
      <SessionSearchBar
        searchQuery={filters.searchQuery}
        onSearchChange={handleSearchQueryChange}
        onToggleFilters={toggleFilters}
        activeFilterCount={activeFilterCount}
        onCreateClick={handleCreateSessionClick}
        isLoadingCreate={isPendingCreate}
        hideCreateOnMobile={true}
        topOffset={44}
      />

      {/* Filter Drawer */}
      <SessionFilterDrawer
        isOpen={showFilters}
        onClose={toggleFilters}
        filters={pendingFilters as SessionFilters}
        setFilters={setPendingFilters}
        sortByDistance={pendingSortByDistance}
        setSortByDistance={setPendingSortByDistance}
        onSubmit={handleSubmitFilters}
        onReset={handleResetFilters}
        activeFilterCount={activeFilterCount}
        userLocation={pendingUserLocation}
        setUserLocation={setPendingUserLocation}
      />

      {/* Results Header: Count + Mode Toggles + View Toggle */}
      <ResultsHeader
        count={totalCount}
        mode={mode}
        onModeChange={(newMode) => onModeChange?.(newMode)}
        isLoading={loading}
        sortBy={sortBy}
        onSortChange={(value) => setUrlFilters({ sort: value })}
      >
        {(filters.venueId || nonSearchFilterCount > 0) && (
          <HStack gap={2} wrap="wrap">
            {/* Venue */}
            {filters.venueId && (
              <Badge
                colorPalette="teal"
                variant="subtle"
                px={3}
                py={1.5}
                borderRadius="full"
                display="flex"
                alignItems="center"
                gap={2}
                boxShadow="sm"
              >
                <Text fontSize="xs" fontWeight="bold">
                  {t('filters.atVenue')}:
                </Text>
                <Text fontSize="xs" fontWeight="semibold" maxW="160px" truncate>
                  {selectedVenueName
                    ? formatVenueName(
                        selectedVenueName,
                        tVenue('nameFormat', { name: '{name}' })
                      )
                    : '...'}
                </Text>
                <Icon
                  as={X}
                  boxSize={3}
                  cursor="pointer"
                  onClick={handleClearVenueFilter}
                  _hover={{ color: 'red.500' }}
                />
              </Badge>
            )}

            {/* Date */}
            {filters.date && (
              <Badge
                colorPalette="blue"
                variant="subtle"
                px={3}
                py={1.5}
                borderRadius="full"
                display="flex"
                alignItems="center"
                gap={2}
                boxShadow="sm"
              >
                <Text fontSize="xs" fontWeight="semibold">
                  📅 {filters.date}
                </Text>
                <Icon
                  as={X}
                  boxSize={3}
                  cursor="pointer"
                  onClick={() => setUrlFilters({ date: '' })}
                  _hover={{ color: 'red.500' }}
                />
              </Badge>
            )}

            {/* Time ranges */}
            {filters.timeRanges.length > 0 && (
              <Badge
                colorPalette="orange"
                variant="subtle"
                px={3}
                py={1.5}
                borderRadius="full"
                display="flex"
                alignItems="center"
                gap={2}
                boxShadow="sm"
              >
                <Text fontSize="xs" fontWeight="semibold">
                  ⏰{' '}
                  {filters.timeRanges.length <= 2
                    ? filters.timeRanges
                        .map((r) => t(`timeRanges.${r}`))
                        .join(', ')
                    : `${filters.timeRanges.length} ${t('timeRange')}`}
                </Text>
                <Icon
                  as={X}
                  boxSize={3}
                  cursor="pointer"
                  onClick={() => setUrlFilters({ timeRanges: [] })}
                  _hover={{ color: 'red.500' }}
                />
              </Badge>
            )}

            {/* Cities / Districts */}
            {filters.cities.length > 0 && (
              <Badge
                colorPalette="purple"
                variant="subtle"
                px={3}
                py={1.5}
                borderRadius="full"
                display="flex"
                alignItems="center"
                gap={2}
                boxShadow="sm"
              >
                <Text fontSize="xs" fontWeight="semibold">
                  📍{' '}
                  {filters.cities.length === 1
                    ? (VIETNAM_CITIES.find((c) => c.code === filters.cities[0])
                        ?.name ?? filters.cities[0])
                    : t('filters.selectedCities', {
                        count: filters.cities.length,
                      })}
                  {filters.districts.length > 0 &&
                    ` · ${
                      filters.districts.length > 1
                        ? t('filters.selectedDistricts', {
                            count: filters.districts.length,
                          })
                        : filters.districts[0]
                    }`}
                </Text>
                <Icon
                  as={X}
                  boxSize={3}
                  cursor="pointer"
                  onClick={() => setUrlFilters({ cities: [], districts: [] })}
                  _hover={{ color: 'red.500' }}
                />
              </Badge>
            )}

            {/* Levels */}
            {filters.levels.length > 0 && (
              <Badge
                colorPalette="green"
                variant="subtle"
                px={3}
                py={1.5}
                borderRadius="full"
                display="flex"
                alignItems="center"
                gap={2}
                boxShadow="sm"
              >
                <Text fontSize="xs" fontWeight="semibold">
                  🏸{' '}
                  {filters.levels.length <= 3
                    ? filters.levels
                        .map((l) => getLevelShortLabel(l))
                        .join(', ')
                    : `${filters.levels.length} trình độ`}
                </Text>
                <Icon
                  as={X}
                  boxSize={3}
                  cursor="pointer"
                  onClick={() => setUrlFilters({ levels: [] })}
                  _hover={{ color: 'red.500' }}
                />
              </Badge>
            )}

            {/* Fee range */}
            {(filters.minFee > 0 || filters.maxFee < 200000) && (
              <Badge
                colorPalette="yellow"
                variant="subtle"
                px={3}
                py={1.5}
                borderRadius="full"
                display="flex"
                alignItems="center"
                gap={2}
                boxShadow="sm"
              >
                <Text fontSize="xs" fontWeight="semibold">
                  💰 {filters.minFee / 1000}k→{filters.maxFee / 1000}k
                </Text>
                <Icon
                  as={X}
                  boxSize={3}
                  cursor="pointer"
                  onClick={() => setUrlFilters({ minFee: 0, maxFee: 200000 })}
                  _hover={{ color: 'red.500' }}
                />
              </Badge>
            )}

            {/* Has slots */}
            {filters.hasSlots && (
              <Badge
                colorPalette="green"
                variant="subtle"
                px={3}
                py={1.5}
                borderRadius="full"
                display="flex"
                alignItems="center"
                gap={2}
                boxShadow="sm"
              >
                <Text fontSize="xs" fontWeight="semibold">
                  {t('filters.availableSlots')}
                </Text>
                <Icon
                  as={X}
                  boxSize={3}
                  cursor="pointer"
                  onClick={() => setUrlFilters({ hasSlots: false })}
                  _hover={{ color: 'red.500' }}
                />
              </Badge>
            )}

            {/* Near me */}
            {sortByDistance && (
              <Badge
                colorPalette="cyan"
                variant="subtle"
                px={3}
                py={1.5}
                borderRadius="full"
                display="flex"
                alignItems="center"
                gap={2}
                boxShadow="sm"
              >
                <Text fontSize="xs" fontWeight="semibold">
                  {t('filters.nearMe')}
                </Text>
                <Icon
                  as={X}
                  boxSize={3}
                  cursor="pointer"
                  onClick={() => setUrlFilters({ near: false })}
                  _hover={{ color: 'red.500' }}
                />
              </Badge>
            )}

            {/* Split evenly */}
            {filters.splitEvenly && (
              <Badge
                colorPalette="pink"
                variant="subtle"
                px={3}
                py={1.5}
                borderRadius="full"
                display="flex"
                alignItems="center"
                gap={2}
                boxShadow="sm"
              >
                <Text fontSize="xs" fontWeight="semibold">
                  {t('filters.splitEvenly')}
                </Text>
                <Icon
                  as={X}
                  boxSize={3}
                  cursor="pointer"
                  onClick={() => setUrlFilters({ splitEvenly: false })}
                  _hover={{ color: 'red.500' }}
                />
              </Badge>
            )}
          </HStack>
        )}
      </ResultsHeader>

      {/* Results List */}
      {loading ? (
        <Grid
          templateColumns={
            viewMode === 'compact'
              ? {
                  base: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)',
                }
              : {
                  base: '1fr',
                  md: 'repeat(2, 1fr)',
                  lg: 'repeat(3, 1fr)',
                }
          }
          gap={viewMode === 'compact' ? 4 : 6}
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <SessionCardSkeleton key={index} variant={viewMode} />
          ))}
        </Grid>
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
      ) : sortedSessions.length === 0 ? (
        <Box
          textAlign="center"
          py={10}
          px={6}
          borderWidth="1px"
          borderRadius="lg"
          bg="white"
          _dark={{ bg: 'gray.800' }}
        >
          <Heading size="md" mb={2}>
            {t('noSessionsFound')}
          </Heading>
          <Text color="gray.500">{t('tryAdjustingFilters')}</Text>
          <Button mt={4} onClick={clearFilters} variant="outline" size="sm">
            {t('filters.clearFilters')}
          </Button>
        </Box>
      ) : (
        <RatingStatsProvider userIds={hostIds}>
          <Grid
            templateColumns={
              viewMode === 'compact'
                ? {
                    base: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)',
                  }
                : {
                    base: '1fr',
                    md: 'repeat(2, 1fr)',
                    lg: 'repeat(3, 1fr)',
                  }
            }
            gap={viewMode === 'compact' ? 4 : 6}
          >
            {sortedSessions.map((session) => (
              <FindSessionCard
                key={session.id}
                session={session}
                variant={viewMode}
                onJoin={handleJoinClick}
                isJoined={joinedSessionIds.has(session.id)}
                userRegistrationStatus={
                  registrationStatusMap[session.id] || null
                }
                onRegistrationUpdate={handleRegistrationUpdate}
                distance={session.distance}
                onHostClick={handleHostClick}
              />
            ))}
          </Grid>

          {/* Infinite Scroll Trigger */}
          {hasMore && (
            <Box ref={ref} mt={8} mb={10} width="full">
              <Grid
                templateColumns={
                  viewMode === 'compact'
                    ? {
                        base: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: 'repeat(4, 1fr)',
                      }
                    : {
                        base: '1fr',
                        md: 'repeat(2, 1fr)',
                        lg: 'repeat(3, 1fr)',
                      }
                }
                gap={viewMode === 'compact' ? 4 : 6}
              >
                {Array.from({ length: 3 }).map((_, index) => (
                  <SessionCardSkeleton key={index} variant={viewMode} />
                ))}
              </Grid>
              <Flex justify="center" mt={4}>
                <Text color="gray.500" fontSize="sm">
                  {t('loadingMore') || 'Đang tải thêm...'}
                </Text>
              </Flex>
            </Box>
          )}
        </RatingStatsProvider>
      )}

      {selectedSession && (
        <JoinSessionModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          session={selectedSession}
          onSuccess={() => {
            fetchSessions();
            router.push(
              ROUTES.SESSIONS.DETAIL(selectedSession.id, selectedSession.slug)
            );
          }}
        />
      )}

      {/* AI Session Creation Modal */}
      <AISessionModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSuccess={handleAISuccess}
      />

      {/* Session Host Detail Modal */}
      <VModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={t('hostInfo') || 'Thông tin Host'}
        size="md"
        hideSecondaryAction={true}
      >
        {selectedSessionForDetail && (
          <AppHostDetail
            userId={selectedSessionForDetail.hostId}
            name={
              selectedSessionForDetail.hostName ||
              selectedSessionForDetail.host?.name
            }
            image={selectedSessionForDetail.host?.image || undefined}
            phone={selectedSessionForDetail.hostPhone}
            email={selectedSessionForDetail.host?.email}
            hideHeader={true}
            onClose={() => setIsDetailModalOpen(false)}
          />
        )}
      </VModal>
      {isLoginPromptOpen && (
        <LoginPromptModal
          isOpen={isLoginPromptOpen}
          onClose={() => setIsLoginPromptOpen(false)}
          featureName={t('loginRequiredCreateSession')}
          returnUrl={ROUTES.SESSIONS.NEW}
        />
      )}
    </Box>
  );
}
