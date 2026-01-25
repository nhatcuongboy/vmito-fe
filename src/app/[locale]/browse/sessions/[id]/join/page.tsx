'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Box, Container, Heading, Spinner, Text, Center } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import TopBar from '@/components/ui/TopBar';
import { SessionService } from '@/lib/api/session.service';
import { ISession } from '@/lib/api/types';
import JoinSessionForm from '@/components/session/JoinSessionForm';
import { useJoinSession } from '@/components/session/useJoinSession';
import { useRouter } from '@/i18n/config';

interface PageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default function JoinSessionPage({ params: { id } }: PageProps) {
  const t = useTranslations('session');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [session, setSession] = useState<ISession | null>(null);
  const [fetching, setFetching] = useState(true);

  const {
    players,
    loading: submitting,
    handleAddPlayer,
    handleRemovePlayer,
    handleUpdatePlayer,
    handleSubmit,
  } = useJoinSession({
    session,
    isOpen: true,
    onSuccess: () => {
      // Refresh or redirect
      // Assuming we want to go back to session details or the list?
      // For now, let's go back to the browse list
      router.push('/browse/sessions');
    },
  });

  useEffect(() => {
    async function fetchSession() {
      try {
        setFetching(true);
        const data = await SessionService.getSession(id);
        setSession(data);
      } catch (error) {
        console.error('Failed to fetch session', error);
      } finally {
        setFetching(false);
      }
    }

    if (id) {
      fetchSession();
    }
  }, [id]);

  if (fetching) {
    return (
      <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
         <TopBar showBackButton={true} backHref="/browse/sessions" title={t('joinSession')} />
        <Center pt={20}>
          <Spinner size="xl" color="blue.500" />
        </Center>
      </Box>
    );
  }

  if (!session) {
    return (
      <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
        <TopBar showBackButton={true} backHref="/browse/sessions" title={t('joinSession')} />
        <Container maxW="container.md" pt={24}>
          <Box p={6} bg="white" borderRadius="lg" shadow="sm" textAlign="center">
            <Heading size="md" mb={2}>{t('loadingError')}</Heading>
             <Button onClick={() => router.push('/browse/sessions')}>
              {tCommon('back')}
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <TopBar showBackButton={true} backHref="/browse/sessions" title={`${t('joinSession')}: ${session.name}`} />
      
      <Container
        maxW="container.md"
        pt={{
          base: 'calc(44px + env(safe-area-inset-top) + 1rem)',
          md: 'calc(56px + env(safe-area-inset-top) + 2rem)',
        }}
        pb={8}
      >
        <Box
          bg="white"
          _dark={{ bg: 'gray.800' }}
          p={6}
          borderRadius="lg"
          boxShadow="sm"
          borderWidth="1px"
        >
          <JoinSessionForm
            session={session}
            players={players}
            onAddPlayer={handleAddPlayer}
            onRemovePlayer={handleRemovePlayer}
            onUpdatePlayer={handleUpdatePlayer}
          />
          
          <Box mt={6} pt={6} borderTopWidth="1px" borderColor="gray.100">
             <Button
                colorPalette="blue"
                width="full"
                size="lg"
                onClick={handleSubmit}
                loading={submitting}
              >
                {t('submitRegistration')}
              </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
