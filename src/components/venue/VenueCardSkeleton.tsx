'use client';

import { Box, Flex, Skeleton, SkeletonCircle, Stack } from '@chakra-ui/react';

interface VenueCardSkeletonProps {
  variant?: 'grid' | 'list';
}

export default function VenueCardSkeleton({
  variant = 'grid',
}: VenueCardSkeletonProps) {
  if (variant === 'list') {
    return (
      <Box
        bg="white"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="gray.200"
        overflow="hidden"
        width="100%"
      >
        {/* Matches the list card's 140px cover and compact information row. */}
        <Skeleton height="140px" width="100%" />
        <Flex px={4} py={4} gap={4} align="center">
          <SkeletonCircle size="52px" flexShrink={0} />
          <Box flex="1" minW={0}>
            <Skeleton height="20px" width="55%" mb={2} borderRadius="md" />
            <Skeleton height="14px" width="90%" mb={1.5} borderRadius="md" />
            <Skeleton height="14px" width="72%" mb={2} borderRadius="md" />
            <Skeleton height="14px" width="42%" borderRadius="md" />
          </Box>
          <Skeleton height="20px" width="20px" borderRadius="sm" />
        </Flex>
      </Box>
    );
  }

  return (
    <Box
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="gray.200"
      overflow="hidden"
      width="100%"
      display="flex"
      flexDirection="column"
      h="100%"
    >
      {/* Matches the grid card's fixed cover image. */}
      <Skeleton height="140px" width="100%" flexShrink={0} />

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
        <Flex gap={2} justify="flex-end">
          <Skeleton height="36px" width="36px" borderRadius="lg" />
          <Skeleton height="36px" width="36px" borderRadius="lg" />
          <Skeleton height="36px" width="36px" borderRadius="lg" />
        </Flex>
      </Box>

      {/* Grid card action footer. */}
      <Box h="1px" bg="gray.100" _dark={{ bg: 'gray.700' }} mx={5} />
      <Box px={5} py={4}>
        <Flex justify="flex-end">
          <Skeleton height="40px" width="208px" borderRadius="md" />
        </Flex>
      </Box>
    </Box>
  );
}
