'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { useAuthStore } from '@/stores/useAuthStore';
import { ScoreboardMatch } from '@/lib/api/types';

// Event names mirror the backend TournamentEventType enum.
export enum TournamentEventType {
  MATCH_STARTED = 'tournament_match_started',
  SCORE_UPDATED = 'tournament_match_score_updated',
  MATCH_ENDED = 'tournament_match_ended',
  REFEREE_ASSIGNED = 'tournament_match_referee_assigned',
  SCHEDULE_UPDATED = 'tournament_schedule_updated',
}

export interface TournamentMatchEvent {
  tournamentId: string;
  match: ScoreboardMatch;
  clientId?: string; // origin tag (score updates)
  seq?: number; // monotonic per clientId (score updates)
}

/** Fired when the live court queue / assignments change. No match payload. */
export interface TournamentScheduleEvent {
  tournamentId: string;
}

export interface UseTournamentSocketOptions {
  onScoreUpdated?: (e: TournamentMatchEvent) => void;
  onMatchStarted?: (e: TournamentMatchEvent) => void;
  onMatchEnded?: (e: TournamentMatchEvent) => void;
  onRefereeAssigned?: (e: TournamentMatchEvent) => void;
  onScheduleUpdated?: (e: TournamentScheduleEvent) => void;
  onReconnect?: () => void;
}

/**
 * Standalone socket for tournament live-scoring updates. Connects to the
 * `/tournaments` namespace and joins `tournament_{id}`. Works for logged-out
 * spectators (token is optional) and is keyed on `tournamentId` only, so it
 * doesn't churn on auth/token changes. Consumers should refetch on reconnect.
 */
export function useTournamentSocket(
  tournamentId: string | undefined,
  options: UseTournamentSocketOptions
) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);

  // Keep the latest callbacks in a ref so changing handler identities does not
  // re-subscribe / reconnect the socket.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!tournamentId) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socketBaseUrl = apiUrl.endsWith('/api')
      ? apiUrl.slice(0, -4)
      : apiUrl;

    const socket: Socket = io(`${socketBaseUrl}/tournaments`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      auth: (cb) => {
        // Token is optional — the scoreboard room is public/read-only.
        const token = useAuthStore.getState().accessToken;
        cb({ token: token ? `Bearer ${token}` : '' });
      },
    });

    const joinRoom = () => socket.emit('joinTournament', tournamentId);

    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
      joinRoom();
    });

    socket.io.on('reconnect', () => {
      joinRoom();
      optionsRef.current.onReconnect?.();
    });

    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', (err) => setConnectionError(err as Error));

    socket.on(TournamentEventType.SCORE_UPDATED, (e: TournamentMatchEvent) =>
      optionsRef.current.onScoreUpdated?.(e)
    );
    socket.on(TournamentEventType.MATCH_STARTED, (e: TournamentMatchEvent) =>
      optionsRef.current.onMatchStarted?.(e)
    );
    socket.on(TournamentEventType.MATCH_ENDED, (e: TournamentMatchEvent) =>
      optionsRef.current.onMatchEnded?.(e)
    );
    socket.on(TournamentEventType.REFEREE_ASSIGNED, (e: TournamentMatchEvent) =>
      optionsRef.current.onRefereeAssigned?.(e)
    );
    socket.on(
      TournamentEventType.SCHEDULE_UPDATED,
      (e: TournamentScheduleEvent) => optionsRef.current.onScheduleUpdated?.(e)
    );

    return () => {
      socket.emit('leaveTournament', tournamentId);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [tournamentId]);

  return { isConnected, connectionError };
}
