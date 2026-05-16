'use client';

import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { SessionService } from '@/lib/api/session.service';
import { ISession, UserRole, SessionStatus, FeeType } from '@/lib/api/types';
import { Box, Flex, Grid, Spinner, Text } from '@chakra-ui/react';

import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslations } from 'next-intl';
import { Suspense, useEffect, useState, useMemo, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import SessionsList from '@/components/session/SessionsList';
import { SessionCardSkeleton } from '@/components/session/SessionCardSkeleton';
import PageLayout from '@/components/layout/PageLayout';
import { useRouter } from '@/i18n/config';
import { useSearchParams } from 'next/navigation';

import SessionFilters from '@/components/session/SessionFilters';
import { ISessionFilterState } from '@/components/session/SessionFilters.types';
import AISessionModal from '@/components/session/AISessionModal';
import { ExtractedSessionData } from '@/lib/api/ai.service';
import ResultsHeader, { SortOption } from '@/components/session/ResultsHeader';
import { SessionSortBy, toApiSort } from '@/stores/useSessionFilterStore';
import HostSessionsNavPanel from '@/components/session/HostSessionsNavPanel';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import {
  ROUTES,
  TIME_RANGES,
  TOP_BAR_HEIGHT_MOBILE,
  TOP_BAR_HEIGHT_DESKTOP,
} from '@/constants';

import { StatusTabSwitch } from '@/components/session/StatusTabSwitch';
import { useViewMode } from '@/hooks/useViewMode';

const HOST_SORT_OPTIONS: SortOption[] = [
  { value: 'date_asc', labelKey: 'sort.dateNearest' },
  { value: 'date_desc', labelKey: 'sort.dateFurthest' },
  { value: 'status', labelKey: 'sort.status' },
  { value: 'price_asc', labelKey: 'sort.priceLow' },
  { value: 'price_desc', labelKey: 'sort.priceHigh' },
  { value: 'distance', labelKey: 'sort.distance' },
  { value: 'slots_desc', labelKey: 'sort.slotsAvailable' },
];

function HostSessionsContent() {
  const tNav = useTranslations('navigation');
  const tSession = useTranslations('session');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { useAiForCreation } = usePreferenceStore();
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expiredCount, setExpiredCount] = useState<number | null>(null);
  const PAGE_SIZE = 12;

  // Initialize sessionStatusTab from URL param, default to 'active'
  const [sessionStatusTab, setSessionStatusTab] = useState<
    'active' | 'ended' | 'pending' | 'all'
  >(
    (searchParams.get('tab') as 'active' | 'ended' | 'pending' | 'all') ||
      'active'
  );
  const loadingMoreRef = useRef(false);
  const [filters, setFilters] = useState<ISessionFilterState>({});
  const [sortBy, setSortBy] = useState<SessionSortBy>('date_asc');
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const [viewMode, setViewMode] = useViewMode('host-sessions');

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  const fetchHostedSessions = async (isLoadMore = false) => {
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

      const response = await SessionService.getAllSessions({
        page: currentPage,
        limit: PAGE_SIZE,
        hostId: user?.role === UserRole.ADMIN ? undefined : user?.id,
        searchQuery: filters.searchQuery,
        excludeStatuses:
          sessionStatusTab === 'active' && !filters.status
            ? [SessionStatus.FINISHED, SessionStatus.CANCELLED]
            : undefined,
        excludeStatus: undefined,
        status:
          sessionStatusTab === 'ended'
            ? SessionStatus.FINISHED
            : sessionStatusTab === 'active' && filters.status
              ? filters.status
              : sessionStatusTab === 'all'
                ? undefined
                : filters.status,
        endTimeBefore: undefined,
        endTimeAfter: undefined,
        ...apiSortParams,
      });

      if (isLoadMore) {
        setSessions((prev) => {
          // Prevent appending duplicate sessions on double-load
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
      console.error('Error fetching hosted sessions:', err);
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
      fetchHostedSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, filters.searchQuery, sortBy, filters.status, sessionStatusTab]);

  // Fetch expired sessions count once on mount
  useEffect(() => {
    if (!user?.id) return;
    SessionService.getAllSessions({
      hostId: user.role === UserRole.ADMIN ? undefined : user.id,
      status: SessionStatus.PREPARING,
      endTimeBefore: new Date().toISOString(),
      limit: 1,
    })
      .then((res) => setExpiredCount(res.total))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Trigger load more when in view
  useEffect(() => {
    if (
      inView &&
      hasMore &&
      !loading &&
      !loadingMore &&
      !loadingMoreRef.current
    ) {
      fetchHostedSessions(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasMore, loading, loadingMore]);

  // Apply filters whenever filters or sessions change
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Status filter is now handled on the server by excludeStatus or status param
    // Exclude FINISHED sessions - they are shown in the Ended Sessions tab
    // We only filter client-side if the API support was missing, but it's now added.

    // Status filter
    if (filters.status) {
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

    // Time range filter (client-side, for "Tất cả" tab)
    if (filters.timeRanges && filters.timeRanges.length > 0) {
      result = result.filter((session) => {
        if (!session.startTime) return false;
        const hour = new Date(session.startTime).getHours();
        return filters.timeRanges!.some((rangeKey) => {
          const range = TIME_RANGES.find((r) => r.key === rangeKey);
          if (!range) return false;
          if (range.start < range.end)
            return hour >= range.start && hour < range.end;
          // overnight range (e.g. night: 22–5)
          return hour >= range.start || hour < range.end;
        });
      });
    }

    // Level filter (multi-select, client-side)
    if (filters.levels && filters.levels.length > 0) {
      result = result.filter((session) => {
        if (!session.requiredLevels || session.requiredLevels.length === 0)
          return true;
        return filters.levels!.some((l) => session.requiredLevels!.includes(l));
      });
    }

    // Fee range filter (client-side)
    if (
      (filters.minFee !== undefined && filters.minFee > 0) ||
      (filters.maxFee !== undefined && filters.maxFee < 200000)
    ) {
      result = result.filter((session) => {
        const fee =
          session.feeConfig?.maleFee ?? session.feeConfig?.femaleFee ?? 0;
        const min = filters.minFee ?? 0;
        const max = filters.maxFee ?? 200000;
        return fee >= min && fee <= max;
      });
    }

    // Split evenly filter (client-side)
    if (filters.splitEvenly) {
      result = result.filter(
        (session) => session.feeConfig?.feeType === FeeType.SPLIT_EVENLY
      );
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
  }, [filters, sessions, sortBy]);

  const handleFilterChange = (newFilters: ISessionFilterState) => {
    setFilters(newFilters);
  };

  const handleTabChange = (
    newTab: 'active' | 'ended' | 'all' | 'pending' | 'expired'
  ) => {
    if (newTab === 'pending') {
      router.push(ROUTES.HOST.PENDING_JOIN_REQUESTS);
      return;
    }
    if (newTab === 'expired') {
      // Redirect expired to all tab
      newTab = 'all';
    }
    setFilters({});
    setSessionStatusTab(newTab as 'active' | 'ended' | 'all');
    // Update URL with new tab param
    const params = new URLSearchParams(searchParams);
    params.set('tab', newTab);
    router.push(`?${params.toString()}`);
  };

  const handleAISuccess = (data: ExtractedSessionData) => {
    // Save AI-extracted data to sessionStorage so SessionForm can pick it up
    sessionStorage.setItem('vmito_pending_session_data', JSON.stringify(data));
    router.push('/sessions/new');
  };

  return (
    <PageLayout
      showBackButton={false}
      topBarVariant="secondary"
      title={tNav('myHostedSessions')}
      bg="green.50"
      _dark={{ bg: 'gray.900' }}
      pt={{
        base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
        md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
      }}
      maxW="full"
      px={{ base: '24px', md: 0 }}
      hideTopBarBorder={true}
      centerTitle
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
            key={sessionStatusTab}
            onFilterChange={handleFilterChange}
            showStatusFilter={
              sessionStatusTab === 'active' || sessionStatusTab === 'all'
            }
            showDateFilter={true}
            showSearchFilter={true}
            showLevelFilter={sessionStatusTab === 'all'}
            showTimeFilter={sessionStatusTab === 'all'}
            showFeeFilter={sessionStatusTab === 'all'}
            resultCount={totalCount}
            onCreateClick={() => {
              if (useAiForCreation) {
                setIsAIModalOpen(true);
              } else {
                router.push(ROUTES.SESSIONS.NEW);
              }
            }}
            hideCreateOnMobile={true}
            topAddon={
              <StatusTabSwitch
                activeTab={sessionStatusTab}
                onChange={handleTabChange}
                showAll={true}
                showExpired={false}
              />
            }
          />

          <ResultsHeader
            count={totalCount}
            sortOptions={HOST_SORT_OPTIONS}
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
            mode="manage"
            onRefresh={fetchHostedSessions}
            hasMoreSessions={hasMore}
            expiredCount={expiredCount ?? undefined}
            viewMode={viewMode}
            showDownloadShareButtons={true}
            emptyStateTitle={
              sessionStatusTab === 'active'
                ? tSession('noActiveSessions')
                : sessionStatusTab === 'ended'
                  ? tSession('noSessionsFound')
                  : sessionStatusTab === 'all'
                    ? tSession('noSessionsFound')
                    : tSession('noSessionsFound')
            }
            emptyStateDescription={
              sessionStatusTab === 'active'
                ? tSession('noActiveSessionsDescription')
                : sessionStatusTab === 'ended'
                  ? undefined
                  : sessionStatusTab === 'all'
                    ? undefined
                    : undefined
            }
          />

          {/* Infinite Scroll Trigger */}
          {hasMore && sessions.length >= PAGE_SIZE && !loading && (
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

      <AISessionModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSuccess={handleAISuccess}
      />
    </PageLayout>
  );
}

export default function HostSessionsPage() {
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
        <HostSessionsContent />
      </Suspense>
    </ProtectedRouteGuard>
  );
}
