'use client';

import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { PlayerService } from '@/lib/api/player.service';
import { ISession, UserRole } from '@/lib/api/types';
import { Box, Container, Grid, Heading, Spinner, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import SessionCard from '@/components/session/SessionCard';
import TopBar from '@/components/ui/TopBar';

export default function PlayerSessionsPage() {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const tSession = useTranslations('session');

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

  return (
    <ProtectedRouteGuard
      requiredRole={[UserRole.PLAYER, UserRole.HOST, UserRole.ADMIN]}
    >
      <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }} pb="80px">
        <TopBar showBackButton={false} title={t('mySessions')} />

        <Container maxW="container.xl" py={6} mt="64px">
          {loading ? (
            <Flex justify="center" align="center" minH="200px">
              <Spinner size="xl" color="blue.500" />
            </Flex>
          ) : sessions.length === 0 ? (
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
              {sessions.map((session) => (
                <SessionCard key={session.id} session={session} mode="view" />
              ))}
            </Grid>
          )}
        </Container>
      </Box>
    </ProtectedRouteGuard>
  );
}

// Helper component for Flex which was missing in imports
import { Flex } from '@chakra-ui/react';
