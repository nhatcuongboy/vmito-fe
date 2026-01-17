'use client';

import { Box, Container, Heading } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import TopBar from '@/components/ui/TopBar';
import FindSessionList from '@/components/session/FindSessionList';

export default function FindSessionPage() {
  const t = useTranslations('session');

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <TopBar />
      <Container maxW="container.xl" py={8}>
        <Heading size="lg" mb={6}>
          {t('findSession')}
        </Heading>
        <FindSessionList />
      </Container>
    </Box>
  );
}
