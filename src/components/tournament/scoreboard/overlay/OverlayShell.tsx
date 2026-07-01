'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

import { TournamentService } from '@/lib/api/tournament.service';
import { ScoreboardMatch, Tournament } from '@/lib/api/types';
import {
  useTournamentSocket,
  TournamentMatchEvent,
} from '@/hooks/useTournamentSocket';
import BroadcastOverlay from './BroadcastOverlay';
import {
  parseOverlayOptions,
  useTransparentPageBackground,
} from './overlayOptions';

interface Props {
  /** Picks the match to display from all of the tournament's live matches. */
  selectMatch: (matches: ScoreboardMatch[]) => ScoreboardMatch | null;
}

/**
 * Shared plumbing for the livestream overlay routes: resolves the tournament,
 * seeds the scoreboard snapshot, keeps it live over the `/tournaments` socket,
 * and renders a single {@link BroadcastOverlay} chosen by `selectMatch`. Drops
 * the socket automatically when the tournament ends (handled in the hook).
 */
export default function OverlayShell({ selectMatch }: Props) {
  const params = useParams();
  const tournamentParam = String(params?.id ?? '');
  const searchParams = useSearchParams();
  const options = useMemo(
    () => parseOverlayOptions(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  useTransparentPageBackground(options.background === 'transparent');

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matchesMap, setMatchesMap] = useState<Record<string, ScoreboardMatch>>(
    {}
  );
  const [ended, setEnded] = useState(false);

  const seedFromServer = useCallback((matches: ScoreboardMatch[]) => {
    const map: Record<string, ScoreboardMatch> = {};
    for (const m of matches) map[m.matchId] = m;
    setMatchesMap(map);
  }, []);

  const loadScoreboard = useCallback(async (tournamentId: string) => {
    const data = await TournamentService.getScoreboard(tournamentId, {
      includeFinished: true,
    });
    return data.matches;
  }, []);

  // Initial load: resolve tournament (id/slug) + scoreboard snapshot.
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const tour = await TournamentService.getTournament(tournamentParam);
        const matches = await loadScoreboard(tour.id);
        if (!active) return;
        setTournament(tour);
        seedFromServer(matches);
      } catch {
        // Public overlay: swallow errors and simply render nothing.
      }
    })();
    return () => {
      active = false;
    };
  }, [tournamentParam, loadScoreboard, seedFromServer]);

  const mergeMatch = useCallback((e: TournamentMatchEvent) => {
    setMatchesMap((prev) => ({ ...prev, [e.match.matchId]: e.match }));
  }, []);

  useTournamentSocket(tournament?.id, {
    onScoreUpdated: mergeMatch,
    onMatchStarted: mergeMatch,
    onMatchEnded: mergeMatch,
    onReconnect: () => {
      if (tournament?.id) {
        void loadScoreboard(tournament.id).then(seedFromServer);
      }
    },
    onTournamentEnded: () => setEnded(true),
  });

  const current = useMemo(
    () => selectMatch(Object.values(matchesMap)),
    [matchesMap, selectMatch]
  );

  // Nothing live to show → render an empty (transparent) frame so an OBS
  // browser source stays clean. Once the tournament has ended we also keep it
  // blank rather than freezing on a stale match.
  if (!current || ended) return null;

  return (
    <BroadcastOverlay
      match={current}
      options={options}
      tournamentName={tournament?.name}
    />
  );
}
