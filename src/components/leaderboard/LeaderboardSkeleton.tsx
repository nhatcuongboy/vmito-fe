'use client';

import {
  Flex,
  HStack,
  Skeleton,
  SkeletonCircle,
  Stack,
  VStack,
} from '@chakra-ui/react';

const PODIUM_HEIGHTS = ['170px', '200px', '170px'];
const ROW_COUNT = 7;

export default function LeaderboardSkeleton() {
  return (
    <VStack align="stretch" gap={4} pt={4} pb={8}>
      <Flex justify="center" align="flex-end" gap={3} pt={2}>
        {PODIUM_HEIGHTS.map((height, index) => (
          <Skeleton
            key={index}
            flex={1}
            maxW="160px"
            height={height}
            borderRadius="xl"
          />
        ))}
      </Flex>

      <VStack align="stretch" gap={2}>
        {Array.from({ length: ROW_COUNT }).map((_, index) => (
          <HStack
            key={index}
            gap={3}
            p={3}
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="lg"
          >
            <Skeleton width="20px" height="16px" />
            <SkeletonCircle size="8" />
            <Stack flex={1} gap={1.5}>
              <Skeleton height="14px" width="55%" />
              <Skeleton height="12px" width="35%" />
            </Stack>
            <Skeleton height="20px" width="72px" borderRadius="full" />
            <Skeleton height="18px" width="36px" />
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
}
