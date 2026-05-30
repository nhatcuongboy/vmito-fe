import { CourtDirection, Match, Player } from '@/lib/api/types';

export type MatchRepeatMatchType = 'singles' | 'doubles';

export interface MatchRepeatWarningPlayer {
  id: string;
  name?: string;
  playerNumber?: number;
}

export interface MatchRepeatWarningItem {
  key: string;
  players: [MatchRepeatWarningPlayer, MatchRepeatWarningPlayer];
  historyCount: number;
  totalCount: number;
}

export interface MatchRepeatWarningResult {
  hasWarning: boolean;
  repeatedTeammates: MatchRepeatWarningItem[];
  repeatedOpponents: MatchRepeatWarningItem[];
}

type PlayerLike = Pick<Player, 'id' | 'name' | 'playerNumber'> & {
  courtPosition?: number;
  position?: number;
};

interface PositionedPlayer {
  id: string;
  name?: string;
  playerNumber?: number;
  position: number;
}

interface PairGroups {
  pair1: PositionedPlayer[];
  pair2: PositionedPlayer[];
  matchType: MatchRepeatMatchType;
}

const pairKey = (playerId1: string, playerId2: string) =>
  [playerId1, playerId2].sort().join(':');

const toWarningPlayer = (
  player: PositionedPlayer
): MatchRepeatWarningPlayer => ({
  id: player.id,
  name: player.name,
  playerNumber: player.playerNumber,
});

const increment = (counts: Map<string, number>, key: string) => {
  counts.set(key, (counts.get(key) ?? 0) + 1);
};

const getPosition = (player: PlayerLike, fallbackPosition: number) =>
  player.courtPosition ?? player.position ?? fallbackPosition;

const getPairGroups = (
  players: PlayerLike[],
  direction: CourtDirection,
  matchType?: MatchRepeatMatchType
): PairGroups | null => {
  const positionedPlayers: PositionedPlayer[] = players
    .filter((player): player is PlayerLike => Boolean(player?.id))
    .map(
      (player, index): PositionedPlayer => ({
        id: player.id,
        name: player.name,
        playerNumber: player.playerNumber,
        position: getPosition(player, index),
      })
    )
    .sort((a, b) => a.position - b.position);

  const effectiveMatchType =
    matchType ?? (positionedPlayers.length <= 2 ? 'singles' : 'doubles');
  const requiredCount = effectiveMatchType === 'singles' ? 2 : 4;

  if (positionedPlayers.length < requiredCount) {
    return null;
  }

  if (effectiveMatchType === 'singles') {
    return {
      pair1: positionedPlayers.slice(0, 1),
      pair2: positionedPlayers.slice(1, 2),
      matchType: 'singles',
    };
  }

  const playerByPosition = new Map(
    positionedPlayers.map((player) => [player.position, player])
  );

  const pair1Positions =
    direction === CourtDirection.VERTICAL ? [0, 2] : [0, 1];
  const pair2Positions =
    direction === CourtDirection.VERTICAL ? [1, 3] : [2, 3];
  const pair1 = pair1Positions
    .map((position) => playerByPosition.get(position))
    .filter(Boolean) as PositionedPlayer[];
  const pair2 = pair2Positions
    .map((position) => playerByPosition.get(position))
    .filter(Boolean) as PositionedPlayer[];

  if (pair1.length < 2 || pair2.length < 2) {
    return null;
  }

  return { pair1, pair2, matchType: 'doubles' };
};

const addRelations = (
  groups: PairGroups,
  teammateCounts: Map<string, number>,
  opponentCounts: Map<string, number>
) => {
  if (groups.matchType === 'doubles') {
    increment(teammateCounts, pairKey(groups.pair1[0].id, groups.pair1[1].id));
    increment(teammateCounts, pairKey(groups.pair2[0].id, groups.pair2[1].id));
  }

  for (const player1 of groups.pair1) {
    for (const player2 of groups.pair2) {
      increment(opponentCounts, pairKey(player1.id, player2.id));
    }
  }
};

const getMatchPlayers = (match: Match): PlayerLike[] => {
  if (Array.isArray(match.players) && match.players.length > 0) {
    const players: PlayerLike[] = [];

    match.players.forEach((matchPlayer, index) => {
      const playerId = matchPlayer.player?.id ?? matchPlayer.playerId;
      if (!playerId) return;

      players.push({
        id: playerId,
        name: matchPlayer.player?.name,
        playerNumber: matchPlayer.player?.playerNumber,
        courtPosition: matchPlayer.position ?? index,
      });
    });

    return players;
  }

  return [];
};

const buildWarningItems = (
  currentRelations: Array<[PositionedPlayer, PositionedPlayer]>,
  historyCounts: Map<string, number>
): MatchRepeatWarningItem[] =>
  currentRelations
    .map(([player1, player2]) => {
      const key = pairKey(player1.id, player2.id);
      const historyCount = historyCounts.get(key) ?? 0;
      return {
        key,
        players: [toWarningPlayer(player1), toWarningPlayer(player2)] as [
          MatchRepeatWarningPlayer,
          MatchRepeatWarningPlayer,
        ],
        historyCount,
        totalCount: historyCount + 1,
      };
    })
    .filter((item) => item.totalCount > 1)
    .sort((a, b) => b.totalCount - a.totalCount);

export function getMatchRepeatWarning(
  matchHistory: Match[],
  currentPlayers: PlayerLike[],
  direction: CourtDirection = CourtDirection.HORIZONTAL,
  matchType?: MatchRepeatMatchType
): MatchRepeatWarningResult {
  const teammateCounts = new Map<string, number>();
  const opponentCounts = new Map<string, number>();

  for (const match of matchHistory) {
    const historyPlayers = getMatchPlayers(match);
    const groups = getPairGroups(
      historyPlayers,
      match.court?.direction ?? CourtDirection.HORIZONTAL
    );

    if (groups) {
      addRelations(groups, teammateCounts, opponentCounts);
    }
  }

  const currentGroups = getPairGroups(currentPlayers, direction, matchType);
  if (!currentGroups) {
    return {
      hasWarning: false,
      repeatedTeammates: [],
      repeatedOpponents: [],
    };
  }

  const currentTeammates =
    currentGroups.matchType === 'doubles'
      ? ([
          [currentGroups.pair1[0], currentGroups.pair1[1]],
          [currentGroups.pair2[0], currentGroups.pair2[1]],
        ] as Array<[PositionedPlayer, PositionedPlayer]>)
      : [];
  const currentOpponents: Array<[PositionedPlayer, PositionedPlayer]> = [];

  for (const player1 of currentGroups.pair1) {
    for (const player2 of currentGroups.pair2) {
      currentOpponents.push([player1, player2]);
    }
  }

  const repeatedTeammates = buildWarningItems(currentTeammates, teammateCounts);
  const repeatedOpponents = buildWarningItems(currentOpponents, opponentCounts);

  return {
    hasWarning: repeatedTeammates.length > 0 || repeatedOpponents.length > 0,
    repeatedTeammates,
    repeatedOpponents,
  };
}
