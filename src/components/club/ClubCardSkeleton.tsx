'use client';

import {
  Box,
  Flex,
  HStack,
  Separator,
  Skeleton,
  VStack,
} from '@chakra-ui/react';

export default function ClubCardSkeleton() {
  return (
    <Box
      p={{ base: 4, md: 6 }}
      bg="bg"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderRadius={{ base: 'xl', md: '2xl' }}
      borderWidth="1px"
      borderColor="border"
    >
      {/* Header: title + chevron */}
      <Flex justify="space-between" align="center" mb={{ base: 3, md: 4 }}>
        <HStack gap={2} flex={1} minW={0}>
          <Skeleton height="22px" width="60%" borderRadius="md" />
        </HStack>
        <Skeleton height="18px" width="18px" borderRadius="sm" flexShrink={0} />
      </Flex>

      {/* Role + member count rows */}
      <VStack align="start" gap={{ base: 2, md: 3 }} mb={{ base: 3, md: 4 }}>
        <HStack gap={2}>
          <Skeleton height="16px" width="16px" borderRadius="sm" />
          <Skeleton height="14px" width="80px" borderRadius="md" />
        </HStack>
        <HStack gap={2}>
          <Skeleton height="16px" width="16px" borderRadius="sm" />
          <Skeleton height="14px" width="100px" borderRadius="md" />
        </HStack>
      </VStack>

      <Separator mb={{ base: 3, md: 4 }} />

      {/* Hosted by */}
      <HStack>
        <Skeleton height="12px" width="55px" borderRadius="md" />
        <Skeleton height="12px" width="90px" borderRadius="md" />
      </HStack>
    </Box>
  );
}
