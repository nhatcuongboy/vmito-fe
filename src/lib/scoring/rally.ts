import {
  CategoryMatch,
  MatchFormat,
  MatchSet,
  SportType,
} from '@/lib/api/types';
import { getTournamentSportProfile } from '@/lib/tournament/sports';

export interface RallyScoringRules {
  pointsToWin: number;
  winBy: number;
  cap: number | null;
  bestOf: 1 | 3 | 5;
}

type TScoringStage = 'GROUP' | 'KNOCKOUT' | 'FINAL';

const stageOfRound = (round?: string | null): TScoringStage => {
  if (round === 'GROUP') return 'GROUP';
  if (round === 'F') return 'FINAL';
  return 'KNOCKOUT';
};

interface StageScoringCategory {
  matchFormat?: MatchFormat | null;
  pointsToWin?: number | null;
  winByTwo?: boolean | null;
  pointCap?: number | null;
  knockoutPointsToWin?: number | null;
  knockoutWinByTwo?: boolean | null;
  knockoutPointCap?: number | null;
  finalPointsToWin?: number | null;
  finalWinByTwo?: boolean | null;
  finalPointCap?: number | null;
}

type RulesInput =
  | MatchFormat
  | null
  | (Pick<
      CategoryMatch,
      'matchFormat' | 'pointsToWin' | 'winByTwo' | 'pointCap'
    > & {
      round?: string | null;
      category?: StageScoringCategory | null;
    });

function bestOfFromMatchFormat(format?: MatchFormat | null): 1 | 3 | 5 {
  if (format === MatchFormat.BEST_OF_5) return 5;
  if (format === MatchFormat.BEST_OF_3) return 3;
  return 1;
}

export function defaultRules(
  matchOrFormat?: RulesInput,
  sportType?: SportType | null
): RallyScoringRules {
  const profile = getTournamentSportProfile(sportType);
  const fallback = profile.defaultScoring;

  if (matchOrFormat == null || typeof matchOrFormat === 'string') {
    const format = (matchOrFormat ?? fallback.matchFormat) as MatchFormat;
    return {
      pointsToWin: fallback.pointsToWin,
      winBy: fallback.winByTwo ? 2 : 1,
      cap: fallback.pointCap,
      bestOf: bestOfFromMatchFormat(format),
    };
  }

  const match = matchOrFormat;
  const cat = match.category ?? null;
  const stage = stageOfRound(match.round);
  const format = match.matchFormat ?? cat?.matchFormat ?? fallback.matchFormat;

  const resolveCatPoints = (): number => {
    if (!cat) return fallback.pointsToWin;
    if (stage === 'FINAL') {
      return (
        cat.finalPointsToWin ??
        cat.knockoutPointsToWin ??
        cat.pointsToWin ??
        fallback.pointsToWin
      );
    }
    if (stage === 'KNOCKOUT') {
      return cat.knockoutPointsToWin ?? cat.pointsToWin ?? fallback.pointsToWin;
    }
    return cat.pointsToWin ?? fallback.pointsToWin;
  };

  const resolveCatWinByTwo = (): boolean => {
    if (!cat) return fallback.winByTwo;
    if (stage === 'FINAL') {
      return (
        cat.finalWinByTwo ??
        cat.knockoutWinByTwo ??
        cat.winByTwo ??
        fallback.winByTwo
      );
    }
    if (stage === 'KNOCKOUT') {
      return cat.knockoutWinByTwo ?? cat.winByTwo ?? fallback.winByTwo;
    }
    return cat.winByTwo ?? fallback.winByTwo;
  };

  const resolveCatCap = (): number | null => {
    if (!cat) return fallback.pointCap;
    if (stage === 'FINAL') {
      if (cat.finalPointCap !== undefined && cat.finalPointCap !== null) {
        return cat.finalPointCap;
      }
      if (cat.knockoutPointCap !== undefined && cat.knockoutPointCap !== null) {
        return cat.knockoutPointCap;
      }
      return cat.pointCap ?? fallback.pointCap;
    }
    if (stage === 'KNOCKOUT') {
      return cat.knockoutPointCap !== undefined && cat.knockoutPointCap !== null
        ? cat.knockoutPointCap
        : (cat.pointCap ?? fallback.pointCap);
    }
    return cat.pointCap ?? fallback.pointCap;
  };

  return {
    pointsToWin: match.pointsToWin ?? resolveCatPoints(),
    winBy: (match.winByTwo ?? resolveCatWinByTwo()) ? 2 : 1,
    cap:
      match.pointCap !== undefined && match.pointCap !== null
        ? match.pointCap
        : resolveCatCap(),
    bestOf: bestOfFromMatchFormat(format),
  };
}

export function isSetComplete(
  a: number,
  b: number,
  rules: RallyScoringRules
): { complete: boolean; winner: 1 | 2 | null } {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  const complete =
    (rules.cap != null && hi >= rules.cap) ||
    (hi >= rules.pointsToWin && hi - lo >= rules.winBy);
  if (!complete) return { complete: false, winner: null };
  return { complete: true, winner: a > b ? 1 : 2 };
}

export function setWins(
  sets: MatchSet[],
  rules: RallyScoringRules
): { side1: number; side2: number } {
  let side1 = 0;
  let side2 = 0;
  for (const set of sets) {
    const { winner } = isSetComplete(set.player1Score, set.player2Score, rules);
    if (winner === 1) side1++;
    else if (winner === 2) side2++;
  }
  return { side1, side2 };
}

export function setsToWin(rules: RallyScoringRules): number {
  if (rules.bestOf === 5) return 3;
  if (rules.bestOf === 3) return 2;
  return 1;
}

export function isMatchComplete(
  sets: MatchSet[],
  rules: RallyScoringRules
): { complete: boolean; winnerSide: 1 | 2 | null } {
  const { side1, side2 } = setWins(sets, rules);
  const need = setsToWin(rules);
  if (side1 >= need) return { complete: true, winnerSide: 1 };
  if (side2 >= need) return { complete: true, winnerSide: 2 };
  return { complete: false, winnerSide: null };
}

export function isMatchPoint(
  sets: MatchSet[],
  currentSetIndex: number,
  sideToScore: 1 | 2,
  rules: RallyScoringRules
): boolean {
  const current = sets[currentSetIndex];
  if (!current) return false;
  const a = current.player1Score + (sideToScore === 1 ? 1 : 0);
  const b = current.player2Score + (sideToScore === 2 ? 1 : 0);
  const { complete, winner } = isSetComplete(a, b, rules);
  if (!complete || winner !== sideToScore) return false;

  const projected = sets.map((set, index) =>
    index === currentSetIndex
      ? { ...set, player1Score: a, player2Score: b }
      : set
  );
  return isMatchComplete(projected, rules).complete;
}

export function currentSetIndex(sets: MatchSet[]): number {
  return sets.length > 0 ? sets.length - 1 : 0;
}

function newSet(setNumber: number, isDoubles: boolean): MatchSet {
  const base: MatchSet = { setNumber, player1Score: 0, player2Score: 0 };
  if (isDoubles) {
    base.player3Score = 0;
    base.player4Score = 0;
  }
  return base;
}

export function applyDelta(
  sets: MatchSet[],
  side: 1 | 2,
  delta: 1 | -1,
  rules: RallyScoringRules,
  isDoubles: boolean
): MatchSet[] {
  const working: MatchSet[] =
    sets.length > 0 ? sets.map((set) => ({ ...set })) : [newSet(1, isDoubles)];

  if (delta === 1 && isMatchComplete(working, rules).complete) {
    return working;
  }

  const current = working[working.length - 1];
  if (side === 1) {
    current.player1Score = Math.max(0, current.player1Score + delta);
    if (isDoubles) current.player3Score = current.player1Score;
  } else {
    current.player2Score = Math.max(0, current.player2Score + delta);
    if (isDoubles) current.player4Score = current.player2Score;
  }

  const setDone = isSetComplete(
    current.player1Score,
    current.player2Score,
    rules
  ).complete;
  const matchDone = isMatchComplete(working, rules).complete;
  if (delta === 1 && setDone && !matchDone) {
    working.push(newSet(current.setNumber + 1, isDoubles));
  }
  return working;
}

export function buildScoreString(sets: MatchSet[]): string {
  return sets
    .filter(
      (set, index) =>
        set.player1Score > 0 || set.player2Score > 0 || index === 0
    )
    .map((set) => `${set.player1Score}-${set.player2Score}`)
    .join(', ');
}
