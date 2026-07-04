'use client';

import {
  Box,
  HStack,
  VStack,
  Skeleton,
  SkeletonCircle,
} from '@chakra-ui/react';

interface TransactionSummarySkeletonProps {
  rows?: number;
}

export default function TransactionSummarySkeleton({
  rows = 5,
}: TransactionSummarySkeletonProps) {
  return (
    <VStack gap={4} align="stretch">
      {/* Overall Summary skeleton */}
      <Box
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="lg"
        p={4}
      >
        <HStack mb={3} gap={2}>
          <SkeletonCircle size="18px" />
          <Skeleton height="16px" width="100px" borderRadius="full" />
        </HStack>
        <HStack gap={4} wrap="wrap">
          {Array.from({ length: 3 }).map((_, i) => (
            <Box key={i} flex={1} minW="100px">
              <Skeleton height="10px" width="60px" mb={2} borderRadius="full" />
              <Skeleton height="20px" width="80px" borderRadius="full" />
            </Box>
          ))}
        </HStack>
      </Box>

      {/* Row skeletons */}
      <VStack gap={2} align="stretch">
        {Array.from({ length: rows }).map((_, i) => (
          <Box
            key={i}
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
            p={4}
          >
            <HStack justify="space-between">
              <HStack gap={3}>
                <SkeletonCircle size="40px" />
                <Box>
                  <Skeleton
                    height="16px"
                    width="120px"
                    mb={2}
                    borderRadius="full"
                  />
                  <Skeleton height="12px" width="70px" borderRadius="full" />
                </Box>
              </HStack>
              <VStack gap={2} align="flex-end">
                <Skeleton height="14px" width="60px" borderRadius="full" />
                <Skeleton height="18px" width="90px" borderRadius="full" />
              </VStack>
            </HStack>
          </Box>
        ))}
      </VStack>
    </VStack>
  );
}
