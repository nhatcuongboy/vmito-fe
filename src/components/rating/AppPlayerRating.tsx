import React from 'react';
import { Flex, Text, Icon } from '@chakra-ui/react';
import { Star } from 'lucide-react';
import { useRatingStats } from '@/contexts/RatingStatsContext';

export interface AppPlayerRatingProps {
  userId: string | undefined | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showBullet?: boolean;
}

export const AppPlayerRating: React.FC<AppPlayerRatingProps> = ({
  userId,
  size = 'sm',
  showBullet = false,
}) => {
  const { getRatingStats } = useRatingStats();

  if (!userId) return null;

  const stats = getRatingStats(userId);

  if (!stats || stats.totalRatings === 0) return null;

  const iconSizes = {
    xs: 3,
    sm: 4,
    md: 5,
    lg: 6,
  };

  const textSizes = {
    xs: 'xs',
    sm: 'sm',
    md: 'md',
    lg: 'lg',
  };

  return (
    <Flex align="center" gap={size === 'xs' ? 0.5 : 1} flexShrink={0}>
      {showBullet && (
        <Text fontSize={textSizes[size]} color="gray.500">
          ·
        </Text>
      )}
      <Icon
        as={Star}
        boxSize={iconSizes[size]}
        color="yellow.500"
        fill="yellow.500"
      />
      <Text fontSize={textSizes[size]} fontWeight="semibold">
        {stats.averageRating.toFixed(1)}
      </Text>
    </Flex>
  );
};
