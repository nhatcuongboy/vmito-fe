import { MatchFormat, SportType } from '@/lib/api/types';

export interface RallyScoringDefaults {
  pointsToWin: number;
  winByTwo: boolean;
  pointCap: number | null;
  matchFormat: MatchFormat;
}

export interface ScoringPreset extends RallyScoringDefaults {
  id: string;
}

export interface TournamentSportProfile {
  sportType: SportType;
  label: string;
  defaultMatchDuration: number;
  defaultScoring: RallyScoringDefaults;
  scoringPresets: readonly ScoringPreset[];
  labels: {
    court: string;
    official: string;
  };
}

const BADMINTON_PRESETS: readonly ScoringPreset[] = [
  {
    id: 'BWF_21',
    pointsToWin: 21,
    winByTwo: true,
    pointCap: 30,
    matchFormat: MatchFormat.BEST_OF_3,
  },
  {
    id: 'CLASSIC_15',
    pointsToWin: 15,
    winByTwo: true,
    pointCap: null,
    matchFormat: MatchFormat.BEST_OF_3,
  },
  {
    id: 'RALLY_15',
    pointsToWin: 15,
    winByTwo: true,
    pointCap: 21,
    matchFormat: MatchFormat.BEST_OF_3,
  },
  {
    id: 'SHORT_11',
    pointsToWin: 11,
    winByTwo: true,
    pointCap: 15,
    matchFormat: MatchFormat.BEST_OF_3,
  },
];

const PICKLEBALL_PRESETS: readonly ScoringPreset[] = [
  {
    id: 'PICKLEBALL_11',
    pointsToWin: 11,
    winByTwo: true,
    pointCap: null,
    matchFormat: MatchFormat.BEST_OF_1,
  },
  {
    id: 'PICKLEBALL_15',
    pointsToWin: 15,
    winByTwo: true,
    pointCap: null,
    matchFormat: MatchFormat.BEST_OF_1,
  },
  {
    id: 'PICKLEBALL_21',
    pointsToWin: 21,
    winByTwo: true,
    pointCap: null,
    matchFormat: MatchFormat.BEST_OF_1,
  },
];

export const TOURNAMENT_SPORT_PROFILES: Record<
  SportType,
  TournamentSportProfile
> = {
  [SportType.BADMINTON]: {
    sportType: SportType.BADMINTON,
    label: 'Badminton',
    defaultMatchDuration: 30,
    defaultScoring: BADMINTON_PRESETS[0],
    scoringPresets: BADMINTON_PRESETS,
    labels: {
      court: 'Court',
      official: 'Umpire',
    },
  },
  [SportType.PICKLEBALL]: {
    sportType: SportType.PICKLEBALL,
    label: 'Pickleball',
    defaultMatchDuration: 20,
    defaultScoring: PICKLEBALL_PRESETS[0],
    scoringPresets: PICKLEBALL_PRESETS,
    labels: {
      court: 'Court',
      official: 'Referee',
    },
  },
};

export function normalizeSportType(sportType?: SportType | null): SportType {
  return sportType === SportType.PICKLEBALL
    ? SportType.PICKLEBALL
    : SportType.BADMINTON;
}

export function getTournamentSportProfile(
  sportType?: SportType | null
): TournamentSportProfile {
  return TOURNAMENT_SPORT_PROFILES[normalizeSportType(sportType)];
}
