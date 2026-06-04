import {
  CategoryMatch,
  CategoryStandingsResponse,
  GroupStanding,
  MatchStatus,
} from '@/lib/api/types';
import { getRegistrationLabel, getTeamLabel } from '@/lib/tournament/teamLabel';

// 1 = champion, 2 = runner-up, 3 = third place.
export type PodiumRank = 1 | 2 | 3;

export interface PodiumEntry {
  rank: PodiumRank;
  label: string;
  playerNames?: string;
  detail?: string; // e.g. final score
}

// decided = champion confirmed; provisional = leader while a round robin is
// still running; in_progress = bracket exists but the final is not played;
// empty = nothing has been played yet.
export type PodiumState = 'decided' | 'provisional' | 'in_progress' | 'empty';

export interface CategoryPodium<C extends { id: string }> {
  category: C;
  state: PodiumState;
  entries: PodiumEntry[];
}

// A standing only counts once a registration has actually played / earned
// something — mirrors the result-detection used by the standings tab.
function hasStandingResult(standing: GroupStanding) {
  return (
    standing.matchesPlayed > 0 ||
    standing.matchesWon > 0 ||
    standing.matchesLost > 0 ||
    standing.matchesDrawn > 0 ||
    (standing.matchesForfeited ?? 0) > 0 ||
    (standing.matchesCancelled ?? 0) > 0 ||
    standing.points !== 0 ||
    standing.pointsFor !== 0 ||
    standing.pointDifference !== 0
  );
}

function compareStandings(first: GroupStanding, second: GroupStanding) {
  return (
    second.points - first.points ||
    second.pointDifference - first.pointDifference ||
    second.pointsFor - first.pointsFor ||
    second.matchesWon - first.matchesWon ||
    second.matchesPlayed - first.matchesPlayed
  );
}

function getRegistrationPlayerNames(
  match: CategoryMatch,
  position: number
): string | undefined {
  const registration = match.participants?.find(
    (participant) => participant.position === position
  )?.categoryRegistration;

  if (!registration) return undefined;

  return getRegistrationLabel(registration, { showPlayerNames: true });
}

/**
 * Resolve the podium (champion / runner-up / third place) for one category
 * from its matches and standings. Handles both elimination brackets (champion
 * is the winner of the final) and pure round robins (top of the standings).
 */
export function computePodium<C extends { id: string }>(
  category: C,
  matches: CategoryMatch[],
  standings: CategoryStandingsResponse
): CategoryPodium<C> {
  const categoryMatches = matches.filter(
    (match) => match.categoryId === category.id
  );
  const playoffMatches = categoryMatches.filter((match) => !match.groupId);

  // ── Elimination / playoff bracket: champion is the winner of the final. ──
  if (playoffMatches.length > 0) {
    const finalMatch = playoffMatches.find(
      (match) => match.round.toUpperCase() === 'F'
    );
    const thirdMatch = playoffMatches.find(
      (match) => match.round.toUpperCase() === '3RD'
    );

    if (
      finalMatch &&
      finalMatch.status === MatchStatus.FINISHED &&
      finalMatch.winnerId
    ) {
      const championPosition =
        finalMatch.participants?.find(
          (participant) =>
            participant.categoryRegistrationId === finalMatch.winnerId
        )?.position ?? 1;
      const runnerUpPosition = championPosition === 1 ? 2 : 1;

      const entries: PodiumEntry[] = [
        {
          rank: 1,
          label: getTeamLabel(finalMatch, championPosition),
          playerNames: getRegistrationPlayerNames(finalMatch, championPosition),
          detail: finalMatch.score,
        },
        {
          rank: 2,
          label: getTeamLabel(finalMatch, runnerUpPosition),
          playerNames: getRegistrationPlayerNames(finalMatch, runnerUpPosition),
        },
      ];

      if (
        thirdMatch &&
        thirdMatch.status === MatchStatus.FINISHED &&
        thirdMatch.winnerId
      ) {
        const thirdPosition =
          thirdMatch.participants?.find(
            (participant) =>
              participant.categoryRegistrationId === thirdMatch.winnerId
          )?.position ?? 1;
        entries.push({
          rank: 3,
          label: getTeamLabel(thirdMatch, thirdPosition),
          playerNames: getRegistrationPlayerNames(thirdMatch, thirdPosition),
          detail: thirdMatch.score,
        });
      }

      return { category, state: 'decided', entries };
    }

    // Bracket exists but the final has not been decided yet.
    return { category, state: 'in_progress', entries: [] };
  }

  // ── Round robin only: podium is the top of the overall standings. ──
  const rows = standings.flatMap((group) => group.standings);
  const playedRows = rows.filter(hasStandingResult);

  if (playedRows.length === 0) {
    return { category, state: 'empty', entries: [] };
  }

  const ranked = [...rows].sort(compareStandings).slice(0, 3);
  const entries: PodiumEntry[] = ranked.map((row, index) => ({
    rank: (index + 1) as PodiumRank,
    label: getRegistrationLabel(row.registration),
    playerNames: getRegistrationLabel(row.registration, {
      showPlayerNames: true,
    }),
  }));

  // Decided only when every group match has finished; otherwise the leader is
  // still provisional.
  const groupMatches = categoryMatches.filter((match) => match.groupId);
  const allFinished =
    groupMatches.length > 0 &&
    groupMatches.every(
      (match) =>
        match.status === MatchStatus.FINISHED ||
        match.status === MatchStatus.CANCELLED
    );

  return {
    category,
    state: allFinished ? 'decided' : 'provisional',
    entries,
  };
}
