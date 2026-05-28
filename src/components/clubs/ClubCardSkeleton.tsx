'use client';

import {
  Box,
  Flex,
  HStack,
  Skeleton,
  SkeletonCircle,
  Stack,
} from '@chakra-ui/react';

interface ClubCardSkeletonProps {
  variant?: 'grid' | 'list';
}

const ClubCardSkeleton = ({ variant = 'grid' }: ClubCardSkeletonProps) => {
  if (variant === 'list') {
    return (
      <Box
        bg="white"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="gray.200"
        overflow="hidden"
      >
        <Skeleton height="140px" width="100%" />
        <Flex px={4} py={4} gap={4} align="center">
          <SkeletonCircle size="52px" />
          <Box flex="1" minW={0}>
            <Skeleton height="16px" width="55%" mb={2} borderRadius="md" />
            <Skeleton height="14px" width="70%" mb={2} borderRadius="md" />
            <Skeleton height="14px" width="45%" borderRadius="md" />
          </Box>
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
      display="flex"
      flexDirection="column"
      height="100%"
    >
      <Skeleton height="140px" width="100%" />
      <Box px={5} pt={5} pb={3}>
        <Flex justify="space-between" align="flex-start" gap={3} mb={3}>
          <Box flex="1" minW={0}>
            <Skeleton height="20px" width="65%" borderRadius="md" />
          </Box>
          <Skeleton height="18px" width="18px" borderRadius="sm" />
        </Flex>
        <Stack gap={2}>
          <Skeleton height="12px" width="90%" borderRadius="md" />
          <Skeleton height="12px" width="70%" borderRadius="md" />
        </Stack>
      </Box>
      <Box h="1px" bg="gray.100" _dark={{ bg: 'gray.700' }} mx={5} />
      <Box px={5} py={4}>
        <Stack gap={3}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Flex key={`club-card-row-${index}`} align="center" gap={2.5}>
              <Skeleton height="32px" width="32px" borderRadius="lg" />
              <Skeleton height="14px" width="70%" borderRadius="md" />
            </Flex>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default ClubCardSkeleton;
