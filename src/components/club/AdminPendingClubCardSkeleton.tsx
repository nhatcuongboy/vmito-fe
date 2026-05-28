'use client';

import { Box, Flex, HStack, Skeleton, VStack } from '@chakra-ui/react';

export default function AdminPendingClubCardSkeleton() {
  return (
    <Box
      p={6}
      bg="bg"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="border"
    >
      <Flex gap={4}>
        {/* Club image / avatar */}
        <Skeleton w="100px" h="100px" borderRadius="lg" flexShrink={0} />

        {/* Club details */}
        <VStack align="start" flex={1} gap={2}>
          <HStack justify="space-between" w="full">
            <Skeleton height="22px" width="55%" borderRadius="md" />
            <Skeleton height="20px" width="70px" borderRadius="full" />
          </HStack>
          {/* Location */}
          <HStack gap={1.5}>
            <Skeleton height="14px" width="14px" borderRadius="sm" />
            <Skeleton height="14px" width="120px" borderRadius="md" />
          </HStack>
          {/* Description */}
          <Skeleton height="14px" width="90%" borderRadius="md" />
          <Skeleton height="14px" width="70%" borderRadius="md" />
          {/* Hosted by */}
          <HStack pt={1}>
            <Skeleton height="12px" width="55px" borderRadius="md" />
            <Skeleton height="12px" width="80px" borderRadius="md" />
          </HStack>
        </VStack>
      </Flex>

      {/* Action buttons */}
      <Flex mt={6} gap={3}>
        <Skeleton height="40px" flex={1} borderRadius="md" />
        <Skeleton height="40px" flex={1} borderRadius="md" />
      </Flex>
    </Box>
  );
}
