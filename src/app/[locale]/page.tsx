'use client';

import React, { Suspense, useState } from 'react';
import { Box, Flex, Icon, Spinner, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import FindSessionList from '@/components/session/FindSessionList';
import SuggestionsList from '@/components/session/SuggestionsList';
import PageLayout from '@/components/layout/PageLayout';
import { Image } from '@chakra-ui/react';
import { Search, Sparkles } from 'lucide-react';

type HomeMode = 'browse' | 'auto';

function ModeFloatingButton({
  mode,
  onChange,
}: {
  mode: HomeMode;
  onChange: (mode: HomeMode) => void;
}) {
  const t = useTranslations('suggestions');
  const nextMode = mode === 'browse' ? 'auto' : 'browse';

  return (
    <Box position="fixed" bottom="90px" right="4" zIndex={1000}>
      <Box
        as="button"
        display="flex"
        alignItems="center"
        gap={2}
        py={2.5}
        px={4}
        borderRadius="full"
        cursor="pointer"
        transition="all 0.2s"
        boxShadow="0 4px 14px rgba(0, 0, 0, 0.15)"
        _hover={{ transform: 'scale(1.05)' }}
        _active={{ transform: 'scale(0.95)' }}
        bg={mode === 'browse' ? 'yellow.400' : 'white'}
        color={mode === 'browse' ? 'yellow.900' : 'gray.700'}
        _dark={{
          bg: mode === 'browse' ? 'yellow.500' : 'gray.700',
          color: mode === 'browse' ? 'yellow.900' : 'gray.100',
        }}
        onClick={() => onChange(nextMode)}
      >
        <Icon as={mode === 'browse' ? Sparkles : Search} boxSize={5} />
        <Text fontSize="sm" fontWeight="bold" whiteSpace="nowrap">
          {mode === 'browse' ? t('modeAuto') : t('modeBrowse')}
        </Text>
      </Box>
    </Box>
  );
}

function HomeContent() {
  const t = useTranslations('session');
  const [mode, setMode] = useState<HomeMode>('browse');

  return (
    <PageLayout
      title={t('findSession')}
      icon={<Image src="/icons/app-logo.png" h="32px" alt="Logo" />}
      bg="green.50"
      _dark={{ bg: 'gray.900' }}
    >
      {mode === 'browse' ? <FindSessionList /> : <SuggestionsList />}
      <ModeFloatingButton mode={mode} onChange={setMode} />
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
