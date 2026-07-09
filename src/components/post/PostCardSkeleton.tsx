'use client';

import {
  Box,
  Flex,
  HStack,
  Skeleton,
  SkeletonCircle,
  VStack,
} from '@chakra-ui/react';

const repeat = (count: number) => Array.from({ length: count });

export function PostCardSkeleton() {
  return (
    <Box
      as="article"
      bg={{ base: 'white', _dark: 'gray.800' }}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.200' }}
      overflow="hidden"
      boxShadow="sm"
    >
      {/* Header */}
      <Flex align="flex-start" gap={3} px={4} pt={4}>
        <SkeletonCircle size="40px" flexShrink={0} />
        <Box flex={1} minW={0}>
          <Skeleton height="14px" width="35%" borderRadius="md" mb={2} />
          <Skeleton height="12px" width="25%" borderRadius="md" />
        </Box>
      </Flex>

      {/* Content lines */}
      <VStack align="stretch" gap={2} px={4} pt={3}>
        <Skeleton height="14px" width="92%" borderRadius="md" />
        <Skeleton height="14px" width="68%" borderRadius="md" />
      </VStack>

      {/* Image */}
      <Skeleton height="320px" width="100%" mt={3.5} borderRadius="0" />

      {/* Engagement counts */}
      <Flex align="center" justify="space-between" px={4} pt={3.5} pb={2.5}>
        <Skeleton height="14px" width="60px" borderRadius="md" />
        <Skeleton height="14px" width="90px" borderRadius="md" />
      </Flex>

      <Box
        mx={4}
        borderTopWidth="1px"
        borderColor="gray.100"
        _dark={{ borderColor: 'whiteAlpha.100' }}
      />

      {/* Action bar */}
      <HStack gap={1} px={2} py={1.5} pb={2}>
        <Skeleton flex={1} height="38px" borderRadius="lg" />
        <Skeleton flex={1} height="38px" borderRadius="lg" />
        <Skeleton flex={1} height="38px" borderRadius="lg" />
      </HStack>
    </Box>
  );
}

export function NewsfeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <VStack gap={5} align="stretch">
      {repeat(count).map((_, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </VStack>
  );
}
