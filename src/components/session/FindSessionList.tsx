'use client';

import { SessionService } from '@/lib/api/session.service';
import { PlayerService } from '@/lib/api/player.service';
import { ISession } from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Box,
  Center,
  Grid,
  Heading,
  Spinner,
  Text,
  Flex,
} from '@chakra-ui/react';
import { Button, Input, Select } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { useEffect, useState, ChangeEvent } from 'react';
import JoinSessionModal from './JoinSessionModal';
import FindSessionCard from './FindSessionCard';
import { useRouter } from 'next/navigation';

export default function FindSessionList() {
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinedSessionIds, setJoinedSessionIds] = useState<Set<string>>(
    new Set()
  );
  const [filters, setFilters] = useState({
    date: '',
    level: '',
  });

  const [selectedSession, setSelectedSession] = useState<ISession | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const router = useRouter();

  const t = useTranslations('session');
  const { user } = useAuthStore();

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const levelFilter = filters.level ? parseInt(filters.level) : undefined;
      const data = await SessionService.getAvailableSessions({
        date: filters.date,
        level: levelFilter,
      });
      setSessions(data);

      if (user) {
        try {
          const mySessions = await PlayerService.getMySessions();
          setJoinedSessionIds(new Set(mySessions.map((s) => s.id)));
        } catch (err) {
          console.error('Failed to fetch joined sessions', err);
        }
      }
    } catch (err) {
      setError(t('loadingError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    fetchSessions();
  };

  const handleJoinClick = (session: ISession) => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    setSelectedSession(session);
    setIsJoinModalOpen(true);
  };

  const handleJoinSuccess = () => {
    fetchSessions();
  };

  return (
    <Box>
      {/* Filters */}
      <Flex
        gap={4}
        mb={8}
        wrap="wrap"
        bg="white"
        _dark={{ bg: 'gray.800' }}
        p={4}
        borderRadius="lg"
        borderWidth="1px"
        align="end"
      >
        <Box width={{ base: '100%', md: '200px' }}>
          <Text mb={2} fontWeight="medium">
            {t('date')}
          </Text>
          <Input
            type="date"
            value={filters.date}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleFilterChange('date', e.target.value)
            }
          />
        </Box>
        <Box width={{ base: '100%', md: '200px' }}>
          <Text mb={2} fontWeight="medium">
            {t('level')}
          </Text>
          <Select
            value={filters.level}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              handleFilterChange('level', e.target.value)
            }
          >
            <option value="">{t('allLevels')}</option>
            {[1, 2, 3, 4, 5, 6, 7].map((l) => (
              <option key={l} value={l}>
                {t(`levels.${l}`)}
              </option>
            ))}
          </Select>
        </Box>
        <Button colorScheme="blue" onClick={handleSearch} px={8}>
          {t('search')}
        </Button>
      </Flex>

      {/* List */}
      {loading ? (
        <Center py={10}>
          <Spinner size="xl" color="blue.500" />
        </Center>
      ) : error ? (
        <Box
          p={4}
          bg="red.50"
          color="red.600"
          borderRadius="md"
          borderWidth="1px"
          borderColor="red.200"
        >
          <Text fontWeight="medium">{error}</Text>
        </Box>
      ) : sessions.length === 0 ? (
        <Box
          textAlign="center"
          py={10}
          px={6}
          borderWidth="1px"
          borderRadius="lg"
          bg="white"
          _dark={{ bg: 'gray.800' }}
        >
          <Heading size="md" mb={2}>
            {t('noSessionsFound')}
          </Heading>
          <Text color="gray.500">{t('tryAdjustingFilters')}</Text>
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
            <FindSessionCard
              key={session.id}
              session={session}
              onJoin={() => handleJoinClick(session)}
              isJoined={joinedSessionIds.has(session.id)}
            />
          ))}
        </Grid>
      )}

      {selectedSession && (
        <JoinSessionModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          session={selectedSession}
          onSuccess={handleJoinSuccess}
        />
      )}
    </Box>
  );
}
