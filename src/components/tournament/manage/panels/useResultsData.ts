'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TournamentService } from '@/lib/api/tournament.service';
import {
  CategoryMatch,
  TournamentCourt,
  TournamentUmpire,
} from '@/lib/api/types';
import {
  TournamentMatchEvent,
  useTournamentSocket,
} from '@/hooks/useTournamentSocket';
import { mergeScoreboardMatchList } from './resultsRealtime';

const REALTIME_REFRESH_DELAY_MS = 500;

/**
 * Loads Results-panel matches/courts/umpires. Score/start events are merged
 * locally; structural match/referee/schedule events refresh only what they can
 * affect.
 */
export function useResultsData(tournamentId: string, canEdit: boolean) {
  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [courts, setCourts] = useState<TournamentCourt[]>([]);
  const [umpires, setUmpires] = useState<TournamentUmpire[]>([]);
  const [loading, setLoading] = useState(true);
  const realtimeRefreshTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const matchesRef = useRef(matches);
  matchesRef.current = matches;

  const loadMatches = useCallback(async () => {
    const allMatches = await TournamentService.getAllMatches(tournamentId);
    setMatches(allMatches);
  }, [tournamentId]);

  const loadSupportingData = useCallback(async () => {
    const [allCourts, allUmpires] = await Promise.all([
      TournamentService.getCourts(tournamentId),
      canEdit
        ? TournamentService.getUmpires(tournamentId)
        : Promise.resolve<TournamentUmpire[]>([]),
    ]);
    setCourts(allCourts);
    setUmpires(allUmpires);
  }, [tournamentId, canEdit]);

  const load = useCallback(async () => {
    await Promise.all([loadMatches(), loadSupportingData()]);
  }, [loadMatches, loadSupportingData]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const scheduleMatchesRefresh = useCallback(() => {
    if (realtimeRefreshTimeoutRef.current) {
      clearTimeout(realtimeRefreshTimeoutRef.current);
    }

    realtimeRefreshTimeoutRef.current = setTimeout(() => {
      realtimeRefreshTimeoutRef.current = null;
      void loadMatches();
    }, REALTIME_REFRESH_DELAY_MS);
  }, [loadMatches]);

  const mergeRealtimeMatch = useCallback(
    (event: TournamentMatchEvent) => {
      const hasMatch = matchesRef.current.some(
        (match) => match.id === event.match.matchId
      );
      if (!hasMatch) {
        // A newly generated match can arrive before the list snapshot includes
        // it. Fall back to one matches-only refresh in that uncommon case.
        scheduleMatchesRefresh();
        return;
      }

      setMatches((currentMatches) =>
        mergeScoreboardMatchList(currentMatches, event.match)
      );
    },
    [scheduleMatchesRefresh]
  );

  const handleMatchEnded = useCallback(
    (event: TournamentMatchEvent) => {
      // Reflect the final score immediately, then refresh matches once to pick
      // up participants advanced into downstream playoff matches.
      mergeRealtimeMatch(event);
      scheduleMatchesRefresh();
    },
    [mergeRealtimeMatch, scheduleMatchesRefresh]
  );

  const handleRefereeAssigned = useCallback(() => {
    scheduleMatchesRefresh();
    if (canEdit) {
      void TournamentService.getUmpires(tournamentId).then(setUmpires);
    }
  }, [canEdit, scheduleMatchesRefresh, tournamentId]);

  useEffect(() => {
    return () => {
      if (realtimeRefreshTimeoutRef.current) {
        clearTimeout(realtimeRefreshTimeoutRef.current);
      }
    };
  }, []);

  useTournamentSocket(tournamentId, {
    onScoreUpdated: mergeRealtimeMatch,
    onMatchStarted: mergeRealtimeMatch,
    onMatchEnded: handleMatchEnded,
    onRefereeAssigned: handleRefereeAssigned,
    onScheduleUpdated: load,
    onReconnect: () => void load(),
  });

  return { matches, setMatches, courts, umpires, loading, load };
}
