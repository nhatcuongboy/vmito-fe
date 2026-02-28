'use client';

import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { SessionService } from '@/lib/api/session.service';
import { ISession, UserRole } from '@/lib/api/types';
import { Box, Flex, Grid, Spinner, Text } from '@chakra-ui/react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslations } from 'next-intl';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import SessionsList from '@/components/session/SessionsList';
import { SessionCardSkeleton } from '@/components/session/SessionCardSkeleton';
import PageLayout from '@/components/layout/PageLayout';
import { useRouter } from '@/i18n/config';

import SessionFilters from '@/components/session/SessionFilters';
import { ISessionFilterState } from '@/components/session/SessionFilters.types';
import { QuickCreateSessionBar } from '@/components/session/QuickCreateSessionBar';
import AISessionModal from '@/components/session/AISessionModal';
import { ExtractedSessionData } from '@/lib/api/ai.service';
import { useDebounce } from '@/hooks/useDebounce';
import ResultsHeader, { SortOption } from '@/components/session/ResultsHeader';
import { SessionSortBy, toApiSort } from '@/stores/useSessionFilterStore';
import QuickCreateFAB from '@/components/session/QuickCreateFAB';

const HOST_SORT_OPTIONS: SortOption[] = [
  { value: 'status', labelKey: 'sort.status' },
  { value: 'date_asc', labelKey: 'sort.dateOldest' },
  { value: 'date_desc', labelKey: 'sort.dateNewest' },
  { value: 'created_desc', labelKey: 'sort.createdNewest' },
  { value: 'created_asc', labelKey: 'sort.createdOldest' },
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

  const [filters, setFilters] = useState<ISessionFilterState>({});
  const [sortBy, setSortBy] = useState<SessionSortBy>('status');
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
        ...apiSortParams,
      });

      if (isLoadMore) {
        setSessions((prev) => [...prev, ...response.data]);
        setPage(currentPage);
      } else {
        setSessions(response.data);
        setTotalCount(response.total);
      }

      setHasMore(currentPage < response.totalPages);
    } catch (err) {
      console.error('Error fetching hosted sessions:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchHostedSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, debouncedSearchQuery, sortBy]);

  // Trigger load more when in view
  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore) {
      fetchHostedSessions(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasMore, loading, loadingMore]);

  // Apply filters whenever filters or sessions change
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

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
      <SessionFilters
        onFilterChange={handleFilterChange}
        showStatusFilter={true}
        showDateFilter={true}
        showSearchFilter={true}
        showLevelFilter={false}
        resultCount={totalCount}
      />

      <Box mb={4}>
        <QuickCreateSessionBar onInputClick={() => setIsAIModalOpen(true)} />
      </Box>
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
      {hasMore && filteredSessions.length >= PAGE_SIZE && (
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
