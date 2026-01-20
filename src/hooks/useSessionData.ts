import { useState, useEffect } from 'react';
import { SessionService } from '@/lib/api/session.service';
import { ISession, Player, Court, Match } from '@/lib/api/types';

/**
 * Transformed session data that includes computed properties
 * and properly formatted dates for components
 */
export interface SessionData extends Omit<ISession, 'players' | 'courts'> {
  players: Player[];
  courts: Court[];
  waitingQueue?: Player[];
}

interface UseSessionDataReturn {
  session: SessionData | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch and manage session data
 * 
 * @param sessionId - The ID of the session to fetch
 * @returns Object containing session data, loading state, and error message
 */
export function useSessionData(sessionId: string): UseSessionDataReturn {
  const [session, setSession] = useState<SessionData | null>(null);
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

        // Transform API data format to match what components expect
        const formattedSession: SessionData = {
          ...sessionData,
          // Ensure dates are properly typed as Date objects
          startTime: sessionData.startTime
            ? new Date(sessionData.startTime)
            : undefined,
          endTime: sessionData.endTime
            ? new Date(sessionData.endTime)
            : undefined,
          createdAt: new Date(sessionData.createdAt),
          updatedAt: new Date(sessionData.updatedAt),
          // Transform courts and their currentMatch
          courts: (sessionData.courts || []).map((court) => {
            const transformedCourt: Court = {
              ...court,
              currentPlayers: court.currentPlayers || [],
              currentMatch: court.currentMatch
                ? {
                    ...court.currentMatch,
                    startTime: court.currentMatch.startTime
                      ? new Date(court.currentMatch.startTime)
                      : new Date(),
                    endTime: court.currentMatch.endTime
                      ? new Date(court.currentMatch.endTime)
                      : undefined,
                  } as Match
                : undefined,
            };
            return transformedCourt;
          }),
          players: sessionData.players || [],
          // Compute waiting queue from players with WAITING status
          waitingQueue:
            sessionData.players?.filter((p) => p.status === 'WAITING') || [],
        };

        setSession(formattedSession);
        setError(null);
      } catch (err) {
        console.error('Error fetching session:', err);
        setError('An error occurred while loading session data');
      } finally {
        setLoading(false);
      }
    }

    fetchSessionData();
  }, [sessionId]);

  return { session, loading, error };
}
