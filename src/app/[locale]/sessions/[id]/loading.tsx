'use client';

import { Box } from '@chakra-ui/react';
import PageWrapper from '@/components/layout/PageWrapper';
import TopBar from '@/components/ui/TopBar';
import SessionDetailSkeleton from '@/components/session/SessionDetailSkeleton';
import { TOP_BAR_HEIGHT_DESKTOP } from '@/constants';

export default function SessionDetailLoading() {
  return (
    <PageWrapper
      bg={{ base: 'green.50', md: 'gray.50' }}
      _dark={{ bg: { base: 'gray.900', md: 'gray.950' } }}
    >
      {/* Desktop-only top bar */}
      <Box display={{ base: 'none', md: 'block' }}>
        <TopBar showBackButton={false} />
      </Box>
      <Box
        pt={{
          md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
        }}
      >
        <SessionDetailSkeleton />
      </Box>
    </PageWrapper>
  );
}
