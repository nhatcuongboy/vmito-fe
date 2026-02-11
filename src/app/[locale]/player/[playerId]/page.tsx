'use client';

import PlayerSessionView from '@/components/session/PlayerSessionView';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useTranslations } from 'next-intl';

function GuestPlayerContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const t = useTranslations('pages.join.status');

  const playerId = params.playerId as string;
  const code = searchParams.get('code');

  if (!code) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.50"
      >
        <VStack gap={4} textAlign="center" p={6}>
          <Text fontSize="xl" color="red.500" fontWeight="bold">
            {t('errors.missingJoinCode')}
          </Text>
          <Text color="gray.600">{t('errors.missingJoinCodeDescription')}</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <PlayerSessionView
      mode="guest"
      playerId={playerId}
      joinCode={code}
      errorRedirectPath="/join-by-code"
    />
  );
}

export default function GuestPlayerPage() {
  return (
    <Suspense
      fallback={
        <Box
          minH="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="gray.50"
        >
          <Spinner size="xl" color="green.500" />
        </Box>
      }
    >
      <GuestPlayerContent />
    </Suspense>
  );
}
