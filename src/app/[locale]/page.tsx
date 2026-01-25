'use client';

import { Box, Container, Flex } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import TopBar from '@/components/ui/TopBar';
import FindSessionList from '@/components/session/FindSessionList';
import Footer from '@/components/layout/Footer';

export default function HomePage() {
  const t = useTranslations('session');
  const common = useTranslations('common');

  return (
    <Flex direction="column" minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <TopBar title={common('appName')} showBackButton={false} />
      <Container
        maxW="container.xl"
        pt={{
          base: 'calc(44px + env(safe-area-inset-top) + 1rem)',
          md: 'calc(56px + env(safe-area-inset-top) + 2rem)',
        }}
        pb={8}
        flex="1"
      >
        <FindSessionList />
      </Container>
      <Footer />
    </Flex>
  );
}
