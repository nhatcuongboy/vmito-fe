'use client';

import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { SessionService } from '@/lib/api/session.service';
import { ISession, UserRole, SessionStatus } from '@/lib/api/types';
import { Box, Flex, Grid, Spinner, Text } from '@chakra-ui/react';

import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslations } from 'next-intl';
import { Suspense, useEffect, useState, useMemo, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import SessionsList from '@/components/session/SessionsList';
import { SessionCardSkeleton } from '@/components/session/SessionCardSkeleton';
import PageLayout from '@/components/layout/PageLayout';
import { useRouter } from '@/i18n/config';

import SessionFilters from '@/components/session/SessionFilters';
import { ISessionFilterState } from '@/components/session/SessionFilters.types';
import AISessionModal from '@/components/session/AISessionModal';
import { ExtractedSessionData } from '@/lib/api/ai.service';
import { useDebounce } from '@/hooks/useDebounce';
import ResultsHeader, { SortOption } from '@/components/session/ResultsHeader';
import { SessionSortBy, toApiSort } from '@/stores/useSessionFilterStore';
import QuickCreateFAB from '@/components/session/QuickCreateFAB';
import HostSessionsNavPanel from '@/components/session/HostSessionsNavPanel';
import { ROUTES } from '@/constants';

import { StatusTabSwitch } from '@/components/session/StatusTabSwitch';

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
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  const [sessionStatusTab, setSessionStatusTab] = useState<'active' | 'ended'>(
    'active'
  );
  const loadingMoreRef = useRef(false);
  const [filters, setFilters] = useState<ISessionFilterState>({});
  const [sortBy, setSortBy] = useState<SessionSortBy>('date_asc');
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

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
      const response = await SessionService.getAllSessions({
        page: currentPage,
        limit: PAGE_SIZE,
        hostId: user?.role === UserRole.ADMIN ? undefined : user?.id,
        searchQuery: debouncedSearchQuery,
        excludeStatus:
          sessionStatusTab === 'active'
            ? filters.status
              ? undefined
              : SessionStatus.FINISHED
            : undefined,
        status:
          sessionStatusTab === 'ended'
            ? SessionStatus.FINISHED
            : filters.status,
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
  }, [filters, sessions, searchQuery, sortBy]);

  const handleFilterChange = (newFilters: ISessionFilterState) => {
    setFilters(newFilters);
  };

  const handleAISuccess = (data: ExtractedSessionData) => {
    // Save AI-extracted data to sessionStorage so SessionForm can pick it up
    sessionStorage.setItem('vmito_pending_session_data', JSON.stringify(data));
    router.push('/sessions/new');
  };

  return (
    <PageLayout
      showBackButton={false}
      title={tNav('myHostedSessions')}
      bg="green.50"
      _dark={{ bg: 'gray.900' }}
    >
      <Flex gap={6} alignItems="flex-start">
        <HostSessionsNavPanel />

        <Box flex={1} minW={0}>
          <SessionFilters
            onFilterChange={handleFilterChange}
            showStatusFilter={sessionStatusTab === 'active'}
            showDateFilter={true}
            showSearchFilter={true}
            showLevelFilter={false}
            resultCount={totalCount}
            onCreateClick={() => router.push(ROUTES.SESSIONS.NEW)}
            topAddon={
              <StatusTabSwitch
                activeTab={sessionStatusTab}
                onChange={setSessionStatusTab}
              />
            }
          />

          <ResultsHeader
            count={totalCount}
            sortOptions={HOST_SORT_OPTIONS}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
          <SessionsList
            sessions={filteredSessions}
            isLoading={loading}
            mode="manage"
            onRefresh={fetchHostedSessions}
          />

          {/* Infinite Scroll Trigger */}
          {hasMore && sessions.length >= PAGE_SIZE && (
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

      {user && <QuickCreateFAB bottom="90px" />}

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
