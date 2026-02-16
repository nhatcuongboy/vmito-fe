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
import ResultsHeader from '@/components/session/ResultsHeader';
import QuickCreateFAB from '@/components/session/QuickCreateFAB';

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
      const response = await SessionService.getAllSessions({
        page: currentPage,
        limit: PAGE_SIZE,
        hostId: user?.role === UserRole.ADMIN ? undefined : user?.id,
        searchQuery: debouncedSearchQuery,
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
  }, [user?.id, debouncedSearchQuery]);

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

    // Default sort by date (newest first)
    result.sort((a, b) => {
      const dateA = a.startTime ? new Date(a.startTime).getTime() : 0;
      const dateB = b.startTime ? new Date(b.startTime).getTime() : 0;
      return dateB - dateA;
    });

    return result;
  }, [filters, sessions, searchQuery]);

  const handleFilterChange = (newFilters: ISessionFilterState) => {
    setFilters(newFilters);
  };

  const handleAISuccess = (data: ExtractedSessionData) => {
    // Redirect to create session page with AI-extracted data
    const queryParams = new URLSearchParams({
      aiData: JSON.stringify(data),
    });
    router.push(`/sessions/new?${queryParams.toString()}`);
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
      />

      <Box mb={4}>
        <QuickCreateSessionBar onInputClick={() => setIsAIModalOpen(true)} />
      </Box>
      <ResultsHeader count={totalCount} />
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
