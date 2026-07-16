import type { CategoryMatch, ScoreboardMatch } from '@/lib/api/types';

/** Update one socket match while preserving every unrelated object reference. */
export function mergeScoreboardMatchList(
  currentMatches: CategoryMatch[],
  incoming: ScoreboardMatch
) {
  let found = false;
  const nextMatches = currentMatches.map((match) => {
    if (match.id !== incoming.matchId) return match;
    found = true;
    return mergeScoreboardMatch(match, incoming);
  });

  return found ? nextMatches : currentMatches;
}

/** Merge the normalized socket payload into the full schedule match shape. */
export function mergeScoreboardMatch(
  current: CategoryMatch,
  incoming: ScoreboardMatch
): CategoryMatch {
  const sets = incoming.currentSet
    ? [
        ...incoming.sets.filter(
          (set) => set.setNumber !== incoming.currentSet?.setNumber
        ),
        {
          setNumber: incoming.currentSet.setNumber,
          player1Score: incoming.currentSet.side1,
          player2Score: incoming.currentSet.side2,
        },
      ]
    : incoming.sets;
  const scoreTotals = sets.reduce(
    (totals, set) => ({
      player1Score: totals.player1Score + set.player1Score,
      player2Score: totals.player2Score + set.player2Score,
    }),
    { player1Score: 0, player2Score: 0 }
  );
  const hasSetScores = sets.length > 0;
  const currentSet = incoming.currentSet;

  return {
    ...current,
    status: incoming.status,
    score: incoming.score ?? undefined,
    sets,
    winnerId: incoming.winnerId ?? undefined,
    isDraw: incoming.isDraw,
    servingSide: incoming.servingSide,
    serverNumber: incoming.serverNumber,
    refereeName: incoming.refereeName,
    matchFormat: incoming.matchFormat ?? undefined,
    startTime: toOptionalDate(incoming.startTime),
    endTime: toOptionalDate(incoming.endTime),
    estimatedEndTime: toOptionalDate(incoming.estimatedEndTime),
    player1Score: hasSetScores
      ? scoreTotals.player1Score
      : (currentSet?.side1 ?? current.player1Score),
    player2Score: hasSetScores
      ? scoreTotals.player2Score
      : (currentSet?.side2 ?? current.player2Score),
    courtId: incoming.court?.id ?? current.courtId,
    court:
      incoming.court && current.court
        ? {
            ...current.court,
            courtNumber: incoming.court.courtNumber,
            courtName: incoming.court.courtName ?? undefined,
          }
        : current.court,
    updatedAt: new Date(incoming.updatedAt),
  };
}

function toOptionalDate(value: string | null) {
  return value ? new Date(value) : undefined;
}
