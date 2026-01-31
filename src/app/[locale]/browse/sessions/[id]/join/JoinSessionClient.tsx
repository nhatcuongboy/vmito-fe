'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Box, Container, Heading, Spinner, Center } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import TopBar from '@/components/ui/TopBar';
import { SessionService } from '@/lib/api/session.service';
import { ISession } from '@/lib/api/types';
import JoinSessionForm from '@/components/session/JoinSessionForm';
import { useJoinSession } from '@/components/session/useJoinSession';
import { useRouter } from '@/i18n/config';
import { CONTAINER_PX, CONTENT_PT_OFFSET, TOP_BAR_HEIGHT_MOBILE, TOP_BAR_HEIGHT_DESKTOP } from '@/constants';

interface JoinSessionClientProps {
  id: string;
}

export default function JoinSessionClient({ id }: JoinSessionClientProps) {
  const t = useTranslations('session');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [session, setSession] = useState<ISession | null>(null);
  const [fetching, setFetching] = useState(true);

  const {
    players,
    loading: submitting,
    errors,
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
      router.push('/');
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
        <TopBar showBackButton={true} backHref="/" title={t('joinSession')} />
        <Center pt={20}>
          <Spinner size="xl" color="blue.500" />
        </Center>
      </Box>
    );
  }

  if (!session) {
    return (
      <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
        <TopBar showBackButton={true} backHref="/" title={t('joinSession')} />
        <Container maxW="container.md" px={CONTAINER_PX} pt={24}>
          <Box p={6} bg={{ base: 'white', _dark: 'gray.800' }} borderRadius="lg" shadow="sm" textAlign="center">
            <Heading size="md" mb={2}>{t('loadingError')}</Heading>
            <Button onClick={() => router.push('/')}>
              {tCommon('back')}
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <TopBar showBackButton={true} backHref="/" title={`${t('joinSession')}: ${session.name}`} />

      <Container
        maxW="container.md"
        px={CONTAINER_PX}
        pt={{
          base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
          md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
        }}
        pb={8}
      >
        <Box
          bg={{ base: 'white', _dark: 'gray.800' }}
          p={6}
          borderRadius="lg"
          boxShadow="sm"
          borderWidth="1px"
          borderColor="border"
        >
          <JoinSessionForm
            session={session}
            players={players}
            errors={errors}
            onAddPlayer={handleAddPlayer}
            onRemovePlayer={handleRemovePlayer}
            onUpdatePlayer={handleUpdatePlayer}
          />

          <Box mt={6} pt={6} borderTopWidth="1px" borderColor="border">
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
