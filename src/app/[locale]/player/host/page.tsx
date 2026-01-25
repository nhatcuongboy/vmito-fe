'use client';

import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { PlayerService } from '@/lib/api/player.service';
import { ISession, UserRole } from '@/lib/api/types';
import {
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
  Button,
  Spinner,
} from '@chakra-ui/react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import SessionCard from '@/components/session/SessionCard';
import TopBar from '@/components/ui/TopBar';
import { Plus } from 'lucide-react';
import { useRouter } from '@/i18n/config';

export default function PlayerHostPage() {
  const t = useTranslations('pages.dashboard');
  const tNav = useTranslations('navigation');
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

  const hostedSessions = sessions.filter((s) => s.hostId === user?.id);

  return (
    <ProtectedRouteGuard requiredRole={[UserRole.PLAYER]}>
      <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
        <TopBar showBackButton={false} title={tNav('host')} />
        
        <Container
          maxW="container.xl"
          pt={{
            base: 'calc(44px + env(safe-area-inset-top) + 24px)',
            md: 'calc(56px + env(safe-area-inset-top) + 24px)',
          }}
          pb="calc(64px + env(safe-area-inset-bottom) + 24px)"
        >
          <Flex mb={6} justify="space-between" align="center">
            <Heading as="h2" size="lg">
              {t('hostedSessions')}
            </Heading>
            <Button
              colorPalette="blue"
              size="sm"
              onClick={() => router.push('/player/sessions/new')}
              loading={loading}
            >
              <Plus size={16} style={{ marginRight: 4 }} />
              {t('createSession')}
            </Button>
          </Flex>

          {loading ? (
             <Flex justify="center" align="center" minH="200px">
               <Spinner size="xl" color="blue.500" />
             </Flex>
          ) : hostedSessions.length === 0 ? (
            <Box
              textAlign="center"
              py={10}
              px={6}
              borderWidth={1}
              borderRadius="lg"
              borderStyle="dashed"
              borderColor="gray.200"
              bg="white"
              _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
            >
              <Text color="gray.500" fontSize="lg" mb={4}>
                {t('noSessionsFound')}
              </Text>
              <Button
                colorPalette="blue"
                size="sm"
                onClick={() => router.push('/player/sessions/new')}
              >
                <Plus size={16} style={{ marginRight: 4 }} />
                {t('createSession')}
              </Button>
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
              {hostedSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  mode={'manage'}
                />
              ))}
            </Grid>
          )}
        </Container>
      </Box>
    </ProtectedRouteGuard>
  );
}
