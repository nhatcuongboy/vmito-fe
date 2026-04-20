export enum TournamentFormatType {
  ROUND_ROBIN = 'ROUND_ROBIN',
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  ROUND_ROBIN_TO_SE = 'ROUND_ROBIN_TO_SE',
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

export interface SingleEliminationConfig {
  seedingMethod: 'manual' | 'random' | 'ranking';
  matchFormat: 'BEST_OF_1' | 'BEST_OF_3';
  thirdPlaceMatch: boolean;
}

export interface RoundRobinToSEConfig {
  roundRobin: RoundRobinConfig;
  qualifiersPerGroup: number;
  eliminationMatchFormat: 'BEST_OF_1' | 'BEST_OF_3';
  eliminationSeedingMethod: 'manual' | 'random' | 'ranking';
}

export type FormatConfig =
  | RoundRobinConfig
  | SingleEliminationConfig
  | RoundRobinToSEConfig;

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
