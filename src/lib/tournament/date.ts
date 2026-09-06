import type { Tournament } from '@/lib/api/types';

const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export const getVietnamDateKey = (date = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );
  return `${values.year}-${values.month}-${values.day}`;
};

export const getTournamentDateKey = (date: Date | string): string =>
  new Date(date).toISOString().slice(0, 10);

export const isTournamentExpired = (
  endDate: Date | string,
  now = new Date()
): boolean => getTournamentDateKey(endDate) < getVietnamDateKey(now);

export const isTournamentOverdue = (
  tournament: Pick<Tournament, 'status' | 'endDate'>,
  now = new Date()
): boolean =>
  tournament.status === 'IN_PROGRESS' &&
  isTournamentExpired(tournament.endDate, now);
