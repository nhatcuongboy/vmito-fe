'use client';

import { useState, useEffect } from 'react';
import SessionForm from './SessionForm';
import { ISession } from '@/lib/api/types';
import { SessionService } from '@/lib/api/session.service';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

interface SessionEditFormProps {
  sessionId: string;
  onSuccess?: (session: ISession) => void;
}

export default function SessionEditForm({
  sessionId,
  onSuccess,
}: SessionEditFormProps) {
  const t = useTranslations('session');
  const [session, setSession] = useState<ISession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const data = await SessionService.getSession(sessionId);
        setSession(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="400px"
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error || !session) {
    return (
      <Box p={6} bg="red.50" borderRadius="md">
        <Text color="red.600">{error || 'Session not found'}</Text>
      </Box>
    );
  }

  return (
    <SessionForm
      mode="edit"
      sessionId={sessionId}
      initialData={session}
      onSuccess={(updatedSession) => {
        // Refresh session data
        setSession(updatedSession);
        onSuccess?.(updatedSession);
      }}
      showTopBar={false}
    />
  );
}
