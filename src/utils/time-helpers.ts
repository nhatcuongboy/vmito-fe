/**
 * Helper functions for time formatting and calculations
 */

export interface CourtElapsedTimeTranslations {
  lessThanMinute: string;
  oneMinute: string;
  minutes: string;
}

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
 * Format time string in 24h format (HH:mm), always — regardless of OS/locale setting.
 * @param dateString - Time string or Date object
 * @returns Formatted time string, e.g. "20:00"
 */
export const formatTimeByDevicePreference = (
  dateString: string | Date
): string => {
  const date = new Date(dateString);
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
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
