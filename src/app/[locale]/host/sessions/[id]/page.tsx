'use client';

import { useState, useEffect, use } from 'react';
// import { useRouter } from 'next/navigation';
import { Spinner, Center, Box, Text } from '@chakra-ui/react';
import { SessionService } from '@/lib/api/session.service';
import SessionDetailContent from '@/components/session/SessionDetailContent';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';

function SessionDetailPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // const router = useRouter();
  // Use React.use() to unwrap params if it's a Promise, otherwise use it directly
  const unwrappedParams = use(params);
  const sessionId = unwrappedParams.id;
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessionData() {
      if (!sessionId) {
        setError('Session ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const sessionData = await SessionService.getSession(sessionId);

        // Transform API data format to match what SessionDetailContent expects
        const formattedSession = {
          ...sessionData,
          // SessionDetailContent expects string dates (ISO format)
          startTime: sessionData.startTime
            ? new Date(sessionData.startTime).toISOString()
            : null,
          endTime: sessionData.endTime
            ? new Date(sessionData.endTime).toISOString()
            : null,
          // Transform courts and their currentMatch
          courts: (sessionData.courts || []).map((court: any) => ({
            ...court,
            currentPlayers: court.currentPlayers || [],
            currentMatch: court.currentMatch
              ? {
                  ...court.currentMatch,
                  startTime: court.currentMatch.startTime
                    ? new Date(court.currentMatch.startTime).toISOString()
                    : new Date().toISOString(),
                  endTime: court.currentMatch.endTime
                    ? new Date(court.currentMatch.endTime).toISOString()
                    : undefined,
                }
              : undefined,
          })),
          players: sessionData.players || [],
          waitingQueue:
            sessionData.players?.filter((p: any) => p.status === 'WAITING') ||
            [],
        };

        setSession(formattedSession);
      } catch (err) {
        console.error('Error fetching session:', err);
        setError('An error occurred while loading session data');
      } finally {
        setLoading(false);
      }
    }

    fetchSessionData();
  }, [sessionId]);

  // Loading state
  if (loading) {
    return (
      <Center minH="50vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  // Error state
  if (error) {
    return (
      <Box
        p={6}
        bg="red.50"
        color="red.600"
        borderRadius="md"
        m={8}
        textAlign="center"
      >
        <Text fontSize="lg" fontWeight="medium">
          {error}
        </Text>
        <Text mt={2}>
          Please try again or contact support if the problem persists.
        </Text>
      </Box>
    );
  }

  // No session found
  if (!session) {
    return (
      <Box
        p={6}
        bg="blue.50"
        color="blue.600"
        borderRadius="md"
        m={8}
        textAlign="center"
      >
        <Text fontSize="lg" fontWeight="medium">
          Session not found
        </Text>
        <Text mt={2}>
          The session you're looking for might have been deleted or doesn't
          exist.
        </Text>
      </Box>
    );
  }

  // Pass the session data to the SessionDetailContent component
  return <SessionDetailContent sessionData={session} />;
}

// Get the session detail data and adapt it to the format expected by SessionDetailContent
export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ProtectedRouteGuard requiredRole={['HOST']}>
      <SessionDetailPageContent params={params} />
    </ProtectedRouteGuard>
  );
}
