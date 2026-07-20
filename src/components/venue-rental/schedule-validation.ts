import type { VenueOperatingPeriod } from '@/lib/api/types';

/** Backend requires every operating period to sit on a 30-minute boundary. */
export const SLOT_MINUTES = 30;

export type ScheduleErrorKey =
  | 'endBeforeStart'
  | 'notAligned'
  | 'overlap'
  | 'emptyDay';

export const timeToMinute = (value: string) => {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
};

export const minuteToTime = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(
    minute % 60
  ).padStart(2, '0')}`;

/**
 * Mirrors the server rules in VenueCourtsService.validatePeriods so the user
 * sees which row is wrong before spending a round trip on a 400.
 *
 * Returns errors keyed by the period's index in the input array, so callers can
 * render the message against the exact row the user is editing.
 */
export const validatePeriods = (
  periods: VenueOperatingPeriod[]
): Record<number, ScheduleErrorKey> => {
  const errors: Record<number, ScheduleErrorKey> = {};

  periods.forEach((period, index) => {
    if (
      period.startMinute % SLOT_MINUTES !== 0 ||
      period.endMinute % SLOT_MINUTES !== 0
    ) {
      errors[index] = 'notAligned';
      return;
    }
    if (period.endMinute <= period.startMinute) {
      errors[index] = 'endBeforeStart';
    }
  });

  // Overlap is a property of a pair, so only flag rows that are otherwise valid.
  const byDay = new Map<number, number[]>();
  periods.forEach((period, index) => {
    if (errors[index]) return;
    const day = byDay.get(period.dayOfWeek) || [];
    day.push(index);
    byDay.set(period.dayOfWeek, day);
  });

  for (const indexes of byDay.values()) {
    const sorted = [...indexes].sort(
      (a, b) => periods[a].startMinute - periods[b].startMinute
    );
    for (let i = 1; i < sorted.length; i += 1) {
      const previous = periods[sorted[i - 1]];
      const current = periods[sorted[i]];
      if (current.startMinute < previous.endMinute) {
        errors[sorted[i]] = 'overlap';
        errors[sorted[i - 1]] = 'overlap';
      }
    }
  }

  return errors;
};

/** Days (1-7) that currently hold at least one period. */
export const daysWithPeriods = (periods: VenueOperatingPeriod[]) =>
  new Set(periods.map((period) => period.dayOfWeek));

/**
 * The backend rejects an empty `periods` array (ArrayMinSize(1)), so saving a
 * fully-cleared week is not a valid state.
 */
export const hasAnyPeriod = (periods: VenueOperatingPeriod[]) =>
  periods.length > 0;

export interface BlockDraft {
  date: string;
  start: string;
  end: string;
}

export const validateBlock = ({
  date,
  start,
  end,
}: BlockDraft): ScheduleErrorKey | null => {
  if (!date || !start || !end) return 'emptyDay';
  if (timeToMinute(end) <= timeToMinute(start)) return 'endBeforeStart';
  return null;
};
