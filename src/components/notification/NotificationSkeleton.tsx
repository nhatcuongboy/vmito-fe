'use client';

import {
  Box,
  HStack,
  VStack,
  Skeleton,
  SkeletonCircle,
} from '@chakra-ui/react';

export const NotificationSkeleton = () => {
  return (
    <Box p={3} borderRadius="md" transition="all 0.15s">
      <HStack gap={3} align="start">
        {/* Icon placeholder */}
        <SkeletonCircle size="36px" />

        <Box flex={1} minW={0}>
          {/* Header (Title + Badge) */}
          <HStack justify="space-between" mb={2}>
            <Skeleton height="16px" width="60%" borderRadius="full" />
            <Skeleton height="12px" width="30px" borderRadius="full" />
          </HStack>

          {/* Message lines */}
          <VStack gap={2} align="stretch" mb={2}>
            <Skeleton height="14px" width="100%" borderRadius="full" />
            <Skeleton height="14px" width="85%" borderRadius="full" />
          </VStack>

          {/* Timestamp */}
          <Skeleton height="10px" width="80px" borderRadius="full" />
        </Box>
      </HStack>
    </Box>
  );
};
