import {
  TournamentFormatType,
  FormatTemplate,
  TiebreakerItem,
  StatisticItem,
  StandingsColumn,
  RoundRobinConfig,
  SingleEliminationConfig,
  RoundRobinToSEConfig,
  DoubleEliminationConfig,
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
    id: TournamentFormatType.DOUBLE_ELIMINATION,
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
    id: 'matchups',
    label: 'matchups',
    description: 'matchupsDesc',
  },
  {
    id: 'average_game_differential',
    label: 'averageGameDifferential',
    description: 'averageGameDifferentialDesc',
  },
  {
    id: 'most_games_for',
    label: 'mostGamesFor',
    description: 'mostGamesForDesc',
  },
  {
    id: 'highest_average_games_for',
    label: 'highestAverageGamesFor',
    description: 'highestAverageGamesForDesc',
  },
  {
    id: 'least_games_against',
    label: 'leastGamesAgainst',
    description: 'leastGamesAgainstDesc',
  },
  {
    id: 'lowest_average_games_against',
    label: 'lowestAverageGamesAgainst',
    description: 'lowestAverageGamesAgainstDesc',
  },
  {
    id: 'least_matches_forfeited',
    label: 'leastMatchesForfeited',
    description: 'leastMatchesForfeitedDesc',
  },
  {
    id: 'least_losses',
    label: 'leastLosses',
    description: 'leastLossesDesc',
  },
  {
    id: 'highest_game_ratio',
    label: 'highestGameRatio',
    description: 'highestGameRatioDesc',
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
  {
    id: 'point_differential_detail',
    label: 'pointDifferentialDetail',
    description: 'pointDifferentialDetailDesc',
  },
  {
    id: 'average_point_differential',
    label: 'averagePointDifferential',
    description: 'averagePointDifferentialDesc',
  },
  {
    id: 'least_points_against',
    label: 'leastPointsAgainst',
    description: 'leastPointsAgainstDesc',
  },
  {
    id: 'lowest_average_points_against',
    label: 'lowestAveragePointsAgainst',
    description: 'lowestAveragePointsAgainstDesc',
  },
  {
    id: 'most_points_for',
    label: 'mostPointsFor',
    description: 'mostPointsForDesc',
  },
  {
    id: 'highest_average_points_for',
    label: 'highestAveragePointsFor',
    description: 'highestAveragePointsForDesc',
  },
];

export const DEFAULT_STATISTICS: StatisticItem[] = [
  { id: 'points', label: 'points', abbreviation: 'P', required: true },
];

export const AVAILABLE_STATISTICS: StatisticItem[] = [
  ...DEFAULT_STATISTICS,
  { id: 'games_won', label: 'gamesWon', abbreviation: 'GW' },
  { id: 'games_lost', label: 'gamesLost', abbreviation: 'GL' },
  { id: 'games_played', label: 'gamesPlayed', abbreviation: 'GP' },
  { id: 'game_differential', label: 'gameDifferential', abbreviation: 'GD' },
  { id: 'points_for_stat', label: 'pointsForStat', abbreviation: 'PF' },
  { id: 'points_against_stat', label: 'pointsAgainstStat', abbreviation: 'PA' },
  {
    id: 'points_differential_stat',
    label: 'pointsDifferentialStat',
    abbreviation: '+/-',
  },
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
  { id: 'cancelled', label: 'cancelled', abbreviation: 'C' },
  { id: 'forfeits', label: 'forfeits', abbreviation: 'F' },
  { id: 'games_ratio', label: 'gamesRatio', abbreviation: 'GW:GL' },
  { id: 'games_won', label: 'gamesWon', abbreviation: 'GW' },
  { id: 'games_lost', label: 'gamesLost', abbreviation: 'GL' },
  { id: 'games_played', label: 'gamesPlayed', abbreviation: 'GP' },
  { id: 'game_differential', label: 'gameDifferential', abbreviation: 'GD' },
  { id: 'points_for_col', label: 'pointsForCol', abbreviation: 'PF' },
  { id: 'points_against_col', label: 'pointsAgainstCol', abbreviation: 'PA' },
];

export const DEFAULT_RR_CONFIG: RoundRobinConfig = {
  pointsEarning: 'match_results',
  winPoints: 2,
  tiePoints: 0,
  lossPoints: 0,
  cancelledMatchPoints: 0,
  gameWinPoints: 0,
  gameLossPoints: 0,
  forfeitWinPoints: 0,
  forfeitLossPoints: 0,
  tiebreakers: [...DEFAULT_TIEBREAKERS],
  headToHeadTiebreakers: [],
  statistics: [...DEFAULT_STATISTICS],
  standingsColumns: [...DEFAULT_STANDINGS_COLUMNS],
};

export const DEFAULT_SE_CONFIG: SingleEliminationConfig = {
  seedingMethod: 'manual',
  matchFormat: 'BEST_OF_3',
  thirdPlaceMatch: false,
};

export const DEFAULT_DE_CONFIG: DoubleEliminationConfig = {
  seedingMethod: 'manual',
  matchFormat: 'BEST_OF_3',
  isTrueDoubleElimination: true,
};

export const DEFAULT_RR_TO_SE_CONFIG: RoundRobinToSEConfig = {
  roundRobin: { ...DEFAULT_RR_CONFIG },
  qualifiersPerGroup: 2,
  eliminationMatchFormat: 'BEST_OF_3',
  eliminationSeedingMethod: 'manual',
};

export function getDefaultConfig(
  format: TournamentFormatType
):
  | RoundRobinConfig
  | SingleEliminationConfig
  | RoundRobinToSEConfig
  | DoubleEliminationConfig {
  switch (format) {
    case TournamentFormatType.ROUND_ROBIN:
      return {
        ...DEFAULT_RR_CONFIG,
        tiebreakers: [...DEFAULT_TIEBREAKERS],
        headToHeadTiebreakers: [],
        statistics: [...DEFAULT_STATISTICS],
        standingsColumns: [...DEFAULT_STANDINGS_COLUMNS],
      };
    case TournamentFormatType.SINGLE_ELIMINATION:
      return { ...DEFAULT_SE_CONFIG };
    case TournamentFormatType.DOUBLE_ELIMINATION:
      return { ...DEFAULT_DE_CONFIG };
    case TournamentFormatType.ROUND_ROBIN_TO_SE:
      return {
        ...DEFAULT_RR_TO_SE_CONFIG,
        roundRobin: {
          ...DEFAULT_RR_CONFIG,
          tiebreakers: [...DEFAULT_TIEBREAKERS],
          headToHeadTiebreakers: [],
          statistics: [...DEFAULT_STATISTICS],
          standingsColumns: [...DEFAULT_STANDINGS_COLUMNS],
        },
      };
  }
}
