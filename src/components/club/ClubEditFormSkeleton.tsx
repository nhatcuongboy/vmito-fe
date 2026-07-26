'use client';

import { Box, Flex, Skeleton, VStack } from '@chakra-ui/react';

export default function ClubEditFormSkeleton() {
  return (
    <Box
      bg={{ base: 'white', _dark: 'gray.900' }}
      p={{ base: 4, md: 6 }}
      borderRadius="lg"
      shadow="sm"
      borderWidth="1px"
      borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
      maxW="container.md"
      mx="auto"
      aria-label="Loading"
    >
      <VStack gap={6} align="stretch">
        {/* Club Name */}
        <Box>
          <Skeleton height="14px" width="90px" mb={2} borderRadius="md" />
          <Skeleton height="40px" borderRadius="md" />
        </Box>

        {/* Trưởng nhóm */}
        <Box>
          <Skeleton height="14px" width="100px" mb={2} borderRadius="md" />
          <Skeleton height="40px" borderRadius="md" />
        </Box>

        {/* Trình độ */}
        <Box>
          <Skeleton height="14px" width="70px" mb={2} borderRadius="md" />
          <Flex gap={2} wrap="wrap">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                height="32px"
                width="64px"
                borderRadius="full"
              />
            ))}
          </Flex>
        </Box>

        {/* Description */}
        <Box>
          <Skeleton height="14px" width="80px" mb={2} borderRadius="md" />
          <Skeleton height="120px" borderRadius="md" />
        </Box>

        {/* Media editor */}
        <Box>
          <Skeleton height="14px" width="110px" mb={2} borderRadius="md" />
          <Flex gap={3} wrap="wrap">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height="80px" width="80px" borderRadius="lg" />
            ))}
          </Flex>
        </Box>

        {/* Venue schedule */}
        <Box>
          <Skeleton height="14px" width="140px" mb={2} borderRadius="md" />
          <Skeleton height="140px" borderRadius="xl" />
        </Box>

        {/* Submit / cancel buttons */}
        <Flex justify="flex-end" gap={4} mt={4}>
          <Skeleton height="40px" width="100px" borderRadius="md" />
          <Skeleton height="40px" width="120px" borderRadius="md" />
        </Flex>
      </VStack>
    </Box>
  );
}
