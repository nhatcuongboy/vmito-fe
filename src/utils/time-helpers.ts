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
    // Use Intl API to detect device's time format preference
    const formatter = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    // Format a test time (13:00) with hour12: false
    const testDate = new Date(2000, 0, 1, 13, 0, 0);
    const formatted24 = formatter.format(testDate);

    // If 24-hour format is used, it will show "13:00"
    // If 12-hour format is used, formatted12 will be different
    return formatted24.includes('13');
  } catch (error) {
    console.warn('Error detecting time format:', error);
    // Default to 24-hour format if detection fails
    return true;
  }
};

/**
 * Format time string based on device's time format preference
 * @param dateString - Time string or Date object
 * @returns Formatted time string (HH:MM or h:MM AM/PM)
 */
export const formatTimeByDevicePreference = (
  dateString: string | Date
): string => {
  const date = new Date(dateString);
  const use24Hour = is24HourFormat();

  try {
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !use24Hour,
    });
  } catch (error) {
    console.warn('Error formatting time:', error);
    // Fallback to 24-hour format
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
};
