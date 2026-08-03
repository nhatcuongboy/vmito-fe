/**
 * Helper functions for time formatting and calculations
 */

import dayjs from '@/lib/dayjs';

/** Session times are venue-local (all venues are in Vietnam). Formatting them
 * in this fixed zone rather than the runtime's own zone is what keeps the
 * server-rendered HTML byte-identical to the client render — Node runs in UTC
 * in production, so `Date#getHours()` produced times 7 hours off in the first
 * paint and every card visibly jumped on hydration. */
export const SESSION_TIMEZONE = 'Asia/Ho_Chi_Minh';

export interface CourtElapsedTimeTranslations {
  lessThanMinute: string;
  oneMinute: string;
  minutes: string;
}

export const formatToHHMM = (timeStr?: string): string => {
  if (!timeStr) return '';

  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return '';

  const [, h, m] = match;
  return `${h.padStart(2, '0')}:${m}`;
};

export const parseOpeningHours = (
  openingHours?: string
): { openTime: string; closeTime: string } => {
  if (!openingHours) return { openTime: '', closeTime: '' };

  const parts = openingHours.split('-').map((part) => part.trim());
  if (parts.length !== 2) return { openTime: '', closeTime: '' };

  return {
    openTime: formatToHHMM(parts[0]),
    closeTime: formatToHHMM(parts[1]),
  };
};

export const formatOpeningHours = (
  openTime?: string,
  closeTime?: string
): string => {
  if (!openTime && !closeTime) return '';

  return `${openTime || '00:00'} - ${closeTime || '23:59'}`;
};

/**
 * Format elapsed time for court display (more readable)
 * @param startTime - The start time as string or Date
 * @param currentTime - Optional current time, defaults to new Date()
 * @param t - Translation function for internationalization
 * @param keyPrefix - Optional prefix for translation keys (e.g., "time.")
 * @returns Formatted elapsed time string
 */
export const formatCourtElapsedTime = (
  startTime: string | Date,
  currentTime: Date = new Date(),
  t: (key: string, params?: Record<string, string | number | Date>) => string,
  keyPrefix: string = ''
): string => {
  const start = new Date(startTime);
  const elapsedMs = currentTime.getTime() - start.getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60000);

  // Handle case where startTime is in the future (negative elapsed time)
  if (elapsedMinutes < 0) {
    return t(`${keyPrefix}lessThanMinute`);
  } else if (elapsedMinutes === 0) {
    return t(`${keyPrefix}lessThanMinute`);
  } else if (elapsedMinutes === 1) {
    return t(`${keyPrefix}oneMinute`);
  } else {
    return t(`${keyPrefix}minutes`, { minutes: elapsedMinutes });
  }
};

/**
 * Create a bound version of formatCourtElapsedTime for a specific translation context
 * This allows the function to be used without passing the translation function each time
 * @param t - Translation function
 * @param keyPrefix - Optional prefix for translation keys (e.g., "time.")
 * @returns A bound formatCourtElapsedTime function
 */
export const createCourtElapsedTimeFormatter = (
  t: (key: string, params?: Record<string, string | number | Date>) => string,
  keyPrefix: string = ''
) => {
  return (startTime: string | Date, currentTime: Date = new Date()): string => {
    return formatCourtElapsedTime(startTime, currentTime, t, keyPrefix);
  };
};

/**
 * Detect if device uses 24-hour or 12-hour (AM/PM) time format
 * @returns true if device uses 24-hour format, false if 12-hour format
 */
export const is24HourFormat = (): boolean => {
  if (typeof window === 'undefined') {
    // Server-side: default to 24-hour
    return true;
  }

  try {
    // Most reliable method: format a known 13:00 (1 PM) test time and check if "13" appears.
    // resolvedOptions().hour12 is not trustworthy on macOS — browsers resolve it from the
    // locale default (e.g. en-US → 12h) and may ignore the OS-level 24-hour preference.
    const testDate = new Date(2000, 0, 1, 13, 0, 0);
    const formatter = new Intl.DateTimeFormat(undefined, { hour: 'numeric' });
    const formatted = formatter.format(testDate);
    return formatted.includes('13');
  } catch (error) {
    console.warn('Error detecting time format:', error);
    // Default to 24-hour format if detection fails
    return true;
  }
};

/**
 * Format time string in 24h format (HH:mm), always — regardless of OS/locale
 * setting, and always in the venue's zone rather than the viewer's.
 * @param dateString - Time string or Date object
 * @returns Formatted time string, e.g. "20:00"
 */
export const formatTimeByDevicePreference = (
  dateString: string | Date
): string => {
  return dayjs(dateString).tz(SESSION_TIMEZONE).format('HH:mm');
};

/** Hour-of-day of a session time in the venue's zone — for time-range filters,
 * which must bucket a session the same way regardless of where it is evaluated. */
export const getSessionHour = (dateString: string | Date): number => {
  return dayjs(dateString).tz(SESSION_TIMEZONE).hour();
};

/**
 * Format a time range in 24h format (HH:mm - HH:mm), always.
 * Example: "20:00 - 22:00".
 */
export const formatTimeRangeByDevicePreference = (
  startTime: string | Date,
  endTime?: string | Date | null,
  endFallback?: string
): string => {
  const start = formatTimeByDevicePreference(startTime);
  if (!endTime) {
    return endFallback ? `${start} - ${endFallback}` : start;
  }
  return `${start} - ${formatTimeByDevicePreference(endTime)}`;
};
