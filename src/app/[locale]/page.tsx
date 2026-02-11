'use client';

import React, { Suspense } from 'react';
import { Flex, Spinner } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import FindSessionList from '@/components/session/FindSessionList';
import PageLayout from '@/components/layout/PageLayout';
import { Image } from '@chakra-ui/react';

function HomeContent() {
  const t = useTranslations('session');

  return (
    <PageLayout
      title={t('findSession')}
      icon={<Image src="/icons/app-logo.png" h="32px" alt="Logo" />}
      bg="green.50"
      _dark={{ bg: 'gray.900' }}
      pb={8}
    >
      <FindSessionList />
    </PageLayout>
  );
}
export default function HomePage() {
  return (
    <Suspense
      fallback={
        <Flex justify="center" align="center" minH="100vh">
          <Spinner size="xl" color="green.500" />
        </Flex>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
