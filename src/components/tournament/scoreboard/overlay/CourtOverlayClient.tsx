'use client';

import { useCallback } from 'react';
import { useParams } from 'next/navigation';

import { ScoreboardMatch } from '@/lib/api/types';
import OverlayShell from './OverlayShell';

/** Most recent finish time, used to keep the last result up until the next start. */
const finishedAt = (m: ScoreboardMatch): string => m.endTime ?? m.updatedAt;

/**
 * Court-keyed livestream overlay: a stable URL per court that always shows
 * whatever match is currently live on that court. When a match finishes it
 * keeps the final result on screen until the next match on the court starts.
 */
export default function CourtOverlayClient() {
  const params = useParams();
  const courtNumber = Number(params?.courtNumber);

  const selectMatch = useCallback(
    (matches: ScoreboardMatch[]): ScoreboardMatch | null => {
      if (!Number.isFinite(courtNumber)) return null;
      const onCourt = matches.filter(
        (m) => m.court?.courtNumber === courtNumber
      );
      const live = onCourt.find((m) => m.status === 'IN_PROGRESS');
      if (live) return live;
      const finished = onCourt
        .filter((m) => m.status === 'FINISHED')
        .sort((a, b) => finishedAt(b).localeCompare(finishedAt(a)));
      return finished[0] ?? null;
    },
    [courtNumber]
  );

  return <OverlayShell selectMatch={selectMatch} />;
}
