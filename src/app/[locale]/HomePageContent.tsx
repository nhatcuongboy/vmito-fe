'use client';

import React, { Suspense, useState } from 'react';
import { Flex, Spinner } from '@chakra-ui/react';
import FindSessionList from '@/components/session/FindSessionList';
import SuggestionsList from '@/components/session/SuggestionsList';
import PageLayout from '@/components/layout/PageLayout';
import { Image } from '@chakra-ui/react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslations } from 'next-intl';

type HomeMode = 'browse' | 'auto';

function HomeContent() {
  const [mode, setMode] = useState<HomeMode>('browse');
  const { user } = useAuthStore();
  const tNavigation = useTranslations('navigation');

  return (
    <PageLayout
      title={tNavigation('findSessions')}
      icon={<Image src="/icons/app-logo.png" h="32px" alt="Logo" />}
      bg="green.50"
      _dark={{ bg: 'gray.900' }}
      minH="100vh"
    >
      {mode === 'browse' || !user ? (
        <FindSessionList mode={mode} onModeChange={setMode} />
      ) : (
        <SuggestionsList mode={mode} onModeChange={setMode} />
      )}
    </PageLayout>
  );
}

export default function HomePageContent() {
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
