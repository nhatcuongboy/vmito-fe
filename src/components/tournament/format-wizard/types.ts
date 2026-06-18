export enum TournamentFormatType {
  ROUND_ROBIN = 'ROUND_ROBIN',
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  ROUND_ROBIN_TO_SE = 'ROUND_ROBIN_TO_SE',
  DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
}

export type FilterCategory = TournamentFormatType | null;

export interface TiebreakerItem {
  id: string;
  label: string;
  description: string;
}

export interface StatisticItem {
  id: string;
  label: string;
  abbreviation: string;
  required?: boolean;
}

export interface StandingsColumn {
  id: string;
  label: string;
  abbreviation: string;
}

export interface RoundRobinConfig {
  pointsEarning: 'match_results' | 'manual' | 'tiebreakers_only';
  winPoints: number;
  tiePoints: number;
  lossPoints: number;
  cancelledMatchPoints: number;
  gameWinPoints: number;
  gameLossPoints: number;
  forfeitWinPoints: number;
  forfeitLossPoints: number;
  tiebreakers: TiebreakerItem[];
  headToHeadTiebreakers: TiebreakerItem[];
  statistics: StatisticItem[];
  standingsColumns: StandingsColumn[];
}

export type MatchFormatValue = 'BEST_OF_1' | 'BEST_OF_3' | 'BEST_OF_5';

/** Knockout round labels used as keys for per-round format overrides. */
export type KnockoutRound = 'R16' | 'QF' | 'SF' | 'F' | '3RD';

/** Optional per-round match-format overrides (falls back to the base format). */
export type RoundFormats = Partial<Record<KnockoutRound, MatchFormatValue>>;

export interface SingleEliminationConfig {
  seedingMethod: 'manual' | 'random' | 'ranking';
  matchFormat: MatchFormatValue;
  thirdPlaceMatch: boolean;
  /** Per-round format overrides; rounds not listed use `matchFormat`. */
  roundFormats?: RoundFormats;
}

export interface DoubleEliminationConfig {
  seedingMethod: 'manual' | 'random' | 'ranking';
  matchFormat: MatchFormatValue;
  /**
   * When true, the lower-bracket champion must beat the upper-bracket champion
   * twice (a bracket-reset / second grand final is created).
   */
  isTrueDoubleElimination: boolean;
  /** Per-round format overrides; rounds not listed use `matchFormat`. */
  roundFormats?: RoundFormats;
}

export interface RoundRobinToSEConfig {
  roundRobin: RoundRobinConfig;
  qualifiersPerGroup: number;
  eliminationMatchFormat: MatchFormatValue;
  eliminationSeedingMethod: 'manual' | 'random' | 'ranking';
  /** Per-round format overrides; rounds not listed use `eliminationMatchFormat`. */
  roundFormats?: RoundFormats;
}

export type FormatConfig =
  | RoundRobinConfig
  | SingleEliminationConfig
  | RoundRobinToSEConfig
  | DoubleEliminationConfig;

export interface FormatTemplate {
  id: TournamentFormatType;
  filterCategories: TournamentFormatType[];
}

export interface FormatWizardState {
  currentStep: 1 | 2 | 3 | 4;
  selectedFormat: TournamentFormatType | null;
  config: FormatConfig | null;
  filterCategory: FilterCategory;
}

export type WizardAction =
  | { type: 'SET_STEP'; step: 1 | 2 | 3 | 4 }
  | { type: 'SELECT_FORMAT'; format: TournamentFormatType }
  | { type: 'UPDATE_CONFIG'; config: FormatConfig }
  | { type: 'SET_FILTER'; category: FilterCategory }
  | { type: 'RESET' };

/** Returns the total number of steps based on the selected format */
export function getTotalSteps(format: TournamentFormatType | null): number {
  // ROUND_ROBIN_TO_SE has an extra step: RR config + Playoffs config
  if (format === TournamentFormatType.ROUND_ROBIN_TO_SE) return 4;
  return 3;
}

/** Returns true if the given step is the confirmation (last) step */
export function isConfirmStep(
  step: number,
  format: TournamentFormatType | null
): boolean {
  return step === getTotalSteps(format);
}
