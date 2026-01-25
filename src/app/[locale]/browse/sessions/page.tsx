'use client';

import { Box, Container } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import TopBar from '@/components/ui/TopBar';
import FindSessionList from '@/components/session/FindSessionList';

export default function FindSessionPage() {
  const t = useTranslations('session');

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <TopBar title={t('findSession')} />
      <Container
        maxW="container.xl"
        pt={{ base: 'calc(44px + env(safe-area-inset-top) + 1rem)', md: 'calc(56px + env(safe-area-inset-top) + 2rem)' }}
        pb={8}
      >
        <FindSessionList />
      </Container>
    </Box>
  );
}
