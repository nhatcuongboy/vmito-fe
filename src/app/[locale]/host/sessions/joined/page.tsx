'use client';

import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { PlayerService } from '@/lib/api/player.service';
import { ISession, UserRole, SessionStatus } from '@/lib/api/types';
import { Box, Flex, Grid, Spinner, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Suspense, useEffect, useState, useMemo, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import SessionsList from '@/components/session/SessionsList';
import { SessionCardSkeleton } from '@/components/session/SessionCardSkeleton';
import { useAuthStore } from '@/stores/useAuthStore';
import PageLayout from '@/components/layout/PageLayout';
import { useRouter } from '@/i18n/config';
import { TOP_BAR_HEIGHT_MOBILE, TOP_BAR_HEIGHT_DESKTOP } from '@/constants';
import { useSearchParams } from 'next/navigation';

import SessionFilters from '@/components/session/SessionFilters';
import { ISessionFilterState } from '@/components/session/SessionFilters.types';
import { useDebounce } from '@/hooks/useDebounce';
import ResultsHeader, { SortOption } from '@/components/session/ResultsHeader';
import { SessionSortBy, toApiSort } from '@/stores/useSessionFilterStore';
import HostSessionsNavPanel from '@/components/session/HostSessionsNavPanel';
import { StatusTabSwitch } from '@/components/session/StatusTabSwitch';
import { useViewMode } from '@/hooks/useViewMode';

const PLAYER_SORT_OPTIONS: SortOption[] = [
  { value: 'status', labelKey: 'sort.status' },
  { value: 'date_asc', labelKey: 'sort.dateNearest' },
  { value: 'date_desc', labelKey: 'sort.dateFurthest' },
  { value: 'created_desc', labelKey: 'sort.createdNewest' },
  { value: 'created_asc', labelKey: 'sort.createdOldest' },
  { value: 'price_asc', labelKey: 'sort.priceLow' },
  { value: 'price_desc', labelKey: 'sort.priceHigh' },
  { value: 'distance', labelKey: 'sort.distance' },
  { value: 'slots_desc', labelKey: 'sort.slotsAvailable' },
];

function PlayerSessionsContent() {
  const t = useTranslations('navigation');
  const tSession = useTranslations('session');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  // Initialize sessionStatusTab from URL param, default to 'active'
  const [sessionStatusTab, setSessionStatusTab] = useState<'active' | 'ended'>(
    (searchParams.get('tab') as 'active' | 'ended') || 'active'
  );
  const [filters, setFilters] = useState<ISessionFilterState>({});
  const [sortBy, setSortBy] = useState<SessionSortBy>('date_asc');

  const loadingMoreRef = useRef(false);

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [viewMode, setViewMode] = useViewMode('host-sessions-joined');

  const fetchPlayerSessions = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(1);
      }

      const currentPage = isLoadMore ? page + 1 : 1;
      const apiSortParams = toApiSort(sortBy);

      // Invert date sort order for ended sessions to show most recently ended first
      if (sessionStatusTab === 'ended' && apiSortParams.sortBy === 'date') {
        apiSortParams.sortOrder =
          apiSortParams.sortOrder === 'asc' ? 'desc' : 'asc';
      }

      const response = await PlayerService.getMySessions({
        page: currentPage,
        limit: PAGE_SIZE,
        searchQuery: debouncedSearchQuery,
        excludeStatuses:
          sessionStatusTab === 'active' && !filters.status
            ? [SessionStatus.FINISHED, SessionStatus.CANCELLED]
            : undefined,
        status:
          sessionStatusTab === 'ended'
            ? SessionStatus.FINISHED
            : filters.status,
        ...apiSortParams,
      });

      if (isLoadMore) {
        setSessions((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const newSessions = response.data.filter(
            (s) => !existingIds.has(s.id)
          );
          return [...prev, ...newSessions];
        });
        setPage(currentPage);
      } else {
        setSessions(response.data);
        setTotalCount(response.total);
      }

      setHasMore(currentPage < response.totalPages && response.data.length > 0);
    } catch (err) {
      console.error('Error fetching player sessions:', err);
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
    if (user?.id) {
      fetchPlayerSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user?.id,
    debouncedSearchQuery,
    sortBy,
    filters.status,
    sessionStatusTab,
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
      fetchPlayerSessions(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasMore, loading, loadingMore]);

  // Apply filters whenever filters or sessions change
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Exclude FINISHED sessions from active tab - they are shown in the Ended Joined Sessions tab
    if (sessionStatusTab === 'active') {
      result = result.filter(
        (session) => session.status !== SessionStatus.FINISHED
      );
    }

    // Status filter
    if (filters.status && sessionStatusTab === 'active') {
      result = result.filter((session) => session.status === filters.status);
    }

    // Date filter
    if (filters.date) {
      const filterDate = new Date(filters.date);
      result = result.filter((session) => {
        if (!session.startTime) return false;
        const sessionDate = new Date(session.startTime);
        return (
          sessionDate.getFullYear() === filterDate.getFullYear() &&
          sessionDate.getMonth() === filterDate.getMonth() &&
          sessionDate.getDate() === filterDate.getDate()
        );
      });
    }

    // Search filter is handled by API now
    if (filters.searchQuery !== searchQuery) {
      setSearchQuery(filters.searchQuery || '');
    }

    // Client-side sort only for slots (not supported by API)
    if (sortBy === 'slots_desc') {
      result.sort((a, b) => {
        const maxA = a.numberOfCourts * a.maxPlayersPerCourt;
        const maxB = b.numberOfCourts * b.maxPlayersPerCourt;
        const currentA = a._count?.players ?? a.players?.length ?? 0;
        const currentB = b._count?.players ?? b.players?.length ?? 0;
        return maxB - currentB - (maxA - currentA);
      });
    }
    // Other sorts are handled by the API

    return result;
  }, [filters, sessions, searchQuery, sortBy, sessionStatusTab]);

  const handleFilterChange = (newFilters: ISessionFilterState) => {
    setFilters(newFilters);
  };

  const handleTabChange = (
    newTab: 'active' | 'ended' | 'pending' | 'expired'
  ) => {
    if (newTab === 'pending' || newTab === 'expired') return; // Should not happen with showPending={false}
    setSessionStatusTab(newTab);
    // Update URL with new tab param
    const params = new URLSearchParams(searchParams);
    params.set('tab', newTab);
    router.push(`?${params.toString()}`);
  };

  return (
    <PageLayout
      showBackButton={false}
      title={t('joined')}
      bg="green.50"
      _dark={{ bg: 'gray.900' }}
      pt={{
        base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
        md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
      }}
      maxW="full"
      px={{ base: '24px', md: 0 }}
      hideTopBarBorder={true}
    >
      <Flex
        gap={6}
        alignItems="flex-start"
        pt={{ md: 6 }}
        pl={{ md: 4 }}
        pr={{ md: 6 }}
      >
        <HostSessionsNavPanel />

        <Box flex={1} minW={0}>
          <SessionFilters
            onFilterChange={handleFilterChange}
            showStatusFilter={sessionStatusTab === 'active'}
            showDateFilter={true}
            showSearchFilter={true}
            showLevelFilter={false}
            topAddon={
              <StatusTabSwitch
                activeTab={sessionStatusTab}
                onChange={handleTabChange}
                showPending={false}
                showExpired={false}
              />
            }
          />

          <ResultsHeader
            count={totalCount}
            sortOptions={PLAYER_SORT_OPTIONS}
            sortBy={sortBy}
            onSortChange={setSortBy}
            showViewModeMap={false}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
          <SessionsList
            sessions={filteredSessions}
            isLoading={loading}
            isLoadingMore={loadingMore}
            mode="view"
            onRefresh={fetchPlayerSessions}
            viewMode={viewMode}
          />

          {/* Infinite Scroll Trigger */}
          {hasMore && filteredSessions.length >= PAGE_SIZE && !loading && (
            <Box ref={ref} mt={8} mb={10} width="full">
              <Grid
                templateColumns={{
                  base: '1fr',
                  md: 'repeat(2, 1fr)',
                  lg: 'repeat(3, 1fr)',
                }}
                gap={6}
              >
                {Array.from({ length: 3 }).map((_, index) => (
                  <SessionCardSkeleton key={index} />
                ))}
              </Grid>
              <Flex justify="center" mt={4}>
                <Spinner size="sm" color="green.500" mr={2} />
                <Text color="gray.500" fontSize="sm">
                  {tSession('loadingMore')}
                </Text>
              </Flex>
            </Box>
          )}
        </Box>
      </Flex>
    </PageLayout>
  );
}

export default function PlayerSessionsPage() {
  return (
    <ProtectedRouteGuard
      requiredRole={[UserRole.PLAYER, UserRole.HOST, UserRole.ADMIN]}
    >
      <Suspense
        fallback={
          <Flex justify="center" align="center" minH="100vh">
            <Spinner size="xl" />
          </Flex>
        }
      >
        <PlayerSessionsContent />
      </Suspense>
    </ProtectedRouteGuard>
  );
}
