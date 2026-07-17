'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TournamentService } from '@/lib/api/tournament.service';
import { TournamentProgress } from '@/lib/api/types';
import { useTournamentSocket } from '@/hooks/useTournamentSocket';
import { subscribeTournamentProgressChanged } from './progressEvents';

/**
 * Fetches the run-phase progress roll-up and keeps it fresh: socket events
 * cover results entered anywhere (live scoring, manual entry), the
 * progress-changed CustomEvent covers same-page generation flows that have no
 * socket broadcast.
 */
export function useTournamentProgress(
  tournamentId: string | undefined,
  enabled: boolean
) {
  const [progress, setProgress] = useState<TournamentProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const refresh = useCallback(async () => {
    if (!tournamentId || !enabledRef.current) return;
    try {
      const data = await TournamentService.getProgress(tournamentId);
      setProgress(data);
    } catch {
      // Non-critical widget — keep whatever we had.
    }
  }, [tournamentId]);

  // Debounced refresh so bursts of match-ended events collapse into one fetch
  const scheduleRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    refreshTimeoutRef.current = setTimeout(() => {
      refreshTimeoutRef.current = null;
      void refresh();
    }, 500);
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, []);

  // Initial fetch when enabled
  useEffect(() => {
    if (!tournamentId || !enabled) return;
    let cancelled = false;
    setLoading(true);
    TournamentService.getProgress(tournamentId)
      .then((data) => {
        if (!cancelled) setProgress(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tournamentId, enabled]);

  useTournamentSocket(enabled ? tournamentId : undefined, {
    onMatchEnded: scheduleRefresh,
    onScheduleUpdated: scheduleRefresh,
    onTournamentEnded: scheduleRefresh,
    onReconnect: scheduleRefresh,
  });

  useEffect(() => {
    if (!enabled) return;
    return subscribeTournamentProgressChanged(scheduleRefresh);
  }, [enabled, scheduleRefresh]);

  return { progress, loading, refresh };
}
