'use client';

import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Skeleton,
  SkeletonCircle,
} from '@chakra-ui/react';
import { StarRatingDisplay } from './StarRatingDisplay';
import { Rating } from '@/lib/api/types';
import { useTranslations } from 'next-intl';
import { User, MessageSquare } from 'lucide-react';
import { formatDistanceToNow, Locale } from 'date-fns';
import { vi, enUS, zhCN } from 'date-fns/locale';
import { useLocale } from 'next-intl';

interface RatingListProps {
  ratings: Rating[];
  isLoading?: boolean;
  showRater?: boolean;
  showRated?: boolean;
  emptyMessage?: string;
}

const localeMap: Record<string, Locale> = {
  vi: vi,
  en: enUS,
  cn: zhCN,
};

export const RatingList = ({
  ratings,
  isLoading = false,
  showRater = true,
  showRated = false,
  emptyMessage,
}: RatingListProps) => {
  const t = useTranslations('rating');
  const locale = useLocale();
  const dateLocale = localeMap[locale] || enUS;

  if (isLoading) {
    return (
      <VStack gap={4} align="stretch">
        {[1, 2, 3].map((i) => (
          <Box
            key={i}
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            borderColor="gray.100"
          >
            <HStack gap={3} mb={3}>
              <SkeletonCircle size="10" />
              <VStack align="start" gap={1} flex={1}>
                <Skeleton height="16px" width="120px" />
                <Skeleton height="14px" width="80px" />
              </VStack>
            </HStack>
            <Skeleton height="40px" />
          </Box>
        ))}
      </VStack>
    );
  }

  if (ratings.length === 0) {
    return (
      <Box
        p={6}
        textAlign="center"
        borderWidth="1px"
        borderRadius="lg"
        borderColor="gray.100"
        borderStyle="dashed"
      >
        <MessageSquare size={32} color="#A0AEC0" style={{ margin: '0 auto' }} />
        <Text color="gray.500" mt={2}>
          {emptyMessage || t('noRatingsYet')}
        </Text>
      </Box>
    );
  }

  return (
    <VStack gap={3} align="stretch">
      {ratings.map((rating) => {
        const displayUser = showRater ? rating.rater : rating.rated;
        const timeAgo = formatDistanceToNow(new Date(rating.createdAt), {
          addSuffix: true,
          locale: dateLocale,
        });

        return (
          <Box
            key={rating.id}
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            borderColor="gray.100"
            bg="white"
            _hover={{ borderColor: 'gray.200', shadow: 'sm' }}
            transition="all 0.2s"
          >
            <HStack gap={3} mb={2}>
              <Avatar.Root size="sm" borderRadius="full">
                <Avatar.Fallback name={displayUser?.name || 'User'}>
                  <User size={16} />
                </Avatar.Fallback>
                {displayUser?.image && <Avatar.Image src={displayUser.image} />}
              </Avatar.Root>
              <VStack align="start" gap={0} flex={1}>
                <HStack justify="space-between" width="full">
                  <Text fontSize="sm" fontWeight="medium" color="gray.800">
                    {displayUser?.name || 'Unknown User'}
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    {timeAgo}
                  </Text>
                </HStack>
                <StarRatingDisplay
                  rating={rating.rating}
                  showCount={false}
                  size="xs"
                  variant="compact"
                />
              </VStack>
            </HStack>

            {rating.comment && (
              <Text fontSize="sm" color="gray.600" pl={10}>
                {rating.comment}
              </Text>
            )}

            {rating.session && (
              <Text fontSize="xs" color="gray.400" pl={10} mt={1}>
                {rating.session.name}
              </Text>
            )}
          </Box>
        );
      })}
    </VStack>
  );
};
