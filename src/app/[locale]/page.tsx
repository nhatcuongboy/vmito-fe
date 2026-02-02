'use client';

import React, { Suspense } from 'react';
import { Box, Container, Flex, Spinner } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import TopBar from '@/components/ui/TopBar';
import FindSessionList from '@/components/session/FindSessionList';
import Footer from '@/components/layout/Footer';
import PageWrapper from '@/components/layout/PageWrapper';
import { Image } from '@chakra-ui/react';
import {
  CONTAINER_PX,
  CONTENT_PT_OFFSET,
  TOP_BAR_HEIGHT_MOBILE,
  TOP_BAR_HEIGHT_DESKTOP,
} from '@/constants';

function HomeContent() {
  const t = useTranslations('session');

  return (
    <PageWrapper
      display="flex"
      flexDirection="column"
      bg="gray.50"
      _dark={{ bg: 'gray.900' }}
    >
      <TopBar
        title={t('findSession')}
        icon={<Image src="/icons/app-logo.png" h="32px" alt="Logo" />}
      />
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
        {/* <PageHeader title={t('findSession')} /> */}
        <FindSessionList />
      </Container>
      <Footer />
    </PageWrapper>
  );
}
export default function HomePage() {
  return (
    <Suspense
      fallback={
        <Flex justify="center" align="center" minH="100vh">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
