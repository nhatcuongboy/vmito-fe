'use client';

import { useState, useEffect } from 'react';
import { Box, Grid, Heading, Text, Stack, Flex } from '@chakra-ui/react';
import { AlertTriangle } from 'lucide-react';
import { PlayerService } from '@/lib/api/player.service';
import { useTranslations } from 'next-intl';
import PlayerSessionCard from './PlayerSessionCard';
import { SessionCardSkeleton } from '../session/SessionCardSkeleton';
import { ISession } from '@/lib/api/types';

export default function PlayerSessionsList() {
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('session');

  useEffect(() => {
    async function fetchPlayerSessions() {
      try {
        setLoading(true);
        const sessionResponse = await PlayerService.getMySessions();
        setSessions(sessionResponse.data);
      } catch (err) {
        setError(t('loadingError'));
        console.error('Error fetching player sessions:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayerSessions();
  }, [t]);

  if (loading) {
    return (
      <Grid
        templateColumns={{
          base: '1fr',
          md: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)',
        }}
        gap={6}
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <SessionCardSkeleton key={index} />
        ))}
      </Grid>
    );
  }

  if (error) {
    return (
      <Box
        p={4}
        borderRadius="md"
        bg="red.50"
        borderColor="red.200"
        borderWidth="1px"
        _dark={{ bg: 'red.900', borderColor: 'red.700' }}
      >
        <Flex align="center">
          <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
          <Text color="red.700" _dark={{ color: 'red.200' }}>
            {error}
          </Text>
        </Flex>
      </Box>
    );
  }

  if (sessions.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text fontSize="lg" color="gray.500">
          {t('noSessionsFound')}
        </Text>
        <Text mt={2} color="gray.400">
          {t('noSessionsDescription')}
        </Text>
      </Box>
    );
  }

  // Group sessions by status
  const activeSessions = sessions.filter(
    (session) =>
      session.status === 'IN_PROGRESS' || session.status === 'PREPARING'
  );
  const finishedSessions = sessions.filter(
    (session) => session.status === 'FINISHED'
  );

  return (
    <Stack gap={8}>
      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <Box>
          <Heading
            size="lg"
            mb={4}
            color="green.600"
            _dark={{ color: 'green.400' }}
          >
            {t('activeSessions')}
          </Heading>
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            }}
            gap={6}
          >
            {activeSessions.map((session) => (
              <PlayerSessionCard key={session.id} session={session} />
            ))}
          </Grid>
        </Box>
      )}

      {/* Finished Sessions */}
      {finishedSessions.length > 0 && (
        <Box>
          <Heading
            size="lg"
            mb={4}
            color="gray.600"
            _dark={{ color: 'gray.400' }}
          >
            {t('pastSessions')}
          </Heading>
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            }}
            gap={6}
          >
            {finishedSessions.map((session) => (
              <PlayerSessionCard key={session.id} session={session} />
            ))}
          </Grid>
        </Box>
      )}
    </Stack>
  );
}
