'use client';

import React, { Suspense } from 'react';
import { Flex, Spinner } from '@chakra-ui/react';
import FindSessionList from '@/components/session/FindSessionList';
import dynamic from 'next/dynamic';

// Only shown to logged-in users who switch to "auto" mode — keep it out of the
// initial bundle for the default browse view
const SuggestionsList = dynamic(
  () => import('@/components/session/SuggestionsList'),
  {
    ssr: false,
    loading: () => (
      <Flex justify="center" align="center" minH="40vh">
        <Spinner size="xl" color="green.500" />
      </Flex>
    ),
  }
);
import PageLayout from '@/components/layout/PageLayout';
import { Image } from '@chakra-ui/react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { ISession } from '@/lib/api/types';

type HomeMode = 'browse' | 'auto';

interface HomeContentProps {
  initialSessions?: ISession[];
}

function HomeContent({ initialSessions }: HomeContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const tNavigation = useTranslations('navigation');

  // Get mode from URL, default to 'browse', validate value
  const urlMode = searchParams.get('mode');
  const mode: HomeMode = user && urlMode === 'auto' ? 'auto' : 'browse';

  const handleModeChange = (newMode: HomeMode) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newMode === 'browse') {
      // Remove mode param when switching to browse (default)
      params.delete('mode');
    } else {
      params.set('mode', newMode);
    }

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(newUrl);
  };

  return (
    <PageLayout
      title={tNavigation('findSessions')}
      icon={
        <Image
          src="/icons/app-logo-96.png"
          h="32px"
          w="32px"
          alt="Logo"
          loading="eager"
          fetchPriority="high"
        />
      }
      bg="green.50"
      _dark={{ bg: 'gray.900' }}
      minH="100vh"
    >
      {mode === 'browse' || !user ? (
        <FindSessionList
          initialSessions={initialSessions}
          mode={mode}
          onModeChange={handleModeChange}
        />
      ) : (
        <SuggestionsList mode={mode} onModeChange={handleModeChange} />
      )}
    </PageLayout>
  );
}

export default function HomePageContent({ initialSessions }: HomeContentProps) {
  return (
    <Suspense
      fallback={
        <Flex justify="center" align="center" minH="100vh">
          <Spinner size="xl" color="green.500" />
        </Flex>
      }
    >
      <HomeContent initialSessions={initialSessions} />
    </Suspense>
  );
}
