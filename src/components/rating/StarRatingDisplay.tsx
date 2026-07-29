'use client';

import { Box, HStack, Text } from '@chakra-ui/react';
import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface StarRatingDisplayProps {
  rating: number;
  count?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showCount?: boolean;
  variant?: 'default' | 'compact' | 'inline';
}

const sizeMap = {
  xs: 12,
  sm: 14,
  md: 18,
  lg: 24,
};

const textSizeMap = {
  xs: 'xs',
  sm: 'xs',
  md: 'sm',
  lg: 'md',
};

export const StarRatingDisplay = ({
  rating,
  count = 0,
  size = 'sm',
  showCount = true,
  variant = 'default',
}: StarRatingDisplayProps) => {
  const t = useTranslations('rating');
  const starSize = sizeMap[size];
  const textSize = textSizeMap[size];

  // Round to 1 decimal
  const displayRating = Math.round(rating * 10) / 10;

  // The empty state only applies to the aggregate summary (default variant).
  // Compact/inline render a single, already-known rating where count is irrelevant.
  if (count === 0 && variant === 'default') {
    return (
      <HStack gap={1}>
        <Star size={starSize} color="#CBD5E0" strokeWidth={1.5} />
        <Text fontSize={textSize} color="gray.400">
          {t('noRatingsYet')}
        </Text>
      </HStack>
    );
  }

  if (variant === 'compact') {
    return (
      <HStack gap={0.5}>
        <Star
          size={starSize}
          fill="#F6AD55"
          color="#F6AD55"
          strokeWidth={1.5}
        />
        <Text fontSize={textSize} fontWeight="medium" color="gray.700">
          {displayRating.toFixed(1)}
        </Text>
        {showCount && count > 0 && (
          <Text fontSize={textSize} color="gray.500">
            ({count})
          </Text>
        )}
      </HStack>
    );
  }

  if (variant === 'inline') {
    return (
      <HStack gap={0.5} display="inline-flex">
        <Text fontSize={textSize} fontWeight="medium" color="gray.700">
          {displayRating.toFixed(1)}
        </Text>
        <Star
          size={starSize}
          fill="#F6AD55"
          color="#F6AD55"
          strokeWidth={1.5}
        />
      </HStack>
    );
  }

  // Default variant - show all 5 stars
  const fullStars = Math.floor(displayRating);
  const partialFill = displayRating - fullStars;

  return (
    <HStack gap={1}>
      <HStack gap={0.5}>
        {[1, 2, 3, 4, 5].map((star) => {
          let fillPercent = 0;
          if (star <= fullStars) {
            fillPercent = 100;
          } else if (star === fullStars + 1 && partialFill > 0) {
            fillPercent = partialFill * 100;
          }

          return (
            <Box key={star} position="relative">
              <Star size={starSize} color="#CBD5E0" strokeWidth={1.5} />
              {fillPercent > 0 && (
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  width={`${fillPercent}%`}
                  overflow="hidden"
                >
                  <Star
                    size={starSize}
                    fill="#F6AD55"
                    color="#F6AD55"
                    strokeWidth={1.5}
                  />
                </Box>
              )}
            </Box>
          );
        })}
      </HStack>
      <Text fontSize={textSize} fontWeight="medium" color="gray.700">
        {displayRating.toFixed(1)}
      </Text>
      {showCount && count > 0 && (
        <Text fontSize={textSize} color="gray.500">
          ({count})
        </Text>
      )}
    </HStack>
  );
};
