'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TournamentService } from '@/lib/api/tournament.service';
import {
  CategoryMatch,
  TournamentCourt,
  TournamentUmpire,
} from '@/lib/api/types';
import { useTournamentSocket } from '@/hooks/useTournamentSocket';

const REALTIME_REFRESH_DELAY_MS = 500;

/**
 * Loads Results-panel matches/courts/umpires and keeps them fresh via a
 * debounced refresh on tournament-socket score/match/referee events.
 */
export function useResultsData(tournamentId: string, canEdit: boolean) {
  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [courts, setCourts] = useState<TournamentCourt[]>([]);
  const [umpires, setUmpires] = useState<TournamentUmpire[]>([]);
  const [loading, setLoading] = useState(true);
  const realtimeRefreshTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const load = useCallback(async () => {
    const [allMatches, allCourts, allUmpires] = await Promise.all([
      TournamentService.getAllMatches(tournamentId),
      TournamentService.getCourts(tournamentId),
      canEdit
        ? TournamentService.getUmpires(tournamentId)
        : Promise.resolve<TournamentUmpire[]>([]),
    ]);
    setMatches(allMatches);
    setCourts(allCourts);
    setUmpires(allUmpires);
  }, [tournamentId, canEdit]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const scheduleRealtimeRefresh = useCallback(() => {
    if (realtimeRefreshTimeoutRef.current) {
      clearTimeout(realtimeRefreshTimeoutRef.current);
    }

    realtimeRefreshTimeoutRef.current = setTimeout(() => {
      realtimeRefreshTimeoutRef.current = null;
      void load();
    }, REALTIME_REFRESH_DELAY_MS);
  }, [load]);

  useEffect(() => {
    return () => {
      if (realtimeRefreshTimeoutRef.current) {
        clearTimeout(realtimeRefreshTimeoutRef.current);
      }
    };
  }, []);

  useTournamentSocket(tournamentId, {
    onScoreUpdated: scheduleRealtimeRefresh,
    onMatchStarted: scheduleRealtimeRefresh,
    onMatchEnded: scheduleRealtimeRefresh,
    onRefereeAssigned: scheduleRealtimeRefresh,
    onReconnect: () => void load(),
  });

  return { matches, setMatches, courts, umpires, loading, load };
}
