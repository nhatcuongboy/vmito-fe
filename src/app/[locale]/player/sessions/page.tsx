'use client';

import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { PlayerService } from '@/lib/api/player.service';
import { ISession, UserRole } from '@/lib/api/types';
import { Box, Container, Flex, Grid, Spinner, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Suspense, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import SessionsList from '@/components/session/SessionsList';
import { SessionCardSkeleton } from '@/components/session/SessionCardSkeleton';
import { useAuthStore } from '@/stores/useAuthStore';
import TopBar from '@/components/ui/TopBar';
import PageWrapper from '@/components/layout/PageWrapper';
import {
  CONTAINER_PX,
  CONTENT_PT_OFFSET,
  TOP_BAR_HEIGHT_MOBILE,
  TOP_BAR_HEIGHT_DESKTOP,
} from '@/constants';

import SessionFilters from '@/components/session/SessionFilters';
import { ISessionFilterState } from '@/components/session/SessionFilters.types';

function PlayerSessionsContent() {
  const t = useTranslations('navigation');
  const tSession = useTranslations('session');
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ISession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  const [filters, setFilters] = useState<ISessionFilterState>({});

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  const fetchPlayerSessions = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(1);
      }

      const currentPage = isLoadMore ? page + 1 : 1;
      const sessionData = await PlayerService.getMySessions({
        page: currentPage,
        limit: PAGE_SIZE,
      });

      if (isLoadMore) {
        setSessions((prev) => [...prev, ...sessionData]);
        setPage(currentPage);
      } else {
        setSessions(sessionData);
      }

      setHasMore(sessionData.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error fetching player sessions:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchPlayerSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Trigger load more when in view
  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore) {
      fetchPlayerSessions(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasMore, loading, loadingMore]);

  // Apply filters whenever filters or sessions change
  useEffect(() => {
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

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (session) =>
          session.name?.toLowerCase().includes(query) ||
          session.location?.toLowerCase().includes(query) ||
          session.venue?.name?.toLowerCase().includes(query) ||
          session.venue?.address?.toLowerCase().includes(query) ||
          session.host?.name?.toLowerCase().includes(query)
      );
    }

    // Default sort by date (newest first)
    result.sort((a, b) => {
      const dateA = a.startTime ? new Date(a.startTime).getTime() : 0;
      const dateB = b.startTime ? new Date(b.startTime).getTime() : 0;
      return dateB - dateA;
    });

    setFilteredSessions(result);
  }, [filters, sessions]);

  const handleFilterChange = (newFilters: ISessionFilterState) => {
    setFilters(newFilters);
  };

  return (
    <PageWrapper bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <TopBar showBackButton={false} title={t('joined')} />

      <Container
        maxW="container.xl"
        px={CONTAINER_PX}
        pt={{
          base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
          md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
        }}
        pb="calc(64px + env(safe-area-inset-bottom) + 24px)"
      >
        <SessionFilters
          onFilterChange={handleFilterChange}
          showStatusFilter={true}
          showDateFilter={true}
          showSearchFilter={true}
          showLevelFilter={false}
        />

        <SessionsList
          sessions={filteredSessions}
          isLoading={loading}
          mode="view"
          onRefresh={fetchPlayerSessions}
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
              <Spinner size="sm" color="blue.500" mr={2} />
              <Text color="gray.500" fontSize="sm">
                {tSession('loadingMore')}
              </Text>
            </Flex>
          </Box>
        )}
      </Container>
    </PageWrapper>
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
