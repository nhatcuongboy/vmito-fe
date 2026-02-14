'use client';

import { Box, Flex, Stack, Skeleton, SkeletonCircle } from '@chakra-ui/react';
import { ViewMode } from '@/stores/useSessionFilterStore';

interface SessionCardSkeletonProps {
  showOnlyOne?: boolean;
  variant?: ViewMode;
}

export const SessionCardSkeleton: React.FC<SessionCardSkeletonProps> = ({
  showOnlyOne = false,
  variant = 'full',
}) => {
  if (variant === 'compact') {
    return (
      <Flex
        direction="column"
        h="100%"
        gap={2}
        borderWidth="1px"
        borderLeftWidth="4px"
        borderLeftColor="gray.200"
        borderRadius="lg"
        overflow="hidden"
        bg="bg"
        borderColor="border"
        p={3}
      >
        <Flex justify="space-between" align="flex-start">
          <Skeleton height="22px" width="60%" borderRadius="md" />
          <Skeleton height="20px" width="60px" borderRadius="full" />
        </Flex>
        <Flex align="center" gap={2}>
          <SkeletonCircle size="4" />
          <Skeleton height="16px" width="150px" borderRadius="sm" />
        </Flex>
        <Flex gap={3}>
          <Skeleton height="16px" width="80px" borderRadius="sm" />
          <Skeleton height="16px" width="80px" borderRadius="sm" />
          <Skeleton height="16px" width="40px" borderRadius="sm" />
        </Flex>
        <Flex gap={1}>
          <Skeleton height="20px" width="50px" borderRadius="full" />
          <Skeleton height="20px" width="50px" borderRadius="full" />
        </Flex>
        <Flex justify="space-between" align="center" mt="auto" pt={2}>
          <Skeleton height="18px" width="80px" borderRadius="sm" />
          <Skeleton height="28px" width="80px" borderRadius="md" />
        </Flex>
      </Flex>
    );
  }

  if (showOnlyOne) {
    return (
      <Box
        borderWidth="1px"
        borderRadius="xl"
        overflow="hidden"
        bg="white"
        _dark={{ bg: 'gray.800' }}
        shadow="sm"
        p={4}
        width="100%"
        maxW="400px"
      >
        <Skeleton height="160px" borderRadius="lg" mb={4} />
        <Skeleton height="24px" width="70%" mb={2} />
        <Skeleton height="16px" width="40%" mb={4} />
        <Flex gap={2}>
          <Skeleton height="32px" width="60px" borderRadius="full" />
          <Skeleton height="32px" width="60px" borderRadius="full" />
        </Flex>
      </Box>
    );
  }

  return (
    <Flex
      direction="column"
      h="100%"
      gap={4}
      borderWidth="1px"
      borderLeftWidth="4px"
      borderLeftColor="gray.200"
      borderRadius="lg"
      overflow="hidden"
      bg="bg"
      borderColor="border"
      p={6}
    >
      {/* Header - Title and Status Badge */}
      <Flex justify="space-between" align="flex-start">
        <Skeleton height="28px" width="60%" borderRadius="md" />
        <Skeleton height="24px" width="80px" borderRadius="md" />
      </Flex>

      {/* Content Stack */}
      <Stack gap={3} flex={1}>
        {/* Host */}
        <Flex align="center" gap={2}>
          <SkeletonCircle size="5" />
          <Skeleton height="20px" width="150px" borderRadius="sm" />
        </Flex>

        {/* Venue/Location */}
        <Flex align="center" gap={2}>
          <SkeletonCircle size="5" />
          <Skeleton height="20px" width="200px" borderRadius="sm" />
        </Flex>

        {/* Date */}
        <Flex align="center" gap={2}>
          <SkeletonCircle size="5" />
          <Skeleton height="20px" width="180px" borderRadius="sm" />
        </Flex>

        {/* Time */}
        <Flex align="center" gap={2}>
          <SkeletonCircle size="5" />
          <Skeleton height="20px" width="120px" borderRadius="sm" />
        </Flex>

        {/* Courts Available */}
        <Flex align="center" gap={2}>
          <SkeletonCircle size="5" />
          <Skeleton height="20px" width="140px" borderRadius="sm" />
        </Flex>

        {/* Players */}
        <Flex align="center" gap={2}>
          <SkeletonCircle size="5" />
          <Skeleton height="20px" width="100px" borderRadius="sm" />
        </Flex>

        {/* Skill Levels */}
        <Flex align="center" gap={2}>
          <SkeletonCircle size="5" />
          <Flex gap={1}>
            <Skeleton height="24px" width="50px" borderRadius="md" />
            <Skeleton height="24px" width="50px" borderRadius="md" />
          </Flex>
        </Flex>

        {/* Fee */}
        <Flex align="center" gap={2}>
          <SkeletonCircle size="5" />
          <Skeleton height="20px" width="130px" borderRadius="sm" />
        </Flex>

        {/* Description */}
        <Box>
          <Skeleton height="16px" width="100%" mb={1} borderRadius="sm" />
          <Skeleton height="16px" width="80%" borderRadius="sm" />
        </Box>
      </Stack>

      {/* Action Buttons */}
      <Flex mt={4} gap={2} justify="flex-end">
        <Skeleton height="32px" width="80px" borderRadius="md" />
        <Skeleton height="32px" width="100px" borderRadius="md" />
      </Flex>
    </Flex>
  );
};
