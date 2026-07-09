'use client';

import {
  Box,
  Flex,
  Grid,
  Skeleton,
  SkeletonCircle,
  Stack,
  Separator,
} from '@chakra-ui/react';
import React from 'react';

export const SessionDetailSkeleton = () => {
  return (
    <Box
      maxW={{ base: '800px', md: '1200px' }}
      mx="auto"
      w="full"
      px={{ base: 0, md: 4 }}
    >
      <Grid
        templateColumns={{ base: '1fr', md: '65fr 35fr' }}
        gap={{ md: 8 }}
        alignItems="start"
      >
        {/* Left column */}
        <Box minW={0}>
          {/* Hero Image Skeleton */}
          <Box
            position="relative"
            w="full"
            h={{ base: 'clamp(170px, 29vh, 235px)', md: '350px' }}
            overflow="hidden"
            bg="gray.100"
            _dark={{ bg: 'gray.850' }}
          >
            <Skeleton height="100%" width="100%" />
          </Box>

          {/* Body Section Skeleton */}
          <Box
            bg="white"
            _dark={{ bg: 'gray.800' }}
            borderTopRadius="2xl"
            borderBottomRadius="2xl"
            mt="-16px"
            position="relative"
            zIndex={1}
            px={{ base: 5, md: 8 }}
            pt={6}
            pb={6}
          >
            {/* Session Name */}
            <Skeleton height="28px" width="70%" mb={3} borderRadius="md" />

            {/* Time & Date */}
            <Flex gap={2} mb={3} align="center">
              <Skeleton height="20px" width="120px" borderRadius="md" />
              <Box color="gray.350">|</Box>
              <Skeleton height="20px" width="150px" borderRadius="md" />
            </Flex>

            {/* Location */}
            <Skeleton height="20px" width="50%" mb={4} borderRadius="md" />

            <Separator my={4} />

            {/* Host Section */}
            <Flex align="center" gap={4} py={2}>
              <SkeletonCircle size="12" />
              <Box flex={1}>
                <Skeleton
                  height="20px"
                  width="160px"
                  mb={2}
                  borderRadius="md"
                />
                <Skeleton height="16px" width="80px" borderRadius="md" />
              </Box>
            </Flex>

            <Separator my={4} />

            {/* Description / Note */}
            <Box
              bg="gray.50"
              _dark={{ bg: 'gray.700' }}
              borderRadius="xl"
              p={5}
            >
              <Stack gap={2.5}>
                <Skeleton height="16px" width="100%" borderRadius="sm" />
                <Skeleton height="16px" width="90%" borderRadius="sm" />
                <Skeleton height="16px" width="80%" borderRadius="sm" />
              </Stack>
            </Box>

            <Separator my={4} />

            {/* Participant List Title */}
            <Skeleton height="24px" width="180px" mb={4} borderRadius="md" />

            {/* Participants Grid (mock 8 avatar items) */}
            <Grid
              templateColumns="repeat(auto-fill, minmax(64px, 1fr))"
              gap={4}
              py={2}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <Flex key={i} direction="column" align="center" gap={2}>
                  <SkeletonCircle size="12" />
                  <Skeleton height="14px" width="48px" borderRadius="sm" />
                </Flex>
              ))}
            </Grid>

            {/* Session Details Grid (Mobile only) */}
            <Box display={{ base: 'block', md: 'none' }} mt={6}>
              <Separator my={4} />
              <Grid templateColumns="1fr 1fr" gap={4}>
                <Flex align="center" gap={2}>
                  <SkeletonCircle size="5" />
                  <Skeleton height="16px" width="80px" borderRadius="sm" />
                </Flex>
                <Flex align="center" gap={2}>
                  <SkeletonCircle size="5" />
                  <Skeleton height="16px" width="85px" borderRadius="sm" />
                </Flex>
                <Flex align="center" gap={2}>
                  <SkeletonCircle size="5" />
                  <Skeleton height="16px" width="75px" borderRadius="sm" />
                </Flex>
                <Flex align="center" gap={2}>
                  <SkeletonCircle size="5" />
                  <Skeleton height="16px" width="90px" borderRadius="sm" />
                </Flex>
              </Grid>
            </Box>
          </Box>
        </Box>

        {/* Right column — desktop sidebar only */}
        <Box display={{ base: 'none', md: 'block' }}>
          <Box position="sticky" top="100px">
            {/* Sticky Card Skeleton */}
            <Box
              bg="white"
              borderRadius="2xl"
              borderWidth="1px"
              borderColor="gray.200"
              _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
              overflow="hidden"
            >
              {/* Fee header */}
              <Box
                px={5}
                py={4}
                bg="green.50"
                borderBottomWidth="1px"
                borderBottomColor="gray.100"
                _dark={{ bg: 'gray.750', borderBottomColor: 'gray.700' }}
              >
                <Flex align="center" gap={2}>
                  <SkeletonCircle size="5" />
                  <Skeleton height="28px" width="120px" borderRadius="md" />
                </Flex>
              </Box>

              {/* Info rows */}
              <Box px={5} py={4}>
                <Stack gap={4}>
                  <Flex align="center" gap={3}>
                    <SkeletonCircle size="4" />
                    <Skeleton height="18px" width="140px" borderRadius="sm" />
                  </Flex>
                  <Flex align="center" gap={3}>
                    <SkeletonCircle size="4" />
                    <Skeleton height="18px" width="160px" borderRadius="sm" />
                  </Flex>
                  <Flex align="center" gap={3}>
                    <SkeletonCircle size="4" />
                    <Skeleton height="18px" width="200px" borderRadius="sm" />
                  </Flex>
                  <Separator />
                  <Flex align="center" gap={3}>
                    <SkeletonCircle size="4" />
                    <Skeleton height="18px" width="100px" borderRadius="sm" />
                  </Flex>
                  <Flex align="center" gap={3}>
                    <SkeletonCircle size="4" />
                    <Skeleton height="18px" width="120px" borderRadius="sm" />
                  </Flex>
                  <Flex align="center" gap={3}>
                    <SkeletonCircle size="4" />
                    <Skeleton height="18px" width="80px" borderRadius="sm" />
                  </Flex>
                  <Separator />
                  {/* CTA Button */}
                  <Skeleton height="40px" width="100%" borderRadius="lg" />
                </Stack>
              </Box>
            </Box>
          </Box>
        </Box>
      </Grid>
    </Box>
  );
};

export default SessionDetailSkeleton;
