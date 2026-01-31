'use client';

import { Box, Flex, Stack, Skeleton, SkeletonCircle } from '@chakra-ui/react';

export const SessionCardSkeleton = () => {
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
