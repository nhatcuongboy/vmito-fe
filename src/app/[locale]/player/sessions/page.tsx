'use client';

import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { PlayerService } from '@/lib/api/player.service';
import { ISession, UserRole } from '@/lib/api/types';
import { Box, Container, Grid, Heading, Spinner, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import SessionCard from '@/components/session/SessionCard';
import { useAuthStore } from '@/stores/useAuthStore';
import TopBar from '@/components/ui/TopBar';
import { Flex } from '@chakra-ui/react';

export default function PlayerSessionsPage() {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const tSession = useTranslations('session');

  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlayerSessions() {
      try {
        setLoading(true);
        const sessionData = await PlayerService.getMySessions();
        setSessions(sessionData);
      } catch (err) {
        console.error('Error fetching player sessions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlayerSessions();
  }, []);

  const joinedSessions = sessions.filter((session) => session.hostId !== user?.id);

  return (
    <ProtectedRouteGuard
      requiredRole={[UserRole.PLAYER, UserRole.HOST, UserRole.ADMIN]}
    >
      <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
        <TopBar showBackButton={false} title={t('joined')} />

        <Container
          maxW="container.xl"
          pt={{
            base: 'calc(44px + env(safe-area-inset-top) + 24px)',
            md: 'calc(56px + env(safe-area-inset-top) + 24px)',
          }}
          pb="calc(64px + env(safe-area-inset-bottom) + 24px)"
        >
          {loading ? (
            <Flex justify="center" align="center" minH="200px">
              <Spinner size="xl" color="blue.500" />
            </Flex>
          ) : joinedSessions.length === 0 ? (
            <Box textAlign="center" py={10}>
              <Heading size="md" mb={2}>
                {tSession('noSessionsFound')}
              </Heading>
              <Text color="gray.500">{tSession('noSessionsDescription')}</Text>
            </Box>
          ) : (
            <Grid
              templateColumns={{
                base: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              }}
              gap={6}
            >
              {joinedSessions.map((session) => (
                <SessionCard key={session.id} session={session} mode="view" />
              ))}
            </Grid>
          )}
        </Container>
      </Box>
    </ProtectedRouteGuard>
  );
}

