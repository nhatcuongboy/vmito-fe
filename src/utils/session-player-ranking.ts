import type { PlayerStatistics } from '@/lib/api/types';

export type PlayerRankingResult = {
  players: PlayerStatistics[];
  pointDifferentialEligibleGroups: Set<string>;
  pointDifferentialTiebreakPlayerIds: Set<string>;
};

const getPrimaryRankingGroupKey = (player: PlayerStatistics) =>
  `${player.winRate}:${player.wins}`;

const comparePrimaryRanking = (
  first: PlayerStatistics,
  second: PlayerStatistics
) => {
  if (second.winRate !== first.winRate) {
    return second.winRate - first.winRate;
  }
  return second.wins - first.wins;
};

const compareRankingRemainder = (
  first: PlayerStatistics,
  second: PlayerStatistics,
  usePointDifferential: boolean
) => {
  if (
    usePointDifferential &&
    second.averagePointDifferential !== first.averagePointDifferential
  ) {
    return (
      (second.averagePointDifferential ?? 0) -
      (first.averagePointDifferential ?? 0)
    );
  }
  if (second.totalMatches !== first.totalMatches) {
    return second.totalMatches - first.totalMatches;
  }
  return (first.name || '').localeCompare(second.name || '');
};

export const rankPlayerStatistics = (
  players: PlayerStatistics[]
): PlayerRankingResult => {
  const primarySorted = [...players].sort(comparePrimaryRanking);
  const rankedPlayers: PlayerStatistics[] = [];
  const pointDifferentialEligibleGroups = new Set<string>();
  const pointDifferentialTiebreakPlayerIds = new Set<string>();

  for (let start = 0; start < primarySorted.length; ) {
    const groupKey = getPrimaryRankingGroupKey(primarySorted[start]);
    let end = start + 1;
    while (
      end < primarySorted.length &&
      getPrimaryRankingGroupKey(primarySorted[end]) === groupKey
    ) {
      end += 1;
    }

    const group = primarySorted.slice(start, end);
    const usePointDifferential =
      group.length > 1 &&
      group.every((player) => player.averagePointDifferential != null);

    if (usePointDifferential) {
      pointDifferentialEligibleGroups.add(groupKey);
      if (
        new Set(group.map((player) => player.averagePointDifferential)).size > 1
      ) {
        group.forEach((player) =>
          pointDifferentialTiebreakPlayerIds.add(player.playerId)
        );
      }
    }

    rankedPlayers.push(
      ...group.sort((first, second) =>
        compareRankingRemainder(first, second, usePointDifferential)
      )
    );
    start = end;
  }

  return {
    players: rankedPlayers,
    pointDifferentialEligibleGroups,
    pointDifferentialTiebreakPlayerIds,
  };
};

export const arePlayersTiedForRanking = (
  first: PlayerStatistics,
  second: PlayerStatistics,
  ranking: PlayerRankingResult
) => {
  if (
    first.winRate !== second.winRate ||
    first.wins !== second.wins ||
    first.totalMatches !== second.totalMatches
  ) {
    return false;
  }

  const groupKey = getPrimaryRankingGroupKey(first);
  return (
    !ranking.pointDifferentialEligibleGroups.has(groupKey) ||
    first.averagePointDifferential === second.averagePointDifferential
  );
};
