import { CategoryMatch, CategoryRegistration } from '@/lib/api/types';

// Left-to-right order of elimination rounds (earliest → Final).
const ELIMINATION_ROUND_ORDER = ['R128', 'R64', 'R32', 'R16', 'QF', 'SF', 'F'];

/**
 * Whether both sides of a match are known real participants.
 *
 * Group matches always carry both registrations from the start. Later-round
 * elimination matches are empty shells until their feeding matches finish, so
 * they may have 0 or 1 participant ("Winner of X" placeholders). Starting or
 * scoring such a match is invalid — mirrors the backend guard in
 * categories.service.ts (assertMatchParticipantsResolved).
 */
export function areMatchParticipantsResolved(match: CategoryMatch): boolean {
  const isElimination =
    match.round?.toUpperCase() !== 'GROUP' && !match.groupId;
  if (!isElimination) return true;
  const resolved = (match.participants ?? []).filter(
    (p) => p.categoryRegistration ?? p.categoryRegistrationId
  ).length;
  return resolved >= 2;
}

/**
 * Resolve the display label for a single registration (a team/pair or an
 * individual player). Mirrors the resolution used by {@link getTeamLabel} so
 * dropdowns that pick a registration stay consistent with the match views.
 *
 * @param options.showPlayerNames When true, always join the pair members' full
 *   player names (ignoring the configured pair/team name). Useful for
 *   schedule/scoring screens where viewers want to see VĐV names.
 */
export function getRegistrationLabel(
  reg: CategoryRegistration,
  options?: { showPlayerNames?: boolean }
): string {
  if (reg.pair?.members) {
    const memberNames = reg.pair.members
      .map((m) => m.player?.name || '?')
      .join(' / ');
    if (options?.showPlayerNames) return memberNames;
    return reg.pair.name || memberNames;
  }
  return reg.player?.name || 'Unknown';
}

/**
 * Match number of the match whose winner (or loser, for the 3rd-place match)
 * feeds the given slot — i.e. the feeder that determines this participant.
 * Returns undefined when it cannot be resolved (first round, missing data).
 *
 * Relies on the standard bracket convention used when matches are generated:
 * the j-th match of a round is fed by matches 2j and 2j+1 of the previous
 * round (sorted by matchNumber); the 3rd-place match is fed by the two SF
 * losers.
 */
export function getFeederMatchNumber(
  match: CategoryMatch,
  position: number,
  allMatches: CategoryMatch[]
): number | undefined {
  const byRound = new Map<string, CategoryMatch[]>();
  for (const m of allMatches) {
    // Only consider matches from the same category — callers may pass the whole
    // tournament's matches (e.g. the schedule view), and mixing other
    // categories' rounds would corrupt the round index / feeder lookup.
    if (m.categoryId !== match.categoryId) continue;
    if (m.groupId || m.round.toUpperCase() === 'GROUP') continue;
    const round = m.round.toUpperCase();
    if (!byRound.has(round)) byRound.set(round, []);
    byRound.get(round)!.push(m);
  }
  for (const list of byRound.values()) {
    list.sort((a, b) => a.matchNumber - b.matchNumber);
  }

  const round = match.round.toUpperCase();

  if (round === '3RD') {
    const semiFinals = byRound.get('SF');
    if (!semiFinals || semiFinals.length < 2) return undefined;
    return semiFinals[position - 1]?.matchNumber;
  }

  const mainRounds = ELIMINATION_ROUND_ORDER.filter((r) => byRound.has(r));
  const roundIndex = mainRounds.indexOf(round);
  if (roundIndex <= 0) return undefined; // first round (or unknown) has no feeder

  const previousRound = byRound.get(mainRounds[roundIndex - 1]) ?? [];
  const slotIndex = (byRound.get(round) ?? []).findIndex(
    (m) => m.id === match.id
  );
  if (slotIndex === -1) return undefined;

  return previousRound[slotIndex * 2 + (position - 1)]?.matchNumber;
}

/**
 * Resolve the display label for one side (position 1 or 2) of a match.
 * Shared by the schedule, referee scoring, and public scoreboard views so the
 * name resolution stays consistent. Falls back to bracket placeholders.
 *
 * Pass `allMatches` (the category's matches) to resolve empty elimination
 * slots to the correct feeder, e.g. "Winner of 13" for the Final fed by SF 13.
 */
export function getTeamLabel(
  match: CategoryMatch,
  position: number,
  allMatches?: CategoryMatch[]
): string {
  const participant = match.participants?.find((p) => p.position === position);
  if (!participant?.categoryRegistration) {
    const round = match.round.toUpperCase();
    const isElimination = round !== 'GROUP' && !match.groupId;

    if (isElimination && allMatches) {
      const feeder = getFeederMatchNumber(match, position, allMatches);
      if (feeder !== undefined) {
        return round === '3RD' ? `Loser of ${feeder}` : `Winner of ${feeder}`;
      }
      return 'TBD';
    }

    if (round === 'SF' || round === 'F')
      return `Winner of ${match.matchNumber}`;
    if (round === '3RD') return `Loser of ${match.matchNumber}`;
    return 'TBD';
  }
  const reg = participant.categoryRegistration;
  if (reg.pair?.members) {
    return (
      reg.pair.name ||
      reg.pair.members.map((m) => m.player?.name || '?').join(' / ')
    );
  }
  return reg.player?.name || 'Unknown';
}
