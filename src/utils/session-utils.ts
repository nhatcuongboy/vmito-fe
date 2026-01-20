import { Player, Court, Match } from '@/lib/api/types';

/**
 * Get waiting players filtered and sorted by wait time
 */
export function getWaitingPlayers(players: Player[]): Player[] {
  return players
    .filter((player) => player.status === 'WAITING')
    .sort((a, b) => b.currentWaitTime - a.currentWaitTime);
}

/**
 * Get active courts (courts that are currently in use)
 */
export function getActiveCourts(courts: Court[]): Court[] {
  return courts
    .filter((court) => court.status === 'IN_USE')
    .map((court) => ({
      ...court,
      status: court.status as 'READY' | 'IN_USE' | 'EMPTY',
    }));
}

/**
 * Get current match for a specific court with properly typed dates
 */
export function getCurrentMatchForCourt(
  courts: Court[],
  courtId: string
): Match | null {
  const court = courts.find((c) => c.id === courtId);

  if (court?.currentMatch) {
    return {
      ...court.currentMatch,
      startTime: court.currentMatch.startTime
        ? new Date(court.currentMatch.startTime)
        : new Date(),
      endTime: court.currentMatch.endTime
        ? new Date(court.currentMatch.endTime)
        : undefined,
    };
  }

  return null;
}

/**
 * Format wait time to display in hours/minutes format
 */
export function formatWaitTime(
  waitTimeInMinutes: number,
  t: (key: string, params?: Record<string, number>) => string
): string {
  const hours = Math.floor(waitTimeInMinutes / 60);
  const minutes = waitTimeInMinutes % 60;

  if (hours > 0) {
    return t('hoursMinutes', { hours, minutes });
  }

  return t('minutesShort', { minutes });
}
