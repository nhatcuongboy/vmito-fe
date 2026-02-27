'use client';

import { Box, VStack, HStack, Text, Skeleton, Icon } from '@chakra-ui/react';
import { StarRatingDisplay } from './StarRatingDisplay';
import { UserRatingStats } from '@/lib/api/types';
import { useTranslations } from 'next-intl';
import { Star, Users, UserCheck } from 'lucide-react';

interface UserRatingSummaryCardProps {
  stats: UserRatingStats | null;
  isLoading?: boolean;
  showBreakdown?: boolean;
}

export const UserRatingSummaryCard = ({
  stats,
  isLoading = false,
  showBreakdown = false,
}: UserRatingSummaryCardProps) => {
  const t = useTranslations('rating');

  if (isLoading) {
    return (
      <Box p={4} borderWidth="1px" borderRadius="lg" borderColor="gray.100">
        <VStack gap={3} align="stretch">
          <Skeleton height="24px" width="150px" />
          <Skeleton height="16px" width="100px" />
          {showBreakdown && (
            <>
              <Skeleton height="16px" width="120px" />
              <Skeleton height="16px" width="120px" />
            </>
          )}
        </VStack>
      </Box>
    );
  }

  if (!stats || stats.totalRatings === 0) {
    return (
      <Box
        p={5}
        borderRadius="xl"
        bg="white"
        _dark={{ bg: 'gray.800/50' }}
        borderWidth="1px"
        borderColor="gray.100"
        borderStyle="dashed"
      >
        <VStack gap={2} align="center" py={2}>
          <Icon as={Star} boxSize={6} color="gray.300" />
          <Text color="gray.400" fontSize="sm" fontWeight="medium">
            {t('noRatingsYet')}
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="lg"
      borderColor="gray.100"
      bg="white"
    >
      <VStack gap={3} align="stretch">
        {/* Overall Rating */}
        <HStack justify="space-between" align="center">
          <Text fontSize="sm" fontWeight="medium" color="gray.600">
            {t('averageRating')}
          </Text>
          <StarRatingDisplay
            rating={stats.averageRating}
            count={stats.totalRatings}
            size="md"
            variant="compact"
          />
        </HStack>

        {/* Breakdown */}
        {showBreakdown && (
          <>
            {stats.asHostCount !== undefined && stats.asHostCount > 0 && (
              <HStack justify="space-between" align="center">
                <HStack gap={2} color="gray.500">
                  <UserCheck size={14} />
                  <Text fontSize="xs">{t('asHost')}</Text>
                </HStack>
                <StarRatingDisplay
                  rating={stats.asHostAverage || 0}
                  count={stats.asHostCount}
                  size="xs"
                  variant="compact"
                />
              </HStack>
            )}

            {stats.asPlayerCount !== undefined && stats.asPlayerCount > 0 && (
              <HStack justify="space-between" align="center">
                <HStack gap={2} color="gray.500">
                  <Users size={14} />
                  <Text fontSize="xs">{t('asPlayer')}</Text>
                </HStack>
                <StarRatingDisplay
                  rating={stats.asPlayerAverage || 0}
                  count={stats.asPlayerCount}
                  size="xs"
                  variant="compact"
                />
              </HStack>
            )}
          </>
        )}
      </VStack>
    </Box>
  );
};
