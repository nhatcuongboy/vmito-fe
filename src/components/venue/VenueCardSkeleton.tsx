'use client';

import { Box, Flex, Skeleton, Stack } from '@chakra-ui/react';

export default function VenueCardSkeleton() {
  return (
    <Box
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="gray.200"
      overflow="hidden"
    >
      {/* Header Section */}
      <Box px={5} pt={5} pb={3}>
        <Flex justify="space-between" align="flex-start" gap={3} mb={3}>
          <Box flex="1">
            <Skeleton height="24px" width="70%" mb={2} borderRadius="md" />
            <Flex gap={2} mb={2}>
              <Skeleton height="20px" width="80px" borderRadius="md" />
              <Skeleton height="20px" width="100px" borderRadius="md" />
            </Flex>
            <Skeleton height="16px" width="90%" borderRadius="md" />
          </Box>
          <Skeleton height="28px" width="70px" borderRadius="full" />
        </Flex>
      </Box>

      {/* Divider */}
      <Box h="1px" bg="gray.100" _dark={{ bg: 'gray.700' }} mx={5} />

      {/* Info Section */}
      <Box px={5} py={4}>
        <Stack gap={3}>
          {/* Opening hours skeleton */}
          <Flex align="center" gap={2.5}>
            <Skeleton height="40px" width="40px" borderRadius="lg" />
            <Box flex="1">
              <Skeleton height="12px" width="90px" mb={1} borderRadius="md" />
              <Skeleton height="16px" width="60%" borderRadius="md" />
            </Box>
          </Flex>

          {/* Courts skeleton */}
          <Flex align="center" gap={2.5}>
            <Skeleton height="40px" width="40px" borderRadius="lg" />
            <Box flex="1">
              <Skeleton height="12px" width="100px" mb={1} borderRadius="md" />
              <Skeleton height="16px" width="40%" borderRadius="md" />
            </Box>
          </Flex>

          {/* Pricing skeleton */}
          <Flex align="flex-start" gap={2.5}>
            <Skeleton height="40px" width="40px" borderRadius="lg" />
            <Box flex="1">
              <Skeleton height="12px" width="50px" mb={1.5} borderRadius="md" />
              <Stack gap={1.5}>
                <Skeleton height="22px" width="55%" borderRadius="md" />
                <Skeleton height="22px" width="50%" borderRadius="md" />
              </Stack>
            </Box>
          </Flex>
        </Stack>
      </Box>

      {/* Contact Section */}
      <Box h="1px" bg="gray.100" _dark={{ bg: 'gray.700' }} mx={5} />
      <Box px={5} py={3}>
        <Flex gap={3}>
          <Skeleton height="36px" flex="1" borderRadius="lg" />
          <Skeleton height="36px" flex="1" borderRadius="lg" />
        </Flex>
      </Box>
    </Box>
  );
}
