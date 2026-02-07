'use client';

import React from 'react';
import { Box, Container } from '@chakra-ui/react';
import TopBar from '@/components/ui/TopBar';
import VenueSearchList from '@/components/venue/VenueSearchList';
import Footer from '@/components/layout/Footer';
import PageWrapper from '@/components/layout/PageWrapper';
import {
  CONTAINER_PX,
  CONTENT_PT_OFFSET,
  TOP_BAR_HEIGHT_MOBILE,
  TOP_BAR_HEIGHT_DESKTOP,
} from '@/constants';
import { MapPin } from 'lucide-react';

export default function BrowseVenuesPage() {
  return (
    <PageWrapper
      display="flex"
      flexDirection="column"
      bg="gray.50"
      _dark={{ bg: 'gray.900' }}
    >
      <TopBar title="Tìm sân cầu lông" icon={<MapPin size={24} />} />
      <Container
        maxW="container.xl"
        px={CONTAINER_PX}
        pt={{
          base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
          md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
        }}
        pb={8}
        flex="1"
      >
        <VenueSearchList />
      </Container>
      <Footer />
    </PageWrapper>
  );
}
