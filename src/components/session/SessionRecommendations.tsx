'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Flex, Heading, Skeleton, Stack } from '@chakra-ui/react';
import { SessionService } from '@/lib/api/session.service';
import { ISession } from '@/lib/api/types';
import RecommendationCard from './RecommendationCard';
import { Button } from '@/components/ui/chakra-compat';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslations } from 'next-intl';

interface RecommendedSession
  extends Omit<
    ISession,
    | 'distance'
    | 'slug'
    | 'startTime'
    | 'endTime'
    | 'coverPhoto'
    | 'venue'
    | 'host'
    | 'feeConfig'
    | 'requiredLevels'
  > {
  relevanceScore: number;
  matchReasons: string[];
  distance: number | null;
  availableSlots: number;
  maxSlots: number;
  slug: string;
  startTime: string;
  endTime: string;
  coverPhoto: string | null;
  venue: {
    id: string;
    name: string;
    address: string;
    city: string;
    district: string;
    lat: number;
    lng: number;
  };
  host: {
    id: string;
    name: string;
    image: string | null;
  };
  feeConfig: {
    feeType: 'FIXED' | 'SPLIT_EVENLY';
    maleFee: number | null;
    femaleFee: number | null;
  } | null;
  requiredLevels: number[];
}

interface SessionRecommendationsProps {
  sessionId: string;
  userId?: string;
  variant: 'mobile' | 'desktop';
}

interface UseRecommendationsResult {
  recommendations: RecommendedSession[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  isFallback: boolean;
}

// Custom hook for fetching recommendations
const useRecommendations = (
  sessionId: string,
  userId?: string
): UseRecommendationsResult => {
  const [recommendations, setRecommendations] = useState<RecommendedSession[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  const fetchRecommendations = useCallback(
    async (pageNum: number) => {
      try {
        setIsLoading(true);
        const response = await SessionService.getSessionRecommendations(
          sessionId,
          {
            page: pageNum,
            limit: 12,
            userId,
          }
        );

        if (pageNum === 1) {
          setRecommendations(response.data as unknown as RecommendedSession[]);
        } else {
          setRecommendations((prev) => [
            ...prev,
            ...(response.data as unknown as RecommendedSession[]),
          ]);
        }

        setHasMore(response.pagination.page < response.pagination.totalPages);
        setIsFallback(response.meta.isFallback);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, userId]
  );

  useEffect(() => {
    fetchRecommendations(1);
  }, [fetchRecommendations]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchRecommendations(nextPage);
    }
  }, [isLoading, hasMore, page, fetchRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    hasMore,
    loadMore,
    isFallback,
  };
};

const SessionRecommendations = ({
  sessionId,
  userId,
  variant,
}: SessionRecommendationsProps) => {
  const t = useTranslations('suggestions');
  const { user } = useAuthStore();
  const effectiveUserId = userId || user?.id;

  const { recommendations, isLoading, error, hasMore, loadMore, isFallback } =
    useRecommendations(sessionId, effectiveUserId);

  const isMobile = variant === 'mobile';
  const [showAll, setShowAll] = useState(false);
  const sectionTitle = isFallback ? t('popular') : t('forYou');

  // Hide section on error or empty state
  if (error || (!isLoading && recommendations.length === 0)) {
    return null;
  }

  // Skeleton loader
  if (isLoading && recommendations.length === 0) {
    return (
      <Box w="100%" py={isMobile ? 4 : 0}>
        <Heading size={isMobile ? 'md' : 'sm'} mb={3} px={isMobile ? 4 : 0}>
          {sectionTitle}
        </Heading>
        {isMobile ? (
          <Flex gap={3} overflowX="auto" px={4} pb={2}>
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                w="75vw"
                minW="280px"
                maxW="320px"
                h="220px"
                borderRadius="xl"
              />
            ))}
          </Flex>
        ) : (
          <Stack gap={2}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} w="100%" h="180px" borderRadius="lg" />
            ))}
          </Stack>
        )}
      </Box>
    );
  }

  // Mobile layout: horizontal scroll
  if (isMobile) {
    return (
      <Box w="100%" py={4} as="section" aria-label={t('sectionAria')}>
        <Heading size="md" mb={3} px={4} as="h2">
          {sectionTitle}
        </Heading>
        <Flex
          gap={3}
          overflowX="auto"
          px={4}
          pb={2}
          role="list"
          tabIndex={0}
          aria-label={t('listAria')}
          onKeyDown={(e) => {
            const container = e.currentTarget;
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              container.scrollBy({ left: -300, behavior: 'smooth' });
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              container.scrollBy({ left: 300, behavior: 'smooth' });
            }
          }}
          css={{
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {recommendations.map((session) => (
            <Box key={session.id} role="listitem">
              <RecommendationCard
                session={session}
                variant="mobile"
                showAIBadge={!isFallback}
              />
            </Box>
          ))}
        </Flex>
      </Box>
    );
  }

  // Desktop layout: vertical list in sidebar
  const displayedRecommendations = showAll
    ? recommendations
    : recommendations.slice(0, 3);

  return (
    <Box w="100%" pb={6} as="section" aria-label={t('sectionAria')}>
      <Heading size="xs" mb={3} as="h2" color="gray.700">
        {sectionTitle}
      </Heading>
      <Stack gap={2.5} role="list">
        {displayedRecommendations.map((session) => (
          <Box key={session.id} role="listitem">
            <RecommendationCard
              session={session}
              variant="desktop"
              showAIBadge={!isFallback}
            />
          </Box>
        ))}
      </Stack>

      {/* Show more button */}
      {!showAll && recommendations.length > 3 && (
        <Button
          w="100%"
          mt={3}
          mb={2}
          size="sm"
          variant="outline"
          colorPalette="green"
          onClick={() => setShowAll(true)}
        >
          {t('viewMoreSimilar', { count: recommendations.length - 3 })}
        </Button>
      )}

      {/* Load more button (pagination) */}
      {showAll && hasMore && (
        <Button
          w="100%"
          mt={3}
          size="sm"
          variant="outline"
          colorPalette="green"
          loading={isLoading}
          onClick={loadMore}
        >
          {t('loadMore')}
        </Button>
      )}
    </Box>
  );
};

export default SessionRecommendations;
