'use client';

import { Box, Skeleton } from '@chakra-ui/react';
import {
  BOTTOM_TAB_HEIGHT,
  CONTENT_PT_OFFSET,
  TOP_BAR_HEIGHT_MOBILE,
} from '@/constants';

const mapHeight = `calc(100vh - ${TOP_BAR_HEIGHT_MOBILE}px - env(safe-area-inset-top) - ${CONTENT_PT_OFFSET} - ${BOTTOM_TAB_HEIGHT}px - env(safe-area-inset-bottom) - 80px)`;

/** A map-shaped placeholder used while results or the Google Maps SDK load. */
export default function MapLoadingSkeleton() {
  return (
    <Box
      aria-busy="true"
      aria-label="Đang tải bản đồ"
      bg="gray.100"
      border="1px solid"
      borderColor="gray.100"
      borderRadius="2xl"
      boxShadow="xl"
      h={mapHeight}
      minH="300px"
      overflow="hidden"
      position="relative"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
    >
      <Box
        inset={0}
        opacity={0.55}
        position="absolute"
        backgroundImage="linear-gradient(28deg, transparent 47%, var(--chakra-colors-gray-200) 48%, var(--chakra-colors-gray-200) 52%, transparent 53%), linear-gradient(118deg, transparent 46%, var(--chakra-colors-gray-200) 47%, var(--chakra-colors-gray-200) 51%, transparent 52%)"
        backgroundSize="180px 140px, 220px 170px"
        _dark={{ opacity: 0.22 }}
      />
      <Skeleton
        position="absolute"
        top={4}
        left={4}
        h="36px"
        w="92px"
        borderRadius="lg"
      />
      <Skeleton
        position="absolute"
        top={4}
        right={4}
        h="36px"
        w="36px"
        borderRadius="lg"
      />
      <Skeleton
        position="absolute"
        top="30%"
        left="24%"
        boxSize="24px"
        borderRadius="full"
      />
      <Skeleton
        position="absolute"
        top="47%"
        left="57%"
        boxSize="24px"
        borderRadius="full"
      />
      <Skeleton
        position="absolute"
        top="65%"
        right="20%"
        boxSize="24px"
        borderRadius="full"
      />
      <Skeleton
        position="absolute"
        bottom={4}
        right={4}
        h="42px"
        w="42px"
        borderRadius="lg"
      />
    </Box>
  );
}
