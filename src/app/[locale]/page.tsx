'use client';

import { Box, Container, Flex } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import TopBar from '@/components/ui/TopBar';
import FindSessionList from '@/components/session/FindSessionList';
import Footer from '@/components/layout/Footer';
import { Image } from "@chakra-ui/react"
import PageHeader from '@/components/ui/PageHeader';

export default function HomePage() {
  const t = useTranslations('session');
  const common = useTranslations('common');

  return (
    <Flex direction="column" minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <TopBar
        title={common('appName')}
        icon={<Image src="/icons/app-logo.png" h="32px" alt="Logo" />}
      />
      <Container
        maxW="container.xl"
        pt={{
          base: 'calc(44px + env(safe-area-inset-top) + 1rem)',
          md: 'calc(56px + env(safe-area-inset-top) + 2rem)',
        }}
        pb={8}
        flex="1"
      >
        <PageHeader title={t('findSession')} />
        <FindSessionList />
      </Container>
      <Footer />
    </Flex>
  );
}
