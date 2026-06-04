import { Category, CategoryFormat, CategoryMatch } from '@/lib/api/types';
import { getFeederMatchNumber, getRegistrationLabel } from './teamLabel';

// Left-to-right column order of an elimination bracket (the 3rd-place match is
// handled separately as a trailing consolation column).
export const ROUND_ORDER = ['R128', 'R64', 'R32', 'R16', 'QF', 'SF', 'F'];
export const THIRD_PLACE_ROUND = '3RD';
const POOL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/**
 * Localized label producers for bracket slots. Decouples the pure slot logic
 * from any specific i18n namespace — each caller builds this from its own
 * translator (see usePlayoffSlotLabels).
 */
export interface SlotLabels {
  /** "Winner of {match}" for the given feeder match number. */
  winnerOf: (matchNumber: number) => string;
  /** "Loser of {match}" for the given feeder match number. */
  loserOf: (matchNumber: number) => string;
  /** "{rank} Pool {pool}", rank already formatted (e.g. "1st" / "Nhất"). */
  nthPoolLabel: (rank: string, pool: string) => string;
  /** Localized ordinal for a 0-based rank (0 → "1st" / "Nhất"). */
  ordinal: (rankZeroBased: number) => string;
  /** "BYE" */
  bye: () => string;
  /** "TBD" / "Chưa xác định" */
  tbd: () => string;
}

export function nextPowerOf2(n: number): number {
  let power = 1;
  while (power < n) power *= 2;
  return power;
}

export function getRoundCode(roundIndex: number, totalRounds: number): string {
  const fromFinal = totalRounds - 1 - roundIndex;
  if (fromFinal === 0) return 'F';
  if (fromFinal === 1) return 'SF';
  if (fromFinal === 2) return 'QF';
  return `R${2 ** (fromFinal + 1)}`;
}

function generateAdvancingSlots(
  groupCount: number,
  winnersPerGroup: number,
  labels: SlotLabels
): string[] {
  const slots: string[] = [];
  for (let rank = 0; rank < winnersPerGroup; rank++) {
    for (let groupIndex = 0; groupIndex < groupCount; groupIndex++) {
      slots.push(
        labels.nthPoolLabel(
          labels.ordinal(rank),
          POOL_LABELS[groupIndex] ?? String(groupIndex + 1)
        )
      );
    }
  }
  return slots;
}

export function generateStandardSeeding(bracketSize: number): number[] {
  if (bracketSize === 1) return [1];
  const half = generateStandardSeeding(bracketSize / 2);
  const result: number[] = [];
  for (const seed of half) {
    result.push(seed);
    result.push(bracketSize + 1 - seed);
  }
  return result;
}

function computeDefaultSlots(
  groupCount: number,
  winnersPerGroup: number,
  labels: SlotLabels
): string[] {
  const advancingSlots = generateAdvancingSlots(
    groupCount,
    winnersPerGroup,
    labels
  );
  if (advancingSlots.length < 2) return [];

  const bracketSize = nextPowerOf2(advancingSlots.length);
  const seedOrder = generateStandardSeeding(bracketSize);
  const slots = new Array<string>(bracketSize).fill('');

  for (let position = 0; position < bracketSize; position++) {
    const seed = seedOrder[position];
    slots[position] =
      seed <= advancingSlots.length ? advancingSlots[seed - 1] : '';
  }

  return slots;
}

/**
 * Bracket-position-indexed seed labels (e.g. ["Nhất Bảng A", "Nhì Bảng B", ...])
 * honouring any configured custom seedOrder, falling back to standard seeding.
 */
export function resolveConfiguredSlots(
  category: Category,
  groupCount: number,
  winnersPerGroup: number,
  labels: SlotLabels
): string[] {
  const defaultSlots = computeDefaultSlots(groupCount, winnersPerGroup, labels);
  const config = category.formatConfig as Record<string, unknown> | undefined;
  const playoffs = config?.playoffs as Record<string, unknown> | undefined;
  const singleElimination = config?.singleElimination as
    | Record<string, unknown>
    | undefined;
  const customSlots =
    category.format === CategoryFormat.SINGLE_ELIMINATION
      ? (singleElimination?.seedOrder as string[] | undefined)
      : (playoffs?.seedOrder as string[] | undefined);

  if (!customSlots?.length) return defaultSlots;
  if (category.format === CategoryFormat.SINGLE_ELIMINATION) return customSlots;

  const validSlots = new Set(
    generateAdvancingSlots(groupCount, winnersPerGroup, labels)
  );
  const hasStaleSlot = customSlots.some(
    (slot) => slot && !validSlots.has(slot)
  );
  return hasStaleSlot || customSlots.length !== defaultSlots.length
    ? defaultSlots
    : customSlots;
}

/**
 * Resolve the display label for one side of a match, covering elimination
 * placeholders: real team name → seed slot ("Nhất Bảng A") for the first round
 * → "Winner/Loser of {match}" for later rounds. Mirrors the bracket preview so
 * shell matches read identically everywhere they appear.
 *
 * @param ctx.showPlayerNames When true, returns the joined player names of a
 *   pair registration instead of the configured pair/team name.
 */
export function resolveMatchSideLabel(
  match: CategoryMatch,
  position: 1 | 2,
  ctx: {
    allMatches: CategoryMatch[];
    category?: Category;
    labels: SlotLabels;
    showPlayerNames?: boolean;
  }
): string {
  const { allMatches, category, labels, showPlayerNames } = ctx;

  const participant = match.participants?.find((p) => p.position === position);
  if (participant?.categoryRegistration) {
    return getRegistrationLabel(participant.categoryRegistration, {
      showPlayerNames,
    });
  }

  const round = match.round.toUpperCase();
  const isElimination = round !== 'GROUP' && !match.groupId;
  if (!isElimination) return labels.tbd();

  if (round === THIRD_PLACE_ROUND) {
    const feeder = getFeederMatchNumber(match, position, allMatches);
    return feeder !== undefined ? labels.loserOf(feeder) : labels.tbd();
  }

  // Group elimination matches by round (sorted by matchNumber) to locate this
  // match's round position and decide first-round vs later-round.
  const byRound = new Map<string, CategoryMatch[]>();
  for (const m of allMatches) {
    if (m.groupId || m.round.toUpperCase() === 'GROUP') continue;
    const key = m.round.toUpperCase();
    if (!byRound.has(key)) byRound.set(key, []);
    byRound.get(key)!.push(m);
  }
  for (const list of byRound.values()) {
    list.sort((a, b) => a.matchNumber - b.matchNumber);
  }

  const mainRounds = ROUND_ORDER.filter((r) => byRound.has(r));
  const roundIndex = mainRounds.indexOf(round);

  // Later round → fed by the winner of an earlier match.
  if (roundIndex > 0) {
    const feeder = getFeederMatchNumber(match, position, allMatches);
    return feeder !== undefined ? labels.winnerOf(feeder) : labels.tbd();
  }

  // First round → seed slot label ("Nhất Bảng A"). Requires the category.
  if (!category) return labels.tbd();
  const isSingleElimination =
    category.format === CategoryFormat.SINGLE_ELIMINATION;
  const groupCount = isSingleElimination ? 1 : (category.groupCount ?? 0);
  const winnersPerGroup = isSingleElimination
    ? (category._count?.registrations ?? category.registrations?.length ?? 0)
    : (category.winnersPerGroup ?? 0);

  const slots = resolveConfiguredSlots(
    category,
    groupCount,
    winnersPerGroup,
    labels
  );
  const slotIndex =
    (byRound.get(round) ?? []).findIndex((m) => m.id === match.id) * 2 +
    (position - 1);
  if (slotIndex < 0) return labels.tbd();
  return slots[slotIndex] || labels.bye();
}
