'use client';

import { SessionService } from '@/lib/api/session.service';
import { ISession } from '@/lib/api/types';
import { Box, Center, Grid, Heading, Spinner, Text } from '@chakra-ui/react';
import 'dayjs/locale/en';
import 'dayjs/locale/vi';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import SessionCard from './SessionCard';

interface SessionsListProps {
  status?: string;
  mode?: 'view' | 'manage';
}

export default function SessionsList({
  status = 'ALL',
  mode = 'view',
}: SessionsListProps) {
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('session');
  const locale = useLocale();

  // Delete handler
  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await SessionService.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError('Failed to delete session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchSessions() {
      try {
        setLoading(true);
        const sessionData = await SessionService.getAllSessions();
        setSessions(sessionData);
      } catch (err) {
        setError(t('loadingError'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, [locale, t]);

  // Filter sessions by status
  const filteredSessions =
    status === 'ALL'
      ? sessions
      : status === 'UPCOMING_AND_INPROGRESS'
        ? sessions.filter(
            (s) => s.status === 'PREPARING' || s.status === 'IN_PROGRESS'
          )
        : sessions.filter((s) => s.status === status);

  if (loading) {
    return (
      <Center py={10}>
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (error) {
    return (
      <Box
        p={4}
        bg="red.50"
        color="red.600"
        borderRadius="md"
        mb={6}
        borderWidth="1px"
        borderColor="red.200"
      >
        <Text fontWeight="medium">{error}</Text>
      </Box>
    );
  }

  if (filteredSessions.length === 0) {
    return (
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
          {t('noActiveSessions')}
        </Heading>
        <Text color="gray.500">{t('noActiveSessionsDescription')}</Text>
      </Box>
    );
  }

  return (
    <Grid
      templateColumns={{
        base: '1fr',
        md: 'repeat(2, 1fr)',
        lg: 'repeat(3, 1fr)',
      }}
      gap={6}
    >
      {filteredSessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          onDelete={mode === 'manage' ? handleDelete : undefined}
          mode={mode}
        />
      ))}
    </Grid>
  );
}
