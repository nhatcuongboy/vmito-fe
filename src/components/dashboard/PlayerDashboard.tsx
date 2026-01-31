'use client';

import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { PlayerService } from '@/lib/api/player.service';
import { ISession, UserRole } from '@/lib/api/types';
import { Box, Container, Flex, Grid, Heading, Text } from '@chakra-ui/react';

import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/config';
import FindSessionList from '../session/FindSessionList';
import SessionCard from '../session/SessionCard';
import { Button } from '@/components/ui/chakra-compat';
import { Plus } from 'lucide-react';

export default function PlayerDashboard() {
  const t = useTranslations('pages.dashboard');
  const tSession = useTranslations('session');
  const router = useRouter();
  const { user } = useAuthStore();
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

  const joinedSessions = sessions.filter((s) => s.hostId !== user?.id);

  return (
    <ProtectedRouteGuard requiredRole={[UserRole.PLAYER]}>
      {/* Main Content */}
      <Container maxW="container.xl" py={16} mt={10}>
        {/* Available Sessions Section */}
        <Box mb={16}>
          <Flex mb={6} justify="space-between" align="center">
            <Heading as="h2" size="xl" textAlign="left">
              {tSession('findSession')}
            </Heading>
          </Flex>
          <FindSessionList />
        </Box>

        {/* Sessions Section */}
        {/* <Box mb={10}> */}
        {/* <Flex mb={4} justify="space-between" align="center">
            <Heading as="h2" size="lg" textAlign="left">
              {t('mySessions')}
            </Heading>
            <Button
              colorPalette="blue"
              size="sm"
              onClick={() => router.push('/player/sessions/new')}
            >
              <Plus size={16} style={{ marginRight: 4 }} />
              {t('createSession')}
            </Button>
          </Flex> */}

        {/* Joined Sessions Grid */}
        {/* <Box> 
            {joinedSessions.length === 0 ? (
              <Box
                textAlign="center"
                py={10}
                px={6}
                borderWidth={1}
                borderRadius="lg"
                borderStyle="dashed"
                borderColor="gray.200"
              >
                <Text color="gray.500" fontSize="lg">
                  {t('noSessionsFound')}
                </Text>
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
                  <SessionCard
                    key={session.id}
                    session={session}
                    mode={'view'}
                  />
                ))}
              </Grid>
            )}
          </Box> */}
        {/* </Box> */}
      </Container>
    </ProtectedRouteGuard>
  );
}
