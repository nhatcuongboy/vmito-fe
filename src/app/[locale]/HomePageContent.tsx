'use client';

import React, { Suspense, useState } from 'react';
import { Flex, Spinner } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import FindSessionList from '@/components/session/FindSessionList';
import SuggestionsList from '@/components/session/SuggestionsList';
import PageLayout from '@/components/layout/PageLayout';
import { Image } from '@chakra-ui/react';
import { useAuthStore } from '@/stores/useAuthStore';
import QuickCreateFAB from '@/components/session/QuickCreateFAB';

type HomeMode = 'browse' | 'auto';

function HomeContent() {
  const t = useTranslations('session');
  const [mode, setMode] = useState<HomeMode>('browse');
  const { user } = useAuthStore();

  return (
    <PageLayout
      title={t('findSession')}
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
      <QuickCreateFAB bottom="90px" />
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
