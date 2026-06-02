import { CategoryMatch } from '@/lib/api/types';

/**
 * Resolve the display label for one side (position 1 or 2) of a match.
 * Shared by the schedule, referee scoring, and public scoreboard views so the
 * name resolution stays consistent. Falls back to bracket placeholders.
 */
export function getTeamLabel(match: CategoryMatch, position: number): string {
  const participant = match.participants?.find((p) => p.position === position);
  if (!participant?.categoryRegistration) {
    if (match.round === 'SF') return `Winner of ${match.matchNumber}`;
    if (match.round === 'F') return `Winner of ${match.matchNumber}`;
    if (match.round === '3RD') return `Loser of ${match.matchNumber}`;
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
