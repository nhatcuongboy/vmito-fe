'use client';

import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { SessionService } from '@/lib/api/session.service';
import { ISession, UserRole } from '@/lib/api/types';
import { Box, Container, Flex, Grid, Spinner, Text } from '@chakra-ui/react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslations } from 'next-intl';
import { Suspense, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import SessionsList from '@/components/session/SessionsList';
import { SessionCardSkeleton } from '@/components/session/SessionCardSkeleton';
import TopBar from '@/components/ui/TopBar';
import PageWrapper from '@/components/layout/PageWrapper';
import { useRouter } from '@/i18n/config';
import {
  CONTAINER_PX,
  CONTENT_PT_OFFSET,
  TOP_BAR_HEIGHT_MOBILE,
  TOP_BAR_HEIGHT_DESKTOP,
} from '@/constants';

import SessionFilters from '@/components/session/SessionFilters';
import { ISessionFilterState } from '@/components/session/SessionFilters.types';
import { QuickCreateSessionBar } from '@/components/session/QuickCreateSessionBar';
import AISessionModal from '@/components/session/AISessionModal';
import { ExtractedSessionData } from '@/lib/api/ai.service';

function HostSessionsContent() {
  const tNav = useTranslations('navigation');
  const tSession = useTranslations('session');
  const router = useRouter();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ISession[]>([]);
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

  const fetchHostedSessions = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(1);
      }

      const currentPage = isLoadMore ? page + 1 : 1;
      const sessionData = await SessionService.getAllSessions({
        page: currentPage,
        limit: PAGE_SIZE,
        hostId: user?.role === UserRole.ADMIN ? undefined : user?.id,
      });

      if (isLoadMore) {
        setSessions((prev) => [...prev, ...sessionData]);
        setPage(currentPage);
      } else {
        setSessions(sessionData);
      }

      setHasMore(sessionData.length === PAGE_SIZE);
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
  }, [user?.id]);

  // Trigger load more when in view
  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore) {
      fetchHostedSessions(true);
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
          session.venue?.address?.toLowerCase().includes(query)
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

  const handleAISuccess = (data: ExtractedSessionData) => {
    // Redirect to create session page with AI-extracted data
    const queryParams = new URLSearchParams({
      aiData: JSON.stringify(data),
    });
    router.push(`/sessions/new?${queryParams.toString()}`);
  };

  return (
    <PageWrapper bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <TopBar showBackButton={false} title={tNav('myHostedSessions')} />

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

        <QuickCreateSessionBar onInputClick={() => setIsAIModalOpen(true)} />

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
              <Spinner size="sm" color="blue.500" mr={2} />
              <Text color="gray.500" fontSize="sm">
                {tSession('loadingMore')}
              </Text>
            </Flex>
          </Box>
        )}
      </Container>

      <AISessionModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSuccess={handleAISuccess}
      />
    </PageWrapper>
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
