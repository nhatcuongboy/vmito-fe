import { CategoryMatch, MatchFormat, MatchSet } from '@/lib/api/types';

/**
 * Front-end mirror of the server-authoritative badminton rules, used only for
 * display correctness and match-point confirmation. The server remains the
 * source of truth for persisted scores.
 *
 * Default rules: rally to 21, win by 2, hard cap at 30 (30-29 wins). Host can
 * override per category (or per match) — see `defaultRules`.
 */

export interface BadmintonRules {
  pointsToWin: number;
  winBy: number;
  cap: number | null;
  bestOf: 1 | 3 | 5;
}

const DEFAULT_POINTS_TO_WIN = 21;
const DEFAULT_CAP = 30;

type TScoringStage = 'GROUP' | 'KNOCKOUT' | 'FINAL';

/**
 * Map a match round label to its scoring stage. Mirrors the server-side
 * `stageOfRound` in `categories.service.ts`:
 * - 'GROUP' (round-robin pool) → GROUP
 * - 'F' (final) → FINAL
 * - everything else (R128/R64/R32/R16/QF/SF/3RD) → KNOCKOUT
 */
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

/**
 * Resolve the active rules for a match. Match-level overrides win, then the
 * stage-specific category settings (final → knockout → base), then the BWF
 * defaults. Mirrors the server's `scoringRulesOf`.
 */
export function defaultRules(
  matchOrFormat?:
    | MatchFormat
    | null
    | (Pick<
        CategoryMatch,
        'matchFormat' | 'pointsToWin' | 'winByTwo' | 'pointCap'
      > & {
        round?: string | null;
        category?: StageScoringCategory | null;
      })
): BadmintonRules {
  // Back-compat: legacy callers pass just a MatchFormat string.
  if (matchOrFormat == null || typeof matchOrFormat === 'string') {
    const format = (matchOrFormat ?? undefined) as MatchFormat | undefined;
    return {
      pointsToWin: DEFAULT_POINTS_TO_WIN,
      winBy: 2,
      cap: DEFAULT_CAP,
      bestOf: format === 'BEST_OF_5' ? 5 : format === 'BEST_OF_3' ? 3 : 1,
    };
  }

  const match = matchOrFormat;
  const cat = match.category ?? null;
  const stage = stageOfRound(match.round);

  const format =
    match.matchFormat ?? cat?.matchFormat ?? ('BEST_OF_1' as MatchFormat);

  // Stage-aware resolution of the category-level scoring rules.
  const resolveCatPoints = (): number => {
    if (!cat) return DEFAULT_POINTS_TO_WIN;
    if (stage === 'FINAL') {
      return (
        cat.finalPointsToWin ??
        cat.knockoutPointsToWin ??
        cat.pointsToWin ??
        DEFAULT_POINTS_TO_WIN
      );
    }
    if (stage === 'KNOCKOUT') {
      return (
        cat.knockoutPointsToWin ?? cat.pointsToWin ?? DEFAULT_POINTS_TO_WIN
      );
    }
    return cat.pointsToWin ?? DEFAULT_POINTS_TO_WIN;
  };

  const resolveCatWinByTwo = (): boolean => {
    if (!cat) return true;
    if (stage === 'FINAL') {
      return cat.finalWinByTwo ?? cat.knockoutWinByTwo ?? cat.winByTwo ?? true;
    }
    if (stage === 'KNOCKOUT') {
      return cat.knockoutWinByTwo ?? cat.winByTwo ?? true;
    }
    return cat.winByTwo ?? true;
  };

  // Returns null when the stage resolves to "no cap".
  const resolveCatCap = (): number | null => {
    if (!cat) return null;
    if (stage === 'FINAL') {
      if (cat.finalPointCap !== undefined && cat.finalPointCap !== null) {
        return cat.finalPointCap;
      }
      if (cat.knockoutPointCap !== undefined && cat.knockoutPointCap !== null) {
        return cat.knockoutPointCap;
      }
      return cat.pointCap ?? null;
    }
    if (stage === 'KNOCKOUT') {
      return cat.knockoutPointCap !== undefined && cat.knockoutPointCap !== null
        ? cat.knockoutPointCap
        : (cat.pointCap ?? null);
    }
    return cat.pointCap ?? null;
  };

  const pointsToWin = match.pointsToWin ?? resolveCatPoints();
  const winBy = (match.winByTwo ?? resolveCatWinByTwo()) ? 2 : 1;
  const capRaw =
    match.pointCap !== undefined && match.pointCap !== null
      ? match.pointCap
      : cat
        ? resolveCatCap()
        : DEFAULT_CAP;

  return {
    pointsToWin,
    winBy,
    cap: capRaw,
    bestOf: format === 'BEST_OF_5' ? 5 : format === 'BEST_OF_3' ? 3 : 1,
  };
}

export function isSetComplete(
  a: number,
  b: number,
  rules: BadmintonRules
): { complete: boolean; winner: 1 | 2 | null } {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  const complete =
    (rules.cap != null && hi >= rules.cap) ||
    (hi >= rules.pointsToWin && hi - lo >= rules.winBy);
  if (!complete) return { complete: false, winner: null };
  return { complete: true, winner: a > b ? 1 : 2 };
}

/** Completed-set wins per side. */
export function setWins(
  sets: MatchSet[],
  rules: BadmintonRules
): { side1: number; side2: number } {
  let side1 = 0;
  let side2 = 0;
  for (const s of sets) {
    const { winner } = isSetComplete(s.player1Score, s.player2Score, rules);
    if (winner === 1) side1++;
    else if (winner === 2) side2++;
  }
  return { side1, side2 };
}

export function setsToWin(rules: BadmintonRules): number {
  if (rules.bestOf === 5) return 3;
  if (rules.bestOf === 3) return 2;
  return 1;
}

export function isMatchComplete(
  sets: MatchSet[],
  rules: BadmintonRules
): { complete: boolean; winnerSide: 1 | 2 | null } {
  const { side1, side2 } = setWins(sets, rules);
  const need = setsToWin(rules);
  if (side1 >= need) return { complete: true, winnerSide: 1 };
  if (side2 >= need) return { complete: true, winnerSide: 2 };
  return { complete: false, winnerSide: null };
}

/**
 * True when adding one point to `sideToScore` would both complete the current
 * set AND clinch the match (used to confirm-on-match-point in the UI).
 */
export function isMatchPoint(
  sets: MatchSet[],
  currentSetIndex: number,
  sideToScore: 1 | 2,
  rules: BadmintonRules
): boolean {
  const current = sets[currentSetIndex];
  if (!current) return false;
  const a = current.player1Score + (sideToScore === 1 ? 1 : 0);
  const b = current.player2Score + (sideToScore === 2 ? 1 : 0);
  const { complete, winner } = isSetComplete(a, b, rules);
  if (!complete || winner !== sideToScore) return false;

  // Would this completed set clinch the match?
  const projected = sets.map((s, i) =>
    i === currentSetIndex ? { ...s, player1Score: a, player2Score: b } : s
  );
  return isMatchComplete(projected, rules).complete;
}

/** Index of the in-progress set (last set), or 0 when there are no sets yet. */
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

/**
 * Optimistic mirror of the server's applyDelta — used to update the referee's
 * local display instantly before the PATCH response arrives. Returns the input
 * unchanged when the match is already decided (the server is authoritative).
 */
export function applyDelta(
  sets: MatchSet[],
  side: 1 | 2,
  delta: 1 | -1,
  rules: BadmintonRules,
  isDoubles: boolean
): MatchSet[] {
  const working: MatchSet[] =
    sets.length > 0 ? sets.map((s) => ({ ...s })) : [newSet(1, isDoubles)];

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

/** Display string e.g. "21-19, 18-21, 21-15". */
export function buildScoreString(sets: MatchSet[]): string {
  return sets
    .filter((s, idx) => s.player1Score > 0 || s.player2Score > 0 || idx === 0)
    .map((s) => `${s.player1Score}-${s.player2Score}`)
    .join(', ');
}
