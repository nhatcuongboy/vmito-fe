'use client';

import { Box, Container } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import TopBar from '@/components/ui/TopBar';
import FindSessionList from '@/components/session/FindSessionList';
import { ISession } from '@/lib/api/types';
import { Image } from "@chakra-ui/react"

interface BrowseSessionsClientProps {
  locale: string;
  initialSessions: ISession[];
}

export default function BrowseSessionsClient({
  locale,
  initialSessions,
}: BrowseSessionsClientProps) {
  const t = useTranslations('session');

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <TopBar title={t('findSession')} icon={<Image src="/icons/app-logo.png" h="32px" alt="Logo" />} />
      <Container
        maxW="container.xl"
        pt={{
          base: 'calc(44px + env(safe-area-inset-top) + 24px)',
          md: 'calc(56px + env(safe-area-inset-top) + 24px)',
        }}
        pb="calc(64px + env(safe-area-inset-bottom) + 24px)"
      >
        <FindSessionList initialSessions={initialSessions} />
      </Container>
    </Box>
  );
}
