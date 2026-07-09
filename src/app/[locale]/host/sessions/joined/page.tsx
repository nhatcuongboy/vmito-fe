'use client';

import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { PlayerService } from '@/lib/api/player.service';
import { SessionService } from '@/lib/api/session.service';
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
import ResultsHeader, { SortOption } from '@/components/session/ResultsHeader';
import { SessionSortBy, toApiSort } from '@/stores/useSessionFilterStore';
import HostSessionsNavPanel from '@/components/session/HostSessionsNavPanel';
import { StatusTabSwitch } from '@/components/session/StatusTabSwitch';
import { useViewMode } from '@/hooks/useViewMode';
import { useSocketListRefresh } from '@/hooks/useSocketListRefresh';
import { SessionEventType } from '@/contexts/SocketContext';
import { FavoriteFilterButton } from '@/components/favorites/FavoriteFilterButton';
import dynamic from 'next/dynamic';

const JoinSessionModal = dynamic(
  () => import('@/components/session/JoinSessionModal'),
  { ssr: false }
);

// Realtime events (emitted to the player's user room) that should refresh
// the joined sessions list: approval/rejection of join requests and generic
// notifications (removed from session, session changes).
const JOINED_LIST_REFRESH_EVENTS = [
  SessionEventType.REGISTRATION_STATUS_UPDATED,
  SessionEventType.NOTIFICATION_RECEIVED,
];

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

type SessionStatusTab = 'active' | 'ended' | 'all';

const enrichSessionsWithVenue = async (
  sessions: ISession[]
): Promise<ISession[]> => {
  return Promise.all(
    sessions.map(async (session) => {
      if (session.venue?.name) return session;

      try {
        const sessionDetail = await SessionService.getSession(session.id);
        return {
          ...session,
          venue: sessionDetail.venue || session.venue,
          location: sessionDetail.location || session.location,
        };
      } catch (error) {
        console.error('Error fetching session venue details:', error);
        return session;
      }
    })
  );
};

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
  const [sessionStatusTab, setSessionStatusTab] = useState<SessionStatusTab>(
    (() => {
      const tabParam = searchParams.get('tab');
      if (tabParam === 'active' || tabParam === 'ended' || tabParam === 'all') {
        return tabParam;
      }
      return 'active';
    })()
  );
  const [filters, setFilters] = useState<ISessionFilterState>({});
  const [sortBy, setSortBy] = useState<SessionSortBy>('date_asc');
  const [favoriteOnly, setFavoriteOnly] = useState(false);

  const loadingMoreRef = useRef(false);

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  const [viewMode, setViewMode] = useViewMode('host-sessions-joined');
  const [selectedSessionForGuest, setSelectedSessionForGuest] =
    useState<ISession | null>(null);
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);

  const handleAddGuestClick = (session: ISession) => {
    setSelectedSessionForGuest(session);
    setIsAddGuestModalOpen(true);
  };

  // `silent` refreshes the data without toggling the loading skeleton —
  // used for background refetches triggered by realtime events.
  const fetchPlayerSessions = async (isLoadMore = false, silent = false) => {
    try {
      if (isLoadMore) {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        if (!silent) {
          setLoading(true);
        }
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
        searchQuery: filters.searchQuery,
        excludeStatuses:
          sessionStatusTab === 'active' && !filters.status
            ? [SessionStatus.FINISHED, SessionStatus.CANCELLED]
            : undefined,
        status:
          sessionStatusTab === 'ended'
            ? SessionStatus.FINISHED
            : filters.status,
        favoriteOnly,
        ...apiSortParams,
      });

      const sessionsWithVenue = await enrichSessionsWithVenue(response.data);

      if (isLoadMore) {
        setSessions((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const newSessions = sessionsWithVenue.filter(
            (s) => !existingIds.has(s.id)
          );
          return [...prev, ...newSessions];
        });
        setPage(currentPage);
      } else {
        setSessions(sessionsWithVenue);
        setTotalCount(response.total);
      }

      setHasMore(
        currentPage < response.totalPages && sessionsWithVenue.length > 0
      );
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
    filters.searchQuery,
    sortBy,
    filters.status,
    sessionStatusTab,
    favoriteOnly,
  ]);

  // Refetch the list when realtime events for this player arrive so
  // registration statuses don't go stale while waiting for host approval.
  useSocketListRefresh(JOINED_LIST_REFRESH_EVENTS, () => {
    if (user?.id && !loadingMoreRef.current) {
      fetchPlayerSessions(false, true);
    }
  });

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
        (session) =>
          session.status !== SessionStatus.FINISHED &&
          session.status !== SessionStatus.CANCELLED
      );
    }

    // Status filter
    if (filters.status && sessionStatusTab !== 'ended') {
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
  }, [filters, sessions, sortBy, sessionStatusTab]);

  const handleFilterChange = (newFilters: ISessionFilterState) => {
    setFilters(newFilters);
  };

  const handleTabChange = (
    newTab: 'active' | 'ended' | 'all' | 'pending' | 'expired'
  ) => {
    if (newTab === 'pending' || newTab === 'expired') return; // Should not happen with showPending={false}
    setSessionStatusTab(newTab);
    // Update URL with new tab param
    const params = new URLSearchParams(searchParams);
    params.set('tab', newTab);
    router.push(`?${params.toString()}`);
  };

  const displayCount = filters.date ? filteredSessions.length : totalCount;

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
            showStatusFilter={
              sessionStatusTab === 'active' || sessionStatusTab === 'all'
            }
            showDateFilter={true}
            showSearchFilter={true}
            showLevelFilter={false}
            hideSearchOnDesktop={true}
            topAddon={
              <StatusTabSwitch
                activeTab={sessionStatusTab}
                onChange={handleTabChange}
                showAll={true}
                showPending={false}
                showExpired={false}
              />
            }
          />

          <ResultsHeader
            count={displayCount}
            sortOptions={PLAYER_SORT_OPTIONS}
            sortBy={sortBy}
            onSortChange={setSortBy}
            showViewModeMap={false}
            viewMode={viewMode}
            setViewMode={setViewMode}
            favoriteButton={
              <FavoriteFilterButton
                isActive={favoriteOnly}
                onToggle={() => setFavoriteOnly((value) => !value)}
              />
            }
          />
          <SessionsList
            sessions={filteredSessions}
            isLoading={loading}
            isLoadingMore={loadingMore}
            mode="view"
            onRefresh={fetchPlayerSessions}
            viewMode={viewMode}
            forceViewSessionButton={true}
            showDownloadShareButtons={true}
            onAddGuest={handleAddGuestClick}
            emptyStateTitle={
              sessionStatusTab === 'active'
                ? tSession('noActiveSessions')
                : sessionStatusTab === 'ended'
                  ? tSession('noSessionsFound')
                  : tSession('noSessionsFound')
            }
            emptyStateDescription={
              sessionStatusTab === 'active'
                ? tSession('noSessionsDescription')
                : undefined
            }
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

      {selectedSessionForGuest && (
        <JoinSessionModal
          isOpen={isAddGuestModalOpen}
          onClose={() => setIsAddGuestModalOpen(false)}
          session={selectedSessionForGuest}
          onSuccess={() => {
            setIsAddGuestModalOpen(false);
            fetchPlayerSessions();
          }}
          isAdditionalRegistration={true}
        />
      )}
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
