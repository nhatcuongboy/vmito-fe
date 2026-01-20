import { useCallback, useEffect, useState } from 'react';
import { SessionService } from '@/lib/api/session.service';
import { SessionData } from './useSessionData';
import { Court, Match } from '@/lib/api/types';

interface UseSessionRefreshProps {
  sessionId: string;
  sessionStatus: 'PREPARING' | 'IN_PROGRESS' | 'FINISHED';
  onSessionUpdate: (session: SessionData) => void;
}

interface UseSessionRefreshReturn {
  refreshSessionData: () => Promise<void>;
  isRefreshing: boolean;
  lastRefreshed: Date;
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;
}

/**
 * Custom hook for managing session data refresh
 * Handles auto-refresh for IN_PROGRESS sessions
 * 
 * @param sessionId - The ID of the session to refresh
 * @param sessionStatus - Current session status
 * @param onSessionUpdate - Callback to update session data
 * @returns Object containing refresh functions and state
 */
export function useSessionRefresh({
  sessionId,
  sessionStatus,
  onSessionUpdate,
}: UseSessionRefreshProps): UseSessionRefreshReturn {
  const [refreshInterval, setRefreshInterval] = useState<number>(60);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Function to refresh session data
  const refreshSessionData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const data = await SessionService.getSession(sessionId);

      // Transform API data to SessionData format
      const formattedSession: SessionData = {
        ...data,
        players: (data.players || []).map((p) => ({
          ...p,
          name: p.name || '',
        })),
        courts: (data.courts || []).map((c) => {
          const court: Court = {
            ...c,
            currentPlayers: c.currentPlayers || [],
            currentMatch: c.currentMatch
              ? ({
                  ...c.currentMatch,
                  startTime: c.currentMatch.startTime
                    ? new Date(c.currentMatch.startTime)
                    : new Date(),
                  endTime: c.currentMatch.endTime
                    ? new Date(c.currentMatch.endTime)
                    : undefined,
                } as Match)
              : undefined,
          };
          return court;
        }),
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };

      onSessionUpdate(formattedSession);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error refreshing session data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [sessionId, onSessionUpdate]);

  // Setup auto-refresh when session is in progress
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (sessionStatus === 'IN_PROGRESS' && refreshInterval > 0) {
      intervalId = setInterval(refreshSessionData, refreshInterval * 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [sessionStatus, refreshInterval, refreshSessionData]);

  return {
    refreshSessionData,
    isRefreshing,
    lastRefreshed,
    refreshInterval,
    setRefreshInterval,
  };
}
