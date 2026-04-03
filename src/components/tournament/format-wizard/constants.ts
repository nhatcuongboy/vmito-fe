import {
  TournamentFormatType,
  FormatTemplate,
  TiebreakerItem,
  StatisticItem,
  StandingsColumn,
  RoundRobinConfig,
  SingleEliminationConfig,
  RoundRobinToSEConfig,
} from './types';

export const FORMAT_TEMPLATES: FormatTemplate[] = [
  {
    id: TournamentFormatType.ROUND_ROBIN,
    filterCategories: [TournamentFormatType.ROUND_ROBIN],
  },
  {
    id: TournamentFormatType.SINGLE_ELIMINATION,
    filterCategories: [TournamentFormatType.SINGLE_ELIMINATION],
  },
  {
    id: TournamentFormatType.ROUND_ROBIN_TO_SE,
    filterCategories: [
      TournamentFormatType.ROUND_ROBIN,
      TournamentFormatType.SINGLE_ELIMINATION,
    ],
  },
];

export const DEFAULT_TIEBREAKERS: TiebreakerItem[] = [
  {
    id: 'total_points',
    label: 'totalPoints',
    description: 'totalPointsDesc',
  },
  {
    id: 'game_differential',
    label: 'gameDifferential',
    description: 'gameDifferentialDesc',
  },
  {
    id: 'total_wins',
    label: 'totalWins',
    description: 'totalWinsDesc',
  },
  {
    id: 'point_differential',
    label: 'pointDifferential',
    description: 'pointDifferentialDesc',
  },
];

export const AVAILABLE_TIEBREAKERS: TiebreakerItem[] = [
  ...DEFAULT_TIEBREAKERS,
  {
    id: 'head_to_head',
    label: 'headToHead',
    description: 'headToHeadDesc',
  },
  {
    id: 'points_for',
    label: 'pointsFor',
    description: 'pointsForDesc',
  },
  {
    id: 'points_against',
    label: 'pointsAgainst',
    description: 'pointsAgainstDesc',
  },
];

export const DEFAULT_STATISTICS: StatisticItem[] = [
  { id: 'points', label: 'points', abbreviation: 'P', required: true },
];

export const AVAILABLE_STATISTICS: StatisticItem[] = [
  ...DEFAULT_STATISTICS,
  { id: 'games_won', label: 'gamesWon', abbreviation: 'GW' },
  { id: 'games_lost', label: 'gamesLost', abbreviation: 'GL' },
  { id: 'game_differential', label: 'gameDifferential', abbreviation: 'GD' },
];

export const DEFAULT_STANDINGS_COLUMNS: StandingsColumn[] = [
  { id: 'matches_played', label: 'matchesPlayed', abbreviation: 'MP' },
  { id: 'wins', label: 'wins', abbreviation: 'W' },
  { id: 'ties', label: 'ties', abbreviation: 'T' },
  { id: 'losses', label: 'losses', abbreviation: 'L' },
  {
    id: 'points_differential',
    label: 'pointsDifferential',
    abbreviation: '+/-',
  },
];

export const AVAILABLE_STANDINGS_COLUMNS: StandingsColumn[] = [
  ...DEFAULT_STANDINGS_COLUMNS,
  { id: 'games_won', label: 'gamesWon', abbreviation: 'GW' },
  { id: 'games_lost', label: 'gamesLost', abbreviation: 'GL' },
  { id: 'game_differential', label: 'gameDifferential', abbreviation: 'GD' },
];

export const DEFAULT_RR_CONFIG: RoundRobinConfig = {
  pointsEarning: 'match_results',
  winPoints: 2,
  tiePoints: 1,
  lossPoints: 0,
  cancelledMatchPoints: 0,
  gameWinPoints: 0,
  gameLossPoints: 0,
  forfeitWinPoints: 0,
  forfeitLossPoints: 0,
  tiebreakers: [...DEFAULT_TIEBREAKERS],
  statistics: [...DEFAULT_STATISTICS],
  standingsColumns: [...DEFAULT_STANDINGS_COLUMNS],
};

export const DEFAULT_SE_CONFIG: SingleEliminationConfig = {
  seedingMethod: 'manual',
  matchFormat: 'BEST_OF_3',
  thirdPlaceMatch: false,
};

export const DEFAULT_RR_TO_SE_CONFIG: RoundRobinToSEConfig = {
  roundRobin: { ...DEFAULT_RR_CONFIG },
  qualifiersPerGroup: 2,
  eliminationMatchFormat: 'BEST_OF_3',
  eliminationSeedingMethod: 'manual',
};

export function getDefaultConfig(
  format: TournamentFormatType
): RoundRobinConfig | SingleEliminationConfig | RoundRobinToSEConfig {
  switch (format) {
    case TournamentFormatType.ROUND_ROBIN:
      return {
        ...DEFAULT_RR_CONFIG,
        tiebreakers: [...DEFAULT_TIEBREAKERS],
        statistics: [...DEFAULT_STATISTICS],
        standingsColumns: [...DEFAULT_STANDINGS_COLUMNS],
      };
    case TournamentFormatType.SINGLE_ELIMINATION:
      return { ...DEFAULT_SE_CONFIG };
    case TournamentFormatType.ROUND_ROBIN_TO_SE:
      return {
        ...DEFAULT_RR_TO_SE_CONFIG,
        roundRobin: {
          ...DEFAULT_RR_CONFIG,
          tiebreakers: [...DEFAULT_TIEBREAKERS],
          statistics: [...DEFAULT_STATISTICS],
          standingsColumns: [...DEFAULT_STANDINGS_COLUMNS],
        },
      };
  }
}
