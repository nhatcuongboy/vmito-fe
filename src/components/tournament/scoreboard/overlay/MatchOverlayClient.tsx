'use client';

import { useCallback } from 'react';
import { useParams } from 'next/navigation';

import { ScoreboardMatch } from '@/lib/api/types';
import OverlayShell from './OverlayShell';

/**
 * Match-keyed livestream overlay: pins one specific match (e.g. the final on a
 * show court). The URL changes per match, unlike the court-keyed overlay.
 */
export default function MatchOverlayClient() {
  const params = useParams();
  const matchId = String(params?.matchId ?? '');

  const selectMatch = useCallback(
    (matches: ScoreboardMatch[]): ScoreboardMatch | null =>
      matches.find((m) => m.matchId === matchId) ?? null,
    [matchId]
  );

  return <OverlayShell selectMatch={selectMatch} />;
}
