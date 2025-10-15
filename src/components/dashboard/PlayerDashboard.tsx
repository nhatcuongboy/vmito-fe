'use client';

import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { PlayerService } from '@/lib/api/player.service';
import { ISession } from '@/lib/api/types';
import { Box, Container, Flex, Grid, Heading } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import SessionCard from '../session/SessionCard';

export default function PlayerDashboard() {
  const t = useTranslations('pages.dashboard');
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayerSessions() {
      try {
        setLoading(true);
        const sessionData = await PlayerService.getMySessions();
        setSessions(sessionData);
      } catch (err) {
        setError(t('loadingError'));
        console.error('Error fetching player sessions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlayerSessions();
  }, []);

  return (
    <ProtectedRouteGuard requiredRole={['PLAYER']}>
      {/* Main Content */}
      <Container maxW="container.xl" py={16} mt={10}>
        {/* Sessions Section */}
        <Box mb={10}>
          <Flex mb={4} justify="space-between" align="center">
            <Heading as="h2" size="xl" textAlign="left">
              {t('upcomingSessions')}
            </Heading>
          </Flex>
          {/* <SessionsList status="UPCOMING_AND_INPROGRESS" /> */}
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            }}
            gap={6}
          >
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} mode={'view'} />
            ))}
          </Grid>
        </Box>
      </Container>
    </ProtectedRouteGuard>
  );
}
