'use client';

import { Button } from '@/components/ui/chakra-compat';
import { useDisclosure } from '@/components/ui/ChakraHooks';
import { VModal } from '@/components/ui/VModal';
import { ROUTES, TIME_RANGES } from '@/constants';
import { VIETNAM_CITIES } from '@/constants/vietnam-locations';
import { RatingStatsProvider } from '@/contexts/RatingStatsContext';
import { useRouter } from '@/i18n/config';
import { ExtractedSessionData } from '@/lib/api/ai.service';
import { PlayerService } from '@/lib/api/player.service';
import { SessionService } from '@/lib/api/session.service';
import { VenueService } from '@/lib/api/venue.service';
import { ISession } from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSessionFilterStore } from '@/stores/useSessionFilterStore';
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
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { AISessionModal } from './AISessionModal';
import AppHostDetail from './AppHostDetail';
import FindSessionCard from './FindSessionCard';
import JoinSessionModal from './JoinSessionModal';
import { QuickCreateSessionBar } from './QuickCreateSessionBar';
import { SessionCardSkeleton } from './SessionCardSkeleton';
import SessionFilterDrawer from './SessionFilterDrawer';
import SessionSearchBar from './SessionSearchBar';
import ViewModeToggle from './ViewModeToggle';
import ResultsHeader from './ResultsHeader';

const PAGE_SIZE = 12;

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

  // Use Zustand store for filters
  const {
    filters,
    setFilters,
    clearFilters: clearStoreFilters,
    sortByDistance,
    setSortByDistance,
    userLocation,
    setUserLocation,
  } = useSessionFilterStore();

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
  }, [showFilters, filters, sortByDistance]);

  const [selectedSession, setSelectedSession] = useState<ISession | null>(null);
  const [selectedSessionForDetail, setSelectedSessionForDetail] =
    useState<ISession | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [pendingUserLocation, setPendingUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(userLocation);
  const [selectedVenueName, setSelectedVenueName] = useState<string | null>(
    null
  );
  const router = useRouter();
  const searchParams = useSearchParams();

  const t = useTranslations('session');
  const { viewMode } = useSessionFilterStore();
  const { user } = useAuthStore();

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  // Load initial filters from URL
  useEffect(() => {
    const dateParam = searchParams.get('date');
    const venueIdParam = searchParams.get('venueId');
    const newFilters: any = {};
    if (dateParam) newFilters.date = dateParam;
    if (venueIdParam) newFilters.venueId = venueIdParam;
    if (Object.keys(newFilters).length > 0) {
      setFilters(newFilters);
    }
  }, [searchParams, setFilters]);

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
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(1); // Reset to first page on filter change

        // Scroll to top on new search/filter
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
      setError(null);

      // Helper to clean district/city names for searching (remove "Quận", "Huyện", etc.)
      const normalizeLocation = (name: string) =>
        name.replace(/^(Quận|Huyện|Thành phố|Thị xã)\s+/i, '').trim();

      const currentPage = isLoadMore ? page + 1 : 1;

      // Prepare filters for API
      const apiFilters: any = {
        date: filters.date,
        searchQuery: filters.searchQuery,
        // Send City NAME instead of CODE
        city:
          filters.cities.length === 1
            ? VIETNAM_CITIES.find((c) => c.code === filters.cities[0])?.name
            : undefined,
        // Send cleaned District name
        district:
          filters.districts.length === 1
            ? normalizeLocation(filters.districts[0])
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

      // Add level filter (basic logic: pass first selected level or handle in client)
      if (filters.levels.length === 1) {
        apiFilters.level = filters.levels[0];
      }

      const response = await SessionService.getAvailableSessions(apiFilters);
      const { data, pagination } = response;

      // Client-side post-filtering for complex logic (multiple levels, time ranges, multi-city/district)
      let filteredData = data;

      // 1. Multi-city filter (if multiple cities selected)
      if (filters.cities.length > 1) {
        filteredData = filteredData.filter((session) => {
          const sessionCity = session.venue?.city || session.location || '';
          return filters.cities.some((cityCode) => {
            const cityName = VIETNAM_CITIES.find(
              (c) => c.code === cityCode
            )?.name;
            return (
              sessionCity.includes(cityCode) ||
              (cityName && sessionCity.includes(cityName))
            );
          });
        });
      }

      // 2. Multi-district filter (if multiple districts selected)
      if (filters.districts.length > 1) {
        filteredData = filteredData.filter((session) => {
          const sessionDistrict = session.venue?.district || '';
          return filters.districts.some((districtFilter) => {
            const cleanFilter = normalizeLocation(districtFilter);
            const cleanSession = normalizeLocation(sessionDistrict);
            return cleanSession.includes(cleanFilter);
          });
        });
      }

      // 3. Time range filter
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

      // 4. Multi-level filter (if backend didn't handle it or multiple selected)
      if (filters.levels.length > 0) {
        filteredData = filteredData.filter((session) => {
          const sessionLevels = session.requiredLevels || [];
          if (sessionLevels.length === 0) return true; // Open to all
          return filters.levels.some((l) => sessionLevels.includes(l));
        });
      }

      // 5. Split evenly filter (filter sessions with split evenly fee type)
      if (filters.splitEvenly) {
        filteredData = filteredData.filter((session) => {
          return session.feeConfig?.feeType === 'SPLIT_EVENLY';
        });
      }

      if (isLoadMore) {
        setSessions((prev) => [...prev, ...filteredData]);
        setPage(currentPage);
      } else {
        setSessions(filteredData);
        setTotalCount(pagination.total);
      }

      setHasMore(currentPage < pagination.totalPages);

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
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    // Debounce fetch for search query, but immediate for others if needed.
    const timer = setTimeout(() => {
      fetchSessions();
    }, 500);
    return () => clearTimeout(timer);
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
  ]);

  // Trigger load more when in view
  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore) {
      fetchSessions(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasMore, loading, loadingMore]);

  // Handler for search query
  const handleSearchQueryChange = (val: string) => {
    setFilters({ searchQuery: val });
  };

  const handleSubmitFilters = () => {
    setFilters(pendingFilters);
    setSortByDistance(pendingSortByDistance);
    if (pendingUserLocation) {
      setUserLocation(pendingUserLocation);
    }
    toggleFilters(); // Close drawer
  };

  const handleResetFilters = () => {
    clearStoreFilters();
    setSortByDistance(false);
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
  };

  const removeVenueIdFromUrl = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.delete('venueId');
    window.history.replaceState({}, '', url.toString());
  };

  const handleClearVenueFilter = () => {
    setFilters({ venueId: '' });
    removeVenueIdFromUrl();
  };

  const clearFilters = () => {
    clearStoreFilters();
    removeVenueIdFromUrl();
  };

  const activeFilterCount =
    (filters.searchQuery ? 1 : 0) +
    (filters.date ? 1 : 0) +
    filters.levels.length +
    filters.timeRanges.length +
    filters.cities.length +
    filters.districts.length +
    (filters.hasSlots ? 1 : 0) +
    (filters.minAvailableSlots > 0 ? 1 : 0) +
    (filters.minFee > 0 || filters.maxFee < 200000 ? 1 : 0) +
    (filters.splitEvenly ? 1 : 0) +
    (sortByDistance ? 1 : 0);

  // Count of non-search filters for showing the clear-all button
  const nonSearchFilterCount =
    (filters.venueId ? 1 : 0) +
    (filters.date ? 1 : 0) +
    filters.levels.length +
    filters.timeRanges.length +
    filters.cities.length +
    filters.districts.length +
    (filters.hasSlots ? 1 : 0) +
    (filters.minAvailableSlots > 0 ? 1 : 0) +
    (filters.minFee > 0 || filters.maxFee < 200000 ? 1 : 0) +
    (filters.splitEvenly ? 1 : 0) +
    (sortByDistance ? 1 : 0);

  // Handle Join Actions
  const handleJoinClick = (session: ISession) => {
    if (!user) {
      router.push(ROUTES.AUTH.SIGNIN);
      return;
    }
    setSelectedSession(session);
    setIsJoinModalOpen(true);
  };

  const handleHostClick = (session: ISession) => {
    setSelectedSessionForDetail(session);
    setIsDetailModalOpen(true);
  };

  // Extract unique host IDs for batch rating stats loading
  const hostIds = useMemo(() => {
    const ids = sessions
      .map((s) => s.hostId)
      .filter((id): id is string => id !== null && id !== undefined);
    return [...new Set(ids)];
  }, [sessions]);

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
      />

      {/* Filter Drawer */}
      <SessionFilterDrawer
        isOpen={showFilters}
        onClose={toggleFilters}
        filters={pendingFilters}
        setFilters={setPendingFilters}
        sortByDistance={pendingSortByDistance}
        setSortByDistance={setPendingSortByDistance}
        onSubmit={handleSubmitFilters}
        onReset={handleResetFilters}
        activeFilterCount={activeFilterCount}
        userLocation={pendingUserLocation}
        setUserLocation={setPendingUserLocation}
      />

      {/* Quick Create Bar */}
      {user && (
        <Box mb={4}>
          <QuickCreateSessionBar onInputClick={() => setIsAIModalOpen(true)} />
        </Box>
      )}

      {/* Results Header: Count + Mode Toggles + View Toggle */}
      <ResultsHeader
        count={totalCount}
        mode={mode}
        onModeChange={(newMode) => onModeChange?.(newMode)}
        isLoading={loading}
      >
        {(filters.venueId || nonSearchFilterCount > 0) && (
          <HStack gap={3} wrap="wrap">
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
                  {t('filters.atVenue') || 'Sân'}:
                </Text>
                <Text fontSize="xs" fontWeight="semibold" maxW="200px" truncate>
                  {selectedVenueName || '...'}
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

            {/* {nonSearchFilterCount > 0 && (
              <Button
                size="xs"
                variant="ghost"
                colorPalette="red"
                onClick={clearFilters}
                fontSize="xs"
                height="24px"
              >
                {t('filters.clearAll') || 'Xóa tất cả bộ lọc'}
              </Button>
            )} */}
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
      ) : sessions.length === 0 ? (
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
            {sessions.map((session) => (
              <FindSessionCard
                key={session.id}
                session={session}
                variant={viewMode}
                onJoin={() => handleJoinClick(session)}
                isJoined={joinedSessionIds.has(session.id)}
                userRegistrationStatus={
                  registrationStatusMap[session.id] || null
                }
                onRegistrationUpdate={() => fetchSessions()}
                distance={session.distance}
                onHostClick={() => handleHostClick(session)}
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
            router.push(ROUTES.SESSIONS.DETAIL(selectedSession.id));
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
          />
        )}
      </VModal>
    </Box>
  );
}
