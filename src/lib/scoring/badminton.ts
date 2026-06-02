import { MatchFormat, MatchSet } from '@/lib/api/types';

/**
 * Front-end mirror of the server-authoritative badminton rules, used only for
 * display correctness and match-point confirmation. The server remains the
 * source of truth for persisted scores.
 *
 * Standard rules: rally to 21, win by 2, hard cap at 30 (30-29 wins).
 */

export interface BadmintonRules {
  pointsToWin: number;
  winBy: number;
  cap: number;
  bestOf: 1 | 3 | 5;
}

export function defaultRules(matchFormat?: MatchFormat | null): BadmintonRules {
  return {
    pointsToWin: 21,
    winBy: 2,
    cap: 30,
    bestOf:
      matchFormat === 'BEST_OF_5' ? 5 : matchFormat === 'BEST_OF_3' ? 3 : 1,
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
    hi >= rules.cap || (hi >= rules.pointsToWin && hi - lo >= rules.winBy);
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
