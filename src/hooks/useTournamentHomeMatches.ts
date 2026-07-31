'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { CategoryMatch, TournamentStatus } from '@/lib/api/types';
import { TournamentService } from '@/lib/api/tournament.service';
import { useTournamentSocket } from '@/hooks/useTournamentSocket';

const REALTIME_REFRESH_DELAY_MS = 300;

export function useTournamentHomeMatches(
  tournamentId: string,
  initialStatus: TournamentStatus
) {
  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [resultsVersion, setResultsVersion] = useState(0);
  const [statusOverride, setStatusOverride] = useState<
    TournamentStatus | undefined
  >();
  const currentStatus = statusOverride ?? initialStatus;
  const socketTournamentId =
    currentStatus === TournamentStatus.PREPARING ||
    currentStatus === TournamentStatus.IN_PROGRESS
      ? tournamentId
      : undefined;
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldRefreshResultsRef = useRef(false);

  const loadMatches = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) setLoading(true);

      try {
        const data = await TournamentService.getAllMatches(tournamentId);
        setMatches(data);
        setError(false);
        return true;
      } catch (loadError) {
        console.error('Error loading tournament home matches:', loadError);
        setError(true);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [tournamentId]
  );

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  const scheduleRefresh = useCallback(
    (refreshResults = false) => {
      shouldRefreshResultsRef.current =
        shouldRefreshResultsRef.current || refreshResults;

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(async () => {
        refreshTimeoutRef.current = null;
        const refreshResultsAfterLoad = shouldRefreshResultsRef.current;
        shouldRefreshResultsRef.current = false;
        const succeeded = await loadMatches({ silent: true });

        if (succeeded && refreshResultsAfterLoad) {
          setResultsVersion((current) => current + 1);
        }
      }, REALTIME_REFRESH_DELAY_MS);
    },
    [loadMatches]
  );

  useEffect(
    () => () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    },
    []
  );

  useTournamentSocket(socketTournamentId, {
    onScoreUpdated: () => scheduleRefresh(),
    onMatchStarted: () => scheduleRefresh(),
    onMatchEnded: () => scheduleRefresh(true),
    onScheduleUpdated: () => scheduleRefresh(),
    onTournamentEnded: (event) => {
      if (
        event.status === TournamentStatus.FINISHED ||
        event.status === TournamentStatus.CANCELLED
      ) {
        setStatusOverride(event.status);
      }
      scheduleRefresh(true);
    },
    onReconnect: () => scheduleRefresh(true),
  });

  return {
    matches,
    loading,
    error,
    resultsVersion,
    statusOverride,
    retry: loadMatches,
  };
}
